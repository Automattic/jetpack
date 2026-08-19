# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.1] - 2026-08-10
### Changed
- Update package dependencies. [#50509]

## [0.8.0] - 2026-08-03
### Changed
- Add icon chips and completion statuses to each Settings module, clarify the help text, and preview the title every page type produces. [#50883]
- Allow Jetpack SEO to be enabled per site through a WordPress.com feature flag. [#50899]
- Combine the Breadcrumbs, Organization, and Local business settings into one Schema module with a single Save button, and clarify their labels and help text. [#50918]
- Move the option to turn off SEO tools into an Advanced section at the bottom of Settings, with an explanation of what stops when you do. [#50947]
- Refresh the GEO tab: an icon chip on every module title, headings you can navigate to, an explanation of what GEO means, and clearer state tags. [#50913]
- Rewrite the SEO page subtitle around what the tools do for you, and sharpen the Overview cards: shorter Site visibility, a globe icon on both Site verification cards, llms.txt reported alongside AI access, and only the verification services most sites use. [#50934]
- Polish the Overview tab — card-title icons, primary action buttons, and interactive coverage rings that deep-link to the Content tab filtered to the posts still missing that field. [#50842]
- Settings: Make text styles consistent across modules, so descriptions are easier to read and every field label looks the same. [#50953]
- Show save toasts in the top-right, matching the rest of Jetpack, and render the title-structure preview with its parts as chips so the shape of the title is legible. [#50972]

### Fixed
- Keep the Schema module's completion status accurate when a name or description field contains only spaces. [#50944]
- Preserve SEO settings and keep dashboard previews and verification states aligned with site output. [#50808]
- Return the Breadcrumbs toggle in Schema settings to its previous position when the save fails, instead of leaving it showing a change that was not saved. [#50918]
- Fix the sitemap control in Settings — show the View sitemap link as soon as the sitemap is enabled instead of getting stuck on "Generating…", and make turning it off remove the site's sitemap entirely (a proper 404) rather than falling back to WordPress core's. [#50880]

## [0.7.0] - 2026-07-27
### Added
- Add AI crawler management — free per-bot allow/block toggles (answer and mixed-use crawlers allowed, training crawlers blocked by default) that write robots.txt directives. [#50186]
- Add custom post type support and llms.txt generation. [#50185]
- Gate the dashboard to a free subset (Overview + Settings visibility/verification) with an upsell banner on below-Premium WordPress.com sites, and stop serving llms.txt and AI-crawler robots.txt directives there; self-hosted is never gated. Behind the `rsm_jetpack_seo` feature flag. [#50546]

### Changed
- Rename the AI dashboard tab to GEO (Generative Engine Optimization). [#50512]
- Simplify the AI crawler controls to two groups, label each crawler by its robots.txt token, and keep the controls visible-but-disabled (with a link to the setting) when third-party sharing is off. [#50186]
- Use the site's real name and tagline in the title-structure preview instead of placeholder samples. [#50182]
- Split the `Initializer` class into `Admin_Page`, `Content_Coverage`, `Dashboard_Data` and `Surface_Visibility`. [#50571]

### Fixed
- Hide the "Disable SEO tools" option on WordPress.com Simple sites, where SEO tools are always active and cannot be disabled. [#50184]

## [0.6.0] - 2026-07-20
### Added
- Add configurable BreadcrumbList schema across supported site pages. [#50499]
- Add LocalBusiness details to the site Organization schema, with settings and a local-business toggle. [#50363]

### Changed
- Improve the organization and local business schema settings layout. [#50541]
- Update package dependencies. [#50510] [#50529]

### Fixed
- Content tab: Make the search box match titles, SEO titles and meta descriptions instead of returning no results. [#50411]
- Content tab: Page through posts and pages instead of silently capping the list at 100 of each. [#50411]
- Fix the FAQ schema so FAQPage JSON-LD emits from editor-saved Details blocks. [#50565]
- Overview: Cache the content-coverage counts and compute them in a single query. [#50508]

## [0.5.0] - 2026-07-13
### Added
- Add Person and ProfilePage structured data for authors, with an author profile form in the Schema settings. [#50225]

### Changed
- Update package dependencies. [#49272]
- Update WPDS design tokens to the @wordpress/theme 0.16/0.17 names (see https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/CHANGELOG.md#0160-2026-06-24 ). [#49272]

### Fixed
- Clarify Google site verification actions and configured-code labels. [#50227]
- Content tab: Rename the row action column from "Actions" to "Edit SEO". [#50332]
- Inspector: Report failed saves, block saving over unloaded meta, and keep edits scoped to their post. [#50319]
- Validate schema profile URLs without DNS lookups, so front-end rendering never blocks on name resolution and well-formed URLs on unresolvable hosts are kept. [#50225]

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

[0.8.1]: https://github.com/Automattic/jetpack-seo/compare/0.8.0...0.8.1
[0.8.0]: https://github.com/Automattic/jetpack-seo/compare/0.7.0...0.8.0
[0.7.0]: https://github.com/Automattic/jetpack-seo/compare/0.6.0...0.7.0
[0.6.0]: https://github.com/Automattic/jetpack-seo/compare/0.5.0...0.6.0
[0.5.0]: https://github.com/Automattic/jetpack-seo/compare/0.4.0...0.5.0
[0.4.0]: https://github.com/Automattic/jetpack-seo/compare/0.3.1...0.4.0
[0.3.1]: https://github.com/Automattic/jetpack-seo/compare/0.3.0...0.3.1
[0.3.0]: https://github.com/Automattic/jetpack-seo/compare/0.2.0...0.3.0
[0.2.0]: https://github.com/Automattic/jetpack-seo/compare/0.1.1...0.2.0
[0.1.1]: https://github.com/Automattic/jetpack-seo/compare/0.1.0...0.1.1
