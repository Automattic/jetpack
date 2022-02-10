# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.1.0 - 2022-02-01
### Added
- Added addons-essentials to the dependencies
- Added storybook package for generating component previews
- Add Gutenberg components tree to the storybook
- Add jetpack-connection package to Storybook config.
- Add support for base-style stories
- Add support for the IDC package stories.
- Storybook: Expose my-jetpack components

### Changed
- Allow Node ^14.17.6 to be used in this project. This shouldn't change the behavior of the code itself.
- General: update required node version to v16.13.2
- Publish to a mirror repo rather than the `gh-pages` branch.
- Tests: update PHPUnit polyfills dependency (yoast/phpunit-polyfills).
- Updated package dependencies.
- Update webpack version to match other monorepo packages
- Use Node 16.7.0 in tooling. This shouldn't change the behavior of the code itself.

### Removed
- removed knobs dependency
- Remove use of deprecated `~` in sass-loader imports.

### Fixed
- fixed babel/preset-react dependency
- GH only allows pages to be in `/` or `/docs`, so build to `/docs`.
