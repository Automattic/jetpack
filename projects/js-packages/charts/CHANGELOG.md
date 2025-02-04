# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.1] - 2025-02-04
### Changed
- Internal updates.

## [0.7.0] - 2025-01-31
### Added
- Automatic margin for axis labels [#41325]
- Charts: adds tests and fixes to bar chart component [#41296]
- Charts: adds tests for line chart component [#41174]
- Line chart: draw x-axis and ticks [#41346]
- Line chart: use natural curve [#41293]
- Y axis non-zero start for line chart [#41291]

### Changed
- Introduce `children` PieChart property [#41289]
- Only use area line for line chart [#41292]
- Updated package dependencies. [#41286]

## [0.6.0] - 2025-01-23
### Changed
- size props renamed to width for semi circle chart [#41270]

## [0.5.0] - 2025-01-22
### Changed
- Simplify rollup config and remove a cjs import [#41266]

## [0.4.0] - 2025-01-22
### Added
- Added passing through options for X, Y axis [#41109]
- Add gradient fill for line chart [#41143]
- Charts: add responsive chart stories [#41018]
- Charts: adds dependencies and config for jest testing. Adds some initial tests to pie chart component [#41148]
- Charts: adds more pie chart tests [#41175]

### Changed
- Changed back to build with Rollup [#41234]
- Introduce gapScale and cornerScale properties [#41033]
- PieChart: iterate a bit over component API [#40993]

## [0.3.0] - 2025-01-12
### Changed
- make charts responsive [#40922]

### Fixed
- Fixed React reference [#40978]

## [0.2.3] - 2025-01-12
### Changed
- Replace Rollup with Webpack for charts [#40912]
- Updated package dependencies. [#40841]

## [0.2.2] - 2025-01-03
### Changed
- Switching esbuild to rollup for better treeshaking. [#40817]
- Updated package dependencies. [#40798]

## [0.2.1] - 2024-12-31
### Added
- Added dist to mirror repo [#40776]

## [0.2.0] - 2024-12-31
### Added
- Charts: adds grid component to charts [#40683]

### Fixed
- Fixing incorrect TS build. [#40761]

## 0.1.0 - 2024-12-20
### Added
- Adding a theme provider to Automattic Charts [#40558]
- Adding build option for Charts. [#40676]
- Adding new chart type - pie chart. [#40581]
- Adding new chart type. [#40466]
- Adding support for multiple data series to the Bar chart component. [#40641]
- Adding support for mutliple data series for the line charts. [#40605]
- Chart library: add legend component [#40594]
- Charts: adds Barchart functionality and storybook item [#40353]
- Charts: adds tooltip component [#40495]
- Initial version. [#40250]

### Changed
- Chart Library: Update tooltip component [#40582]
- Update PieSemiCircleChart component [#40625]

### Fixed
- Fixed lints following ESLint rule changes for TS [#40584]
- Fixing a bug in Chart storybook data. [#40640]

[0.7.1]: https://github.com/Automattic/charts/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/Automattic/charts/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/Automattic/charts/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/Automattic/charts/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/Automattic/charts/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/Automattic/charts/compare/v0.2.3...v0.3.0
[0.2.3]: https://github.com/Automattic/charts/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/Automattic/charts/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/Automattic/charts/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Automattic/charts/compare/v0.1.0...v0.2.0
