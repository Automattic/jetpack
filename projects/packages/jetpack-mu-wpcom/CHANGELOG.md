# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [6.11.0] - 2026-10-14
### Security
- Verbum: Only resolve listed oEmbed providers in embed previews, and build their HTML like the core oEmbed proxy. [#52707]
- Write: escape image alt text in block serialization to prevent markup integrity issues [#48580]

### Added
- Add a "Learn more" support link to the Markdown block description [#49680]
- Add a "Learn more" support link to the Playlist and Tabs block descriptions. [#51107]
- Add a Backup page to wp-admin on WordPress.com sites, rendering the upgrade or activate prompt for sites whose backups are not available yet. Registered but not linked from the menu. [#52358]
- Add an Automattician-only Tools > Feature Flags screen for overriding Jetpack feature flags on WordPress.com Simple and Atomic sites. [#51324]
- Add a package-level `Jetpack_Mu_Wpcom::log2logstash( $feature, $message, $extra )` helper that dispatches to the in-process `log2logstash()` on WP.com Simple and falls back to the public-api `/rest/v1.1/logstash` endpoint (fire-and-forget) on Atomic. Plugin Conflicts Guardian now uses it, so its `Activation blocked` / `Update blocked` / `Update rolled back` events are observable on Atomic sites too. [#48710]
- Add a Stats link to the site-name admin bar menu, alongside Dashboard. [#50222]
- Add the Jetpack AI Hub to WordPress.com Simple sites. [#51661]
- Add the VideoPress dashboard menu and boot payload on WordPress.com Simple sites. [#50410]
- Add Tracks event wpcom_write_editor_draft_saved when a draft is successfully saved in the Write editor, with is_new_post and post_id properties. [#48339]
- Add Tracks event wpcom_write_editor_open when the Write editor is opened, with is_new_post, source, and post_id properties. [#48338]
- Add wpcom_build_fatal_error_signature() / wpcom_decode_fatal_error_signature() helpers for sharing a transportable plugin/version/core/php fatal-error signature across wpcom features. [#48369]
- Add Write, a distraction-free front-end editor at /write/ for WordPress.com sites. Gated by blog sticker. [#48247]
- Agents Manager: Apply the `jetpack_ai_sidebar_agents_manager_data` filter so hosts can extend the inline `agentsManagerData` payload. [#48409]
- Agents Manager: load it in the block editor on WordPress.com sites with the WordPress Agent enabled, instead of relying on the Big Sky plugin to request it. [#52832]
- AI Launchpad: add a "Create your first gallery" task for photography and portfolio sites, opening the editor with a gallery pattern. [#50166]
- AI Launchpad: add an internal helper for enabling and resetting the feature during testing. [#49817]
- AI Launchpad: gate the wp-admin launchpads on the launchpad-personalization ExPlat experiment. [#50803]
- AI Launchpad: make tasks completable from wp-admin on Simple and Atomic — honor the catalog visibility gate, add local completion listeners (Jetpack Social, About page), retrieve real signals on Atomic (subscriber counts, memberships), and complete acknowledgment / no-signal tasks on CTA click (including a "Mark as complete" button and an SSH task). Point the social and design CTAs at wp-admin, hide the Jetpack Social tasks on private sites where their admin page isn't available, and add an ?all_tasks=1 testing param that renders the full task catalog. [#50005]
- AI Launchpad: pre-fill the wizard Name and Brief description from the site's title and tagline, and save them back to the site on completion. [#49794]
- AI Launchpad: scaffold the MVP — an AI-tailored onboarding task list on a new top-level wp-admin page. [#49608]
- AI Launchpad: show a free DIFM offer banner under the Site Setup task list on eligible sites. [#53497]
- AI Launchpad: show an in-progress state (drafts icon, "Continue" CTA) for site-editor tasks with an unpublished draft, reopening that draft instead of creating a new one. [#50125]
- AI Launchpad: write AI-drafted content on the About page instead of a library pattern, and log the gallery pattern selection to Logstash from the client. [#50570]
- Block editor NUX: offer the "4 for 4" subscriber program after a site's first post is published. [#52398]
- Bump a unified Tracks stat for every wp-admin page view. [#52532]
- Classic block: Allow sites with the enable-classic-block-inserter-support sticker to insert the Classic block. [#48526]
- Comments: load the rebuilt Jetpack Comments form in place of Verbum when the jetpack_comments_new_hotness filter returns true. [#51466]
- Enable the `gutenberg-classic-block-deprecation` Gutenberg experiment for all sites. Sites with the `disable-classic-block-deprecation` blog sticker continue to use the Classic block. [#48723]
- Enable the `gutenberg-react-19` Gutenberg experiment for sites with the `gutenberg-react-19` blog sticker. [#49820]
- Expiry notices: add a dismissible modal explaining what changes on a site whose plan has expired, and point reverted sites at support. [#51884]
- Expiry notices: show the plan-expiry notice inside the block editor, the site editor, and the block widgets screen. [#51952]
- Expiry notices: Show the plan-expiry notice on the site front-end to logged-in admins. [#52036]
- Expiry notices: wp-admin banner notifying admins when their plan is approaching expiry, in the grace period, or past grace. [#49304]
- Fetch patterns from GutenPen source site [#49050]
- Help Center: add a jetpack-connection-health REST proxy so Atomic sites can detect an unreachable site and route affected users to a human. [#50622]
- Initialize Activity Log event custom post type support when Sync is available. [#48567]
- Is a11n field to the Help Center datawq [#48579]
- Launch: Show a pre-launch confirmation modal when launching a site that has a paid plan and a custom domain. [#51513]
- Layout Grid Usage Tracking: add an `origin` field to the logstash event so explicit editor inserts can be told apart from migration, import, XML-RPC, WP-CLI, cron, headless REST/AJAX, programmatic, and theme/template-render arrivals. [#49393]
- Layout Grid Usage Tracking: log a logstash event the first time a `jetpack/layout-grid` block is observed on a WoA site so we can attribute its source to the responsible plugin or theme. [#49122]
- Omnibar: add wpcom/v2/admin-bar endpoint to fetch site's admin bar nodes [#48290]
- PayPal Payment Buttons: add platform routes that look up referred sellers and make Payment Links calls on their behalf. [#52873]
- PayPal Payment Buttons: add the WordPress.com endpoint that generates PayPal onboarding links. [#51656]
- PayPal Payment Buttons: log PayPal API errors with their debug ID. [#53114]
- Plugin Conflicts Guardian: add force-override controls on the block notice — "Activate anyway" / "Retry without check" for one-shot bypass and a 10-minute bypass toggle for repeated retries. [#49220]
- Plugin Conflicts Guardian: add percentage rollout gate by blog ID (default 0%). [#49159]
- Plugin Conflicts Guardian: emit logstash events when the guard refuses or recovers from a bad change — `Activation blocked` (refused activation), `Update blocked` (refused install/update with a parse error), and `Update rolled back` (post-update fatal triggered a rollback). All three share the `plugin-conflicts-guardian` feature bucket so the full PCG-block surface can be measured from one filter. [#48565]
- Plugin Conflicts Guardian: new pre-flight check that blocks a plugin activation (via plugins.php or update.php) when a short-lived HTTP probe captures a fatal during load or the init cycle; gated behind the pcg_guard_activation filter. [#48261]
- Plugin Conflicts Guardian: post-update health check with automatic rollback to the previous WP.org version on fatal. Gated on pcg_guard_updates filter (default false). [#48292]
- Plugins: add a Marketplace tab to the Add Plugins screen, listing WordPress.com partner and premium plugins, and show it first. Behind the wpcom-plugins-marketplace-tab feature flag, off by default. [#52125]
- Plugins: show Agents Manager on the plugin management and installation screens when WordPress Agent is enabled. [#52807]
- Plugins: Show a Marketplace tab of WordPress.com partner and premium plugins first on the Add Plugins screen, on Atomic and Simple sites. [#53169]
- Plugins: Show matching Marketplace plugins at the top of plugin search results, and draw the Marketplace tab with the same core plugin cards. [#52976]
- Plugins: Show which plugins a Marketplace plugin needs on its card, noting they will be installed with it. [#53148]
- Podcast: Add a "Made with Jetpack Podcast" credit to the podcast feed on sites without a podcast plan. [#52012]
- Premium Analytics: Expose the dashboard opt-in through the site settings API. [#51864]
- Profile Settings: add a link to manage your username on WordPress.com to the username row on wp-admin/profile.php. [#51932]
- Show the Help Center icon on the navbar when seeing the Editor with a mobile device. [#47820]
- Site editor: Allow sites with the gutenberg-extensible-site-editor sticker to opt into the Extensible Site Editor Gutenberg experiment. [#52031]
- Site Logo: Show the currently set logo in WP Admin General Settings, alongside the Fiverr logo-maker upsell. [#50764]
- Smart Dictation: Add endpoints to proxy client secret requests. [#49228]
- Stats: Pass the admin bar Stats link and the My Jetpack redirect on Atomic Personal and Premium plans through the jetpack_stats_url filter. [#52905]
- Themes: add the wpcom-themes-marketplace-tab feature flag, gating a Marketplace tab on the Add Themes screen that lists WordPress.com themes. Off by default. [#52701]
- Track clicks on Core and WordPress.com admin bar items. [#51304]
- Track command palette trigger clicks in the wpcom admin bar. [#50659]
- VideoPress: enable the chapters editor for Automatticians on WordPress.com Simple sites. [#50986]
- VideoPress: Enable trim and cut testing for Automatticians and opted-in WordPress.com Simple sites. [#52515]
- WordPress.com admin bar: add Emails and Plugins links to the WordPress.com logo menu, pointing to the my.wordpress.com hosting dashboard. [#49822]
- WordPress.com Simple: Add gated Premium Analytics bootstrap wiring. [#50266]
- WP.com smart dictation app [#48602]
- Write: add anon funnel Tracks events (write-start, publish-click) and an is_anon flag on editor open, for the Write On Phase 1 fake-door funnel. [#50216]
- Write: Add a topbar three-dot menu with "Open in block editor" and "Preview" actions when editing an existing post. [#48971]
- Write: Add blockquote citation support [#48934]
- Write: add full-justification alignment for paragraphs. [#48923]
- Write: Add full list support — slash menu entries, keyboard handling (Tab/Shift-Tab/Backspace), proper block serialization, and fix for text style changes getting stuck inside lists [#48457]
- Write: Add i18n for all user-facing strings in the Write editor [#48323]
- Write: Add periodic autosave with dirty state tracking, draft recovery, and unsaved changes warning. [#48361]
- Write: Add post picker modal with recent drafts and URL/ID input to the kebab menu [#49025]
- Write: add Save draft to the kebab menu on narrow screens where the toolbar button is hidden [#49106]
- Write: Allow dragging an image file directly into a post to insert it, no image block needed first. [#49166]
- Write: Ask writers one question about their experience after their first post, with an optional comment. [#51787]
- Write: convert lines beginning with `-`, `*`, `+`, or `1.` followed by space into list items. [#49135]
- Write: enable a logged-out variant of the Write editor when the host page sets `window.wpcomWriteIsAnon = true` — drafts persist to localStorage, broken UI is hidden, and Publish hands off to /setup/write-on. No effect on the existing authenticated path. [#49762]
- Write: Introduce the editor on a first visit, and offer a switch to the Block editor from the note and the Tips panel. [#52094]
- Write: load the Write editor for additional users during gradual rollout. [#48730]
- Write: require email verification before launch in the post-publish overlay, with inline resend and re-check. [#50207]
- Write: return the back button to the place the user came from (e.g. the Reader) when a known source is provided [#49867]
- Write: seed a new post with the daily writing prompt when opened with an answer_prompt parameter. [#51671]
- Write: send users back to My Home or the Reader when they open the editor from a daily prompt card there. [#52388]
- Write: Set _last_editor_used_jetpack meta for editor attribution and fire client-side publish tracking event. [#48382]
- Write: Show post title (or 'Untitled') in the header bar so it never feels empty [#48664]
- Write: surface an inline "confirm your email to launch" step in the post-publish checklist when an unverified Write On author tries to launch a Coming Soon site. [#49935]
- Write: surface a post-publish next-steps checklist (launch + share) when publishing on a Coming Soon site, so the post-publish moment is honest that the post isn't public yet. [#49935]
- Write: typing "> " at the start of an empty line now creates a quote block [#49833]
- Write: warn when opening posts with formatting that Write cannot preserve (unsupported block types, styling attributes, non-video embeds, or classic editor content) [#48841]
- Write editor: accessibility pass — aria-label on back link, role/aria attrs on content area (textbox + combobox pattern for slash menu), role=dialog on image and video modals, aria-label on category FAB (converted to button), role=option on slash menu items with aria-selected and aria-activedescendant management [#48620]
- Write editor: add a media library browser to the image insert modal so users can pick existing images alongside upload and paste-URL. [#49670]
- Write editor: add an empty paragraph when clicking below the last element [#48497]
- Write editor: add diagnostic Tracks events for save/publish failures and stalled requests to aid root-cause analysis. [#50176]
- Write editor: add dismissible beta disclaimer banner warning that data loss is possible. [#48657]
- Write editor: Add image properties panel (alt text, size, alignment, featured image) opened by an Edit pencil on each image. Adds left, center, and right alignment, replaces the inline ALT and Size buttons, and fixes the stale "align left" toolbar indicator. [#49536]
- Write editor: add image size presets via per-image hover controls [#48980]
- Write editor: implement undo/redo history stack (Cmd+Z / Cmd+Shift+Z) with toolbar buttons [#48801]
- Write editor: replace floating categories FAB with inline 'Writing in X' selector above the title; support #hashtag extraction from standalone content lines for tagging on save [#48652]
- Write editor: support Cmd+S / Ctrl+S to save [#49356]
- Write editor: thread the source query param through the anon funnel Tracks events and the signup handoff for cross-funnel attribution. [#50791]

### Changed
- Action Bar: Load the WordPress.com front-end action bar from the Newsletter package. [#52201]
- Adapt WordPress.com CFM flags to explicitly disable for excluded sites now that CFM is enabled by default in the Forms package. [#47826]
- Admin bar: keep the id of the top-left node to be `wp-logo`, instead of `wpcom-logo` [#48345]
- Admin menu: Hide and order Jetpack Settings at its new address too. [#52589]
- Admin menu: Keep a single Backup entry in the Jetpack menu. [#52702]
- Admin Menu: on Atomic sites, Jetpack > Activity Log now opens the native wp-admin Activity Log page instead of the Calypso one. [#52387]
- Agents Manager: Extract into its own package from jetpack-mu-wpcom [#49202]
- ai-assistant-banner: gate on WPCOM_Features::BIG_SKY instead of the removed BIG_SKY_EXISTING_SITE. [#48385]
- AI Assistant banner: send the standard context props (channel, surface, screen, site_type, product_slug, is_test, is_a11n) on its Tracks events. [#51714]
- AI Launchpad: address first-pass design feedback (DSGCOM-678) — a single-open accordion task list that auto-expands the next task on skip or completion, WPDS state icons, a Site Editor / Customizer quick link on the site preview, full-width goal copy on mobile, more general social-task subtitles, and removal of the redundant write-3-posts task. [#50088]
- AI Launchpad: add the AI standard properties to the Tracks events. [#51471]
- AI Launchpad: Align the wizard and task list with the WordPress design system. [#52456]
- AI Launchpad: apply the second pass of design feedback — let the AI pick the theme-search keyword, add a wizard Skip that reverts to the regular launchpad, update the site title without a reload, replace the born-completed post-sharing task, consolidate the legacy design tasks onto the actionable "Choose a theme" task and always offer it (store-filtered) on sell sites, and polish the preview card and wizard icons. [#50320]
- AI Launchpad: drop the AI-onboarded exclusion — sites built with Big Sky are now eligible like any other; the tasklist tailors to what the build already covered. [#50830]
- AI Launchpad: filter the theme task's showcase link by an AI-inferred subject category instead of free-text search, so free themes always surface [#50672]
- AI Launchpad: generate fuller, better-tailored task lists — offer the tailoring AI only the tasks that will actually render on the site and goal (rescuing the About-page task the visibility gate wrongly hid during the REST request) and are not already complete, back-fill a short list toward six as a floor, and drop the "Personalize newsletter" task, which was born-completed and offered nothing to do. [#50404]
- AI Launchpad: Hide My Home for every user on AI Launchpad and no-guidance sites, not just administrators. [#53153]
- AI Launchpad: hide the legacy Dashboard launchpad widget and the My Home menu for the no_guidance launchpad-personalization variation. [#50837]
- AI Launchpad: improve task selection by describing the task menu to the model, enforcing the goal rules in code, and adding tasks for galleries, contact, events, video, portfolio pieces, site icons, style variations and Sensei. [#50786]
- AI Launchpad: point the theme-picker tasks at the themes showcase pre-filtered by the AI-inferred niche, so the theme list feels relevant to what the user is building. [#50127]
- AI Launchpad: polish the tailored list to match the design prototype — centered layout with a heading, progress, and site preview; action-specific task CTAs; and a "Tailoring your checklist…" loading state. [#49787]
- AI Launchpad: rebuild the product analytics plane — shared context props on every Tracks event, full wizard/task funnel events, server-side task/all-tasks completion reporting, analytics-only inferred_goal, and tailoring telemetry folded into the tailored Logstash record. [#50606]
- AI Launchpad: refresh wizard and launchpad copy, with a goal-specific launchpad heading. [#50501]
- AI Launchpad: rename the screen to Site Setup, position it under the Dashboard, and replace My Home for eligible sites. [#50206]
- AI Launchpad: rework the "sell" goal to lead with install-WooCommerce and store-setup tasks, and show the commerce tasks as a disabled roadmap until WooCommerce is active, so the list no longer collapses on a fresh site. [#50178]
- AI Launchpad: rework the tailoring prompt to rank tasks by relevance to the user's site intent and write site-specific task subtitles, and retry once on a transient AI failure. [#49794]
- AI Launchpad: Tailor the setup list with a newer AI model, and write it in the site's language even when the description uses another one. [#53215]
- AI Launchpad: temporarily make it available on all plans, including free. [#50229]
- AI Launchpad: translate the wizard and task list into the user's language, write the created pages and the AI-generated content in the site language. [#52485]
- AI Launchpad: turn on Site Setup and the no-guidance experience from per-site settings instead of an experiment. [#52931]
- Block patterns: Re-register the core Query Loop patterns, which were excluded along with all other core patterns. [#51068]
- Bump @automattic/launchpad and newspack-icons for React 19 compatibility. [#52997]
- Central Forms Management: stop excluding e2e test sites. [#51149]
- Clear the site intent for the deprecated start-writing flow, and stop suppressing the recommended tags modal for it. [#50392]
- Comments: register the embed preview route on WordPress.com. [#53032]
- Comments: Turn on Jetpack Comments for every WordPress.com site. [#53392]
- Components: Use Link from `@wordpress/ui` instead of ExternalLink. [#48529]
- Custom CSS: Replace legacy mobile detection with the device detection package. [#49659]
- Daily Writing Prompt: move the dashboard widget into the jetpack-newsletter package and consume it from there, removing the duplicated widget code. [#49425]
- Daily writing prompt: Update dashboard widget to use WordPress UI components. [#49424]
- Dashboard: Restore the WordPress Events and News feed widget on WordPress.com sites. [#49925]
- Defer loading the Odyssey stats dashboard widget until the WordPress dashboard is assembled. [#49803]
- Exclude development files from production builds. [#47365]
- Exclude source map files from the distributed package. [#52304]
- Expiry notices: grace lasts while the plan purchase exists; post-grace follows the site's automatic expiry revert and works on Simple sites. [#52281]
- Expiry notices: left-align the front-end banner text, keep the button on one line beside it, and center the dismiss button vertically. [#52435]
- Expiry notices: Let admins dismiss the post-expiration notice on Simple sites. [#53349]
- Expiry notices: show the plan-expiry notices to all sites, in every language. [#51766]
- Expiry notices: widen the rollout to 20% of sites. [#51476]
- General Settings: Update the domain and site management links to point to the new WordPress.com pages. [#52788]
- Global Styles: migrate the limited-styles notice mount to React 18 createRoot for React 19 compatibility. [#49231]
- Gutenberg: Enable the React 19 experiment on 1% of Atomic sites, with a blog sticker opt-out. [#50805]
- Gutenberg: Enable the React 19 experiment on 2% of Atomic sites, skip sites with incompatible extensions. [#51351]
- Gutenberg: Enable the React 19 experiment on 5% of Atomic sites. [#51431]
- Gutenberg: Enable the React 19 experiment on 10% of Atomic sites, and skip more incompatible themes and plugins. [#51713]
- Gutenberg: Enable the React 19 experiment on 20% of Atomic sites, and skip more incompatible plugins. [#52076]
- Gutenberg: Enable the React 19 experiment on 40% of Atomic sites, and skip more incompatible plugins. [#52425]
- Gutenberg: Enable the React 19 experiment on 70% of Atomic sites, and skip more incompatible plugins. [#52869]
- Gutenberg: Keep the React 19 experiment disabled on sites running Gutenberg 23.9.0. [#51985]
- Gutenberg: Skip the React 19 experiment only on extension versions that are still incompatible. [#52476]
- Gutenberg: Sync the list of React 19 incompatible plugins with the Gutenberg plugin. [#53539]
- Help Center: Extract helpCenterData payload builder into Help_Center::get_help_center_data() so frontend consumers can mount Help Center without duplicating the payload. [#48821]
- Help Center: load the PHP backend from the shared Help Center package. [#50807]
- Help Center: Remove unused next-admin asset loading. [#49614]
- Internal: No longer require automattic/jetpack-changelogger as a per-project dev dependency. [#48225]
- Launch: Source the site launch celebration modal from the shared site-launch-modals package. [#51716]
- Launch Button: Rename the admin bar node ID from `menu-id` to `launch-site`. [#53096]
- Launchpad: replace the "Edit site design" task with the existing "Choose a theme" task (which links to the theme showcase) across the build, free, assembler-first, ai-assembler, and readymade-template checklists, and move it above the "Choose a domain" task. [#49738]
- Marketing Tools: Set a fixed height on the premium plugins Get started button. [#48099]
- Marketing Tools: update SEO course CTA from "Register now" to "Watch the course" [#49086]
- Newsletter: default the modernized Subscribers experience on for all WordPress.com sites, retiring the legacy Calypso Subscribers submenu. [#50091]
- Newsletter: Retire the legacy Calypso Subscribers submenu for Automatticians and for the modernized-dashboard percentage cohort (currently 0%, bucketed by the stable wpcom blog ID). [#49036]
- Newsletter: stop requiring the jetpack-newsletter package as a composer dependency. The Newsletter classes are now resolved through the Jetpack autoloader from the standalone Jetpack plugin (Atomic) or the wpcom platform's bundled Jetpack source (Simple), guarded with class_exists() at every call site. This removes the duplicate ship of the package's build artifacts from the mu-wpcom-plugin deploy. [#48627]
- Newspack Blocks: Update to 4.30.3, now synced from the newspack-workspace monorepo. [#51503]
- Newspack Blocks: Update to v4.35.0. [#53545]
- Omnibar: point the WordPress.com sites and account links to the my.wordpress.com subdomain. [#51928]
- Pages homepage connection banner: make the notice dismissible and persist the dismissal per user. [#50454]
- PayPal Payment Buttons: Enable the wpcom/v2/paypal/platform endpoints on WordPress.com for the sandbox; production stays behind a flag. [#53529]
- PayPal Payment Buttons: Send the partner attribution ID with every seller referral. [#53021]
- Plugin Conflicts Guardian: confirm captured fatals via a second probe loaded through WP's normal active-plugin bootstrap; downgrade if clean. [#49190]
- Plugin Conflicts Guardian: enable rollout at 5% by default. [#49451]
- Plugin Conflicts Guardian: follow up to 5 redirects on the probe loopback so canonical http→https and force_ssl_admin scheme bounces stop returning "Too many redirects". [#48897]
- Plugin Conflicts Guardian: include `blog_id` in logstash events so multisite / Atomic / Simple rows carry site attribution, matching the verbum-comments and wpcom-blocks precedent. [#48691]
- Plugin Conflicts Guardian: increase rollout to 10%. [#49605]
- Plugin Conflicts Guardian: increase rollout to 20%. [#49649]
- Plugin Conflicts Guardian: load the feature again in jetpack-mu-wpcom. The PCG rollout default is 0%, so the guards stay off until a rollout filter opts a site in. [#49388]
- Plugin Conflicts Guardian: pcg_guard_activation now defaults to true, enabling the activation probe and install/update parse-error gate by default. [#48553]
- Plugin Conflicts Guardian: pcg_guard_updates now defaults to true, enabling the post-update health check and rollback flow by default. [#48595]
- Plugin Conflicts Guardian: probe all selected plugins together in one loopback request pair so bulk activation cost no longer scales with the number of plugins. [#48402]
- Plugin Conflicts Guardian: reclassify HTTP 500 + marker-without-JSON from fatal to ok-inconclusive — block only on a captured PHP fatal, log anomalous allows via Probe anomaly allowed event. [#49156]
- Plugin Conflicts Guardian: shutdown handler always emits a verdict (status=fatal for engine fatals, status=ok-shutdown otherwise); add re-entry guard so a single probe request emits exactly one JSON response. [#49157]
- Plugins: give the Marketplace tab its own card grid, showing each plugin's yearly price and how much it saves against paying monthly. [#52335]
- Plugins: Remove the WordPress.com marketplace banner from Add Plugins when the Marketplace tab is enabled. [#53010]
- Plugins: Reopen a Marketplace plugin's details straight away instead of reloading them every time. [#52881]
- Plugins: Show Marketplace plugins as core's plugin cards, with Purchase in place of Install Now and the price in the card's bottom strip. [#52973]
- Podcast: initialize the jetpack-podcast package from jetpack-mu-wpcom (so Simple sites pick it up where load-jetpack.php doesn't run), and when the `jetpack_podcast_untangle` filter is on, register the new in-admin "Jetpack > Podcast" page in place of the legacy Calypso "Podcasting" link. Default behavior (filter off) is unchanged. [#48557]
- Podcast: load the module only on Simple (where Jetpack has no module-system loader); Atomic now loads it through the Jetpack module system. [#50317]
- Podcast: refresh the package-init comment to reflect the consolidated module-based load gating (no functional change). [#50242]
- Premium Analytics: Honor the site's own opt-in on WordPress.com Simple, alongside the rollout sticker. [#51863]
- Premium Analytics: register the Ads tab on sites whose plan includes WordAds. [#52455]
- Premium Analytics: Register the Ads widgets on Simple and Atomic from the Ads package. [#52635]
- Premium Analytics: Register the Top videos widget on Simple and Atomic from the VideoPress package. [#52909]
- Premium Analytics: Show the Ads tab only when WordAds is on, as classic Stats does, not to every plan that includes it. [#52903]
- Premium Analytics: Title the Ads tab Ads performance. [#52714]
- Profile Settings: reword the WordPress.com links on wp-admin/profile.php to "Edit account settings on WordPress.com". [#51932]
- Remove experiment gating and enable the logged-out AI assistant for 100% of logged-out users on /support, forums, courses, lessons, guides, and search results [#48104]
- Remove unneeded development files from the distributed version of the package. [#49014]
- Replace custom loading spinner with standardized WordPress Core spinner SVG. [#47451]
- Replace Gridicon with Icon and named icon exports from `@wordpress/icons`. [#48537]
- RTC: Document how collaboration is gated behind the Gutenberg 23.8 experiment. [#51389]
- RTC: Load feature for local users [#47835]
- RTC: switch real-time collaboration off on WordPress.com sites. [#52689]
- Show the Stats admin bar link in wp-admin too, not just the front end, so the wpcom/v2/sites/%d/admin-bar REST endpoint can report it. [#50345]
- Site launch: ship the semi-gated launch flow as the default for all users. [#49618]
- Site Logo: Restyle the Fiverr logo maker prompt in WP Admin General Settings as an inline callout. [#50954]
- Smart Dictation: Make the feature available to all English-language users. [#49233]
- Stats v2: rename the WordPress.com Simple dashboard menu label from "Premium Analytics" to "Stats v2". [#50915]
- Survicate: load the shared wp-calypso bundle from widgets.wp.com instead of an inline script, add a `wpcom_survicate_enabled` filter to turn surveys off, and send the WordPress.com `user_id` trait so "Users" audiences can target wp-admin visitors. [#52709]
- Survicate: skip loading on internal P2 sites and network/user admin pages, and emit an is_big_sky_site visitor trait so Big Sky users can be excluded via Survicate's targeting UI. [#48588]
- Themes: share the WordPress.com themes API, cache, mapper and tier reader with wpcomsh rather than each keeping a copy. [#53511]
- Turn on the rebuilt Jetpack Comments form for sites carrying the rollout sticker, and register its sign-in routes ahead of the comment experience gates. [#52166]
- Update @automattic/site-launch-modals to 1.0.3. [#51936]
- Update package dependencies. [#47907] [#48106] [#48141] [#48404] [#48405] [#49218] [#49271] [#49272] [#49273] [#49631] [#49691] [#49757] [#49831] [#49934] [#50097] [#50183] [#50509] [#50510] [#50529] [#50751] [#50753] [#51008] [#51303] [#51701] [#52187] [#52955] [#52999] [#53012]
- Update wp-admin menu ordering for the Blaze Ads menu move from Tools to the Jetpack menu. [#49584]
- Update WPDS design tokens to the @wordpress/theme 0.16/0.17 names (see https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/CHANGELOG.md#0160-2026-06-24 ). [#49272]
- Use apply_shortcodes() terminology instead of do_shortcode(). [#53552]
- VideoPress: enable the chapters editor for all users. [#51296]
- VideoPress: roll the modernized dashboard out to all WordPress.com Simple sites, removing the Automattician-and-sticker rollout gate [#50866]
- WooCommerce: Add opt-in and emergency opt-out controls for unified block editor assets. [#51990]
- WP.com admin menu: delegate the Podcast untangle gate to Podcast::is_enabled() so the menu honors the same default as the rest of the package. [#48907]
- WP.com Error Reporting: delegate all decisions to host-specific filters [#50483]
- WP.com Error Reporting: use direct fetch with no CORS preflight [#50503]
- wpcom-admin-bar: position the v3 notifications panel (#wpnt-notes-panel3) on mobile alongside the existing v2 panel. [#49514]
- wpcom-admin-menu: hide the new jetpack-activity-log submenu on WPCOM hosts so the direct wordpress.com/activity-log link wins. [#48244]
- WPCOM Site Management widget: mark the iframe `inert` attribute for the upcoming React 19 migration. [#49231]
- Write: Change category picker icon from gear to tag for clarity [#48391]
- Write: Disable undo/redo actions from keyboard shortcuts and browser Edit menu. [#48435]
- Write: Extract the image-formatting and pure text helpers out of view.js into standalone modules with unit tests. [#51098]
- Write: Refresh the editor's toolbar and top bar icons and restyle its buttons to match the WordPress Design System, dropping the dashicons font dependency. [#51005]
- Write: Remember a switch to the Block editor, so the Daily Writing Prompt widget stops offering Write. [#52230]
- Write: remove the sticker and Automattician gating so the editor loads for all WordPress.com sites. [#48839]
- Write: Replace highlight-to-format floating toolbar with a persistent top toolbar. [#48305]
- Write: Send a prompt answer straight to the Block editor when this browser has opted out of Write, whichever surface the answer came from. [#52380]
- Write: Update all buttons and interactive accents to use the Dotcom blue accent color for brand consistency. [#49972]
- Write editor: dragged-in images now show a pulsing placeholder sized to the image's aspect ratio while uploading, so the in-flight state is obvious and the placeholder stays visible even when the local preview can't render. The upload is also announced to assistive tech via aria-busy and a live region. [#50335]
- Write editor: link from the Tips popover to the Help Center, opening the Write editor support article in the existing Help Center panel [#49446]
- Write editor: replace ambiguous '?' help button with a cleaner italic 'i' icon, and fix the tips popover appearing behind the beta/recovery banners. [#48795]
- Write editor: strip source typography and unsupported tags from rich-text pastes to inherit the editor's styling. [#49020]

### Deprecated
- Contact Form Flags: Retire the disable-central-forms-management gating. Central Forms Management is enabled for every site. [#51397]

### Removed
- AI Launchpad: Remove redundant workaround for a page loading edge case now fixed in bundled dependencies. No functional change. [#50780]
- Content Research: Remove the editor sidebar, its proxy REST endpoints, and the a8c-only enqueue. [#52266]
- Omnibar: delete the orphaned admin-bar endpoint class file. Endpoint now lives in the Jetpack plugin. [#48320]
- Omnibar: remove wpcom/v2/admin-bar endpoint from jetpack-mu-wpcom. We'll move it to Jetpack instead. [#48319]
- Podcasting: drop the legacy podcasting admin-menu fallback now that the jetpack-podcast package owns the experience unconditionally. [#49548]
- Premium Analytics: Stop bundling the dashboard package, which WordPress.com now runs from the copy shipped with the Jetpack plugin. [#52717]
- Premium Analytics: Stop starting the dashboard on WordPress.com Simple, which now starts it itself. [#52716]
- Remove five unused SVGs from assets/images that were ported from the ETK NUX feature but never referenced or bundled. [#49471]
- Remove jetpack_wp_admin_newsletter_settings_enabled filter handling; the newsletter settings page is always loaded from the newsletter package. [#48092]
- Remove load of plugin-conflicts-guardian feature. Seems to be causing issues. [#49108]
- Remove the Classic block deprecation experiment and the Classic block inserter support sticker, since the deprecation was removed from Gutenberg. [#51144]
- Remove the COLOURLovers background deprecation notice from the Customizer now that COLOURLovers support has been discontinued. [#50012]
- Remove the deprecated start-writing launchpad checklist and its remaining task handling. [#50432]
- Remove the empty agency-managed and wpcom-site-menu feature stubs, which contained only a docblock and were never loaded. [#49449]
- Remove the orphaned wpcom-fiverr feature; the Fiverr logo maker CTA is provided by the wpcom-options-general feature. [#49504]
- Remove the React version hotfix that pinned react/react-dom/react-jsx-runtime to 18.3.1; the underlying Gutenberg CDN-cache issue is resolved and WordPress.com now ships React 19. [#49391]
- Remove the Tools > Marketing page and its menu item. Old links to it now go to the dashboard. [#52195]
- Remove the transitional Subscribers announcement page from the Jetpack menu. [#51906]
- Remove the WPCOM Smart Dictation editor feature. [#51823]
- Remove unnecessary unminified JS. [#50130]
- RTC: Remove welcome modal hook. [#48823]
- Stop bundling the podcast package; Jetpack provides it on Simple and Atomic. [#52719]
- Tour Kit: drop the react-popper and @popperjs/core dependencies, which were only used by the now-removed tour UI. This unblocks the React 19 upgrade, since react-popper is archived and pinned to React 18. [#49343]
- Tour Kit: remove the unused tour UI. `WpcomTourKit` and `usePrefetchTourAssets` are kept as deprecated no-op shims; the NUX hooks, contexts, and constants are retained. [#49342]
- Write editor: remove the beta disclaimer banner warning about possible data loss. [#50707]

### Fixed
- Admin bar: Fix site name and wpcom account menu item height. [#51706]
- Admin bar: fix spacing of the site plan submenu node by matching core's margin-top instead of zeroing padding. [#49848]
- Admin bar: hide the house dashicon when site icon is set [#50531]
- Admin bar: make the Plan badge in the site-name dropdown a clickable link on all sites, including Atomic. [#49611]
- AI Launchpad: Accept AI output that leaves optional fields null or empty, retry failed network requests and list saves, show an error with Try again instead of an unsaved list, keep the wizard instead of saving the fallback list when the user leaves mid-tailoring, log why a reply was rejected, and record Tracks events for failed and abandoned saves. [#53239]
- AI Launchpad: Celebrate finishing Site Setup before sending people to the Dashboard, and remove its menu as soon as the site is launched or the last task is done elsewhere. [#53601]
- AI Launchpad: fix QA-reported broken flows — persist skipped tasks so they survive reloads and count toward completion, make the Subscribe-block task completable (published content and widgets count, CTA points at the editor), hide the Dashboard Site Setup widget when the AI Launchpad supersedes it, drop the Site Setup screen once every task is completed or skipped, and on Simple sites route plugin-task CTAs (Install/Activate WooCommerce and any task landing on a wp-admin plugins screen) to the Calypso plugin page instead of the unreachable wp-admin plugins screen. [#50238]
- AI Launchpad: give the launch task a working CTA to the WordPress.com launch flow. [#49787]
- AI Launchpad: move the Site Setup menu item to the top of the sidebar, decode HTML entities in the wizard prefill and site preview title, and collapse id_map twin tasks onto a single id. [#50704]
- AI Launchpad: navigate Calypso-relative task CTAs to wordpress.com instead of the site host. [#49787]
- AI Launchpad: replace the WooCommerce "Launch your store" task with the canonical "Launch your site" task, whose CTA opens a working launch flow and completes reliably (the old task dead-ended in the WooCommerce onboarding task list and could not complete when the guided setup was skipped). [#50268]
- AI Launchpad: Tailor the setup list only when the wizard is finished, instead of on every typing pause. [#53166]
- AI Launchpad: write the created pages and the AI-generated drafts in the site's own language on WordPress.com Simple, and stop a wizard left unfinished from saving a task list built from half-typed answers. [#52569]
- Backup: Load translations for the Backup page. [#53513]
- Block editor: Stop saying a published post is live while the site is Coming Soon, and link to the Site visibility setting. [#52427]
- Code Block: fix fatal error when the `register_block_type_args` filter returns false to cancel block registration. [#50846]
- Custom CSS: stop PHP 8 fatal when LESS input contains a stray closing brace. [#49234]
- Customizer: Send blog_id with the Tracks event recorded when the Customizer is opened from the front end. [#51818]
- Defer Reader_Link::init() to wp_loaded to avoid fatal errors when hooking show_admin_bar before $wp_query is initialized. [#48145]
- Ditcation tool caching logic [#48637]
- Embeds: Fix wp.me shortlinks to Atomic sites not rendering a rich preview. [#53037]
- Ensure that the Medium importer name is translated correctly. [#50654]
- Expiry notices: Avoid a fatal error on the front end when another plugin or theme disables the WordPress.com banners. [#52696]
- Expiry notices: Keep the front-end banner fixed when component styles load. [#52185]
- Expiry notices: Keep the info icon colored now that @wordpress/icons 16 draws it as strokes. [#52187]
- Expiry notices: only treat bundle purchases as the site plan, stop fetching the plan name from WordPress.com on every admin pageview, keep a dismissal to the site it was made on, and show the notice on agency-managed sites too. [#52139]
- Expiry notices: stand down on Simple sites while the Store Sandbox is enabled, so its test purchases are never reported as an expiring plan. [#52378]
- Expiry notices: stop offering a renewal to admins who did not buy the plan, since only the purchasing account can renew it. They now see why instead, and never the modal; that includes admins with no WordPress.com account, who previously got the legacy notice. The renewal link names the subscription, and every event carries an is_plan_owner prop. [#52083]
- Expiry notices: Treat a plan as expired, or a renewal attempt as missed, only once its whole day has passed, as billing does. [#52984]
- Feature Flags: read a site's flag overrides per blog, so a flag resolved on WordPress.com's public API answers for the requested site rather than the blog the process started on. [#52558]
- Fix block description links breaking inserter search by adding `toString` fallback. [#48215]
- Fix handling of non-array response in `wp_ajax_wpcom_generate_site_preview_link` [#51943]
- Fix the AI assistant dashboard banner layout on mobile so the copy reflows full width and the button stacks below. [#50074]
- JITM sidebar upsell + Daily Writing Prompt: restore flat button-link styling when `.button` and `.button-link` classes combine under WP 7.0's updated stylesheet order. [#48069]
- Launch: Do not show the pre-launch confirmation modal on trial sites, which still need to choose a plan and domain. [#51936]
- Launchpad: fix the WooCommerce "Launch your store" task opening an empty wc-admin page by pointing it at the canonical launch-your-store route. [#50327]
- Launchpad: Open newsletter setup tasks on the Settings tab. [#52990]
- Launch site: send the screen the launch started from as `back_to`, so the launch flow's Back button returns there. [#53117]
- Load JS translations for the Launch site admin-bar button to avoid it being rendered in English. [#50671]
- Omnibar: fix misaligned items on <480px width due to specificity loss [#51765]
- PayPal Payment Buttons: include PayPal's own error details when it rejects a partner referral, so a failed connection says what was wrong. [#51656]
- PayPal Payment Buttons: name the platform credential constants that are missing when an environment is only partly configured. [#51656]
- PayPal Payment Buttons: only register the onboarding endpoint while the API-managed buttons flag is on. [#51982]
- PayPal Payment Buttons: refuse to generate an onboarding link when the platform partner merchant ID is not configured, instead of failing later with an unrelated error. [#51656]
- PayPal platform endpoint: Authorize a blog by the tracking ID it onboarded the seller with, so a seller connecting a second site no longer breaks the first. [#53103]
- Phan: Address PhanPluginDuplicateConditionalNullCoalescing violations. [#48887]
- Plugin Conflicts Guardian: bucket the staged rollout on the WP.com blog ID so partial percentages enroll a real sample of sites. [#51392]
- Plugin Conflicts Guardian: defer logstash dispatch to shutdown so events from the activation-block path are no longer dropped before transmission. [#48787]
- Plugin Conflicts Guardian: log the correct WP.com blog ID instead of falling back to 1, widen the probe-token TTL so slow redirect chains no longer expire it, and stop misreading a cache-intercepted probe response as a fatal. [#49043]
- Plugin Conflicts Guardian: rename the logstash feature bucket to `atomic_plugin_conflicts_guardian`. [#48820]
- Plugins: Fix Empty cart and Save cart staying on checkout, instead of returning to Add Plugins, when Add Plugins was opened from another page. [#53595]
- Plugins: fix the Marketplace tab's plugin details modal rendering vendor layout markup, which overflowed the modal and ran the text together. Product images now appear under Screenshots, as they do for WordPress.org plugins. [#52335]
- Plugins: Send Marketplace plugins sold by their vendor to that vendor with the site attached, show "Start for free" instead of a price for them, hide prices on installed plugins' cards, and record Tracks events on the tab. [#52554]
- Plugins: Show the WordPress.com logo and heading on the Add New Plugin banner at their intended size. [#52853]
- Podcast: Hide the Jetpack > Podcast menu item on Atomic sites where the Podcast module is turned off. [#51409]
- Podcast: initialize the package for anonymous requests too so feed-customization hooks register for podcatcher crawlers (Apple Podcasts, Spotify, etc.) once the untangle filter is flipped on. [#48966]
- Premium Analytics: make the Simple admin menu label translatable by passing it to the package as a closure. [#50823]
- Prevent PHP warnings when handling malformed data. [#53126]
- Profile Settings: Point the WordPress.com links on wp-admin/profile.php to the matching my.wordpress.com settings pages. [#52754]
- RTC: Require Gutenberg before enabling real-time collaboration. [#49341]
- Show delete button on hover for video elements in the Write editor. [#48432]
- Show the transitional Subscribers announcement page under Jetpack → Subscribers on WordPress.com when the Newsletter modernization filter is enabled, instead of removing the entry entirely. [#49675]
- Site launch modal: left-align the domain upsell on mobile to match the rest of the modal. [#50544]
- Site Logo: Show the Site Editor or Customizer link in WP Admin General Settings even when no logo is set. [#50954]
- Site Setup: Show the loading spinner on the task button that was clicked (such as Skip) rather than always on the primary action. [#53226]
- Site visibility: Stop the site launch celebration modal from reappearing after saving Reading settings. [#51655]
- Stats: Allow users with multiple roles to view Stats when any assigned role is permitted. [#51514]
- Stats: Only show the site-name admin bar link when the Stats module is active. [#51693]
- Survicate: Suppress surveys while the Help Center is open on Atomic sites. [#48306]
- Themes: retry after a failed read of the WordPress.com theme list, rather than caching the failure for a day. [#53511]
- Verbum Comments: explain why commenting is unavailable when login is required but the login options cannot be shown, instead of offering a form that will be rejected. [#50396]
- Verbum comments: prevent theme label styles from breaking the email form fields. [#52840]
- wpcom-admin-menu: dedupe submenu reorder so a slug that's a substring of another doesn't register the same item twice (fixes Podcasting appearing twice under Jetpack). [#48645]
- wpcom-block-editor: Add missing script dependencies for remote editor assets. [#49414]
- Write: add horizontal padding to the resume-editing and beta banners on mobile so they no longer sit flush against the viewport edges. [#49071]
- Write: Allow adding text above a quote, such as a writing prompt, and fix quotes that split in two or could not be turned off. [#52934]
- Write: clear alt text input when re-opening the image inserter modal. [#48572]
- Write: clear a stale wpcom_user_id from localStorage on the logged-out editor so the Publish handoff to signup no longer mistakes the visitor for a logged-in user and drops the anonymous draft. [#49980]
- Write: close slash menu when no items match the filter or when trailing spaces are typed [#48421]
- Write: disable browser scroll restoration so the editor always starts at the top on refresh [#48937]
- Write: Don't update last-editor post meta when the post contains unsupported content [#48992]
- Write: Fix "Tell your story..." placeholder not showing on fresh editor load. [#48336]
- Write: Fix Backspace and figure deletion corrupting editor block structure. [#48357]
- Write: Fix heading and color dropdowns being trapped inside the toolbar on iOS Safari. [#49072]
- Write: Fix inline text color persistence and compatibility with block editor color picker. [#49015]
- Write: Fix jarring line reflow while typing caused by theme's text-wrap [#48311]
- Write: Fix link insertion with no text selected in Firefox [#48746]
- Write: fix publish status message showing "Updating…" instead of "Publishing…" for existing drafts [#48577]
- Write: Fix slash commands inside headings and blockquotes leaving behind command text instead of converting the block [#48491]
- Write: fix slash menu keyboard Enter not working on non-English sites [#48940]
- Write: Fix slash menu Tab key cycling and suppress hover highlight during keyboard navigation [#48337]
- Write: Fix video embeds not displaying after page reload on Simple and Atomic sites. [#48438]
- Write: Include image captions in block serialization. [#48395]
- Write: Keep indented list items when saving, so nested lists survive save, preview, and opening in the block editor. [#51191]
- Write: Keep selected text highlighted when turning a quote on or off, and let Undo reverse turning a quote off. [#53035]
- Write: Keep selected text visually highlighted while the link popover is open. [#48383]
- Write: normalize inline formatting tags (b, i, u, strike) so posts opened in the block editor don't show unknown-formatting warnings [#48914]
- Write: Prevent editing post content while image or video modal is open [#48387]
- Write: redirect to fresh editor when bfcache restores a published page, fixing grayed-out buttons on Atomic sites [#48705]
- Write: Run block-structure audit on post load so media-only posts have editable elements immediately, and avoid inserting duplicate empty paragraphs below non-editable blocks. [#48488]
- Write: Show "Please write something" instead of the server-side excerpt error when publishing or saving an empty post. [#48971]
- Write: show progress cursor (instead of not-allowed) on Save buttons while a save is in flight. [#49566]
- Write: Stop showing wp-admin notices, such as the plan expiry banner, behind the editor header. [#52605]
- Write: strip lone br placeholders in convertToBlocks to fix empty heading and blockquote block markup [#48544]
- Write: Switching between bulleted and numbered keeps the whole list as one block instead of splitting off the current item. [#49444]
- Write editor: allow spaces inside #tags (e.g. "#New York") by treating # as the tag delimiter instead of whitespace. [#49834]
- Write editor: caption is editable after reload (RSM-3359) [#48866]
- Write editor: dragging an image now moves it to the new position instead of duplicating it. [#49353]
- Write editor: Fix drag-and-drop image upload in the image modal. [#48393]
- Write editor: Fix link popover hidden behind toolbar when banners are visible [#48788]
- Write editor: fix logged-out topbar title crowding on mobile and block publishing an empty post [#50552]
- Write editor: Fix media modal closing when mouse drag moves outside the modal during text selection. [#48646]
- Write editor: fix missing browser tab title caused by hidden submenu page not being found by get_admin_page_title(). [#48659]
- Write editor: recover the UI when a save/publish request hangs or fails so Publish and Save no longer stay greyed out. A hung request is now aborted after a timeout, and prep-stage failures reset the saving flag and surface a retryable error. [#50641]

## [6.10.1] - 2026-04-10
### Changed
- RTC: Bump WebSocket gradual rollout to 100% on simple sites. [#48043]

### Fixed
- Post Notification Emails: handle Like-button clicks on Atomic/WoW sites by proxying to the new wpcom/v2/email-like endpoint, restoring parity with Simple sites. [#48021]

## [6.10.0] - 2026-04-09
### Added
- Add AI assistant banner to the WordPress.com dashboard for Business/Commerce sites. [#47623]
- Add Central Forms Management feature flags for percentage-based rollout on both Simple and Atomic sites. [#47757]
- Add disable-central-forms-management blog sticker to opt out individual sites from CFM. [#47822]
- Add the Help Center files to `/forums`. [#47028]
- Add wpcom-dashboard feature with holdout experiment support. [#47548]
- Agents Manager: Add agents_manager_agent_id filter to allow host applications to specify a custom workflow agent. [#47860]
- Agents Manager: Add dedicated CIAB variant. CIAB environments always load Agents Manager regardless of the unified experience setting, using the new 'ciab' variant for connected sites and 'ciab-disconnected' for disconnected sites. [#47314]
- Agents Manager: Add rel="noopener noreferrer" to admin bar links that open in a new tab. [#47780]
- Agents Manager: Add user, site, and section data to agentsManagerData for standalone operation without Help Center. [#46763]
- Agents Manager: Enqueue standalone agents manager app. [#46419]
- Dashboard: Restrict layout to two responsive columns for holdout treatment group. [#47563]
- Enable newsletter settings package for sites with the newsletter-package-202603 sticker. [#47509]
- Gutenberg RTC: Add PingHub provider for real-time collaboration WebSocket connections. [#47421]
- Gutenberg RTC: Add support for HTTP polling provider as an allowed real-time collaboration provider. [#47485]
- Gutenberg RTC: Connect to PingHub WebSocket directly using a server-generated JWT token, replacing the iframe-based proxy and fixing real-time collaboration on custom-domain sites with third-party cookie restrictions. [#47556]
- Gutenberg RTC: Enable Real-Time Collaboration feature for sites with the REAL_TIME_COLLABORATION feature. [#47512]
- Help Center: Enqueue the Help Center for logged out users on support sites with the Odie answers feature enabled. [#46615]
- Launch Site: Standardize launchpad widget launch task entry point with ExPlat experiment variations. [#47832]
- Load the Help Center for logged-out users on `/support`. [#46953]
- Reader: Require Jetpack Newsletter package. [#46783]
- RTC: Add branded editor notices and room-limit enforcement for real-time collaboration. [#47681]
- RTC: HTTP-polling ramp up for WoW sites. [#47718]
- Support linking back to my.wordpress.com domain. [#46559]
- Survicate: Add survey integration for wp-admin, block editor, and site editor. [#47107]
- Unregister the Gutenberg RTC setting on the Writing page if there are no RTC providers. [#47403]
- Verbum Editor: Allow logged-in users to get embed info. [#46824]

### Changed
- Abort load and log if required asset files are missing. [#46665]
- Add AGENTS.md and CLAUDE.md for Agents Manager feature. [#47762]
- Add dev mode to Agents Manager. [#46617]
- Add Help Center backend documentation and testing steps. [#47562]
- Add tracking for GS on Personal edge cases. [#46703]
- Admin Bar: use Urls::maybe_add_origin_site_id from the Connection package, deprecate local maybe_add_origin_site_id_to_url function. [#46783]
- Admin Menu: simplify Hosting menu to a single link, and centralize Upgrades menu registration for all admin interfaces. [#47146]
- Agents Manager: Add lightweight help icon linking to the Help Center for disconnected Jetpack views when unified experience is enabled. [#47088]
- Agents Manager: Make is_enabled() a public static method so consumers can check enablement without duplicating filter logic. [#47302]
- Agents Manager: Make should_display_menu_panel() respect the agents_manager_use_unified_experience filter. [#47041]
- Agents Manager: Replace unified-big-sky query string flag with a new agents_manager_enabled_in_block_editor filter, hooked by Big Sky, to enable Agents Manager in the block editor. [#47277]
- Calypso Origins: Add my.woo.ai and my.woo.localhost to known origins. [#47181]
- CelebrateLaunchModal: Update domain upsell CTA copy to "Get your domain" for free plan + free domain sites. [#47841]
- Change the experiment name. [#47155]
- Code Block: Disable contrast checker warning for enhanced Code block. [#46614]
- Dotcom Dashboard: Redesign the celebrate launch modal with Core styles. [#47585]
- Enable the enhanced code block by default.
- Enable wp-admin newsletter settings for all wpcom sites instead of gating behind the newsletter-package-202603 sticker. [#47750]
- Increase Central Forms Management rollout to 100% of WordPress.com sites. [#47811]
- Increase Central Forms Management rollout to 50% of WordPress.com sites. [#47793]
- Launch Site Masterbar Button: Reload page if launching from WP Admin. [#47986]
- Launch Site Standardization: Update experiment name and variants. [#48018]
- Launch Site: Implement direct site launch from the WP Admin masterbar button via an ExPlat experiment, with a shared mutation hook and celebration modal for use across launch entry points. [#47963]
- Launchpad: Reorder build checklist tasks. [#46546]
- LessCSS: Reduce time complexity. [#46743]
- Move RTC notices feature to the jetpack-rtc package. [#47964]
- Reading settings: Add standardized site launch options. [#47839]
- Removed the RTC enabled check before loading the notices endpoint. [#47774]
- RTC notices: Remove duplicated site editor and option checks, rely on RTC::is_enabled() instead. [#47867]
- RTC: Bump WebSocket gradual rollout to 20% on Simple sites. [#47934]
- RTC: Bump WebSocket gradual rollout to 50% on simple sites. [#47972]
- RTC: Change visibility of welcome modal. [#47733]
- RTC: Enable when WordPress 7.0+ is detected without the Gutenberg plugin. [#47926]
- RTC: Gradual rollout – 100% of WoW sites and 5% of Simple sites. [#47831]
- RTC: Increase HTTP polling rollout to 25% of WoW sites. [#47768]
- RTC: Increase HTTP polling rollout to 5% of WoW sites. [#47747]
- RTC: Increase HTTP polling rollout to 50% of WoW sites. [#47814]
- RTC: Load feature for local users. [#47738]
- RTC: Start gradual rollout via WS on 1% of Simple sites. [#47751]
- Site Launch Button: Add wp-admin ref parameter for redirecting back from Calypso. [#47638]
- Switch to Native TypeScript compiler based on Go. [#47375]
- Tracking now knows when we're on forums vs support. [#47480]
- Update dependencies. [#47472]
- Update Help Center menu panel experiment name. [#46561]
- Update package dependencies. [#46552] [#46647] [#46716] [#46854] [#47002] [#47099] [#47173] [#47247] [#47285] [#47300] [#47371] [#47496] [#47684] [#47686] [#47890] [#47899] [#47998]
- Update the experiment that loads the Help Center for logged-out users on. [#47445]
- Updated newsletter settings links in Launchpad and admin menu to use centralized URL utility from newsletter package. [#47347]
- Use new Agents Manager state endpoint in Agents Manager. [#46937]
- Use the Global Styles on Personal feature flag before checking experiment variation. [#46547]

### Deprecated
- Show a warning on the customizer for WPCom if the user is using a colourlovers background image. [#41538]

### Removed
- Remove obsolete hotfixes for WordPress 6.7. [#46843]
- Remove the dotcom command palette. [#46579]
- RTC: Move implementation to generic package. [#47713]

### Fixed
- Add cache breaking mechanism to fix React cache error. [#47766]
- Agents Manager: Allow plugins to enable the agents manager unified experience via filter. [#47315]
- Agents Manager: Fix JavaScript conflicts with WooCommerce checkout and other plugins by preventing unnecessary script loading on irrelevant screens. [#46721]
- Agents Manager: Prevent loading in previews. [#46742]
- AI Assistant Banner: Hide banner when the AI assistant is already enabled via big_sky_enable option. [#47915]
- Block Description Links: Fix missing Help Center link for blocks with variations like core/heading. [#47077]
- CIAB Editor: Ensure Help Center Gutenberg CSS can be loaded. [#47110]
- Compatibility: Clean up deprecated CSS. [#47067]
- Disable Real-Time Collaboration on the WordPress.com desktop app to prevent editing issues caused by an incompatibility. [#47797]
- Enhance code block only when content attribute is registered. [#46544]
- Exclude e2e test sites from Central Forms Management rollout. [#47801]
- Fix AI assistant banner dismiss button not persisting or firing tracks event, and hide banner for AI Tips unsubscribers. [#47710]
- Fix e2e test site exclusion from Central Forms Management on Atomic sites. [#47815]
- Fix helpCenterFeatureFlags and helpCenterData redeclaration error in CIAB admin. [#47541]
- Fix Newsletter menu on Simple sites to open in-admin settings when enabled instead of external URL. [#46787]
- Fix TypeScript type errors in verbum-comments for tsgo compatibility. [#47408]
- Global Styles: Load the feature on the customizer to fix access checks for additional CSS. [#46675]
- Help Center now loads in the editor of /support. [#47661]
- Image Studio: Revert PR to disable big-sky-plugin in Forno-229. [#47529]
- Improve Code block loading performance. [#46589]
- Launch button: Load celebration modal bundle CSS and wp-components on the front end so styling matches wp-admin. [#48012]
- Remove CSS nesting to prevent warnings in some CSS processors. [#46658]
- RTC Notices: Fix image URLs on Simple sites by importing public-path to set webpack publicPath correctly. [#47769]
- RTC Notices: Restore Gutenberg's native "Too many editors connected" modal on sites where branded limit notices are disabled. Fix room limit enforcement for PingHub provider by using awareness join timestamps instead of unpopulated collaboratorInfo. [#47813]
- RTC: Enforce peer limit per post instead of globally across all posts. [#47919]
- Sidebar Notice: Fix passing JSON string instead of array to JITM get_messages(). [#46906]
- Temporarily disable client-side media processing to prevent cross-origin isolation headers from breaking authenticated API requests. [#47416]
- Translate the title of the Name profile section. [#47666]
- Update misleading WordPress.com importer banner copy on WP-Admin Tools > Import page. [#47278]
- Verbum Comments: fix backslashes being stripped from comments. [#47059]
- Verbum comments: Fix incorrect hovercard i18n key for 'Gravatar not found' error; add translation string for private profile error state. [#47594]
- Verbum Editor: Fix editor focus on edit comment screen. [#47184]

## [6.9.0] - 2026-01-09
### Security
- Implemented a guard against non user objects when assigning an experiment variation [#45929]

### Added
- Initialize ExPlat Proxy in Jetpack Mu Wpcom. [#46066]
- Add Agents Manager admin bar menu with icon support and menu panel integration. [#46343]
- Add Agents Manager feature with REST API endpoints for managing agent state and preferences. [#46086]
- Add block transform from core/html. [#45978]
- Added global styles experiment group check for atomic sites. [#45797]
- Added learn more links in the editor to a few blocks. [#46177]
- Added query parameter to detect when Calypso navigation is coming from wpcom admin bar. [#46193]
- Adds a new hook to get async loaded agent providers in the frontend. [#46176]
- Add Tracks events to theme screens. [#45587]
- Agents Manager: implement logic to toggle unified chat experience. [#46237]
- A new variant of the Help Center specifically for CIAB admin. [#46327]
- Code block: Fixes and improvements to the unreleased code block. [#46418]
- Custom HTML Block: Add warning notice when using restricted HTML tags on WordPress.com Simple sites. [#45819]
- Help Center: Add menu panel for experiment in wp-admin and editor. [#45699]
- Help Center: Check for the new menu panel experiment. [#45899]
- Holiday Snow: Add speed and hemisphere settings. [#46139]
- Introduces setting for controlling the Attachment pages to media options in wp-admin. Controls the `wp_attachment_pages_enabled` option via checkbox. [#40590]
- Unreleased code block: Add raw transform. [#45976]
- Unreleased code block: Add transform to syntax highlighter. [#45982]
- Untangling: Add Marketing Tools page to wp-admin. [#45216]

### Changed
- Add icons to the new Help Center menu panel. [#45728]
- Adds caching to the experiment checking in the help center. [#45927]
- Atomic sites: Display site visibility in wp-admin settings based on the privacy model instead of the 'blog_public' option value. [#45510]
- Change the unreleased code block to enhance core/code instead of being an independent block. [#45389]
- Code Block: Ensure Core Script Modules actions are safely removed and restored. [#45357]
- Code block: Remove active line highlight when block is unselected. [#45828]
- Code block: Remove experimental warning. [#45827]
- Don't translate product names. [#43961]
- Launch Celebration: Remove direct dependency on @automattic/components. [#45716]
- Limit persisted Help Center history stack to 50 entries. [#45564]
- My Home Suggestions Card: Update find other domains link to /setup/domain-and-plan flow. [#45507]
- Replace use of confusing `esc_js` with `wp_json_encode`, or with nothing where it had no effect. [#46229]
- The Help Center search endpoint is changing, we need to update the URL. [#46046]
- Unreleased code block: General fixes and improvements. [#45996]
- Updated experiment key for Global Styles A/B/C experiment. [#46019]
- Updated the experiment name. [#46001]
- Update limited Global Styles notices with easier style resetting options. [#46257]
- Update package dependencies. [#45652] [#45750] [#45751] [#45752] [#45755] [#45757] [#45915] [#46066] [#46082] [#46143] [#46244] [#46456] [#46491]
- We now include the experiment variation in the global styles status response. [#46025]

### Fixed
- Agents Manager: Add caching and proxy protection for unified experience preference check to avoid remote API calls on every page load. [#46368]
- Code block (unreleased): Improve styling and layout reliability across for different themes. [#45898]
- Ensure proper flags are used with `json_encode()`. [#46092]
- Fix an issue with Firefox where `getComputedStyleMap()` causes an undefined function error. [#46174]
- Fixed the set default behavior for newly added categories. [#45840]
- Fixed wpcom_theme_switch tracking not working on Simple sites. [#45604]
- Global Styles: Fix exempt logic for Summer Special blog sticker. [#45919]
- Global styles Gating: Fixes a case where GS use was not detected in the editor. [#45943]
- Gutenberg removed the feature used to render the improved code editor. Fix it by switching to an alternate implementation. [#46127]
- Help Center: Add `bot_slug` flag to support interaction requests. [#45619]
- Help Center: Allow underscores in botnames. [#45700]
- Help Center: do not download external assets on boot. [#45718]
- Help Center: Enqueue in CIAB admin. [#45768]
- Help Center: fix accessing stored preferences of open state'. [#46388]
- Help Center: pass the is_test_mode along to WPCOM. [#45603]
- LESS: Clean up various issues in legacy library. [#46057]
- Prevent warnings when constants are already defined. [#46058]
- Suggestion widget: make sure the domain stays aligned in any screen resolution. [#45826]
- Unreleased code block: Ensure PRE element does not break scroll behavior. [#46014]
- Unreleased code block: Fix an issue where content generated by the regular code block would not be rendered with the enhanced code block enabled. [#45850]
- Unreleased code block: Restore language- prefix to language class. [#46010]
- Uploads of heic in the block editor. [#45426]
- wpcom-imports: Load the JS translations. [#45686]

## [6.8.1] - 2025-10-10
### Changed
- Enable Global Styles limited on Atomic sites. [#45459]

### Fixed
- Fix Launchpad free plan check warning. [#45451]

## [6.8.0] - 2025-10-10
### Added
- Add Code block (experimental). [#45181]
- Admin Menu: Add P2 menu overrides. [#45355]
- Admin Menu: Register "Jetpack > Traffic" on Simple sites. [#44658]
- Enqueue Help Center in next-admin. [#44304]
- Newspack blocks: Load feature on agency sites. [#44906]
- Add the Help Center to `/support` homepage. [#44556]

### Changed
- Add Medium, Squarespace, and Wix importers in WP Admin import page. [#44860] [#44909]
- Admin Menu: Move "Hosting > Marketing" to "Tools > Marketing". [#44663]
- Admin Menu: Move "Settings > Newsletter" to "Jetpack > Newsletter". [#44630]
- Admin Menu: Register Jetpack > Activity Log on default interface. [#44733]
- Change the Help Center to be runnable as a standalone plugin. [#45354]
- Clean up the code for quick switcher after RDV. [#45353]
- Disable the Calypso quick switcher on the import page. [#45017]
- Global Styles: Move frontend notice from launch bar to admin bar. [#45417]
- Improve description of "private site" feature. [#44905]
- Launchpad: Link to domain-and-plan flow within domain_upsell task. [#45360]
- Launchpad: Update social tasks to open Jetpack Social. [#45160]
- Send JSON with built-in WordPress functions. [#45002]
- Update dependencies. [#45096]
- Update the TypeScript version to be the same as monorepo. [#44795]
- Update package dependencies. [#44677] [#44701] [#44948] [#45027] [#45097] [#45173] [#45200] [#45229] [#45298] [#45334] [#45430]
- Verbum Comments: Optimize block filtering performance using Block_Scanner for fast pre-filtering when all blocks are allowed. [#44996]

### Removed
- Admin Menu: Remove Hosting > Marketing. [#45041]
- Calypsoify: Remove package. [#45356]

### Fixed
- Add plugin header to the Help Center plugin file. [#45401]
- Admin Menu: Fix duplicate Jetpack submenus. [#45131]
- Newsletter launchpad: Add import steps when goal is `import-subscribers`. [#44853]
- Remove broken menu items for Atomic Personal/Premium sites. [#44699]
- Settings -> General: use correct https scheme for site URLs in Simple sites. [#44991]
- Update logos in banner used for Dotcom Marketplace. [#45073]

## [6.7.0] - 2025-08-05
### Added
- Add a Callout page for Tools > Site Health on Simple Sites. [#44498]
- Add support for new CSAT endpoint. [#44029]
- Add tracking for launch flow. [#43859]
- Admin Menu: Add "Dashboard > Updates" screen to Simple sites. [#44024]
- Admin Menu: Add "Export/Erase Personal Data" menus to Simple sites. [#44430]
- Admin Menu: Register "Jetpack > Monetize" menu on all sites. [#44216]
- Code editors: Add advanced code and CSS editors. [#44232]
- Proxy open state for the Help Center. [#44494]
- Simple Payments block: Add support link for WP.com. [#43891]

### Changed
- Admin Menu: Consolidate "Dashboard" and "My Home" menus. [#43983]
- Admin Menu: Register "Jetpack > Subscribers" menu on all sites. [#44302]
- Admin Menu: Show "Jetpack > Podcasting" menu on all sites. [#44367]
- Admin Menu: Show "Jetpack > Stats" to Calypso users. [#44090]
- Improve performance of WordPress.com comment likes by caching and minimizing API requests. [#44205]
- JITM: Improve caching and minimize multiple requests in sidebar. [#44130]
- Launchpad: Update `plan_selected` to be the first item. [#43945]
- Make the Plans sub-item of the WordPress.com admin bar clickable. [#44165]
- Stats: Extend access to administrator, editor, author, contributor roles on WordPress.com. [#44194]
- Post editor: Open WP.com support articles in Help Center. [#43883]
- Script Data: Ensure we only add host information on the front-end for P2 and sites using Verbum Comments. [#44241]
- Settings: Open support links in Help Center. [#43930]
- Update Newspack Blocks to 4.13.1. [#44096]
- Update package dependencies. [#44020] [#44148] [#44151] [#44356]
- Open learn more link in the Help Center in WordPress.com. [#43949]
- Change "Block guide" label to "Learn more". [#44221]

### Removed
- Remove Dashboard link from Jetpack admin menu. [#44565]
- Remove unused language files after #42172, #42494, #42521, and #42550. [#44106]
- Remove Core's help tab in WP Admin in favor of the Help Center in WordPress.com. [#44107]

### Fixed
- Accessibility: Update screen reader 'clip' property usage to 'clip-path'. [#44027]
- Forms: Exclude Salesforce lead form on WordPress.com. [#43915]
- Handle robots.txt when data passed to `robots_txt` filter is malformed. [#44529]
- Phan: Clean up error due to errant file reference. [#44031]
- Fix Odie message summaries. [#44352]

## [6.6.0] - 2025-06-09
### Added
- Persist the Help Center Router state in user preferences. [#43826]

## [6.5.0] - 2025-06-06
### Changed
- Update `Edit homepage` banner design and copy. [#43643]

### Removed
- Launchpad: Remove "Select a design" step from build task list. [#43820]

### Fixed
- Prevent disallowed blocks from being used inside inner comments. [#43573]

## [6.4.0] - 2025-06-03
### Added
- Add a site badge and the site plan to the admin bar. [#42499]
- Add Gravatar profiles to comments email field. [#42458]
- Add Gravatar Quick Editor to the settings button when logged in. [#43284]
- Enable Global Styles Additional CSS for users that purchased the Custom Design Addon. [#43554]
- Forms: Add Jetpack submenu item for forms dashboard. [#43527]

### Changed
- Consolidate widget-related code from wpcom and wpcomsh into jetpack-mu-wpcom. [#42974]
- Stop restricting manage subscribers task to importing goal for newsletter launchpads. [#43687]
- Rename a variable used on the import page for clarity. [#42646]
- Site Visibility: Disable search engine indexing for sites with wpcomstaging.com domain. [#42853]
- Update package dependencies. [#43071] [#43326] [#43398] [#43400] [#43578] [#43711] [#43718] [#43734]
- Update labels and order for newsletter launchpad tasks. [#43283]

### Deprecated
- Remove default pages (About and Contact) for legacy-fse themes. [#43032]
- Remove `default_rendering_mode` hotfix. [#42984]

### Removed
- Remove remaining Jetpack RDV experiment code now that the reshare feature is live. [#43063]
- Remove links to deprecated calypso views on the launchpad tasks. [#42923]
- Subscriptions: Load dashboard widget directly from the Jetpack plugin instead of from mu-wpcom. [#42964]

### Fixed
- Check for classes and methods before call. [#43606]
- Code: Remove unneeded `data:` URI components. [#43227]
- Code: Update stylesheets to use hex instead of named colors. [#42920]
- Code: Update stylesheets to use WordPress font styles. [#42928]
- Fix misaligned cookie consent switch. [#42977]
- Fix the style of the Gravatar hovercard. [#43207]
- Fix wrong status showing as coming soon. [#43160]
- Help Center: Update support for multiple statuses in endpoint. [#43538]
- Hide launch button for blog_id 1. [#43228]
- Launchpad checklists: Mark "migrate content" task complete when importing content. [#43344]
- Linting: Address final rules in WordPress Stylelint config. [#43296]
- Linting: Do additional stylesheet cleanup. [#43247]
- Linting: Fix more Stylelint violations. [#43213]
- Linting: Format SCSS imports consistently. [#43018]
- Linting: Remove outdated vendor prefixes in stylesheets. [#43219]
- Linting: Use double colon notation for pseudo-element selectors. [#43019]
- Load translations for JS files in jetpack-mu-wpcom. [#43373]
- Move "I Voted" widget from wpcomsh to jetpack-mu-wpcom. [#42924]
- MU WPCOM: Fix PHP warning generated by the get_term_classes function in the newspack-blocks. [#43271]
- Prevent import processes from marking the first post published tasks complete in launchpad. [#43303]
- Remove packages/forms dependency from jetpack-mu-wpcom-plugin. [#43627]
- Update incorrect Tracks events names. [#43329]
- Update launchpad add_subscribe_block tasks completion criteria and Calypso url. [#43172]
- Fix Verbum rendering in Homepage query loop. [#43087]

## [6.3.1] - 2025-04-07
### Added
- MU plugin feature to add custom CSS for edge cases. [#42898]

### Changed
- Code: First pass of style coding standards. [#42734]

## [6.3.0] - 2025-04-04
### Added
- Enabled the RDV treatment group for everyone. [#42765]

### Removed
- Removing unused files from the "What's New" package. [#42893]

## [6.2.0] - 2025-04-02
### Security
- Verbum: Call `wp_die` if nonce check fails. [#41466]

### Added
- Add "Create course" task list. [#42108]
- Add a new function that returns the upsell plan based on the what plan is required by Global Styles. [#42471]
- Add domain upsell button to `options-general.php`. [#42171]
- Add Fiverr logo maker link in general settings. [#41173]
- Add general, writing, reading, discussion settings screens to duplicate views list. [#40913]
- Add intent-newsletter-goal tasks for newsletter goal in `/setup/onboarding`. [#41158]
- Add Jetpack > Podcasting menu Item. [#42174]
- Add Like quick link on each comment when using WP Admin. [#41475]
- Add newsletter widget to the dashboard. [#41807]
- Add Site Launch button to the admin bar. [#41240]
- Add Site Management Panel link to General Settings page [#41497]
- Add subscribers in WP Admin boiler plate. [#42066]
- Add support link to block description for Grid block. [#41256]
- Add the ability to like own comments on Atomic sites. [#42300]
- Admin bar: Add "My WP.com Account" profile submenu. [#42058]
- Admin bar: Bring back updates and comments menu. [#42146]
- Admin bar: Make leftmost menu more closely match Core behavior. [#42099]
- Admin bar: Track clicks on launch button. [#41425]
- Allow uploading media from URL in Media Library. [#41089]
- Bump a Tracks stat for every WP Admin page view. [#42422]
- Comments: Add dark mode. [#41505]
- Comments: Use Verbum on comments containing block mark-up (simple sites only). [#42022]
- Dashboard: Add Daily Writing Prompt widget. [#41094]
- Dashboard: Add general tasks widget. [#41150]
- Dashboard: Add launchpad. [#41434]
- Dashboard: Add site preview and links. [#41106]
- Help Center: Add endpoint to persist open state. [#41126]
- Import Media: Introduce the Import Media page [#41032]
- Importer: Fix guided importer banner URL to use site-migration flow [#42693]
- Importer: Show wpcom importer banner on atomic sites [#42693]
- Launchpad: Add "Verify Email" and "Add First Subscribers" tasks. [#41502]
- Launchpad: Add `updated_write_tasklist` flag for testing changes. [#42272]
- Launchpad: Add tasks for `sell` intent. [#41804]
- Launchpad: Allow checklists to be based on site goals. [#41944]
- Media Library: Add Tracks events to Upload from URL feature. [#41620]
- Media Library: Support Upload from URL on media-new page. [#41627]
- Newsletter Dashboard Widget: Remove feature flag and enable widget. [#42276]
- Pages: Add notice for homepage editing. [#42343]
- RDV: Add `upload.php` to the list of duplicated pages. [#41720]
- RDV: Add possibility to override and reset the experiment variation. [#41179]
- RDV: Implement A/A test. [#41093]
- Show site address and WordPress address on Simple. [#41208]
- Untangle Calypso: Enable the feature on both `upload.php` and `media-new.php`. [#41709]

### Changed
- Add "Verify Email" task to newsletter goal launchpad. [#41298]
- Add export media files under tools [#42691]
- Add goals prop to wpcom_launchpad_mark_task_complete event. [#41889]
- Add logic for handling Global Styles on Personal experiment assignment. [#41132]
- Add Plans::get_plan_short_name() for WPCOM environments. [#42485]
- Add query param to the wordpress.com login url. [#41246]
- Add Reader text to the masterbar icon to match Calypso. [#42071]
- Add URL hash to "Build your audience" task action. [#41299]
- Admin Bar: Point the Edit Site menu item to `site-editor.php`. [#41137]
- Always loads Odyssey Stats widget regardless of wpcom_admin_interface. [#40992]
- Block Editor: Do not show first post modal when the publish-first-post hash is present. [#41618]
- Block Editor: Fix performance regression. [#41309]
- Change the experiment cache key so that users get assigned once the experiment starts. [#41383]
- Code Quality: Update deprecated block editor API usage. [#41176]
- Code: Use function-style exit() and die() with a default status code of 0. [#41167]
- Coming Soon: Add more checks to the ETK version comparison. [#41273]
- Disable assigning and caching the global styles on personal experiment variation until we set up a new experiment. [#41999]
- External Media: Move the external media import page to jetpack-external-media. [#41282]
- Hide "Verify Email" launchpad task for existing users. [#41326]
- Hide suggested tags on P2. [#41781]
- Hide the Import banner when actually running the import tool. [#42621]
- Improve the import page by fixing the position of the Notice component and adding a color to it to not look disabled. [#42414]
- Initialize the value to an empty array when empty preferences are received. [#41688]
- Launchpad: Block design button for users of the treatment_cumulative group on an experiment. [#41726]
- Launchpad: Disable "Launch Site" task for launched sites. [#41327]
- Launchpad: Include a hash to identifier for hosting tasks. [#41377]
- Launchpad: Remove updated_write_tasklist param. [#42560]
- Launchpad: Replace newsletter preview task with launch task. [#41344]
- Launchpad: Show "Site Title" task in updated write launchpad. [#42410]
- Launchpad: Update "Select a Design" step, allowing user to interact with it. [#41952]
- Launchpad: Update copy for adding subscribers to a site. [#41820]
- Launchpad: Update tasks so sites created through onboarding have different design task links. [#42145]
- Launchpad: Use heuristic for "Verify Email" task visibility, regardless of experiment cohort. [#42193]
- Live Preview: Do not change the homepage when previewing a theme in the Site Editor. [#42388]
- Move logo-tool to be within jetpack-mu-wpcom. [#42598]
- Newspack Blocks: Check to avoid warnings when accessing attachment image src. [#42290]
- Newspack Blocks: Update from v4.5.2 → 4.7.0. [#42223]
- Prevent site owner from editing user's account-level fields. [#42177]
- Profile: Make WordPress.com links more concise. [#41943]
- RDV: Enhance notices. [#40996]
- Reader: Update URL from `/read` to `/reader`. [#41477]
- Render the Global Styles frontend bar separately from the WordPress.com launch bar. [#40876]
- Restore the code that assigned global styles on personal variations and added the new experiment code. [#42062]
- Site Visibility: Port the site visibility settings from Calypso to WP Admin. [#42230]
- Theme: Clean up files that were used during the theme switch and theme preview [#42420]
- Update `/settings/general` url to `/sites/settings/site` for classic style users. [#41776]
- Update background pattern image [#40983]
- Update copy on the WordPress.com duplicate view pop ups to include link to learn more. [#41622]
- Update dependencies. [#41003] [#42564]
- Update minimum PHP version to 8.1. [#41928]
- Update package dependencies. [#41099] [#41286] [#41491] [#42163] [#42384] [#42511] [#42809]
- Update Site Settings link copy. [#41663]
- Update the design of the coming soon page. [#41499]
- Update the Import Page notice, improving the text to make clear you can fully import a WordPress site or contents from other platforms. [#42628]
- Use the control group as discriminator for enabling Global Styles on Personal experiment. [#41353]

### Deprecated
- Remove customization for the start page options modal. [#41324]
- Remove global styles modal. [#40939]

### Removed
- Block editor: Remove hotfix for Gutenberg v19.0, v20.0 and v20.1. [#41915]
- Launchpad: Remove "About Page" task from Newsletter task list. [#41323]
- RDV: Delete notices. [#42144]
- Reader: Remove daily prompt modal from editor screen. [#41121]
- Remove the "Personalize Link in Bio" launchpad task. [#41949]
- Remove the "What's New" feature from the Help Center. [#42859]
- Remove the launch bar from the frontend of Atomic sites. [#41113]
- Removed start page pattern modal, defaulting instead to core behavior. [#41479]
- Stop using the custom welcome tour when the user creates a post for the first time, showing the core welcome guide instead. [#41258]

### Fixed
- Add `is_user_member_of_blog` check for launch button. [#41397]
- Launchpad: Add messages area anchor in `customize_welcome_message` task path [#41320]
- Add the launch icon to the launch site button. [#41908]
- Admin interface: Fix empty setting. [#42021]
- Caching fixes for RDV project. [#41378]
- Code: Remove extra params on function calls. [#41263]
- Comments: Fix broken editor. [#41734]
- Components: Prevent deprecation notices by adding `__next40pxDefaultSize` to controls. [#42677]
- Consolidate scripts for General Settings overrides. [#41295]
- Fix admin menu issues. [#41480]
- Fix "Celebrate Launch" modal translations. [#41467]
- Fix Classic Tour. [#41482]
- Fix first post modal styling for mobile view. [#42735]
- Fix Site Visibility link for duplicated view experiment users. [#41531]
- Refine Gutenberg 19.8.0 hotfix so site editor opens correct template by default. [#41110]
- Global Styles: Add hidden style under wpcom-global-style-view. [#41111]
- Patch a bug causing the Content block to output truncated HTML with Gutenberg 20.0.0 and WP 6.7.x. [#41333]
- i18n: Download updated translations for wpcomsh. [#42494]
- i18n: Load JS translations for 'wpcom-options-general.ts'. [#42131]
- i18n: Load language packs for Atomic Sites. [#42172]
- Link "Give your site a name" task to use wp-admin version. [#41867]
- Media Library: Ensure Upload from URL shows in the editor. [#41711]
- Media Library: Only load the Upload via URL form in admin screens. [#41848]
- Do not load ETK on agency sites on all pages. [#41272]
- Filter out the full-site-editing plugin from the active_plugins list if the plugin file doesn't exist. [#41887]
- Always show the launch site button in blueberry (modern) scheme. [#42605]
- Make email and password available on the `profile.php` on the default view. [#41945]
- Port the fix of the modern color scheme from WP 6.8. [#42462]
- Newspack Blocks: Fix perms issue with block.json files. [#42231]
- Remove the dashboard launchpad for Atomic. [#42147]
- Remove the Verbum Comments dynamic loader dependency on wp-polyfill. [#42391]
- Remove `options-general.php` from WPCOM_DUPLICATED_VIEW. [#41529]
- Site Visibility: Prevent accidental changes to blog_public on the Settings > Reading page. [#42716]
- Update endpoint routes. [#41424]
- Verbum: Fix broken block editor. [#41747]
- Verbum: Fix failing nonce checks. [#41985]
- Send appropriate tracks event for `verify_email` task. [#41624]

## [6.1.0] - 2025-01-10
### Added
- Add watch command for this package in composer.json file. [#40927]
- Add comments page to the list of untangled pages under the experiment. [#40649]
- CSS Tidy: Add css rule mask to allowlist. [#40655]
- Pages: Add quick actions to change the homepage and the posts page. [#40699]
- Post categories: Add quick action to change default category. [#40667]
- Remove duplicate views: Show notices. [#40609]
- WordPress.com Features: Add Holiday Snow functionality. [#40478]

### Changed
- Admin menu: Hide dashboard switcher when WP Admin view is enforced. [#40595]
- Holiday Snow: Switch to a CSS-only implementation. [#40629]
- Newspack Blocks: Update to version 4.5.2. [#40636]
- Remove the option to close upsell notification for custom styles. [#40520]
- Remove duplicate views: Enforce WP Admin for Pages. [#40706]
- Remove duplicate views: Redesign notices. [#40901]
- Use WP Admin for some sections while keeping some untangling changes. [#40479]
- Updated package dependencies. [#40564] [#40693] [#40792] [#40797] [#40798] [#40810]
- Use wp_add_inline_script. [#40465]

### Fixed
- Add a function_exists guard for `wpcom_is_duplicate_views_experiment_enabled` function. [#40708]
- Code: Clean up JSDoc comments. [#40578]
- Comments: Add cookie consent input and fix console error. [#40494]
- Exclude wpcom_admin_interface from the admin_menu action. [#40669]
- Fix lints following ESLint rule changes for TypeScript. [#40584]
- Fix several regressions for Stats, Blaze and notices for RDV experiment. [#40690]
- Fix migration key fetch failing when DIY migration page is reloaded. [#40270]
- Global Styles: Stop showing the limited global styles notice in distraction-free mode. [#40907]
- Gutenberg 19.8.0 hotfix: Don't show the template-locked rendering mode for pages. [#40664]
- Holiday Snow: Do not display on p2s. [#40519]
- Holiday snow: Replace SCSS `random()` with pregenerated arrays of random numbers to make builds reproducable. [#40666]
- i18n: Update the .mo and .po translation files. [#40362]
- Load WPCOM sidebar notice async. [#40422]
- Restore visited button color in themes.php to Core's default. [#40517]
- Starter page templates: Insert the pattern to the Content block correctly when rendering mode is template-locked. [#40583]
- Support adding a comment form inside a query loop. [#40933]
- wpcom-block-editor-nux: Avoid using useLocation which now throws exception outside Site Editor in Gutenberg 19.9.0. [#40656]

## [6.0.0] - 2024-12-04
### Changed
- Updated dependencies. [#40286]
- Updated package dependencies. [#40288] [#40363]

### Removed
- General: Update minimum PHP version to 7.2. [#40147]

### Fixed
- Add missing ids in Verbum EmailForm. [#40199]
- Block Support Links: Removed support links for the group block and varients, to avoid an issue with the group placeholder displaying the block descriptions incorrectly. [#40275]
- Coming Soon: update color of the banner to WordPress blue [#39966]
- Explicitly set `htmlFor` in recommended tags modal FormLabel. [#40199]
- Subscribe modal: fix an edge case reported by a user, where the site title shows character codes. [#40130]

## [5.66.0] - 2024-11-11
### Added
- Added a feature check to the Marketing Bar that updates the text and upgrade link for Global Styles [#40068]
- Enable test coverage. [#39961]
- Help Center: add new rest route for support interactions [#39978]
- Help Center: extend support interaction API [#40112]
- The notice and modal shown on the editor now displays the plan name and upgrade URL based on the GS gated plan type' [#40095]

### Changed
- Added feature check for the Global Styles on Personal plan changes. [#39986]
- Updated package dependencies. [#39999] [#40000] [#40060]

### Fixed
- Fix PHPUnit coverage warnings. [#39989]
- Help Center: fixed api typo [#39996]
- We now check if JP_CONNECTION_INITIAL_STATE is defined before accessing it when using Global Styles' [#39980]
- wpcom-block-editor: Support getting the canvas mode from the query string after GB 19.6 [#40045]

## [5.65.0] - 2024-10-29
### Added
- adding a WPCOM task [#39776]
- Add new task for domain connection to post-migration checklist. [#39680]
- Add new task for domain mapping in migration Launchpad [#39764]
- Adds JSON translation files [#39519]
- Adds the placeholder task list for the Migration flow [#39593]
- Add the Plugin Review task for the Post-migration launchpad experience [#39711]
- Add the Review site task [#39641]
- Admin bar: Add help icon tooltip [#39845]
- Admin bar: Add reader icon tooltip [#39803]
- Global Styles: add a Help Link to premium styles limitation message [#39226]

### Changed
- Admin bar: replace 'Edit Profile' and 'My Account' with 'My Profile' [#39600]
- Blog Privacy: Do not add custom rules to wpcom's robots.txt if blog_public=0 [#39468]
- Help Center: use Zendesk staging when proxied [#39566]
- jetpack-mu-wpcom: remove unneeded filter [#39552]
- Launchpad: Added isset to avoid Warnings when finding about page id [#39529]
- Make the Migrating the site task complete by default [#39769]
- Only include `wp-polyfill` as a script dependency when needed. [#39629]
- Sharing modal: Repurposed to only display recommended tags. [#39499]
- Site Management Panel: fix site name encoding display [#39756]
- Site Management Panel: Migrate to react [#39742]
- Updated copies used in the plugins banner for wpcom sites plugin-install.php page. [#39725]
- Updated package dependencies. [#39594] [#39640] [#39707]
- Update Jetpack Scan link [#39619]
- Update Verbum Comments resize logic [#39791]
- wpcom_add_shopping_cart: Use Store_Shopping_Cart::is_cart_empty() when deciding to render icon for incrased performance [#39563]

### Deprecated
- Site Management Widget: Clean up unused files [#39743]

### Removed
- Removed import of the class-wp-rest-wpcom-block-editor-sharing-modal-controller.php controller [#39488]

### Fixed
- Admin bar: ensure the Atomic debug bar is the leftmost menu [#39493]
- Prevent welcome tour keyboard navigation from hijacking left right keys on the editor [#39683]
- profile.php: Make wpcom links more concise [#39636]
- Superadmin bar: always point to wp-admin even on Default admin interface style [#39501]
- Verbum Comments: fix gravatar width in nested comments [#39757]

## [5.64.0] - 2024-09-23
### Deprecated
- Removed launchpad-save-modal. [#39429]

## [5.63.0] - 2024-09-18
### Added
- Added a shopping cart icon to the masterbar. This icon will be displayed when the user has items in the cart and liks to the checkout page. [#39298]
- Add new wpcom-migration-key endpoint. [#39377]

### Changed
- Admin menu: Replace Jetpack cloud links with WordPress.com links [#39393]
- Changing name of the hosting menu's "Settings" item to "Site Settings". [#39411]
- Get active element from target's document rather than the global `document`. [#39364]
- Remove the extra padding around the admin bar Reader item to match Calypso. [#39357]
- Removing some steps from the Block Editor Welcome Tour, since it currently has too many [#39325]

### Fixed
- Admin bar: align colors with Calypso's [#39314]
- Admin bar: fix paddings around wpcom and reader logos [#39312]
- Changinging wpcom_admin_interface via API no longer redirects [#39416]
- Help Center: Fix the icon color when previewing color scheme [#39371]
- Launchpad first_post_published task reuses existing draft if there is one [#39259]
- Prevent undefined `get_current_screen` function errors resulting from invoking the function in contexts where it is undefined. [#39228]
- Use React properties rather than pass-throughs (e.g. `className` rather than `class`). [#39414]

## [5.62.0] - 2024-09-10
### Changed
- Admin bar: always use user language even on frontend screens [#39255]
- Admin bar: update 'My Account' link to /me [#39290]
- Enable Users -> Profile (profile.php) on all sites [#39181]
- Launchpad: Require a design is selected before marking the step as complete in both the Write and Free flows [#39189]
- Updated package dependencies. [#39176] [#39302]

### Fixed
- Use the correct endpoint route for adding suggested tags on new posts. [#39175]

## [5.61.0] - 2024-09-02
### Changed
- MU WPCOM: Disable the Open Graph Tags according to the privacy of the site [#39012]
- Point "Edit Profile" to profile.php when Site-Level Profile is enabled [#39091]

## [5.60.0] - 2024-08-30
### Added
- Add Meta crawler. [#39159]

### Changed
- Newspack blocks: Updated from 3.5 to 4.0.1 [#39033]
- Updated package dependencies. [#39111]

### Fixed
- Always rewrite profile.php to /me on Default sites [#39113]

## [5.59.0] - 2024-08-26
### Added
- Auto open Upload Theme dialog if query parameter is present [#39045]
- Fixup project versions. [#38931]

### Changed
- MU WPCOM: Fix Post Publish Modal checkbox alignment [#38990]

### Fixed
- Bump package version [#39056]
- MU WPCOM: Fix the coming soon isn't configured correctly if the settings changes from Coming Soon -> Private -> Coming Soon [#39010]

## [5.58.0] - 2024-08-23
### Added
- Sync Calypso locale to Atomic Classic [#39009]

### Changed
- Jetpack-mu-wpcom admin bar: move the Reader menu item to the secondary admin bar group. [#38976]
- Replace language selector with a link to WPCOM [#39013]
- Updated package dependencies. [#39004]

### Fixed
- Admin bar: fix icon colors on site frontend [#39014]
- Ensure theme update icon is hidden correctly [#38957]
- Inconsistent Color Scheme when previewing on Simple Default [#39048]

## [5.57.1] - 2024-08-21
### Changed
- Site Level User Profile: expose all relevant fields on profile.php [#38949]

### Fixed
- Help Center: show disconnected version on frontend [#38941]
- Revert recent SVG image optimizations. [#38981]

## [5.57.0] - 2024-08-19
### Added
- Social Links: Requiring feature from Classic Theme Helper package instead of Jetpack module. [#38730]

### Changed
- Gutenberg: Include links to support docs for recent blocks. [#38794]
- Keep the synced-newspack-blocks folder instead of pulling on every install. [#38873]
- Replace the link of the additional CSS. [#38951]
- Re-tangle first/last/display name, website, and bio fields in profile.php. [#38854]
- Temporarily point to wpcalypso.wordpress.com for testing purposes. [#38903]
- Updated package dependencies. [#38662]
- Whem Atomic users log out of wp-admin they are also logged out of WPCOM. [#38850]

### Fixed
- Help Center: Don't load english translations. [#38912]
- Lossless image optimization for images (should improve performance with no visible changes). [#38750]

## [5.56.0] - 2024-08-13
### Changed
- WPCOM Block Description Links: add links for embed variations [#38834]
- wpcom_admin_interface setting: update copy to match Calypso setting. [#38810]

## [5.55.0] - 2024-08-12
### Added
- WPCOM MU Plugin: Add dynamic script loader [#38819]

## [5.54.3] - 2024-08-12
### Fixed
- MU WPCOM: Fix the “page-patterns” plugin has encountered an error and cannot be rendered" [#38823]

## [5.54.2] - 2024-08-09
### Fixed
- Block Editor Nux: Temporary stop load feature from MU WPCOM [#38802]
- Fixed CSSTidy loading in the test [#37859]

## [5.54.1] - 2024-08-08
### Fixed
- Load Scheduled_Updates for non-wpcom users [#38772]

## [5.54.0] - 2024-08-08
### Added
- MU WPCOM: Port enqueue_coblocks_gallery_scripts from the ETK [#38731]
- MU WPCOM: Port the newspack blocks from the ETK [#38724]
- Point Edit Profile link to wpcalypso.* [#38775]
- Show Help center in front end admin bar [#38651]
- Show links back to WordPress.com for them to manage their WordPress.com profile [#38638]

### Changed
- Removed gating logic for wpcom_admin_interface_settings_field [#38774]
- WordPress.com Features: Remove unused files for Calypso Locale Bidirectional Sync [#38773]

### Fixed
- Simple Classic: make Users -> Profile -> Email input readonly instead of disabled [#38752]

## [5.53.1] - 2024-08-05
### Changed
- Internal updates.

## [5.53.0] - 2024-08-05
### Added
- Added wpcom-block-editor-nux feature from calypso's ETK package. [#38674]
- MU WPCOM: Port FSE feature from ETK [#38212]
- MU WPCOM: Port the newspack blocks from the ETK [#38454]
- MU WPCOM: Port the starter-page-templates feature from ETK [#38475]

### Changed
- Add description link to Subscriber Login block [#38629]
- MU WPCOM: Only load ETK features for wpcom users [#38708]

### Removed
- Removed dead CSS code [#38659]

### Fixed
- Admin bar: fix icon alignment on small screen widths [#38684]
- Adminbar: Fix profile menu colors [#38650]
- Admin bar: help center and notification icons now follow color scheme [#38672]
- Fix bug so Theme Showcase menu appears on Simple Classic sites [#38698]
- Fix RTL admin bar [#38654]
- Masterbar: Fix icon overlap issue at smaller resolutions [#38551]
- MU WPCOM: Fix the option of the MailerLite widget is gone [#38640]

## [5.52.1] - 2024-07-30
### Changed
- Fixup versions [#38612]

## [5.52.0] - 2024-07-30
### Added
- Help Center: extended post fetch endpoint to accept URLs [#38445]

### Changed
- Admin bar: Force mobile viewport to have the same icon color as desktop [#38588]
- Blog Privacy: Update Applebot-Extended disallow rule [#38599]
- React: Changing global JSX namespace to React.JSX [#38585]

## [5.51.0] - 2024-07-29
### Changed
- Hide the plugin banner on non-wpcom-connected users or agency-managed users [#38532]

### Fixed
- Admin Bar: Fix the order of the top-right items on Atomic sites [#38533]

## [5.50.0] - 2024-07-26
### Added
- Added a new task to the readymade-template launchpad for generating content with AI [#38507]

## [5.49.1] - 2024-07-26
### Changed
- Update dependencies.

## [5.49.0] - 2024-07-25
### Added
- Add a12n notice about proxied toolbar [#38519]

### Changed
- Add query param to URL only for users with manage options permission [#38493]
- Admin Bar: Point the (Profile) -> Edit Profile menu to /me when appropriate [#38530]

### Fixed
- Fix fatal error in admin bar [#38526]
- MU WPCOM: Load built version of wpcom-sidebar-notice.js [#38479]

## [5.48.0] - 2024-07-23
### Changed
- Always use house icon for site name in admin-bar. [#38457]

## [5.47.0] - 2024-07-22
### Added
- Added origin_site_id param to the links on the masterbar. [#38401]
- Added Random Redirect module for simple sites. [#38374]

### Changed
- Admin Bar: Replaced the wp-admin url with the calypso ones for the default interface. [#38377]
- Nav Redesign: Use Core admin bar for Simple and Atomic Default-view sites. [#38419]
- Show notifications and help icons on mobile. [#38438]
- Updated Masterbar Reader icon. [#38437]

### Fixed
- Admin Bar: Adjust wpcom logo size on mobile. [#38448]
- Set `#wp-admin-bar-top-secondary` absolutely positioned to the right to prevent it from floating ut of place when the window shrinks. [#38426]

## [5.46.0] - 2024-07-18
### Added
- Limited Global Styles: Port feature from ETK [#38333]

### Changed
- Admin Bar: Make it consistent between Calypso and WP Admin regardless of the value of Admin Interface Style [#38399]

## [5.45.0] - 2024-07-18
### Added
- MU WPCOM: Support localizeUrl [#38318]

### Changed
- Block Perplexity AI bot in robots.txt when opted out of data sharing. [#38400]
- Hide wpcom features when site is agency-managed or user is local [#38364]

### Fixed
- Admin Bar: Hotfix the order of the admin menu items for WP 6.6 [#38347]

## [5.44.0] - 2024-07-15
### Added
- Add Profile -> My Account menu to admin bar. [#38294]
- Adds checks to remove wpcom items and links in wp-admin for users who are not connected to wpcom. [#38241]
- Bring jetpack-global-styles from ETK. [#38209]
- Classic Theme Helper: Adding in Responsive Video class initialization from the Jetpack Mu WPcom package. [#38218]
- Load the Google Analytics package. [#37622]
- MU WPCOM: Enable the custom-line-height feature by default. [#38317]
- MU WPCOM: Move countdown and timeline blocks from jetpack to jetpack-mu-wpcom. [#38298]
- MU WPCOM: Port the a8c-posts-list block from ETK. [#38279]
- MU WPCOM: Port Whats New from ETK. [#38229]
- Port block-inserter-modifications from ETK. [#38277]
- Port MailerLite Widget. [#38293]
- Port wpcom-block-description-links from ETK. [#38254]
- Port wpcom-documentation-links feature from ETK. [#38249]

### Changed
- jetpack-mu-wpcom - Help Center: Consume translations directly from widgets.wp.com. [#38300]
- Updates the WordPress.com admin bar as follows:
  
  1. Repurposes the WordPress logo as a link to /sites.
  2. Adds Reader menu.
  3. Hides the updates icon.
  4. Hides the comments icon. [#38233]

### Removed
- Dashboard widgets: Remove WordPress Events and News feed widget. [#38242]

### Fixed
- Help Center: Save Last-Modified date in downloaded language files instead of the current date. [#38284]
- Hide help-center for wc-admin home page. [#38253]

## [5.43.0] - 2024-07-08
### Added
- Added Help Center (migration from ETK) [#38093]
- Custom CSS: Add the loading mechanism back after it was reverted. [#38173]
- Jetpack Mu Wpcom: Added call for Featured Content [#38215]
- MU WPCOM: Allow simple sites to upload the heif images [#38188]
- MU WPCOM: Port font-smoothing-antialiased feature from ETK [#38195]
- MU WPCOM: Port override-preview-button-url feature from ETK [#38196]
- MU WPCOM: Port paragraph block feature from ETK [#38213]
- MU WPCOM: Port tags-education feature from ETK. [#38210]
- MU WPCOM: Port the hide-homepage-title feature from ETK [#38190]

### Changed
- As we've launched untangling & nav redesign, the wpcom_is_nav_redesign_enabled() function name is not relevant anymore and can be confusing for future developers, so we replace it with the equivalent get_option call. [#38197]
- Classic Theme Helper - initialize Featured Content from the mu-wpcom package [#37969]
- Load ETK features with a higher priority to avoid the ETK plugin taking precedence. [#38230]
- Updated package dependencies. [#38132] [#38235]
- Update Verbum Comments accessibility. [#38116]

### Removed
- Jetpack Mu Wpcom: Removed call to Featured Content class for initial release. [#38205]

## [5.42.1] - 2024-07-01
### Changed
- Redirect to Default settings page after Admin Interface has been updated to Default. [#38107]

## [5.42.0] - 2024-06-28
### Fixed
- Disable loading of Custom CSS for atomic sites [#38118]

## [5.41.0] - 2024-06-28
### Added
- Add Custom CSS module from Jetpack plugin [#37794]

## [5.40.0] - 2024-06-26
### Added
- Add a new launchpad task list for the readymade template flow [#37989]

## [5.39.0] - 2024-06-26
### Added
- Remove Update Services section in Writing Setting if is_agency_managed_site [#38038]

## [5.38.1] - 2024-06-25
### Removed
- Remove use of `gutenberg_can_edit_post_type()`. Its replacement has been in WP Core since 6.1. [#38015]

## [5.38.0] - 2024-06-25
### Added
- Hide admin interface if is_agency_managed_site [#38006]
- Hide site visibility setting if is_agency_managed_site [#38009]

### Fixed
- Hide Core's default My Sites menu on WP.com [#38000]

## [5.37.0] - 2024-06-24
### Added
- Added is_agency_managed_site function used to hide wpcom items [#37993]

## [5.36.0] - 2024-06-21
### Changed
- Jetpack MU WPCOM: Added Applebot-Extended to robots.txt disallow. [#37954]
- Masterbar: Require and use 'jetpack-masterbar' package in jetpack-mu-wpcom [#37812]
- Site Visibility: Update link copy [#37909]

### Fixed
- Fix an edge case for theme showcase button rendering if only a single theme is left after deletion. [#37920]
- Fix how comment modal option is retrieved [#37897]
- Masterbar: Fix All sites icon size in small screen sizes [#37938]
- Simple Classic: Redirect to Default interface after switching wpcom_admin_interface [#37921]

## [5.35.4] - 2024-06-18
### Changed
- Update dependencies.

## [5.35.3] - 2024-06-14
### Removed
- Remove bi-directional profile syncing between Atomic and Simple sites [#37862]

### Fixed
- Masterbar: Update All Sites icon size [#37832]

## [5.35.2] - 2024-06-14
### Added
- Simple Classic: Add condition to release it using a wpcom function [#37867]

### Fixed
- Fix link to logs in Site management panel widget [#37868]

## [5.35.1] - 2024-06-13
### Changed
- Move Verbum comments to clsx [#37789]
- Updated package dependencies. [#37776] [#37796]

### Fixed
- Replace the wp-admin/about.php links with a link to wp-admin/ main page. This is needed for Simple Sites where we restrict access to the about.php and contribute.php [#37777]

## [5.35.0] - 2024-06-10
### Added
- Add Hosting > Overview menu option on WP Admin sidebar. [#37732]

### Changed
- WPCOM Block Editor: Moved from Jetpack Plugin to mu-wpcom [#37324]

### Removed
- Remove Monitoring and Configuration menu options from Hosting menu. [#37736]

### Fixed
- Fixed typo in setcookie call [#37774]

## [5.34.0] - 2024-06-06
### Added
- Menu: Register plugin install page for default sites [#37686]

### Changed
- Updated links to site management panel [#37712]
- Updated package dependencies. [#37669]

### Fixed
- Jetpack Cloud Simple > Monetize: Fix the link for "Set up an offer for your supporters" step [#37673]
- Revert update_calypso_locale [#37740]

## [5.33.0] - 2024-06-03
### Added
- New intro tour for classic admin interface. [#37533]

### Changed
- Plugin menu: Register "Plugins Marketplace" menu. [#37521]
- Update comments settings in Simple to match Jetpack site. [#37592]

### Fixed
- Replace "Site visibility" with a link to Calypso. [#37656]

## [5.32.0] - 2024-05-27
### Added
- Add staging sites check for menus. [#37449]
- Dashboard: Introduce the WP.com site management widget when the nav redesign is enabled. [#37569]

### Changed
- Calypsoify: Load feature from the Calypsoify package. [#37375]
- Update import flow reference to new `/setup/hosted-site-migration` path. [#37470]

## [5.31.1] - 2024-05-20
### Changed
- Untangling: Replace Hosting -> Connections with Hosting -> Marketing. [#37431]

## [5.31.0] - 2024-05-16
### Added
- Admin Interface Style: Add the track event when the value is changed. [#37373]
- WordPress.com Features: Add wp-admin sync with Calypso locale. [#37352]

### Changed
- Remove the need to have posts published in the ai-assembler launchpad. [#36942]
- Updated package dependencies. [#37379]

### Fixed
- Untangling: correctly show the All Sites menu in the top bar. [#37393]
- Verbum Comments: translate block editor. [#37367]

## [5.30.0] - 2024-05-14
### Added
- WordPress.com Features: Calypso Locale Sync from wp-admin to Calypso [#37316]

### Changed
- In trial plans, we don't show "Grow your business" and "Launch your site" tasks. [#37374]

## [5.29.1] - 2024-05-13
### Changed
- WP.com menu: Add "Hosting > Add-ons" menu to Atomic sites [#37318]

## [5.29.0] - 2024-05-09
### Added
- Jetpack-mu-wpcom: Add classic theme helper package as a requirement [#37284]
- Settings: Add Admin Interface Style options. [#37273]

### Removed
- Nav Redesign: Revert Hosting menu changes [#37254]

### Fixed
- Themes: Fixed an issue that was showing a broken Theme Showcase action in the active theme details [#37258]
- WordPress.com Features: Don't load admin color schemes if Jetpack is not active [#37233]

## [5.28.0] - 2024-05-06
### Added
- Add plugins link to menu for simple classic users. [#37182]
- Launchpad: Add completion handler to eCommerce plan tasks. [#37131]
- Navigation Redesign: Add Hosting -> Overview menu. [#37228]
- Scheduled Updates: Add Scheduled Updates submenu item in wpcom-site-menu.php. [#37070]

### Changed
- Admin Menu: Record events in Tracks for sidebar notices. [#37214]
- Fix navigation upsell and notification RTL spacing. [#37125]
- Updated package dependencies. [#37147] [#37148]

### Removed
- Remove reference to `WPCOM_Launchpad`, which was removed from wpcom in D111041-code (May 2023). [#37201]
- Remove reference to `wpcom_subs_js`, which was removed from wpcom in D104342-code (March 2023). [#37201]

## [5.27.0] - 2024-04-29
### Added
- Launchpad: Add Entrepreneur plan launchpad tasks [#37094]

## [5.26.1] - 2024-04-26
### Added
- CloudFlare Analytics: add tracking code management (originally in the Jetpack plugin). [#37061]

### Changed
- General: use wp_admin_notice function introduced in WP 6.4 to display notices. [#37051]

### Fixed
- Calypso: Prevent CSS concat on colors handle instead of reenqueuing colors from CDN. [#37063]

## [5.26.0] - 2024-04-25
### Added
- Admin menu: Show sidebar notices on classic interface. [#36797]

### Changed
- Admin menu: Sidebar notices can be dismissed now. [#37031]

### Fixed
- Update project dependencies to explicitly reflect the current state. [#37035]

## [5.25.0] - 2024-04-22
### Added
- Add missing dependency on `automattic/jetpack-status`. [#36881]

### Changed
- Launch the WP.com themes banner in WP Admin for all users. [#36935]
- Monetize: Move menu item into the Jetpack menu for all Classic interface users. [#36995]

### Fixed
- Added completed callback for site_launched task. [#36839]
- Fixed a WP.com only issue that forced the Themes menu to always point to Calypso even when the classic interface was set. [#36934]
- Fix enqueuing editor styles. [#36983]
- Themes: Fixed an issue that was showing a broken Theme Showcase action in the active theme details. [#36986]

## [5.24.0] - 2024-04-15
### Added
- WP.com Patterns: Hide WP.com categories that start with underscore. [#36763]
- Calypso: Add Theme Showcase menu. [#36851]
- Display a banner before the theme browser that links to the WP.com Theme Showcase. [#36801]

### Changed
- Conditionally enable link manager on Simple and Atomic sites. [#36770]
- Hide Customize on block themes on Simple Classic sites. [#36856]
- Monetize: Move into Jetpack menu and open the page on Jetpack Cloud. [#36799]
- Update Monetize Launchpad links to Jetpack Cloud. [#36728]

### Removed
- Removed All Sites menu option from sidebar. [#36632]

### Fixed
- Add translation support for the Launchpad API endpoint. [#36802]

## [5.23.2] - 2024-04-08
### Changed
- Updated package dependencies. [#36760] [#36761] [#36788]

## [5.23.1] - 2024-04-05
### Changed
- Update dependencies.

## [5.23.0] - 2024-04-04
### Added
- Allow Simple sites access to the Hosting menu [#36684]

### Changed
- Load Stats on admin_menu hook for Simple sites so Jetpack menu loads for admin-menu API [#36712]

## [5.22.0] - 2024-04-01
### Added
- Add Odyssey Stats to wpcom Simple Site [#36628]
- Change Phan baselines. [#36627]

### Changed
- Dotcom patterns: use wp_block post type patterns in editor with all themes and hide core and Jetpack form patterns [#36588]
- General: update Phan configuration. [#36528]

## [5.21.0] - 2024-03-27
### Changed
- Updated package dependencies. [#36585]
- Updated Verbum Highlander Comment form prompt value [#36505]

### Fixed
- Untangle: update launchpad links for subscribers to go to Jetpack Cloud [#36573]

## [5.20.0] - 2024-03-25
### Removed
- Removed Subscribers from Hosting menu [#36513]

## [5.19.0] - 2024-03-22
### Changed
- Added additional settings for commenting on simple sites [#36367]
- Releasing Gutenberg to all Verbum users. [#36476]

### Fixed
- Block Patterns: The modal of the starter patterns isn't shown when you're creating a new post [#36516]
- Untangle: update launchpad links for newsletter setting to go to Jetpack's [#36495]

## [5.18.0] - 2024-03-20
### Changed
- The GitHub deployments feature check has been removed. [#36383]
- Updated copy by replacing "subscribers" with "emails" [#36450]

### Fixed
- Fixed a bug where locked mode was applied to all sites in /me/sites that followed a site with locked mode enabled. [#36388]
- Hosting menu is only available to admin with a wpcom account [#36405]
- Wrong text in the editor placeholder. It was not translated [#36454]

## [5.17.0] - 2024-03-15
### Added
- Added information regarding if github deployments is active to the wp-admin command palette config. [#36324]
- Untangle: Enable both Calypso & Core admin color schemes in Users -> Profile [#36341]

## [5.16.1] - 2024-03-12
### Changed
- Internal updates.

## [5.16.0] - 2024-03-12
### Added
- Added Connections to the Hosting menu [#36302]

### Changed
- Updated package dependencies. [#36325]

## [5.15.2] - 2024-03-11
### Changed
- External dependencies of the Command Palette are now explicitly declared. [#36184]
- Jetpack MU WPCOM: Added Bytespider robots.txt [#36260]
- Remove external-icon from Hosting menu [#36221]

### Fixed
- unregisters unnecessary items from the customizer for atomic sites on block theme [#36161]
- Untangle: correctly show the current homepage when live-previewing another block theme [#36178]

## [5.15.1] - 2024-03-05
### Changed
- Internal updates.

## [5.15.0] - 2024-03-04
### Added
- Added a Command Palette loader on the jetpack-mu-wpcom plugin. [#35635]

### Changed
- Add-Ons: Hide the menu on atomic sites [#36065]
- Scheduled Updates: Load API endpoints on WP.com so it works with public-api passthrough. [#35999]
- Show gutenberg in verbum to 80% of users [#36121]
- The Command Palette loads the script with a `defer` strategy now to improve the performance. [#36076]
- Updated package dependencies.

### Fixed
- Add blog id and post id to connection params [#36152]
- Untangle: fix launchpad links to go to wp-admin pages on classic view [#36014]

## [5.14.1] - 2024-02-26
### Changed
- Verbum: Ensure colour contrast for disabled button is a11y-friendly. [#35929]

### Fixed
- Fix comment form login for passwordless users [#35785]

## [5.14.0] - 2024-02-26
### Added
- Adds a dismissible admin notice to inform users of the hosting menu [#35930]
- Add Scheduled Updates package [#35796]

### Changed
- Add Anthropic UAs to list of crawlers to block. [#35924]
- Change wpcom menu item to go to my sites instead of global site view. [#35928]
- Update WordPress.com menu item to be a menu of links rather than one link. [#35925]

## [5.13.1] - 2024-02-21
### Changed
- Ensure consistent robots.txt behavior between WP.com and WoA. [#35803]

## [5.13.0] - 2024-02-19
### Added
- Blog Privacy: Add AI User Agents to robots.txt depending on blog setting. [#35704]
- Don't override Site Editor's back button URL for sites with classic view enabled. [#35721]
- jetpack-mu-wpcom: Added the wpcom-site-menu feature to add a WordPress.com sidebar menu item. [#35702]

### Fixed
- Create and use Preact signal for subscriptionModalStatus to fix issue of undefined value sent on comment submission. [#35741]

## [5.12.2] - 2024-02-13
### Changed
- Updated package dependencies. [#35608]

## [5.12.1] - 2024-02-12
### Changed
- Make the 'Install the mobile app' task visible to Simple and Atomic. [#35465]

## [5.12.0] - 2024-02-05
### Added
- Adds the completion logic for the Install the mobile app task to Atomic sites" [#35261]
- Import: adds a banner to wp-admin linking to the Calypso import tool [#35351]
- Register wp_block patterns from Dotcompatterns with blockTypes [#35337]

### Changed
- Updated package dependencies. [#35384]
- Updated Readme to include Verbum issue board and clarify code syncing steps [#35318]
- Verbum: Minify dynamic-loader script. [#35323]
- Verbum: Use jetpack-assets package to register scripts using `.asset.php` file data. [#35323]
- Verbum Comments blocks rollout to 50% of sites [#35446]

### Fixed
- Esnsure the submit event is fired by the comments form [#35388]
- Verbum: Avoid copying PHP files into `src/build/verbum-comments/`. [#35323]

## [5.11.0] - 2024-01-29
### Security
- Allow users to post HTML when blocks are enabled [#35276]

### Added
- Cache the response of the Domain List request, and harden the code [#35070]

### Changed
- Change Verbum Blocks sample size to 30% [#35255]
- Hides the "Install the mobile app" task while the completion logic is not fully implemented [#35302]
- Update Verbum README [#35252]

### Fixed
- Verbum cache buster depended on build_meta, which is only updated on production builds. It doesn't refresh during development, giving you a stale block-editor bundle. [#35243]

## [5.10.0] - 2024-01-25
### Added
- Add Verbum Comments in jetpack-mu-wpcom plugin. [#35196]

## [5.9.0] - 2024-01-22
### Added
- Added the completion logic for the 'Install the mobile app' task [#35110]
- Adds the completion logic for the Verify Domain Email task [#35068]
- Block theme previews: show an education modal when previewing a theme. [#34935]
- Launchpad: Enabled to temporary dismiss a dismissible launchpad [#34889]

### Changed
- Dotcom patterns: use assembler v2 patterns in editor [#35081]
- Newsletter launchpad: move email verify task above subscriber task [#35084]

### Fixed
- jetpack-mu-wpcom: Prevent get_plugin_data indirectly calling wptexturize. [#35087]

## [5.8.2] - 2024-01-15
### Added
- Add the completion logic for the `front_page_updated` task [#34837]
- Add the Verify Domain Email task [#34893]

### Removed
- Removes the `Set up your Professional Email` task [#34865]

## [5.8.1] - 2024-01-08
### Added
- Adds the is_dismissible prop to the Launchpad task list definition. [#34839]

## [5.8.0] - 2024-01-04
### Added
- Add WooCommerce setup task completion logic. [#34791]
- Dashboard Link: Allow to customize the url via the query parameter. [#34836]

### Changed
- Launchpad: Rename the title of the setup_general to Give your site a name. [#34826]
- Update launchpad methods docs. [#34829]
- Update package dependencies. [#34815]
- Use the Site Title task instead of the blogname_set task. [#34799]

## [5.7.0] - 2024-01-02
### Added
- Added Sensei setup completion logic. [#34789]
- Fixed the start page options modal still being visible. [#34824]

### Changed
- Block Patterns: Updated to use category name testimonials rather than quotes. [#34808]

## [5.6.0] - 2023-12-25
### Removed
- Remove a nag for domains without a verified email [#34385]
- Removed Launchpad task for domain email verification. [#34387]

## [5.5.0] - 2023-12-15
### Changed
- Updates the WC visibility check to use the `is_plugin_active` function. [#34648]

## [5.4.0] - 2023-12-14
### Added
- Add the Sensei and WooCommerce Setup Task, to allow us to retire the old checklist card. [#34551] [#34564]
- Launchpad: Add context param to endpoint. [#34498]

### Changed
- Mark the setup_general task as complete based on whether blogname or blog description options changed. [#34579]

## [5.3.0] - 2023-12-11
### Added
- Added editor error handling from ETK. [#34158]
- Added initial JS and TS build logic. [#34158]
- Added the Site Setup Launchpad, to allow us to retire the old checklist card. [#34320]
- Launchpad: Added tasks for the new ai-assembler flow. [#34532]
- Launchpad: Completed the plan tasks when the user purchses a plan. [#34480]
- Launchpad: Completed the task, Personalize your site, when the user updates the site title, site tagline or site logo. [#34511]
- Launchpad: Set up tasks for the new assembler-first flow. [#34451]

### Changed
- Launchpad: Added source to Earn stripe task. [#34448]

## [5.2.0] - 2023-12-03
### Changed
- Launchpad: Updated link for paid offer task. [#34413]

## [5.1.1] - 2023-11-30
### Changed
- Update url for launchpad task to add subscribe block to point to site editor with subscribe block docs open in the help center. [#34329]

### Fixed
- Added type check to prevent unnecessary warnings in Coming Soon logic [#34322]
- Earn: Update link to plans page. [#34316]

## [5.1.0] - 2023-11-24
### Added
- Added dynamic titles to task lists. [#34244]
- Migrated Block Patterns. [#34162]

### Changed
- Replaced usage of strpos() with str_contains(). [#34137]
- Replaced usage of substr() with str_starts_with() and str_ends_with(). [#34207]

### Fixed
- Prevented fatal errors when filename is empty in the heif support feature. [#34062]

## [5.0.0] - 2023-11-20
### Added
- Ensure enable subscribe modal task in launchpad. [#33909]
- Launchpad: Add query parameter to the write three posts prompt. [#34160]

### Changed
- Replaced usage of strpos() with str_starts_with(). [#34135]
- Updated required PHP version to >= 7.0. [#34192]

## [4.18.0] - 2023-11-09
### Added
- Take id_map in consideration when checking if a task is completed inside wpcom_launchpad_is_task_option_completed. [#34009]

## [4.17.0] - 2023-11-08
### Added
- Added Launchpad tasks and task list to the Subscriber page. [#33948]

### Changed
- Updated the URL for the Add Subscribers launchpad task to trigger the "Add Subscribers" modal. [#33913]

## [4.16.2] - 2023-11-03
### Fixed
- Launchpad hooks: Made more resilient against non-array values. [#33923]

## [4.16.1] - 2023-10-31
### Fixed
- Clicking on the 'Choose a plan' task would not redirect to the plans page. [#33872]

## [4.16.0] - 2023-10-30
### Added
- Add launchpad checklist for host-site intent. [#33698]

### Fixed
- Disable fullscreen launchpad when completing the site_launched task. [#33819]

## [4.15.1] - 2023-10-26
### Changed
- Coming Soon feature: Be more defensive when checking for meta data. [#33769]

## [4.15.0] - 2023-10-16
### Added
- Launchpad: Add earn-newsletter checklist. [#33200]

### Changed
- Launchpad: Update copy for global styles in plan_selected task. [#33462]

## [4.14.0] - 2023-10-10
### Added
- Expose newsletter_categories_location to JavaScript [#33374]

### Changed
- Changed domain launchpad task visibility [#33456]
- Changed email verification visibility [#33457]

## [4.13.0] - 2023-10-03
### Added
- Add new task for user to confirm email when purchasing a domain. [#33373]
- Add plugin to show frontend email nag for domains with unverified email address [#33390]
- Adds a URL param to identify the source of the navigation on the Customize domain task. [#33404]

## [4.12.0] - 2023-09-28
### Added
- Added calypso_path to Launchpad task [#33355]
- Support Design First tasks on the Customer Home Launchpad [#33272]
- Support Start Writing tasks on the Customer Home Launchpad [#33281]

### Fixed
- Added check for jetpack sync option to only run on Atomic [#33286]

## [4.11.0] - 2023-09-25
### Added
- Adds 100 Year Plan features, including the ability to set a legacy contact and enable locked mode. [#33081]
- Adds a feature to include helpers for the First Posts stream. In particular, an option is being added to the sync list. [#33253]
- Add the Calypso path for the setup_link_in_bio task. [#32905]
- Support Videopress tasks on the Customer Home Launchpad. [#33153]

### Fixed
- Locked Mode: Now applies cap filter in REST API requests as well. [#33246]

## [4.10.0] - 2023-09-19
### Added
- Add removal capability for navigator available checklists [#33019]
- add updating capabilities for current checklist [#32964]
- Change the Site Editor's dashboard link [#33024]
- Change the way the navigator checklists are handled [#33011]

### Fixed
- Make map block settings load after registering the script [#33066]

## [4.9.0] - 2023-09-11
### Added
- adding navigator api endpoint [#32963]
- capability for getting the current active checklist [#32965]

## [4.8.0] - 2023-09-07
### Added
- Add HEIC/HEIF image upload support [#32900]
- Add updater for WPCOM Marketplace plugins [#32872]

### Changed
- Update version numbers [#32902]

## [4.7.0] - 2023-09-06
### Added
- Added Calypso paths for setup_free and domain_upsell tasks [#32851]
- Launchpad: added Calypso paths for newsletter tasks [#32882]

## [4.6.0] - 2023-09-04
### Added
- Added sub-option to show/hide launchpad modal in editor [#32730]
- Use the task id to validate the task update request [#32591]

### Changed
- Adapt the pre launch tasks to work on the Customer Home [#32796]
- Update function prefixes for task list definitions [#32563]
- Update the unused get_task_url prop on the task definition to the get_calypso_path [#32790]

### Removed
- Remove the is launched check for the build intent [#32810]

## [4.5.1] - 2023-08-28
### Changed
- Updated package dependencies. [#32605]

## [4.5.0] - 2023-08-21
### Added
- Added new 'skipped' option to launchpad checklist [#32500]

### Changed
- Remove the initial slash to match the pattern used throughout the project [#32365]

### Fixed
- Add calypso path for set_up_payments task. [#32526]
- Fix completion logic for welcome message on newsletters task. [#32466]
- Reuse completion method to make it easier to add tracking and check for list completion. [#31471]

## [4.4.1] - 2023-08-15
### Changed
- Reduce number of tasks in the free and paid newsletter task lists [#32459]

## [4.4.0] - 2023-08-14
### Added
- Newsletter launchpad: add migrate content task. [#32357]

## [4.3.1] - 2023-08-09
### Added
- Adds the 'Write 3 posts' launchpad task to the 'Write' intent [#32341]

### Changed
- Update the email verification task copy [#32364]

## [4.3.0] - 2023-08-07
### Added
- Added add_about_page Launchpad task [#32245]
- Added new Launchpad task [#32204] [#32250]
- Add the path for the Write 3 posts and Enable subscriber modal tasks [#32233]
- Launchpad: add 'Get your first 10 subscribers' task for newsletters and add general repeated task completion logic [#32075]
- Launchpad: add a way to query and set checklist dismissed status [#32200]

### Changed
- Add the Earn money task to the Free Newsletter task list [#32315]
- Refactors is_launchpad_enabled method  to make it clear they are related to the fullscreen launchpad [#32269]
- Refactors refactor disable_launchpad & maybe_disable_launchpad to make it clear they are related to the fullscreen launchpad [#32268]

### Fixed
- Fix the new get_calypso_path for the customize_welcome_message task [#32195]

## [4.2.0] - 2023-08-01
### Added
- Add manage subscribers task. [#32064]
- Add new subscribers modal task to newsletter launchpads. [#32042]
- Add site_goals to the jetpack sync options. [#32068]
- Add the Write 3 posts task for the newsletter flow. [#32012]
- Launchpad: add calypso_url property to tasks where we know the Calypso page we want to show. [#32177]
- Add back the update_about_page task to the intent-build list. [#32188]

### Changed
- Auto-formatted composer file. [#32005]

### Removed
- Remove duplicate task list [#32121]

## [4.1.0] - 2023-07-26
### Added
- Add the intent check on the newsletter functions" [#32067]

### Fixed
- Added some guards around calls to wpcom_get_theme_annotation() to avoid errors [#32078]

## [4.0.0] - 2023-07-25
### Added
- Added additional tests for launchpad tasklist validation [#31992]
- Added the Free and Paid Newsletter task list [#31981]
- Add new task for post-launch Newsletter task lists. [#32034]
- Adds the count propertis to the task definitions [#31970]
- Adds the Earn money with your newsletter task [#32000]
- Launchpad task for updating the about page [#31966]
- Show the correct homepage on the Site Editor when previewing a theme.
  See https://github.com/Automattic/wp-calypso/issues/79221 in more detail. [#31929]

### Changed
- Rename the keep-building Launchpad checklist to intent-build [#31905]
- Updated initial state of Launchpad subscribers task. [#31947]
- Updated launchpad task list validation return types to be more useful. Previously, we just returned a simple bool. Now we return a WP_Error where appropriate. [#31834]

### Fixed
- Remove `design_edited` task from post-launch task list. [#31995]

## [3.7.0] - 2023-07-17
### Added
- Launchpad: Filter tasks by newsletter import goal. [#31825]
- Launchpad task for editing a page [#31789]

## [3.6.0] - 2023-07-10
### Added
- While in the design_first flow, if the user creates a post, deletes the default hello-world. [#31702]

## [3.5.0] - 2023-07-05
### Added
- Added a new email campaign trigger for blog-onboarding [#31612]
- Add validation for required tasks. [#31626]
- Launchpad task for adding a new page [#31578]

### Changed
- Update keep building task list visibility logic to check if a site is launched [#31623]

### Fixed
- Don't hide design_edited task if complete [#31620]

## [3.4.0] - 2023-06-27
### Added
- Check that the function jetpack_is_atomic_site exists before using it. [#31602]

## [3.3.0] - 2023-06-26
### Added
- Launchpad task for domain customization [#31493]

### Changed
- Remove use of the is_launchpad_keep_building_enabled feature. [#31519]

## [3.2.0] - 2023-06-26
### Added
- Add a function to fire off a Tracks event when a task is completed and update existing mark task complete functions to use it. [#31444]
- Adding site_intent and launchpad_checklist_tasks_statuses to JP Sync. [#31558]
- Update visibility for design_edited task for post-launch sites. [#31191]

### Changed
- Using design_completed instead of design_selected for design-first flow [#31513]

## [3.1.0] - 2023-06-19
### Added
- Add new claim free domain task to Keep Building task list. [#31275]
- Adds domain_upsell task to keep-building list and updates visibility rules for that same task. [#31281]
- Adds drive_traffic task to keep-building list. [#31377]

### Fixed
- Updates package version. [#31349]

## [3.0.0] - 2023-06-12
### Added
- Add a site title task to the Keep Building task list. [#31246]
- Move the completion check logic out of the task list availability status [#31055]
- Support task list filtering of visible task [#31186]

### Changed
- Launchpad: Add verify email task to keep-building task list [#31239]
- Launchpad: Refactor task definitions [#31121]

### Fixed
- Fix fatal error for WoA sites due to absence of Logstash on that infrastructure. [#31284]

## [2.4.0] - 2023-06-06
### Added
- Add a new is_enabled logic to the launchpad endpoint to determine whether the task list is enabled for a site. [#30913]
- Add `is_enabled_callback` to all existing task lists with a callback function that checks launchpad_screen. [#31092]
- Apply filter to the Keep building task list [#31113]
- Register a "Keep Building" task list. [#30954]
- Remove unused API endpoint launchpad/checklist [#30882]

### Changed
- Launchpad: use callbacks for task titles to pick up the user locale [#30915]

## [2.3.0] - 2023-05-29
### Added
- Launchpad: Add design-first Launchpad checklist API definition [#30871]
- Launchpad: Include "Choose a plan" task in other flows [#30906]
- Remove unnecessary duplicated require of Launchpad plugin. [#30856]

## [2.2.1] - 2023-05-22
### Changed
- PHP8 compatibility updates. [#30729]

## [2.2.0] - 2023-05-12
### Changed
- Added plan_completed step for start-writing flow instead of plan_selected [#30686]

### Fixed
- Ensure calling Launchpad_Task_Lists::list() with an empty ID doesn't result in a PHP warning. [#30509]

## [2.1.0] - 2023-05-11
### Added
- Add start writing checklist and task definitions to Launchpad Checklist API [#30369]
- Launchpad API improvements and compat [#30527]

## [2.0.0] - 2023-05-08
### Added
- Refactor the Launchpad task list API [#30397]

### Changed
- Migrates Launchpad business logic from the mu-plugin to being defined by tasks [#30472]

### Fixed
- Avoid hooking Map settings multiple times. [#30454]
- Ensure Map block settings get hooked to existing block bbubundle. [#30453]

## [1.7.0] - 2023-05-03
### Added
- Refactor the Launchpad task list API

## [1.6.0] - 2023-05-02
### Added
- Add API to query Zendesk chat availability and use it to conditionally display zendesk chat [#29942]
- Add map_block_settings global [#30287]
- Launchpad: Return checklist from main endpoint. [#30227]

### Changed
- Launchpad: Update text strings. [#30286]
- Updated project dependencies. [#30292]

## [1.5.1] - 2023-05-01
### Changed
- Version update [#30293]

### Fixed
- Launchpad API: Address excess queries [#30361]

## [1.5.0] - 2023-04-25
### Security
- Sanitize cand validate checklist slug query param [#30112]

### Added
- Add newsletter task dedefinitions to launchpad checklist API endpoints [#30078]
- Fixed a bug where only the first option was updated and added unit tests. [#30096]
- Launchpad Checklist API: Adds registry to easily manage Launchpad checklists [#30211]
- SLaunchpad Checklist API: add task definitions for the Launchpad free flow [#30146]
- Update launchpad checklist API twrite flow task definitions to use site option data [#30116] [#30117]

### Changed
- Launchpad Checklist API: Update VideoPress tasks [#30141]

### Fixed
- change link_in_bio_launched dependency to link_edited [#30176]

## [1.4.0] - 2023-04-17
### Added
- Added Launchpad Checklist API scaffolding code [#30023]
- Launchpad: Add link-in-bio task logic to endpoint [#30076]

### Removed
- Removed namespacing of jetpack-mu-wpcom launchpad feature [#30044]

### Fixed
- Launchpad: Fixed variable scope issue with endpoint [#30069]

## [1.3.1] - 2023-04-10
### Added
- Add Jetpack Autoloader package suggestion. [#29988]

## [1.3.0] - 2023-04-05
### Added
- Add jetpack-mu-wpcom launchpad update site settings endpoint [#29841]

## [1.2.1] - 2023-03-28
### Changed
- Minor internal updates.

## [1.2.0] - 2023-03-27
### Added
- Fix for the unified navigation on mobile in WordPress 6.2. [#29716]

## [1.1.3] - 2023-03-20
### Changed
- Updated package dependencies. [#29480]

## [1.1.2] - 2023-03-10
### Fixed
- Coming Soon: use DVH units when available to fix height on iPhones [#29416]

## [1.1.1] - 2023-03-09
### Fixed
- Check for existence of wpcom_rest_api_v2_load_plugin function before loading wpcom endpoints. [#29399]

## [1.1.0] - 2023-03-08
### Added
- Add a Launchpad REST API endpoint for cross-platform benefit [#29082]

## [1.0.1] - 2023-02-28
### Changed
- Updated checks for loading the coming soon feature. [#28932]

### Fixed
- Fix undefined is_plugin_active fatal on wpcom. [#29158]

## 1.0.0 - 2023-02-28

- Bump non-zero major version.

## [0.2.2] - 2023-02-20
### Changed
- Minor internal updates.

## [0.2.1] - 2023-02-15
### Fixed
- Check array key exists before access. [#28931]

## [0.2.0] - 2023-02-09
### Changed
- Bumping major package version past zero. [#28880]

## [0.1.2] - 2023-02-06

- Migrate code from 'Automattic/jetpack/pull/27815'.

## 0.1.1 - 2023-01-27

- Minor internal updates.

## 0.1.0 - 2023-01-19

- Testing initial package release.

[6.11.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v6.10.1...v6.11.0
[6.10.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v6.10.0...v6.10.1
[6.10.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v6.9.0...v6.10.0
[6.9.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v6.8.1...v6.9.0
[6.8.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v6.8.0...v6.8.1
[6.8.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v6.7.0...v6.8.0
[6.7.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v6.6.0...v6.7.0
[6.6.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v6.5.0...v6.6.0
[6.5.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v6.4.0...v6.5.0
[6.4.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v6.3.1...v6.4.0
[6.3.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v6.3.0...v6.3.1
[6.3.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v6.2.0...v6.3.0
[6.2.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v6.1.0...v6.2.0
[6.1.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v6.0.0...v6.1.0
[6.0.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.66.0...v6.0.0
[5.66.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.65.0...v5.66.0
[5.65.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.64.0...v5.65.0
[5.64.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.63.0...v5.64.0
[5.63.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.62.0...v5.63.0
[5.62.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.61.0...v5.62.0
[5.61.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.60.0...v5.61.0
[5.60.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.59.0...v5.60.0
[5.59.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.58.0...v5.59.0
[5.58.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.57.1...v5.58.0
[5.57.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.57.0...v5.57.1
[5.57.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.56.0...v5.57.0
[5.56.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.55.0...v5.56.0
[5.55.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.54.3...v5.55.0
[5.54.3]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.54.2...v5.54.3
[5.54.2]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.54.1...v5.54.2
[5.54.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.54.0...v5.54.1
[5.54.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.53.1...v5.54.0
[5.53.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.53.0...v5.53.1
[5.53.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.52.1...v5.53.0
[5.52.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.52.0...v5.52.1
[5.52.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.51.0...v5.52.0
[5.51.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.50.0...v5.51.0
[5.50.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.49.1...v5.50.0
[5.49.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.49.0...v5.49.1
[5.49.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.48.0...v5.49.0
[5.48.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.47.0...v5.48.0
[5.47.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.46.0...v5.47.0
[5.46.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.45.0...v5.46.0
[5.45.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.44.0...v5.45.0
[5.44.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.43.0...v5.44.0
[5.43.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.42.1...v5.43.0
[5.42.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.42.0...v5.42.1
[5.42.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.41.0...v5.42.0
[5.41.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.40.0...v5.41.0
[5.40.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.39.0...v5.40.0
[5.39.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.38.1...v5.39.0
[5.38.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.38.0...v5.38.1
[5.38.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.37.0...v5.38.0
[5.37.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.36.0...v5.37.0
[5.36.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.35.4...v5.36.0
[5.35.4]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.35.3...v5.35.4
[5.35.3]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.35.2...v5.35.3
[5.35.2]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.35.1...v5.35.2
[5.35.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.35.0...v5.35.1
[5.35.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.34.0...v5.35.0
[5.34.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.33.0...v5.34.0
[5.33.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.32.0...v5.33.0
[5.32.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.31.1...v5.32.0
[5.31.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.31.0...v5.31.1
[5.31.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.30.0...v5.31.0
[5.30.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.29.1...v5.30.0
[5.29.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.29.0...v5.29.1
[5.29.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.28.0...v5.29.0
[5.28.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.27.0...v5.28.0
[5.27.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.26.1...v5.27.0
[5.26.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.26.0...v5.26.1
[5.26.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.25.0...v5.26.0
[5.25.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.24.0...v5.25.0
[5.24.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.23.2...v5.24.0
[5.23.2]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.23.1...v5.23.2
[5.23.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.23.0...v5.23.1
[5.23.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.22.0...v5.23.0
[5.22.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.21.0...v5.22.0
[5.21.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.20.0...v5.21.0
[5.20.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.19.0...v5.20.0
[5.19.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.18.0...v5.19.0
[5.18.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.17.0...v5.18.0
[5.17.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.16.1...v5.17.0
[5.16.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.16.0...v5.16.1
[5.16.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.15.2...v5.16.0
[5.15.2]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.15.1...v5.15.2
[5.15.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.15.0...v5.15.1
[5.15.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.14.1...v5.15.0
[5.14.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.14.0...v5.14.1
[5.14.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.13.1...v5.14.0
[5.13.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.13.0...v5.13.1
[5.13.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.12.2...v5.13.0
[5.12.2]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.12.1...v5.12.2
[5.12.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.12.0...v5.12.1
[5.12.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.11.0...v5.12.0
[5.11.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.10.0...v5.11.0
[5.10.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.9.0...v5.10.0
[5.9.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.8.2...v5.9.0
[5.8.2]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.8.1...v5.8.2
[5.8.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.8.0...v5.8.1
[5.8.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.7.0...v5.8.0
[5.7.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.6.0...v5.7.0
[5.6.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.5.0...v5.6.0
[5.5.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.4.0...v5.5.0
[5.4.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.3.0...v5.4.0
[5.3.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.2.0...v5.3.0
[5.2.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.1.1...v5.2.0
[5.1.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.1.0...v5.1.1
[5.1.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.0.0...v5.1.0
[5.0.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.18.0...v5.0.0
[4.18.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.17.0...v4.18.0
[4.17.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.16.2...v4.17.0
[4.16.2]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.16.1...v4.16.2
[4.16.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.16.0...v4.16.1
[4.16.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.15.1...v4.16.0
[4.15.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.15.0...v4.15.1
[4.15.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.14.0...v4.15.0
[4.14.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.13.0...v4.14.0
[4.13.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.12.0...v4.13.0
[4.12.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.11.0...v4.12.0
[4.11.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.10.0...v4.11.0
[4.10.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.9.0...v4.10.0
[4.9.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.8.0...v4.9.0
[4.8.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.7.0...v4.8.0
[4.7.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.6.0...v4.7.0
[4.6.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.5.1...v4.6.0
[4.5.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.5.0...v4.5.1
[4.5.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.4.1...v4.5.0
[4.4.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.4.0...v4.4.1
[4.4.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.3.1...v4.4.0
[4.3.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.3.0...v4.3.1
[4.3.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.2.0...v4.3.0
[4.2.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.1.0...v4.2.0
[4.1.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.0.0...v4.1.0
[4.0.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v3.7.0...v4.0.0
[3.7.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v3.6.0...v3.7.0
[3.6.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v3.5.0...v3.6.0
[3.5.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v3.4.0...v3.5.0
[3.4.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v3.3.0...v3.4.0
[3.3.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v3.2.0...v3.3.0
[3.2.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v3.1.0...v3.2.0
[3.1.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v2.4.0...v3.0.0
[2.4.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v2.3.0...v2.4.0
[2.3.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v2.2.1...v2.3.0
[2.2.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.7.0...v2.0.0
[1.7.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.5.1...v1.6.0
[1.5.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.3.1...v1.4.0
[1.3.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.1.3...v1.2.0
[1.1.3]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.0.0...v1.0.1
[0.2.2]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v0.1.1...v0.1.2
