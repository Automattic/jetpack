# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
