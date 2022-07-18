# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
