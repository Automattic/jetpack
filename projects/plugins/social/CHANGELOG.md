# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
