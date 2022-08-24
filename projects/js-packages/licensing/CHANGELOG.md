# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.5.9 - 2022-08-23
### Changed
- Updated package dependencies. [#25338, #25339, #25377, #25762]

## 0.5.8 - 2022-07-26
### Changed
- Updated package dependencies. [#25147]

## 0.5.7 - 2022-07-12
### Changed
- Updated package dependencies. [#25048, #25055]

## 0.5.6 - 2022-07-06
### Changed
- Updated package dependencies. [#24923]

## 0.5.5 - 2022-06-28
### Fixed
- Declare `type: module` in package.json, as `.js` files in the package use `include` rather than `require`. [#24790]

## 0.5.4 - 2022-06-14
### Changed
- Updated package dependencies. [#24722]

## 0.5.3 - 2022-06-08
### Changed
- Reorder JS imports for `import/order` eslint rule. [#24601]
- Updated package dependencies. [#24510]

## 0.5.2 - 2022-05-30
### Changed
- Updated package dependencies

## 0.5.1 - 2022-05-24
### Changed
- Updated package dependencies. [#24449]

## 0.5.0 - 2022-05-19
### Changed
- Update view plans button after activating a license to send user to Calypso Green [#24395]

## 0.4.19 - 2022-05-18
### Changed
- Updated package dependencies. [#23795]

## 0.4.18 - 2022-05-10
### Changed
- Updated package dependencies. [#24204]

## 0.4.17 - 2022-05-04
### Changed
- Remove use of `pnpx` in preparation for pnpm 7.0. [#24210]
- Updated package dependencies [#24198]

## 0.4.16 - 2022-04-26
### Changed
- Updated package dependencies.
- Update package.json metadata.
- Uses ActivationScreen component in My Jetpack; Tweaks original component for compatibility with My Jetpack

## 0.4.15 - 2022-04-19
### Changed
- Moved licensing images into licensing package to minimize external dependencies.

## 0.4.14 - 2022-04-12
### Changed
- Updated package dependencies.

## 0.4.13 - 2022-04-06
### Changed
- Updated package dependencies

## 0.4.12 - 2022-03-29
### Added
- Add missing JS peer dependencies.

### Changed
- Updated package dependencies.

## 0.4.11 - 2022-03-23
### Changed
- Updated package dependencies

## 0.4.10 - 2022-03-15
### Changed
- Updated package dependencies.

## 0.4.9 - 2022-03-08
### Changed
- Updated package dependencies.

## 0.4.8 - 2022-03-02
### Changed
- Updated package dependencies

## 0.4.7 - 2022-02-22
### Changed
- Updated package dependencies.

## 0.4.6 - 2022-02-09
### Changed
- Updated package dependencies
- Update wording of Activation Dialog window

### Fixed
- Decrease the line-height of the License Activation title.

## 0.4.5 - 2022-02-02
### Changed
- Updated package dependencies.

## 0.4.4 - 2022-01-25
### Added
- Add missing dev dependency on `nyc` for code coverage.

## 0.4.3 - 2022-01-18
### Changed
- General: update required node version to v16.13.2

### Fixed
- fixed babel/preset-react dependency

## 0.4.2 - 2022-01-11
### Changed
- Updated package dependencies.

### Removed
- Remove use of deprecated `~` in sass-loader imports.

## 0.4.1 - 2022-01-07
### Fixed
- Activation buttons: ensure that the styles are specific enough when using Gutenberg.

## 0.4.0 - 2022-01-04
### Added
- Add helpful links to the success page shown after a license is activated.
- Link primary button after activation to Recommendations section if not seen before.

### Changed
- Updated package dependencies

## 0.3.2 - 2021-12-14
### Changed
- Updated package dependencies.

## 0.3.1 - 2021-12-07
### Changed
- Updated package dependencies.

## 0.3.0 - 2021-12-06
### Added
- Refine Jetpack License Activation UX.

## 0.2.0 - 2021-11-30
### Added
- Add busy state to activation button when disabled for license request.
- Added style improvements to license flow components.

### Fixed
- Fixed positioning and size of error icon.

## 0.1.0 - 2021-11-23
### Added
- Add api package dependency and add attachLicense API request to ActivationScreen
- Add support for all Jetpack products
- Licensing package introduced.

### Changed
- Import RNA styles from base styles package.
- Updated package dependencies.

### Fixed
- jetpack-js-test-runner is a dev dependency.
