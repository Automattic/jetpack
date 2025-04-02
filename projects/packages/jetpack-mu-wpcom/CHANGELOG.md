# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- Added new Launchpad task [#32204]
- Added new Launchpad task [#32250]
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
- Update launchpad checklist API twrite flow task definitions to use site option data [#30116]
- Update launchpad checklist API twrite flow task definitions to use site option data [#30117]

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
