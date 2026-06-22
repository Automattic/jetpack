# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-06-22
### Added
- Add a Canonical URLs toggle to the Settings tab (ports the legacy Traffic-page feature), controlling the canonical-urls module that adds rel="canonical" tags to archive pages. [#49463]
- Add a Content tab (a DataViews list of posts/pages backed by core REST, with per-post SEO editing and a SERP preview), a Content SEO coverage card on the Overview, and front-end JSON-LD schema (Article / FAQ). [#49351]
- Add an AI tab to the SEO dashboard and move the AI SEO Enhancer toggle (auto-generate SEO title, description, and image alt text for new posts) onto it. [#49408]
- Add Google site auto-verification to the Settings tab: connected sites can verify with Google through a WordPress.com keyring popup (with manual meta-tag entry as a fallback), replacing the legacy Traffic-page UI. [#49412]
- Gate the Jetpack SEO admin menu on a discoverability cohort: WordPress.com and fresh self-hosted installs see it automatically, existing installs opt in. Keeps the menu discoverable when the seo-tools module is off (with an in-app enable/disable affordance) and adds the `POST /jetpack/v4/seo/opt-in` endpoint, the `jetpack_seo_surface_visible` option, and `Initializer::is_seo_surface_visible()`. [#49672]
- SEO: add a search & social previews card to the Settings tab, showing how the home page appears in Google results and when shared on Facebook and X. [#49592]
- SEO: edit the title structure for all page types (front page, posts, pages, tags, archives) from the Settings tab, not just posts. Tokens are inserted from buttons into a text field, so literal text and separators (e.g. " | ") between tokens are preserved. [#49587]

### Changed
- Read the canonical-URLs enabled-state from the durable `jetpack_seo_canonical_urls_enabled` option (falling back to the live module state when unset) so it survives the standalone Canonical URLs module's eventual removal. [#49407]
- Read the sitemap enabled-state from the durable `jetpack_seo_sitemap_enabled` option (falling back to the live module state when unset) so it survives the standalone Sitemaps module's eventual removal. [#49407]
- Split the SEO dashboard into per-route wp-build stages (Overview, Settings, AI) with route-based navigation, replacing the single-route tab app. No user-facing change. [#49628]
- Update package dependencies. [#49631]
- Update package dependencies. [#49691]
- Update package dependencies. [#49757]

### Fixed
- SEO: persist Settings and AI tab values across tab navigation. A saved change now shows when you return to the tab without needing a page reload. [#49351]

## [0.1.1] - 2026-06-15
### Changed
- Update package dependencies. [#49273]

### Fixed
- Remove the package's duplicate snackbar list. [#49470]

## 0.1.0 - 2026-06-08
### Added
- Create an Overview screen with a Site visibility card. [#49203]
- Create a Settings screen with site visibility, post title structure, front-page description, and site verification. [#49256]
- Scaffold the new `jetpack-seo` package and mount its admin page. [#49203]

[0.2.0]: https://github.com/Automattic/jetpack-seo/compare/0.1.1...0.2.0
[0.1.1]: https://github.com/Automattic/jetpack-seo/compare/0.1.0...0.1.1
