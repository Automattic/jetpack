# Changelog

### This is a list detailing changes for the Jetpack RNA Components package releases.

## 0.10.4 - 2022-02-02
### Added
- Re-organize stories of js-packages components by project and package name

### Changed
- RNA: Improve layout structure with Container and Col

## 0.10.3 - 2022-01-25
### Changed
- Do not style header elements from AdminSection component

## 0.10.2 - 2022-01-18
### Changed
- General: update required node version to v16.13.2

### Fixed
- fixed babel/preset-react dependency

## 0.10.1 - 2022-01-17

- Updated package dependencies.

## 0.10.0 - 2022-01-11
### Changed
- Move numberFormat component into components js package.
- Updated package dependencies.

### Removed
- Remove use of deprecated `~` in sass-loader imports.

## 0.9.1 - 2022-01-04
### Changed
- Updated package dependencies

### Fixed
- Fix styling conflict that occurs for ActionButton when Gutenberg plugin is used

## 0.9.0 - 2021-12-14
### Added
- Created Layout components.

## 0.8.0 - 2021-12-07
### Added
- Added JetpackAdminPage and JetpackAdminSection components

### Changed
- Updated package dependencies.

## 0.7.0 - 2021-11-30
### Changed
- Add a new DecorativeCard component to the components package.
- Colors: update Jetpack Primary color to match latest brand book.

## 0.6.3 - 2021-11-23
### Changed
- Import RNA styles from base styles package.
- Updated package dependencies

### Fixed
- Action button supports larger labels

## 0.6.2 - 2021-11-17
### Fixed
- Pricing Card: Fix case where price before and after match.

## 0.6.1 - 2021-11-16
### Changed
- Updated package dependencies

## 0.6.0 - 2021-11-09
### Added
- Add Spinner in RNA components.

## 0.5.0 - 2021-11-02
### Added
- Added docs and tests

### Changed
- Update PricingCard to accept children.

## 0.4.0 - 2021-10-26
### Added
- Add PricingCard in RNA components.
- New ActionButton component added

### Changed
- Updated package dependencies

### Removed
- Removing knobs from Storybook and using propTypes in components instead

## 0.3.2 - 2021-10-13
### Changed
- Updated package dependencies.

## 0.3.1 - 2021-09-28
### Added
- Set 'exports' in package.json.

### Changed
- Allow Node ^14.17.6 to be used in this project. This shouldn't change the behavior of the code itself.
- Updated package dependencies.

### Fixed
- Footer: provide number instead of string for JetpackLogo's height prop.

## 0.3.0 - 2021-08-31
### Added
- Added stories files for storybook
- Add the Spinner component.

### Changed
- Use Node 16.7.0 in tooling.

### Fixed
- Added accessibility label and fixed footer style per design.

## 0.2.1 - 2021-08-12
### Changed
- Updated package dependencies

### Fixed
- JetpackFooter: add default a8cLogoHref prop value

## 0.2.0 - 2021-07-27
### Added
- Added Jetpack Footer and `An Automattic Airline` SVG components.
- Init version 0.0.2.
- Moving the getRedirectUrl() function from Jetpack to the RNA Components package.

### Changed
- RNA: Changed Jetpack symbol in footer from font to SVG.

## 0.1.0 - 2021-06-29
### Added
- Add JetpackLogo component.

### Changed
- Update node version requirement to 14.16.1
