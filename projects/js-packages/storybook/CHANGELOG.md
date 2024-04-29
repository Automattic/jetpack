# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.4.1 - 2024-02-07
### Added
- Add AI Client icon components [#32079]
- Added boost back to storybook [#34180]
- Storybook: register ./extensions folder of the Jetpack plugin project [#33771]

### Changed
- Boost: Updated storybook configuration to allow scss imports in boost stories. [#32690]
- Jetpack Boost: Remove Jetpack Boost stories while in the React refactor [#34103]
- Updated package dependencies.

### Fixed
- Storybook: remove Jetpack plugin from deps to fix builds in trunk [#33784]

## 0.4.0 - 2023-07-06
### Added
- Import root styles from js-packages to load root variables used by components [#30037]

### Changed
- Updated package dependencies.

### Fixed
- Update config to work around some bugs so `NODE_PATH` is no longer needed when running storybook. [#31607]

## 0.3.2 - 2023-04-07
### Added
- Include VideoPress block editor folder to the stories

### Changed
- Update to React 18.

## 0.3.1 - 2023-01-11
### Changed
- Updated package dependencies.

## 0.3.0 - 2022-11-01
### Added
- Added support for scanning the dashboard project from the Search package
- Add VideoPress package folder to projects
- VideoPress: Support selecting poster by frame

### Fixed
- StoryBook: fix unexistent package bug

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
