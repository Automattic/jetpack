# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - 2023-02-15
### Changed
- Update form-styles script to prevent blurred forms on slow loading pages [#28973]

## [0.4.0] - 2023-02-15
### Added
- Added response list table to the new feedback dashboard [#28821]
- Added the template for the response view in the new feedback dashboard [#28877]
- Add new method to reverse print_r output as stored on the feedback posts. Use it to try and parse the form fields, fallback to old method. [#28815]

### Changed
- Update to React 18. [#28710]

### Fixed
- Add filter to prevent contact-form-styles script from being concatenated [#28905]
- Configure with standard `@wordpress/browserslist-config` config. [#28910]
- Prevent Forms blur effect on AMP pages [#28926]

## [0.3.0] - 2023-02-08
### Added
- Add "watch" entries for both composer and package .json files. This allows us to run `jetpack watch packages/forms` while working on JS things [#28704]
- Add tooling for building the Jetpack Forms Dashboard [#28689]
- Moved contact form PHP files to automattic/jetpack-forms [#28574]
- Move Forms blocks to Forms package [#28630]

### Changed
- Forms: Update Form package with latest contact-form changes from trunk [#28752]
- Reorder export columns in 3 groups: response meta (title, source, date), response field values, response extra (consent, ip address) [#28678]

## [0.2.0] - 2023-01-26
### Added
- Moved contact form static files into the new forms package [#28417]

## 0.1.0 - 2023-01-23
### Added
- Added a new jetpack/forms package [#28409]
- Added a public load_contact_form method for initializing the contact form module. [#28416]

[0.5.0]: https://github.com/automattic/jetpack-forms/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/automattic/jetpack-forms/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/automattic/jetpack-forms/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/automattic/jetpack-forms/compare/v0.1.0...v0.2.0
