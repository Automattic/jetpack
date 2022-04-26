# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.1.0 - 2022-04-26
### Added
- Added an empty shell package
- Added Publicize module files to Composer package
- Set composer package type to "jetpack-library" so i18n will work.
- Use the publicize package in the Jetpack plugin.

### Changed
- Applied legacy Publicize filters to flag setting for Publicize
- Fix Composer dependencies
- Microperformance: Use === null instead of is_null
- PHPCS: Fix `WordPress.Security.ValidatedSanitizedInput`
- Publicize: Do not display legacy UI for block editor pages
- Sync'd changes with the equivalent files in the Publicize module
- Updated package dependencies.
- Update package.json metadata.
