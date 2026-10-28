# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 10.0.0 - 2026-10-14
### Added
- Connection: Add a Connected view to the Users page listing users with a linked WordPress.com account. [#53150]
- Connection: Surface SSL certificate verification failures reported by WordPress.com as a connection error notice. [#52035]
- Connection: Transfer connection ownership to another administrator without leaving your site. [#53359]
- My Jetpack: Allow the Automattic for Agencies banner to be dismissed. [#51441]

### Changed
- AI: Use WordPress Design System colors in the image generator. [#53022]
- Boost: Wait up to four minutes for slow speed tests in My Jetpack instead of timing out after two. [#51605]
- Charts: follow the WordPress admin color scheme for chart series colors. [#51535]
- Charts: update chart grid, axis and label colors immediately when the theme changes. [#51687]
- Connection: Show every connection error in one notice, each with the account it affects, and link to Site Health when a firewall is blocking WordPress.com. [#51504]
- Dashboard: Enable or disable Social directly from the dashboard, so it can be turned back on where Jetpack Settings is unreachable (e.g. WordPress.com Atomic sites). [#50376]
- General: Update minimum WordPress version to 7.0. [#51370]
- Hide the Social sidebar item when Social is not active. [#52156]
- My Jetpack: answer module switch clicks immediately, and explain what happened when a change fails. [#52494]
- My Jetpack: Restyle dashboard notices to match the WordPress design system. [#52290]
- My Jetpack: Show a connection error on the Overview connection card while your account is still to be connected, instead of only asking you to connect it. [#53409]
- My Jetpack: Show a Features tab in place of the Products tab. [#52785]
- My Jetpack: Show product cards flat, without a drop shadow. [#52988]
- My Jetpack: Show the dashboard in the new rounded admin page frame. [#52446]
- My Jetpack: Show the Jetpack menu notification badge when a connection error is detected. [#52332]
- My Jetpack: Show what Paid Stats actually adds — UTM tracking, device stats, and region & city locations — instead of commercial use. [#51410]
- Overview: Show the traffic chart tooltip on the dark WordPress design system tooltip surface. [#52850]
- Sharing: Keep focus on information icons when their tooltips open, announce the content to screen readers, and show a focus ring after clicking them. [#52736]
- Sidebar: sort Jetpack menu items alphabetically, pinning My Jetpack to the top and external links and Settings to the bottom. [#52003]
- Social: the block editor sidebar now uses the same connection management UI as the Social admin page. [#50731]
- Surface a visible error when fetching the keyring result fails during a connection, instead of failing silently. [#50822]
- Tested up to WordPress 7.1. [#51370]
- Update package dependencies. [#50436] [#50510] [#51399] [#52028]
- Use core snackbar notice placement. [#52193]

### Removed
- Updated PHP version requirements to PHP 7.4 or newer. [#51515]

### Fixed
- Admin dashboards: Keep the page header and content in view when the wp-admin menu is taller than the window. [#51696]
- Admin page: Fix the dashboard overlapping the admin menu in right-to-left languages. [#51963]
- Charts: draw labels at the design system's font weight and size. [#51452]
- Charts: Fix unreadable axis labels in forced-colors mode. [#52268]
- Charts: keep chart tooltips under sticky and fixed page elements. [#51640]
- Charts: Place line and area chart date ticks on the site's time zone boundaries, name the hour in tooltips on hourly data, and read hour labels in the site's own locale rather than a forced 12-hour clock. [#51813]
- Charts: Restore keyboard focus after dismissing line chart tooltips. [#52284]
- Charts: Stop the first and last dates on a chart's horizontal axis from being cut off. [#52112]
- Connection: Fix a stale connection error notice that could persist on healthy sites. [#52264]
- Connection: Fix reconnecting your WordPress.com account so it no longer disconnects other users and clears the broken-connection notice on the first attempt. [#52851]
- Connection: Hide connection error notices from users who cannot fix the connection. [#52049]
- Connection: Let users without admin access reconnect their own broken account from the connection error notice. [#52718]
- Connection: Report a broken connection on My Jetpack's connection card instead of claiming everything looks good, and show a break only the connection owner can repair as a warning, not an error, to everyone else. [#52130]
- Connection: Stop showing a duplicate account notice when your WordPress.com email differs from your site email only in letter case. [#51285]
- Connection: Stop Site Health from showing spurious connection failures — remove the redundant outbound HTTP/HTTPS checks, and no longer prompt a reconnect when the WordPress.com connection test is inconclusive. [#52916]
- Connection: Stop users who cannot set up the site connection from becoming the connection owner when the owner's connection is missing. [#52880]
- Connection: Translate the Connectors card's text on sites that don't use English. [#53179]
- Connection: Update wording for some connection error notices. [#51360]
- Connections: Let a Facebook or Instagram connection with no Page or account saved pick one when reconnecting. [#52963]
- Dashboard: Continue the wp-admin menu color behind the page frame on WordPress.com and third-party admin color schemes. [#51619]
- Dashboard: Show contextual messages on the Social screen again. [#52471]
- Fix low-contrast placeholder chips in the share message help text and the available placeholders list. [#53615]
- Fix publishing failing with a share message database error, which also prevented social shares from being sent. [#52910]
- Fix the Social admin screen and editor sidebar failing to load on WordPress.com-hosted sites. [#52362]
- Footer: Hide Products and Help links when My Jetpack is unavailable. [#52557]
- JITM: Fix missing messages and a console error on sites without the Jetpack plugin active. [#51733]
- Keep admin icons colored after the @wordpress/icons 16 update, which draws them as strokes. [#52187]
- Keep keyboard focus on the first or last data point when an arrow key reaches the end of the traffic chart, return focus to the chart when Escape closes a tooltip, stop a focused chart from swallowing keys it does not use such as Page Down, and close the tooltip when the series it describes is hidden. [#50140]
- Line up the Jetpack in-dashboard message with the rest of the page. [#52641]
- My Jetpack: always label the license activation link 'Activate a license'. It previously read 'Activate a new license' on sites with a plan, even when no licenses had been activated. [#51283]
- My Jetpack: Fix the layout of the connection screen for right-to-left languages. [#52749]
- My Jetpack: Keep the Automattic for Agencies banner hidden after dismissing it and switching tabs. [#51441]
- My Jetpack: Point users who cannot connect the site at an administrator, instead of an onboarding screen they cannot complete. [#52614]
- My Jetpack: Show each notice once instead of twice. [#52494]
- My Jetpack: Show the highest-priority notice first when several are set at once. [#53400]
- My Jetpack: Show the right product status as soon as fresher plan data is available, instead of reusing an earlier lookup. [#52009]
- My Jetpack: Stop repeating the partner lookup request on every page load. [#51441]
- My Jetpack: Stop reporting an error when switching VideoPress off while the Jetpack plugin is inactive. [#53371]
- My Jetpack: Stop the Stats dashboard from asking which plan you want again after Start for Free was already chosen. [#51413]
- My Jetpack: stretch the tab content background to the full height of the page. [#52633]
- Point WordPress.com Simple sites at the Business plan when upgrading, instead of a checkout they can't complete. [#51372]
- Pre-fill the Bluesky handle field when reconnecting an account. [#52187]
- Sharing: Open information tooltips with the keyboard and dismiss them with Escape. [#52661]
- Show each number on the traffic chart's value axis once when visit counts are small. [#52588]
- Social Notes: Avoid repeated database queries when Social Notes are disabled. [#52761]
- Status: Detect a site served on any 127.0.0.0/8 loopback address, or on 0.0.0.0, as a local site. [#51311]
- Stop the dashboard frame from flashing while loading and when switching admin pages. [#52235]
- Traffic chart: Announce the chart correctly to screen readers. [#53202]

## 9.0.3 - 2026-06-26
### Fixed
- Fix fatal error on My Jetpack when the current stable Jetpack plugin is active. [#49994]

## 9.0.2 - 2026-06-24
### Fixed
- Fix the Social admin page rendering blank, and restore the editor sharing panel, on WordPress 6.9. [#49859]

## 9.0.1 - 2026-06-23
### Changed
- Reconnect accounts in place instead of disconnecting and recreating them, retaining connection settings. [#49695]
- Updated package dependencies. [#49793] [#49448] [#49492]

### Fixed
- Fix PHP warnings on the front end of posts shared with the no link sharing option. [#49372]
- Contain errors in the post-publish sharing status panel so they no longer crash the editor. [#49823]
- Detect when the browser blocks the connection popup and notify the user. [#49688]
- Social Previews: Remove the misleading URL from captions when it is not a part of it. [#49745]
- Fix Jetpack Social admin page rendering blank on WordPress 6.9.x. [#49654]

## 9.0.0 - 2026-06-01
### Added
- Google Search Preview: Fix site icon not being shown on some sites. [#47551]

### Changed
- Dependencies: Update lock file to keep root requirements in sync. [#47418] [#48826] [#48860]
- General: Update minimum WordPress version to 6.9. [#49021]
- Internal: No longer require automattic/jetpack-changelogger as a per-project dev dependency. [#48225]
- Publicize: updated e2e connection spec to assert the 'Write a post' CTA as a button (role=button) rather than a link, to match the @wordpress/ui Button migration. [#48150]
- Remove header border-bottom from the admin page for a cleaner unified header appearance. [#47313]
- Remove unneeded development and documentation files from the published plugin. [#49014]
- Switch to Native TypeScript compiler based on Go. [#47375]
- Tested up to WordPress 7.0. [#48114]
- Update design of the sidebar upsell. [#47909]
- Update package dependencies. [#47285] [#47371] [#47505] [#47825] [#48064] [#48683] [#48735] [#49218]

### Removed
- Remove post publish review prompt. [#47650]

### Fixed
- Admin Page: Restore border on header component. [#47425]
- Fall back to the site-wide social message template when no per-post share message is set. [#48606]
- Fix flaky E2E tests. [#47407]
- Fix Threads social preview for posts with gallery. [#47322]
- Fix TS errors detected by tsgo. [#47426]
- Fix useSelect warning for notesConfig on Social admin page. [#47740]

## 8.0.1 - 2026-02-19
### Added
- Add visual dot to active connection in preview modal. [#47218]

### Changed
- Disable AI image option in the media UI when Jetpack plugin is not active. [#47193]

## 8.0.0 - 2026-02-18
### Added
- Add Jetpack Protect details page for users without the dedicated Jetpack Protect plugin. [#46630]
- Gate per-network customization behind paid features. [#46740]
- Show a snackbar while sharing is in progress. [#46672]

### Changed
- Mark new connections as shared by default for privileged users. [#46796]
- My Jetpack: Check red bubble notification async when cache is not available. [#46396]
- Refactor share status UI to use Notice component. [#46673]
- Update `composer.lock`. [#46686]
- Update package dependencies. [#46785] [#47021]
- Update social post preview modal height. [#46882]
- Use fallback avatar for Jetpack Social connection icons. [#46677]

### Removed
- General: Update minimum WordPress version to 6.8. [#46801]

### Fixed
- Fix Tumblr preview to prioritize custom message when it is set. [#47075]
- Refresh plan features on post-checkout redirect. [#46961]
- Social Previews: Use fallback image when social preview profile picture fails. [#46674]

## 7.4.0 - 2026-01-14
### Added
- Add the new media selection UI for Social. [#46085]
- IDC: Add revalidation for IDCs. [#46268]
- Reuse AI image generation in media section. [#46147]

### Changed
- Improve the sidebar by making titles more descriptive and combining sections. [#46007]
- Unified social provider preview. [#46364]
- Update composer lock following Publicize changes. [#46516]

### Removed
- Remove the obsolete share limits logic. [#46468]
- Remove the unused dismiss review endpoint. [#46398]

### Fixed
- Fix connections management modal not opening from pre-publish panel. [#46316]
- Fix e2e tests for link preview in the editor sidebar. [#46098]
- UI: Prevent the modals in editor from stretching too wide on large screens. [#46400]

## 7.3.0 - 2025-11-21
### Added
- Tested up to WordPress 6.9. [#45571]

### Changed
- Don't translate product names. [#43961]
- Improve auto-share UI in the editor by streamlining the notices and descriptions. [#45970]
- Update package dependencies. [#45478] [#45652] [#45676] [#45756]
- Update the connections list in the editor to a vertical toggle list with labels and icons. [#45939]

### Fixed
- Fix connection icon not reflecting the change when profile picture is updated. [#45937]
- Jetpack: Remove getIconColor functions for block icons. [#45992]
- My Jetpack: Fix expiring renewal prompt to show all products [#45995]
- My Jetpack: Fix visual compatibility issue with Hello Dolly plugin. [#45474]

## 7.2.0 - 2025-10-10
### Added
- Add typecheck support for E2E tests. [#44788]

### Changed
- Remove CRM installation nudge for Complete plan users. [#45026]
- My Jetpack: Fix multisite availability check for restricted products and modules. [#44710]
- Update dependencies. [#44673]
- Update package dependencies. [#44725] [#45096] [#45097] [#45200] [#45298] [#45299]

### Fixed
- Fixes an issue with Social where default image id could not be cleared. [#44994]

## 7.1.0 - 2025-08-05
### Added
- Social Image Generator: Add font option. [#44514]
- My Jetpack: Add analytics for empty product search results. [#44344]
- Social Notes: Add a fallback title that can be customized via the `jetpack_social_notes_default_title` filter. [#43864]

### Changed
- E2E tests: Remove redundant logic in test fixture and converted the fixture to Typscript. [#44327]
- Improve performance of WordPress.com comment likes by caching and minimizing API requests. [#44205]
- My Jetpack: Enable access to My Jetpack on WP Multisite. [#44260]
- My Jetpack: Hide backup failure notice when backups are deactivated. [#43568]
- My Jetpack: Unify the user connection flow with a unified screen. [#44469]
- My Jetpack: Update Stats card to include a chart for better analytics. [#43870]
- Sync: Ignore the ActivityPub Outbox CPT. [#44222]
- Update package dependencies. [#43839] [#44206]

### Fixed
- Ensure images load in connections management when concatenating JS. [#43655]
- Fix image validation when images sizes are customised. [#44368]
- JITM: Fix ineffective caching due to expired plugin sync transient. [#44117]
- My Jetpack: Fix footer alignment for disconnected accounts. [#44468]
- My Jetpack: Prevent expiration alerts for products covered by active bundles. [#44586]
- My Jetpack: Restore plan purchase link in footer. [#44535]
- Social Image Generator: Do not use the latest post's Social Image as Open Graph Image tag on the home page. [#44377]
- Social Notes: Update filter name to match recent changes in WordPress. [#43947]
- Social Previews: Fix a bug with text overflowing with Mastodon. [#44019]
- Update JITMs to remove jQuery dependency. [#43783]

## 7.0.0 - 2025-05-22
### Added
- Added option to set default image for Social Image Generator. [#43461]

### Changed
- E2E Tests: Update config file encryption algorithm. [#43523]
- jetpack-assets now requires jetpack-status so updating composer lock files. [#43085]
- My Jetpack: Optimize the images for onboarding slider for faster page load. [#43473]
- My Jetpack: Updated the onboarding UI, changing it to a single button. [#43203]
- Update package dependencies. [#43425]

### Removed
- General: Update minimum WordPress version to 6.7. [#43192]

### Fixed
- JS Packages: Decrease CSS priority of global styles to prevent them from applying within the editor. [#43035]
- My Jetpack: Fixed Onboarding UI responsiveness at 600px. [#43533]
- My Jetpack: Fix readability of license activation button on hover. [#43550]
- My Jetpack: Fix social login getting stuck when email input not empty. [#43158]

## 6.4.0 - 2025-04-17
### Added
- Added more error logging. [#42959]
- Added Share status support for WPCOM sites [#42593]
- Adding My Jetpack tour. [#42880]
- Adds Account Protection initialization [#40925]
- Improve the onboarding experience of Jetpack guiding the users through a new onboarding process. [#42757]

### Changed
- Connection: Allow pre-selected login providers [#42662]
- General: indicate compatibility with the upcoming version of WordPress - 6.8. [#42701]
- Improved the logic for share status [#42978]
- Update package dependencies. [#42815]
- Update package dependencies. [#43071]

### Fixed
- Do not load in the editor if sharing is disabled [#43006]
- E2E: Fix tests following WP 6.8 release [#43105]
- Fix arguments for jetpack_open_graph_tags filter [#42665]

## 6.3.0 - 2025-03-21
### Added
- My Jetpack: An onboarding screen has been implemented to provide clear, step-by-step instructions for new users connecting to Jetpack. [#42523]

## 6.2.1 - 2025-03-19
### Changed
- Internal updates.

## 6.2.0 - 2025-03-17
### Added
- Added the schedule share functionality to the share post modal [#42376]
- Connection: Disconnecting a connection owner account will disconnect all other users first. [#41923]
- Enabled Social Post UI for WPCOM sites [#41219]
- Post List: Add a Copy Link Quick Action [#41305]
- Publicize Components: Add the schedule button [#42313]
- Social: Updated the admin page for use by Editors and Authors [#41859]

### Changed
- Connection: Display connection status on Users page independent of the SSO module. [#41794]
- External Media: Move the GooglePhotosMedia, OpenverseMedia, PexelsMedia to @automattic/jetpack-shared-extension-utils [#41078]
- Moved JS editor code from Jetpack and Social to Publicize package [#41836]
- Moved Social admin page code and assets logic to publicize package [#41239]
- Moved the Social resharing into the social post modal [#42224]
- Move initial state from Social plugin to publicize package [#41381]
- Only register social/settings endpoint if Jetpack version does not have it [#41596]
- Open Graph Meta Tags: do not display Jetpack's tags when the SEOPress plugin is active. [#41331]
- Social: Enable new admin page for the Social plugn [#41498]
- Social post character limits are now dynamic based on selected connections [#41429]
- Social | Migrate review prompt initial state to script data [#42389]
- Social | Move settings endpoint to publicize package [#41456]
- Updated composer.lock [#40863]
- Updated package dependencies. [#41286]
- Updated package dependencies. [#41491]
- Updated package dependencies. [#41577]
- Updated package dependencies. [#41659]
- Update package dependencies. [#42163]
- Update package dependencies. [#42180]
- Update the settings endppoint to use existing endpoints [#41461]
- Update the unowned section from a product grid to a product list [#41312]

### Removed
- Social Previews | Remove "Your post" section in favour of Social Post UI [#41329]
- Social | Removed the old unused initial state [#42390]

### Fixed
- Code: Prevent dynamic class properties. [#41857]
- Fixed connecting LinkedIn company pages and Tumblr additional blogs [#42352]
- Social Previews | Fixed distorted image for Tumblr preview [#41844]

## 6.1.0 - 2025-01-27
### Changed
- Code: Use function-style exit() and die() with a default status code of 0. [#41167]
- License: Social admin page header hides license link on WoA sites. [#41076]
- Moved the Social admin page to the publicize-components package [#41181]
- Refactored Social Note settings to use core [#41153]
- Updated package dependencies. [#41099]

### Fixed
- Fixed profile links for LinkedIn connections [#40873]
- Fixed wordpress.com log in error when connecting Social accounts [#41149]
- Fix publicize error in the editor due to malformed connections data [#40679]

## 6.0.0 - 2025-01-14
### Added
- Add Bluesky to social feature copy. [#40487]
- Add a new toggle for UTM tracking. [#39998]
- Add LinkedIn permissions warning. [#40220]
- Enable test coverage. [#39961]
- Make Post share status immediately available in the editor on page load. [#40301]
- My Jetpack: Update recommendations section in My Jetpack to include a slider interaction for the cards. [#39850]

### Changed
- Change My Jetpack CTA from "Learn more" to "Activate". [#40359]
- Change order of connections. [#40020]
- Clean up unused TypeScript types [#40033]
- E2E Tests: Update tests to use @wordpress/e2e-test-utils-playwright. [#40750]
- Ensure the support link points to Jetpack support. [#40760]
- Image Generator: Change description for toggle. [#40991]
- Image Generator: Move settings to new store. [#39904]
- Migrate settings to new script data. [#40032]
- Migrate the last bits of social store to new script data. [#40081]
- Move the admin menu initialization to the init hook. [#40474]
- Readme: Update documentation to include all supported social networks. [#40248]
- Remove some unused code. [#40122]
- Resolve an issue where revoked licenses were incorrectly treated as unattached. This caused users to be redirected to the license activation page after site connection, even when unattached licenses were not valid for activation. [#40215]
- Updated dependencies. [#40286]
- Updated package dependencies. [#39999] [#40000] [#40060] [#40116] [#40258] [#40288] [#40363] [#40515] [#40564] [#40693] [#40784] [#40792] [#40798] [#40815] [#40980]

### Removed
- General: Update minimum PHP version to 7.2. [#40147]
- General: Update minimum WordPress version to 6.6. [#40146]

### Fixed
- E2E Tests: Only install single browser used by Playwright. [#40827]
- Fix an issue where we showed the license message even with a plan. [#40931]
- Fix the infinite reload issue on Jetpack Sharing settings. [#40089]
- Fix the Instagram max video length. [#39930]
- Page & Post: Fix the layout on mobile when details are open. [#40872]
- Prevent dataviews styles imported in share status from being added globally. [#39991]

## 5.5.1 - 2024-10-29
### Changed
- Components: Add __nextHasNoMarginBottom to BaseControl-based components, preventing deprecation notices. [#39877]
- Updated package dependencies. [#39910]

## 5.5.0 - 2024-10-25
### Added
- Added Bluesky to social previews [#39659]
- Social Notes: add support for the ActivityPub Reply-To block. [#39738]

### Changed
- General: indicate compatibility with the upcoming version of WordPress - 6.7. [#39786]
- Initial State: Migrated URLs to script data [#39797]
- Only include `wp-polyfill` as a script dependency when needed. [#39629]
- Updated package dependencies. [#39594] [#39653] [#39707]

### Fixed
- Added Jetpack Beta's slug to Social OG conflicting plugins [#39792]
- Social: Fixed share status tooltip text overflow [#39599]

## 5.4.1 - 2024-10-02
### Changed
- Internal updates.

## 5.4.0 - 2024-10-01
### Added
- Added support for Bluesky 🎉 [#39561]
- Social: adds hook for plugin developers to be able to pull social share URLs on save. [#39398]

### Changed
- Social: Migrated useAdminUiV1 feature flag to new script data [#39137]
- Updated package dependencies. [#39278] [#39288] [#39302] [#39332]

### Removed
- Connection: Removed deprecated method features_available [#39442]
- Connection: Removed features_enabled deprecated method [#39475]
- Social: Cleaned up media auto-conversion backend logic [#38587]

### Fixed
- My Jetpack: visual update to the GlobalNotice component look better on mobile. [#39537]
- Social: Updated social previews button styles to fit the translated string [#39430]

## 5.3.1 - 2024-09-06
### Changed
- Internal updates.

## 5.3.0 - 2024-09-05
### Changed
- Updated connection js to load its bundle via connection package [#38877]
- Updated package dependencies. [#39176]

### Fixed
- Updated pricing table to clarify features [#39182]

## 5.2.0 - 2024-08-29
### Changed
- Admin menu: change order of Jetpack sub-menu items [#39095]
- Moved PostPublishPanels component to publicize-components package [#39049]
- Social: Migrated shares data to the new script data [#38988]
- Social: Updated intial state logic to use the new consolidated initial state [#38606]
- Social: Updated the share status modal to render it globally [#39116]
- Update composer lock file [#38942]
- Updated package dependencies. [#38662] [#38665] [#38822] [#38822] [#39111]

### Removed
- Remove the unused Advanced plan nudge [#38926]
- Social: Removed share limits UI and data logic [#38904]

### Fixed
- Revert recent SVG image optimizations. [#38981]

## 5.1.0 - 2024-08-08
### Added
- Added feature flag management for social [#38669]

### Fixed
- Lossless image optimization of images in projects/plugins [subdirectories from a* through social] [#38573]

## 5.0.0 - 2024-08-01
### Changed
- Social: Removed unnecessary feature checks for social connections [#38216]
- Updated package dependencies. [#38228] [#38235] [#38464]

### Removed
- General: update WordPress version requirements to WordPress 6.5. [#38382]
- Removed the unused code for image auto-conversion from social store [#38609]
- Social | Removed the media auto-conversion UI [#38497]

## 4.5.2 - 2024-07-03
### Changed
- General: indicate compatibility with the upcoming version of WordPress - 6.6. [#37962]
- Updated package dependencies. [#37917] [#38132]

### Fixed
- Fixed E2E tests navigating to block editor [#37875]
- Fixed the admin page pricing table not shown [#37877]
- Social: Fixed broken connections reconnect link to point it to new connections UI [#37869]

## 4.5.1 - 2024-06-18
### Fixed
- My Jetpack: Update My Jetpack to a more stable version. [#37911]

## 4.5.0 - 2024-06-13
### Changed
- Move the admin upsell to the toggle section [#37731]
- Updated package dependencies. [#37767] [#37776] [#37796]

### Removed
- Removed the social basic plan from the admin page [#36846]

### Fixed
- Updated wp.org screenshots [#37726]

## 4.4.0 - 2024-06-05
### Changed
- Social | Removed the top "Connect accounts" on the admin page [#37697]
- Social | Updated upgrade nudges to use the new plan [#37638]
- Updated package dependencies. [#37669]
- Updated the editor nudge text and logic [#37644]

## 4.3.0 - 2024-05-29
### Added
- Add connect form/button for connection management [#37196]
- Added a CTA button to create a social note [#36972]
- Added and rendered GlobalNotices component [#37237]
- Added feature flag for new social admin ui [#37134]
- Added more E2E tests [#37046]
- Added the connection modal to the editor [#37405]
- Add Woocommerce event remove_order_items to Jetpack Sync [#33748]
- Disabled the Note config toggles while the API calls are pending [#36872]
- Social: Added add connection modal [#37211]
- Social Admin page: Added connection management component [#37120]
- Social Limits: Added clarification of cycle reset [#37350]

### Changed
- General: update WordPress version requirements to WordPress 6.4. [#37047]
- General: use wp_admin_notice function introduced in WP 6.4 to display notices. [#37051]
- Remove explicit Plugin Install package dependency. [#37430]
- Remove the 'jetpack-identity-crisis' dependency. [#36968]
- Social | Updated the connection test results endpoint for front-end [#37531]
- Updated package dependencies. [#37147] [#37148] [#37348] [#37379] [#37380] [#37382]
- Update the Social sidebar share post panel to direct non-admin authors to user connection if there is no user connection. [#36976]

### Fixed
- Adjusted the webpack config so the social icon colours are picked up by PostCSS [#37327]
- Fixed CSS variables not loaded for modals on Social admin page [#37391]
- Fixed timeouts in E2E tests [#37045]

## 4.2.0 - 2024-04-11
### Added
- Added functions to display share urls [#36328]
- Added options and UI for link formatting [#36671]
- Added support for comments on Social Notes [#36428]
- Packages: add version tracking for identity-crisis package. [#36635]
- Trigger red bubble notification when bad install is detected [#36449]

### Changed
- Allow multiple paragraphs for Social Notes [#36522]
- Only show custom media picker for normal posts [#36640]
- Only show installation errors on plugins page [#36390]
- Removed the featured image block from the template [#36819]
- Simplified social network selection for post sharing [#36734]
- Updated package dependencies. [#36309] [#36325] [#36585] [#36760] [#36761] [#36775] [#36788]
- Update to the most recent version of Color Studio, 2.6.0. [#36751]
- Update to the most recent version of the @automattic/calypso-color-schemes package. [#36227]

### Fixed
- Fixed typos [#36554]
- Prevent enqueuing of admin styles on the frontend [#36552]

## 4.1.0 - 2024-03-07
### Added
- Added a template lock to our Social Note CPT [#35619]
- Added endpoint to update post meta [#35822]
- Added feature support for the new CPT to support activitypub. [#35442]
- Added fix for the post list screen for social notes. [#35514]
- Added toggle to Social admin page for the Social Notes [#35681]
- Implemented titless permalink fixes. [#35462]
- New setting in /sties/$site/settings that is not relevant to this plugin. [#35509]
- Register CPT for Social Notes. [#35415]
- Social: Added archive page support to notes [#35592]

### Changed
- Changed the admin page 'Write a post' button to primary if the site has connections [#36031]
- General: indicate compatibility with the upcoming version of WordPress, 6.5. [#35820]
- Social Notes: Added the post list enhancements [#35819]
- Tailored editor for social notes [#35536]
- Updated package dependencies. [#35384, #35385, #35591, #35608, #35819, #36095, #36097, #36142, #36143]
- Update package lock [#35672]
- Update to the most recent version of the @automattic/calypso-color-schemes package. [#36187]
- Use Blog ID in links to WPCOM instead of site slug. [#35006]

### Fixed
- Fixed no title from showing up in og:title [#35624]
- Fixed og:title having word-breaks. [#36068]

## 4.0.0 - 2024-01-18
### Changed
- Changed dismissed notices endpoint to be a core endpoint [#34544]
- Social: Changed the illustration on the admin page [#34454]
- Social: Refactored storing of feature options to use core functions [#34113]
- Split PublicizeForm component into smaller ones [#34612]
- Updated Jetpack Social activation landing page [#34778]
- Updated package dependencies. [#34559] [#34815] [#34882]
- Updated the design for Quick Share buttons and fixed its a11y [#34754]

### Fixed
- Fixed a bug with the initial state script [#34861]
- Fixed Jetpack Social scheduled post messaging [#34182]

## 3.0.0 - 2023-12-06
### Added
- Added a new post-publish panel for quick sharing [#33231]
- Added Nextdoor to Social Previews [#33907]
- Added traking for social sharing buttons [#33231]

### Changed
- Code Modernization: Replace usage of strpos() with str_contains() [#34137]
- General: updated PHP requirement to PHP 7.0+ [#34126]
- General: update WordPress version requirements to WordPress 6.3 and compatible with 6.4. [#34127] [#33776]
- Updated package dependencies.
- Updated screenshot to show the new connection toggles. [#33381]
- Updated Social admin pricing page [#33176]

### Removed
- Removed unused code [#34111] [#34241]

### Fixed
- Fixed an issue where initial state is not in sync [#33969]
- Fixed broken connections UI [#34391]
- Fixed pre-publish UI reactivity for Jetpack Social [#34243]
- Fixed the issue of publicize remaining ON after the post is published [#34289]

## 2.3.0 - 2023-09-20
### Added
- Add the change settings logic in Social for the auto conversion feature. [#32712]

### Changed
- Changed logic that disables the connections based on the auto-conversion feature. [#32671]
- General: remove WP 6.1 backwards compatibility checks. [#32772]
- General: update WordPress version requirements to WordPress 6.2. [#32762]
- Updated Jetpack submenu sort order so individual features are alpha-sorted. [#32958]
- Updated package dependencies. [#32803], [#32804], [#32966]
- Updated package dependencies. [#33001]

## 2.2.0 - 2023-08-23
### Added
- Add admin-page upsell notice [#32128]
- Add new nudge in the editor to upgrade to the Advanced plan that will appear every 3 months [#32087]
- Add SIG toggle for Jetpack Settings [#32475]
- Add the new auto-conversion toggle for Social [#32597]
- Add check for checking if user is on Basic plan [#32112]

### Changed
- Changed JITM so it can be properly dismissed. [#32033]
- Jetpack editor extensions: use shared component for the logo. [#32257]
- Moved store to publicize-components package. [#32317]
- Social: Implement the new design for the connection toggles. [#32305]
- Updated package dependencies. [#32166]
- Use a new method to render Connection initial state. [#32499]

### Fixed
- Fixed checkout link so it's not siteless. [#32254]

## 2.1.0 - 2023-08-01
### Changed
- General: indicate full compatibility with the latest version of WordPress, 6.3. [#31910]
- Refactor TemplatePicker component, so inner part can be use in it's own without a modal. [#31740]
- Social: Update the screenshots to reflect the current UI [#31832]
- Updated package dependencies. [#31659, #31661, #31769, #31785, #31872, #31923, #32040]

### Fixed
- Fix admin page unit test [#31417]

## 2.0.0 - 2023-07-05
### Added
- Add authentication to Zendesk chat widget. [#31339]

### Changed
- Social: change the admin page plan redirect link. [#31195]
- Social: update the Readme to better reflect new features. [#31686]
- Updated package dependencies.

### Fixed
- Social: fix the connection state to ensure that new connections are disabled by default when there are no shares left. [#31168]
- Social Review Prompt: fix the state so it is shown when Jetpack is also active. [#31456]

## 1.11.0 - 2023-06-06
### Added
- Added feature flag for Mastodon preview [#30919]
- Jetpack Social: Add a notice to let users know Instagram is available [#30777]

### Changed
- Remove conditional rendering from zendesk chat widget component due to it being handled by an api endpoint now [#29942]
- Updated package dependencies.
- Updates the enhanced publishing feature check [#29881]

### Deprecated
- Minor changes around upcoming functionality change in Twitter. [#30272]

## 1.10.0 - 2023-05-02
### Added
- Social: Updating plugin version. [#30158]

### Changed
- Added dynamic pricing to Social admin page. [#30105]
- Updated package dependencies. [#29565, #29854, #29857, #30019]
- Update WordPress version requirements. Now requires version 6.1. [#30120]

### Fixed
- Dashboard: ensure the link to the post editor works, even when WordPress is installed in a subdirectory. [#30159]
- Jetpack Social: Render Social Image Generator panel even when SIG's default is disabled [#30358]
- Temporarily removed review prompts to fix the plugin's UI state. [#30101]

## 1.9.1 - 2023-04-06
### Fixed
- Reinstated is_social_image_generator_enabled for backwards compatibility. [#29952]

## 1.9.0 - 2023-04-04
### Added
- (Backup, Boost, Search, Social) Add links on upgrade pages to activate a license key, if you already have one. [#29443]
- Added option for CUT component to have a tooltip. [#29609]
- Added SIG image to the post media array if it's enabled. [#29093]
- Added toggle to Social admin page to enable or disable Social Image Generator as well as an option to pick a default template. [#29722]

### Changed
- General: indicate full compatibility with the latest version of WordPress, 6.2. [#29341]
- Jetpack Social: Enable Social Image Generator by default when it's available. [#29742]
- Refactored the ToggleSection component to decouple it from other logic. [#29619]
- Updated package dependencies. [#29216, #29289, #29297, #29434, #29471, #29480]

### Other changes <!-- Non-user-facing changes go here. This section will not be copied to readme.txt. -->
- Updated composer.lock. [#29762]

## 1.8.0 - 2023-03-07
### Added
- Add Social Image Generator editor panel to post sidebar [#28737]
- Add Social Image Generator feature flag to Jetpack Social [#29001]

### Changed
- Changed remaining shares phrasing [#28688]
- Remove `ci.targets` from package.json. Better scoping of e2e tests. [#28913]
- Update billing language [#29126]
- Updated package dependencies.
- Update to React 18. [#28710]

### Fixed
- Revise Jetpack connection agreement text to comply with our User Agreement [#28403]
- Use External Link icons for external links [#28922]

## 1.7.0 - 2023-02-07
### Added
- Added Advanced Social plan to pricing table [#28258]

### Changed
- Moved resharing to be available in the free plan [#28661]
- Updated package dependencies.
- Update playwright dependency [#28094]
- Use `flex-end` instead of `end` for better browser compatibility. [#28530]

## 1.6.0 - 2023-01-10
### Added
- Add a review request prompt for Jetpack Social plugin. [#28072]
- Add simple JS React test. [#27122]
- Add the adminUrl to the initial editor state. [#27617]
- Redirect to admin page on plugin activation, and add link to admin page from plugins page. [#24586]

### Changed
- Updated package dependencies. [#27340, #27688, #27689, #27696, #27697, #27874, #27887, #27916, #27962]

## 1.5.1 - 2022-12-06
### Changed
- Updated package dependencies. [#26069]

### Fixed
- Fix alignment issues on social admin page [#27146]

## 1.5.0 - 2022-11-08
### Changed
- Compatibility: WordPress 6.1 compatibility [#27084]

### Other changes <!-- Non-user-facing changes go here. This section will not be copied to readme.txt. -->
- Social: Updated the plugin versions to start the new cycle [#27114]
- Updated package dependencies. [#27182, #27196, #27278, #27289]

## 1.5.0-beta - 2022-10-27
### Added
- Display broken connections to user in editor [#25803]
- Integrate the ConnectionError react component to the Social plugin. [#26904]
- Reshare: Added the reshare UI to the block editor extension [#25993]

### Changed
- Updated package dependencies. [#25993, #26640, #26683, #26705, #26716, #26790, #26791, #26808, #26826, #26829, #26851, #27089]

### Fixed
- Social: Fix the connection test endpoint URL [#26892]
- Social: Fix the path to the connections URL in the editor [#26932]

## 1.4.2 - 2022-10-20
### Fixed
- Social: Fix the path to the connections URL in the editor [#26932]

## 1.4.1 - 2022-10-19
### Fixed
- Social: Fix the connection test endpoint URL [#26892]

## 1.4.0 - 2022-10-06
### Added
- Add ContextualUpgradeTrigger to Jetpack Social admin page [#26115]
- Added check to not show the share metre if someone has a paid plan. [#26310]
- Added Jetpack social redirect urls. [#26135]
- Add pricing table to Jetpack Social [#26213]
- Adds ability to autotag, autorelease and autopublish releases [#26156]
- Enforce sharing limits in the Classic Editor [#26039]

### Changed
- Changed the values on the pricing table, and fixed a redirect [#26605]
- Move share limits code to the Publicize package [#26294]
- Set version to 1.4.0-alpha [#25955]
- Social: Aligned Jetpack and Social to use the connection-test-results endpoint in the block editor [#26274]
- Updated package dependencies. [#25934, #25947, #25979, #25999, #26034, #26039, #26072, #26081, #26115, #26165, #26176, #26216, #26253, #26259, #26274, #26294, #26305, #26420, #26457, #26463, #26489, #26568, #26583]
- Updated style for Jetpack Logo icon shown in pre-publish panels for Jetpack and Jetpack Social plugins [#26101]
- Update Inspector Panel Jetpack icon color to #1E1E1E [#26162]
- Use Jetpack logo in Jetpack Social pre-publish screen for Publicize and Social Preview features [#26044]

### Fixed
- Social: Require a user connection to use the plugin. [#26543]
- Store: Added the missing showNudge reducer [#26635]

## 1.3.0 - 2022-09-07
### Added
- Added scheduled post calculation on plugin activation. [#25334]
- Added Social Previews. [#25931]
- Added support for JITMs. [#25880]
- Enforce sharing limits in the block editor, if it is enabled for a site. [#25661]

### Changed
- Updated package dependencies. [#24477, #25265, #25300, #25315, #25334, #25338, #25339, #25377, #25406, #25628, #25661, #25665, #25694, #25762, #25769, #25787, #25814, #25931]

### Removed
- Packages: remove deprecated package. [#25883]

### Fixed
- Avoid PHP warnings when OG description is not set. [#25777]

### Other
- My Jetpack includes JITMs [#22452]
- Post release tasks. [#25364]
- Start a new release cycle. [#25289]
- Support section for paid users [#25633]
- Tweaked the supports method of the plans package to refresh the plan data. [#25347]
- Updated Readme.txt for the jetpack-social-1.2.0-beta [#25286]
- Enables autotag, autorelease, and autosvn actions

## 1.2.0 - 2022-08-03
### Added
- Added shares meter to Jetpack Social admin page.
- Updated package dependencies.
- Added the posts box to the Jetpack Social admin page
- Fetch share counter on the server side in Jetpack Social. To facilitate this, the call to wpcom has been moved into the Publicize_Base class.
- Updated publicize package version.

### Changed
- Rework the admin page to use new components
- Start the 1.2.0 release cycle
- Updated the tagline on the admin page.

## 1.1.0-beta - 2022-06-29
### Changed
- Renaming master to trunk.
- Renaming `master` references to `trunk`
- Reorder JS imports for `import/order` eslint rule.
- Updated package dependencies.
- Updated the design of the admin page to include share counters.

## 1.0.0 - 2022-05-31
### Added
- Initial release.
