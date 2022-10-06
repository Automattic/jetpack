# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
