# Changelog

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
