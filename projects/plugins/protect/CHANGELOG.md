# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 7.0.0 - 2026-11-16
### Added
- Connection: Add a Connected view to the Users page listing users with a linked WordPress.com account. [#53150]
- Connection: Note that moving a Jetpack plan is an additional step when transferring connection ownership, and link to the support doc on transferring a plan. [#54527]
- Connection: Show connection errors on the Connectors card, and keep showing the connection owner when their account connection breaks. [#53596]
- Connection: Surface SSL certificate verification failures reported by WordPress.com as a connection error notice. [#52035]
- Connection: Transfer connection ownership to another administrator without leaving your site. [#53359]
- Connection: Transfer connection ownership to another connected administrator from the Connectors page. [#53581]
- My Jetpack: Add an Available filter to the Features list. [#53308]
- My Jetpack: Add catalog-controlled Pro offers and preserve existing plan management. [#53421]
- My Jetpack: Allow the Automattic for Agencies banner to be dismissed. [#51441]
- My Jetpack: Recognize Jetpack Pro subscriptions and licenses. [#53424]
- Site Health: Add Jetpack connection details to the Info tab and the copied site info report. [#54269]

### Changed
- Account Protection: Improve login verification. [#53240]
- Account Protection: Stop turning the feature on automatically when Protect is activated. Sites where it is already on keep it on. [#52715]
- Account Protection: Update the breached password notice so it no longer says the feature was activated automatically. [#52993]
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
- Connection screen: Show the terms of service line under the pricing table at the WordPress design system's text size. [#53892]
- Dashboard: Keep focus on information icons when their tooltips open, announce the content to screen readers, and show a focus ring after clicking them. [#52736]
- Firewall: Explain to a visitor blocked by the IP block list what happened and that site managers can log in for more information. [#54124]
- General: Update minimum WordPress version to 7.0. [#51370]
- Hide the Protect sidebar item when Protect is not active. [#52156]
- Hide the threat count from the admin menu and admin bar when the host turns off threat notifications. [#53983]
- My Jetpack: answer module switch clicks immediately, and explain what happened when a change fails. [#52494]
- My Jetpack: Connect a WordPress.com account from feature cards that need one. Show feature states through switches or buttons instead of redundant Active or Inactive badges, and show host restrictions below descriptions. Leave features out of Available when their only action is an install you cannot make. [#53990]
- My Jetpack: Highlight expiring and expired plans in the account panel under your avatar, list them first with a renew link, and show other plans as active until their renewal date. [#54781]
- My Jetpack: Leave the recommendation to install or activate plugins included in a bundle plan out of the Jetpack menu notification badge. [#54355]
- My Jetpack: Line up notices with the cards below them, and drop the grey background behind the Features grid and list buttons. [#53759]
- My Jetpack: On sites with Jetpack Pro, replace "Purchase a plan" with "Upgrade to Complete", which goes straight to checkout. [#54862]
- My Jetpack: On the Features tab, keep a plugin's switch busy until its card is up to date after a failed change, or after any change on sites that also run Jetpack. [#54156]
- My Jetpack: Open Protect instead of Jetpack Cloud to manage Scan. [#53566]
- My Jetpack: Open supported Modules links in Features when Jetpack is active. [#53992]
- My Jetpack: Open the Jetpack Connection details on the Connectors screen from the header's Manage connection link. [#54276]
- My Jetpack: Refresh Pro availability while preserving existing offers. [#53425]
- My Jetpack: Remember whether you last picked the grid or the list layout on the Features tab, and open the tab in that layout next time. [#54925]
- My Jetpack: Restyle dashboard notices to match the WordPress design system. [#52290]
- My Jetpack: Return to the license screen after you connect your account from "Activate a license", and show the WordPress.com connection screen made for your site's plugins. [#54697]
- My Jetpack: Return to the page you were on after you connect your account or restore the connection from the header, and show the WordPress.com connection screen made for your site's plugins. [#54748]
- My Jetpack: Show a Features tab in place of the Products tab. [#52785]
- My Jetpack: Show product cards flat, without a drop shadow. [#52988]
- My Jetpack: Show the avatar and connection status control in the header by default, with access to connection and plan details. [#54225]
- My Jetpack: Show the dashboard in the new rounded admin page frame. [#52446]
- My Jetpack: Show the Features page on sites in Offline Mode, without connecting to WordPress.com. [#54216]
- My Jetpack: Show the Jetpack menu notification badge when a connection error is detected. [#52332]
- My Jetpack: Show the WordPress.com connection screen made for your site's plugins when you connect your account from the Features tab. [#54867]
- My Jetpack: Show what Paid Stats actually adds — UTM tracking, device stats, and region & city locations — instead of commercial use. [#51410]
- My Jetpack: Stop asking to connect a WordPress.com account when nothing in use needs one. [#53242]
- My Jetpack: Turn a module on once Install Jetpack or Activate Jetpack on its card finishes setup. [#54007]
- Notices: Restyle to match the WordPress design system. [#52160]
- Replace the Protect dashboard with the new one shared with the Jetpack plugin, including Downtime Monitor and WordPress.com login settings. If those were on with a Jetpack plugin you have since removed, they stay off until you turn them on from the Protect page. [#53685]
- Scan: Say the vulnerability check is off, on the Scan page and in Site Health, instead of reporting no vulnerabilities when it is turned off in Jetpack. [#54600]
- Show the error when connecting from the pricing table fails in a notice above the table, so it no longer pushes the paid plan's button out of line. [#54218]
- Sidebar: sort Jetpack menu items alphabetically, pinning My Jetpack to the top and external links and Settings to the bottom. [#52003]
- Tested up to WordPress 7.1. [#51370]
- Update dependencies. [#51259]
- Update package dependencies. [#51303] [#51399] [#51701] [#51802] [#52028] [#52187] [#52200] [#52955] [#52999] [#53004] [#53448] [#53869] [#54117] [#54118] [#54391] [#54512] [#54557] [#54666] [#54703] [#54706]
- Update the recommended Jetpack bundles in the plugin description. [#53978]
- Use "Login protection" and "Firewall" as feature names, including in firewall notices, and say "Jetpack" rather than "Jetpack Scan" for what fixing a threat does. [#54592]

### Removed
- Updated PHP version requirements to PHP 7.4 or newer. [#51515]

### Fixed
- Activity Log: Continue the wp-admin menu color behind the page frame on WordPress.com and third-party admin color schemes. [#51619]
- Activity Log: Fix the page overlapping the admin menu in right-to-left languages. [#51963]
- Activity Log: honor the module setting, so the page can be turned off. [#52409]
- Activity Log: Show an empty date picker on the free plan, instead of a date range it does not apply. [#53982]
- Activity Log: Stop the frame from flashing while loading and when switching admin pages. [#52235]
- Admin bar: Match the threat count shield icon's size to the other toolbar icons. [#54221]
- Admin dashboards: Keep the page header and content in view when the wp-admin menu is taller than the window. [#51696]
- Brute Force Protection: Allow the feature to turn on when the configured trusted IP header is empty or holds no valid address. [#54649]
- Brute Force Protection: Fix correct logins being rejected after the math challenge, and keep the username and login destination when the password must be entered again. [#50681]
- Brute Force Protection: Let new users set their password from a blocked IP, and stop sending recovery emails to accounts that have not set one yet. [#53323]
- Charts: draw labels at the design system's font weight and size. [#51452]
- Close information tooltips opened on hover when Escape is pressed, wherever focus is. [#52799]
- Connection: Fix a stale connection error notice that could persist on healthy sites. [#52264]
- Connection: Fix reconnecting your WordPress.com account so it no longer disconnects other users and clears the broken-connection notice on the first attempt. [#52851]
- Connection: Fix the connect button staying busy after the connection to WordPress.com fails to start. [#54613]
- Connection: Hide connection error notices from users who cannot fix the connection. [#52049]
- Connection: Keep the progress indicator on screen after clicking Restore Connection until the redirect to WordPress.com. [#54744]
- Connection: Let a second administrator fix a broken connection owner by connecting their own account, which makes them the new owner. [#54469]
- Connection: Let users without admin access reconnect their own broken account from the connection error notice. [#52718]
- Connection: Report a broken connection on My Jetpack's connection card instead of claiming everything looks good, and show a break only the connection owner can repair as a warning, not an error, to everyone else. [#52130]
- Connection: Show connection owner names containing characters like & correctly. [#54197]
- Connection: Stop showing a connection error notice for a request signature mismatch, which reconnecting rarely fixes. [#54469]
- Connection: Stop showing a duplicate account notice when your WordPress.com email differs from your site email only in letter case. [#51285]
- Connection: Stop Site Health from showing spurious connection failures — remove the redundant outbound HTTP/HTTPS checks, and no longer prompt a reconnect when the WordPress.com connection test is inconclusive. [#52916]
- Connection: Stop users who cannot set up the site connection from becoming the connection owner when the owner's connection is missing. [#52880]
- Connection: Translate the Connectors card's text on sites that don't use English. [#53179]
- Connection: Update wording for some connection error notices. [#51360]
- Dashboard: Open information tooltips with the keyboard and dismiss them with Escape. [#52661]
- Firewall: Avoid a 500 error for visitors on the IP block list when the firewall runs before WordPress. [#52682]
- Firewall: Fix blank Jetpack admin pages when the standalone mode bootstrap loads from an older copy of the plugin. [#52539]
- Firewall: Show up-to-date blocked request counts on sites with a persistent object cache. [#53193]
- Firewall and Account protection: Fix turning a feature on or off doing the opposite when the page was out of date. [#53317]
- Footer: Hide Products and Help links when My Jetpack is unavailable. [#52557]
- Footer: Show the Features link to administrators only. [#54541]
- JITM: Fix missing messages and a console error on sites without the Jetpack plugin active. [#51733]
- Keep admin icons colored after the @wordpress/icons 16 update, which draws them as strokes. [#52187]
- My Jetpack: always label the license activation link 'Activate a license'. It previously read 'Activate a new license' on sites with a plan, even when no licenses had been activated. [#51283]
- My Jetpack: Ask for a user connection on the Overview connection card as soon as a plugin that needs one is switched on, without a reload. [#53356]
- My Jetpack: Bring the first Features results into view after changing the filter or search while scrolled down. [#54201]
- My Jetpack: Fill checked checkboxes in the Features list with the selected filter's color, show their focus ring only for keyboard focus, and show one focus ring per control instead of two. [#54608]
- My Jetpack: Fix overlapping and misaligned stats on the Protect card. [#52988]
- My Jetpack: Fix the dashboard failing to load on WordPress.com-hosted sites. [#52362]
- My Jetpack: Fix the layout of the connection screen for right-to-left languages. [#52749]
- My Jetpack: Fix the Overview showing a product's old status after a feature is switched on or off on the Features tab. [#54311]
- My Jetpack: Fix the Security and Growth filters on the Features tab showing no features. [#54496]
- My Jetpack: Hide other plugins' notices while the setup screen is open, and stop the full-screen layout breaking when another plugin adds an admin body class first. [#52765]
- My Jetpack: Keep the Automattic for Agencies banner hidden after dismissing it and switching tabs. [#51441]
- My Jetpack: Keep the Help tab's cards inside their column on narrow screens. [#53847]
- My Jetpack: Keep the Jetpack Pro card on the upgrade screen inside its column and on phone screens. [#54841]
- My Jetpack: keep the stats chart tooltip under sticky and fixed page elements. [#51640]
- My Jetpack: Make the connection screen's Connect button and footer links reachable on shorter screens. [#53402]
- My Jetpack: Point users who cannot connect the site at an administrator, instead of an onboarding screen they cannot complete. [#52614]
- My Jetpack: Return to the tab you came from with the back link on product upgrade screens. [#54101]
- My Jetpack: Show a lapsed Scan purchase as Expired, with a link to resume it and an expired-plan notice, instead of offering an upgrade. [#54698]
- My Jetpack: Show each notice once instead of twice. [#52494]
- My Jetpack: Show the correct product status and use the active plugin copy when turning products on or off with both stable and Beta or development copies installed. [#53994]
- My Jetpack: Show the firewall as on in the Protect card whenever it is running. [#54055]
- My Jetpack: Show the highest-priority notice first when several are set at once. [#53400]
- My Jetpack: Show the right product status as soon as fresher plan data is available, instead of reusing an earlier lookup. [#52009]
- My Jetpack: Stop asking for a user connection on the Overview connection card as soon as the plugin that needed one is switched off, without a reload. [#53367]
- My Jetpack: Stop offering retired Security and Growth plans while preserving existing subscriptions. [#53854]
- My Jetpack: Stop repeating the partner lookup request on every page load. [#51441]
- My Jetpack: Stop reporting an error when switching VideoPress off while the Jetpack plugin is inactive. [#53371]
- My Jetpack: Stop showing $0 and NaN for paid plans on the Protect upgrade page, and $0.00 on recommendation cards, when prices cannot be loaded. [#54458]
- My Jetpack: Stop showing an empty account avatar on the Overview connection card on sites without a connection owner when nothing in use needs a user connection. [#53287]
- My Jetpack: Stop showing an empty account avatar on the Overview connection card when nothing in use needs a user connection. [#53247]
- My Jetpack: Stop the Stats dashboard from asking which plan you want again after Start for Free was already chosen. [#51413]
- My Jetpack: stretch the tab content background to the full height of the page. [#52633]
- Notices: Announce errors to screen readers. [#52167]
- Recognize Jetpack Pro licenses when connecting. [#54413]
- Scan: Offer a first scan when none has run, show when the last scan didn't complete or hasn't run yet on the My Jetpack Protect card, and stop counting a vulnerability once its plugin or theme is updated to the fixed version. Firewall: Honor CIDR ranges on the trusted IP addresses list, and make `wp jetpack-waf teardown` and `wp jetpack-waf setup` turn the Firewall off and on. [#54570]
- Scan: On WordPress.com, show Personal and Premium sites the vulnerability report and the Scan upgrade, since their plans don't include Scan. [#54071]
- Scan: Say when the last scan didn't complete, or the latest results couldn't load, on the Scan page and in Site Health, instead of reporting no threats. [#54601]
- Scan: Sort threats with no severity just above Low, and stop labeling them Low. [#54596]
- Scan: Stop showing a stray "0" when the scan status can't load. [#54604]
- Show Jetpack in-dashboard messages under the tabs, on every tab. [#52641]
- Show why connecting the site failed under the "Start for free" button. [#53289]
- Status: Detect a site served on any 127.0.0.0/8 loopback address, or on 0.0.0.0, as a local site. [#51311]
- Stop the upgrade and details screens from briefly offering Jetpack Security before Jetpack Pro. [#54839]
- Update the admin bar threat count when threats are fixed, ignored, or a new scan finds none. [#54302]

## 6.1.0 - 2026-08-12
### Added
- Add the Activity Log page to wp-admin, so it is available without the Jetpack plugin installed. [#51157]

## 6.0.0 - 2026-08-11
### Added
- Account Protection: Add additional context to "Verify your identity" page to reduce user confusion. [#50338]

### Changed
- Unify layout of Jetpack admin pages. [#48109]
- Components: Use Link from `@wordpress/ui` instead of ExternalLink. [#48529]
- Firewall: Add accessible names to the Brute force protection, Block IP addresses, and Trusted IP addresses toggles. [#48277]
- General: Update minimum WordPress version to 6.9. [#49021]
- Internal: Migrate Notice usages to @wordpress/ui. [#48173]
- Internal: No longer require automattic/jetpack-changelogger as a per-project dev dependency. [#48225]
- Components: Migrate `ToggleControl` to @wordpress/components [#49694]
- Protect: Normalize page tabs onto shared minimal variant. Bump @wordpress/ui to 0.13.0. [#48964]
- Protect: Migrate Status indicator to @wordpress/ui Text. [#48711]
- Protect: Remove translation wrappers from the "Protect" product name. [#48520]
- Protect now reports its threat count to the central menu-badges registry instead of writing admin-menu markup directly. [#50190]
- Remove Jetpack color overrides on core WordPress components. [#47317]
- Replace deprecated jetpack-components Spinner with WordPress Core Spinner. [#47451]
- Replace Gridicon with Icon and named icon exports from `@wordpress/icons`. [#48537]
- Replace internal ContextualUpgradeTrigger upgrade prompts with @wordpress/ui Notice composition. Internal refactor with a Notice-style visual refresh. [#48909]
- Tested up to WordPress 7.0. [#48114]
- Update composer.lock files. [#49415]
- Update package dependencies. [#47907] [#48064] [#48106] [#48141] [#48404] [#48405] [#48683] [#48735] [#49218] [#49272] [#49273] [#49379] [#49448] [#49492] [#49631] [#49638] [#49691] [#49757] [#49831] [#50097] [#50183] [#50436] [#50509] [#50510] [#50529] [#50582] [#50751] [#50753] [#50792] [#51008] [#51125]
- Update WPDS design tokens to the @wordpress/theme 0.16/0.17 names. [#49272]

### Fixed
- Firewall: Fix "Enable Firewall" notice CTA missing loading/disabled state, which let users double-click and toggle the WAF back off. [#48389]
- Firewall: Show 0 instead of NaN on the stat cards when there are no blocked requests. [#49282]
- Fix fatal error on My Jetpack when the current stable Jetpack plugin is active. [#49994]
- Protect: Fix route changes in Chrome when scroll APIs return promises. [#50465]
- Switch to wp/ui Text for wrapping account protection settings [#49367]

## 5.0.0 - 2026-04-11
### Security
- WAF: Fix issue that potentially allowed bypassing WAF rules. [#47692]

### Added
- Add `jetpack_account_protection_send_auth_email` filter to allow custom handling of the verification email. [#48003]
- Add Jetpack Protect details page for users without the dedicated Jetpack Protect plugin. [#46630]
- IDC: Add revalidation for IDCs. [#46268]

### Changed
- Dependencies: Update lock file to keep root requirements in sync. [#47418]
- Migrate admin page header to use unified header pattern. [#47313]
- My Jetpack: Check red bubble notification async when cache is not available. [#46396]
- Remove translated product names from admin page headers and footers. [#47313]
- Replace license activation link with a "Use license key" button in the header actions area. [#47434]
- Switch to Native TypeScript compiler based on Go. [#47375]
- Update composer.lock. [#46686]
- Update dependencies. [#47472]
- Update design of the sidebar upsell. [#47909]
- Update package dependencies. [#46143] [#46430] [#46456] [#46512] [#46552] [#46647] [#46785] [#46854] [#47002] [#47021] [#47099] [#47173] [#47285] [#47300] [#47371] [#47496] [#47505] [#47684] [#47825] [#47890] [#47998]

### Removed
- General: Update minimum WordPress version to 6.8. [#46801]

### Fixed
- Admin Page: Restore border on header component. [#47425]
- Constrain license activation link width on mobile to prevent header overflow. [#47431]
- Ensure proper flags are used with `json_encode()`. [#46117]
- Fix TypeScript errors detected by tsgo. [#47409] [#47419]

## 4.4.1 - 2025-11-21
### Added
- Tested up to WordPress 6.9. [#45571]

### Changed
- Replace icons removed from @wordpress/icons with alternatives. [#45760]
- Update dependencies. [#45488]
- Update package dependencies. [#45478] [#45652] [#45676] [#45737] [#45756] [#45915] [#45932]

### Fixed
- Jetpack: remove getIconColor functions for block icons [#45992]
- My Jetpack: Fix expiring renewal prompt to show all products [#45995]
- My Jetpack page: fix visual compatibility issue with Hello Dolly plugin. [#45474]

## 4.4.0 - 2025-10-10
### Added
- Add typecheck script. [#44787]
- Add typecheck support for E2E tests. [#44788]

### Changed
- My Jetpack: Fix multisite availability check for restricted products and modules. [#44710]
- My Jetpack: Unify the user connection flow with a unified screen. [#44469]
- Remove CRM installation nudge for Complete plan users. [#45026]
- Update package dependencies. [#44677] [#44701] [#44725] [#45027] [#45096] [#45097] [#45173] [#45200] [#45229] [#45298] [#45299] [#45334] [#45335]

### Fixed
- I18n: Improve context hints in comments for translators. [#44686]
- My Jetpack: Prevent expiration alerts for products covered by active bundles. [#44586]

## 4.3.0 - 2025-07-30
### Added
- Add UI confirmation via text box when deleting an extension via delete-fixer so that the user is fully aware that it may break their site. [#44521]
- My Jetpack: Add analytics for empty product search results. [#44344]

### Changed
- E2E tests: remove redundant logic in test fixture and converted the fixture to Typscript [#44327]
- Improve performance of wpcom comments liking by caching and minimizing API requests. [#44205]
- My Jetpack: Enabled access to My Jetpack on WP Multisite. [#44260]
- Sync: Ignore the ActivityPub Outbox CPT. [#44222]
- Update package dependencies. [#44206]

### Fixed
- My Jetpack: Fix footer alignment for disconnected accounts. [#44468]
- My Jetpack: Restore plan purchase link. [#44535]
- Update JITMs to remove jQuery dependency. [#43783]

## 4.2.0 - 2025-07-03
### Added
- WAF: Add account recovery flow for blocklisted IP addresses. [#43051]

### Changed
- My Jetpack: Update Stats card to include a chart for better analytics. [#43870]
- Update package dependencies. [#44151]

### Removed
- Remove the need to add FTP/SSH credentials to run auto threat fixers. [#43935]

### Fixed
- JITM: Fix ineffective caching due to expired plugin sync transient. [#44117]
- My Jetpack: Use compact number notation in the Protect card. [#43977]
- WAF: Fix PHP warnings for Brute_Force_Protection->get_local_host(). [#44170]

## 4.1.0 - 2025-06-05
### Added
- Scanner: Add functionality to correctly display database threats in the Protect UI. [#43663]
- Account Protection: Add the Account Protection module toggle. [#40925]
- My Jetpack: Add user tour. [#42880]
- My Jetpack: Improve the onboarding experience of Jetpack guiding the users through a new onboarding process. [#42757]

### Changed
- Connection: Allow pre-selected login providers. [#42662]
- General: Indicate compatibility with WordPress 6.8. [#42701]
- My Jetpack: Optimize the images for onboarding slider for faster page load. [#43473]
- My Jetpack: Update the onboarding UI, changing it to a single button. [#43203]
- General: Update package dependencies. [#43766]

### Removed
- General: Update minimum WordPress version to 6.7. [#43192]

### Fixed
- JS Packages: Decrease CSS priority of global styles to prevent them from applying within the editor. [#43035]
- My Jetpack: Fix Onboarding UI responsiveness at 600px. [#43533]
- My Jetpack: Fix readability of license activation button on hover. [#43550]
- My Jetpack: Prevent social login from getting stuck when email input is not empty. [#43158]
- Readme: Clarify language in the plugin readme regarding malware and vulnerability scanning. [#43775]

## 4.0.0 - 2025-03-24
### Changed
- Scanner: Add threat count to tab. [#40056]
- Scanner: Animate the "scan in progress" placeholder image. [#39825]
- General: Indicate compatibility with WordPress 6.7. [#39786]
- General: Update package dependencies. [#42511]

### Removed
- Firewall: Remove "new" badge from tab. [#41902]
- General: Update minimum PHP version to 7.2. [#40147]
- General: Update minimum WordPress version to 6.6. [#40146]

## 3.1.1 - 2024-10-17
### Changed
- Firewall: Fix backwards compatibility for sites running standalone mode with outdated packages autoloaded.

## 3.1.0 - 2024-10-15
### Added
- Firewall: Adds stat cards showing recent block counts [#35739]
- Auto-Fixers: Adds handling for long-running fixers [#39301]

### Changed
- Firewall: added help text for IP list formatting rules [#39448]
- Updated package dependencies. [#39707]

### Removed
- Security Scanning: disabled database threat category [#39467]

### Fixed
- Minor fixes and improvements.

## 3.0.2 - 2024-09-06
### Changed
- Internal updates.

## 3.0.1 - 2024-09-06
### Added
- Threats List: Add pagination. [#39058]

### Changed
- Admin menu: change order of Jetpack sub-menu items. [#39095]
- Updated package dependencies. [#39176]

### Fixed
- Security Scanning: Adds a background to the scan progress bar. [#38847]
- General: Delete relevant Protect options on deactivation. [#38815]
- Auto Fixers: Disable the unignore threats button when a fixer is in progress. [#38898]
- Security Scanning: Fix the threat fixed on date in the history view. [#39164]
- General: Improves the manual scan link button loading state. [#38897]

## 3.0.0-beta - 2024-08-09
### Added
- Firewall: add dedicated WAF allow and block list toggles [#38265]
- General: add "contact support" links [#38416]
- Security Scanning: add threats history view [#38117]

### Changed
- General: indicate compatibility with the upcoming version of WordPress - 6.6. [#37962]

### Removed
- General: update WordPress version requirements to WordPress 6.5. [#38382]

### Fixed
- Fix an issue where the connection error hook was always resetting the notice [#38120]
- Fix image optimization [#38573]
- Fix in-progress threat fixer loading indicator [#38051]
- Fix threat fix modal title [#38312]

## 2.2.0 - 2024-05-24
### Added
- Add data to WAF logs and a toggle for users to opt-in to share more data with us if needed. [#36377]
- Trigger a red bubble notification when a bad install is detected. [#36449]

### Changed
- Update WordPress minimum version requirement to WordPress 6.4. [#37047]
- Only show installation errors on the plugins page. [#36390]

### Fixed
- Jetpack Protect Footer: ensure that "Go to cloud" links are not shown when on a platform with no firewall support. [#36794]

## 2.1.0 - 2024-03-14
### Added
- Added onboarding flows. [#34649]
- Added firewall standalone mode indicator. [#34840]

### Changed
- General: indicate compatibility with the upcoming version of WordPress, 6.5. [#35820]
- Use blog ID instead of site slug in checkout links. [#35004]
- Updated package dependencies. [#36325]
- Updated package lockfile. [#35672]

### Fixed
- Prevent text orphans in the site scanning header. [#35935]

## 2.0.0 - 2024-01-18
### Changed
- Firewall: use datetime versioning for rules file updates. [#34698]
- General: unify display of notifications across Scan and Firewall screens [#34702]
- General: indicate full compatibility with the latest version of WordPress, 6.4. [#33776]
- General: update PHP requirement to PHP 7.0+ [#34126]
- General: update WordPress version requirements to WordPress 6.3. [#34127]
- General: update package dependencies. [#34882]
- General: update lockfile. [#33607]

### Fixed
- Fix Modal component overflow scrolling. [#34475]
- Fix Popover component styling. [#34424]
- Improved helper script installer logging. [#34297]

## 1.4.2 - 2023-10-19
### Changed
- General: update WordPress version requirements to WordPress 6.2. [#32762] [#32772]
- Updated Jetpack submenu sort order so individual features are alpha-sorted. [#32958]
- Updated method used to render Connection initial state. [#32499]
- Updated package dependencies. [#33692]

## 1.4.1 - 2023-07-18
### Changed
- Brute Force Protection: add access to feature in environments that otherwise do not support the WAF. [#31952]
- General: indicate full compatibility with the latest version of WordPress, 6.3. [#31910]
- Update WordPress version requirements. Now requires version 6.1. [#30120]
- Update package dependencies. [#31952]

### Fixed
- Scan: Fixed sorting of threats by severity. [#31124]
- License Activation: add filtering for unattached and unrevoked licenses within upgrade flow check. [#31086]

## 1.4.0 - 2023-05-05
### Added
- Add brute force protection. [#28401]

### Changed
- General: indicate full compatibility with the latest version of WordPress, 6.2. [#29341]
- Improve the firewall status heading to provide more information based on the current configuration. [#28401]
- Updated package dependencies. [#29480]

## 1.3.0 - 2023-03-13
### Added
- Add ability to toggle automatic and manual firewall rules independently. [#27726]
- Add improved messaging for currently enabled firewall features. [#27845]
- Disable Jetpack Firewall on unsupported environments. [#27939]
- Add link to pricing page for getting started with an existing plan or license key. [#27745]

### Changed
- Updated package dependencies. [#29297]
- Update to React 18. [#28710]
- Use `flex-start`/`flex-end` instead of `start`/`end` for better browser compatibility. [#28530]

### Fixed
- Fix connection button loading indicators. [#28514]
- Fix Protect status report caching. [#28766]
- Remove unnecessary full path from example in UI. [#29037]
- Other assorted fixes for minor bugs and grammar. [#27846] [#28091] [#28273] [#28397]

## 1.2.0 - 2023-01-16
### Added
- Add web application firewall (WAF) features [#27528]
- Add progress bar to site scannnig screen [#27171]

### Fixed
- Poll for scan status while scanner is provisioning [#28275]
- Bug fixes

## 1.1.2 - 2022-11-30
### Changed
- changed description and author [#27618]
- Updated package dependencies. [#27043]

## 1.1.1 - 2022-11-18
### Fixed
- Fix issue with plugin activation.

## 1.1.0 - 2022-11-17
### Added
- Add features for paid Jetpack Scan users, including file and database threats, on-demand scanning, and threat auto-fixers.

### Changed
- Compatibility: WordPress 6.1 compatibility

### Fixed
- Adjust alignment of spinner icon and loading text on the in-progress scan screen.

## 1.0.4 - 2022-08-29
### Fixed
- Fixed NaN error that prevented the pricing interstitial from rendering.

## 1.0.3 - 2022-08-26
### Added
- Added a default 'See all results' label to the mobile navigation button.
- Added a spinner to the in progress scan page in admin
- Added JITM functionality
- Added threat descriptions.
- My Jetpack includes JITMs

### Changed
- Add condition to check plugin activation context before redirecting

### Fixed
- Fixed alignment of long navigation item labels on mobile screen sizes.

## 1.0.2 - 2022-07-27
### Changed
- Updated package dependencies.

### Fixed
- Fix protect admin toolbar icon display when Jetpack enabled and connected
- Minor bug fix - added isset() checks for report data properties

## 1.0.1 - 2022-07-07
### Added
- Added two new FAQ entries
- Protect: record even just after the site is registered

### Changed
- Moved normalization of the Protect status report data to the server side.
- Renamed `master` references to `trunk`
- Reorder JS imports for `import/order` eslint rule.

### Fixed
- Fixed bug that would not display Core vulnerabilities.
- Removed legacy code and documentation and adds new docs for the debug helper plugin.
- Fixed recommendation for plugins that don't have a fix yet
- Protect: Fix visual issue of the Interstitial page

## 1.0.0 - 2022-05-31
### Added
- Add additional tracking events
- Add Alert icon to the error admin page
- Add checks to the Site Health page
- Add custom hook to handle viewport sizes via CSS
- Add error message when adding plugin fails
- Add first approach of Interstitial page
- Add Jetpack Scan to promotion section when site doesn't have Security bundle
- Add missing prop-types module dependency
- Add Navigation dropdown mode and use it for small/medium screens
- Add ProductOffer component
- Add product offer component
- Add title and redirect for vul at wpscan
- Add 'get themes' to synced callables in Protect
- Add installedThemes to the initial state
- Add notifications to the menu item and the admin bar
- Add status polling to the Protect admin page.
- Added details to the FAQ question on how Jetpack Protect is different from other Jetpack products.
- Added Jetpack Protect readme file for the plugin listing.
- Added option to display terms of service below product activation button.
- Added Social card to My Jetpack.
- Added the list of installed plugins to the initial state
- Change ConnectScreen by the Interstitial component
- Creates Status Class
- Empty state screen
- Expose and use IconsCard component
- Flush cache on plugin deactivation
- Footer component
- Handle error in the UI
- Hooks on plugin activation and deactivation
- Hook to read data from the initial state
- Implement Footer
- Implement Add Security bundle workflow
- Introduce Accordion component
- Introduce Navigation component
- Introduce Summary component
- Introduce VulnerabilitiesList component
- JS Components: Introduce Alert component. Add error to ProductOffer components
- More options to the testing api responses
- Record admin page-view and get security from footer events
- Render Security component with data provided by wpcom
- Request and expose to the client the Security bundle data
- Update logo

### Changed
- Add empty state for no vuls
- Add popover at Badge
- Cache empty statuses for a short period of time
- Changed connection screen to the one that does not require a product
- Changed the method used to disconnect
- Changed the wording for the initial screen.
- Change expiration time of plugin cache
- Clean connection data. Update to latest connection API
- Configure Sync to only what we need to sync
- Janitorial: require a more recent version of WordPress now that WP 6.0 is coming out.
- JS Components: Add subTitle prop to ProductOffer component
- JS Components: iterate over Dialog component
- Improve Dialog layout in medium viewport size
- Move VulnerabilitiesList to section hero
- New VulsList
- Redesign Summary component
- Re-implement "Your results will be ready soon" layout
- Re-implement Admin page by using Dialog component
- Remove use of `pnpx` in preparation for pnpm 7.0.
- Replace deprecated external-link variation by using isExternalLink prop
- Require only site level connection
- Truncate items at NavigationGroup
- Tweak footer
- Update Footer and VulsList for small/medium viewport
- Update Navigation to be external controlled
- Update Protect icon
- Update VulnerabilitiesList to remove severity and add fixed in
- Updated package dependencies.
- Update package.json metadata.
- Updates CTA wording to reduce confusion when user already has Jetpack Security Bundle which includes Jetpack Scan
- Update the Status when connection is established
- Use data provided by My Jetpack to render Product offer
- Use weight Button prop to style the "learn more" footer link
- Use a different copy when there are no found vulnerabilities but there are still some unchecked items

### Removed
- Removed Full Sync from loaded modules as Full Sync Immediately is present by default now

### Fixed
- Adjust spacing and overflow properties of the navigation labels to improve display of long names.
- Fix Connectino initialization
- Fix fatal when checking whether site site has vuls
- Fix right margin in primary layout
