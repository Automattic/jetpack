# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.17.1] - 2022-10-28
### Fixed
- Classic Editor: fix the is_healthy logic that disabled connections. [#27159]
- Include built JavaScript bundles in the package. [#27152]

## [0.17.0] - 2022-10-25
### Added
- Cache connection testing results during an HTTP request. [#26955]
- Social: Add the reshare endpoint for proxying the request to WPCOM [#25993]

### Changed
- Updated package dependencies. [#26705]

### Fixed
- Display error for broken connections in editor [#25803]

## [0.16.2] - 2022-10-11
### Changed
- Updated package dependencies. [#26640]

## [0.16.1] - 2022-10-05
### Changed
- Updated package dependencies. [#26569]

## [0.16.0] - 2022-09-27
### Added
- Add caching to shares info check [#26449]

### Changed
- Move share limits code to the Publicize package [#26294]
- Social: Aligned Jetpack and Social to use the connection-test-results endpoint in the block editor [#26274]
- Updated package dependencies. [#26294]

## [0.15.0] - 2022-09-20
### Added
- Added is-healthy endpoint to post field [#26216]

## [0.14.0] - 2022-09-13
### Added
- Added hooks for Publicize form in Classic Editor [#26039]

## [0.13.2] - 2022-09-08
### Changed
- Updated package dependencies.

### Fixed
- Fixed wrong permissions check for contributors [#26025]

## [0.13.1] - 2022-08-31
### Removed
- Removed errant code change.

## [0.13.0] - 2022-08-31
### Changed
- Updated package dependencies. [#25931]

## [0.12.0] - 2022-08-30
### Changed
- Rebrand Publicize to Jetpack Social [#25787]
- Updated package dependencies. [#25694]

### Fixed
- Post field: Allow for the filter which could make the connections default to disabled. [#24617]

## [0.11.1] - 2022-08-23
### Changed
- Updated package dependencies. [#25628]

## [0.11.0] - 2022-08-09
### Added
- Added scheduled post calculation on plugin activation [#25334]

## [0.10.1] - 2022-08-03
### Changed
- Updated package dependencies. [#25300, #25315]

## [0.10.0] - 2022-07-26
### Changed
- Updated package dependencies. [#25158]
- Use new Jetpack Social endpoint on WPCOM to get Publicize shares info [#25147]

## [0.9.0] - 2022-07-19
### Added
- Fetch share counter on the server side in Jetpack Social. To facilitate this, the call to wpcom has been moved into the Publicize_Base class. [#24836]

## [0.8.1] - 2022-07-12
### Changed
- Updated package dependencies.

## [0.8.0] - 2022-07-06
### Added
- Synced changes made in modules/publice/publicize.php and made sure the composer package for publicize has those changes. [#24943]

## [0.7.1] - 2022-06-29
### Changed
- Update annotations versions.

## [0.7.0] - 2022-06-21
### Added
- Added a proxy end-point to get the shares count for Publicize. [#24786]

### Changed
- Renaming master to trunk. [#24661]

## [0.6.0] - 2022-06-14
### Added
- Made changes to not instantiate the publicize object, if it's already instantiated. [#24695]

### Changed
- Publicize: Allow users to set the image for their social post even when themes don't support featured images. [#23871]
- Updated package dependencies. [#24529]

## [0.5.0] - 2022-05-31
### Added
- Changed logic to initialize publicize classes only if the publicize module is active. [#24451]

### Changed
- Classic Editor: Replaced the initial settings form with the Jetpack redirect link [#24526]

## [0.4.0] - 2022-05-24
### Added
- Added the post field to the Publicize package [#24324]

## [0.3.0] - 2022-05-18
### Added
- Added new jetpack v4 end-point to list publicize connections. [#24293]

### Changed
- Updated package dependencies. [#24153] [#24360]

### Fixed
- Added check for wp_ajax_elementor_ajax to allow publicizing via elementor. [#24387]
- gitignore wordpress directory within the publicize package [#24339]

## [0.2.1] - 2022-05-10
### Fixed
- Publicize: Correct bad namespaces

## [0.2.0] - 2022-05-04
### Added
- Added redirect links for Jetpack cloud. [#24205]

### Changed
- Updated package dependencies. [#24095]

### Deprecated
- Moved the options class into Connection. [#24095]

## [0.1.1] - 2022-05-19
### Fixed
- Added check for wp_ajax_elementor_ajax to allow publicizing via elementor.
- Publicize: Correct bad namespaces

## 0.1.0 - 2022-04-26
### Added
- Added an empty shell package
- Added Publicize module files to Composer package
- Set composer package type to "jetpack-library" so i18n will work.
- Use the publicize package in the Jetpack plugin.

### Changed
- Applied legacy Publicize filters to flag setting for Publicize
- Fix Composer dependencies
- Microperformance: Use === null instead of is_null
- PHPCS: Fix `WordPress.Security.ValidatedSanitizedInput`
- Publicize: Do not display legacy UI for block editor pages
- Sync'd changes with the equivalent files in the Publicize module
- Updated package dependencies.
- Update package.json metadata.

[0.17.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.17.0...v0.17.1
[0.17.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.16.2...v0.17.0
[0.16.2]: https://github.com/Automattic/jetpack-publicize/compare/v0.16.1...v0.16.2
[0.16.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.16.0...v0.16.1
[0.16.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.15.0...v0.16.0
[0.15.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.14.0...v0.15.0
[0.14.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.13.2...v0.14.0
[0.13.2]: https://github.com/Automattic/jetpack-publicize/compare/v0.13.1...v0.13.2
[0.13.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.13.0...v0.13.1
[0.13.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.12.0...v0.13.0
[0.12.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.11.1...v0.12.0
[0.11.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.11.0...v0.11.1
[0.11.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.10.1...v0.11.0
[0.10.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.10.0...v0.10.1
[0.10.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.8.1...v0.9.0
[0.8.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.7.1...v0.8.0
[0.7.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.1.0...v0.2.0
[0.1.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.1.0...v0.1.1
