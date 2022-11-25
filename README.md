# Remix Indie Stack

#Cloudflare worker & kv

Setup

- Create wrangler.toml

```
compatibility_date = "2022-11-17"

name = "Test"
main = "src/index.ts"

kv_namespaces = [
  { binding = "TEST", id = "12345", preview_id = "67890" }
]

```
