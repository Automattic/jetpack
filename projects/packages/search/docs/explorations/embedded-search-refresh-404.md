# Exploration: embedded search returns 404 on refresh (RSM-1754)

> **Status:** Implemented — Option E (use a non-`s` URL key off the search
> route) is now live. See `Search_Blocks::get_search_param_name()` and the
> `searchParamName` field on the seeded Interactivity state in
> `src/search-blocks/class-search-blocks.php`. This document is kept for
> the design rationale and for reviewers comparing alternatives.

## Problem statement

When the Jetpack Search 3.0 search-input block (or the "Compact Search" /
"Blog Search Page" pattern) is inserted into a non-search page, e.g.
`/about/`, typing in the input and pressing Enter works — JS keeps the
URL on `/about/?s=boots` and re-renders results inline via the
Interactivity API store.

But once the user **refreshes** that URL, WordPress returns a 404
instead of rendering the page (or the inline search results).

Reproduction is on `pixelantics.jetpack.ngrok.app/about/?s=react`
(`peKye1-1Z1-p2`).

## Root cause

WordPress treats a URL like `/about/?s=boots` as a request for a single
page that **also** carries a search query. Internally:

1. `WP::parse_request()` resolves the rewrite rule for `/about/` and
   sets `pagename=about`. It also sees `?s=boots` in `$_GET` and
   queues `s=boots` as a query var.
2. `WP_Query::parse_query()` resolves the query as singular
   (`is_page === true`, `is_singular() === true`) because `pagename` is
   set. *Despite `s` being non-empty, `is_search` stays false* — the
   `is_search = true` branch only fires in the archive `else` arm of
   `parse_query()` (see `class-wp-query.php`, the `if ( isset(
   $this->query['s'] ) )` block ~L894).
3. `WP_Query::get_posts()` still adds the search WHERE clause whenever
   `strlen( $query_vars['s'] ) > 0` (see `class-wp-query.php` ~L2278),
   regardless of `is_search`. The MySQL query that core builds for
   that combined state is essentially "page named `about` whose
   post_content matches `boots`". For the typical case (the page
   doesn't contain the word "boots"), the resulting `$posts` is empty.
4. `WP::handle_404()` then sees a singular request with an empty
   `$posts` and sets a 404, which is what the visitor sees.

`Inline_Search::filter__posts_pre_query()` (and the broader
`should_handle_query()` gate it inherits from `Classic_Search`) only
intervenes when **`$query->is_search()` AND `$query->is_main_query()`**
are both true — but the singular page query that core dispatches
*also* satisfies both, so the search hook fires. However:

- The Search 3.0 frontend assumes the request resolved to the
  registered `jetpack-search` template (which is only prepended to
  `search_template_hierarchy`, never `page_template_hierarchy`), so
  the page never renders the search-results / no-results / etc.
  blocks even on a successful API hit.
- Worse: `set_404()` runs before the Interactivity-API store ever
  hydrates, so the user lands on the theme's 404 template before
  any JS gets a chance to fetch results.

Net effect: the inline search experience only "works" until the next
refresh, exactly as the bug report describes.

## Why this is specific to the embedded surface

The historic Jetpack Search behaviour ("classic" or "instant") is
either:

- The user clicks a search input that submits to `/?s=boots` — a
  bare search route, where `is_singular()` is false and the 404
  pathway never trips. ✓
- Or the modal Instant Search overlay is rendered on the page; it
  intercepts navigation client-side and never relies on a refresh
  resolving to the same URL. ✓

The Search 3.0 inline experience is the first surface where a user
can land on a singular permalink (`/about/`) **with** an `s` query
var in the URL after a hard refresh. Hence the regression only
shows up here.

## Candidate fixes

Each of these is plausible; trade-offs are noted so we can pick one
in the implementation PR.

### Option A — strip `pagename` / `name` when `s` is set on a frontend page request

In a `parse_request` filter (or `pre_get_posts` for the main query),
detect the `is_search() && (is_page() || is_singular())` collision and
mutate the request so it resolves as a pure search query
(`pagename=''`, `name=''`, `is_singular=false`, `is_singular=false`).

* **Pro:** WordPress then routes the request through
  `search_template_hierarchy`, our prepended
  `jetpack-search` template wins, and inline search renders just like
  it does on `/?s=boots`.
* **Con:** It changes the URL-to-template contract for *any* search
  on a singular permalink, even on sites that haven't enabled
  Search 3.0 blocks. Need to gate the rewrite on either
  `jetpack_search_blocks_enabled` **or** the presence of a Jetpack
  Search block on the resolved post.
* **Con:** Loses the breadcrumb that "the user searched from the
  /about/ page" if we ever want a "Back to About" affordance. Could
  preserve it in a query var if we needed to.

### Option B — keep singular routing, but suppress the WP search WHERE clause

In `pre_get_posts`, when we detect the same collision, leave
`pagename` alone but unset the `s` query var on the WP_Query so
core doesn't AND a `post_content LIKE` filter into the page lookup.
The Interactivity store reads `s` out of `$_GET` directly, so the
inline experience would still run; the page would resolve normally.

* **Pro:** The `/about/` page renders normally with its content
  **and** the inline search blocks, which is arguably what most
  authors want when they drop a search input on a content page.
* **Pro:** No template-routing changes — Site Editor customizations
  still apply.
* **Con:** Requires the page itself to contain the search blocks
  (otherwise we just suppressed `s` and rendered a normal page with
  no search UI). We'd want to gate this on "the post contains a
  jetpack/search-* block" so we don't strip `s` from arbitrary
  singular requests on pages that just happen to carry the param.
  That gate needs a block-tree walker that runs at `pre_get_posts`
  time on every front-end request.
* **Con:** Walker has to either re-implement post-resolution from
  query vars (it can't read `get_post()` at `pre_get_posts` time),
  or be deferred to `wp` / `template_redirect` — by which point
  `WP::handle_404()` has already fired.

### Option C — render the search template instead of the page when both apply

In `template_include` (or `template_redirect` + `set_404( false )`
+ `is_singular( false )`), when the same collision is detected,
short-circuit to the `jetpack-search` block template content.

* **Pro:** Keeps the user's mental model: "if I have an `?s=` in the
  URL, I'm on a search page" — independent of which permalink they
  refreshed.
* **Con:** Requires a route that produces the same output regardless
  of the original page. Doesn't preserve the page-specific
  search-blocks layout if the author put a custom one on
  `/about/`.

### Option D — don't expose the search-input block on non-search pages

A documentation/UX-only response: tell users the inline search only
works on the search page, and prevent insertion elsewhere via
`supports.inserter` gating.

* **Pro:** No PHP routing changes.
* **Con:** Contradicts the design intent of Search 3.0 (the
  "inline anywhere" pitch on the radicalupdates p2 announcement).

### Option E — never write `?s=` from inline blocks on non-search pages

The blocks are the only thing producing `/about/?s=boots` in the
first place — the user types in our `<input>` and our JS pushes
the URL. So have the JS push `/about/?q=boots` instead and
read from `$_GET['q']` on first paint. WP_Query never sees
`s`, so core's `WP_Query::get_posts()` `LIKE` clause never fires
and the singular 404 path is never reached.

* **Pro:** Smallest implementation. No `pre_get_posts` hook, no
  block-tree walker, no post-from-query-vars resolution. The
  Interactivity store is already the single source of truth for
  every URL push the inline experience makes; we just toggle the
  key it writes under based on `is_search()`.
* **Pro:** The page renders via its normal singular template,
  including custom layouts and Site Editor customizations.
  `body_class()` reflects the actual route (singular, not search),
  so theme styles for content pages still apply.
* **Pro:** Composable with the search route — when the same blocks
  render on the `/?s=boots` route (e.g. the Jetpack Search template
  or a theme's `search.html`), they continue using `s` and stay
  interoperable with browser history, bookmarks, and other
  WordPress code keyed off the canonical search query.
* **Con:** A pre-existing shared link of shape `/about/?s=boots`
  (e.g. one a user generated with a previous build of these blocks,
  or copy-pasted from the address bar) still 404s on refresh. We
  no longer try to override that — it's pure WP behaviour now. The
  inline search itself never produces that URL again.
* **Con:** Two URL key names exist for the same logical "search
  query" parameter. Tooling that scrapes search terms from access
  logs (analytics, marketing tags) needs to know about both. The
  RESERVED_PARAMS allow-list on both PHP and JS sides ensures
  neither name leaks into `activeFilters`.

## Recommendation

**Option E** ships the smallest amount of code and removes an entire
class of edge cases (nested template parts, reusable blocks, posts
that *could* host search blocks but don't yet). The pre-existing
shared-link case is the only behaviour we give up — and that case
is a pure WP feature, not a Search 3.0 promise.

If we ever do want the "refreshing keeps you on the search-results
page" mental model from Option C, it's still a future follow-up:
shipping Option E doesn't preclude it.

## Implementation notes

Option E ships as one helper plus a thread-through on both the PHP
seed and the JS store:

1. `Search_Blocks::get_search_param_name()` returns `'s'` when
   `is_search()` is true and `Search_Blocks::NON_SEARCH_QUERY_PARAM`
   (`'q'`) otherwise.
2. `Search_Blocks::build_initial_state()` reads the URL through
   that helper and exposes the active key as `searchParamName` on
   the seeded Interactivity state.
3. `search-input/render.php` reads `$_GET[ $search_param ]` through
   the same helper for its initial `value`.
4. `store/index.js` threads `state.searchParamName` into
   `pushStateToUrl()` (debounced search, sort, filter changes) and
   `readStateFromUrl()` (popstate handler) so subsequent URL writes
   stay on whichever key the seed picked.
5. Both `Search_Blocks::RESERVED_QUERY_PARAMS` and
   `RESERVED_PARAMS` in `store/url-state.js` include both `s` and
   `q` so neither name can be misread as a filter key.
