# Jetpack Search AI Answers — wpcom API

## Endpoint

```
POST /wpcom/v2/ai/agent/jetpack-search-answers
Authorization: Bearer {jwt-or-hmac-token}
Accept: text/event-stream
Content-Type: application/json
```

## Authentication

Two auth paths:

**Anonymous site visitors**: A site-level hourly HMAC token generated server-side in PHP and embedded in `JetpackInstantSearchOptions.aiAnswersToken`:

```
hash_hmac('sha256', 'search-answers:' . $site_id . ':' . floor(time()/3600), $blog_token_secret)
```

Rotates hourly; wpcom accepts both the current and previous hour's token to handle clock skew.

**Logged-in users**: Standard Jetpack AI JWT from `/jetpack/v4/jetpack-ai-jwt`.

## Request Format

JSON-RPC 2.0 with `message/stream` method. The search query goes in the `text` part; site context (site ID, active filters, locale) goes in the `data` part:

```json
{
  "jsonrpc": "2.0",
  "id": "req-1",
  "method": "message/stream",
  "params": {
    "message": {
      "role": "user",
      "parts": [
        { "type": "text", "text": "how do I reset my password" },
        {
          "type": "data",
          "data": {
            "clientContext": {
              "selectedSiteId": 12345,
              "filters": { "post_type": ["post", "page"], "category": [] },
              "locale": "en"
            }
          },
          "metadata": {}
        }
      ],
      "kind": "message",
      "messageId": "msg-1"
    }
  },
  "tokenStreaming": true
}
```

## SSE Response Events

| Event   | Payload | Description |
|---------|---------|-------------|
| `chunk` | `{"type":"chunk","text":"…"}` | Answer tokens, appended as they arrive |
| `done`  | `{"type":"done","citations":[{"title":"…","url":"…","excerpt":"…"}]}` | Stream complete; citations as structured list |
| `error` | `{"type":"error","code":"quota_exceeded","message":"…"}` | Terminal error; overlay hides AI panel |

## Quota

500 requests per calendar month per site (all plans). Returns `error` with `code: quota_exceeded` when exceeded; overlay falls back to standard search results.
