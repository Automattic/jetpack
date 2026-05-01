# Exploration: embedded search returns 404 on refresh (RSM-1754)

> **Status:** Exploration only — no production fix applied. This document
> captures the root cause, reproduction notes, and trade-offs between
> candidate fixes so we can decide on a direction in a follow-up PR.

## Problem statement

When the Jetpack Search 3.0 search-input block (or the "Compact Search" /
"Blog Search Page" pattern) is inserted into a non-search page, e.g.
`/about/`, typing in the input and pressing Enter works — JS keeps the
URL on `/about/?s=react` and re-renders results inline via the
Interactivity API store.

But once the user **refreshes** that URL, WordPress returns a 404
instead of rendering the page (or the inline search results).

Reproduction is on `pixelantics.jetpack.ngrok.app/about/?s=react`
(`peKye1-1Z1-p2`).

## Root cause

WordPress treats a URL like `/about/?s=react` as a request for a single
page that **also** carries a search query. Internally:

1. `WP::parse_request()` resolves the rewrite rule for `/about/` and
   sets `pagename=about`. It also sees `?s=react` in `$_GET` and
   queues `s=react` as a query var.
2. `WP_Query::get_posts()` runs with both:
   - `is_singular() === true` (because `pagename=about` was matched), and
   - `is_search() === true` (because `s` is set).
3. The MySQL query that core builds for that combined state is
   essentially "page named `about` whose post_content matches
   `react`". For the typical case (the page doesn't contain the
   word "react"), the resulting `$posts` is empty.
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

## Reproduction (without docker)

The 404 path can be exercised with WP core's bundled tests, but the
shortest repro that matches the user-reported flow is:

```
1. On a Search-3.0-enabled site, edit the `/about/` page and insert
   the `jetpack/search-input` block (or the Compact Search pattern).
2. Visit `/about/`.
3. Type "react" in the search input and press Enter. Results render
   inline; URL becomes `/about/?s=react`.
4. Refresh the browser tab. The site returns the theme's 404 page.
```

A code-only repro (no docker required) is documented in the prototype
patch in this directory under `prototype-singular-search-guard.diff`.

## Why this is specific to the embedded surface

The historic Jetpack Search behaviour ("classic" or "instant") is
either:

- The user clicks a search input that submits to `/?s=react` — a
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
  it does on `/?s=react`.
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
The Interactivity store reads `s` out of `$_GET` directly (via
`get_search_query()` / `$_GET['s']`), so the inline experience
would still run. The page would resolve normally.

* **Pro:** Smallest change. The `/about/` page renders normally
  with its content **and** the inline search blocks, which is
  arguably what most authors want when they drop a search input
  on a content page.
* **Pro:** No template-routing changes — Site Editor customizations
  still apply.
* **Con:** Requires the page itself to contain the search blocks
  (otherwise we just suppressed `s` and rendered a normal page with
  no search UI). We'd want to gate this on "the post contains a
  jetpack/search-* block" so we don't strip `s` from arbitrary
  singular requests on pages that just happen to carry the param.
* **Con:** `get_search_query()` would still return "react" (because
  WP only nulls `s` after the query runs, and we strip it pre-query
  anyway), so seeded state is fine; but `body_class()` would no
  longer include `search` and themes that style search differently
  would lose those rules.

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

## Recommendation

**Option B** is the smallest behavioural change and most closely matches
how the search-input block is documented to work ("drop it anywhere; it
filters the inline result list"). The gate ("does the resolved post
contain any `jetpack/search-*` block?") fits with the existing
`Search_Blocks::collect_filter_configs_from_post()` walker — we can
factor out a single "does this post host search blocks?" predicate and
use it in both places.

If we want the "refreshing keeps you on the search-results page"
mental model from Option C, that's a follow-up: the prerequisite is
still suppressing the singular 404 path, which Option B does.

## Prototype patch

A minimal, reviewable spike of Option B is in
`prototype-singular-search-guard.diff` next to this file.

It:

1. Adds a `Search_Blocks::post_hosts_search_blocks()` helper (factored
   out of `collect_filter_configs_from_post()`).
2. Adds a `pre_get_posts` filter that, on the main frontend search
   query, when `is_singular()` and the resolved post hosts any
   `jetpack/search-*` block, removes the `s` query var from the
   `WP_Query`. The Interactivity store still reads `?s=` from
   `$_GET` for state seeding.

The diff is shown unapplied so reviewers can compare. Tests, lint,
and changelog entries are intentionally not included — those belong
in the implementation PR once a direction is chosen.

## Open questions for the implementation PR

- Do we want the **page content with the inline search** to render
  (Option B), or the **search results template** to take over
  `/about/` on refresh (Options A/C)? Both are defensible; Option B
  preserves the page's own custom layout, Options A/C preserve
  the user's "I'm on a search page" mental model.
- After Option B sets `s=''` on the WP_Query, `WP_Query::is_search()`
  flips to `false` and `Inline_Search::filter__posts_pre_query()`
  no longer fires. That's intentional — the page itself runs as a
  normal singular request, and the inline-search blocks fetch
  results client-side via the REST API. Confirm this matches the
  behaviour we want during implementation.
- Should we also seed Interactivity API state on `is_singular` pages
  that host search blocks today? `Search_Blocks::seed_interactivity_state()`
  fires on `wp_enqueue_scripts` for every front-end request, so seeding
  already happens — but `parse_url_filters()` etc. read from `$_GET`,
  which is preserved. Worth re-confirming during implementation.
- Is the bug also reproducible with `/?s=react` on a site whose
  homepage is a static page? (Same `is_singular() && is_search()`
  collision could apply.) Worth covering with a regression test
  in the implementation PR.
- Does `post_hosts_search_blocks()` need to walk **template parts**
  the way the Site Editor renders them? The current `Search_Blocks::
  collect_filter_configs_from_post()` walker explicitly does not (see
  its docblock). For the 404 guard we only need the predicate to fire
  when a search-input block is actually present on the post — if a
  user dropped one in a template part instead of the post content,
  `/about/?s=react` would still 404 with this prototype. Need to
  decide whether to extend the walker or accept the gap.
