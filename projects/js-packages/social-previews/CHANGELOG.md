# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.3.4] - 2026-07-06
### Changed
- Update package dependencies. [#50097] [#50183]

## [3.3.3] - 2026-06-29
### Changed
- Update dependencies. [#50004]

## [3.3.2] - 2026-06-26
### Changed
- Update dependencies. [#49464]

## [3.3.1] - 2026-06-23
### Changed
- Internal updates.

## [3.3.0] - 2026-06-22
### Added
- Render an image focal point in the link previews via object-position. [#49687]

### Changed
- Update package dependencies. [#49594] [#49631] [#49691] [#49757]

### Fixed
- Use the caption/custom text as the source of truth for Bluesky, Facebook, Instagram, Mastodon and Nextdoor previews instead of appending the post URL. [#49745]

## [3.2.5] - 2026-06-15
### Changed
- Update package dependencies. [#49273]

### Fixed
- Render hyperlinks as clickable links in Bluesky and Tumblr previews. [#49483]

## [3.2.4] - 2026-06-08
### Changed
- Update dependencies. [#49354]

### Fixed
- Avoid having the Mastodon share preview show post URL twice when the custom message already includes it. [#49338]

## [3.2.3] - 2026-05-25
### Changed
- Update package dependencies. [#48405] [#49012]

## [3.2.2] - 2026-05-19
### Changed
- Update dependencies. [#48778]

## [3.2.1] - 2026-05-11
### Changed
- Update dependencies.

## [3.2.0] - 2026-05-04
### Changed
- Align per-network preview body char limits with each platform's actual limit. [#48413]
- Add a "See more" toggle for captions over 400 chars. [#48413]
- Stop hiding URLs that the user embedded in custom message templates on Bluesky and X. [#48413]
- Internal: No longer require automattic/jetpack-changelogger as a per-project dev dependency. [#48225]

### Fixed
- Count Unicode codepoints when truncating text so emoji-heavy strings are not over-truncated. [#48294]
- Social previews: Avoid duplicated URL in Facebook, Bluesky, Instagram, LinkedIn, and Nextdoor previews when the custom text already contains the post URL. [#48294]

## [3.1.4] - 2026-04-20
### Changed
- Update package dependencies. [#48106]

## [3.1.3] - 2026-04-13
### Changed
- Update package dependencies. [#47890]

### Fixed
- Google Search preview: Show a generic globe placeholder when the site has no site icon, instead of a broken image. [#48039]

## [3.1.2] - 2026-04-06
### Changed
- Update package dependencies. [#47886]

## [3.1.1] - 2026-03-30
### Changed
- Update package dependencies. [#47799]

## [3.1.0] - 2026-03-23
### Added
- Google Search Preview: Add optional siteIcon prop to allow passing a custom favicon URL. [#47551]

### Changed
- Update package dependencies. [#47684]

## [3.0.12] - 2026-03-16
### Changed
- Update dependencies. [#47472]

## [3.0.11] - 2026-03-09
### Changed
- Switch to Native TypeScript compiler based on Go. [#47375]

## [3.0.10] - 2026-02-26
### Changed
- Update package dependencies. [#47285] [#47300]

## [3.0.9] - 2026-02-19
### Changed
- Internal updates.

## [3.0.8] - 2026-02-18
### Added
- Add notice for Threads link preview when no image is provided. [#47142]

### Changed
- Set `.repository.url` in `package.json` to the mirror repo rather than the monorepo. [#47149]

## [3.0.7] - 2026-02-16
### Changed
- Update package dependencies. [#47099]

### Removed
- Remove custom text for Tumblr preview in favor of description. [#47075]

### Fixed
- Compatibility: Clean up deprecated CSS. [#47067]

## [3.0.6] - 2026-02-10
### Changed
- Update package dependencies. [#46933]

## [3.0.5] - 2026-02-02
### Changed
- Update package dependencies. [#46854]

## [3.0.4] - 2026-01-26
### Changed
- Use fallback image when social preview profile picture fails. [#46674]

## [3.0.3] - 2026-01-19
### Changed
- Update package dependencies. [#46647]

## [3.0.2] - 2026-01-14
### Changed
- Update package dependencies. [#46552]

## [3.0.1] - 2026-01-12
### Changed
- Update package dependencies. [#46456]

## [3.0.0] - 2025-12-22
### Added
- Add Threads and Bluesky preview. [#46313]

### Changed
- Bundle the package CSS instead of exposing SASS files. CSS now needs to be imported explicitly. [#46355]
- Improved preview for LinkedIn and Tumblr. [#46364]

### Removed
- Remove the learn more link for link previews. [#46313]

### Fixed
- Fix Bluesky preview header styles. [#46382]
- Fix distorted image for Tumblr preview. [#46313]
- Fix Mastodon preview description overflow. [#46313]
- Fix media image URL for Tumblr and Instagram previews. [#46313]

## 2.0.1 - 2024-06-10

- Added Mastodon, Instagram and Nextdoor previews.
- Fixed hyperlinks for Facebook.
- Fixed multiple empty lines issue in preview text.
- Fixed video previews for Instagram and Tumblr.
- Fixed empty Twitter preview when no text/description is provided.
- Changed Twitter text and icon to X.
- Switch dependency from `classnames` to `clsx`.

## 2.0.0 - 2023-05-24

- Converted the package to TypeScript.
- Added LinkedIn and Tumblr previews.
- Updated Google Search, Facebook and Twitter previews to match their latest designs.
- Created separate components for each of the Social Media previews e.g. `TumblrLinkPreview`, `TumblrPostPreview` and `TumblrPreviews`.

## 1.1.5 - 2022-08-24

- Declare an optional peer dependency on `@babel/runtime`, for CommonJS environments. This dependency already existed previously, it just wasn't declared.

## 1.1.4 - 2022-05-25

- Add missing dependency on `@emotion/react`.

## 1.1.3 - 2022-05-16

- Remove unnecessary peer dependencies on `@wordpress/data`, `reakit-utils`, and `redux`.
- Add missing peer dependency on `react-dom`.

## 1.1.2 - 2022-05-13

- Dependency updates and internal code cleanup.

## 1.1.1 - 2021-04-05

- Ensure that lengthy text doesn't overflow in the Twitter preview.

## 1.1.0 - 2020-09-10

- Twitter: Add previewing for attached images, videos, or quoted tweets.
- Twitter: Add support for previewing entire threads.

## 1.0.4 - 2020-08-24

- Fixed Twitter styles for viewports < 600px in width

## 1.0.3 - 2020-08-21

- Refreshed styles of Twitter, Facebook and Google previews to match their latest design.

## 1.0.2 - 2020-08-03

- Remove `i18n-calypso` dependency by removing search preview header.
- Strip html tags from descriptions for social previews.
- Add helper function with enhanced regex for stripping html tags.

## 1.0.1 - 2020-07-23

- Mark CSS and SCSS files as `sideEffects` to ensure they are not discarded during build processes tree-shaking.

## 1.0.0 - 2020-07-22

- Initial release after extracting from Calypso.

[3.3.4]: https://github.com/Automattic/social-previews/compare/v3.3.3...v3.3.4
[3.3.3]: https://github.com/Automattic/social-previews/compare/v3.3.2...v3.3.3
[3.3.2]: https://github.com/Automattic/social-previews/compare/v3.3.1...v3.3.2
[3.3.1]: https://github.com/Automattic/social-previews/compare/v3.3.0...v3.3.1
[3.3.0]: https://github.com/Automattic/social-previews/compare/v3.2.5...v3.3.0
[3.2.5]: https://github.com/Automattic/social-previews/compare/v3.2.4...v3.2.5
[3.2.4]: https://github.com/Automattic/social-previews/compare/v3.2.3...v3.2.4
[3.2.3]: https://github.com/Automattic/social-previews/compare/v3.2.2...v3.2.3
[3.2.2]: https://github.com/Automattic/social-previews/compare/v3.2.1...v3.2.2
[3.2.1]: https://github.com/Automattic/social-previews/compare/v3.2.0...v3.2.1
[3.2.0]: https://github.com/Automattic/social-previews/compare/v3.1.4...v3.2.0
[3.1.4]: https://github.com/Automattic/social-previews/compare/v3.1.3...v3.1.4
[3.1.3]: https://github.com/Automattic/social-previews/compare/v3.1.2...v3.1.3
[3.1.2]: https://github.com/Automattic/social-previews/compare/v3.1.1...v3.1.2
[3.1.1]: https://github.com/Automattic/social-previews/compare/v3.1.0...v3.1.1
[3.1.0]: https://github.com/Automattic/social-previews/compare/v3.0.12...v3.1.0
[3.0.12]: https://github.com/Automattic/social-previews/compare/v3.0.11...v3.0.12
[3.0.11]: https://github.com/Automattic/social-previews/compare/v3.0.10...v3.0.11
[3.0.10]: https://github.com/Automattic/social-previews/compare/v3.0.9...v3.0.10
[3.0.9]: https://github.com/Automattic/social-previews/compare/v3.0.8...v3.0.9
[3.0.8]: https://github.com/Automattic/social-previews/compare/v3.0.7...v3.0.8
[3.0.7]: https://github.com/Automattic/social-previews/compare/v3.0.6...v3.0.7
[3.0.6]: https://github.com/Automattic/social-previews/compare/v3.0.5...v3.0.6
[3.0.5]: https://github.com/Automattic/social-previews/compare/v3.0.4...v3.0.5
[3.0.4]: https://github.com/Automattic/social-previews/compare/v3.0.3...v3.0.4
[3.0.3]: https://github.com/Automattic/social-previews/compare/v3.0.2...v3.0.3
[3.0.2]: https://github.com/Automattic/social-previews/compare/v3.0.1...v3.0.2
[3.0.1]: https://github.com/Automattic/social-previews/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/Automattic/social-previews/compare/v2.0.1...v3.0.0
