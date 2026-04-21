# Jetpack Search AI Answers — wpcom API Design

**Date**: 2026-04-21
**Status**: Approved

## Overview

A new wpcom agent (`Jetpack_Search_Answers_Agent`) registered in the wpcom AI Agent framework handles AI-powered answer generation for Jetpack Search queries. The agent accepts a search query plus optional filters, runs the search server-side (AND query first, OR fallback when AND returns zero results), and streams a synthesized answer with citations back to the browser via SSE.

No new REST endpoint needs to be created. The wpcom AI Agent framework auto-registers the endpoint at `POST /wpcom/v2/sites/{site_id}/ai/agent/jetpack-search-answers` when the agent class declares `$feature = 'jetpack-search-answers'`.

## Architecture

```
Browser (Jetpack Search Overlay)
    │  POST /wpcom/v2/sites/{site_id}/ai/agent/jetpack-search-answers
    │  Auth: JWT (logged-in) or site-level HMAC token (anonymous)
    │  Body: { query, filters, locale }
    │  Accept: text/event-stream
    ▼
wpcom AI Agent Framework  (wp-content/rest-api-plugins/endpoints/ai-agent.php)
    │  Verifies auth, resolves site_id
    │  Instantiates Jetpack_Search_Answers_Agent
    │  Drives SSE stream: StreamDelta (tokens) + Progress_Message (status)
    ▼
Jetpack_Search_Answers_Agent  (extends Agent)
    │  $feature = 'jetpack-search-answers'
    │  $supports_token_streaming = true
    │
    ├─ Ability: jetpack/search-context
    │    Runs AND query against v1.3 search API for the site
    │    Falls back to OR query if AND returns zero results
    │    Returns top 5 results as context (title, excerpt, URL)
    │
    ├─ Ability: jetpack/topic-lookup
    │    Queries synced jetpack_search_topic CPT rows in shadow replicastore
    │    Full-text match on topic title + example questions + _jstopic_keywords
    │    Returns up to 2 best-matching topic posts (full content)
    │
    └─ Prompt construction
         Reads jp_search_behavior CPT from synced shadow replicastore
         Reads wp_content_guidelines CPT if present on wpcom for this site
         System prompt: behavior instructions (incl. topic list) + content guidelines
         User prompt: query + matched topics (prepended) + search results
         Streams LLM response tokens → StreamDelta → browser
```

## Authentication

Two auth paths depending on whether the site visitor is logged in:

**Logged-in users** (wp-admin, logged-in overlay): Standard Jetpack AI JWT obtained from `/jetpack/v4/jetpack-ai-jwt`. Passed as `Authorization: Bearer {jwt}`.

**Anonymous site visitors**: A site-level hourly HMAC token generated server-side in PHP and embedded in the search overlay options:

```
hash_hmac('sha256', 'search-answers:' . $site_id . ':' . floor(time()/3600), $blog_token)
```

The token rotates every hour. wpcom accepts both the current and previous hour's token to handle clock skew at rotation boundaries. The token is scoped to this endpoint only — it grants no OAuth permissions.

wpcom validates HMAC tokens by recomputing the formula using the blog token stored in its own secrets store.

## Request / Response

**Request**
```
POST /wpcom/v2/sites/{site_id}/ai/agent/jetpack-search-answers
Content-Type: application/json
Authorization: Bearer {jwt-or-hmac-token}
Accept: text/event-stream

{
  "query": "how do I reset my password",
  "filters": {
    "post_type": ["post", "page"],
    "category": []
  },
  "locale": "en"
}
```

`filters` mirrors the filter object accepted by the v1.3 search API so the AI draws from the same result set the visitor sees.

**SSE stream events**

| Event type | Payload | Description |
|------------|---------|-------------|
| `progress` | `{"type":"progress","message":"Searching…"}` | Status updates during search and LLM ramp-up |
| `chunk` | `{"type":"chunk","text":"Here is how…"}` | Answer tokens, appended by the overlay as they arrive |
| `done` | `{"type":"done","citations":[{"title":"…","url":"…","excerpt":"…"}]}` | Stream complete; citations delivered as structured list |
| `error` | `{"type":"error","code":"quota_exceeded","message":"…"}` | Terminal error; overlay hides AI panel |

Citations are delivered on the `done` event rather than inlined in the answer text so the overlay can render them as a separate linked section.

## Search Context Ability

The `jetpack/search-context` ability runs the query against the site's Elasticsearch index via the v1.3 search API:

1. Run AND query: `GET /rest/v1.3/sites/{id}/search?query=…&operator=AND&…filters`
2. If result count is zero, run OR query: `GET /rest/v1.3/sites/{id}/search?query=…&operator=OR&…filters`
3. Return the top 5 results (title, URL, excerpt) as LLM context

The `filters` object from the original request is forwarded to both search calls so the AI only draws from content the visitor would see.

For private sites and private networks of sites, the ability uses the site's stored credentials to make an authenticated v1.3 search request.

## Topic Lookup Ability

The `jetpack/topic-lookup` ability queries `jetpack_search_topic` CPT rows in the wpcom shadow replicastore for the site. Each topic post contains a description, example questions, answer guidelines, and optionally pre-written answer content — all as free-form text in the post body. Matching runs against the topic title, the full post content (which includes the example questions), and the `_jstopic_keywords` postmeta field. Up to 2 best-matching topic posts are returned in full.

Matched topic posts are prepended to the LLM context, before search results. The system prompt instructs the agent to:

- Prefer any pre-written content in the topic post over synthesizing from search results
- Follow any guidelines in the topic post when framing the answer
- Use example questions in the topic to calibrate whether the query falls under this topic

When no topic posts match, the ability returns empty and the agent proceeds with search results only.

## Agent Prompt

**System prompt** (constructed at request time from synced data):

```
You are a helpful search assistant for {site_name}.
Answer the user's question concisely, citing only information from the provided context.
Do not invent information not present in the context.
If the context does not answer the question, say so and suggest the user browse the site.

{jp_search_behavior post content, if set}
{wp_content_guidelines post content, if present for this site on wpcom}
```

**User prompt**:

```
Question: {query}

Matched Topics:
{topic posts, if any — full post content, titled by topic name}

Search Results:
1. {title} — {url}
   {excerpt}
2. …
```

## Content Guidelines Integration

At request time the agent reads the `wp_content_guidelines` CPT (already live on wpcom, polyfilling Gutenberg [#77230](https://github.com/WordPress/gutenberg/pull/77230)) for the site if it exists. Its content is appended to the system prompt after `jp_search_behavior` instructions. No per-request client transmission is needed — the agent reads from wpcom storage directly.

When WP 7.1 ships and Content Guidelines becomes a core feature, the `jp_search_behavior` CPT on the plugin side will be migrated into `wp_content_guidelines` and the separate CPT will be retired. The agent will then read only from `wp_content_guidelines`.

## Model and Infrastructure

| Property | Value |
|----------|-------|
| Model | Default wpcom agent model (Claude 3.5 Haiku for speed; overridable via `$model`) |
| Streaming | `$supports_token_streaming = true`; uses `AI_Streaming_Service` cURL streaming |
| Timeout | 75 seconds |
| Estimated context tokens | ~1,000 (5 search results × ~200 tokens) + ~800 (up to 2 topic posts × ~400 tokens) + ~500 (system prompt) |

## Quota and Billing

Each completed request — where the SSE stream reaches a `done` event — counts as one usage unit under feature `jetpack-search-answers`. Sites on all plans, including free, receive **500 requests per calendar month**. Quota resets on the first of each month.

Usage is tracked via the existing wpcom AI feature tracking system, the same mechanism used for Jetpack AI tokens.

When the monthly limit is exceeded, the agent returns an `error` event with `code: quota_exceeded` before making any LLM call. The overlay falls back to showing standard search results with no AI panel.

## Error Handling

| Condition | Behavior |
|-----------|----------|
| Quota exceeded | `error` event (`quota_exceeded`); overlay hides AI panel silently |
| AND + OR both return zero results | Agent responds "I couldn't find relevant content"; no LLM call made |
| LLM error or timeout | `error` event (`llm_error`); overlay hides AI panel |
| Invalid or expired auth token | HTTP 401 before stream opens |
| Site not found or not Jetpack-connected | HTTP 404 before stream opens |
