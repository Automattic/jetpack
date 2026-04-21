# Jetpack Search AI Answers — WordPress Plugin Design

**Date**: 2026-04-21
**Status**: Approved

## Overview

The WordPress plugin side of Jetpack Search AI Answers adds two custom post types for site-owner customization, syncs them to wpcom, embeds the auth token for anonymous visitors in the search overlay options, connects the overlay to the wpcom streaming endpoint, and provides an admin UI for managing search behavior and FAQs.

The companion spec for the wpcom API side is `2026-04-21-search-ai-answers-api-design.md`.

## Custom Post Types

### `jetpack_search_behavior`

Stores plain-language instructions for how the AI should behave when answering questions on this site. One post per site (enforced by the admin UI).

| Property | Value |
|----------|-------|
| Post title | Fixed: "Search Behavior" (unused by AI; informational only) |
| Post content | Site owner's plain-language instructions for the AI |
| Visibility | Private — not publicly queryable |
| Editor | Block editor (free-form text) |
| Instances | One per site — admin UI prevents creating a second |
| Sync | Yes — synced to wpcom via Search sync module |
| Future migration | Will migrate to `wp_content_guidelines` CPT when WP 7.1 ships |

Example content: "Focus on product-related questions only. Always recommend contacting support if the visitor seems frustrated."

### `jetpack_search_faq`

Stores FAQ entries. Each post represents one question–answer pair.

| Property | Value |
|----------|-------|
| Post title | The question (e.g., "How do I reset my password?") |
| Post content | The answer (block editor; may include links and formatting) |
| `_jsfaq_keywords` | CSV of extra match keywords shown in the editor sidebar |
| `_jsfaq_url` | Canonical URL for this FAQ entry shown in the editor sidebar |
| Visibility | Private — not publicly queryable |
| Instances | Multiple per site |
| Sync | Yes — synced to wpcom via Search sync module |

No custom taxonomy on either CPT.

## Sync

Both CPTs are registered in **`Automattic\Jetpack\Sync\Modules\Search`** (`src/modules/class-search.php`), and only when Jetpack Search is active. Using the Search module (rather than the Posts module) ensures the CPTs are only synced for sites with Search enabled and keeps the sync surface clearly tied to Search functionality.

```php
// In class-search.php set_defaults() or equivalent hook setup:
if ( $this->is_search_enabled() ) {
    add_filter( 'jetpack_sync_post_types_whitelist', array( $this, 'add_ai_answer_cpts' ) );
    add_filter( 'jetpack_sync_post_meta_whitelist', array( $this, 'add_ai_answer_meta' ) );
}

public function add_ai_answer_cpts( $post_types ) {
    $post_types[] = 'jetpack_search_behavior';
    $post_types[] = 'jetpack_search_faq';
    return $post_types;
}

public function add_ai_answer_meta( $meta_keys ) {
    $meta_keys[] = '_jsfaq_keywords';
    $meta_keys[] = '_jsfaq_url';
    return $meta_keys;
}
```

**Important**: whitelisting here controls what is *sent* to wpcom. For synced data to be *stored* in the shadow replicastore, the same CPTs and meta keys must also be whitelisted on the wpcom side.

## Authentication — Site-Level HMAC Token

Anonymous site visitors (not logged in to WordPress) need to reach the wpcom AI agent endpoint without a user JWT. A site-level hourly HMAC token is generated server-side in PHP and embedded in `JetpackInstantSearchOptions`:

```php
$blog_token = Automattic\Jetpack\Connection\Tokens::get_blog_token();
$site_id    = Jetpack_Options::get_option( 'id' );
$ai_token   = hash_hmac(
    'sha256',
    'search-answers:' . $site_id . ':' . floor( time() / 3600 ),
    $blog_token->secret
);
```

This token is added to `JetpackInstantSearchOptions.aiAnswersToken`. It rotates every hour; wpcom accepts both the current and previous hour's token to handle clock skew at rotation boundaries.

Logged-in users use the standard Jetpack AI JWT from `/jetpack/v4/jetpack-ai-jwt` instead. The overlay checks whether a JWT is available; if so, it uses that in preference to the HMAC token.

## Search Overlay Integration

A new `answers-panel.jsx` component is added to `src/instant-search/components/`. It renders above the search results list when in `streaming` or `done` state.

### Component States

| State | Display |
|-------|---------|
| `idle` | Nothing rendered |
| `loading` | Spinner with "Finding an answer…" label |
| `streaming` | Partial answer text; tokens appended as they arrive |
| `done` | Full answer text + citation list below |
| `error` | Component hidden; standard search results shown normally |

### Triggering the AI Request

The AI request fires when the search query changes and is at least 3 characters long, debounced by 400 ms (matching the existing search input debounce). If a new query arrives while a stream is open, the active stream is aborted before starting a new one.

### SSE Connection

The overlay calls the wpcom SSE endpoint directly from the browser using `SuggestionsEventSource` from `@automattic/jetpack-ai-client`:

```js
const source = new SuggestionsEventSource(
    `https://public-api.wordpress.com/wpcom/v2/sites/${ siteId }/ai/agent/jetpack-search-answers`,
    {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${ jwtToken || aiAnswersToken }`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify( { query, filters, locale } ),
    }
);
source.addEventListener( 'chunk', ( e ) => appendToken( e.data ) );
source.addEventListener( 'done',  ( e ) => showCitations( e.data ) );
source.addEventListener( 'error', ()    => hidePanel() );
```

`filters` is assembled from the current overlay filter state (post type, category, tag selections) — the same values passed to the v1.3 search call — so the AI draws from the same result set the visitor sees.

## Feature Flag

`jetpack_search_ai_answers_enabled` gates the entire AI answers feature:

```php
apply_filters( 'jetpack_search_ai_answers_enabled', get_option( 'jetpack_search_ai_answers_enabled', false ) );
```

When `false`:
- Admin UI section is hidden
- `aiAnswersToken` is not embedded in overlay options
- `answers-panel.jsx` renders nothing; no SSE connections are made

## Admin UI

A new **"AI Answers"** section appears in the Jetpack Search settings page (`Settings > Jetpack Search > AI Answers`) when the feature flag is enabled.

### Behavior Tab

Block editor view of the single `jetpack_search_behavior` post. Descriptive text above the editor:

> "Describe how the AI should respond to visitor questions. These instructions are sent to the AI along with every search query."
> Example: "Focus on product-related questions only. Always recommend contacting support if the visitor seems frustrated."

Saving auto-publishes (or updates) the behavior post. The admin UI ensures only one behavior post exists.

### FAQ Tab

Standard WP list table showing all `jetpack_search_faq` posts with columns: Question, Keywords, Last Modified. Row actions: Edit (opens post editor), Delete.

"Add FAQ" button opens the block editor for a new `jetpack_search_faq` post. The editor sidebar panel exposes the `_jsfaq_keywords` and `_jsfaq_url` fields.

**Suggested FAQs sub-tab**: Shows top search queries with high volume and low click-through rate drawn from search analytics (via wpcom search analytics API). Each suggestion shows the query string and query count, with a "Create FAQ" button that pre-populates the FAQ editor with the query as the post title.

### Status Bar

Displays current-month AI request count versus the 500-request monthly limit, pulled from the wpcom quota API. When usage approaches or exceeds the limit, a callout is shown with an upgrade link.

## Future: Interactivity API Block

When Jetpack Search 3.0 (Interactivity API block platform, PR #48155) ships, the AI answers feature will be extracted into a `jetpack/search-answers` block that subscribes to the shared `jetpack-search` Interactivity API store's `query` state and renders the answers panel inline within the block-based search UI.

The HMAC token auth, CPT sync, and wpcom agent endpoint designed here are all block-agnostic and carry forward unchanged into that implementation.
