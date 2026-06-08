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

Default is `mistralai/Mistral-7B-Instruct-v0.3`. To swap, edit `HF_MODEL` in `wrangler.toml`. Other free, open options:

- `HuggingFaceH4/zephyr-7b-beta`
- `mistralai/Mixtral-8x7B-Instruct-v0.1` (slower, better quality)
- `Qwen/Qwen2.5-7B-Instruct`

After changing, redeploy with `wrangler deploy`.

## Cost and limits

- Cloudflare Workers free tier: 100,000 requests/day.
- HF free Inference API: shared compute, slower under load. Suitable for low traffic.
- The Worker rate-limits each visitor to 20 messages per hour (configurable in `src/index.ts`).
