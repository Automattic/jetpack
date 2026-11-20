# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 2.14.0 - 2026-10-14
### Added
- Add stats wp abbilities [#48286]
- Agents Manager: Add Sidebar Preservation On Load Mechanism [#49325]
- PayPal Payment Buttons: add the WordPress.com endpoint that generates PayPal onboarding links. [#51656]
- Premium Analytics: Add an Ads dashboard section showing WordAds earnings and performance. [#51422]
- Premium Analytics: Add a year dropdown to the Year in review (Highlights) widget header, defaulting to the current year, and drop its metric selector so the card always shows posts, words, likes, and comments. [#51638]
- Premium Analytics: Add referrer groups that open folded and expand on demand in the Referrers report. [#51465]
- Premium Analytics: add total and per-post image counts to the Annual insights report. [#51747]
- Premium Analytics: Click Visitors in the Traffic chart legend to compare it against Views without leaving the metric. Chart legends now name the metric rather than the date range. [#51468]
- Premium Analytics: Show all-time views, visitors, and posts in the default Insights layout. [#51635]
- Stats: Add a Popular hours widget showing the busiest hour and its daily average views. [#51239]
- Stats: link the post list views column to the analytics post detail page when the new dashboard is enabled. [#51357]
- Write: answer the daily writing prompt in the distraction-free Write editor. [#51671]
- Write: Ask writers one question about their experience after their first post, with an optional comment. [#51787]

### Changed
- Agents Manager: Extract into its own package from jetpack-mu-wpcom [#49202]
- AI Launchpad: bundle the jetpack-wp-build-polyfills dependency used by the new launchpad admin page. [#49608]
- Custom CSS to use device detection [#49659]
- Forms, Stats: CSV export will now process data containing backslashed quotation marks as specified in the relevant standard. [#51572]
- General: update composer.lock files. [#48743]
- Internal: No longer require automattic/jetpack-changelogger as a per-project dev dependency. [#48225]
- Internal: regenerate composer.lock to pick up the podcast package's new automattic/jetpack-connection dependency. [#48774]
- Make the help and Ask AI admin bar nodes available from the admin-bar REST endpoints, with the label, icon and destination a client needs. [#51657]
- Newspack Blocks: Update the Blog Posts and Posts Carousel blocks to Newspack Blocks 4.30.3. [#51503]
- Podcast: split the Distribution directories into Automatic and Manual submission, explain why a disabled button is disabled, and link to your Pocket Casts show once it is live. [#48917]
- Podcast: update composer.lock. [#51897]
- Premium Analytics: Add breathing room above and below the Top locations map. [#51593]
- Premium Analytics: Divide a widget's metrics with lines instead of boxing each one. [#51749]
- Premium Analytics: label the traffic chart's time axis by the size of the bucket behind the data, and name each bar's period in full in its tooltip. [#51274]
- Premium Analytics: Move the Ads date range into the WordAds card's own header, and drop the section header's date filter. [#51543]
- Premium Analytics: Name the dates a comparison covers in the dashboard header, instead of "Previous period", drop the weekdays from ranges longer than a week, and leave the year off ranges that sit inside the current one. [#51420]
- Premium Analytics: Offer only the groupings the selected date range supports in the chart's Group by control. [#51446]
- Premium Analytics: rename the Top pages CSV comparison column to "Views (Previous Period)" and move it after the primary columns. [#51705]
- Premium Analytics: Retitle the Popular post card to "Most popular post in the last 12 months" and pin it to the last 12 months. [#51649]
- Premium Analytics: Shorten the Popular post card title so it survives a narrow dashboard cell. [#51746]
- Premium Analytics: show the latest emails sent as a plain list of subjects and rates. [#51425]
- Premium Analytics: Tighten the spacing between leaderboard rows. [#51540]
- Pull in the latest jetpack-podcast package (adds the Podcast Episode block, gated behind the jetpack_podcast_untangle filter; no behavior change while off). [#48546]
- RTC: Skip unnecessary eligibility checks when real-time collaboration is disabled. [#52146]
- Update composer.lock files. [#48557] [#48702] [#49415] [#49918] [#50266]
- Updated package dependencies. [#48064] [#48683] [#48735] [#49425] [#49448] [#49769] [#49793] [#50248] [#50436] [#50850] [#52028] [#53032]
- WP.com Error Reporting: delegate all decisions to host-specific filters [#50483]
- WP.com Error Reporting: use direct fetch with no CORS preflight [#50503]

### Fixed
- Admin bar: Fix site name and wpcom account menu item height. [#51706]
- Admin color schemes: render the checked checkbox and radio marks in white, matching core. [#51774]
- Admin dashboards: Keep the page header and content in view when the wp-admin menu is taller than the window. [#51696]
- PayPal Payment Buttons: include PayPal's own error details when it rejects a partner referral, so a failed connection says what was wrong. [#51656]
- PayPal Payment Buttons: name the platform credential constants that are missing when an environment is only partly configured. [#51656]
- PayPal Payment Buttons: refuse to generate an onboarding link when the platform partner merchant ID is not configured, instead of failing later with an unrelated error. [#51656]
- Plugin Conflicts Guardian: fix the staged rollout so the pre-flight plugin check reaches its intended share of sites. [#51392]
- Podcast: Hide the Jetpack > Podcast menu item on Atomic sites where the Podcast module is turned off. [#51409]
- Podcast dashboard: keep the chart tooltip under sticky and fixed page elements. [#51640]
- Premium Analytics: Compare a date range against a previous month or year of the same length, so the percentages no longer measure 30 days against 29. Whole calendar months still compare month to month. [#51469]
- Premium Analytics: Compute date-filter day boundaries in the site's timezone, so visitors west of the site timezone no longer get stretched ranges or wrong chart buckets. [#51419]
- Premium Analytics: Drop the Last 24 hours range from the WordAds card, which has no hourly data to chart. [#51633]
- Premium Analytics: fix a stray label stacked at the left edge of a chart's time axis after hiding a series from the legend, or when the chart mixes labelled bars with dated ones or compares two periods, and stop a labelled bar's tooltip reading "Invalid Date". [#51343]
- Premium Analytics: Fix charts getting stuck on their loading skeleton after switching a control that turns one of the underlying requests off. [#51443]
- Premium Analytics: fix report and chart dates that could read a day off for sites away from UTC. [#51499]
- Premium Analytics: Fix the Subscribers summary help text to describe the cumulative subscriber total the chart plots, not new subscribers. [#51697]
- Premium Analytics: Include the last day of the selected range in the WordAds card. [#51751]
- Premium Analytics: keep the full set of ticks on the traffic chart's time axis, which could thin out to two labels on longer date ranges. [#51339]
- Premium Analytics: keep the year and the day on the traffic chart's time axis, which could previously skip the tick that named them, and stop the same label falling on two ticks in a row. [#51339]
- Premium Analytics: keep the Year in review report link reachable. [#51747]
- Premium Analytics: Label chart points by the bucket they name rather than by the viewer's time zone, and format axis ticks and tooltips at the series' declared bucket size. [#51445]
- Premium Analytics: label Subscribers chart and email timeline points by the bucket they name rather than by the viewer's time zone. [#51499]
- Premium Analytics: Link a subscriber's name to their subscriber details page. [#51634]
- Premium Analytics: print Tags & categories view counts in full, and list far more rows in its report. [#51646]
- Premium Analytics: print the Annual insights words-per-post average whole, as the old Stats report does. [#51747]
- Premium Analytics: Remove the quarterly chart interval option, which never changed the chart. [#51631]
- Premium Analytics: Show abbreviated month names on chart x-axes in line and area views. [#51531]
- Premium Analytics: Show a notice when a refresh fails, instead of silently leaving the previous numbers on screen. [#51383]
- Premium Analytics: Show the dashboard right away instead of a sync screen, and flag the Store section's numbers as incomplete while store data is still syncing. [#51279]
- Premium Analytics: Start the Traffic chart's Group by control from the dashboard's interval, and replace Auto with hourly grouping. [#51446]
- Premium Analytics: Stop applying hidden date comparisons in dashboard sections that do not offer the control. [#51381]
- Premium Analytics: Stop the Ads chart interval menu offering buckets the WordAds chart cannot draw. [#51639]
- Site setup: Continue the wp-admin menu color behind the page frame on WordPress.com admin color schemes. [#51619]
- Site visibility: Stop the site launch celebration modal from reappearing after saving Reading settings. [#51655]
- Stats: Allow users with multiple roles to view Stats when any assigned role is permitted. [#51514]

## 2.13.0 - 2026-04-10
### Added
- Add autoloader check to prevent fatal errors when plugin is activated before composer install. [#46489]
- Gutenberg RTC: Add PingHub provider for real-time collaboration WebSocket connections. [#47421]
- Gutenberg RTC: Connect to PingHub WebSocket directly using a server-generated JWT token, fixing real-time collaboration on custom-domain sites with third-party cookie restrictions. [#47556]
- Gutenberg RTC: Enable Real-Time Collaboration feature for sites with the REAL_TIME_COLLABORATION feature. [#47512]
- MU WPCOM: Support linking back to my.wordpress.com domain. [#46559]
- MU WPCOM: Unregister the Gutenberg RTC setting on the Writing page if there are no RTC providers. [#47403]

### Changed
- Dependencies: Update lock file to keep root requirements in sync. [#47418]
- Remove header border-bottom from the admin page for a cleaner unified header appearance. [#47313]
- Update design of the sidebar upsell. [#47909]
- Update package dependencies. [#46785] [#47021] [#47505]

### Removed
- Remove the dotcom command palette. [#46579]
- RTC: Move implementation to generic package. [#47713]

### Fixed
- Admin Page: Restore border on header component. [#47425]
- Newsletter: Fix Reading page notice URL and link to new settings page when the jetpack_wp_admin_newsletter_settings_enabled filter is enabled. [#47347]

## 2.12.0 - 2026-01-09
### Added
- Holiday Snow: Add speed and hemisphere settings. [#46139]
- IDC: Add revalidation for IDCs. [#46268]
- Introduces Attachment pages setting in the media settings screen in wp-admin which controls the `wp_attachment_pages_enabled` option. [#40590]
- Update scssphp/scssphp dependency. [#45757]

### Changed
- Code block: Remove active line highlight when block is unselected. [#45828]
- Code block: Remove experimental warning. [#45827]
- Custom post types: Ensure features remain available when theme support is added. [#45407]
- Don't translate product names. [#43961]
- Update package dependencies. [#45478] [#45771] [#46082]

### Fixed
- Jetpack: remove getIconColor functions for block icons. [#45992]

## 2.11.0 - 2025-10-10
### Added
- Add Code block (experimental). [#45181]
- Newspack blocks: Load feature on agency sites. [#44906]

### Changed
- Update package dependencies. [#44725] [#44948] [#45096]

## 2.10.0 - 2025-08-05
### Added
- Add archives endpoint support. [#44028]
- Settings: Add tracking for launch action. [#43859]
- Code editors: Add advanced code and CSS editors. [#44232]

### Changed
- My Jetpack: Unify the user connection flow with a unified screen. [#44469]
- Sync: Ignore the ActivityPub Outbox CPT [#44222]
- Update package dependencies. [#43839] [#44206]

### Fixed
- JITM: Fix ineffective caching due to expired plugin sync transient. [#44117]
- Update JITMs to remove jQuery dependency. [#43783]

## 2.9.0 - 2025-06-06
### Added
- Featured Content: Add messaging to clarify that the tag name is case-sensitive. [#43165]

### Changed
- Admin Menu: Update WooCommerce icon. [#43029]
- Site Visibility: Disable search engine indexing for `*.wpcomstaging.com` sites. [#42853]
- Update package dependencies. [#43085] [#43425]

### Deprecated
- Remove `default_rendering_mode` hotfix. [#42984]

### Removed
- Color Scheme: Clean up *-rgb css variables. [#42960]
- Remove links to deprecated Calypso views on the launchpad tasks. [#42923]

### Fixed
- Block editor: fix layout issues with the Media Library modal buttons.. [#43035]
- Forms: Change submenu registration. [#43627]
- Forms: Check for classes and methods before call. [#43606]
- Fix wrapping on the stats column heading in non-English languages. [#43630]
- My Jetpack: Fix readability of license activation button on hover. [#43550]

## 2.8.0 - 2025-04-04
### Added
- Add newsletter widget to the dashboard. [#41807]
- Add site launch button to the admin bar. [#41240]
- Bump a Tracks stat for every wp-admin page view. [#42422]
- Comments: Use Verbum on comments containing block mark-up. [#42022]
- Connection: Disconnect all other users before disconnecting connection owner account. [#41923]
- Dashboard: Add Daily Writing Prompt widget. [#41094]
- Dashboard: Add general tasks widget. [#41150]
- Dashboard: Add launchpad. [#41434]
- Dashboard: Add site preview and links. [#41106]
- Launchpad: Add create-course-goal intent task list [#42108]
- Media: Introduce the Import Media page. [#41032]
- Media: Support Upload from URL on media-new page. [#41627]
- Media: Untangle Calypso. [#41628]
- Newsletter Dashboard Widget: Remove feature flag and enable widget. [#42276]
- Add Subscribers in WP Admin. [#42066]
- Theme tools: Load theme compat functionality relevant to features in Classic Theme Helper package. [#41598]

### Changed
- Admin Bar: Point the Edit Site menu item to `/site-editor.php`. [#41137]
- Admin Color Schemes: Update color schemes to match Calypso. [#40908]
- Connection: Allow pre-selected login providers. [#42662]
- Connection: Display connection status on Users page independent of the SSO module. [#41794]
- Hide "Verify Email" launchpad task for existing users. [#41326]
- Live Preview: Don't change the homepage when previewing a theme in the Site Editor [#42388]
- Prevent site owner from editing user's account-level fields. [#42177]
- Site Visibility: Port the site visibility settings from Calypso to WP Admin. [#42230]
- Theme: Clean up files that were used during the theme switch and theme preview. [#42420]
- Update composer.lock files. [#41066]
- Update package dependencies. [#40980] [#41659] [#42180] [#42815]
- Update Site Settings link copy. [#41663]
- Use `Automattic/jetpack-composer-plugin` so jetpack-library packages will be installed in a place where `wp i18n` will see them. [#41185]

### Removed
- Remove the "Personalize Link in Bio" launchpad task. [#41949]
- Remove start page pattern modal. [#41479]
- Use default core welcome tour when the user creates a post for the first time. [#41258]

### Fixed
- Admin Color Scheme: Fix the color of the Aquatic color scheme. [#42632]
- Avoid opening Fiverr link when hitting Enter. [#42093]
- Media Library: Ensure Upload from URL shows in the editor. [#41711]
- Do not load ETK on agency sites on all pages. [#41272]
- Filter out the full-site-editing plugin from the active_plugins list if the plugin file doesn't exist. [#41887]
- Use blueberry (modern) scheme for launch site button. [#42605]
- Make email and password available in `profile.php` on the default view. [#41945]
- Port the fix of the modern color scheme from WP 6.8. [#42462]
- Site Badge: Update styles of the Coming Soon badge. [#42496]
- Site Visibility: Prevent accidental changes to blog_public on the Settings > Reading page. [#42716]
- Verbum: Fix broken block editor. [#41747]

## 2.7.0 - 2025-01-10
### Added
- WordPress.com Features: Add Holiday Snow functionality. [#40478]

### Changed
- Newspack Blocks: Update to version 4.5.2. [#40636]
- Updated dependencies. [#40286]
- Updated package dependencies. [#40116] [#40515]

### Fixed
- Global Styles: Stop showing the limited global styles notice in distraction-free mode. [#40907]
- Testimonials: Fix a shortcode related bug which ccurs if the column attribute is added and set to 0. [#40896]

## 2.6.1 - 2024-11-11
### Changed
- Internal updates.

## 2.6.0 - 2024-11-11
### Added
- Enable test coverage. [#39961]

### Changed
- Admin dashboard: Disable portfolio toggle if theme supports portfolio and site is WoA [#39508]
- Only include `wp-polyfill` as a script dependency when needed. [#39629]
- Updated package dependencies. [#39288] [#39653]
- Update Jetpack Scan link [#39619]

### Removed
- Connection: Removed deprecated method features_available [#39442]
- Connection: Removed features_enabled deprecated method [#39475]

### Fixed
- Portfolios: Ensure these are enabled and working properly on themes that support portfolios [#39431]
- Stats: Fix top post card on the Insight page [#39691]
- wpcom-block-editor: Support getting the canvas mode from the query string after GB 19.6 [#40045]

## 2.5.11 - 2024-09-02
### Changed
- Internal updates.

## 2.5.10 - 2024-08-30
### Changed
- Internal updates.

## 2.5.9 - 2024-08-26
### Changed
- Updated package dependencies. [#39004]

## 2.5.8 - 2024-08-21
### Changed
- Internal updates.

## 2.5.7 - 2024-08-19
### Changed
- Updated package dependencies. [#38822]

## 2.5.6 - 2024-08-12
### Changed
- Internal updates.

## 2.5.5 - 2024-08-08
### Changed
- Internal updates.

## 2.5.4 - 2024-08-05
### Changed
- Fixup versions [#38612]

## 2.5.3 - 2024-07-30
### Changed
- Internal updates.

## 2.5.2 - 2024-07-29
### Changed
- Internal updates.

## 2.5.1 - 2024-07-25
### Changed
- Internal updates.

## 2.5.0 - 2024-07-22
### Added
- Add missing `scssphp/scssphp` dependency to the plugin zip. [#38337]
- Add checks to remove WP.comm items and links in WP Admin for users who are not connected to WP.com. [#38401]

## 2.4.1 - 2024-07-18
### Changed
- Internal updates.

## 2.4.0 - 2024-07-15
### Added
- Composer lock update. [#38241]

## 2.3.3 - 2024-07-08
### Changed
- Updated package dependencies. [#38228]

## 2.3.2 - 2024-07-01
### Changed
- Internal updates.

## 2.3.1 - 2024-06-26
### Changed
- Internal updates.

## 2.3.0 - 2024-06-24
### Changed
- Site Visibility: Update link copy [#37909]

## 2.2.0 - 2024-06-18
### Changed
- Bump lock files. [#37870]

## 2.1.33 - 2024-06-17
### Changed
- Internal updates.

## 2.1.32 - 2024-06-14
### Changed
- Updated package dependencies. [#37767]

## 2.1.31 - 2024-06-10
### Changed
- Internal updates.

## 2.1.30 - 2024-06-06
### Changed
- Internal updates.

## 2.1.29 - 2024-06-03
### Changed
- Internal updates.

## 2.1.28 - 2024-05-27
### Changed
- Internal updates.

## 2.1.27 - 2024-05-20
### Changed
- Internal updates.

## 2.1.26 - 2024-05-16
### Changed
- Updated package dependencies. [#37348]

## 2.1.25 - 2024-05-14
### Changed
- Internal updates.

## 2.1.24 - 2024-05-13
### Changed
- Internal updates.

## 2.1.23 - 2024-05-13
### Changed
- Internal updates.

## 2.1.22 - 2024-05-09
### Changed
- Internal updates.

## 2.1.21 - 2024-05-06
### Changed
- Update formalized dependencies in Scheduled Updates. [#37008]

## 2.1.20 - 2024-04-29
### Changed
- Internal updates.

## 2.1.19 - 2024-04-29
### Changed
- Internal updates.

## 2.1.18 - 2024-04-26
### Changed
- Internal updates.

## 2.1.17 - 2024-04-25
### Changed
- Internal updates.

## 2.1.16 - 2024-04-22
### Changed
- Internal updates.

## 2.1.15 - 2024-04-15
### Changed
- Internal updates.

## 2.1.14 - 2024-04-08
### Changed
- Updated package dependencies. [#36775]

## 2.1.13 - 2024-04-05
### Changed
- Internal updates.

## 2.1.12 - 2024-04-04
### Changed
- Internal updates.

## 2.1.11 - 2024-04-01
### Changed
- Internal updates.

## 2.1.10 - 2024-03-27
### Changed
- Internal updates.

## 2.1.9 - 2024-03-25
### Changed
- Internal updates.

## 2.1.8 - 2024-03-22
### Changed
- Internal updates.

## 2.1.7 - 2024-03-20
### Changed
- Comment: Updated composer.lock. [#36458]

## 2.1.6 - 2024-03-18
### Changed
- Internal updates.

## 2.1.5 - 2024-03-15
### Changed
- Internal updates.

## 2.1.4 - 2024-03-12
### Changed
- Internal updates.

## 2.1.3 - 2024-03-12
### Changed
- Updated package dependencies. [#36309]

## 2.1.2 - 2024-03-11
### Changed
- Internal updates.

## 2.1.1 - 2024-03-05
### Fixed
- Updated dependencies. [#36170]

## 2.1.0 - 2024-03-04
### Added
- Added a Command Palette loader on the jetpack-mu-wpcom plugin. [#35635]

### Changed
- Update dev dependencies. [#35999]

## 2.0.26 - 2024-02-27
### Changed
- Internal updates.

## 2.0.25 - 2024-02-26
### Changed
- Internal updates.

## 2.0.24 - 2024-02-26
### Changed
- Internal updates.

## 2.0.23 - 2024-02-21
### Changed
- Internal updates.

## 2.0.22 - 2024-02-19
### Changed
- Internal updates.

## 2.0.21 - 2024-02-14
### Changed
- Internal updates.

## 2.0.20 - 2024-02-13
### Changed
- Updated package dependencies. [#35591]

## 2.0.19 - 2024-02-12
### Changed
- Internal updates.

## 2.0.18 - 2024-02-05
### Changed
- Internal updates.

## 2.0.17 - 2024-01-29
### Changed
- Internal updates.

## 2.0.16 - 2024-01-25
### Changed
- Internal updates.

## 2.0.15 - 2024-01-23
### Changed
- Internal updates.

## 2.0.14 - 2024-01-22
### Changed
- Internal updates.

## 2.0.13 - 2024-01-15
### Changed
- Internal updates.

## 2.0.12 - 2024-01-08
### Changed
- Updated package dependencies. [#34882]

## 2.0.11 - 2024-01-04
### Changed
- Internal updates.

## 2.0.10 - 2024-01-02
### Added
- Bumped the composer version. [#34789]

## 2.0.9 - 2023-12-25

- Internal updates.

## 2.0.8 - 2023-12-20
### Changed
- Internal updates.

## 2.0.7 - 2023-12-15
### Changed
- Version bump [#34648]

## 2.0.6 - 2023-12-14
### Changed
- Updated package dependencies. [#34559]

## 2.0.5 - 2023-12-11
### Changed
- Internal updates.

## 2.0.4 - 2023-12-03

## 2.0.3 - 2023-11-30
### Changed
- Internal updates.

## 2.0.2 - 2023-11-24

## 2.0.1 - 2023-11-21

## 2.0.0 - 2023-11-20
### Changed
- Updated the required PHP version to >= 7.0. [#34126]

## 1.7.11 - 2023-11-14
### Changed
- Updated package dependencies. [#34087]

## 1.7.10 - 2023-11-13
### Changed
- Internal updates.

## 1.7.9 - 2023-11-09

## 1.7.8 - 2023-11-08

## 1.7.7 - 2023-11-03

## 1.7.6 - 2023-10-31
### Changed
- Internal updates.

## 1.7.5 - 2023-10-30

## 1.7.4 - 2023-10-26

## 1.7.3 - 2023-10-24
### Changed
- Internal updates.

## 1.7.2 - 2023-10-23

## 1.7.1 - 2023-10-16
### Changed
- Updated package dependencies. [#33498]

## 1.7.0 - 2023-10-10
### Changed
- Updated lock files [#33456]
- Updated lock file [#33457]

## 1.6.24 - 2023-10-04
### Changed
- Internal updates.

## 1.6.23 - 2023-10-03

- Minor internal updates.

## 1.6.22 - 2023-09-28
### Changed
- Minor internal updates.

## 1.6.21 - 2023-09-25

## 1.6.20 - 2023-09-19

## 1.6.19 - 2023-09-11
### Changed
- Updated package dependencies. [#32966]

## 1.6.18 - 2023-09-07

## 1.6.17 - 2023-09-06

## 1.6.16 - 2023-09-04

## 1.6.15 - 2023-08-28
### Changed
- Updated package dependencies. [#32605]

## 1.6.14 - 2023-08-21

## 1.6.13 - 2023-08-15
### Changed
- Internal updates.

## 1.6.12 - 2023-08-14

- Minor internal updates.

## 1.6.11 - 2023-08-09
### Changed
- Internal updates.

## 1.6.10 - 2023-08-09
### Changed
- Updated package dependencies. [#32307]

## 1.6.9 - 2023-08-07

## 1.6.8 - 2023-08-01

- Minor internal updates.

## 1.6.7 - 2023-07-26

- Updated package dependencies.

## 1.6.6 - 2023-07-25

## 1.6.5 - 2023-07-17
### Changed
- Updated package dependencies. [#31769]

## 1.6.4 - 2023-07-10

## 1.6.3 - 2023-07-05

## 1.6.2 - 2023-06-27

## 1.6.1 - 2023-06-26
### Changed
- Updated package dependencies.

## 1.6.0 - 2023-06-26
### Changed
- Updated package dependencies. [#31308]

### Fixed
- Updates package version. [#31191]

## 1.5.0 - 2023-06-19
### Fixed
- Updates package version to 3.1.0-alpha [#31349]

## 1.4.0 - 2023-06-12
### Changed
- Updated package dependencies. [#31284]

## 1.3.0 - 2023-06-06
### Changed
- Updated jetpack-mu-wpcom [#30915]

## 1.2.6 - 2023-05-29

## 1.2.5 - 2023-05-22
### Changed
- Internal updates.

## 1.2.4 - 2023-05-15
### Changed
- Internal updates.

## 1.2.3 - 2023-05-12

## 1.2.2 - 2023-05-11

## 1.2.1 - 2023-05-08
### Changed
- Updated package dependencies. [#30493]

## 1.2.0 - 2023-05-02
### Added
- Remove conditional rendering from zendesk chat widget component due to it being handled by an api endpoint now [#29942]

## 1.1.3 - 2023-04-25

- Minor internal updates.

## 1.1.2 - 2023-04-17
### Changed
- Internal updates.

## 1.1.1 - 2023-04-10
### Changed
- Internal updates.

## 1.1.0 - 2023-04-05
### Added
- Launchpad: Update composer.lock [#29841]

### Changed
- Updated package dependencies. [#29565]

## 1.0.12 - 2023-03-28

## 1.0.11 - 2023-03-20
### Changed
- Internal updates.

## 1.0.10 - 2023-03-13
### Added
- Start next cycle [#29437]

### Changed
- Updated package dependencies. [#29434]

## 1.0.9 - 2023-03-10

- Minor internal updates.

## 1.0.8 - 2023-03-09

- Minor internal updates.

## 1.0.7 - 2023-03-08
### Changed
- Minor internal updates.

## 1.0.6 - 2023-02-28
### Changed
- Minor internal updates.

## 1.0.5 - 2023-02-20
### Changed
- Minor internal updates.

## 1.0.4 - 2023-02-15
### Changed
- Updated package dependencies. [#28910]

## 1.0.3 - 2023-02-09
### Changed
- Use JETPACK_MU_WPCOM_LOAD_VIA_BETA_PLUGIN to conditionally load the package. [#28880]

## 1.0.2 - 2023-02-08

- Updated package dependencies.

## 1.0.1 - 2023-02-06

- Updated package dependencies.

## 1.0.0 - 2023-01-30

- Initial plugin release.
