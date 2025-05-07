## [3.1.21] - 2025-04-28
### Fixed
- Code: Use modern font MIME types for inline fonts. [#43227]
- Linting: Fix more Stylelint violations. [#43213]

## [3.1.20] - 2025-04-14
### Fixed
- Linting: Update stylesheets to use WordPress rules for fonts and colors. [#42920] [#42928]
- Linting: Use double colon notation for pseudo-element selectors. [#43019]

## [3.1.19] - 2025-04-01
### Changed
- Update package dependencies. [#42762]

## [3.1.18] - 2025-02-24
### Changed
- Update dependencies.

## [3.1.17] - 2025-01-09
### Fixed
- Remove `module` in package.json given it's a CommonJS package. [#40867]

## [3.1.16] - 2025-01-06
### Changed
- Update package dependencies. [#40796] [#40798] [#40831]

### Deprecated
- Default import is now deprecated in favor of named import and will be removed in future.

### Fixed
- Expose built-in types in package.json file. [#40801]

## [3.1.15] - 2024-12-16
### Changed
- Internal updates.

## [3.1.14] - 2024-12-09
### Changed
- Internal updates.

## [3.1.13] - 2024-11-25
### Changed
- Update example with ids for jsx-a11y/label-has-associated-control. [#40199]

## [3.1.12] - 2024-11-14
### Changed
- Update dependencies.

## [3.1.11] - 2024-11-11
### Added
- Added post-build tests. [#38224]

### Changed
- Updated package dependencies. [#40000]

## [3.1.10] - 2024-10-25
### Changed
- Updated package dependencies. [#39893]

## [3.1.9] - 2024-10-14
### Fixed
- Add `key` in React example to make it more correct. [#39709]

## [3.1.8] - 2024-09-05
### Fixed
- Address React usage issues found by eslint in example.tsx. [#39214]

## [3.1.7] - 2024-08-23
### Changed
- Internal updates.

## [3.1.6] - 2024-08-21
### Fixed
- Revert recent SVG image optimizations. [#38981]

## [3.1.5] - 2024-08-19
### Fixed
- Lossless image optimization for images (should improve performance with no visible changes). [#38750]

## [3.1.4] - 2024-08-15
### Changed
- Updated package dependencies. [#38665]

## [3.1.3] - 2024-06-26
### Added
- Add: Substack logo [#38036]

## [3.1.2] - 2024-06-24
### Fixed
- Update logo color for Threads [#37977]

## [3.1.1] - 2024-06-14
### Changed
- Internal updates.

## [3.1.0] - 2024-06-13
### Added
- New icon: `deezer` [#37799]
- New icon: `discord` [#37799]
- New icon: `git` [#37799]
- New icon: `line` [#37799]
- New icon: `messenger` [#37799]
- New icon: `quora` [#37799]
- New icon: `snapchat` [#37799]
- New icon: `soundcloud` [#37799]
- New icon: `untappd` [#37799]
- New icon: `vk` [#37799]

### Fixed
- Build: Better error handling. [#37799]
- Build: Ensure consistent filename sort. [#37799]
- Build: Fonts folder was missing. [#37799]
- Build: React was missing example CSS file. [#37799]

## [3.0.2] - 2024-06-05
### Changed
- Updated package dependencies. [#37706]

## [3.0.1] - 2024-05-27
### Added
- Added TypeScript support. [#37528]

## [3.0.0] - 2024-05-23
### Added
- CSS file with encoded inline font is now automatically generated. [#36964]
- New icon: `json-feed` [#37517]
- New icon: `microblog` [#37517]
- New icon: `stackexchange` [#37517]
- New icon: `stackoverflow` [#37517]
- New icon: `tripadvisor` [#37517]
- Social logo colors CSS file is now included in source files. [#36964]
- Social Logos is now developed in the [Jetpack monorepo](https://github.com/Automattic/jetpack). [#36964]

### Changed
- Cleaned up outdated and irrelevant documentation. [#36964]
- Rewrote build system. [#36964]

### Removed
- PDF file is no longer built. [#36964]
- TTF font file is no longer built. [#36964]

### Fixed
- Example files are rewritten. [#36964]

## 2.5.9 - 2024-03-05

- New icon: `sms`

## 2.5.8 - 2023-12-20

- New icon: `bluesky`

## 2.5.7 - 2023-12-11

- Updated icon: `patreon`

## 2.5.6 - 2023-10-13

- Updated icon: `x`
- Removed unnecessary aria label attributes from Threads and X SVGs.

## 2.5.5 - 2023-09-15

- New icon: `x`

## 2.5.4 - 2023-07-10

- New icon: `threads`

## 2.5.3 - 2023-06-15

- New icon: `fediverse`
- New icon: `nextdoor`
- Updated dev dependencies and build tools.
- Updated icon font.

## 2.5.2 - 2023-02-01

- New icon: `mastadon`

## 2.5.1 - 2023-01-13

- React 18 support.

## 2.5.0 - 2022-02-01

- Added copy post url button.

## 2.4.0 - 2021-09-01

- Updated icon: `medium`
- Updated icon: `facebook`
- React 17 support.
- Update dev dependencies and build tools.

## 2.3.0 - 2021-01-27

- New icon: `medium-alt`
- New icon: `tiktok`
- New icon: `tiktok-alt`
- Updated icon: `medium`

## 2.2.0 - 2021-01-19

- New icon: `patreon`

## 2.1.2 - 2020-03-12

- Built the package with updated dependencies.

## 2.1.1 - 2020-03-10

- Build: Fixed bug where React component would render no icon at all (despite properly passed properties).

## 2.1.0 - 2018-01-31

- Build: Refactored (aligned build system with Gridicons).

[3.1.21]: https://github.com/Automattic/social-logos/compare/v3.1.20...v3.1.21
[3.1.20]: https://github.com/Automattic/social-logos/compare/v3.1.19...v3.1.20
[3.1.19]: https://github.com/Automattic/social-logos/compare/v3.1.18...v3.1.19
[3.1.18]: https://github.com/Automattic/social-logos/compare/v3.1.17...v3.1.18
[3.1.17]: https://github.com/Automattic/social-logos/compare/v3.1.16...v3.1.17
[3.1.16]: https://github.com/Automattic/social-logos/compare/v3.1.15...v3.1.16
[3.1.15]: https://github.com/Automattic/social-logos/compare/v3.1.14...v3.1.15
[3.1.14]: https://github.com/Automattic/social-logos/compare/v3.1.13...v3.1.14
[3.1.13]: https://github.com/Automattic/social-logos/compare/v3.1.12...v3.1.13
[3.1.12]: https://github.com/Automattic/social-logos/compare/v3.1.11...v3.1.12
[3.1.11]: https://github.com/Automattic/social-logos/compare/v3.1.10...v3.1.11
[3.1.10]: https://github.com/Automattic/social-logos/compare/v3.1.9...v3.1.10
[3.1.9]: https://github.com/Automattic/social-logos/compare/v3.1.8...v3.1.9
[3.1.8]: https://github.com/Automattic/social-logos/compare/v3.1.7...v3.1.8
[3.1.7]: https://github.com/Automattic/social-logos/compare/v3.1.6...v3.1.7
[3.1.6]: https://github.com/Automattic/social-logos/compare/v3.1.5...v3.1.6
[3.1.5]: https://github.com/Automattic/social-logos/compare/v3.1.4...v3.1.5
[3.1.4]: https://github.com/Automattic/social-logos/compare/v3.1.3...v3.1.4
[3.1.3]: https://github.com/Automattic/social-logos/compare/v3.1.2...v3.1.3
[3.1.2]: https://github.com/Automattic/social-logos/compare/v3.1.1...v3.1.2
[3.1.1]: https://github.com/Automattic/social-logos/compare/v3.1.0...v3.1.1
[3.1.0]: https://github.com/Automattic/social-logos/compare/v3.0.2...v3.1.0
[3.0.2]: https://github.com/Automattic/social-logos/compare/v3.0.1...v3.0.2
[3.0.1]: https://github.com/Automattic/social-logos/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/Automattic/social-logos/compare/v2.5.9...v3.0.0
