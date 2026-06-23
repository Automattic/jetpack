# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-06-22
### Added
- Add a Canonical URLs toggle to the Settings tab that adds `rel="canonical"` tags to archive pages. [#49463]
- Add a Content tab for editing per-post SEO with a live SERP preview, Content SEO coverage card to the Overview, and front-end JSON-LD schema for articles and FAQs. [#49351]
- Add an AI tab to the SEO dashboard and move the AI SEO Enhancer toggle onto it. [#49408]
- Add Google site auto-verification to the Settings tab, with manual meta-tag entry as a fallback. [#49412]
- Show the SEO admin menu automatically on WordPress.com and fresh installs; existing installs can opt in, and the menu stays available even when the SEO Tools module is off. [#49672]
- Add a search & social previews card to the Settings tab, previewing the home page in Google results and when shared on Facebook and X. [#49592]
- Customize the title structure for all page types from the Settings tab, not just posts. [#49587]

### Changed
- Read the canonical-URLs enabled state from the durable `jetpack_seo_canonical_urls_enabled` option (falling back to the live module state when unset). [#49407]
- Read the sitemap enabled state from the durable `jetpack_seo_sitemap_enabled` option (falling back to the live module state when unset). [#49407]
- Split the SEO dashboard into per-route wp-build stages (Overview, Settings, AI) with route-based navigation. [#49628]
- Update package dependencies. [#49631] [#49691] [#49757]

### Fixed
- Persist Settings and AI tab values across tab navigation, so a saved change shows when you return to the tab without a page reload. [#49351]


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
