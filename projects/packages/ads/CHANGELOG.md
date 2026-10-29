# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.6] - 2026-10-28
### Changed
- Internal updates.

## [0.1.5] - 2026-10-26
### Changed
- Require widget contract 2.0.0 of the Premium Analytics dashboard. [#53885]
- WordAds earnings history widget: Show the View all link and the adjustments count in the card footer. [#53881]

### Fixed
- Widget titles, descriptions, help notes and chart type labels declared in widget.json reach the translation catalog. [#53850]

## [0.1.4] - 2026-10-19
### Changed
- Earnings history widget: Say when the first earnings will show up while there are none yet. [#53520]
- Update package dependencies. [#53004]

### Fixed
- Name the Ads summary chart after its widget, so screen readers can tell it apart from the other dashboard charts. [#53333]

## [0.1.3] - 2026-10-12
### Changed
- WordAds chart: Draw today's bucket as not yet counted for Ads Served and Revenue too, and say so in the tooltip. [#53229]
- WordAds chart: Start on the reader's current default range rather than the one in effect when the page loaded. [#53276]

## [0.1.2] - 2026-10-05
### Changed
- Earnings History widget: Link to the Adjustments history as an Adjustments link with a count badge, rather than a badge that is itself the link. [#52752]

## [0.1.1] - 2026-09-29
### Changed
- Internal updates.

## 0.1.0 - 2026-09-28
### Added
- Register the Ads section and its widget types on the Premium Analytics dashboard. [#52635]

[0.1.6]: https://github.com/Automattic/jetpack-ads/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/Automattic/jetpack-ads/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/Automattic/jetpack-ads/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/Automattic/jetpack-ads/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/Automattic/jetpack-ads/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/Automattic/jetpack-ads/compare/v0.1.0...v0.1.1
