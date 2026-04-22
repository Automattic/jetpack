# Jetpack Search AI Answers — Roadmap

## Content Guidelines Integration

The `jp_search_behavior` CPT is a temporary holding place for site-level AI instructions. Once WordPress Content Guidelines ships as a core feature, `jp_search_behavior` will migrate to `wp_content_guidelines` and the separate CPT will be retired.

### Background

Content Guidelines is a Gutenberg experiment that provides a standard way for site owners to express how AI tools should represent their site — tone, topics, restrictions, and other behavioral instructions. By storing this in a core CPT rather than a plugin-specific one, any AI feature (search answers, editor assistant, etc.) can read the same instructions without duplication.

Relevant discussions:
- [Content guidelines for AI-generated content (original proposal)](https://github.com/WordPress/gutenberg/issues/75258)
- [Content Guidelines: a Gutenberg experiment (Make WordPress AI)](https://make.wordpress.org/ai/2026/02/03/content-guidelines-a-gutenberg-experiment/)
- [Core CPT implementation tracking](https://github.com/WordPress/gutenberg/issues/77230)
- [AI feature discoverability and shared context](https://github.com/WordPress/gutenberg/issues/75171)

### Migration plan

When `wp_content_guidelines` ships in WordPress core:

1. The AI agent on the wpcom side already reads `wp_content_guidelines` at request time if it exists for the site. No agent change needed.
2. The `jp_search_behavior` CPT registration will be removed from `class-ai-answers.php`.
3. The Behavior tab in the Search dashboard will either be retired (if core provides its own UI) or updated to write to `wp_content_guidelines` instead.
4. Sync module whitelist entries for `jp_search_behavior` will be removed; `wp_content_guidelines` sync is handled separately by the core sync surface.

Until then, both CPTs coexist: `jp_search_behavior` takes precedence if set, with `wp_content_guidelines` as a fallback (handled on the wpcom agent side).

---

## Analytics Tab

A future **Analytics** tab will be added to the Search dashboard tab bar and will become the default tab. The current Overview content (billing/usage) will remain but yield the default position to Analytics.

The Analytics tab will surface top search queries, click-through rates, and zero-result queries — with a "Create Topic" shortcut on low-CTR queries to seed the AI Answers topic library directly from real search data.

---

## Jetpack Search 3.0 (Interactivity API)

When Jetpack Search 3.0 ships (Interactivity API block platform), the AI answers feature will be extracted into a `jetpack/search-answers` block that subscribes to the shared `jetpack-search` Interactivity API store's `query` state. The HMAC token auth, CPT sync, and wpcom agent endpoint are all block-agnostic and carry forward unchanged.
