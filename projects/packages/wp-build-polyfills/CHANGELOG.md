# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.1.0 - 2026-03-23
### Added
- Create wp-build polyfills package. [#47367]

### Changed
- Update @wordpress/boot version [#47644]
- Update package dependencies. [#47684]

### Fixed
- Add @wordpress/ui to devDependencies so the boot module bundles it instead of externalizing it as an unregistered wp-ui script handle, which caused a blank page at runtime. [#47727]
