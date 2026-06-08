/**
 * Cloudflare Worker proxy for the site Ask AI page.
 *
 * Calls Hugging Face's free Inference API with an open-source instruct model
 * (default: mistralai/Mistral-7B-Instruct-v0.3). Injects a system prompt with
 * site context so answers are grounded in Junaid Farooq's research while still
 * helpful for general questions.
 *
 * Deploy with Wrangler (see worker/README.md). Secrets to set:
 *   wrangler secret put HF_TOKEN
 */

interface Env {
  HF_TOKEN: string;
  HF_MODEL?: string;   // optional override, e.g. "HuggingFaceH4/zephyr-7b-beta"
  ALLOWED_ORIGIN?: string; // e.g. "https://mjfarooq.github.io"
  ASK_RATE: KVNamespace;   // KV namespace for per-IP rate limiting (optional)
}

const DEFAULT_MODEL = "mistralai/Mistral-7B-Instruct-v0.3";

const SYSTEM_PROMPT = `You are an assistant for the academic website of Junaid Farooq, Associate Professor of Electrical and Computer Engineering at the University of Michigan-Dearborn, who leads the Cyber Resilient Networks (CyReN) Lab.

His research is on next-generation wireless networks (5G/6G, O-RAN), cyber resilience, zero trust security, supply chain risk, UAV networks, and AI/LLM-driven network management.

Lab members include Ph.D. researchers Yuhui Wang (UAV networks, RL), Xingqi Wu (O-RAN resource orchestration), Elahe Delavari (RL-driven O-RAN control), and D.Eng. researcher Tintu Jacob Shaji.

STRICT SCOPE: You only answer questions related to this website. That means questions about Junaid Farooq, the CyReN Lab, lab members, his publications, his research topics and methods, his teaching, his service, his news/activities, and how to navigate or use this site. You may interpret a research-topic question as being about how his work relates to that topic.

If a visitor asks something outside that scope (general factual questions, code help, opinions on unrelated subjects, current events, recipes, math problems, anything not about this site or its research), politely decline in one sentence and suggest a question they could ask about the lab or research instead. Do not attempt to answer off-topic questions even partially.

Be concise (2-4 short paragraphs unless the visitor asks for detail). When citing his work, name the venue (IEEE Networking Letters, IEEE Transactions on Mobile Computing, NDSS workshop, etc.). If you do not know something specific that should be on the site, say so honestly and point the visitor to the Publications or News pages.`;

function corsHeaders(origin: string | null, env: Env): HeadersInit {
  const allowed = env.ALLOWED_ORIGIN || "*";
  return {
    "Access-Control-Allow-Origin": allowed === "*" ? "*" : (origin && origin === allowed ? origin : allowed),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

async function rateLimit(ip: string, env: Env): Promise<boolean> {
  if (!env.ASK_RATE) return true; // no KV bound, skip rate limiting
  const key = `rl:${ip}`;
  const raw = await env.ASK_RATE.get(key);
  const now = Math.floor(Date.now() / 1000);
  let count = 0, windowStart = now;
  if (raw) {
    try { const obj = JSON.parse(raw); count = obj.count; windowStart = obj.windowStart; } catch {}
  }
  // window: 1 hour, max 20 messages
  const WINDOW = 3600, LIMIT = 20;
  if (now - windowStart > WINDOW) { count = 0; windowStart = now; }
  count += 1;
  await env.ASK_RATE.put(key, JSON.stringify({ count, windowStart }), { expirationTtl: WINDOW });
  return count <= LIMIT;
}

function buildPrompt(messages: { role: string; content: string }[]): string {
  // Mistral instruct format with system + conversation
  const out: string[] = [];
  out.push("<s>[INST] " + SYSTEM_PROMPT + "\n\n");
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (m.role === "user") {
      if (i === 0) out.push(m.content + " [/INST]");
      else out.push(" [INST] " + m.content + " [/INST]");
    } else {
      out.push(" " + m.content + "</s>");
    }
  }
  return out.join("");
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const origin = req.headers.get("Origin");
    const cors = corsHeaders(origin, env);

    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });

    const url = new URL(req.url);
    if (!url.pathname.endsWith("/chat")) return new Response("Not found", { status: 404, headers: cors });

    const ip = req.headers.get("CF-Connecting-IP") || "unknown";
    const ok = await rateLimit(ip, env);
    if (!ok) return new Response(JSON.stringify({ reply: "Rate limit reached. Try again in an hour." }), { status: 429, headers: { ...cors, "Content-Type": "application/json" } });

    let body: any;
    try { body = await req.json(); } catch { return new Response("Bad JSON", { status: 400, headers: cors }); }
    const messages = (body && Array.isArray(body.messages)) ? body.messages : [];
    if (!messages.length) return new Response(JSON.stringify({ reply: "Empty request." }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });

    const model = env.HF_MODEL || DEFAULT_MODEL;
    const prompt = buildPrompt(messages);

    const hfRes = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.HF_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { max_new_tokens: 512, temperature: 0.4, return_full_text: false, do_sample: true, top_p: 0.95 },
        options: { wait_for_model: true }
      })
    });

    if (!hfRes.ok) {
      const text = await hfRes.text();
      return new Response(JSON.stringify({ reply: `Model service error (${hfRes.status}). ${text.slice(0, 200)}` }), { status: 502, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const data = await hfRes.json() as any;
    let reply: string = "";
    if (Array.isArray(data) && data[0]?.generated_text) reply = data[0].generated_text;
    else if (data?.generated_text) reply = data.generated_text;
    else reply = JSON.stringify(data);

    reply = reply.replace(/^<\/?s>/g, "").trim();

    return new Response(JSON.stringify({ reply }), { headers: { ...cors, "Content-Type": "application/json" } });
  },
};
