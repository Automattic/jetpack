# Changelog

### This is a list detailing changes for the Jetpack RNA Components package releases.

## 0.11.2 - 2022-04-19
### Added
- Added Gridicon component
- Added TypeScript support
- Protect: add ProductOffer component

### Changed
- Converted numberFormat to TypeScript
- JS Components: Add subTitle prop to ProductOffer component
- JS Components: Update loading state for Button
- RNA: Add buttonText property to the ProductOffer component

## 0.11.1 - 2022-04-12
### Added
- JS Components: Add Dialog component.
- JS Components: Add ProductDetailCard component.
- JS Components: Add ProductPrice component.

### Changed
- Updated package dependencies.

### Fixed
- Button: Fix export, external link target and padding.
- JS Components: fix className prop in Button component.
- RNA: fix ProductOffer button loading state issue.

## 0.11.0 - 2022-04-05
### Added
- Components: add Button component.
- JS Components: add spacing props to Text component.
- JS Components: add story doc to Text components.
- My Jetpack: improve Product and Interstitial components.

### Changed
- Updated package dependencies.

## 0.10.12 - 2022-03-29
### Added
- Jetpack components: Add ThemeProvider stories for typographies and colors
- JS Components: add H2, H3 and Title components

### Changed
- JS Components: Minor Product Icons story and doc improvements
- Moved in product icon components from My Jetpack
- Updated package dependencies.

## 0.10.11 - 2022-03-23
### Added
- Components: Add Text component
- Introduced SplitButton component

### Changed
- Updated package dependencies

## 0.10.10 - 2022-03-15
### Added
- My Jetpack: Add new values to ThemeProvider

### Changed
- Bump version
- Updated dependencies

## 0.10.9 - 2022-03-09
### Added
- RNA: Add ThemeProvider

## 0.10.8 - 2022-03-08
### Added
- Add optional link to the Module name in the JetpackFooter component
- Components: replace Spinner with the core one
- JS Components: Add QRPost component

### Changed
- Components: update attributes used within the Button component to match recent deprecations and changes.

## 0.10.7 - 2022-03-02
### Changed
- Updated package dependencies.

## 0.10.6 - 2022-02-22
### Added
- Components: Add showBackground prop

## 0.10.5 - 2022-02-09
### Changed
- Updated package dependencies

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
