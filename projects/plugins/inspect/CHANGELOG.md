# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0-a.11] - 2026-04-10
### Changed
- Dependencies: Update lock file to keep root requirements in sync. [#47418]
- Remove baseUrl from tsconfig for tsgo migration. [#47374]
- Remove header border-bottom from the admin page for a cleaner unified header appearance. [#47313]
- Switch to Native TypeScript compiler based on Go. [#47375]
- Update dependencies. [#47472]
- Update design of the sidebar upsell. [#47909]
- Update package dependencies. [#46552] [#46647] [#46785] [#46854] [#47021] [#47099] [#47229] [#47300] [#47337] [#47498] [#47505] [#47610] [#47684] [#47890] [#47998]

### Removed
- General: Update minimum WordPress version to 6.8. [#46801]

### Fixed
- Admin Page: Restore border on header component. [#47425]
- Compatibility: Clean up deprecated CSS. [#47067]

## [2.0.0-a.9] - 2026-01-09
### Added
- IDC: Add revalidation for IDCs. [#46268]
- Tested up to WordPress 6.9 [#45571]

### Changed
- Update package dependencies. [#45478] [#45652] [#45915] [#46143] [#46456]

### Fixed
- Ensure proper flags are used with `json_encode()`. [#46117]

## [2.0.0-a.7] - 2025-10-09
### Added
- Add `typecheck` script to ensure that TypeScript files are type-checked. [#45034]

### Changed
- Update package dependencies. [#44677] [#44701] [#44725] [#44901] [#45027] [#45096] [#45097] [#45127] [#45229] [#45241] [#45334]

## [2.0.0-a.5] - 2025-08-05
### Changed
- My Jetpack: Unify the user connection flow with a unified screen. [#44469]
- Update package dependencies. [#43839] [#44020] [#44148] [#44151] [#44206] [#44356]

### Fixed
- Autoloader: Prevent double slash in autoloader path. [#44030]

## [2.0.0-a.3] - 2025-06-05
### Changed
- Code: First pass of style coding standards. [#42734]
- Update package dependencies. [#43085] [#43326] [#43398] [#43400] [#43425] [#43578] [#43734] [#43766]

### Removed
- General: Update minimum WordPress version to 6.7. [#43192]

### Fixed
- Code: Update stylesheets to use hex instead of named colors. [#42920]
- JS Packages: Decrease CSS priority of global styles to prevent them from applying within the editor. [#43035]
- Linting: Do additional stylesheet cleanup. [#43247]
- Linting: Fix more Stylelint violations. [#43213]

## 2.0.0-a.1 - 2025-04-04
### Added
- Added an initial version of Jetpack Inspect to the Jetpack Monorepo. [#31551]

### Changed
- General: Update minimum PHP version to 7.2. [#40147]
- General: Indicate compatibility with WordPress 6.8. [#42701]

[2.0.0-a.11]: https://github.com/Automattic/jetpack-inspect/compare/v2.0.0-a.9...v2.0.0-a.11
[2.0.0-a.9]: https://github.com/Automattic/jetpack-inspect/compare/v2.0.0-a.7...v2.0.0-a.9
[2.0.0-a.7]: https://github.com/Automattic/jetpack-inspect/compare/v2.0.0-a.5...v2.0.0-a.7
[2.0.0-a.5]: https://github.com/Automattic/jetpack-inspect/compare/v2.0.0-a.3...v2.0.0-a.5
[2.0.0-a.3]: https://github.com/Automattic/jetpack-inspect/compare/v2.0.0-a.1...v2.0.0-a.3
