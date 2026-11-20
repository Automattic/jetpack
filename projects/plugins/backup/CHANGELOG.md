# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [4.0] - 2026-11-04
### Added
- Activity Log: Link backups to that backup in the Backup dashboard, which now opens any backup from a link, not only those on the activity page it shows. Backups that finished with warnings can now be opened and restored there too. [#53929]
- Connection: Add a Connected view to the Users page listing users with a linked WordPress.com account. [#53150]
- Connection: Show connection errors on the Connectors card, and keep showing the connection owner when their account connection breaks. [#53596]
- Connection: Surface SSL certificate verification failures reported by WordPress.com as a connection error notice. [#52035]
- Connection: Transfer connection ownership to another administrator without leaving your site. [#53359]
- Connection: Transfer connection ownership to another connected administrator from the Connectors page. [#53581]
- My Jetpack: Add an Available filter to the Features list. [#53308]
- My Jetpack: Add catalog-controlled Pro offers and preserve existing plan management. [#53421]
- My Jetpack: Allow the Automattic for Agencies banner to be dismissed. [#51441]
- My Jetpack: Recognize Jetpack Pro subscriptions and licenses. [#53424]
- On sites hosted on WordPress.com, warn before restoring a backup with known security threats, and mark such backups in the backup list and the Activity Log. "Restore backup" in the Activity Log now opens the restore screen in wp-admin. [#53755]

### Changed
- Activity Log: Show the connection error notice only when a connection error has been recorded. [#52977]
- Boost: Wait up to four minutes for slow speed tests in My Jetpack instead of timing out after two. [#51605]
- Charts: follow the WordPress admin color scheme for chart series colors. [#51535]
- Charts: update chart grid, axis and label colors immediately when the theme changes. [#51687]
- Connection: Ask for confirmation before disconnecting your user account, and offer to transfer ownership first when you own the connection. [#53865]
- Connection: Link the connection owner's name on the Connectors card to their profile, and update the card without reloading the page when a non-owner disconnects their account. [#53785]
- Connection: Show a clear message when connecting the site to WordPress.com from the Connectors card fails, instead of WordPress.com's raw error text. [#54035]
- Connection: Show every connection error in one notice, each with the account it affects, and link to Site Health when a firewall is blocking WordPress.com. [#51504]
- Connection: Use one wording across My Jetpack and the Connectors screen for the consent notice shown before connecting, for Offline Mode, and for the ownership lock. [#54034]
- Connection: When disconnecting the site from the Connectors card, list the plugins that will stop working and link to help. [#53861]
- General: Update minimum WordPress version to 7.0. [#51370]
- Link the failed download screen to a guide on how to fix it. [#54500]
- My Jetpack: answer module switch clicks immediately, and explain what happened when a change fails. [#52494]
- My Jetpack: Connect a WordPress.com account from feature cards that need one. Show feature states through switches or buttons instead of redundant Active or Inactive badges, and show host restrictions below descriptions. Leave features out of Available when their only action is an install you cannot make. [#53990]
- My Jetpack: Keep focus on pricing tooltip icons when they open, announce their content to screen readers, and show a focus ring after clicking them. [#52736]
- My Jetpack: Leave the recommendation to install or activate plugins included in a bundle plan out of the Jetpack menu notification badge. [#54355]
- My Jetpack: Line up notices with the cards below them, and drop the grey background behind the Features grid and list buttons. [#53759]
- My Jetpack: On the Features tab, keep a plugin's switch busy until its card is up to date after a failed change, or after any change on sites that also run Jetpack. [#54156]
- My Jetpack: Open supported Modules links in Features when Jetpack is active. [#53992]
- My Jetpack: Open the Jetpack Connection details on the Connectors screen from the header's Manage connection link. [#54276]
- My Jetpack: Refresh Pro availability while preserving existing offers. [#53425]
- My Jetpack: Restyle dashboard notices to match the WordPress design system. [#52290]
- My Jetpack: Show a connection error on the Overview connection card while your account is still to be connected, instead of only asking you to connect it. [#53409]
- My Jetpack: Show a Features tab in place of the Products tab. [#52785]
- My Jetpack: Show Backup's state from the site's plan on its Features card instead of a switch, offering an upgrade, or a renewal for an expired plan. [#53726]
- My Jetpack: Show product cards flat, without a drop shadow. [#52988]
- My Jetpack: Show the avatar and connection status control in the header by default, with access to connection and plan details. [#54225]
- My Jetpack: Show the dashboard in the new rounded admin page frame. [#52446]
- My Jetpack: Show the Features page on sites in Offline Mode, without connecting to WordPress.com. [#54216]
- My Jetpack: Show the Jetpack menu notification badge when a connection error is detected. [#52332]
- My Jetpack: Show what Paid Stats actually adds — UTM tracking, device stats, and region & city locations — instead of commercial use. [#51410]
- My Jetpack: Turn a module on once Install Jetpack or Activate Jetpack on its card finishes setup. [#54007]
- Replace the dashboard with a redesigned one, where you can browse each backup's files, restore or download a backup, and change when backups run and how long they are kept. [#53443]
- Review request: Ask about backups instead of real-time backups, which was inaccurate on daily plans. [#51803]
- Sidebar: sort Jetpack menu items alphabetically, pinning My Jetpack to the top and external links and Settings to the bottom. [#52003]
- Tested up to WordPress 7.1. [#51370]
- Update package dependencies. [#52028] [#53448] [#54117]
- Use the design system progress bar for the backup, restore, download and storage meters. [#54512]

### Removed
- Updated PHP version requirements to PHP 7.4 or newer. [#51515]

### Fixed
- Activity Log: Fix the page overlapping the admin menu in right-to-left languages. [#51963]
- Activity Log: honor the module setting, so the page can be turned off. [#52409]
- Activity Log: Show an empty date picker on the free plan, instead of a date range it does not apply. [#53982]
- Activity Log: Stop the frame from flashing while loading and when switching admin pages. [#52235]
- Admin dashboards: Keep the page header and content in view when the wp-admin menu is taller than the window. [#51696]
- Cache the promoted Backup subscription price so the screen shown to sites without a plan stops fetching it from WordPress.com on every load. [#51796]
- Charts: draw labels at the design system's font weight and size. [#51452]
- Connection: Explain why connecting the site failed instead of showing a raw or generic error. [#53289]
- Connection: Fix a stale connection error notice that could persist on healthy sites. [#52264]
- Connection: Fix reconnecting your WordPress.com account so it no longer disconnects other users and clears the broken-connection notice on the first attempt. [#52851]
- Connection: Hide connection error notices from users who cannot fix the connection. [#52049]
- Connection: Let users without admin access reconnect their own broken account from the connection error notice. [#52718]
- Connection: Report a broken connection on My Jetpack's connection card instead of claiming everything looks good, and show a break only the connection owner can repair as a warning, not an error, to everyone else. [#52130]
- Connection: Show connection owner names containing characters like & correctly. [#54197]
- Connection: Stop showing a duplicate account notice when your WordPress.com email differs from your site email only in letter case. [#51285]
- Connection: Stop Site Health from showing spurious connection failures — remove the redundant outbound HTTP/HTTPS checks, and no longer prompt a reconnect when the WordPress.com connection test is inconclusive. [#52916]
- Connection: Stop users who cannot set up the site connection from becoming the connection owner when the owner's connection is missing. [#52880]
- Connection: Translate the Connectors card's text on sites that don't use English. [#53179]
- Connection: Update wording for some connection error notices. [#51360]
- Dashboard: Continue the wp-admin menu color behind the page frame on WordPress.com and third-party admin color schemes. [#51619]
- Fix the backup overview ability reporting no storage usage, storage limit or backup time. [#51684]
- Footer: Hide Products and Help links when My Jetpack is unavailable. [#52557]
- JITM: Fix missing messages and a console error on sites without the Jetpack plugin active. [#51733]
- Keep admin icons colored after the @wordpress/icons 16 update, which draws them as strokes. [#52187]
- My Jetpack: always label the license activation link 'Activate a license'. It previously read 'Activate a new license' on sites with a plan, even when no licenses had been activated. [#51283]
- My Jetpack: Bring the first Features results into view after changing the filter or search while scrolled down. [#54201]
- My Jetpack: Fix the layout of the connection screen for right-to-left languages. [#52749]
- My Jetpack: Hide other plugins' notices while the setup screen is open, and stop the full-screen layout breaking when another plugin adds an admin body class first. [#52765]
- My Jetpack: Keep the Automattic for Agencies banner hidden after dismissing it and switching tabs. [#51441]
- My Jetpack: Keep the Help tab's cards inside their column on narrow screens. [#53847]
- My Jetpack: keep the stats chart tooltip under sticky and fixed page elements. [#51640]
- My Jetpack: Make the connection screen's Connect button and footer links reachable on shorter screens. [#53402]
- My Jetpack: Open pricing tooltips with the keyboard and dismiss them with Escape. [#52661]
- My Jetpack: Point users who cannot connect the site at an administrator, instead of an onboarding screen they cannot complete. [#52614]
- My Jetpack: Return to the tab you came from with the back link on product upgrade screens. [#54101]
- My Jetpack: Show each notice once instead of twice. [#52494]
- My Jetpack: Show the correct product status and use the active plugin copy when turning products on or off with both stable and Beta or development copies installed. [#53994]
- My Jetpack: Show the highest-priority notice first when several are set at once. [#53400]
- My Jetpack: Show the right product status as soon as fresher plan data is available, instead of reusing an earlier lookup. [#52009]
- My Jetpack: Stop offering retired Security and Growth plans while preserving existing subscriptions. [#53854]
- My Jetpack: Stop repeating the partner lookup request on every page load. [#51441]
- My Jetpack: Stop reporting an error when switching VideoPress off while the Jetpack plugin is inactive. [#53371]
- My Jetpack: Stop showing $0.00 for paid plans on recommendation cards when prices cannot be loaded. [#54458]
- My Jetpack: Stop showing an empty account avatar on the Overview connection card on sites without a connection owner when nothing in use needs a user connection. [#53287]
- My Jetpack: Stop the Stats dashboard from asking which plan you want again after Start for Free was already chosen. [#51413]
- My Jetpack: stretch the tab content background to the full height of the page. [#52633]
- Report a WordPress.com failure on the Backup plan check as an error instead of as a missing plan. [#51889]
- Show a failure message when your backup status cannot be read, rather than the screen that says your first backup is on its way, and let the "Back up now" button recover when a backup could not be queued. [#51625]
- Show a finished backup in the list without a page reload, even when WordPress.com is slow to list it, and add a "Backup complete" notice that stays until it is dismissed. [#53999]
- Show storage usage and the plan limit the right way round when the interface is translated. [#51664]
- Show that Backup is unavailable in Offline Mode instead of the dashboard, so a local copy of a site can't act on the live site's backups. [#54070]
- Status: Detect a site served on any 127.0.0.0/8 loopback address, or on 0.0.0.0, as a local site. [#51311]
- Stop a slow or failing WordPress.com from reading as a missing Backup plan. [#51869]
- Stop the Get VaultPress Backup button from staying busy when setup fails. [#53069]
- Underline the "Get in touch with us", "Learn more" and "Modify" links, so they stand out from the sentence around them without relying on color. [#54290]

## [3.9] - 2026-08-11
### Added
- Add the Activity Log page to wp-admin, so it is available without the Jetpack plugin installed. [#51154]

### Changed
- General: Update composer.lock files. [#48743]
- General: Update minimum WordPress version to 6.9. [#49021]
- Tested up to WordPress 7.0. [#48114]
- Update composer.lock files. [#49415]
- Updated package dependencies. [#48064] [#48329] [#48683] [#48735] [#49448] [#49793] [#50436]

### Fixed
- Fix fatal error on My Jetpack when the current stable Jetpack plugin is active. [#49994]

## [3.8] - 2026-04-11
### Added
- Add Jetpack Protect details page for users without the dedicated Jetpack Protect plugin. [#46630]
- IDC: Add revalidation for IDCs. [#46268]

### Changed
- Dependencies: Update lock file to keep root requirements in sync. [#47418]
- My Jetpack: Check red bubble notification async when cache is not available. [#46396]
- Remove header border-bottom from the admin page for a cleaner unified header appearance. [#47313]
- Storage popover: use core components and remove custom CSS. [#47448]
- Update composer.lock. [#46686]
- Update design of the sidebar upsell. [#47909]
- Update package dependencies. [#46785] [#47021] [#47505]

### Removed
- General: Update minimum WordPress version to 6.8. [#46801]

### Fixed
- Admin Page: Restore border on header component. [#47425]

## [3.7.1] - 2025-11-20
### Fixed
- Jetpack: Remove getIconColor functions for block icons. [#45992]
- My Jetpack: Fix expiring renewal prompt to show all products. [#45995]

## [3.6] - 2025-11-12
### Added
- Tested up to WordPress 6.9. [#45571]

### Changed
- Update package dependencies. [#45478]

### Fixed
- My Jetpack page: Fix visual compatibility issue with Hello Dolly plugin. [#45474]

## [3.5] - 2025-09-08
### Added
- My Jetpack: Add analytics for empty product search results. [#44344]

### Changed
- Remove CRM installation nudge for Complete plan users. [#45026]
- My Jetpack: Enable access to My Jetpack on WP Multisite. [#44260]
- My Jetpack: Fix multisite availability check for restricted products and modules. [#44710]
- My Jetpack: Unify the user connection flow with a unified screen. [#44469]
- My Jetpack: Update Stats card to include a chart for better analytics. [#43870]
- Sync: Ignore the ActivityPub Outbox CPT. [#44222]
- Update package dependencies. [#44206] [#44725] [#45096]

### Fixed
- JITM: Fix ineffective caching due to expired plugin sync transient/ [#44117]
- My Jetpack: Fix footer alignment for disconnected accounts. [#44468]
- My Jetpack: Prevent expiration alerts for products covered by active bundles. [#44586]
- My Jetpack: Restore plan purchase link. [#44535]
- JITM: Remove jQuery dependency. [#43783]

## [3.4] - 2025-06-27
### Changed
- Internal updates.

## [3.3] - 2025-06-09
### Added
- Add more error logging. [#42959]
- Add My Jetpack tour. [#42880]

### Changed
- My Jetpack: Hide backup failure notice when backups are deactivated. [#43568]
- My Jetpack: Optimize the images for onboarding slider for faster page load. [#43473]
- My Jetpack: Update the onboarding UI, changing it to a single button. [#43203]
- Update package dependencies. [#43085] [#43425] [#43839]

### Removed
- General: Update minimum WordPress version to 6.7. [#43192]

### Fixed
- Block editor: Fix layout issues with the Media Library modal buttons. [#43035]
- My Jetpack: Fix Onboarding UI responsiveness at 600px. [#43533]
- My Jetpack: Fix readability of license activation button on hover. [#43550]
- My Jetpack: Ensure social login does not get stuck when email input is not empty. [#43158]

## [3.2] - 2025-04-03
### Added
- Add Account Protection initialization. [#40925]
- Components: Export the getRedirectUrl function with subpath. [#41078]
- Connection: Disconnect all other users before disconnecting connection owner account. [#41923]
- Improve the onboarding experience of Jetpack guiding the users through a new onboarding process. [#42757]
- My Jetpack: Introduce a new onboarding screen to provide clear, step-by-step instructions for new users connecting to Jetpack. [#42523]

### Changed
- Code: Use function-style `exit()` and `die()` with a default status code of 0. [#41167]
- Connection: Allow pre-selected login providers. [#42662]
- Connection: Display connection status on Users page independent of the SSO module. [#41794]
- General: Indicate compatibility with WordPress 6.8. [#42701]
- Update composer.lock [#40863]
- Update package dependencies. [#40980] [#41659] [#42180] [#42815]
- Update the unowned section from a product grid to a product list [#41312]

### Fixed
- Admin menu: Move backup admin menu addition to a function hooked into admin_menu, preventing PHP warnings. [#42396]

## [3.1] - 2025-01-10
### Changed
- Resolve an issue where revoked licenses were incorrectly treated as unattached. This caused users to be redirected to the license activation page after site connection, even when unattached licenses were not valid for activation. [#40215]
- Social: Change My Jetpack CTA for Social from "Learn more" to "Activate". [#40359]
- Update backup plugin screenshots [#40386]
- Updated dependencies. [#40286]
- Updated package dependencies. [#40515]

## [3.0] - 2024-11-14
### Added
- Display next scheduled daily backup time on the admin page.

### Changed
- Exclude discarded backups from being counted as successful on the admin page.
- General: Indicate compatibility with WordPress version 6.7.
- Updated package dependencies.
- Various internal updates and improvements.

### Fixed
- Resolved an issue on the pricing page where the loading placeholder remained visible after the price loaded.

## [2.9] - 2024-09-06
### Changed
- Internal updates.

## [2.8] - 2024-09-05
### Changed
- General: Update WordPress version requirements to WordPress 6.5. [#38382]
- Docs: Update README to include on-demand backups reference. [#38960]

## [2.7] - 2024-06-27
### Added
- On-demand backups feature

### Changed
- General: indicate compatibility with the upcoming version of WordPress - 6.6. [#37962]
- Remove the explicit Plugin Install package dependency. [#37430]
- Updated package dependencies. [#37348] [#37767]
- Updated backup header layout for responsive design

## [2.6] - 2024-05-09
### Added
- Add Woocommerce event remove_order_items to Jetpack Sync [#33748]
- Real time backups: Add endpoints orders to be used in real-time backups jetpack [#35649]
- Trigger red bubble notification when bad install is detected [#36449]

### Changed
- Add a LoadingPlaceholder while waiting for Jetpack Backup price

### Fixed
- Backup: change some error messages to not trigger security scanners [#36496]

## [2.5] - 2024-02-08
### Changed
- Updated package dependencies. [#34882]

### Fixed
- Write helper script to ABSPATH by default, just like we did before [#35508]

## [2.4] - 2024-01-04
### Fixed
- Backup: Add namespace versioning to Helper_Script_Manager and other classes [#34739]

## [2.3] - 2023-12-13
### Changed
- General: indicate full compatibility with the latest version of WordPress, 6.4. [#33776]
- General: updated PHP requirement to PHP 7.0+ [#34126]
- General: update WordPress version requirements to WordPress 6.3. [#34127]
- Updated package dependencies. [#33498]
- Update lockfile [#33607]

### Fixed
- Improved helper script installer logging. [#34297]

## [2.2] - 2023-09-20
### Changed
- General: update WordPress version requirements to WordPress 6.2. [#32762]
- Updated package dependencies. [#32966]

## [2.1] - 2023-08-23
### Changed
- Updated package dependencies. [#32307]

## [2.0] - 2023-08-01
### Changed
- General: indicate full compatibility with the latest version of WordPress, 6.3. [#31910]
- Updated package dependencies. [#31769]

## [1.9] - 2023-07-05
### Added
- Add authentication to Zendesk chat widget. [#31339]
- Add video section to Backup connect page. [#31260]

### Changed
- Update connection module to have an RNA option that updates the design. [#31201]
- Updated package dependencies. [#31308]

## [1.8] - 2023-06-06
### Changed
- General: update link references to releases in changelog. [#30634]
- Updated package dependencies. [#30493]

## 1.7 - 2023-05-02
### Changed
- Updated package dependencies. [#29565]
- Update WordPress version requirements. Now requires version 6.1. [#30120]

## 1.6 - 2023-04-04
### Changed
- General: indicate full compatibility with the latest version of WordPress, 6.2. [#29341]
- Updated package dependencies. [#29434]

## 1.5 - 2023-03-07
### Changed
- Backup: Update description headline, add video [#28890]
- Updated package dependencies. [#28910]

### Fixed
- Fixes the plugin's versioning so it actually uses WordPress versioning [#29133]

## 1.4.4 - 2023-02-07
### Changed
- Updated package dependencies. [#28218]

## 1.4.3 - 2023-01-10
### Changed
- Updated Backup logo. [#27802]
- Updated package dependencies. [#27688, #27874]

## 1.4.2 - 2022-12-06
### Changed
- Add real-time backups details in plugin FAQs [#27470]
- Compatibility: WordPress 6.1 compatibility [#27084]
- Rename plugin name to Jetpack VaultPress Backup [#27411] [#27432]
- Updated package dependencies. [#26072]

### Removed
- Remove connection-ui package dependency [#26381]

## 1.4.1 - 2022-09-08
### Added
- Include contextual notifications from My Jetpack [#22452]

### Changed
- Plugin activation: Only redirect when activating from the Plugins page in the browser

### Other changes <!-- Non-user-facing changes go here. This section will not be copied to readme.txt. -->
- Updated package dependencies. [#24929] [#24998] [#25048] [#25158] [#25279] [#25315] [#25406] [#25713] [#25945]

## 1.4.0 - 2022-06-28
### Added
- Added Social card to My Jetpack.

### Changed
- Renamed main branch `master` references to `trunk`
- Updated package dependencies.

## 1.3.0 - 2022-05-19
### Changed
- Now requires WordPress 5.9 since WordPress 6.0 is just around the corner.
- Updated package dependencies

### Fixed
- Fixed progress state in admin page to use real site title.

## 1.2.0 - 2022-02-28
### Added
- Added My Jetpack.
- Smarter connection handling when disconnecting.

### Changed
- Updated: Upgraded from Jetpack Sync 1.28 to 1.29
- Updated package dependencies.

### Fixed
- Backup: Update spacing for all containers.
- Fixed various JavaScript warnings.

## 1.1.0 - 2022-01-26
### Added
- Added My Jetpack page work in progress behind a feature flag.
- Added pricing information to Jetpack Connection screen.
- Pass connected plugin information to disconnect dialog flow, include analytics scripts.
- Redirect to Jetpack Backup plugin page when the plugin is activated.
- Use monorepo `validate-es` script to validate Webpack builds.

### Changed
- Change initial screen for first backup.
- Detect when a backup will retry and update error screen content.
- Import RNA styles from base styles package.
- Make Admin UI consume layout components.
- The Admin page now promotes the new real-time Backup products.
- Updated content shown on backup segments section.
- Updated Jetpack Primary color to match latest brand book.
- Updated upgrade button link target to point to checkout.
- Use `Assets::register_script()` to load Webpack-built script.

### Removed
- Remove use of deprecated `~` in sass-loader imports.
- Remove use of `gulp` in build, all it was doing was wrapping `webpack`.

### Fixed
- Removed backup-in-progress animation on small viewports
- Use `@automattic/babel-plugin-replace-textdomain` to ensure proper textdomains in JS bundles.

## 1.0.1 - 2021-11-22
### Removed
- Remove the Connection UI activation.

### Fixed
- Fix a bug that prevented the IDC UI from displaying when the site is in an identity crisis.

## 1.0.0 - 2021-10-13
### Added
- Added link to the plugins list table for "Settings" to match other Jetpack plugins.
- Plugin now disconnects Jetpack on deactivation if it's the last plugin using the connection.
- Updated Backup plugin readme text and remove dummy tag.
- Updated readme.md installation instructions.
- Updated plugin menu structure.

### Changed
- Changed menu label.
- Updated package dependencies.
- Updated styles for buttons in backup panel and spacing for sections below.

### Fixed
- Adjust dashboard styling.

## 0.2.0 - 2021-08-18
### Added
- Added Backup UI, placeholders, and supporting end points.
- Added design for No Backup Capabilities view. Removed unused CSS. Minor styling fixes.
- Added Jetpack header and footer
- Added UI options to manage your Jetpack connection

### Changed
- Changed backup storage and heartbeat info blocks to only display with a backup plan
- Updated all external links to use jetpack redirect service
- Updated Jetpack Backup menu item title and icon

### Fixed
- Added a state to display before a first backup starts
- Fix minor styling issue for the "no plan" page.

## 0.1.0-beta - 2021-06-15
### Added
- Added RNA connection to the plugin.
- Initial wire frame for the Jetpack Backup plugin.

### Changed
- Changes associated with plugin release process.
- Updated package dependencies.
- Update RNA Connection usage based on Automattic/jetpack/pull/19837.
- Utilize the config package for sync and connection.

### Fixed
- Use `absoluteRuntime` in babel JS build to avoid module not found errors.

[2.2-beta]: https://github.com/Automattic/jetpack-backup-plugin/compare/2.1...2.2-beta
[4.0]: https://github.com/Automattic/jetpack-backup-plugin/compare/3.9...4.0
[3.9]: https://github.com/Automattic/jetpack-backup-plugin/compare/3.8...3.9
[3.8]: https://github.com/Automattic/jetpack-backup-plugin/compare/3.7.1...3.8
[3.7.1]: https://github.com/Automattic/jetpack-backup-plugin/compare/3.6...3.7.1
[3.6]: https://github.com/Automattic/jetpack-backup-plugin/compare/3.5...3.6
[3.5]: https://github.com/Automattic/jetpack-backup-plugin/compare/3.4...3.5
[3.4]: https://github.com/Automattic/jetpack-backup-plugin/compare/3.3...3.4
[3.3]: https://github.com/Automattic/jetpack-backup-plugin/compare/3.2...3.3
[3.2]: https://github.com/Automattic/jetpack-backup-plugin/compare/3.1...3.2
[3.1]: https://github.com/Automattic/jetpack-backup-plugin/compare/3.0...3.1
[3.0]: https://github.com/Automattic/jetpack-backup-plugin/compare/2.9...3.0
[2.9]: https://github.com/Automattic/jetpack-backup-plugin/compare/2.8...2.9
[2.8]: https://github.com/Automattic/jetpack-backup-plugin/compare/2.7...2.8
[2.7]: https://github.com/Automattic/jetpack-backup-plugin/compare/2.6...2.7
[2.6]: https://github.com/Automattic/jetpack-backup-plugin/compare/2.5...2.6
[2.5]: https://github.com/Automattic/jetpack-backup-plugin/compare/2.4...2.5
[2.4]: https://github.com/Automattic/jetpack-backup-plugin/compare/2.3...2.4
[2.3]: https://github.com/Automattic/jetpack-backup-plugin/compare/2.2...2.3
[2.2]: https://github.com/Automattic/jetpack-backup-plugin/compare/2.2-beta...2.2
[2.1]: https://github.com/Automattic/jetpack-backup-plugin/compare/2.0...2.1
[2.0]: https://github.com/Automattic/jetpack-backup-plugin/compare/1.9...2.0
[1.9]: https://github.com/Automattic/jetpack-backup-plugin/compare/1.8...1.9-beta
[1.8]: https://github.com/Automattic/jetpack-backup-plugin/compare/1.7...1.8
