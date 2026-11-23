# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.1.0 - 2026-11-23
### Added
- Add a per-user preference that turns the teaser off. [#55244]
- Add the What's new script module, which a host mounts with `mountWhatsNew()`. [#55019]
- Give hosts the hook that reads and writes the switch that turns the teaser off. [#55245]
- Initial version. [#55009]
- Serve announcements over REST. [#55010]
- Show a teaser of the newest announcement, and the announcement in full in a dialog. [#55049]

### Changed
- Accept a slash in the name of a channel, so a host can name a channel for each of its pages. [#55255]
- Strip styles, classes and ids from the body of an announcement, and keep its URLs to http and https. [#55175]
