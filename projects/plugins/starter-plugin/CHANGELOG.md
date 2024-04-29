# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.4.0 - 2024-02-07
### Changed
- General: indicate full compatibility with the latest version of WordPress, 6.3. [#31910]
- General: indicate full compatibility with the latest version of WordPress, 6.4. [#33776]
- General: remove WP 6.1 backwards compatibility checks [#32772]
- General: updated PHP requirement to PHP 7.0+ [#34126]
- General: update WordPress version requirements to WordPress 6.2. [#32762]
- General: update WordPress version requirements to WordPress 6.3. [#34127]
- Updated Jetpack submenu sort order so individual features are alpha-sorted. [#32958]
- Updated package dependencies.
- Update lockfile [#33607]
- Use the new method to render Connection initial state. [#32499]

## 0.3.0 - 2023-07-06
### Added
- Add authentication to zendesk chat widget [#31339]

### Changed
- General: indicate full compatibility with the latest version of WordPress, 6.2. [#29341]
- Remove conditional rendering from zendesk chat widget component due to it being handled by an api endpoint now [#29942]
- Updated package dependencies.
- Update WordPress version requirements. Now requires version 6.1. [#30120]

## 0.2.0 - 2023-03-08
### Added
- Add support for JITMs to starter plugin [#25880]
- E2E tests: use CI build artifacts in e2e tests [#26278]
- My Jetpack includes JITMs [#22452]
- Starter Plugin: Add basic JS and PHP test setup [#27729]
- Use ThemeProvider when rendering Starter Plugin AdminPage [#25870]

### Changed
- Compatibility: WordPress 6.1 compatibility [#27084]
- E2E tests: bump dependencies [#25725]
- Updated package dependencies.
- Update playwright dependency [#28094]
- Update to React 18. [#28710]

### Removed
- E2E tests: removed deprecated Slack notification code [#26215]

### Fixed
- E2E tests: fixed pretest cleanup script not running [#25051]
- Plugin activation: Only redirect when activating from Plugins page in the browser [#25711]

## 0.1.0 - 2022-07-06
### Added
- Add activation and deactivation hooks. [#24250]
- E2E tests boilerplate. [#24723]
- Enable beta plugin support. [#23836]
- Initial release. [#23434]

### Changed
- Changed the method used to disconnect. [#24299]
- Configure Sync with the minimal amount of data. [#23759]
- Janitorial: require a more recent version of WordPress now that WP 6.0 is coming out. [#24083]
- Remove use of `pnpx` in preparation for pnpm 7.0. [#24210]
- Renaming master to trunk. [#24661]
- Renaming `master` references to `trunk`. [#24712]
- Reorder JS imports for `import/order` eslint rule. [#24601]
- Updated package dependencies.

### Fixed
- Jetpack CLI: correctly replace project description and release-branch-prefix. [#23911]
- Updated .gitattributes file so it is able to build properly by the CI build jobs. [#23591]
