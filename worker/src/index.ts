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

import site from "../../src/data/site.json";
import team from "../../src/data/team.json";
import lab from "../../src/data/lab.json";
import pubs from "../../src/data/publications.json";
import news from "../../src/data/news.json";

interface Env {
  HF_TOKEN: string;
  HF_MODEL?: string;   // optional override, e.g. "HuggingFaceH4/zephyr-7b-beta"
  ALLOWED_ORIGIN?: string; // e.g. "https://mjfarooq.github.io"
  ASK_RATE: KVNamespace;   // KV namespace for per-IP rate limiting (optional)
}

function buildKnowledge(): string {
  const out: string[] = [];
  // Bio + role
  out.push(`# About ${site.name}`);
  out.push(`Role: ${site.role}, ${site.department}, ${site.institution}`);
  if (site.office) out.push(`Office: ${site.office}`);
  out.push(`Email: ${site.email}`);
  out.push("");
  out.push(`Bio: ${site.bioLong || site.bioShort}`);
  out.push("");
  out.push(`Research interests: ${(site.interests || []).join(", ")}`);
  out.push("");

  // Education + Appointments
  if (site.education) {
    out.push(`# Education`);
    for (const e of site.education) out.push(`- ${e.degree}, ${e.institution} (${e.year})`);
    out.push("");
  }
  if (site.appointments) {
    out.push(`# Appointments`);
    for (const a of site.appointments) out.push(`- ${a.role}, ${a.org} (${a.years})`);
    out.push("");
  }
  // Awards
  if (site.awards) {
    out.push(`# Honors and Awards`);
    for (const a of site.awards) out.push(`- ${a.year}: ${a.title}`);
    out.push("");
  }
  // Grants summary
  if (site.grants) {
    out.push(`# Funded Projects (${site.grants.length} grants total${site.grantsSummary ? "; " + site.grantsSummary : ""})`);
    for (const g of site.grants.slice(0, 20)) out.push(`- ${g.year}: ${g.title} (${g.sponsor}, ${g.role}${g.amount ? ", " + g.amount : ""})`);
    out.push("");
  }
  // Patents
  if ((site as any).patents) {
    out.push(`# Patents`);
    for (const p of (site as any).patents) out.push(`- ${p.filed || p.year}: ${p.title} (${p.type}; inventors: ${(p.inventors || []).join(", ")}; ${p.applicationNumber || ""})`);
    out.push("");
  }
  // Lab
  out.push(`# CyReN Lab`);
  out.push(`Full name: ${lab.fullName}`);
  out.push(`Tagline: ${lab.tagline}`);
  if (lab.intro) out.push(`About: ${lab.intro}`);
  if (lab.thrusts) {
    out.push(`Research thrusts:`);
    for (const t of lab.thrusts) out.push(`- ${t.title}: ${t.blurb}`);
  }
  out.push("");

  // Group / team
  out.push(`# Lab Members`);
  for (const m of team.members || []) {
    out.push(`- ${m.name} (${m.role}${m.focus ? "; focus: " + m.focus : ""}${m.grad ? "; graduation " + m.grad : ""})`);
    if (m.bio) out.push(`  Bio: ${m.bio}`);
    if (m.linkedin) out.push(`  LinkedIn: ${m.linkedin}`);
    if ((m as any).scholar) out.push(`  Scholar: ${(m as any).scholar}`);
  }
  if (team.alumni && team.alumni.length) {
    out.push(`Alumni:`);
    for (const a of team.alumni) out.push(`- ${a.name}${a.note ? " (" + a.note + ")" : ""}${a.grad ? ", grad " + a.grad : ""}${a.position ? ", now at " + a.position : ""}`);
  }
  if (team.interns && team.interns.length) {
    out.push(`Interns/visiting:`);
    for (const a of team.interns) out.push(`- ${a.name}${a.note ? " (" + a.note + ")" : ""}`);
  }
  if (team.undergrads && team.undergrads.length) {
    out.push(`Undergraduate researchers:`);
    for (const a of team.undergrads) out.push(`- ${a.name}`);
  }
  out.push("");

  // Publications: compact one-line each, all of them
  out.push(`# Publications (${pubs.length} total)`);
  for (const p of pubs as any[]) {
    out.push(`- [${p.year}] (${p.type}) "${p.title}" — ${p.authors_str} — ${p.venue}${p.url ? " — " + p.url : ""}`);
  }
  out.push("");

  // Recent news (top 30)
  out.push(`# Recent News and Activities`);
  for (const n of (news as any[]).slice(0, 30)) {
    out.push(`- ${n.date}: ${n.text}${n.link ? " (" + n.link + ")" : ""}`);
  }
  return out.join("\n");
}

const SITE_KNOWLEDGE = buildKnowledge();

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

    // Use the Hugging Face Inference Providers router (OpenAI-compatible chat
    // completions endpoint). This is the supported API going forward and works
    // with Mistral, Llama, Qwen, Gemma, and many other open-source models.
    const chatMessages = [
      { role: "system", content: SYSTEM_PROMPT + "\n\nUse the following site content as your source of truth. When a visitor asks about anything below, answer from this content directly rather than saying you don't know. If the question is not covered here AND is not about Junaid Farooq's research, students, publications, news, or teaching, politely decline.\n\n" + SITE_KNOWLEDGE },
      ...messages.map((m: any) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || "") })),
    ];

    const hfRes = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.HF_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: chatMessages,
        max_tokens: 512,
        temperature: 0.4,
        top_p: 0.95,
        stream: false,
      })
    });

    if (!hfRes.ok) {
      const text = await hfRes.text();
      return new Response(JSON.stringify({ reply: `Model service error (${hfRes.status}). ${text.slice(0, 300)}` }), { status: 502, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const data = await hfRes.json() as any;
    let reply: string = "";
    if (data?.choices && data.choices[0]?.message?.content) reply = data.choices[0].message.content;
    else if (Array.isArray(data) && data[0]?.generated_text) reply = data[0].generated_text;
    else if (data?.generated_text) reply = data.generated_text;
    else reply = JSON.stringify(data).slice(0, 500);

    reply = reply.replace(/^<\/?s>/g, "").trim();

    return new Response(JSON.stringify({ reply }), { headers: { ...cors, "Content-Type": "application/json" } });
  },
};
