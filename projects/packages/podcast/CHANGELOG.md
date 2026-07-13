# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.2] - 2026-07-13
### Changed
- Stop exposing the `podcasting_*` options through core `/wp/v2/settings`; the dashboard now reads and writes them via the dedicated `wpcom/v2/podcast/settings` endpoint. [#50458]
- Update package dependencies. [#49272]
- Update README and MD files. [#50248]

### Fixed
- Distribution: Mirror the Pocket Casts submission verdict onto the local site options so the dashboard reflects show state on Jetpack/Atomic sites. [#50228]
- Episode: Render the full player in all contexts (including the RSS feed) so it shows in the WPCOM Reader on Atomic and Jetpack sites, with a linked title and a native media fallback link for clients that strip the player. [#50286]
- Feed: Emit a single `<enclosure>` per episode when a post has accumulated duplicate enclosure meta rows. [#50331]
- Include full episode show notes in the feed so podcast apps stop showing blank episodes. [#50312]
- Load the package whenever the module system initializes it, so self-hosted sites with the module active load the package correctly. [#50242]

## [1.3.1] - 2026-07-06
### Added
- Podcast Episode block: Render the full interactive player in the WordPress.com Reader. [#50057]

### Changed
- Update package dependencies. [#50097] [#50183]

### Fixed
- Dashboard: Improve spacing, CTA sizing, and menu placement. [#50059]
- Minify JS in production build. [#50130]
- Welcome screen: Confirm podcasting is included instead of showing an upgrade prompt when the site's plan already covers it. [#50062]

## [1.3.0] - 2026-06-29
### Changed
- Centralize podcatcher host allowlist in PHP script data and preload mount-time REST responses to drop first-render round-trips. [#49969]
- Show a "Connect Jetpack" prompt on Stats and Episodes when the site isn't connected, instead of an upsell or an error. [#49989]
- Resolve the premium gate over the Jetpack connection so self-hosted Growth sites unlock paid surfaces, and point the upsell at the Growth plan. [#49942]
- Update package dependencies. [#49271]

### Fixed
- Don't show the "Connect Jetpack" prompt on Simple and Atomic sites, which have no Jetpack site connection. [#50022]

## [1.2.0] - 2026-06-25
### Added
- Register the Podcast submenu under the Jetpack menu on self-hosted sites when the module is active. [#49918]

### Changed
- Defer podcast REST endpoint instantiation so the endpoint classes only load on REST API requests. [#49803]
- Update package dependencies. [#49831]

## [1.1.1] - 2026-06-22
### Changed
- Update the Apple Podcasts category list to match the current taxonomy, validate topic input, and recommend a subcategory when a broad category is selected. [#49789]

## [1.1.0] - 2026-06-18
### Added
- Add a persistent "Create episode" button to the `/podcast` page header and a server-side prefill that assigns the configured category (and, on Premium, inserts the Podcast Episode block) when `post-new.php?podcast_episode=1` is opened.
- Create AI Podcast: Limit the "from specific posts" selection to 25 posts and surface a hint indicating the cap.
- Allow the package to load on self-hosted Jetpack sites behind the default-off `jetpack_podcast_for_the_world` filter.
- Ignore a deleted podcast category and add a raw show image URL accessor.
- Episode block: Add email renderer for the WooCommerce Email Editor.

### Changed
- Add a dedicated wpcom/v2 REST endpoint for site settings and load/save them through it from the dashboard, reachable on Simple, WoA, and self-hosted from a single definition.
- Align the distribution readiness notices with their settings field labels so it's clear which field each one refers to.
- Drop stale references to the removed jetpack_podcast_untangle gate and at-pressable-podcasting bridge from package docs.
- Gate the Posts to Podcast sub-feature to WordPress.com Simple and WoA hosts so it does not load on self-hosted Jetpack once the rest of the package becomes available there.
- Simplify REST endpoint and settings internals by dropping singleton init guards and single-use constants. No functional change.
- Posts to Podcast: Make the Create AI Podcast page available to connected users.
- Update package dependencies.

### Removed
- Remove the jetpack_podcast_untangle gate now that the legacy podcasting stack and at-pressable-podcasting bridge are gone; the package owns the experience unconditionally.

### Fixed
- Add a TypeScript config so dashboard route files type-check correctly.
- Create AI Podcast: Register the Media submenu without an `is_admin()` guard so it appears in the Calypso nav, not just wp-admin.
- Create AI Podcast: Require a connected WordPress.com account.
- Fix the "Create episode" button hover state to match standard Jetpack primary buttons.
- Fix a podcast app creating a new listing when visiting your feed instead of just confirming the one you already started.
- Fix empty episode descriptions in the feed when no excerpt is set.
- Resolve the blog ID via `Connection_Manager::get_site_id()` for feed enclosure URLs and tracks events so Atomic sites use the correct WPCOM site ID instead of 1.

## [1.0.2] - 2026-05-20
### Changed
- Podcast: default jetpack_podcast_untangle to true. The new package now owns the experience on every Simple and Atomic site by default; the filter stays as an escape hatch for forcing the legacy stack back on.

### Fixed
- Podcast: surface a Show notes textarea in the Podcast Episode block (synced with the post Excerpt) so authors know where the episode description in Apple Podcasts / Spotify / Pocket Casts comes from. Strip non-podcast RSS chrome from the feed: drop content:encoded (full post body + image EXIF), media:content (avatar + post images), per-item categories, and the comments-link cluster.

## [1.0.1] - 2026-05-20
### Added
- Podcast feed: surface per-episode metadata (transcript, location, license, people, soundbites, alternate enclosures, episode/season numbers) from the Podcast Episode block.

### Changed
- Podcast: rename the Distribution "Live" state badge to "Submitted" — the underlying signal is a crawler hit, not directory publication.
- Podcast Episode: swap inline chapters editor for a chapters JSON file uploader; feed now emits podcast:chapters.

### Fixed
- Podcast: proxy stats and Pocket Casts submit through Jetpack REST routes so the dashboard works on Atomic.
- Podcast: stop leaking body content into the episode RSS description, and drop the broken chapters JSON upload button in favor of a URL-only field with a soft warning when the URL doesn't look like JSON.
- Podcast feed: skip items without an enclosure and restore episode descriptions.
- Podcast feed: strip the blavatar, site-icon, and rss-cloud channel tags from the podcast RSS feed so the output stays iTunes-compliant once the untangle filter is flipped globally.
- Podcast settings + block polish from the regression sweep: decode HTML entities in the episode block title preview, defer Podcast Topics saves until focus leaves the field, persist empty Summary values, and align the block's season/episode number inputs with the feed's positive-integer requirement.
- Reduce podcast setup to a single click when you create a new category from the setup modal.

## [1.0.0] - 2026-05-19
### Security
- Podcast: escape title overrides, descriptions, and iTunes category attribute values for the RSS feed to prevent malformed XML. [#48876]

### Added
- Add a Free and Premium plan card to the podcast welcome screen so users can see what podcasting includes per plan before they enable. [#48800]
- Add the Podcast Episode block. Embeds a single podcast episode from an audio or video file with Podcasting 2.0 metadata. Registration is gated behind the `jetpack_podcast_untangle` filter (default off). [#48546]
- Create AI Podcast: emit client-side tracks events for page view, generation request, episode plays, draft opens, pagination, and the quota banner / upgrade CTAs. [#48900]
- Dashboard: gate the Episodes tab on Premium product access, with a blurred locked-preview overlay for free users. [#48885]
- Default the untangle gate to enabled for A8C-proxied requests so Automatticians dogfood the new package on Simple and Atomic. [#48699]
- Distribution tab: show Pending/Live state badges next to each podcast directory. [#48915]
- Pocket Casts: replace the 3-step submit modal with a one-click Relay API flow that reflects pending/submitted state on the button and surfaces rejection reasons inline. [#48732]
- Podcast: add product-access gate (Podcast_Gate::has_product_access) and grandfather sticker constant. [#48702]
- Podcast Welcome: require a category when enabling podcasting. [#48825]
- Posts to Podcast: Add an editor modal inviting eligible sites to create a podcast episode after publishing a post. [#48902]
- Posts to Podcast: new Media > Create AI Podcast wp-admin page for generating podcast episode drafts from posts via the wpcom-side pipeline. Pick posts to include or use a recent-posts window, steer the output with a free-form prompt, watch a remaining-credits indicator backed by the quota-snapshot endpoint, and resume polling across page reloads. The page is plain PHP plus a vanilla-JS island — no React or wp-build chassis for this surface. Feature is wpcom-only; self-hosted Jetpack sites don't see the menu. [#48774]
- Stats tab: render show- and episode-level podcast download stats. [#48614]

### Changed
- Build: Run webpack and wp-build scripts concurrently. [#48794]
- Create AI Podcast: map 429 responses (including non-JSON edge rate-limit pages) to "Out of credits" and other non-JSON failures to "An unexpected error occurred." instead of "The response is not a valid JSON response."; decode HTML entities in the posts-picker titles so values like "&nbsp;" no longer render literally; add an "Experimental" badge to the intro banner; instrument the generation poller and post-publish promo with Tracks events for funnel analysis. [#48949]
- Create AI Podcast: visual polish, floating toast notices, dismissible notices, generated episodes list, server-side bootstrap, and credits panel with reset messaging. [#48900]
- Distribution: refresh Apple Podcasts, Spotify, YouTube Music, Amazon Music, and Podcast Index logos with current brand marks. Rename the YouTube directory to YouTube Music. Map matching slugs in the Stats "By app" and "Top app" labels. [#48879]
- Episodes stats: detect 402 responses from the episode stats endpoint as a Premium-required state. [#48703]
- Episode stats: dispatch the premium-required state on the `podcast_premium_required` error code instead of HTTP 402. [#48885]
- Exclude development files from production builds. [#47365]
- Podcast: grandfather Premium access by site registration date; drop the sticker-based grandfathering path. [#48894]
- Podcast: narrow grandfather rule to sites registered before the cutoff that are also on a paid plan. [#48905]
- Podcast: serve square cover art in the feed by center-cropping via Photon, regardless of source aspect ratio. [#48938]
- Podcast: visual polish on the Stats tab — keep horizontal padding at narrow widths, lighter card headers, and integer-only axis ticks on the Downloads chart. [#48722]
- Podcast dashboard: opt into the shared `jp-admin-page-tabs--minimal` modifier so the tab strip aligns with the page header and labels use the design-system font size. [#48908]
- Podcast dashboard: reorder tabs so Stats appears first, followed by Episodes, Distribution, and Settings. [#48789]
- Podcast Episode: enrich front-end schema.org markup and make chapter / soundbite list items click-to-seek in the audio player. [#48793]
- Podcast Episode block: delegate the untangle gate to Podcast::is_enabled() so the block honors the same default as the rest of the package. [#48907]
- Podcast Episodes: fall back to the show cover image when an episode has no featured image. [#48790]
- Podcast Episodes: open the episode stats drilldown from a play-count click in the Episodes tab. [#48792]
- Podcast Settings: create new categories inline without leaving the podcast dashboard. [#48791]
- Podcast stats: rebuild summary tiles and bar list rows on @wordpress/components primitives. [#48742]
- Podcast stats dashboard: replace period dropdown with Calypso Stats date range picker (presets, calendar, custom from/to). [#48742]
- Polish the podcast setup flow: pin the post-setup destination to Settings, add a lead-in to the category picker modal, and surface a "+ Create episode" CTA on the empty Episodes state. [#48882]
- Settings: Add a "Cover image" subheading above the cover image control and rename the "Podcast category" section to "Post category". [#48880]
- Stats: Use Studio Blue (#3858e9) for bar colors on every surface, matching Calypso defaults. [#48888]
- Stats tab: Align Top episodes, By app, and Locations cards with the WordPress.com Stats card module look (real border, larger header, and 24px padding). [#48761]
- Update welcome screen copy to lead with the blog and newsletter story, and refresh the feature boxes and how-it-works steps. [#48796]

### Fixed
- Always show the Disable podcasting card on the settings tab, and return the user to the welcome screen after disabling, so the back-out flow works before a category has been chosen. [#48797]
- Create AI Podcast: Clarify that free trial credits do not reset. [#48957]
- Create AI Podcast: serve the generated-episodes list directly from the site database so it works on Atomic installs. [#48900]
- Distribution: revert Podcast Index logo to previous version. [#48922]
- Podcast: enqueue WP media library so the cover image selector loads. [#48720]
- Podcast: skip rewriting the RSS enclosure URL through the stats endpoint when the URL does not resolve to a local attachment, so externally hosted enclosures stay playable. [#48878]
- Polish Podcast dashboard styles: match placeholder thumbnail size to populated thumbnails, and space out the Distribution tab's warning notice. [#48920]

## 0.1.0 - 2026-05-11
### Added
- Add initial package gated behind the `jetpack_podcast_untangle` filter. [#48556]
- Dashboard: Add an empty wp-build dashboard scaffold and the "Jetpack > Podcast" wp-admin entry. [#48557]
- Dashboard: Fill in the four tab panels: Welcome onboarding, Settings form, Episodes list, and Distribution submission flow. [#48667]
- Feed: Register `<itunes:*>` / `<googleplay:*>` channel and item tags, podcatcher detection, and stats-tracked enclosure URLs for the configured podcast category. [#48658]
- Settings: Register the `podcasting_*` option schema with REST exposure and Jetpack Sync opt-in. [#48597]
- Tracks: Record podcast publishing, media uploads, status changes, podcatcher show-URL submissions, and settings saves. [#48665]

### Changed
- Dashboard: Replace the wp-build placeholder with page chrome and tab navigation. [#48559]
- Dashboard: Slim down wp-build wiring to the Backup pattern. [#48600]

[1.3.2]: https://github.com/Automattic/jetpack-podcast/compare/v1.3.1...v1.3.2
[1.3.1]: https://github.com/Automattic/jetpack-podcast/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/Automattic/jetpack-podcast/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/Automattic/jetpack-podcast/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/Automattic/jetpack-podcast/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/Automattic/jetpack-podcast/compare/v1.0.2...v1.1.0
[1.0.2]: https://github.com/Automattic/jetpack-podcast/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/Automattic/jetpack-podcast/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/Automattic/jetpack-podcast/compare/v0.1.0...v1.0.0
