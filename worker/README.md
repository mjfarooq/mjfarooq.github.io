# Ask AI proxy (Cloudflare Worker)

A tiny Worker that proxies the site's `/ask` chat to an open-source LLM on Hugging Face's free Inference API.

## One-time setup

1. Create a free Hugging Face account at https://huggingface.co and generate a read-only **User Access Token** (Settings → Access Tokens). Copy it.

2. Create a free Cloudflare account at https://dash.cloudflare.com. Install Wrangler if not already installed:

   ```
   npm install -g wrangler
   wrangler login
   ```

3. From the `worker/` directory, set the HF token as a Worker secret:

   ```
   cd worker
   wrangler secret put HF_TOKEN
   ```

   Paste your HF token when prompted.

4. (Optional, recommended) Create a KV namespace for rate-limiting and add it to `wrangler.toml`:

   ```
   wrangler kv namespace create ASK_RATE
   ```

   Uncomment the `[[kv_namespaces]]` block in `wrangler.toml` and paste the returned id.

5. Deploy:

   ```
   wrangler deploy
   ```

   Wrangler prints the worker URL, e.g. `https://cyren-ask.yoursubdomain.workers.dev`.

## Wire the site

Open `src/pages/ask/index.astro` and replace the placeholder in `WORKER_URL` with the deployed URL plus `/chat`:

```js
define:vars={{ WORKER_URL: "https://cyren-ask.yoursubdomain.workers.dev/chat" }}
```

Commit and push. The Ask AI page is live.

## Choosing a model

You normally don't need to. The Worker walks the `MODEL_CANDIDATES` list in `src/index.ts` and
uses the first model your enabled inference providers actually serve, remembering it afterwards.
If a model is dropped or moved behind a dedicated endpoint, the Worker moves to the next one
instead of going down.

To force a specific model, uncomment `HF_MODEL` in `wrangler.toml`. It is tried first, and the
fallback list still applies if it is unavailable.

**Providers must be enabled** for any of this to work: https://huggingface.co/settings/inference-providers
With none enabled, every candidate fails and `/ask` shows the offline message.

Note that a provider may silently remap a model id to its own variant — Together, for example,
resolves `Qwen/Qwen2.5-7B-Instruct` to `Qwen2.5-7B-Instruct-Turbo`, which needs a paid dedicated
endpoint. The Worker treats that as "unavailable" and moves on.

After changing anything here, redeploy with `wrangler deploy`.

## Debugging

On failure the Worker returns a friendly `reply` plus an `error` object listing every model it
tried:

```json
{ "reply": "The assistant is temporarily offline…",
  "error": { "status": 400, "tried": ["meta-llama/Llama-3.3-70B-Instruct", "…"], "detail": "…" } }
```

The `/ask` page shows only `reply` and logs `error` to the browser console (DevTools → Console).

## Cost and limits

- Cloudflare Workers free tier: 100,000 requests/day.
- HF free Inference API: shared compute, slower under load. Suitable for low traffic.
- The Worker rate-limits each visitor to 20 messages per hour (configurable in `src/index.ts`).
