# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[3.0.0]: https://github.com/Automattic/social-previews/compare/v2.0.1...v3.0.0
