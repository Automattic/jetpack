# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2026-02-26
### Changed
- Use the new `Images` class instead of `Jetpack_PostImages` in Twitter Cards. [#47249]

## 0.1.0 - 2026-02-23
### Added
- Add `Images` class (copy of `Jetpack_PostImages`) for extracting images from WordPress posts. [#47208]
- Add `Shortcodes` class with methods to extract media identifiers from shortcode attributes (YouTube, Vimeo, TED, VideoPress, Hulu, Archive.org). [#47200]
- Initial version. [#47164]
- Twitter Cards: Add `Twitter_Cards` class with methods for generating Twitter Card meta tags. [#47169]

[0.1.1]: https://github.com/Automattic/jetpack-post-media/compare/v0.1.0...v0.1.1
