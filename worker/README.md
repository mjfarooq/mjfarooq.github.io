# Ask AI proxy (Cloudflare Worker)

A tiny Worker that answers the site's `/ask` chat using **Cloudflare Workers AI**.
Inference runs inside Cloudflare, so there is no API token to store or rotate and no
third-party inference account to keep funded.

## One-time setup

1. Create a free Cloudflare account at https://dash.cloudflare.com, then install Wrangler:

   ```
   npm install -g wrangler
   wrangler login
   ```

2. (Optional, recommended) Create a KV namespace for rate-limiting:

   ```
   cd worker
   wrangler kv namespace create ASK_RATE
   ```

   Uncomment the `[[kv_namespaces]]` block in `wrangler.toml` and paste the returned id.

3. Deploy:

   ```
   cd worker
   wrangler deploy
   ```

   The `[ai]` binding in `wrangler.toml` is all that's needed — no secrets.
   Wrangler prints the worker URL, e.g. `https://cyren-ask.yoursubdomain.workers.dev`.

## Wire the site

Open `src/pages/ask/index.astro` and replace the placeholder in `WORKER_URL` with the deployed URL plus `/chat`:

```js
define:vars={{ WORKER_URL: "https://cyren-ask.yoursubdomain.workers.dev/chat" }}
```

Commit and push. The Ask AI page is live.

## Choosing a model

You normally don't need to. The Worker walks `MODEL_CANDIDATES` in `src/index.ts` and uses
the first Workers AI model that answers, remembering it afterwards. If a model is retired or
renamed, the Worker moves to the next instead of going down.

To force one, uncomment `AI_MODEL` in `wrangler.toml`. It is tried first, and the fallback
list still applies.

Note the whole site record (~5.8k tokens of publications, news, people) is sent with every
question, so any replacement model needs a comfortable context window.

## Debugging

On failure the Worker returns a friendly `reply` plus an `error` object listing every model
it tried:

```json
{ "reply": "The assistant is temporarily offline…",
  "error": { "status": 500, "tried": ["@cf/meta/llama-3.1-8b-instruct", "…"], "detail": "…" } }
```

The `/ask` page shows only `reply` and logs `error` to the browser console (DevTools → Console).
A `402`, or wording mentioning credits or quota, means the account is out of inference
allowance — the page then says the assistant is *paused* rather than "try again shortly",
because that condition does not clear by itself.

## Cost and limits

- Cloudflare Workers free tier: 100,000 requests/day.
- Workers AI includes a free daily allowance; beyond it, usage is billed per neuron.
- The Worker rate-limits each visitor to 20 messages per hour (configurable in `src/index.ts`).
