# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.15.0] - 2025-06-30
### Added
- Add new `legendHorizontalAlign` and `legendVerticalAlign` props to chart legend components, allowing flexible positioning of legends. [#43979]
- Bar chart: Support date literal parsing. [#44101]
- Line chart: Add annotation support. [#43978]
- Update exports config to work with Jetpack. [#43870]

### Changed
- Replace absolute positioning with flexbox. [#44085]
- Update package dependencies. [#44020]

### Removed
- Remove unused `legendAlign` references and consolidate legend storybook item grouping. [#44100]
- Remove unused `legend-stories.tsx` file. [#44120]

### Fixed
- Fix chart flickering on initial load. [#44062]
- Fix internal resolution in Jetpack monorepo. [#44102]
- Line chart: Remove duplicate stories and centralize story config. [#43994]
- Properly pass `key` to JSX. [#44128]

## [0.14.0] - 2025-06-16
### Added
- Allow setting the glyphs array in the theme to have these rendered in the line chart [#43875]
- Bar chart: Add support for pattern fill for accessibility [#43812]
- Line chart: Add support for Tooltip crosshairs [#43921]
- Show glyph in legends [#43851]

### Changed
- Line chart: Organise stories for easier browsing [#43922]

### Fixed
- Fix useElementHeight hook to use a callback ref for reliable height measurement [#43896]

## [0.13.0] - 2025-06-11
### Added
- Add responsive configuration options for charts [#43871]
- Add supports for customizing legend label/container styles [#43868]
- Charts: Add support for the glyph at the start of the line chart [#43819]
- Support date literals [#43791]

### Changed
- Janitorial: clean up dependency versions. [#43841]
- Set SVG overflow to visible in bar-chart and line-chart styles [#43869]

### Fixed
- Chart components now subtract legend height from total height, ensuring the rendered chart (including legend) does not exceed the specified height prop [#43844]
- Fix default bar chart gridVisibility [#43845]
- Fix output CSS file name [#43842]

## [0.12.1] - 2025-06-06
### Fixed
- Fix @automattic/number-formatters dependency issue [#43813]

## [0.12.0] - 2025-06-06
### Added
- Add bar list chart component [#43763]
- Added support for customizable legend shapes/styles [#43792]
- Charts: Expose types from the charts library and visx package [#43723]
- Enhance BarChart component to support horizontal orientation [#43741]
- Support tick dasharray overridden by series data [#43761]

### Changed
- Add dynamic chart margin calculation and improve Y-axis tick formatting [#43679]
- Refactor BarChart to use @visx/xychart [#43677]
- Update dependencies. [#43068]
- Update package dependencies. [#43326]
- Update package dependencies. [#43354]
- Update package dependencies. [#43398]
- Update package dependencies. [#43399]
- Update package dependencies. [#43400]
- Update package dependencies. [#43516]
- Update package dependencies. [#43578]
- Update package dependencies. [#43718]
- Update package dependencies. [#43734]
- Update package dependencies. [#43766]

### Removed
- Removed animation for line and bar charts [#43809]

### Fixed
- Charts: use color set from the data for the stroke as legend if available and fallback to theme color if it was not available [#43772]
- Fix @rollup/plugin-typescript warnings [#43742]
- Fixed smoothing is not working when specified [#43810]
- Fix tooltip causing horizontal scrollbars to appear [#43613]
- Linting: Fix more Stylelint violations. [#43213]

## [0.11.4] - 2025-04-10
### Changed
- Internal updates.

## [0.11.3] - 2025-04-10
### Changed
- Internal updates.

## [0.11.2] - 2025-04-10
### Changed
- Internal updates.

## [0.11.1] - 2025-04-10
### Added
- Export DataPoint, DataPointDate and SeriesData types [#42981]

### Changed
- Code: First pass of style coding standards. [#42734]
- Update package dependencies. [#42762]
- Update package dependencies. [#42809]

### Fixed
- Code: Update stylesheets to use hex instead of named colors. [#42920]
- Code: Update stylesheets to use WordPress font styles. [#42928]
- Fixed TS type checking in the monorepo [#42817]

## [0.11.0] - 2025-03-26
### Added
- Chart library: adds new curve smoothing option to linechart [#42281]

## [0.10.1] - 2025-03-18
### Added
- Introduce Theme seriesLineStyles property [#42530]

### Changed
- Update package dependencies. [#42509]
- Update package dependencies. [#42511]

### Fixed
- Bar chart: fix tickFormat not working issue [#42524]

## [0.10.0] - 2025-03-17
### Changed
- Bar chart: align options with line chart [#42448]
- Update package dependencies. [#42163]
- Update package dependencies. [#42384]

## [0.9.0] - 2025-03-02
### Added
- Expose event handling for line chart [#42168]

## [0.8.4] - 2025-02-27
### Fixed
- Line chart: no need for min x tick num [#42087]

## [0.8.3] - 2025-02-25
### Changed
- Set options as optional for series [#42047]
- Update package dependencies. [#41955]

## [0.8.2] - 2025-02-19
### Added
- Add yScale options support. [#41866]

### Changed
- Updated package dependencies. [#41578]

### Fixed
- Line chart: support custom tooltips [#41738]

## [0.8.1] - 2025-02-04
### Fixed
- Charts: fixed type exports [#41562]

## [0.8.0] - 2025-02-04
### Added
- Charts: add additional testing for library [#41449]
- Charts: add line smoothing toggle on line chart [#41495]
- Charts: adds donut pie chart story [#41496]
- Charts: adds tests for mouse-handler hook, responsive HOC, and grid control [#41455]
- Charts: adds tests for semi circle chart [#41416]

### Changed
- Small type and style fixes [#41523]
- Updated package dependencies. [#41491]

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

[0.15.0]: https://github.com/Automattic/charts/compare/v0.14.0...v0.15.0
[0.14.0]: https://github.com/Automattic/charts/compare/v0.13.0...v0.14.0
[0.13.0]: https://github.com/Automattic/charts/compare/v0.12.1...v0.13.0
[0.12.1]: https://github.com/Automattic/charts/compare/v0.12.0...v0.12.1
[0.12.0]: https://github.com/Automattic/charts/compare/v0.11.4...v0.12.0
[0.11.4]: https://github.com/Automattic/charts/compare/v0.11.3...v0.11.4
[0.11.3]: https://github.com/Automattic/charts/compare/v0.11.2...v0.11.3
[0.11.2]: https://github.com/Automattic/charts/compare/v0.11.1...v0.11.2
[0.11.1]: https://github.com/Automattic/charts/compare/v0.11.0...v0.11.1
[0.11.0]: https://github.com/Automattic/charts/compare/v0.10.1...v0.11.0
[0.10.1]: https://github.com/Automattic/charts/compare/v0.10.0...v0.10.1
[0.10.0]: https://github.com/Automattic/charts/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/Automattic/charts/compare/v0.8.4...v0.9.0
[0.8.4]: https://github.com/Automattic/charts/compare/v0.8.3...v0.8.4
[0.8.3]: https://github.com/Automattic/charts/compare/v0.8.2...v0.8.3
[0.8.2]: https://github.com/Automattic/charts/compare/v0.8.1...v0.8.2
[0.8.1]: https://github.com/Automattic/charts/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/Automattic/charts/compare/v0.7.1...v0.8.0
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
