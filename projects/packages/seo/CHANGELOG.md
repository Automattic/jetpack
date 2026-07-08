# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-07-06
### Added
- Add a collapsible Schema settings section to SEO > Settings, below Site verification, as the container for upcoming site-level schema controls. [#50071]
- Add an Organization schema settings form that persists social profiles and overrides into the site's JSON-LD. [#50111]
- Add a site-level Organization node and output schema as a multi-node @graph. [#50080]
- Add a site-level WebSite schema node with a SearchAction. [#50165]

### Changed
- Emit the site Organization schema on the home page only; posts reference it by id. [#50111]
- Update package dependencies. [#50097] [#50183]

### Fixed
- Make the SEO dashboard's Overview, Settings, and AI tabs fetch their data when the preloaded snapshot is missing or stale (with a loading state and retry), instead of failing with an "Unable to load" error. [#50027]

## [0.3.1] - 2026-06-29
### Changed
- Update package dependencies. [#49271]

## [0.3.0] - 2026-06-25
### Added
- Expose `seo.surface_visible` on the admin script data so the legacy Traffic page can hide its SEO/Sitemaps sections for sites on the new SEO experience. [#49697]

### Changed
- Gate the Settings, Content, and AI tabs behind the enable-SEO-tools card when the SEO Tools module is off. [#49844]
- Improve contrast on the SEO admin pages so content cards and the social link preview stand out. [#49874]
- Show completion rings for all four Content SEO settings instead of only schema and meta description. [#49847]
- Simplify the search/social preview cards on the SEO Settings tab. [#49846]
- Use explicit Save buttons for the SEO Settings text-heavy sections instead of auto-saving on blur. [#49845]

### Fixed
- Fix a `@wordpress/ui` 0.15 type error in the title-structure field. [#49800]
- Keep the SEO dashboard tab strip pinned while scrolling. [#49874]
- Lay out the Content SEO coverage rings in a responsive grid. [#49865]
- SEO Settings: Add a "View sitemap" link once the sitemap is generated, and disable the sitemap toggle while search engines are blocked. [#49799]
- Stop shipping megabytes of unminified JS as part of the package. [#49699]

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

[0.4.0]: https://github.com/Automattic/jetpack-seo/compare/0.3.1...0.4.0
[0.3.1]: https://github.com/Automattic/jetpack-seo/compare/0.3.0...0.3.1
[0.3.0]: https://github.com/Automattic/jetpack-seo/compare/0.2.0...0.3.0
[0.2.0]: https://github.com/Automattic/jetpack-seo/compare/0.1.1...0.2.0
[0.1.1]: https://github.com/Automattic/jetpack-seo/compare/0.1.0...0.1.1
