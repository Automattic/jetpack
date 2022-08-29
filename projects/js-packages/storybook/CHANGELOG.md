# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.2.0 - 2022-07-06
### Added
- Add 'Jetpack Dashboard' background color. [#22597]
- Added TypeScript support. [#23522]
- Add missing JavaScript dependencies. [#24096]
- Add missing JS peer dependencies. [#23456]
- Declare cross-project build dependencies to ensure that the storybook is rebuilt when those are changed. [#22718]
- Storybook: Add protect into storybook projects list. [#23780]
- Test that projects in `storybook/projects.js` are listed as extra build dependencies in composer.json. [#24188]
- Try using `storybook-addon-turbo-build` to speed up the build. [#22774]

### Changed
- Reorder JS imports for `import/order` eslint rule. [#24601]
- Storybook: Remove base-styles in favor of ThemeProvider [#23386]
- Update package.json metadata. [#23990]
- Updated package dependencies.

### Removed
- Disable generation of sourcemaps. [#22743]
- Remove unneeded dependencies. [#23391]

### Fixed
- Fix styles defined by the ThemeProvider in the storybook stories [#24527]

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
