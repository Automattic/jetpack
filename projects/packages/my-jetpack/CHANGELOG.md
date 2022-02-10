# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2022-02-09
### Added
- Add Boost interstitial cmp.
- Add has_required_plan to product info and implement method in Search
- Add Product princign harcoded data
- Add search product data
- Add title and features to products data
- anti spam product class
- Connect Boost card with the interstitial page via /add-boost root
- Fire Tracks event when clicking CTA button on product Interstitial page
- Fire Tracks event when clicking Manage button on product card
- Fire Tracks event when clickn Add link on My Jetpack product card
- Fire Tracks event when showing the Interstitial page
- Implement Free price for Boost product
- Implement Search product interstitial
- Introduce basic Layout component. Add GoBackLink component
- Introduce ProductDetailCard component
- My Jetpack: Add Connection screen
- Pass slug prop to ProductCard'
- Plan verification for Backup and Scan
- Restore getProduct() resolver
- Set the checkout URL for the Product detail component
- useCallback for functions that are bound to onEvents

### Changed
- My Jetpack: Implement handler of connection notices
- My Jetpack: Update notice style and implements redirect for connection route
- Support multiple possible folder for each plugin
- Updated package dependencies

### Removed
- dependency from search package

### Fixed
- Fix My Jetpack's reducer for SET_PRODUCT_STATUS
- Fix the redirect URL value
- Show discounted price in Product Detail card
- typo

## [0.5.0] - 2022-02-02
### Added
- Added plugin installation functionality
- Adds Tracks events for activating and deactivating products from the product cards
- Fixes stories for ProductCard component
- Handle when site is not connected
- Initial approach to handle global notice
- Module Products
- My Jetpack: Add route handling
- My Jetpack: connect all product cards with data provider
- My Jetpack: connect Backup product class with Product class. Add long description and features fields.
- My Jetpack: handle redirect when no connection #22549
- My Jetpack: reorganize stores by project/name
- Remove getProduct() resolver
- Support to Hybrid products
- Tweak dimms of the Product card status
- Update data handling - Implement request status in Product Card
- User connection requirement to product info
- uses the Plugin Installer package to safely checks plugins statuses

### Changed
- Added filter for disabling the initialization of the My Jetpack package
- Build: remove unneeded files from production build.
- Do not initialize My Jetpack id site is not connected
- My Jetpack: Refactor styles to use layout components and theme provider
- My Jetpack: Update gap between product cards section
- Pick API root and nonce values from a new window var myJetpackRest
- Updated package dependencies.
- Update plugin absent status consistently

### Fixed
- added unit test mock for new global variable myJetpackRest
- Fix tests
- Fix unsafe optional chaining.
- my-jetpack: fix tracking event when activating product
- Resolved minor code standard violation after implementing a stricter rule.

## [0.4.0] - 2022-01-25
### Added
- add API endpoints to manipulate products
- Added css module for My Jetpack Plans Section
- Added useAnalytics hook
- Added Visitor class for status regarding the site visitor.
- Add first data approach
- Add Products and REST_Products basic classes
- Adds very basic product cards section component to my jetpack
- My Jetpack: Add Product Card component
- My Jetpack: check user connectivity before to hit wpcom side
- My Jetpack: Implement data handling for enable/disable products
- Removed endpoint plans superseded by purchases

### Changed
- Add Connections Section wrapping the Connection Status Card to My Jetpack
- Build: do not ship raw files in production bundle.

### Removed
- Remove unused usePlans() custom react hook

### Fixed
- Fixed svg attribute strokeWidth for Boost Card

## [0.3.3] - 2022-01-18
### Added
- Added redux store specific to my-jetpack
- Implement plans list properly in the PlansSection
- My Jetpack: Add scripts for JS tests
- My Jetpack: Include wordpress components as dep
- Reduxify purchases data

### Changed
- General: update required node version to v16.13.2
- Properly style the Plans Section according to proposed design
- Updated package dependencies.

## [0.3.2] - 2022-01-13
### Added
- My Jetpack: add story to `<PlanSection />` component
- My Jetpack: first PlanSection implementation

### Fixed
- Rename method enqueue_scritps to enqueue_scripts

## [0.3.1] - 2022-01-11
### Added
- Add devvelopment testing instructions to doc.

### Changed
- Updated package dependencies.

### Removed
- Remove use of deprecated `~` in sass-loader imports.

## [0.3.0] - 2022-01-04
### Changed
- Drop isRegistered and isUserConnected params from ConnectionStatusCard component
- Switch to pcov for code coverage.
- Updated package dependencies.
- Updated package textdomain from `jetpack` to `jetpack-my-jetpack`.

## [0.2.0] - 2021-12-14
### Added
- Added Connection Status Card to the page.
- Janitorial: add watch command to the plugin.

### Changed
- Adapt to new layout components.
- Build: do not ship scss and jsx files in production build.

### Fixed
- Build minimized JS for the production build.
- Fix JavaScript i18n strings.

## [0.1.3] - 2021-12-07
### Changed
- Updated package dependencies.

## [0.1.2] - 2021-11-30
### Added
- Janitorial: create mirror repo for the package.

### Changed
- Remove now-redundant `output.filename` from Webpack config.

## 0.1.1 - 2021-11-23
### Changed
- Updated package dependencies.

## 0.1.0 - 2021-11-17
### Added
- Created package

[0.6.0]: https://github.com/Automattic/jetpack-my-jetpack/compare/0.5.0...0.6.0
[0.5.0]: https://github.com/Automattic/jetpack-my-jetpack/compare/0.4.0...0.5.0
[0.4.0]: https://github.com/Automattic/jetpack-my-jetpack/compare/0.3.3...0.4.0
[0.3.3]: https://github.com/Automattic/jetpack-my-jetpack/compare/0.3.2...0.3.3
[0.3.2]: https://github.com/Automattic/jetpack-my-jetpack/compare/0.3.1...0.3.2
[0.3.1]: https://github.com/Automattic/jetpack-my-jetpack/compare/0.3.0...0.3.1
[0.3.0]: https://github.com/Automattic/jetpack-my-jetpack/compare/0.2.0...0.3.0
[0.2.0]: https://github.com/Automattic/jetpack-my-jetpack/compare/0.1.3...0.2.0
[0.1.3]: https://github.com/Automattic/jetpack-my-jetpack/compare/0.1.2...0.1.3
[0.1.2]: https://github.com/Automattic/jetpack-my-jetpack/compare/0.1.1...0.1.2
