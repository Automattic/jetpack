# Jetpack Search AI Answers — Roadmap

## Content Guidelines Integration

AI Answers already uses the Gutenberg Content Guidelines experiment (`wp_guideline` CPT) rather than a plugin-specific CPT. The feature is therefore coupled to the experiment's stability and eventual path to WordPress core.

### Current implementation

- **CPT**: `wp_guideline` (registered by Gutenberg, not by this plugin)
- **Meta key**: `_guideline_block_jetpack_search-ai-summary` (registered in `src/class-ai-answers.php`)
- **REST endpoint**: `/wp/v2/guidelines`
- **Data path**: `guideline_categories.blocks['jetpack/search-ai-summary'].guidelines`
- `class-ai-answers.php` registers the meta key on `wp_guideline` and guards with `post_type_exists('wp_guideline')` so sites without the Gutenberg experiment active get `isUnavailable: true` in the AI Answers tab
- `use-ai-answers-settings.js` reads and writes via the `/wp/v2/guidelines` REST endpoint

Relevant discussions:
- [Content guidelines for AI-generated content (original proposal)](https://github.com/WordPress/gutenberg/issues/75258)
- [Content Guidelines: a Gutenberg experiment (Make WordPress AI)](https://make.wordpress.org/ai/2026/02/03/content-guidelines-a-gutenberg-experiment/)
- [Core CPT implementation tracking](https://github.com/WordPress/gutenberg/issues/77230)
- [AI feature discoverability and shared context](https://github.com/WordPress/gutenberg/issues/75171)

### Stabilization plan

If the Gutenberg experiment **ships to core unchanged** (same CPT slug, same `guideline_categories` data structure):

1. Remove the `register_post_meta` call from `class-ai-answers.php` — core will own meta registration.
2. No REST path or data shape changes needed.
3. The AI Answers tab may be retired or simplified if core ships its own guidelines editing UI.

If the **CPT slug or data structure changes** during the experiment:

1. Update the `post_type_exists` guard and `register_post_meta` call in `class-ai-answers.php`.
2. Update `REST_BASE` in `use-ai-answers-settings.js` and the `guideline_categories` read/write paths.
3. Decide whether to migrate existing `wp_guideline` posts or start fresh.

If the **experiment is abandoned**:

1. Replace `wp_guideline` with a plugin-owned CPT (e.g. `jp_search_behavior`).
2. Register it in `class-ai-answers.php` and add it to the sync whitelist.
3. Update `use-ai-answers-settings.js` to target the new REST base.
4. Add a data migration for any sites that already saved guidelines via `wp_guideline`.

---

## Plan Eligibility

Currently the feature is gated only by the `jetpack_search_ai_answers_enabled` option with a flat 500-request/month quota for all plans. Before general availability, we need to decide:

- **Which plans get access?** Likely Search paid plans only (not free tier). The wpcom quota API already tracks usage per site; enforcement would happen there before any LLM call is made.
- **Quota tiers by plan?** Free Search could get a lower limit (or none), paid Search gets a higher limit, with the option to upgrade for more.
- **How does the plugin know the site's plan?** Options: read from the existing `jetpack_search_subscription_plan` option (or equivalent) already synced to the plugin; or gate entirely on the wpcom side and have the agent return `error` with `code: plan_not_eligible` so the overlay can show an upgrade prompt rather than silently hiding.
- **UI treatment for ineligible sites?** The Behavior and Topics tabs may still be useful to show (so site owners can configure in advance), but the overlay panel should be hidden and replaced with an upsell if the plan doesn't include AI Answers.

Open questions to resolve before GA:
- [ ] Confirm which plan tiers include AI Answers
- [ ] Define quota limits per tier
- [ ] Decide whether plan gating lives on the wpcom side only (simpler) or also in the plugin (faster UI feedback)
- [ ] Design the upgrade/upsell flow for ineligible sites

---

## Overlay CSS: Theme Compatibility

The instant-search overlay (and the AI answers panel within it) ships high-specificity hardcoded styles for colors, typography, and spacing. These override or ignore the host site's global styles, which creates two problems:

1. **Site maintainers can't easily restyle the overlay** to match their theme — overriding requires even higher specificity or `!important`.
2. **The AI answers panel looks disconnected** from the rest of the site, especially on sites with distinctive typography or color schemes.

The right fix is to audit the overlay's CSS and replace hardcoded values with CSS custom properties that have sensible defaults but can be overridden at the `:root` or theme level. Font properties (`font-family`, `font-size`) should likely `inherit` from the document rather than being set at all.

This is a whole-overlay concern, not specific to the answers panel. It should be scoped as a standalone refactor — changing the answers panel CSS in isolation would create inconsistency with the surrounding overlay.

Relevant areas: `src/instant-search/lib/styles/_variables.scss`, `src/instant-search/components/*.scss`.

---

## Analytics Tab

A future **Analytics** tab will be added to the Search dashboard tab bar and will become the default tab. The current Overview content (billing/usage) will remain but yield the default position to Analytics.

The Analytics tab will surface top search queries, click-through rates, and zero-result queries — with a "Create Topic" shortcut on low-CTR queries to seed the AI Answers topic library directly from real search data.

---

## Jetpack Search 3.0 (Interactivity API)

When Jetpack Search 3.0 ships (Interactivity API block platform), the AI answers feature will be extracted into a `jetpack/search-answers` block that subscribes to the shared `jetpack-search` Interactivity API store's `query` state. The HMAC token auth, CPT sync, and wpcom agent endpoint are all block-agnostic and carry forward unchanged.
