# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [8.0.0] - 2026-11-04
### Added
- Connection: Add a Connected view to the Users page listing users with a linked WordPress.com account. [#53150]
- Connection: Show connection errors on the Connectors card, and keep showing the connection owner when their account connection breaks. [#53596]
- Connection: Surface SSL certificate verification failures reported by WordPress.com as a connection error notice. [#52035]
- Connection: Transfer connection ownership to another administrator without leaving your site. [#53359]
- Connection: Transfer connection ownership to another connected administrator from the Connectors page. [#53581]
- My Jetpack: Add an Available filter to the Features list. [#53308]
- My Jetpack: Add catalog-controlled Pro offers and preserve existing plan management. [#53421]
- My Jetpack: Allow the Automattic for Agencies banner to be dismissed. [#51441]
- My Jetpack: Recognize Jetpack Pro subscriptions and licenses. [#53424]

### Changed
- Activate the free Search plan without being sent through a $0 checkout. [#52655]
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
- Dashboard: Keep focus on information icons when their tooltips open, announce the content to screen readers, and show a focus ring after clicking them. [#52736]
- Drop the Preview label from AI Answers. [#51891]
- General: Update minimum WordPress version to 7.0. [#51370]
- My Jetpack: answer module switch clicks immediately, and explain what happened when a change fails. [#52494]
- My Jetpack: Connect a WordPress.com account from feature cards that need one. Show feature states through switches or buttons instead of redundant Active or Inactive badges, and show host restrictions below descriptions. Leave features out of Available when their only action is an install you cannot make. [#53990]
- My Jetpack: Leave the recommendation to install or activate plugins included in a bundle plan out of the Jetpack menu notification badge. [#54355]
- My Jetpack: Line up notices with the cards below them, and drop the grey background behind the Features grid and list buttons. [#53759]
- My Jetpack: On the Features tab, keep a plugin's switch busy until its card is up to date after a failed change, or after any change on sites that also run Jetpack. [#54156]
- My Jetpack: Open supported Modules links in Features when Jetpack is active. [#53992]
- My Jetpack: Open the Jetpack Connection details on the Connectors screen from the header's Manage connection link. [#54276]
- My Jetpack: Refresh Pro availability while preserving existing offers. [#53425]
- My Jetpack: Restyle dashboard notices to match the WordPress design system. [#52290]
- My Jetpack: Show a connection error on the Overview connection card while your account is still to be connected, instead of only asking you to connect it. [#53409]
- My Jetpack: Show a Features tab in place of the Products tab. [#52785]
- My Jetpack: Show product cards flat, without a drop shadow. [#52988]
- My Jetpack: Show the avatar and connection status control in the header by default, with access to connection and plan details. [#54225]
- My Jetpack: Show the dashboard in the new rounded admin page frame. [#52446]
- My Jetpack: Show the Features page on sites in Offline Mode, without connecting to WordPress.com. [#54216]
- My Jetpack: Show the Jetpack menu notification badge when a connection error is detected. [#52332]
- My Jetpack: Show what Paid Stats actually adds — UTM tracking, device stats, and region & city locations — instead of commercial use. [#51410]
- My Jetpack: Turn a module on once Install Jetpack or Activate Jetpack on its card finishes setup. [#54007]
- No Results block: Show each empty-state message as it will appear to visitors while editing, and tell the messages apart by name when browsing the page structure. [#51530]
- Search: report the saved AI Answers choice while the site-wide AI switch is off, disable the controls, and honor the host AI opt-out in the AI Answer block. Require Instant Search to enable AI Answers. The master-state reporting follows the rollout: live on WordPress.com Simple, internal testing environments elsewhere. [#51538]
- Show the dashboard in the new rounded admin page frame. [#52506]
- Sidebar: sort Jetpack menu items alphabetically, pinning My Jetpack to the top and external links and Settings to the bottom. [#52003]
- Stats: Stop counting visitors who have not allowed statistics cookies on sites that run the WP Consent API. [#54187]
- Tested up to WordPress 7.1. [#51370]
- Update package dependencies. [#52028] [#53448] [#54117]

### Removed
- Search Dashboard: Remove the AI Agent Access toggle. [#53734]
- Updated PHP version requirements to PHP 7.4 or newer. [#51515]

### Fixed
- Activity Log: Continue the wp-admin menu color behind the page frame on WordPress.com and third-party admin color schemes. [#51619]
- Activity Log: Fix the page overlapping the admin menu in right-to-left languages. [#51963]
- Activity Log: honor the module setting, so the page can be turned off. [#52409]
- Activity Log: Show an empty date picker on the free plan, instead of a date range it does not apply. [#53982]
- Activity Log: Stop the frame from flashing while loading and when switching admin pages. [#52235]
- Admin dashboards: Keep the page header and content in view when the wp-admin menu is taller than the window. [#51696]
- AI Answer: Show the disabled notice when the host turns off AI, and hide the block from the inserter whenever Jetpack AI is off. [#51971]
- AI Answers: Keep the search preview hidden when answers are turned off. [#52753]
- AI Answers: Respect the site-wide Jetpack AI filter. [#52748]
- Avoid requesting the Search plan in offline mode. [#53241]
- Blocks: Stop offering Search blocks in the Overlay search sidebar's widget inserter, and flag any already there, because they cannot load in that sidebar. [#52670]
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
- Dashboard: Activate free Search in place from "Start for free" instead of falling back to the $0 checkout. [#53397]
- Dashboard: Open information tooltips with the keyboard and dismiss them with Escape. [#52661]
- Dashboard: Start the experience switch and Restore default confirmations on Cancel, so pressing Enter no longer switches the search experience or deletes a customized template. [#53033]
- Fix a crash on mount when the localized widget configuration is missing or incomplete, which could leave the whole page blank. [#51511]
- Fix the Search dashboard failing to load on WordPress.com-hosted sites. [#52362]
- Footer: Hide Products and Help links when My Jetpack is unavailable. [#52557]
- Instant Search: Fix a leaked scroll handler that could trigger stray page loads after several searches. [#51913]
- Instant Search: Open the filters panel below the results header on small screens, so the Filters toggle stays visible. [#53474]
- JITM: Fix missing messages and a console error on sites without the Jetpack plugin active. [#51733]
- Keep admin icons colored after the @wordpress/icons 16 update, which draws them as strokes. [#52187]
- My Jetpack: always label the license activation link 'Activate a license'. It previously read 'Activate a new license' on sites with a plan, even when no licenses had been activated. [#51283]
- My Jetpack: Bring the first Features results into view after changing the filter or search while scrolled down. [#54201]
- My Jetpack: Fix a fatal error when activating Jetpack Search beside an older Jetpack plugin. [#54012]
- My Jetpack: Fix the layout of the connection screen for right-to-left languages. [#52749]
- My Jetpack: Hide other plugins' notices while the setup screen is open, and stop the full-screen layout breaking when another plugin adds an admin body class first. [#52765]
- My Jetpack: Keep the Automattic for Agencies banner hidden after dismissing it and switching tabs. [#51441]
- My Jetpack: Keep the Help tab's cards inside their column on narrow screens. [#53847]
- My Jetpack: keep the stats chart tooltip under sticky and fixed page elements. [#51640]
- My Jetpack: Make the connection screen's Connect button and footer links reachable on shorter screens. [#53402]
- My Jetpack: Offer to activate Search, rather than to buy a plan, when the site already owns it and the module is switched off. [#52008]
- My Jetpack: Point users who cannot connect the site at an administrator, instead of an onboarding screen they cannot complete. [#52614]
- My Jetpack: Return to the tab you came from with the back link on product upgrade screens. [#54101]
- My Jetpack: Show each notice once instead of twice. [#52494]
- My Jetpack: Show the correct product status and use the active plugin copy when turning products on or off with both stable and Beta or development copies installed. [#53994]
- My Jetpack: Show the fallback starting price per month, billed yearly, instead of $100 a month on the upgrade page when prices cannot be loaded. [#54024]
- My Jetpack: Show the highest-priority notice first when several are set at once. [#53400]
- My Jetpack: Show the right product status as soon as fresher plan data is available, instead of reusing an earlier lookup. [#52009]
- My Jetpack: Stop offering retired Security and Growth plans while preserving existing subscriptions. [#53854]
- My Jetpack: Stop repeating the partner lookup request on every page load. [#51441]
- My Jetpack: Stop reporting an error when switching VideoPress off while the Jetpack plugin is inactive. [#53371]
- My Jetpack: Stop showing $0.00 for paid plans on recommendation cards when prices cannot be loaded. [#54458]
- My Jetpack: Stop showing an empty account avatar on the Overview connection card on sites without a connection owner when nothing in use needs a user connection. [#53287]
- My Jetpack: Stop the Stats dashboard from asking which plan you want again after Start for Free was already chosen. [#51413]
- My Jetpack: stretch the tab content background to the full height of the page. [#52633]
- Require a paid Search plan to enable AI Answers, not just the setting's raw value. [#51890]
- Show Jetpack in-dashboard messages on every tab, not just Overview. [#52641]
- Show the connection error at the top of the dashboard on every tab. [#52820]
- Site Chat: Require a paid Search plan to enable chat. [#52386]
- Status: Detect a site served on any 127.0.0.0/8 loopback address, or on 0.0.0.0, as a local site. [#51311]

## [7.1.0] - 2026-08-13
### Added
- Add the Activity Log page to wp-admin, so it is available without the Jetpack plugin installed. [#51222]
- Search Blocks: Add a No Results block so empty states can contain links, images, buttons, and other blocks instead of plain text. Continue rendering existing Results List messages while deprecating their settings. [#51164]

## [7.0.1] - 2026-07-22
### Changed
- Add a results-per-page setting to the Search Results block, falling back to the site's Reading setting when unset. [#50652]
- Overlay/embedded templates: Keep the Collapsible Filters panel in sync with the sidebar Filters block, locking it read-only in the editor when both coexist. [#50653]
- Overlay/embedded templates: Mark where a new filter belongs when adding it to the Filters (or Product Filters) block in the editor. [#50655]

### Fixed
- Fix fatal error on My Jetpack when the current stable Jetpack plugin is active. [#49994]

## [7.0.0] - 2026-06-10
### Added
- Search 7.0: build full search pages from native blocks — a Search Input block with search-as-you-type, Filters blocks (checkbox, date, custom taxonomy) with sidebar or collapsible-popover layouts, and Results blocks with selectable layouts, sorting, and load-more — all theme-aware on both block and classic themes. [#48563]
- Search 7.0: new Embedded search experience — a full-page search rendered inline in the theme at a real, bookmarkable URL with search-as-you-type, filters, sort, and load-more on the same page. [#48941]
- Search 7.0: new blocks-powered Overlay experience (Beta) — the same search blocks delivered in a modal that opens over the current page, keeping visitors in context. [#49118]
- Search 7.0 for WooCommerce: product search support — Filter by Product Attribute, Price, Rating, and Stock Status blocks, a Product Filters container, Product Category/Tag/Brand checkbox variations, a product results layout (image, title, price, rating), and Price/Rating sort options. [#48454]
- Search: add fallback image capability in expanded search [#44657]
- Search: Adding auto-complete search query feature [#48473]
- Search Blocks Overlay: render product results and product filters from a dedicated product overlay template on WooCommerce product searches. [#49262]

### Changed
- General: Update minimum WordPress version to 6.9. [#49021]
- Internal: No longer require automattic/jetpack-changelogger as a per-project dev dependency. [#48225]
- Remove unneeded development and documentation files from the published plugin. [#49014]
- Search 7.0: result cards now honor the site's date_format option (F j, Y, Y-m-d, etc.) instead of a fixed Intl shape. [#48763]
- Search Blocks: default the checkbox-filter Custom Taxonomy label to the taxonomy's display name instead of leaving it empty. [#49187]
- Search Blocks: the product-search edit link now follows the active experience — "Edit the product Search overlay" for Overlay (blocks), "Edit the product search template" otherwise — and pairs with a Restore default that acts on the matching template. The product-search toggle and the Embedded experience are now marked Beta. [#49274]
- Search Blocks: unify the three search-results templates' responsive layout under a shared `.jetpack-search-layout__*` class namespace, collapsing the duplicate sidebar-collapse rules from `block_template_overlay_inline_css()` and `search_page_inline_css()` into a single `search_layout_inline_css()` helper. Pure refactor — no behavior change. [#49183]
- Search Blocks Overlay: collapse the filter sidebar below 992px and dock a `filters-popover` trigger next to Sort By, matching the legacy Instant Search overlay UX. [#49177]
- Search Blocks Overlay: separate the modal card from the dim scrim on dark themes by tinting the resolved surface and painting a token-aware hairline border, so the card visibly layers above the page behind it. [#49207]
- Tested up to WordPress 7.0. [#48114]
- Update composer.lock files. [#49415]
- Updated package dependencies. [#48735]
- Update package dependencies. [#48064] [#48683] [#49218] [#49448]

### Fixed
- Fix mobile overflow on the upsell/pricing page so cards no longer get clipped. [#48194]

## [6.0.0] - 2026-04-10
### Added
- Add Jetpack Protect details page for users without the dedicated Jetpack Protect plugin. [#46630]
- IDC: Add revalidation for IDCs. [#46268]

### Changed
- Dependencies: Update lock file to keep root requirements in sync. [#47418]
- Instant Search: Show WooCommerce product filters in filter widget. [#46373]
- My Jetpack: Check red bubble notification async when cache is not available. [#46396]
- Remove header border-bottom from the admin page for a cleaner unified header appearance. [#47313]
- Search: Use the core WordPress spinner component for the dashboard loading state. [#47467]
- Switch to Native TypeScript compiler based on Go. [#47375]
- Update composer.lock. [#46686]
- Update design of the sidebar upsell. [#47909]
- Update package dependencies. [#46785] [#47021] [#47285] [#47371] [#47505] [#47825]

### Removed
- General: Update minimum WordPress version to 6.8. [#46801]

### Fixed
- Admin Page: Restore border on header component. [#47425]
- Fix TypeScript errors detected by tsgo. [#47426]
- Update e2e test selector for renamed footer CSS class. [#47840]

## [5.2.2] - 2025-11-21
### Fixed
- Jetpack: Remove getIconColor functions for block icons. [#45992]
- My Jetpack: Fix expiring renewal prompt to show all products. [#45995]

## [5.2.0] - 2025-11-12
### Added
- Instant Search: Add global WooCommerce Product Attributes as filter options. [#45416]
- Tested up to WordPress 6.9. [#45571]

### Changed
- Instant Search: Fix issue where Safari's 'Use advanced tracking and fingerprinting protection' setting breaks Search. [#45588]
- Update package dependencies. [#45200] [#45298] [#45299] [#45478] [#45652] [#45676]

### Fixed
- My Jetpack page: fix visual compatibility issue with Hello Dolly plugin. [#45474]

## [5.1.0] - 2025-09-09
### Added
- Add archives endpoint support. [#44028]
- Add typecheck support for E2E tests. [#44788]
- My Jetpack: Add analytics for empty product search results. [#44344]

### Changed
- Remove CRM installation nudge for Complete plan users. [#45026]
- E2E tests: Remove redundant logic in test fixture and convert the fixture to TypeScript. [#44327]
- Improve performance of WordPress.com comment likes by caching and minimizing API requests. [#44205]
- My Jetpack: Enable access to My Jetpack on WP Multisite. [#44260]
- My Jetpack: Fix multisite availability check for restricted products and modules. [#44710]
- My Jetpack: Unify the user connection flow with a unified screen. [#44469]
- My Jetpack: Update Stats card to include a chart for better analytics. [#43870]
- Sync: Ignore the ActivityPub Outbox CPT. [#44222]
- Update package dependencies. [#44206] [#44725] [#45096] [#45097]

### Fixed
- Autoloader: Prevent double slash in autoloader path. [#44030]
- JITM: Fix ineffective caching due to expired plugin sync transient. [#44117]
- My Jetpack: Fix footer alignment for disconnected accounts. [#44468]
- My Jetpack: Prevent expiration alerts for products covered by active bundles. [#44586]
- My Jetpack: Restore plan purchase link. [#44535]
- Search: Ensure images are loaded efficiently when on https sites. [#44851]
- JITM: Remove jQuery dependency. [#43783]

## [5.0.0] - 2025-06-10
### Added
- Add more error logging. [#42959]
- Add My Jetpack tour. [#42880]
- Highlight search terms in returned search results. [#43110]

### Changed
- E2E Tests: Update config file encryption algorithm. [#43523]
- My Jetpack: Hide backup failure notice when backups are deactivated. [#43568]
- My Jetpack: Optimize the images for onboarding slider for faster page load. [#43473]
- My Jetpack: Update the onboarding UI, changing it to a single button. [#43203]
- Update package dependencies. [#43071] [#43085] [#43425] [#43839]

### Removed
- Classic Themes: Replace the Core Search widget instead of adding a new widget to the main sidebar. [#43450]
- General: Update minimum WordPress version to 6.7. [#43192]

### Fixed
- Address `body_class` filter fatal in older versions of the Blaskan theme. [#43797]
- Block editor: Fix layout issues with the Media Library modal buttons. [#43035]
- Linting: Fix more Stylelint violations. [#43213]
- Mitigate bug with certain P2 themes. [#43503]
- My Jetpack: Fix Onboarding UI responsiveness at 600px. [#43533]
- My Jetpack: Fix readability of license activation button on hover. [#43550]
- My Jetpack: Prevent social login from getting stuck when email input is not empty. [#43158]
- Protect against improper calls to `the_title()` filter. [#43511]

## [4.1.0] - 2025-04-04
### Added
- Add Account Protection initialization. [#40925]
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
- Search: Ensure the count of returned results is shown after searching. [#42570]

## [4.0.0] - 2025-01-10
### Added
- Enable test coverage. [#39961]
- My Jetpack: Update recommendations section in My Jetpack to include a slider interaction for the cards. [#39850]
- Search: Added ability to customize results. [#36378]

### Changed
- Classic Widget: Update asset enqueuing strategy to ensure compatibility with the Elementor plugin. [#39820]
- General: Indicate compatibility with the upcoming version of WordPress - 6.7. [#39786]
- Include `wp-polyfill` as a script dependency only when needed. [#39629]
- Resolve an issue where revoked licenses were incorrectly treated as unattached. This caused users to be redirected to the license activation page after site connection, even when unattached licenses were not valid for activation. [#40215]
- Social: Changed My Jetpack CTA for Social from "Learn more" to "Activate" [#40359]
- Updated dependencies. [#40286]
- Updated package dependencies. [#39288] [#39653] [#40116] [#40515] [#40693] [#40815]

### Removed
- Connection: Removed deprecated `features_available` method. [#39442]
- Connection: Removed deprecated `features_enabled` method. [#39475]
- General: Update minimum PHP version to 7.2. [#40147]
- General: Update minimum WordPress version to 6.6. [#40146]

### Fixed
- E2E Tests: Only install single browser used by Playwright. [#40827]
- My Jetpack: Update GlobalNotice component to look better on mobile. [#39537]

## [3.0.1] - 2024-09-06
### Changed
- Internal updates.

## [3.0.0] - 2024-09-05
### Changed
- General: Update WordPress version requirements to WordPress 6.5 and indicate compatibility with WordPress 6.6. [#38382]

## [2.1.0] - 2024-05-23
### Added
- Trigger a red bubble notification when bad plugin install is detected. [#36449]

### Changed
- Update WordPRess tested version to 6.5. [#35820]
- Update minimum WordPress version requirement to WordPress 6.4. [#37047]
- Only show installation errors on the plugins page. [#36390]
- Show My Jetpack link on the plugins page even if the plugin is not installed. [#35523]

## [2.0.0] - 2024-02-07
### Added
- Allow users to select price as default sorting option for search [#35167]
- Implemented a "tabbed" variation for static filters. This adds tabs on top of the results for each filter group. [#29811]

### Changed
- General: indicate full compatibility with the latest version of WordPress, 6.4. [#33776]
- General: update WordPress version requirements to WordPress 6.3. [#34127]
- General: updated PHP requirement to PHP 7.0+ [#34126]

## [1.4.1] - 2023-03-08
### Changed
- Remove `ci.targets` from package.json. Better scoping of e2e tests. [#28913]
- Update playwright dependency. [#28094]
- Updated package dependencies.

## [1.4.0] - 2022-12-12
### Added
- Search: port Search plugin 1.3.1 changelog and plugin description [#27399]

### Changed
- My Jetpack: Requires connection only if needed [#27615]
- My Jetpack: Show My Jetpack even if site is disconnected [#26967]
- Updated package dependencies. [#26069]

### Fixed
- Search: Fixed E2E testing failures after adding a checkmark icon for resolved topics [#27586]
- Search: fixed search E2E failure after the new pricing update [#27430]

## [1.3.1] - 2022-11-13
### Fixed
- Fixed readme and descriptions for Free tier support and new pricing [#27341]

## [1.3.0] - 2022-11-10
### Added
- Enable stats tracking upon establishing a site connection. [#26697]
- Search: add post type breakdown endpoint. [#26463]
- Search Dashboard: Add support link for plan limits. [#26694]
- Search Dashboard: Add support for conditional CUTs. [#26656]
- Search: enable new pricing if pricing_version is set to 202208 from API. [#26900]
- Search: add blog ID filtering and `blogIdFilteringLabels` option. [#27120]

### Changed
- Compatibility: WordPress 6.1 compatibility. [#27084]
- Ported back 1.2.0 release changelog. [#26079]
- Search: now support 38 languages. [#27025]
- Introduce PricingTable to update Upsell page. [#26408]
- Updated package dependencies. [#27283]
- Search: always add Search Dashboard page even when submenu is hidden. [#26807]
- Hide Jetpack logo toggle, enforce display for free plans. [#26951]
- Search: add purchase tracking. [#26981]

### Fixed
- Fixes the issue where search results are not loaded in customizer. [#26212]
- Fix error message styling in Instant Search overlay. [#26339]
- Search: wpcom sites should not be considered as connected. [#26835]
- Search: hide meters etc for Classic Search. [#27073]

### Other changes <!-- Non-user-facing changes go here. This section will not be copied to readme.txt. -->
- Adds ability to autotag, autorelease and autopublish releases. [#26156]
- E2E tests: use CI build artifacts in e2e tests. [#26278]
- Search: start v1.3.0-alpha release cycle. [#25854]
- E2E tests: removed deprecated Slack notification code. [#26215]

## [1.2.0] - 2022-09-05
### Added
- Instant Search: add author filtering support.
- Instant Search: add descriptions to post type icons for accessibility purposes.
- Instant Search: add focus border to search input field.
- Instant Search: always use submit overlay trigger if user prefers reduced motion.
- Instant Search: only show animation to users who have not chosen reduced motion.
- Instant Search: user friendly error messaging.
- My Jetpack: include JITMs.
- Record Meter: adds info link to docs.
- Search: add links to Search plugin line on plugins page.

### Changed
- Instant Search: updates dark mode active link color for increased contrast.
- Search: always show Search submenu when Search plugin is installed.
- Search: changed default overlay trigger to form submission.
- Search: changed to only require site level connection.
- Search: only redirect when activating from the Plugins page in the browser.
- Search: revert "Search should not require user connection".
- Updated package dependencies.

### Removed
- Search: remove 'results' overlay trigger.

### Fixed
- Dashboard: updated Instant Search description to match changes in default overlay trigger.
- Instant Search: add focus styles for easier keyboard navigation.
- Instant Search: constrain tab loop to overlay when visible.
- Instant Search: fix button styling in Twenty Twenty One theme.
- Instant Search: fix the display order on mobile to match the tab order.
- Instant Search: make "Clear filters" button accessible.
- Instant Search: remove redundant links from search results.
- Instant Search: use classname rather than ID for styling sort select.
- Search Widget: keep widget preview with settings.

## [1.1.0] - 2022-08-02
### Added
- Dashboard: new Record Meter feature to show the breakdown of records in your search index.

### Fixed
- Customization: fix fill color for gridicons in dark mode.
- Customization: hide unsupported taxonomies from Search widget.
- Customization: re-enable auto-collapsing sidebar in Customberg.
- Dashboard: fix currency code in upsell page.
- Dashboard: fix pricing issue before site is connected to Jetpack.
- Dashboard: minor CSS changes for Hello Dolly compatibility.
- Instant Search: avoid search query on component mount.
- Instant Search: consistent design for focus states in Search overlay.
- Instant Search: don't open modal if only sort parameter is set.
- Instant Search: fix header letter spacing in modal.
- Instant Search: fix irrelevant widgets added to sidebar during auto config.
- Instant Search: fix keyboard handling on search options.
- Instant Search: prevent hidden submit button appearing on focus.
- Instant Search: restore support for filtering by multiple post types with post_type=.
- Search: redirect to the Search Dashboard on activation only when Jetpack plugin does not exist.

## 1.0.0 - 2022-05-30
### Added
- Initial release.

[1.1.0-beta]: https://github.com/Automattic/jetpack-search-plugin/compare/1.0.0...1.1.0-beta
[1.2.0-beta]: https://github.com/Automattic/jetpack-search-plugin/compare/1.1.0...1.2.0-beta
[8.0.0]: https://github.com/Automattic/jetpack-search-plugin/compare/7.1.0...8.0.0
[7.1.0]: https://github.com/Automattic/jetpack-search-plugin/compare/7.0.1...7.1.0
[7.0.1]: https://github.com/Automattic/jetpack-search-plugin/compare/7.0.0...7.0.1
[7.0.0]: https://github.com/Automattic/jetpack-search-plugin/compare/6.0.0...7.0.0
[6.0.0]: https://github.com/Automattic/jetpack-search-plugin/compare/5.2.2...6.0.0
[5.2.2]: https://github.com/Automattic/jetpack-search-plugin/compare/5.2.0...5.2.2
[5.2.0]: https://github.com/Automattic/jetpack-search-plugin/compare/5.1.0...5.2.0
[5.1.0]: https://github.com/Automattic/jetpack-search-plugin/compare/5.0.0...5.1.0
[5.0.0]: https://github.com/Automattic/jetpack-search-plugin/compare/4.1.0...5.0.0
[4.1.0]: https://github.com/Automattic/jetpack-search-plugin/compare/4.0.0...4.1.0
[4.0.0]: https://github.com/Automattic/jetpack-search-plugin/compare/3.0.1...4.0.0
[3.0.1]: https://github.com/Automattic/jetpack-search-plugin/compare/3.0.0...3.0.1
[3.0.0]: https://github.com/Automattic/jetpack-search-plugin/compare/2.1.0...3.0.0
[2.1.0]: https://github.com/Automattic/jetpack-search-plugin/compare/2.0.0...2.1.0
[2.0.0]: https://github.com/Automattic/jetpack-search-plugin/compare/1.4.1...2.0.0
[1.4.1]: https://github.com/Automattic/jetpack-search-plugin/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/Automattic/jetpack-search-plugin/compare/1.3.1...1.4.0
[1.3.1]: https://github.com/Automattic/jetpack-search-plugin/compare/1.3.0...1.3.1
[1.3.0]: https://github.com/Automattic/jetpack-search-plugin/compare/1.2.0...1.3.0
[1.2.0]: https://github.com/Automattic/jetpack-search-plugin/compare/1.2.0-beta...1.2.0
[1.1.0]: https://github.com/Automattic/jetpack-search-plugin/compare/1.1.0-beta...1.1.0
