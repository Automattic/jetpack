# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.10.0] - 2026-07-09
### Added
- Add GeoChart error reporting. [#50251]

### Changed
- Update package dependencies. [#49272]
- Update WPDS design tokens to the @wordpress/theme 0.16/0.17 names and migrate the Storybook decorator to the public ThemeProvider export (see https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/CHANGELOG.md#0160-2026-06-24 ). [#49272]

## [1.9.0] - 2026-07-06
### Added
- Add HeatmapChart for matrix and calendar/contribution-style data, with a compact mode and a composition color-scale legend. [#50065]

### Changed
- Bar Chart: Declare a local process type so the comparison-bars module type-checks when imported as source by other packages. [#49205]
- Replace hardcoded surface, foreground, and UI colors with WPDS design tokens. [#49946]
- Tokenize box-shadow, transition, and animation values with WPDS elevation and motion tokens, making elevation and motion themeable. [#49947]
- Update package dependencies. [#50097] [#50183] [#50212]

### Fixed
- Conversion Funnel Chart: Let the funnel shrink to fit height-constrained cards instead of enforcing a 200px minimum that forced a scrollbar. [#50163]
- GeoChart: Load the required Google Charts package explicitly. [#50018]
- Line Chart: Fix typing on `.gradient.from` and `.gradient.to` to better match behavior and documentation. [#50212]

## [1.8.1] - 2026-06-26
### Fixed
- Fix Bar Chart comparison mode — pair the keyboard tooltip with the focused bar, keep the value axis zero-based, and make the tooltip label/value separator translatable. [#49959]

## [1.8.0] - 2026-06-24
### Added
- Add comparison mode to the Bar Chart — a translucent shadow bar (standard slot width, 50% opacity) rendered behind each primary bar, paired by group. Primary bars are narrowed to 1/widthFactor of the slot (default widthFactor 1.5 → ~67% width, centered), with widthFactor as the single control. [#49676]

### Changed
- Add an internal Center layout primitive and use it for centered chart wrappers. [#49164]

## [1.7.0] - 2026-06-23
### Added
- Leaderboard interactive rows gain an opt-in `ariaLabel` for image-only labels, and the hover affordance now shrinks each bar in proportion to its length so small-share rows stay consistent. [#49812]

### Changed
- Add React 19 compatibility for consumers. [#49661]
- Type `leaderboardChart.labelSpacing` as a WPDS `GapSize` token instead of `number` (the numeric value was silently ignored by `@wordpress/ui`'s Stack) to fix `@wordpress/ui` 0.15 type errors. [#49797]

## [1.6.0] - 2026-06-22
### Added
- Allow Leaderboard items to be made interactive via a per-entry onClick, rendering the row as a keyboard-accessible button with a hover chevron. [#49733]

### Changed
- Update package dependencies. [#49594] [#49631] [#49691] [#49757]

## [1.5.3] - 2026-06-10
### Changed
- Update package dependencies. [#49273]

## [1.5.2] - 2026-06-08
### Changed
- Internal updates.

## [1.5.1] - 2026-06-05
### Changed
- Charts: clip zoomable LineChart/AreaChart series to the plot area so zoomed views don't paint outside the axes. [#49357]
- Update dependencies. [#49354]

## [1.5.0] - 2026-06-01
### Added
- Charts: Optional zoomable X-axis on LineChart and AreaChart. Pass `zoomable` to enable drag-to-zoom; a reset button appears in the top-right while zoomed. [#49167]

### Changed
- Charts: AreaChart Y-axis now rescales to the visible series when interactive legends toggle items off. Pass `rescaleYOnLegendToggle={ false }` to restore the previous pinned-extent behavior. [#49241]
- Update package dependencies. [#48404]

## [1.4.3] - 2026-05-25
### Changed
- Update dependencies. [#43811]

## [1.4.2] - 2026-05-21
### Changed
- Update package dependencies. [#48405]
- Update package dependencies. [#49012]

## [1.4.1] - 2026-05-19
### Changed
- Keep stacked area chart paths mounted on legend toggle so only the hidden series animates down and the y-axis stays fixed. [#48804]

## [1.4.0] - 2026-05-14
### Changed
- Charts: Expose a source-side `./style.css` alias so monorepo consumers can resolve the import without a prior build. [#48682]
- Charts: Expose tickValues on AxisOptions and nice on ScaleOptions so callers can force exact axis ticks. [#48722]
- Update package dependencies. [#48695] [#48696]

### Removed
- Charts: Remove the `useTooltipPortalRelocator` hook and the `portalContainer` prop on `GlobalChartsProvider`. The relocator (added in #47118 / 0.56.4) caused tooltip glyphs and the tooltip box to drift away from the chart line by exactly the page scroll offset on scrolled pages. [#48617]

## [1.3.1] - 2026-05-11
### Changed
- Update dependencies. [#43811]

## [1.3.0] - 2026-05-04
### Added
- Charts: Add AreaChart component for stacked and overlapping area visualisations. [#48388]

### Changed
- Internal: No longer require automattic/jetpack-changelogger as a per-project dev dependency. [#48225]

## [1.2.1] - 2026-04-27
### Changed
- Update package dependencies. [#48302]

## [1.2.0] - 2026-04-20
### Changed
- Charts: Replace hard-coded spacing and border values in module SCSS with WPDS dimension and border design tokens. [#48019]
- Update package dependencies. [#48106] [#48126] [#48141]

## [1.1.1] - 2026-04-15
### Changed
- Charts: Document WordPress UI + Theme integration defaults. [#48020]
- Charts: Replace ad-hoc flexbox layouts with @wordpress/ui Stack across legend, conversion funnel, line chart, geo chart, conversion funnel tooltip, and donut story. [#47981]
- Update package dependencies. [#47907]

## [1.1.0] - 2026-04-10
### Changed
- Replace hardcoded typography values with WPDS design tokens for font family, size, weight, and line height. [#47989]
- Replace __experimentalText from @wordpress/components with stable Text from @wordpress/ui. [#47894]
- Update package dependencies. [#47890] [#47998]

### Fixed
- Fix Line Chart Annotations Custom and Alert story errors in Storybook by replacing the CJS-only gridicons dependency with @wordpress/icons. [#47990]
- Storybook: Replace manual design-system token override with real WPDS ThemeProvider. [#47983]

## [1.0.2] - 2026-04-06
### Changed
- Conversion Funnel Chart: Rename non-BEM classnames to BEM modifiers. [#47854]
- Update package dependencies. [#47870] [#47886]

### Fixed
- Fix conversion funnel chart color flicker on initial render by deferring CSS transitions until the color palette is resolved. [#47851]

## [1.0.1] - 2026-03-30
### Security
- Sanitize GeoChart HTML tooltip content with DOMPurify. [#47789]

### Changed
- Bump minimum Node version to 20.11. [#47770]
- Support all CSS color formats (HSL, HSLA, RGB, RGBA, named colors) in theme colors. [#46349]
- Update package dependencies. [#47799]

### Fixed
- ChartLayout: Display SVG as block to avoid unexpected resizing in certain browser environments. [#47802]

## [1.0.0] - 2026-03-24
### Changed
- Internal updates. [#43811]

## [0.59.0] - 2026-03-23
### Added
- ChartLayout: Add component for shared chart and legend layout. [#47554]

### Changed
- Move tooltip portal containerRef from ChartLayout to inner svg-wrapper in pie charts. [#47619]
- Remove internal hooks, utilities, and types from public exports to reduce API surface. [#47703]
- Remove `percentage` from DataPointPercentage interface. [#47668]
- Standardize legend stories and documentation across all chart types. [#47545]
- Update package dependencies. [#47684] [#47719]

### Removed
- Remove individual chart entry point exports in favor of the main package entry point for v1. [#47673]

### Fixed
- Derive default legend shape from chart type in composition API. [#47671]
- Fix broken story references and simplify legend sections in Storybook docs. [#47663]
- Fix empty-state text wrapping when all legend items are hidden. [#47620]

## [0.58.0] - 2026-03-16
### Security
- Fix ReDoS vulnerability in date parsing timezone detection. [#47524]

### Changed
- Breaking: Consolidate flat legend props into a nested legend configuration object on BaseChartProps. [#47506]
- Charts: Fix Legend position prop in the composition API so that legends render in the correct top or bottom slot. [#47478]
- Remove useHasLegendChild hook from @automattic/charts/hooks (charts now derive legend presence from useChartChildren). [#47478]
- Update dependencies. [#47472]

### Fixed
- Bundle fast-deep-equal as a non-external dependency to fix compatibility with webpack strict ESM mode. [#47372]

## [0.57.0] - 2026-03-09
### Added
- Add identity-obj-proxy to enable CSS module class assertions in tests. [#47476]

### Changed
- BREAKING: Legend: Replace individual visx styling props with itemStyles, labelStyles, shapeStyles objects, rename legendItemClassName to itemClassName, add labelClassName, and move maxWidth/textOverflow into labelStyles. LeaderboardChart: replace legendShapeWidth/legendShapeHeight with legendShapeStyles. [#47454]
- Breaking: Legend theme properties (`legendShapeStyles`, `legendLabelStyles`, `legendContainerStyles`) are now nested under a `legend` object (`legend.shapeStyles`, `legend.labelStyles`, `legend.containerStyles`) in `ChartTheme`. [#47439]
- Switch to Native TypeScript compiler based on Go. [#47375]
- Update package dependencies. [#47496]

### Fixed
- Fix leaderboard chart height calculation to include legend layout and keep responsive sizing by default. [#47369]
- Fix zero-value bars not visible in small chart heights by ensuring minimum pixel-based value. [#47477]
- Legend: Fix value rendering for falsy values (e.g. 0), guard against empty string spans, make value optional in types, and use index-based lookup for better performance. [#47459]

## [0.56.7] - 2026-03-02
### Changed
- Improve AI agent documentation and validation workflow for chart development. [#47334]
- Standardize chart documentation structure: add Responsive Behavior and Legends as standard sections, remove Browser Compatibility and Performance Considerations sections, and align all chart docs to established template. [#47363]

## [0.56.6] - 2026-02-26
### Changed
- Simplify relocated portal positioning with CSS inset shorthand. [#47220]
- Update package dependencies. [#47285] [#47300] [#47309]

### Fixed
- Fix chart height and size calculations for Pie Chart and variants. [#47074]
- Fix `PieSemiCircleChart` height and size calculations to be responsive by default, maintaining 2:1 width-to-height ratio. [#47312]
- Tooltip: Prevent flash at origin before visx calculates correct position. [#47189]

## [0.56.5] - 2026-02-23
### Changed
- Add dynamic x‑axis margin in `LineChart` to prevent crowded/clipped tick labels. [#45815]

## [0.56.4] - 2026-02-19
### Changed
- Build: strip data-testid attributes from production builds to reduce bundle size and keep the DOM cleaner. [#47185]

### Fixed
- ConversionFunnelChart: Default to filling the parent container height and add a height prop for explicit sizing. [#47119]
- Relocate visx tooltip portals from document.body into the chart container to fix z-index stacking issues with sticky headers and other positioned elements. [#47118]

## [0.56.3] - 2026-02-18
### Changed
- Set `.repository.url` in `package.json` to the mirror repo rather than the monorepo. [#47149]

## [0.56.2] - 2026-02-16
### Changed
- Internal updates.

## [0.56.1] - 2026-02-12
### Changed
- Remove redundant moduleNameMapper from jest config. [#46962]
- Update package dependencies. [#47099]

### Fixed
- Allow responsive wrapper to shrink properly in flex layouts by adding min-width and min-height CSS properties. [#47070]
- Compatibility: Clean up deprecated CSS. [#47067]

## [0.56.0] - 2026-02-10
### Added
- Add `renderTooltip` prop for custom tooltip rendering in pie charts. [#46971]

### Changed
- Responsive charts now fill parent container by default instead of using a fixed aspect ratio. [#46846]

### Fixed
- Bundle `@wordpress/ui` into dist output to prevent runtime errors in consumers using wp-build. [#47004]
- Fix tooltip positioning when container moves without triggering containerBounds refresh. [#46963]

## [0.55.0] - 2026-02-04
### Changed
- Update package dependencies. [#46933]

### Fixed
- Fix Sparkline component export paths in package.json and update documentation to include GeoChart, Sparkline, and TrendIndicator components. [#46842]

## [0.54.3] - 2026-02-03
### Changed
- Update package dependencies. [#46905]

### Fixed
- Add missing stories referenced by Storybook MDX docs. [#46883]

## [0.54.2] - 2026-02-02
### Changed
- Update package dependencies. [#46854]

## [0.54.1] - 2026-01-26
### Changed
- Update dependencies. [#43811]

## [0.54.0] - 2026-01-21
### Added
- Add labelOverflow ellipsis option to truncate long axis labels for bar chart. [#46656]

## [0.53.4] - 2026-01-19
### Changed
- Update package dependencies. [#46647]

## [0.53.3] - 2026-01-14
### Changed
- Update package dependencies. [#46552]

## [0.53.2] - 2026-01-07
### Changed
- Update package dependencies. [#46456]

## [0.53.1] - 2026-01-06
### Added
- Add animation support to Sparkline chart component. [#46333]
- Add Geo Chart exports to package. [#46438]

## [0.53.0] - 2025-12-22
### Added
- Add Geo chart [#45883]
- Add TrendIndicator component for displaying directional trends with values [#46213]
- GeoChart: Add region and resolution props for state/province-level map views [#46332]

### Changed
- Change Geo Chart data format to handle all Google Charts data [#46330]
- Update package dependencies. [#46362]
- Update package dependencies. [#46363]

### Fixed
- Charts: Add documentation and API references of animation feature. [#46326]

## [0.52.0] - 2025-12-15
### Added
- Add new sparkline chart type. [#46165]

### Changed
- Restructure directories to allow expansion of library. [#46232]

## [0.51.0] - 2025-12-11
### Changed
- Update package dependencies. [#46245]

### Removed
- Remove Woo and Jetpack themes [#46119]

## [0.50.2] - 2025-12-08
### Changed
- Internal updates.

## [0.50.1] - 2025-12-01
### Changed
- Update package dependencies. [#46143]

### Fixed
- Fix zero value tooltip in conversion funnel chart. [#46106]
- Improve guessOptimalNumTicks to use custom formatter and handle empty data. [#46096]

## [0.50.0] - 2025-11-26
### Added
- Add Charts utils to package exports [#46095]
- Global theme: enable color generation from CSS custom properties [#45889]

## [0.49.1] - 2025-11-20
### Changed
- Update package dependencies. [#46022]

### Fixed
- Localize numbers in legend labels and tooltips [#45991]

## [0.49.0] - 2025-11-19
### Added
- Add animation in circular shaped charts. [#45870]
- Add usePrefersReducedMotion hook for accecibility. [#45955]

## [0.48.0] - 2025-11-18
### Changed
- Remove inline styles from containers to allow consumer overrides. [#45953]

## [0.47.0] - 2025-11-17
### Added
- Chart: Add animation support. [#45837]

### Changed
- Update package dependencies. [#45915] [#45958]

## [0.46.3] - 2025-11-12
### Changed
- Internal updates.

## [0.46.2] - 2025-11-10
### Changed
- Update package dependencies. [#45737]

## [0.46.1] - 2025-11-03
### Fixed
- Fix lints. [#45658]

## [0.46.0] - 2025-10-28
### Added
- Add interactive legend support to LeaderboardChart. [#45581]

### Changed
- Update package dependencies. [#45652]

## [0.45.0] - 2025-10-27
### Added
- Add interactive legend support to BarChart. [#45561]
- Add interactive legend to pie charts. [#45580]

## [0.44.0] - 2025-10-21
### Changed
- Improve legends toggling. [#45545]

## [0.43.0] - 2025-10-20
### Added
- Add legend interactivity. [#45506]
- Show ticks in year format when the interval is more than a year. [#45529]

### Changed
- Add Group Storybook controls. [#45503]

## [0.42.0] - 2025-10-14
### Changed
- Leaderboard chart: Update exports and layout flex behavior. [#45480]

## [0.41.1] - 2025-10-13
### Fixed
- Fix conversion funnel height inconsistency when toggling comparison mode. [#45434]

## [0.41.0] - 2025-10-08
### Added
- Add custom legend support. [#45347]
- Set the color of the axis labels via the theme. [#45406]
- Legend: Update docs. [#45391]
- Show ticks in hours when the interval is less than 24 hours. [#45390]

### Changed
- Separate API reference documentation from usage documentation. [#45322]

## [0.40.0] - 2025-10-06
### Added
- Add `legendItemClassName` prop for custom legend item styling. [#45286]

### Changed
- Update package dependencies. [#45334] [#45335]

## [0.39.0] - 2025-09-29
### Added
- Generate extra colors from theme colors if needed. [#45276]
- Global Charts context: Add documentation. [#45313]
- Guess a better x-axis ticks value in line charts. [#45259]
- Line Chart: Add support for annotated line section. [#45284]

### Changed
- Improve tooltip positioning in pie charts. [#45237]
- Conversion Funnel chart: Use global charts context theme for consistency. [#45264]

## [0.38.2] - 2025-09-22
### Changed
- Update dependencies. [#43811]

## [0.38.1] - 2025-09-19
### Changed
- Update package dependencies. [#45241]

## [0.38.0] - 2025-09-19
### Added
- Add get element styles utility to global context. [#45207]

### Changed
- Update package dependencies. [#45229]

## [0.37.0] - 2025-09-15
### Changed
- Handle legend overflow when not enough space. [#45144]

## [0.36.0] - 2025-09-11
### Added
- Leaderboard chart: Add legend support. [#45126]

### Changed
- Leaderboard chart: Make docs consistent with other charts. [#45125]
- Update package dependencies. [#45127]

## [0.35.0] - 2025-09-10
### Added
- Export all unresponsive charts. [#45129]

### Removed
- Deprecate ThemeProvider in favor of GlobalChartsProvider. [#45081]

## [0.34.1] - 2025-09-08
### Fixed
- Fix Type error with legendValueDisplay. [#45099]

## [0.34.0] - 2025-09-08
### Changed
- Leaderboard Chart: Extend BaseChartProps [#45100]

### Fixed
- Fix SASS and CSS Modules processing. [#45098]

## [0.33.0] - 2025-09-08
### Added
- Add ability to control percentage vs. value display. [#45052]

### Changed
- Leaderboard Chart: Use GlobalContextProvider theme for colors. [#45067]
- Update package dependencies. [#45027] [#45097]
- Use `tsup` for builds. [#45051]

### Fixed
- Allow type-checking of tests and stories. [#45082]

## [0.32.0] - 2025-09-02
### Added
- Add controls for label visibility. [#45040]

### Changed
- Fix the conversion-funnel-chart component export. [#45033]
- Format percentage values to be prettier. [#45032]
- Use a global context provider for theme configuration in all stories. [#45028]
- Use `getStringWidth` for label size calculations. [#45030]

### Fixed
- Prevent z-index issue across all charts. [#45043]

## [0.31.0] - 2025-09-01
### Added
- Add an agents.md file to project root. [#44954]
- Ensure stable colors for series groups. [#44730]
- Pie Chart: Refactor to improve readability. [#44989]

### Changed
- Enhance ConversionFunnelChart with render props and TooltipInPortal. [#45019]
- Refactor shared components, hooks and utils. [#44971]

### Fixed
- Fix label background and text color. [#44990]
- Refactor leaderboard chart to remove progress bar. [#44982]

## [0.30.0] - 2025-08-27
### Added
- Export ConversionFunnelChart for usage outside. [#44952]

### Changed
- Storybook: Consolidate sample data across stories for consistency and maintainability. [#44903]

## [0.29.0] - 2025-08-25
### Changed
- Consolidate and clean up pie chart composition API. [#44856]

## [0.28.0] - 2025-08-21
### Added
- Add composition legend to pie family charts. [#44796]
- Add theme to global context and use instead of that from theme provider. [#44809]

## [0.27.0] - 2025-08-18
### Added
- Add support for custom labels in the leaderboard chart for greater flexibility. [#44751]

## [0.26.0] - 2025-08-14
### Added
- Bar Chart: Add composition API. [#44771]
- Line Chart: Add composition legends. [#44691]
- Line Chart: Add comparison style to theme. [#44676]

### Changed
- Update legend positioning and alignment. [#44747]
- Update package dependencies. [#44701]

## [0.25.0] - 2025-08-11
### Added
- Add internationalization. [#44652]

### Changed
- Improve legend functionality and tidy up some legend layout issues. [#44573]
- Update package dependencies. [#44677]

### Removed
- Remove redundant internal chart ID. [#44728]

### Fixed
- Fix legend alignment issues for right-aligned vertical legends. [#44622]

## [0.24.0] - 2025-08-04
### Added
- Add Conversion Funnel Chart document to Storybook index page. [#44548]

### Fixed
- Tests: Specify locale in tooltip tests. [#44594]

## [0.23.1] - 2025-08-01
### Fixed
- Line Chart: Improve pointer event types. [#44510]

## [0.23.0] - 2025-07-30
### Added
- Add component ConversionFunnelChart. [#44433]
- Add showZeroValues option to BarChart to render zero-value with a small visible value. [#44443]

### Fixed
- Charts: Fix TS errors related to missing React import in stories. [#44190]
- Fix top margin for semi cicle chart. [#44539]

## [0.22.0] - 2025-07-28
### Added
- Add a standalone chart legend component. [#44245]
- Add docs for various charts. [#44441] [#44465] [#44466] [#44467]

### Changed
- Apply theme to the LeaderboardChart component. [#44419]

### Fixed
- Fix issue where pie chart can be cut off. [#44490]

## [0.21.0] - 2025-07-25
### Added
- Add Storybook docs introduction. [#44427]

### Changed
- Fix export structure for charts. [#44440]
- Remove non-production files from built package. [#44438]

## [0.20.0] - 2025-07-23
### Added
- Line Chart: Add documentation. [#44410]

## [0.19.1] - 2025-07-22
### Changed
- Remove dependency on jetpack-components. [#44411]

## [0.19.0] - 2025-07-21
### Added
- Added more exports for Woo Analytics to get rid of visx dependencies. [#44390]

## [0.18.0] - 2025-07-21
### Added
- Add keyboard navigation support for bar and line charts. [#44036]
- Add Woo Analytics Leaderboard chart component. [#44299]
- Line chart: Add documentation for annotations. [#44361]
- Line chart: Add support for custom interactive annotations. Includes a breaking change to the annotations API, from an `annotations` prop to a compound component pattern. [#44131]

### Changed
- Replace `lodash` with `deepmerge`. [#44316]
- Update package dependencies. [#44356]

## [0.17.0] - 2025-07-14
### Added
- Add foundation for ChartContext system. [#44189]

### Changed
- Update package dependencies. [#44219]

## [0.16.2] - 2025-07-08
### Changed
- Update package dependencies. [#44217]

## [0.16.1] - 2025-07-03
### Changed
- Update package dependencies. [#44151]

## [0.16.0] - 2025-07-01
### Added
- Line chart: Add keyboard navigation support. [#43962]

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

[1.10.0]: https://github.com/Automattic/charts/compare/v1.9.0...v1.10.0
[1.9.0]: https://github.com/Automattic/charts/compare/v1.8.1...v1.9.0
[1.8.1]: https://github.com/Automattic/charts/compare/v1.8.0...v1.8.1
[1.8.0]: https://github.com/Automattic/charts/compare/v1.7.0...v1.8.0
[1.7.0]: https://github.com/Automattic/charts/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/Automattic/charts/compare/v1.5.3...v1.6.0
[1.5.3]: https://github.com/Automattic/charts/compare/v1.5.2...v1.5.3
[1.5.2]: https://github.com/Automattic/charts/compare/v1.5.1...v1.5.2
[1.5.1]: https://github.com/Automattic/charts/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/Automattic/charts/compare/v1.4.3...v1.5.0
[1.4.3]: https://github.com/Automattic/charts/compare/v1.4.2...v1.4.3
[1.4.2]: https://github.com/Automattic/charts/compare/v1.4.1...v1.4.2
[1.4.1]: https://github.com/Automattic/charts/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/Automattic/charts/compare/v1.3.1...v1.4.0
[1.3.1]: https://github.com/Automattic/charts/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/Automattic/charts/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/Automattic/charts/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/Automattic/charts/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/Automattic/charts/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/Automattic/charts/compare/v1.0.2...v1.1.0
[1.0.2]: https://github.com/Automattic/charts/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/Automattic/charts/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/Automattic/charts/compare/v0.59.0...v1.0.0
[0.59.0]: https://github.com/Automattic/charts/compare/v0.58.0...v0.59.0
[0.58.0]: https://github.com/Automattic/charts/compare/v0.57.0...v0.58.0
[0.57.0]: https://github.com/Automattic/charts/compare/v0.56.7...v0.57.0
[0.56.7]: https://github.com/Automattic/charts/compare/v0.56.6...v0.56.7
[0.56.6]: https://github.com/Automattic/charts/compare/v0.56.5...v0.56.6
[0.56.5]: https://github.com/Automattic/charts/compare/v0.56.4...v0.56.5
[0.56.4]: https://github.com/Automattic/charts/compare/v0.56.3...v0.56.4
[0.56.3]: https://github.com/Automattic/charts/compare/v0.56.2...v0.56.3
[0.56.2]: https://github.com/Automattic/charts/compare/v0.56.1...v0.56.2
[0.56.1]: https://github.com/Automattic/charts/compare/v0.56.0...v0.56.1
[0.56.0]: https://github.com/Automattic/charts/compare/v0.55.0...v0.56.0
[0.55.0]: https://github.com/Automattic/charts/compare/v0.54.3...v0.55.0
[0.54.3]: https://github.com/Automattic/charts/compare/v0.54.2...v0.54.3
[0.54.2]: https://github.com/Automattic/charts/compare/v0.54.1...v0.54.2
[0.54.1]: https://github.com/Automattic/charts/compare/v0.54.0...v0.54.1
[0.54.0]: https://github.com/Automattic/charts/compare/v0.53.4...v0.54.0
[0.53.4]: https://github.com/Automattic/charts/compare/v0.53.3...v0.53.4
[0.53.3]: https://github.com/Automattic/charts/compare/v0.53.2...v0.53.3
[0.53.2]: https://github.com/Automattic/charts/compare/v0.53.1...v0.53.2
[0.53.1]: https://github.com/Automattic/charts/compare/v0.53.0...v0.53.1
[0.53.0]: https://github.com/Automattic/charts/compare/v0.52.0...v0.53.0
[0.52.0]: https://github.com/Automattic/charts/compare/v0.51.0...v0.52.0
[0.51.0]: https://github.com/Automattic/charts/compare/v0.50.2...v0.51.0
[0.50.2]: https://github.com/Automattic/charts/compare/v0.50.1...v0.50.2
[0.50.1]: https://github.com/Automattic/charts/compare/v0.50.0...v0.50.1
[0.50.0]: https://github.com/Automattic/charts/compare/v0.49.1...v0.50.0
[0.49.1]: https://github.com/Automattic/charts/compare/v0.49.0...v0.49.1
[0.49.0]: https://github.com/Automattic/charts/compare/v0.48.0...v0.49.0
[0.48.0]: https://github.com/Automattic/charts/compare/v0.47.0...v0.48.0
[0.47.0]: https://github.com/Automattic/charts/compare/v0.46.3...v0.47.0
[0.46.3]: https://github.com/Automattic/charts/compare/v0.46.2...v0.46.3
[0.46.2]: https://github.com/Automattic/charts/compare/v0.46.1...v0.46.2
[0.46.1]: https://github.com/Automattic/charts/compare/v0.46.0...v0.46.1
[0.46.0]: https://github.com/Automattic/charts/compare/v0.45.0...v0.46.0
[0.45.0]: https://github.com/Automattic/charts/compare/v0.44.0...v0.45.0
[0.44.0]: https://github.com/Automattic/charts/compare/v0.43.0...v0.44.0
[0.43.0]: https://github.com/Automattic/charts/compare/v0.42.0...v0.43.0
[0.42.0]: https://github.com/Automattic/charts/compare/v0.41.1...v0.42.0
[0.41.1]: https://github.com/Automattic/charts/compare/v0.41.0...v0.41.1
[0.41.0]: https://github.com/Automattic/charts/compare/v0.40.0...v0.41.0
[0.40.0]: https://github.com/Automattic/charts/compare/v0.39.0...v0.40.0
[0.39.0]: https://github.com/Automattic/charts/compare/v0.38.2...v0.39.0
[0.38.2]: https://github.com/Automattic/charts/compare/v0.38.1...v0.38.2
[0.38.1]: https://github.com/Automattic/charts/compare/v0.38.0...v0.38.1
[0.38.0]: https://github.com/Automattic/charts/compare/v0.37.0...v0.38.0
[0.37.0]: https://github.com/Automattic/charts/compare/v0.36.0...v0.37.0
[0.36.0]: https://github.com/Automattic/charts/compare/v0.35.0...v0.36.0
[0.35.0]: https://github.com/Automattic/charts/compare/v0.34.1...v0.35.0
[0.34.1]: https://github.com/Automattic/charts/compare/v0.34.0...v0.34.1
[0.34.0]: https://github.com/Automattic/charts/compare/v0.33.0...v0.34.0
[0.33.0]: https://github.com/Automattic/charts/compare/v0.32.0...v0.33.0
[0.32.0]: https://github.com/Automattic/charts/compare/v0.31.0...v0.32.0
[0.31.0]: https://github.com/Automattic/charts/compare/v0.30.0...v0.31.0
[0.30.0]: https://github.com/Automattic/charts/compare/v0.29.0...v0.30.0
[0.29.0]: https://github.com/Automattic/charts/compare/v0.28.0...v0.29.0
[0.28.0]: https://github.com/Automattic/charts/compare/v0.27.0...v0.28.0
[0.27.0]: https://github.com/Automattic/charts/compare/v0.26.0...v0.27.0
[0.26.0]: https://github.com/Automattic/charts/compare/v0.25.0...v0.26.0
[0.25.0]: https://github.com/Automattic/charts/compare/v0.24.0...v0.25.0
[0.24.0]: https://github.com/Automattic/charts/compare/v0.23.1...v0.24.0
[0.23.1]: https://github.com/Automattic/charts/compare/v0.23.0...v0.23.1
[0.23.0]: https://github.com/Automattic/charts/compare/v0.22.0...v0.23.0
[0.22.0]: https://github.com/Automattic/charts/compare/v0.21.0...v0.22.0
[0.21.0]: https://github.com/Automattic/charts/compare/v0.20.0...v0.21.0
[0.20.0]: https://github.com/Automattic/charts/compare/v0.19.1...v0.20.0
[0.19.1]: https://github.com/Automattic/charts/compare/v0.19.0...v0.19.1
[0.19.0]: https://github.com/Automattic/charts/compare/v0.18.0...v0.19.0
[0.18.0]: https://github.com/Automattic/charts/compare/v0.17.0...v0.18.0
[0.17.0]: https://github.com/Automattic/charts/compare/v0.16.2...v0.17.0
[0.16.2]: https://github.com/Automattic/charts/compare/v0.16.1...v0.16.2
[0.16.1]: https://github.com/Automattic/charts/compare/v0.16.0...v0.16.1
[0.16.0]: https://github.com/Automattic/charts/compare/v0.15.0...v0.16.0
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
