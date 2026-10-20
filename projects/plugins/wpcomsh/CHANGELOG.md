# Changelog

## 10.0.0 - 2026-10-14
### Added
- Add a check for sites with legacy feature gating. [#51744]
- Add a `wpcomsh php83-plugin-patch mega_main_menu` CLI command that removes the duplicate `static $theme_option_file` declaration triggering a "Duplicate declaration of static variable" fatal error under PHP 8.3+. [#49362]
- Add Jetpack Pro to the backup features. [#53214]
- Add REST endpoint that reports the active Gutenberg plugin version, gated by a WP option. [#48147]
- Add stats wp abbilities [#48286]
- Add the form-conditional-logic feature to Business plans and higher. [#52783]
- Add Titan Mail Premium and Ultra product constants to WPCOM_TITAN_MAIL_PRODUCTS for feature detection [#48045]
- Agents Manager: Add Sidebar Preservation On Load Mechanism [#49325]
- AI Launchpad: sync the Site Setup state to WordPress.com, so the sites list reflects a setup that was skipped or completed on the site. [#52930]
- Backup: Add a Backup page to wp-admin, offering an upgrade or activation for sites whose backups are not available yet. [#52358]
- Bilmur: add opt-in data-site-v attribute to the RUM meta tag via a new wpcomsh_bilmur_site_v filter [#50496]
- CLI: generalize `wpcomsh php83-plugin-patch` into a table-driven patcher for PHP 8.3+ duplicate-static-variable fatals and add a `php83-theme-patch` counterpart. Covers the dash-slug mega-main-menu folder, ninja-forms, wiziapp, thegem-blocks, deepcore, malina-elements, sfwd-lms, cp-addons-for-vc and ingeniofy plugins, plus the SecondLine (tusant/gumbo/dixie/satchmo/bolden) and Select-Themes (hazel/hazel1/alma/maple/rhythm/architek) theme families. [#50359]
- CLI: php83 patchers round 2 — accept any known folder slug as the command argument, add a `--force` escape hatch for pending-but-uninstallable updates, support alternative replacement sets per patch (CRLF/LF vendor variants), extend the deepcore patch to all three duplicated static counters, and add the skudo and larch-1 themes to the Select-Themes family. [#50398]
- CLI: php83 patchers round 3 — LF variants for the SecondLine theme patch (newer licensed builds ship Unix line endings), and a deepcore-widget patch for the duplicated static counters in the Elementor magazine widget's render(), which only compiles on pages using that widget. [#50448]
- Connection: Add a Connected view to the Users page listing users with a linked WordPress.com account. [#53150]
- Connection: Surface SSL certificate verification failures reported by WordPress.com as a connection error notice. [#52035]
- Customize the WordPress fatal error screen with WordPress.com support links. [#48137]
- DIFM Express: Keep Posts, Media, and Pages accessible in wp-admin while awaiting the customer's content. [#52237]
- Enable wp-admin JS error reporting on sites participating in the `gutenberg-react-19` experiment. [#50534]
- Fatal-error screen: log the offending extension's signature (kind, slug, version, WordPress core, PHP) to wpcom logstash via WPCOMSH_Log, deduped so a persistent fatal emits one record rather than one per visitor, so MC dashboards can aggregate the most common breakages. [#48369]
- Fatal error: log recovery-mode email dispatches (sent, disabled, no recipient) and post-login recovery-mode entry to logstash. [#48571]
- Fatal error: tag log events with request_kind/path/method and dedup per (signature, kind) so a site-wide fatal surfaces as one row per affected surface. [#48596]
- Features: add the ability to explicity check if feature is available on legacy gating [#52361]
- Help Center: Show the contextual CTA in wp-admin. [#51992]
- On the WordPress beta track, ignore the Gutenberg plugin when it is older than the Gutenberg version bundled in the running WordPress core, so the site uses the newer core-bundled Gutenberg. [#50692]
- PayPal Payment Buttons: add the WordPress.com endpoint that generates PayPal onboarding links. [#51656]
- Plugin Conflicts Guardian: control the rollout percentage from wpcomsh. [#51392]
- Plugins: Show a Marketplace tab of WordPress.com partner and premium plugins on the Add Plugins screen, first among the tabs. [#53169]
- Premium Analytics: Add a Download CSV action to the Locations widget and the author page's Top viewed posts widget. Each saves every row for the selected dates, scoped to the place or author shown. [#53079]
- Premium Analytics: Add a Download CSV action to the Popular authors, Top links clicked, Top downloaded, Top referrers, Top searched terms, and Top videos widgets that saves the full report for the selected dates. [#52969]
- Premium Analytics: Add a Download CSV action to the Top UTM widget that saves the full report for the selected dates. [#53019]
- Premium Analytics: Add a Download CSV action to the Year in review, All-time most commented authors, All-time most commented posts, Top tags & categories, and Latest emails sent widgets that saves the full report. [#53017]
- Premium Analytics: Add All time to the report date menu, covering everything since the site's stats began. [#53275]
- Premium Analytics: Add a map of views by location to the Locations report, with an option to hide it. [#51808]
- Premium Analytics: Add a Mark as spam action, with Undo, to the Referrers report. [#53277]
- Premium Analytics: Add an "Any feedback?" action to the dashboard header. [#51870]
- Premium Analytics: Add an Ads dashboard section showing WordAds earnings and performance. [#51422]
- Premium Analytics: Add an earnings history report, showing every period with its earnings, ads served, and payment status. [#52323]
- Premium Analytics: Add a page options menu with a Customize action on the post, email, and video detail pages. [#51772]
- Premium Analytics: add a page option that switches the new Traffic tab off, asks why on the way out, and returns to classic Stats. [#52025]
- Premium Analytics: Add a Settings tab to the dashboard, where site owners can see their plan usage and change the Stats settings, and open it from the "Manage Stats settings" link in Settings › Traffic when Stats v2 is on. [#53357]
- Premium Analytics: Add a Total views / Daily average switch to the post detail All-time traffic card. [#52127]
- Premium Analytics: Add a year dropdown to the Year in review (Highlights) widget header, defaulting to the current year, and drop its metric selector so the card always shows posts, words, likes, and comments. [#51638]
- Premium Analytics: Add comparison options that line up the same weekdays of the previous period and the previous year. [#52598]
- Premium Analytics: Add likes, comments and an all-time traffic table to the author detail page, and count an author's views even when they rank below the top 20 authors. [#53292]
- Premium Analytics: Add post thumbnails to the Posts & Pages report. [#52384]
- Premium Analytics: Add referrer groups that open folded and expand on demand in the Referrers report. [#51465]
- Premium Analytics: Add the Totals column to the post detail All-time traffic card; picking a total reads the page over that year. [#52137]
- Premium Analytics: add total and per-post image counts to the Annual insights report. [#51747]
- Premium Analytics: Describe the 30, 60 and 90 days ago and Social followers counts on Subscriber highlights on hover and for screen readers. [#52747]
- Premium Analytics: enable the bundled dashboard on Atomic sites carrying the jetpack-premium-analytics sticker. [#50834]
- Premium Analytics: Expose the dashboard opt-in as a site setting, so administrators can turn the dashboard on and off through the site settings API. [#51864]
- Premium Analytics: Link author names in Popular authors and the Authors report to the author's page. [#53455]
- Premium Analytics: Link the Earnings History widget to its full report. [#52327]
- Premium Analytics: Note in the Earnings History widget when the site has adjustments, linking to the Adjustments history tab of the Earnings report. [#52526]
- Premium Analytics: Note in the Traffic summary help that the Visitors total is a per-period sum. [#52085]
- Premium Analytics: offer adding and removing widgets on the dashboard. [#52826]
- Premium Analytics: Send dashboard feedback on to Jetpack support, so it is not lost when analytics are blocked. [#51921]
- Premium Analytics: Show all-time views, visitors, and posts in the default Insights layout. [#51635]
- Premium Analytics: Show hours watched and retention rate on the Videos report, and name the Videos, Clicks, Authors and Locations columns as in Stats. [#53205]
- Premium Analytics: Show sponsored content and adjustment earnings on the Earnings history report, each on its own tab. [#52437]
- Premium Analytics: Show the Ads tab in the customer preview on sites that use WordAds. [#52864]
- Premium Analytics: Show the change since 30 days ago on the all-time, paid and free subscriber counts for sites with paid subscribers. [#52741]
- Premium Analytics: show the onboarding again to a reader who switches the new Traffic tab back on. [#52038]
- Premium Analytics: Show the Subscribers tab in the customer preview. [#52768]
- Profile Settings: add a link to manage your username on WordPress.com to the username row on wp-admin/profile.php. [#51932]
- Report recovery-mode state to wpcom (via /sites/{blog_id}/recovery-mode-status) so wpcom-side consumers can surface "needs recovery" and related states for sites that have hit a fatal error. [#48213]
- Social: Register the social-image-focal-point feature flag for WPCOM sites. [#49619]
- Staging sites: Add a wpcomsh_is_staging_environment filter to override staging environment detection. [#52150]
- Stats: Add a dismissible feedback banner above the new Traffic tab's widgets. [#52325]
- Stats: Add a Popular hours widget showing the busiest hour and its daily average views. [#51239]
- Stats: link the post list views column to the analytics post detail page when the new dashboard is enabled. [#51357]
- Sync the `SEO_ADMIN_UI` feature flag. [#50899]
- Sync the `SOCIAL_ADMIN_UI_V2` feature flag. [#50733]
- WordAds: Add support for the wordads-free-access sticker. [#51451]
- WPCOM Features: Add POSTS_TO_PODCAST_TIER_{1,2,3} features mapped to Personal+, Premium+, and Business+ plans respectively. Mirrors the wpcom-side change that gates the Posts-to-Podcast endpoint and its monthly generation quota. [#48776]
- WPCOM Features: Add the AI credit tier features, to match WordPress.com. [#53112]
- WPCOM Features: Grant Jetpack Pro the same features as Jetpack Complete. [#53283]
- Wpcomsh fatal-error: log a `wpcomsh_fatal_deactivate` event when an admin clicks the Deactivate button on the fatal-error screen, so we can tell which fatals lead to user-initiated deactivations. Both the deactivate event and the existing `wpcomsh_fatal_signature` event now also carry `properties.atomic_site_id` for site-axis grouping. [#48479]
- Wpcomsh fatal-error: route the screen's "Enter recovery mode" link through a first-party redirect endpoint that logs a `wpcomsh_fatal_recovery` event before forwarding to a freshly-generated core recovery URL, so we can measure screen-originated recovery clicks alongside the existing signature and deactivate events without conflating them with email-originated entries. [#48525]
- WPCOM_Features: add `PODCASTING` feature and map it to Premium-and-higher plans plus all Jetpack-connected sites. [#48700]
- Write: answer the daily writing prompt in the distraction-free Write editor. [#51671]
- Write: Ask writers one question about their experience after their first post, with an optional comment. [#51787]
- Write: Introduce the editor on a first visit, and offer a switch to the Block editor from the note and the Tips panel. [#52094]
- Write: send users back to My Home or the Reader when they open the editor from a daily prompt card there. [#52388]

### Changed
- Admin color schemes: Mark the WordPress.com-specific color schemes as deprecated, list them last on the profile page, and ask users who still use one to switch. [#52793]
- Agents Manager: Extract into its own package from jetpack-mu-wpcom [#49202]
- AI Launchpad: bundle the jetpack-wp-build-polyfills dependency used by the new launchpad admin page. [#49608]
- Allow the renamed gutenberg-guidelines experiment alongside the existing gutenberg-content-guidelines experiment on Atomic sites. [#48094]
- Charts: update chart grid, axis and label colors immediately when the theme changes. [#51687]
- Connection: Cache the Atomic Persistent Data instance and connection-owner lookup per request to reduce duplicate DB queries. [#48023]
- Copy a site: enable for all paid Atomic-capable plans (Personal, Premium, and Business or higher), mirroring WPCOM. [#49477]
- Enable wp-admin JS error reporting on a subset of sites, to keep up with the React 19 experiment rollout. [#51351] [#51431] [#51713] [#52076] [#52425] [#52869]
- Expiry notices: left-align the front-end banner text, keep the button on one line beside it, and center the dismiss button vertically. [#52435]
- Expiry notices: only the WordPress.com account that bought the plan is offered a renewal; other admins, including those with no WordPress.com account, are told whose plan it is instead. [#52083]
- Expiry notices: Show the plan-expiry notice on the site front-end to logged-in admins, and stand the gifting banner down while it shows. [#52036]
- Expiry notices: show the plan expiry notice on agency-managed sites, telling client admins whose plan it is. [#52139]
- Fatal error screen: extend telemetry dedup windows from 5 minutes to 1 hour. [#48517]
- Forms, Stats: CSV export will now process data containing backslashed quotation marks as specified in the relevant standard. [#51572]
- General: update composer.lock files. [#48743]
- General: Update minimum WordPress version to 7.0. [#49021] [#51370]
- General Settings: Update the domain and site management links to point to the new WordPress.com pages. [#52788]
- Guidelines CPT meta now syncs via jetpack_sync_post_meta_whitelist filter with explicit meta keys instead of prefix matching. [#48212]
- Gutenberg: Enable wp-admin JS error reporting on 1% of Atomic sites. [#50737]
- Incompatible Plugins: unblock Duplicator (duplicator/duplicator.php). Version 5.0.3 added WordPress.com managed host detection and resolved all previous compatibility issues. [#52541]
- Internal: No longer require automattic/jetpack-changelogger as a per-project dev dependency. [#48225]
- Internal: regenerate composer.lock to pick up the podcast package's new automattic/jetpack-connection dependency. [#48774]
- Load only when desired. [#47980]
- Make the help and Ask AI admin bar nodes available from the admin-bar REST endpoints, with the label, icon and destination a client needs. [#51657]
- Move Custom CSS to Devcie Detection [#49659]
- Newspack Blocks: Update the Blog Posts and Posts Carousel blocks to Newspack Blocks 4.30.3. [#51503]
- Omnibar: point the WordPress.com sites and account links to the my.wordpress.com subdomain. [#51928]
- Permalinks: make the Settings → Permalinks page available on all sites and remove the plan-based gating and upsell. [#49303]
- Plan expiry notices: sites on the new expiry notices no longer see the legacy plan-renewal admin notice. [#49304]
- Plugin Conflicts Guardian: raise the Atomic rollout to 2% of sites. [#51463]
- Podcast: split the Distribution directories into Automatic and Manual submission, explain why a disabled button is disabled, and link to your Pocket Casts show once it is live. [#48917]
- Podcast: update composer.lock. [#51897]
- Podcasting: flip jetpack_podcast_untangle globally on Atomic so every WoA site moves to the new jetpack-podcast package (parallel to the wpcom-side flip already live on Simple). [#49004]
- Podcasting: only load the legacy at-pressable-podcasting plugin when the new jetpack-podcast package is not taking over the feature. [#48907]
- Podcasting: stand down the legacy at-pressable-podcasting plugin when the new Jetpack podcast package owns the feature. [#48718]
- Premium Analytics: Align the Most popular post and Latest post cards with the design: regular-weight stat labels and a grey ground behind the featured image. [#52319]
- Premium Analytics: Always show every amount on the All-time balance card and drop its Metrics dropdown. [#52700]
- Premium Analytics: Always show every total on the All-time stats card and drop its Metrics control. [#52261]
- Premium Analytics: Ask the same readiness question when switching the new Traffic tab off, and point to the Modules Visibility setting to switch it back on. [#52186]
- Premium Analytics: ask whether the new Traffic tab is ready to replace the old one, instead of how it compares with the old one. [#52109]
- Premium Analytics: Build the custom date range calendar on the WordPress design system calendar. [#52090]
- Premium Analytics: Call the preview the new Stats in its welcome, feedback and switch-off copy. [#52722]
- Premium Analytics: Cap the cards on report pages at a centered 1440px column on wide screens, so each row's label and numbers stay close enough to read together. [#53139]
- Premium Analytics: disable the dashboard's date controls while customizing its layout. [#52024]
- Premium Analytics: Divide a widget's metrics with lines instead of boxing each one. [#51749]
- Premium Analytics: Download the full report from the Top pages widget instead of the rows on screen, using the report's Title, Views, and URL columns, and add the download to its Archives view. [#52966]
- Premium Analytics: Draw attention to the date control, and read the new period out, when a card or a table cell sets the period rather than the reader. [#52255]
- Premium Analytics: Draw tabbed metric charts in the admin color, with the metric paired in the Traffic summary in a darker shade, instead of a different color per metric. [#53453]
- Premium Analytics: draw the Post views and Video performance charts on the detail pages as bars by default. [#52174]
- Premium Analytics: Even out the header spacing on the post detail page to match the video page. [#51875]
- Premium Analytics: Filter the Earnings history report by payment status, explain Ads Served there, and show unpaid and negative amounts in red on the Earnings History widget. [#52389]
- Premium Analytics: Group the Ads tab's WordAds chart by the selected period instead of a separate grouping control, and add a line or bar chart toggle. [#52483]
- Premium Analytics: hide the report pages behind tabs the Stats dashboard does not show. [#51983]
- Premium Analytics: Keep the custom range calendar's Cancel and Apply buttons at the bottom of the period menu. [#52116]
- Premium Analytics: Label the Insights leaderboard widgets with the period they cover. [#52308]
- Premium Analytics: label the traffic chart's time axis by the size of the bucket behind the data, and name each bar's period in full in its tooltip. [#51274]
- Premium Analytics: Label WooCommerce visitor counts as Store visitors, so they aren't confused with Jetpack Stats visitors. [#53345]
- Premium Analytics: Label WordAds earnings history periods by month and year, such as "August 2026". [#52327]
- Premium Analytics: Lead each chart tooltip row with the value, then the metric, then the date. [#52527]
- Premium Analytics: Let hosts show or hide the Analytics sidebar entry. [#52351]
- Premium Analytics: limit dashboard customization to moving and resizing widgets. [#51986]
- Premium Analytics: Make the days in Monthly posting activity larger, growing with the card and wrapping the months onto two rows in the default layout. [#53341]
- Premium Analytics: Mark the Comments Subscribers and File downloads report links as opening in a new tab. [#53136]
- Premium Analytics: Match the date range control in widget headers to the height of the other header controls, and draw the date triggers with the design system button states. [#52500]
- Premium Analytics: Match the post and video page headers to the layout used across the rest of Analytics. [#51875]
- Premium Analytics: Match the Year in review tile icons to the design and add space between the tiles and the footer link. [#52307]
- Premium Analytics: Move the Ads date range into the WordAds card's own header, and drop the section header's date filter. [#51543]
- Premium Analytics: move the dashboard's Customize button into the page options menu, with Reset to default beside Cancel and Done while customizing. [#52192]
- Premium Analytics: move the dashboard feedback action into a page options menu. [#52023]
- Premium Analytics: Move the Subscribers date range control off the tab header and onto the Subscriber summary chart, which is the only widget there that reads a range. The tab no longer offers a previous-period comparison. [#52421]
- Premium Analytics: Move the Top tags & categories widget to the Traffic tab, where it and its report follow the date picker. [#53299]
- Premium Analytics: Move the Traffic summary's grouping control (by days, weeks or months) into the chart itself, which remembers your choice. [#53140]
- Premium Analytics: Name each metric's comparison period in line and bar chart legends, such as "Views (Prev. 30 days)". [#53457]
- Premium Analytics: Name the dates a comparison covers in the dashboard header, instead of "Previous period", drop the weekdays from ranges longer than a week, and leave the year off ranges that sit inside the current one. [#51420]
- Premium Analytics: offer feedback, the preview opt-out and Reset to default from the post and video detail pages too. [#52190]
- Premium Analytics: On the Subscriber highlights card, show the subscriber count 30, 60, and 90 days ago for sites without paid subscribers, show social followers on any site that has them, rename the first tile to All-time subscribers, and remove the Metrics control. [#52310]
- Premium Analytics: Open on the last 7 days, or on the range you last picked in Stats, and remember a range you apply. [#53276]
- Premium Analytics: Open the Authors, Clicks and UTM reports folded to their top-level groups, and move the drill-down control to the right of the row title. [#51806]
- Premium Analytics: Open the dashboard from the admin bar Stats links and the action bar post stats link when it is enabled. [#52905]
- Premium Analytics: Open the dashboard on the WooCommerce tab when WooCommerce is active. [#53432]
- Premium Analytics: Post detail: bring the page back to the top when a month in All-time traffic sets the period. [#52320]
- Premium Analytics: read ads served, average CPM and revenue out together in the Ads chart tooltip, whichever tab is selected. [#52262]
- Premium Analytics: rearrange the default Ads widgets for the three-column grid, with the chart first, then the balance, then the three history tables side by side. [#52232]
- Premium Analytics: remove the year filter and interval dropdown from the Insights header. [#52175]
- Premium Analytics: Remove Total views, Total visitors, Popular days and Popular hours from the default Insights layout and from the widget picker for now. [#52216]
- Premium Analytics: Rename the Insights section title to Site insights. [#52314]
- Premium Analytics: Rename the Subscribers summary widget to Subscriber summary. [#52413]
- Premium Analytics: rename the Top pages CSV comparison column to "Views (Previous Period)" and move it after the primary columns. [#51705]
- Premium Analytics: Rename the Videos, Clicks, Authors and Locations report CSV headers to match the table columns. [#53271]
- Premium Analytics: Rename the WordAds widgets to Ads summary, All-time balance and WordAds earnings, and give each its own icon. [#52511]
- Premium Analytics: Retitle the Popular post card to "Most popular in the last year". [#52254]
- Premium Analytics: Retitle the Popular post card to "Most popular post in the last 12 months" and pin it to the last 12 months. [#51649]
- Premium Analytics: Shorten the Popular post card title so it survives a narrow dashboard cell. [#51746]
- Premium Analytics: Show All-time stats totals as compact figures, with the exact total in a tooltip. [#52306]
- Premium Analytics: Show a post's monthly views across its whole life on its detail page, in place of the daily heatmap, and picking a month applies it as the page's period. [#52118]
- Premium Analytics: Show chart tooltips with dark text on a light background. [#53184]
- Premium Analytics: show only the Traffic tab while the site is running the Stats preview. [#51979]
- Premium Analytics: Show opens and clicks beside their rates in Latest emails sent. [#52256]
- Premium Analytics: Show payment status as a badge in the Earnings History widget, and shorten the pending statuses to one word with the reason beside them. Negative amounts in the widget are no longer red; only the badge carries colour. [#52565]
- Premium Analytics: Show payment status as a badge on the Earnings history report. [#52437]
- Premium Analytics: show Posting activity's last 12 months as one mini calendar per month. [#52265]
- Premium Analytics: show Subscriber highlights by default on the Subscribers tab and rearrange the widgets for the three-column grid. [#52231]
- Premium Analytics: Show the Ads tab only when WordAds is on, as classic Stats does, not to every plan that includes it. [#52903]
- Premium Analytics: Show the date once in chart tooltips, read each row as value then metric, and list the comparison period in a second column. [#53147]
- Premium Analytics: Show the Earnings History widget's adjustments link as text with a count badge. [#52752]
- Premium Analytics: Show the Earnings History widget as a compact list without in-widget pagination. [#52327]
- Premium Analytics: Show the empty-cell color at the start of heatmap legends such as Posting activity. [#53338]
- Premium Analytics: Show the heatmap tooltips in the dark style, the daily ones titled with the date; draw the Views over years and post All-time traffic cells as flush bands under a continuous scale, lifting a hovered month with a light ring and a shadow. [#52369]
- Premium Analytics: show the Insights tab beside Traffic while the site is running the Stats preview, and name both tabs in the preview's welcome, feedback and switch-off copy. [#52525]
- Premium Analytics: show the latest emails sent as a plain list of subjects and rates. [#51425]
- Premium Analytics: Show the site's monthly views across every year on the Insights tab, in place of the daily heatmap; picking a month opens the Traffic tab over it. [#52217]
- Premium Analytics: Show Visitors on the Traffic summary chart alongside Views by default. [#52896]
- Premium Analytics: Title the Ads tab Ads performance, reword the WordAds widget tips, and tidy the Earnings report table. [#52714]
- Profile Settings: reword the WordPress.com links on wp-admin/profile.php to "Edit account settings on WordPress.com". [#51932]
- Pull in the latest jetpack-podcast package (adds the Podcast Episode block, gated behind the jetpack_podcast_untangle filter; no behavior change while off). [#48546]
- Recovery-mode sync: include per-extension error info so wpcom-side consumers can surface what fataled. [#48440]
- Redesign the fatal error screen: identify the likely-cause plugin, offer admins a one-click signed deactivation URL, surface recovery mode when available, and link to WordPress.com support. [#48201]
- Refactored URL linkification to use WP_HTML_Tag_Processor for more robust HTML parsing. [#47055]
- Remove unneeded development and documentation files from the published plugin. [#49014]
- Return site purchases in a declared shape, with billing-derived auto-renew state behind accessors. [#51155]
- RTC: Skip unnecessary eligibility checks when real-time collaboration is disabled. [#52146]
- Site Logs: Make PHP error and web server logs available on Personal and Premium plans. [#52371]
- Social: Enable message templates feature for WPCOM sites. [#49300]
- Stats: Hide WordPress admin notices on the Stats dashboard, and let hosts show or hide the Stats sidebar entry. [#52351]
- Stop serving COLOURLovers background images now that COLOURLovers support has been discontinued. [#50011]
- Sync features list with WPCOM - add Student plan with Business plan feature parity. [#50003]
- Sync features list with WPCOM - removing social unified UI feature flag. [#49423]
- Sync features list with WPCOM to enable access to new features for legacy sites. [#51957]
- Tested up to WordPress 7.1. [#48114] [#51370]
- Update composer.lock files. [#48557] [#48702] [#49415] [#49918] [#50266]
- Updated package dependencies. [#48735] [#49425] [#49769] [#49793] [#50248] [#50850] [#48064] [#48683] [#49012] [#49448] [#50436] [#52028] [#52297] [#53032]
- Update wc-calypso-bridge to 2.11.10. [#51946] [#52360]
- Update wp-php-toolkit dependencies. [#48321]
- Use apply_shortcodes() terminology instead of do_shortcode(). [#53552]
- WP.com Error Reporting: delegate all decisions to host-specific filters [#50483]
- WP.com Error Reporting: use direct fetch with no CORS preflight [#50503]
- wpcom-fatal-error: rename the fatal-error screen's "Likely cause" heading to "Suspected plugin" / "Suspected theme", identify theme-origin fatals so the card shows the theme's name / version / description, and surface Error details + Environment (WordPress / PHP / theme / server) as always-visible sections below the card. [#48239]
- wpcom-fatal-error: rewrite the admin recovery-mode email — WordPress.com-branded HTML matching the fatal-error screen, with the site name, suspected plugin/theme card, action links into wp-admin, and separate Error details + Environment sections. [#48238]
- wpcom-features: make BIG_SKY the single paid-plan eligibility gate for Big Sky / AI sidebar; remove BIG_SKY_EXISTING_SITE; add Starter to GLOBAL_STYLES. [#48385]
- WPCOM Features: Make partner themes available on Personal and Premium plans. [#52936]
- WPCOM Features: Make premium themes available on Personal and higher plans. [#53119]
- WPCOMSH_Log: add `unsafe_direct_log_logstash()` for records that need their own /logstash `feature` bucket; route fatal-error signatures through it under feature `atomic_extension_conflict` (severity `critical`). [#48399]
- WPCOMSH_Log: drop the unused top-level `siteurl` field from /logstash payloads (the receiver doesn't consume it). Fatal-error signatures now pass `site_url` as a property instead, so it lands at `properties.site_url` in Kibana alongside the other indexed fields. [#48401]
- Write: Remember a switch to the Block editor, so the Daily Writing Prompt widget stops offering Write. [#52230]

### Removed
- Podcast: Remove the Atomic module opt-in and force-activation, so the module follows the site's own setting. [#51409]
- Podcasting: remove the at-pressable-podcasting bridge now that the jetpack-podcast package owns the experience on every WoA site. [#49548]
- Premium Analytics: Remove the Sponsored Content History and Adjustments History widgets from the Ads tab. [#52420]
- Premium Analytics: Remove the Traffic views activity heatmap widget from the Insights tab, which Views over years replaced. [#52364]
- Remove COLOURLovers UI feature [#41540]
- Remove the Tools > Marketing page and its menu item. Old links to it now go to the dashboard. [#52195]
- Revert the Jetpack-side changes that re-enabled X (Twitter) sharing in Jetpack Social. [#49309]
- Subscriptions: Remove the transitional Subscribers announcement page from the Jetpack menu. [#51906]

### Fixed
- Activity Log: Turn the Activity Log on for newly transferred and reset sites. [#53559]
- Admin bar: don't treat the default favicon fallback as a site icon [#50531]
- Admin bar: Fix site name and wpcom account menu item height. [#51706]
- Admin color schemes: render the checked checkbox and radio marks in white, matching core. [#51774]
- Admin color schemes: Stop labelling the Fresh scheme "Default", which duplicated the Default (Modern) entry on WordPress 7.0. [#51376]
- Admin dashboards: Keep the page header and content in view when the wp-admin menu is taller than the window. [#51696]
- Backup: Load translations for the Backup page. [#53513]
- Block editor: Stop saying a published post is live while the site is Coming Soon, and link to the Site visibility setting. [#52427]
- Charts: Fix unreadable axis labels in forced-colors mode. [#52268]
- Charts: Place line and area chart date ticks on the site's time zone boundaries, name the hour in tooltips on hourly data, and read hour labels in the site's own locale rather than a forced 12-hour clock. [#51813]
- Charts: Restore keyboard focus after dismissing line chart tooltips. [#52284]
- Coming Soon: Revert the platform Coming Soon fallback for sites without a wpcom_public_coming_soon option row. It put launched sites whose platform value was stale into Coming Soon. [#52837]
- Connection: Fix a stale connection error notice that could persist on healthy sites. [#52264]
- Connection: Point the WordPress.com account link in the plan owner email warning to my.wordpress.com. [#52754]
- Connection: Translate the Connectors card's text on sites that don't use English. [#53179]
- Connection: Update wording for some connection error notices. [#51360]
- Crowdsignal: suppress the onboarding and "link your account" notices that cluttered the Plugins page on WoA sites after activation. [#50161]
- Custom Colors: Fix translucent color rules being output as fully transparent. [#52433]
- Custom Colors: Scope Customizer colors to the editor content so they no longer leak into the block editor UI (e.g. the sidebar's Categories panel). [#49476]
- Custom Colors: stop injecting Customizer colors into the block editor so they no longer leak into the editor UI [#49601]
- Dashboards: Stop the frame from flashing while loading and when switching admin pages. [#52235]
- Embeds: Fix wp.me shortlinks to Atomic sites not rendering a rich preview. [#53037]
- Fatal error screen: ensure enough free memory before rendering (raising the limit when headroom is short, or falling back to core's screen) so the screen no longer exhausts memory mid-render on a near-limit request and masks the real error in logs. [#50086]
- Fixed a regression added on https://github.com/Automattic/jetpack/pull/48286 [#48521]
- Google Fonts: stop force-activating the module on every request, and stop hiding it from the classic Jetpack modules screen, so it is no longer auto-enabled by default and can be toggled off and back on. [#49604]
- Launch: Do not show the pre-launch confirmation modal on trial sites, which still need to choose a plan and domain. [#51936]
- Managed plugins: remove the stray separator line between a managed plugin's row and its "automatically managed" notice on the Plugins screen. [#52220]
- PayPal Payment Buttons: include PayPal's own error details when it rejects a partner referral, so a failed connection says what was wrong. [#51656]
- PayPal Payment Buttons: name the platform credential constants that are missing when an environment is only partly configured. [#51656]
- PayPal Payment Buttons: refuse to generate an onboarding link when the platform partner merchant ID is not configured, instead of failing later with an unrelated error. [#51656]
- Phan: Address PhanPluginDuplicateConditionalNullCoalescing violations. [#48887]
- Playground import: Detect and import backups that store the SQLite database in a randomized `.ht.<hash>` folder. [#53023]
- Plugin Conflicts Guardian: fix the staged rollout so the pre-flight plugin check reaches its intended share of sites. [#51392]
- Plugins: Fix Empty cart and Save cart staying on checkout, instead of returning to Add Plugins, when Add Plugins was opened from another page. [#53595]
- Podcast: Fix the dashboard overlapping the admin menu in right-to-left languages. [#51963]
- Podcast: Scope the generated episodes list to the posts the current user can edit, matching the Posts screen. [#51816]
- Podcast dashboard: keep the chart tooltip under sticky and fixed page elements. [#51640]
- Premium Analytics: Compare a date range against a previous month or year of the same length, so the percentages no longer measure 30 days against 29. Whole calendar months still compare month to month. [#51469]
- Premium Analytics: Compare Last 30 days and custom ranges starting mid-month with the same number of days right before them. [#53272]
- Premium Analytics: Compute date-filter day boundaries in the site's timezone, so visitors west of the site timezone no longer get stretched ranges or wrong chart buckets. [#51419]
- Premium Analytics: Draw attention to the date control when a click on the Traffic summary chart sets the period. [#53142]
- Premium Analytics: Draw the bars on a bar chart whose value stays the same across the whole period, instead of leaving the chart empty. [#52522]
- Premium Analytics: Drop the Last 24 hours range from the WordAds card, which has no hourly data to chart. [#51633]
- Premium Analytics: Drop the URL column from the comment authors CSV, since its links only worked on the site and could expose guest commenters' email addresses. [#53138]
- Premium Analytics: fix a stray label stacked at the left edge of a chart's time axis after hiding a series from the legend, or when the chart mixes labelled bars with dated ones or compares two periods, and stop a labelled bar's tooltip reading "Invalid Date". [#51343]
- Premium Analytics: Fix chart tooltips wrapping into a narrow column on WordPress.com, and metric tab text showing through a tooltip. [#53135]
- Premium Analytics: Fix the center total of donut and semi-circle charts showing through the chart tooltip. [#53449]
- Premium Analytics: Fix the Subscribers summary help text to describe the cumulative subscriber total the chart plots, not new subscribers. [#51697]
- Premium Analytics: Fix value axis labels piling up at the left edge of a summary bar chart resized to one row. [#53203]
- Premium Analytics: Follow the WooCommerce Analytics date type setting in store reports instead of always using the order creation date. [#53347]
- Premium Analytics: Give map, leaderboard and conversion funnel charts an accessible name and role for screen readers. [#53516]
- Premium Analytics: Include the last day of the selected range in the WordAds card. [#51751]
- Premium Analytics: Keep the date picker on the range a chart drill-down applies. [#51924]
- Premium Analytics: keep the full set of ticks on the traffic chart's time axis, which could thin out to two labels on longer date ranges. [#51339]
- Premium Analytics: Keep the keyboard-selected cell of the Views over years and a post's All-time traffic heatmaps in view, clear of the month and year labels, when the grid scrolls. [#52259]
- Premium Analytics: keep the same calendar dates when comparing a range starting on the 1st with the previous year, so Year to date in a leap year starts on 1 January rather than 31 December. [#52215]
- Premium Analytics: keep the year and the day on the traffic chart's time axis, which could previously skip the tick that named them, and stop the same label falling on two ticks in a row. [#51339]
- Premium Analytics: Keep the year column and month labels of the Views over years and a post's All-time traffic heatmaps fully opaque while the grid scrolls, so scrolled-under cells no longer show through around them. [#52309]
- Premium Analytics: keep the Year in review report link reachable. [#51747]
- Premium Analytics: Label a partial first or last week on the Traffic and Subscribers charts with the selected range's own start or end date. [#53137]
- Premium Analytics: Leave Average CPM empty instead of showing $0.00 in the Ads chart for periods with no ads served. [#52690]
- Premium Analytics: Leave the months before a site launched or turned on subscriptions empty in the Subscriber summary chart, with a "No data" tooltip, instead of showing zero. [#52523]
- Premium Analytics: Let one-row summary charts, such as the default Store performance tile, show their tooltip by drawing them as sparklines without axes. [#53206]
- Premium Analytics: Link a subscriber's name to their subscriber details page. [#51634]
- Premium Analytics: Make donut and semi-circle chart widgets such as Devices reachable by keyboard, and name them for screen readers. [#53274]
- Premium Analytics: Make low values in heatmaps such as Posting activity easier to tell apart from empty cells, and show zero counts as empty. [#53085]
- Premium Analytics: Open the Ads tab's WordAds chart on the last 7 days rather than a single day on a site launched today. [#52421]
- Premium Analytics: Open the date menus on the applied option instead of the first one. [#53081]
- Premium Analytics: Pair each week with its matching week in a year-ago weekly comparison, and show the days each week covers in the Traffic and ads chart tooltips. [#53207]
- Premium Analytics: Post detail: stop the Post traffic layout from flashing when an email tab is opened directly, and show placeholder lines in the header while the title loads. [#51805]
- Premium Analytics: print Tags & categories view counts in full, and list far more rows in its report. [#51646]
- Premium Analytics: print the Annual insights words-per-post average whole, as the old Stats report does. [#51747]
- Premium Analytics: Remove the quarterly chart interval option, which never changed the chart. [#51631]
- Premium Analytics: Reports: show the Referrers, Clicks, Authors and UTM tables at one weight on every row, so the chevron alone marks a row that expands. [#53306]
- Premium Analytics: Return the Stats breadcrumb to the dashboard tab a report or detail page was opened from, instead of always to Traffic. [#52862]
- Premium Analytics: Show "1 Subscriber" rather than "1 Subscribers" in chart tooltips, using each language's plural rules. [#52683]
- Premium Analytics: Show abbreviated month names on chart x-axes in line and area views. [#51531]
- Premium Analytics: Show a dash instead of zero in the Earnings history report when a period has no Ads Served count. [#52510]
- Premium Analytics: Show a notice when a refresh fails, instead of silently leaving the previous numbers on screen. [#51383]
- Premium Analytics: Show a sent but unopened email's open and click rates as 0% instead of a dash, show the email tabs for emails whose sends went unrecorded, and leave unknown rates blank in the Emails export. [#52684]
- Premium Analytics: Show a video watched for a few minutes as "< 0.1" hours, not 0.0, on the Videos report and video detail page. [#53269]
- Premium Analytics: Show chart dates in the site's timezone and locale, and name the hour on hourly charts. [#51814]
- Premium Analytics: Show each number on a chart's value axis once when the counts are small, instead of repeating 0 and 1. [#52588]
- Premium Analytics: Show published dates in the site's language and date format. [#51967]
- Premium Analytics: Show readable link names in an email's Top links list, and list the links clicked inside the post instead of dropping them. [#52685]
- Premium Analytics: Show report load errors in a notice across the report, without Retry when access is denied. Show access denied on author, post, and video details as an error. [#53141]
- Premium Analytics: Show store revenue and other money values in the store's currency instead of always US dollars. [#53350]
- Premium Analytics: Show the "No data found" state on every report with no rows, and stop the table search and settings from showing while an empty report loads. [#52900]
- Premium Analytics: Show the author's name in the author page breadcrumb. [#53468]
- Premium Analytics: Show the dashboard right away instead of a sync screen, and flag the Store section's numbers as incomplete while store data is still syncing. [#51279]
- Premium Analytics: Show the date menus opened from a widget's controls above the controls popover. [#52751]
- Premium Analytics: Show views per visitor and the number of posts published in the Traffic chart tooltip. [#52957]
- Premium Analytics: Start bar chart value axes at zero so a small change no longer looks like a large one. [#52597]
- Premium Analytics: Start line chart value axes at zero, and pad the Subscribers chart's axis a little below its data, so a small change no longer looks like a large one. [#52600]
- Premium Analytics: Stop applying hidden date comparisons in dashboard sections that do not offer the control. [#51381]
- Premium Analytics: Stop listing an author's post that only appears in the comparison period as 0 (-100%). [#52678]
- Premium Analytics: Stop the Ads chart interval menu offering buckets the WordAds chart cannot draw. [#51639]
- Premium Analytics: write the calendar heatmap's weekday, month and tooltip labels in the site's language. [#52115]
- Prevent Crowdsignal Forms from redirecting to its settings page on WoA sites after the Atomic transfer or a managed plugin version bump. [#49986]
- Profile Settings: Point the WordPress.com links on wp-admin/profile.php to the matching my.wordpress.com settings pages. [#52754]
- Recurring Payments: restore the unconditional free-tier branch so free-plan sites keep paid newsletters and paid subscriptions. [#50779]
- Restore custom-fonts typekit provider json files that shouldn't have been deleted. [#49247]
- Site purchases: Fix a fatal error when a cached purchase row arrives in an unexpected shape. [#51792]
- Site setup: Continue the wp-admin menu color behind the page frame on WordPress.com admin color schemes. [#51619]
- Site Setup: Show the loading spinner on the task button that was clicked (such as Skip) rather than always on the primary action. [#53226]
- Site visibility: Stop the site launch celebration modal from reappearing after saving Reading settings. [#51655]
- Stats: Only show the admin bar link when the Stats module is active. [#51693]
- Themes: retry after a failed read of the WordPress.com theme list, rather than leaving the Add Themes tabs without WordPress.com themes for a day. [#53511]
- Themes: when a plan does not include WordPress.org themes, remove those themes from the Add Themes results rather than emptying the results. [#53511]
- Update the Gutenberg Experiments slug [#52787]
- Update wc-calypso-bridge to 2.11.7. [#51484]
- Widgets: Catch various PHP warnings when params are incomplete. [#53061]
- Write: Allow adding text above a quote, such as a writing prompt, and fix quotes that split in two or could not be turned off. [#52934]
- Write: Keep selected text highlighted when turning a quote on or off, and let Undo reverse turning a quote off. [#53035]
- Write: Stop showing wp-admin notices, such as the plan expiry banner, behind the editor header. [#52605]

## 9.0.0 - 2026-04-09
### Added
- ActivityPub: Add new feature plugin, handling a custom sync event triggered when the plugin is activated. [#47346]
- Add a new feature to WPCOM_Features. [#46587] [#46629]
- Add autoloader check to prevent fatal errors when plugin is activated before composer install. [#46489]
- Add automattic/explat dependency. [#46066]
- Add domain features for woo_hosted plans. [#45687]
- Add feature flag for X connection support for Jetpack Social. [#47547]
- Add Real-time Collaboration as a WP.com plan feature. [#47483]
- Add SCAN_SELF_SERVE feature and expand SCAN access to all WoW plans. [#47187]
- Add Social unified UI feature flag. [#46061]
- Add Studio Sync features for lower plans. [#47966]
- Add support for user tokens in external storage. [#45303]
- Add Tracks events to theme screens. [#45587]
- Add warning when protected owner email is edited. [#46899]
- Disable outgoing and incoming pingbacks for staging sites. [#47628]
- Enable error logging for external storage. [#46795]
- Feature gating for payment-buttons and paypal-payment-buttons blocks. [#46536]
- Gutenberg RTC: Add PingHub provider for real-time collaboration WebSocket connections. [#47421]
- Gutenberg RTC: Add support for HTTP polling provider for real-time collaboration. [#47485]
- Gutenberg RTC: Connect to PingHub WebSocket directly using a server-generated JWT token, fixing real-time collaboration on custom-domain Atomic sites with third-party cookie restrictions. [#47556]
- Gutenberg RTC: Enable Real-Time Collaboration feature for sites with the REAL_TIME_COLLABORATION feature. [#47512]
- Holiday Snow: Add speed and hemisphere settings. [#46139]
- IDC: Add revalidation for IDCs. [#46268]
- Introduce Attachment pages setting in the media settings screen in wp-admin which controlls the `wp_attachment_pages_enabled` option. [#40590]
- RTC: HTTP-polling ramp up for WoW sites. [#47718]
- Support linking back to my.wordpress.com domain. [#46559]
- Tested up to WordPress 6.9. [#45571]
- Unregister the Gutenberg RTC setting on the Writing page if there are no RTC providers. [#47403]
- Update scssphp/scssphp dependency. [#45757]
- WordPress.com Reader: Add new feature plugin to force the activation of the new Reader module. [#46782]

### Changed
- ActivityPub: Include WebFinger handle alongside actor URI in plugin activation sync data. [#47402]
- Add 'mass-pagesposts-creator' to the plugin list we disallow for WoA sites. [#46050]
- Add form-webhooks feature support for WordPress.com plans. [#46059]
- Add support for 200GB legacy space through sticker. [#46920]
- Add support for flex plans. [#45492]
- Add/remove features to plans for a future experiment. [#46285]
- Adjust incompatible plugins list. [#46225] [#46286] [#46577] [#47280]
- Allow Atomic sites that have access to Global Styles to use Custom CSS. [#46632]
- Allow the content-guidelines Gutenberg experiment on Atomic sites instead of blanket-disabling all experiments. [#47581]
- Allow users with the UPLOAD_VIDEO_FILES feature to upload videos without VideoPress. [#46425]
- Code block: Remove active line highlight when block is unselected. [#45828]
- Code block: Remove experimental warning. [#45827]
- Custom post types: Ensure features remain available when theme support is added. [#45407]
- Dependencies: Update lock file to keep root requirements in sync. [#47418]
- Do not translate product names. [#43961]
- Enable Social unified UI v1 feature flag. [#47158]
- Gate for the Forms Integrations feature [#46829]
- Modify error logging. [#46919]
- Private site: Rename "Subscriber" role to "Viewer". [#45956]
- Remove header border-bottom from the admin page for a cleaner unified header appearance. [#47313]
- Remove unused `jetpack_show_wpcom_upgrades_email_menu` filter. [#47146]
- Removed Summer Special checks for backups on wpcomsh. [#46850]
- Replace use of confusing `esc_js` with `wp_json_encode`, or with nothing where it had no effect. [#46229]
- Tests: Ensure PHP 8.5 compatibility. [#45769]
- Update design of the sidebar upsell. [#47909]
- Update package dependencies. [#45478] [#45771] [#45958] [#46066] [#46082] [#46785] [#47021] [#47505] [#47799] [#47899]
- Update the feature gating for Donations, allowing conditional hiding based on a sticker. [#46472]
- WPCOM: Add logs, monitoring, performance hosting features. [#45622]
- WPCOM: Sync changes from class-wpcom-features.php. [#45675] [#45848] [#46576]

### Removed
- General: Update minimum WordPress version to 6.8. [#46801]
- JP Sitemaps: Remove sticker determination for XMLWriter. [#45527]
- Remove "Super Blank" plugin (`super-blank`) from list of incompatible plugins. [#46735]
- Remove JetBackup from incompatible plugins list. [#46618]
- Remove persistent data empty state logging. [#47250]
- Remove the dotcom command palette. [#46579]
- Remove unused constants. [#47241]
- RTC: Move implementation to generic package. [#47713]

### Fixed
- Add function_exists() check for wpcom_is_automattic_p2_site to prevent fatal errors when the function is undefined. [#47676]
- Admin Page: Restore border on header component. [#47425]
- Changed the Playground loader to reflect new database schema generated from the SQLite plugin. [#46825]
- Custom Colors: Ensure Customizer's custom colors are enqueued in the block editor when set. [#46863]
- Custom Colors: Fix block editor CSS not applying in Gutenberg 22.6.0+ iframe context. [#47603]
- Custom Colors: Prevent warnings when handling malformed data. [#45925]
- Ensure proper flags are used with `json_encode()`. [#46117]
- Fix "Really Simple SSL" typo in file path. [#46267]
- Fix disabling of outgoing pingbacks from staging sites. [#47752]
- Fix feature gating for payment blocks on WoW sites. [#46690]
- Fix plugin auto-update sync by preventing the `pre_option_auto_update_plugins` filter from interfering with Jetpack XML RPC requests. [#45636]
- Fix product features cache key to include gating-business-q1 sticker status for the calypso_plans_differentiators_20251210 experiment. [#46428]
- Fix the slug and file path for Really Simple Security (formerly Really Simple SSL) in the incompatibility list. [#46833]
- Footer: Avoid PHP errors when nested in output buffering. [#45732]
- I18n: Correct WPCOM locale fallback when theme .mo files use {textdomain}-{locale} names under the themes directory. [#48016]
- Jetpack: Remove getIconColor functions for block icons. [#45992]
- Legacy Pro plan: Remove artificial media storage limit. [#46543]
- Make Discussion Settings UI reflect that pingbacks are disabled on staging sites. [#47817]
- Managed Plugins: Handle malformed data gracefully. [#46053]
- Newsletter: Fix Reading page notice URL and link to new settings page when the jetpack_wp_admin_newsletter_settings_enabled filter is enabled. [#47347]
- Patch for A4A. [#46029]
- Phan: Address PhanPossiblyUndeclaredVariable violations. [#45911]
- Phan: Address PhanRedundantCondition, PhanRedundantArrayValuesCall, and PhanPluginRedundantAssignment violations. [#45681]
- Podcasting: Prevent PHP warnings when metadata is incomplete. [#46071]
- Prevent PHP 8.2+ deprecation warnings. [#45798]
- Prevent PHP errors when doing SSO bypass checks. [#45859]
- Prevent PHP errors when handling Google Fonts URLs. [#45858]
- Prevent PHP warnings when handling unexpected data types. [#45798]
- Private site: Auto-redirect to login. [#45584]
- Private sites: Prevent PHP errors. [#45860]
- Social: Fix the incorrect format of feature flag for unified UI v1. [#46078]
- Update wc-calypso-bridge. [#46731] [#47487] [#47816]
- Widgets: Prevent PHP warnings when variables are undefined or malformed. [#45934]
- Wrap deprecated no-op function in PHP version checks. [#45766]

## 8.0.0 - 2025-10-10
### Added
- Add Code block (experimental). [#45181]
- Add support for connection external storage class. [#44755]
- Improve compatibility for sites with `summer-special-2025` sticker. [#44680] [#45053] [#45199]
- Newspack blocks: Load feature on agency sites. [#44906]
- Staging Sites: Add CLI commands to clear WordPress.com Performance Profiler data after site cloning. [#45318]
- WPCOM Features: Add granular features for all theme tiers. [#45383]

### Changed
- CLI: Improve error searching in `diag` command. [#44902]
- Restrict unsupported file types from being selectable in media uploader based on site features. [#44798]
- Send JSON with built-in WordPress functions. [#45002]
- Update package dependencies. [#44725] [#44948] [#45096]
- WPCOM: Sync changes from class-wpcom-features.php [#45365]

### Removed
- Remove `WPCOMSH_Blog_Token_Resilience` class. [#45317] [#45384]

### Fixed
- Add missing WordPress.com feature checks on theme API functions on Atomic. [#45413]
- Code: Resolve PhanImpossibleCondition violations. [#44869]
- Freshly Pressed widget: Fix PHP warning. [#44962]
- MovableType Import: Prevent duplicated comments. [#45139]
- Update wc-calypso-bridge from 2.11.2 to 2.11.3. [#45409]

## 7.1.0 - 2025-08-05
### Added
- Add archives endpoint support. [#44028]
- Add a new `wp wpcomsh diagnostic` command. [#44363]
- Allow certain Personal and Premium plans to install plugins. [#44257] [#44414]
- Code editors: Added advanced code and CSS editors. [#44232]
- Forms: Include multistep form in Jetpack and WordPress.com plans. [#44309]
- SEO: Enable advanced features for localized version of developer.wordpress.com. [#43941]
- Settings: Add tracking for launch action. [#43859]

### Changed
- Improve performance of WordPress.com comment likes by caching and minimizing API requests. [#44205]
- My Jetpack: Unify the user connection flow with a unified screen. [#44469]
- Sync: Ignore the ActivityPub Outbox CPT. [#44222]
- Update package dependencies. [#44206] [#44217]

### Removed
- Remove backward compatibility for old version of `Error_Handler` class. [#44543]
- Remove CSS that hides connection info from the dashboard. [#43874]
- Remove language files after #42172, #42494, #42521, and #42550. [#44082]

### Fixed
- Allow default featured image in emails. [#44530]
- Bump wc-calypso-bridge package to 2.11.2. [#44111] [#44428]
- Fix connection tests. [#44281]
- JITM: Fix ineffective caching due to expired plugin sync transient. [#44117]
- JITM: Update to remove jQuery dependency. [#43783]
- Playground Importer: Fix query error generated by SQLite table with no entries in the data types cache table. [#43900]
- Private site: Ensure private sites return a valid cookie expiration value. [#44328]

## 7.0.0 - 2025-06-09
### Added
- Add ability to test with other Jetpack monorepo plugins active. [#43259]
- Add hook to signal a migration has ended using AIOWP. [#42992]
- Add support for protected connection owner. [#43601]
- Add jetpack-forms package dependency. [#43527]
- Featured Content: Add messaging to clarify that the tag name is case sensitive. [#43165]
- Forms: Add field-file feature/block support on WordPress.com plans. [#43177]
- Managed Plugin: Populate managed plugin list option on plugin install or update. [#43007]
- Social: Enable share status for all sites. [#43056]

### Changed
- Admin Menu: Update the icon of WooCommerce for the Woo installation. [#43029]
- bilmur: Include theme name. [#43452]
- Bump wc-calypso-bridge version. [#43038] [#43393]
- Compatibility: Use new `set_transient` hook in place of `setted_transient` hook deprecated in WordPress 6.8. [#43090]
- Consolidate widget-related code from wpcom and wpcomsh into jetpack-mu-wpcom. [#42974]
- Plugin management: Enable bulk plugin deactivation. [#42965]
- Site Visibility: Disable search engines indexing for sites with wpcomstaging.com domain. [#42853]
- Update package dependencies. [#43085] [#43425] [#43839]
- Use Jetpack Autoloader. [#43618]

### Deprecated
- Remove `default_rendering_mode` hotfix. [#42984]

### Removed
- Color Scheme: Clean up *-rgb css variables. [#42960]
- General: Update minimum WordPress version to 6.7. [#43192]
- Move "I voted" widget from wpcomsh to jetpack-mu-wpcom. [#42924]
- Remove legacy CI files. [#43434]
- Remove links to deprecated Calypso views on the launchpad tasks. [#42923]
- Remove wp-staging from incompatible plugins list. [#43170]
- Social: Remove unused feature flags. [#43037]

### Fixed
- Block editor: Fix layout issues with the Media Library modal buttons. [#43035]
- Check for classes and methods before call. [#43606]
- Code: Update stylesheets to use hex instead of named colors. [#42920]
- Code: Update stylesheets to use WordPress font styles. [#42928]
- Ensure Jetpack modules are enabled after transferring to WP Cloud. [#42971]
- Ensure wpcomsh users are able to purchase the Boost paid offering. [#43262]
- Fix wrapping on the stats column heading in non-English languages. [#43630]
- Fix Jetpack menu on untangled screens. [#43727]
- Linting: Clean up various Stylelint violations. [#43166]
- Linting: Do additional stylesheet cleanup. [#43247]
- Linting: Fix more Stylelint violations. [#43213]
- Linting: Remove outdated vendor prefixes in stylesheets. [#43219]
- Linting: Use double colon notation for pseudo-element selectors. [#43019]
- My Jetpack: Fix readability of license activation button on hover. [#43550]
- Podcasts: Make episode images comply with Apple requirements. [#43769]
- Tests: Add script that runs PHPUnit tests. [#43500]

## 6.1.0 - 2025-04-07
### Added
- Add `AI_SEO_ENHANCER` feature for Business plans and above and JP Complete plans. [#42731]
- Add Atomic site ID to WooCommerce tracker data. [#42588]
- Add a temporary version of Instant Search which excludes business/commerce sites for performance reasons. [#42117]
- Add newsletter widget. [#41807]
- Add Account Protection initialization. [#40925]
- Add site launch button to the admin bar. [#41240]
- Add subscribers in WP Admin boostrap page. [#42066]
- Add `wpcomsh_at_managed_plugins` option to allowed list for sync. [#42287]
- Bump a Tracks stat for every wp-admin page view. [#42422]
- Business sites are now added on Instant Search. [#41963]
- Connection: Disconnect all other users before disconnecting a connection owner account. [#41923]
- Dashboard: Add Daily Writing Prompt widget. [#41094]
- Dashboard: Add general tasks widget. [#41150]
- Dashboard: Add launchpad. [#41434]
- Dashboard: Add site preview and links. [#41106]
- External Media: Add external media modal on the Media Import page. [#41282]
- Hotfix: Add filter to hide the Elementor Beta/Dev install banner. [#42219]
- Import Media: Introduce the Import Media page. [#41032]
- Incompatible Plugins: Add `object-cache-pro` and variation of `wp-simple-firewall`. [#42654]
- Launchpad: Add `create-course-goal` intent task list. [#42108]
- Managed Plugins: Maintain list of Atomic-managed plugins. [#42164]
- Media Library: Support Upload from URL on media-new page. [#41627]
- Newsletter Dashboard Widget: Remove feature flag and enable widget. [#42276]
- Post List: Add a Copy Link Quick Action. [#41305]
- Social: Enable Social Post UI for WordPress.com. [#41219]
- Untangle Calypso media page. [#41628]
- WOA: Add WordAds post transfer action. [#38915]
- WPCOM Site Helper CLI: Add processing for `woocommerce_helper_data`. [#41910]

### Changed
- Add Complete to AI features and sync other changes on wpcom features. [#40545]
- Admin Bar: Point the Edit Site menu item to `site-editor.php`. [#41137]
- Admin Color Schemes: Update color schemes to match Calypso. [#40908]
- Report site timezone via Bilmur RUM library. [#41964]
- Code: First pass of style coding standards. [#42734]
- Code: Use function-style `exit()` and `die()` with a default status code of 0. [#41167]
- Connection: Allow pre-selected login providers. [#42662]
- Connection: Display connection status on Users page independent of the SSO module. [#41794]
- External Media: Move the GooglePhotosMedia, OpenverseMedia, and PexelsMedia to `@automattic/jetpack-shared-extension-utils`. [#41078]
- General: Indicate compatibility with WordPress 6.8. [#42701]
- Hide "Verify Email" launchpad task for existing users. [#41326]
- i18n: Use translations from WP_LANG_DIR. [#42521]
- Legacy Music Player Widget: Add hook to bump stats on view. [#42541]
- Legacy Music Player Widget: Hide from the block-based widget editor. [#42540]
- Media Library: Hide storage info on Atomic upload.php's uploader. [#41625]
- Move logo-tool to be within `jetpack-mu-wpcom`. [#42598]
- Prevent site owner from editing user's account-level fields. [#42177]
- Newspack Blocks: Updated to version 4.5.2. [#40636]
- Site Visibility: Port the site visibility settings from Calypso to WP Admin. [#42230]
- Social: Enable connections management for WordPress.com sites. [#41019]
- Social: Enable media sharing for WordPress.com Business plan. [#41355]
- Social: Enable social admin page for all WordPress.com sites. [#41713]
- Social: Enable Social Image Generator for WordPress.com sites. [#42548]
- Social: Use feature flag for social admin page. [#41413]
- SSO: Use same login page after logging out as when already logged out. [#42586]
- Theme: Clean up files that were used during the theme switch and theme preview. [#42420]
- Theme Switch: Do not change homepage when switching theme. [#42388]
- Typekit Custom Fonts: Add license. [#42862]
- Typekit Custom Fonts: Avoid deprecation notices in PHP 8.2. [#42862]
- Update AIOWP tracks events. [#40149]
- Update composer.lock file. [#41066]
- Update deployment section with automatic releases & deploys [#42608]
- Update package dependencies. [#40515] [#40814] [#40980] [#41659]
- Update minimum PHP version to 8.1. [#41928]
- Update package dependencies. [#42180] [#42815]
- Update Site Settings link copy. [#41663]
- Update wc-calypso-bridge dependency. [#41453] [#41569] [#42360] [#42531] [#42606] [#42720]
- Use a new endpoint to get the list of themes from WordPress.com [#42143]
- Use `automattic/jetpack-composer-plugin` so jetpack-library packages will be installed in a place where `wp i18n` will see them. [#41185]
- Enable WordAds module via WP-CLI post transfer. [#40909]

### Deprecated
- Remove an extra instant search feature which included the Business/commerce sites. [#42710]

### Removed
- Remove the "Personalize Link in Bio" launchpad task. [#41949]
- Remove the launch bar from the frontend of Atomic sites. [#41113]
- Start page pattern modal: Remove start page pattern modal and default to core behavior. [#41479]
- Default to core welcome guide instead of custom welcome tour when the user creates a post for the first time. [#41258]

### Fixed
- Add Business sites back to Classic Search.. [#42254]
- Admin Color Scheme: Fix the color of the Aquatic color scheme. [#42632]
- Avoid opening Fiverr link when hitting Enter. [#42093]
- Do not set default values for autoincrement columns. [#42257]
- Fix missing SQLite default driver index sizes. [#42371]
- Remove Customizer color styles from the editor. [#41186]
- Fix undefined array key warnings on any Customizer theme with colors. [#41136]
- Fix a database password escaping issue when installing tests. [#39258]
- Fix an issue where setting color identity on the Customizer breaks block editor UI elements. [#41073]
- Ensure the color palette now shows up. [#40846]
- Global Styles: Stop showing the limited global styles notice in distraction free mode. [#40907]
- Gutenberg 19.9: Hide launch banner when the site is previewed in Appearance -> Design. [#40695]
- i18n: Download updated translations for wpcomsh. [#42494]
- i18n: Load javascript translations from WP_LANG_DIR. [#42550]
- i18n: Load jetpack-mu-wpcom translations from WP_LANG_DIR/mu-plugins. [#42172]
- Media Library: Ensure Upload from URL shows in the editor. [#41711]
- Don't load ETK on agency sites on all pages. [#41272]
- Filter out the full-site-editing plugin from the active_plugins list if the plugin file doesn't exist. [#41887]
- Use blueberry (modern) scheme for launch site button. [#42605]
- Make email and password available on the profile.php on the default view. [#41945]
- Port the fix of the modern color scheme from WP 6.8. [#42462]
- Page & Post: Fix the layout on mobile when details are open. [#40872]
- Playground SQL Importer: Correctly handle `DB_HOST` containing a port. [#42439]
- Purge the cache when the site visibility changes on Atomic sites. [#40650]
- Site Badge: Update styles of the Coming Soon badge. [#42496]
- Site Visibility: Prevent accidental changes to blog_public on the Settings > Reading page. [#42716]
- Testimonials: Fix bug in shortcode if the column attribute is added and set to 0. [#40896]
- Verbum: Fix broken block editor. [#41747]
- wpcomsh/private-site: Use `allowed_options` filter instead of deprecated `whitelist_options` one and use proper function for adding the callback (`add_filter` instead of `add_action`). [#40586]

## 6.0.0 - 2024-12-04
### Added
- Add Growth to features in wpcomsh package. [#40187]
- Enable test coverage. [#39961]
- WordPress.com plan features: Added cornerstone 10 pages feature. [#40023]
- WordPress.com plan features: Added studio-sync feature. [#39843]

### Changed
- Added wp-downgrade to the incompatible list. [#39264]
- Admin dashboard: Disable portfolio toggle if theme supports portfolio and site is WoA. [#39508]
- General: indicate compatibility with the upcoming version of WordPress - 6.7. [#39786]
- Incompatible Plugins: whitelist duplicator pro. [#39775]
- Introduced ESLint base config and fixed errors. [#39275]
- Only include `wp-polyfill` as a script dependency when needed. [#39629]
- Remove unused dev dependencies. [#40297]
- Updated feature check. [#40120]
- Updated package dependencies. [#39594] [#39653] [#40116] [#40261]
- Update Jetpack Scan link. [#39619]
- Update wc-calypso-bridge dependency to 2.7.1 [#39557]
- Update wc-calypso-bridge dependency to 2.8.0 [#39613]
- Update wc-calypso-bridge dependency to 2.8.1 [#39950]

### Removed
- General: Update minimum WordPress version to 6.6. [#40146]
- Test remove redirection. [#39615]

### Fixed
- Fix function that add links to URLs in the page when having HTML attributes with "<" in the value. [#39931]
- Move `load_muplugin_textdomain` call to `after_setup_theme` hook. [#39586]
- Stats: Fix top post card on the Insight page. [#39691]
- wpcom-block-editor: Support getting the canvas mode from the query string after GB 19.6. [#40045]

## 5.10.0 - 2024-09-23
### Added
- Performance Profiler: Ensure the associated url created when the performance report is generated is accessible for each page or as part of site settings for the home/main url. [#39310]

### Removed
- Connection: Removed deprecated method features_available. [#39442] [#39475]

### Fixed
- Portfolios: Ensure these are enabled and working properly on themes that support portfolios. [#39431]

## 5.9.0 - 2024-09-18
### Changed
- WPCOMSH: change call to so it doesn't trigger if not necessary [#39336]

### Removed
- Wpcomsh: Remove actions and filters related to the Masterbar module [#39367]

### Fixed
- Color Scheme: Avoid wpcom user data overriding the admin color after flushing cache [#39368]
- WPCOM Features: Add INSTALL_THEMES feature to Jetpack sites so that they are not erroneously seeing the "upgrade" badge when looking at dotorg themes in the wordpress.com showcase [#39392]

## 5.8.0 - 2024-09-10
### Changed
- Enable Users -> Profile (profile.php) on all sites [#39181]
- SSO: Show wp-admin login form if site has local users [#39139]
- Updated package dependencies. [#39288]
- Update wc-calypso-bridge dependency to 2.6.0 [#39313]

### Fixed
- Checks an array key before attempting to read it. [#39240]

## 5.7.0 - 2024-09-02
### Added
- WPCOM Marketplace: Added software manager to install marketplace products. [#38705]

## 5.6.2 - 2024-08-30
### Added
- Added a switch that will enable rolling trunk releases. [#38994]

## 5.6.1 - 2024-08-26
### Changed
- Internal updates.

## 5.6.0 - 2024-08-23
### Added
- Added social share status feature [#39023]

### Changed
- SSO: Automatic logic for Calypso users of classic sites [#38996]
- Updated package dependencies. [#39004]

## 5.5.0 - 2024-08-21
### Changed
- Site Level User Profile: expose all relevant fields on profile.php [#38949]

### Fixed
- Revert recent SVG image optimizations. [#38981]

## 5.4.1 - 2024-08-19
### Added
- Incompatible Plugins: Added one-click-ssl [#38918]

### Changed
- Updated package dependencies. [#38822]

### Fixed
- Lossless image optimization for images (should improve performance with no visible changes). [#38750]

## 5.4.0 - 2024-08-13
### Changed
- rum data: include WooCommerce active status [#38846]

## 5.3.3 - 2024-08-12
### Changed
- Internal updates.

## 5.3.2 - 2024-08-12
### Changed
- Internal updates.

## 5.3.1 - 2024-08-09
### Added
- Added safeguards against erroneous WordPress hook invocations. [#37859]

## 5.3.0 - 2024-08-08
### Changed
- Plan name change: Add translations [#38726]
- Update translation files [#38736]

### Fixed
- Update wpcomsh POT file [#38728]

## 5.2.1 - 2024-08-05
### Changed
- Internal updates.

## 5.2.0 - 2024-08-05
### Changed
- Add target_blog_id prop to AIOWP tracks events [#38615]
- My Jetpack: modify Jetpack AI product class and interstitial links [#38602]
- Plan names: Revert plan names to Personal/Premium/Business/Commerce [#38668]

## 5.1.2 - 2024-07-30
### Changed
- Fixup versions [#38612]

## 5.1.1 - 2024-07-30
### Removed
- Remove the old plugin banner code [#38605]

## 5.1.0 - 2024-07-29
### Changed
- Hide the plugin banner on non-wpcom-connected users or agency-managed users [#38532]

## 5.0.3 - 2024-07-26
### Removed
- Footer credit: Remove customizer option for block themes [#38559]

## 5.0.2 - 2024-07-26
### Fixed
- Fix the "The parent theme is missing" issue [#38557]

## 5.0.1 - 2024-07-25
### Changed
- WooCommerce Calypso Bridge version update to 2.5.5 [#38469]

## 5.0.0 - 2024-07-23
### Added
- Added new feature for social editor preview. [#38425]
- Added checks to remove WP.com items and links in WP Admin for users who are not connected to WP.com. [#38401]
- i18n: Updated language files. [#38447]

### Changed
- Improve plugin-dance command. [#38423]
- Updated package dependencies. [#38464]
- Updated WooCommerce Calypso Brdige version to 2.5.4. [#38451]

### Removed
- Footer credit: Removed customizer option for block themes. [#38473]
- Footer credit: Render default credit on block themes. [#38458]
- Removed checks for Jetpack versions over a year old. [#38386]
- Removed code for compatibility with WordPress before 6.5. [#38386]

## 4.0.0 - 2024-07-18
### Removed
- General: update WordPress version requirements to WordPress 6.5. [#38382]
- Removed code that disables Jetpack staging mode for WordPress.com staging sites. [#38355]

### Fixed
- Removed access to WPCom Themes to WP_CLI [#38351]

## 3.28.0 - 2024-07-15
### Added
- Added a check to hide the plugins banner for non-wpcom connected users. [#38241]
- WOA Post Transfer: Ensure that HPOS is enabled for WooCommerce sites. [#38119]

### Changed
- WooCommerce Calypso Bridge: Update version to 2.5.3 [#38302]

## 3.27.3 - 2024-07-08
### Added
- Add post transfer woo express deactivate plugins, post process cache flush, and post clone set staging environment [#38183]

### Changed
- Updated package dependencies. [#38228]
- Use wp-cli `success` function for messages [#38201]

### Fixed
- Fix generate POT script to follow symlinks in vendor/* and update language files. [#38153]

## 3.27.2 - 2024-07-01
### Changed
- Internal updates.

## 3.27.1 - 2024-06-28
### Fixed
- Wpcomsh: fixed fatal errors in case of null body class values. [#38114]

## 3.27.0 - 2024-06-28
### Added
- Added plugin dance command [#38108]

## 3.26.1 - 2024-06-26
### Added
- Site Migrations: Add tracks events for AIOWPM events. [#37902]

### Changed
- Updated custom-fonts to v3.0.4. [#38071]

## 3.26.0 - 2024-06-26
### Added
- Added polyfill for get_magic_quotes_gpc [#38039]

## 3.25.2 - 2024-06-26
### Changed
- Internal updates.

## 3.25.1 - 2024-06-25
### Changed
- Hide login banner for agency-managed sites. [#38021]

### Removed
- Plugin hotfixes: Remove a hotfix for an issue fixed in Gutenberg 15.3.0. [#38015]

### Fixed
- Custom Colors: Remove a use of `extract()`. [#38015]
- Switch from Jetpack-the-plugin's `Jetpack_WPCOM_Block_Editor` class to jetpack-mu-wpcom's namespaced version. [#38015]

## 3.25.0 - 2024-06-25
### Added
- Added a command to disable fatal error emails. [#38010]
- Add `atomic_managed_plugin_row_auto_update_label` filter to translate the managed plugin auto update label [#37983]

## 3.24.0 - 2024-06-24
### Added
- Added featrue flag checks for the Threads Social Connection. [#38001]
- wpcomsh: Add WP-CLI commands with hooks for WoA post-transfer/reset/clone functionality [#37972]

## 3.23.0 - 2024-06-21
### Added
- New wpcomsh CLI command to fix PHP 7.4 plugin [#37966]
- Wpcomsh: Update plugin dependencies [#37812]

### Changed
- Bump lock files. [#37870]
- Site Visibility: Update link copy [#37909]

## 3.22.16 - 2024-06-17
### Changed
- Fixed readme, added accurate links. [#37901]

## 3.22.15 - 2024-06-17
### Added
- Added a prefix for wpcomsh weekly shipping. [#37857]

### Changed
- WooCommerce Calypso Brdige version update to 2.5.2 [#37883]

### Removed
- Disable WP.com custom editor navigation bar. [#37893]
- Removed obsolete scripts and makefile targets. [#37880]

## 3.22.14 - 2024-06-14
### Changed
- Changed the composer package slug to wpcomsh. [#37861]

### Removed
- General: removing action status icons. [#37881]

## 3.22.13 - 2024-06-13
### Removed
- Untangling: Remove temporary code that hides Hosting menu options. [#37848]

## 3.22.12 - 2024-06-10
### Other Changes
- Update language files.

## 3.22.11 - 2024-06-13
### Other Changes
- Bump wpcomsh version.

## 3.22.10 - 2024-06-07
### Changed
- Update read access cookie arguments.

## 3.22.9 - 2024-06-06
### Fixed
- Do not override text color if it is not set on the theme.

### Other Changes
- Update jetpack-mu-wpcom version.
- Bump wpcomsh version.

## 3.22.8 - 2024-06-06

- Prevent non array/object from working.

## 3.22.7 - 2024-06-05
### Added
- Add create_function polyfill.

## 3.22.6 - 2024-06-04
### Added
- Initial version. [#37737]

### Changed
- Nav Redesign: Drop the early access and is_proxied. [#37845]
- Updated package dependencies. [#37737]

### Removed
- Remove code to replace "Site visibility" with a link to Calypso [#37843]
- Revert adding overview menu option [#37844]

## 3.22.5 - 2024-05-31
### Other Changes
- Phan: fixed bugs and problems that triggered static analysis warnings.

[13.3]: https://wp.me/p1moTy-19qu

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
