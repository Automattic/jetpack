# Changelog

## 3.1.3 - 2022-09-20
### Changed
- Renaming `master` references to `trunk` [#24712]
- Updated package dependencies.

## 3.1.2 - 2022-06-08
### Added
- Adding trunk branch cases in preparation for monorepo branch renaming
- Set `Update URI` in the plugin header.

### Changed
- PHPCS: Fix `WordPress.Security.ValidatedSanitizedInput`
- Updated package dependencies.

### Fixed
- Download from the correct URL when updating to a version tagged like "v3.1.1" rather than "3.1.1".
- Ensure that WP CLI is present before extending the class.
- Fixed testing tips links

## 3.1.1 - 2022-03-01
### Added
- Added docs to JS file.

### Changed
- Updated composer.lock

## 3.1.0 - 2021-12-08
### Added
- Added an action to auto-create a GitHub release when a version is tagged.
- Improved exception handling when network access to a8c servers is impaired.

### Changed
- Updated Beta release instructions to avoid extra MacOS files in the ZIP.
- Updated package dependencies

## 3.0.3 - 2021-10-06
### Changed
- Updated package dependencies.

### Fixed
- Remove unused variable in plugin-select.template.php.

## 3.0.2 - 2021-07-29
### Added
- Use WP core's ajax updater to apply updates.

### Fixed
- Detect when "Bleeding Edge" needs an update.
- Fix search when branch name contains multiple `-`.
- Guard against an undefined index warning.
- Typo fix.

## 3.0.1 - 2021-07-19
### Added
- Add small breadcrumb link to get back to the main plugin selection screen.

### Fixed
- Correctly handle self-autoupgrades when the release tag begins with "v".
- Fixes non-breaking JS errors.

## 3.0.0 - 2021-07-14
### Added
- Added support for more than just the Jetpack plugin. This involved a major code restructuring.
- Created a changelog from the git history with help from [auto-changelog](https://www.npmjs.com/package/auto-changelog). It could probably use cleanup!
- Provide a soft failure if activating an unbuilt development version of the Beta plugin.
- Testing Tips: Add tips to help testers get started.

### Changed
- Enable autotagger and update release instructions.
- Remove composer dev-monorepo hack.
- Update package dependencies.

### Removed
- Remove the `jetpack_autoload_dev` option and the `JETPACK_AUTOLOAD_DEV` constant update.

### Fixed
- Fix autoloader issue in prodution build.

## 2.4.6 - 2021-02-08

- Prevents updating stable version of Jetpack when using beta plugin in Docker instance.
- Fixes some errant copy appearing in the beta plugin welcome message.
- Sets the JETPACK_AUTOLOAD_DEV constant to true when a development version of Jetpack is activated.

## 2.4.5 - 2021-01-25

- Resolves a conflict between stable and beta Jetpack versions with the autoloader.

## 2.4.4 - 2021-01-05

- Avoids PHP notice for an unset array key if an option is not set.
- Updates the color to match the latest per the [Jetpack color guidelines](https://color-studio.blog).

## 2.4.3 - 2020-04-01

- Avoid Fatal errors when switching between branches that might be at different base version of the code.

## 2.4.2 - 2020-01-21

- Avoid Fatal errors; when Jetpack's vendor directory cannot be found, do not attempt to update.
