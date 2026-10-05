const fs = require( 'fs' );
const path = require( 'path' );
const config = require( './jest.config.cjs' );

// Each suite here runs twice more, so list one only if a test in it fails outside UTC
// when the machine zone leaks in (e.g. `Date.UTC` → `new Date`) and fails nowhere under UTC.
const TZ_SUITES = [
	'packages/data/src/processing/__tests__/bucket-stamps.test.ts',
	'packages/data/src/processing/stats/__tests__/chart-buckets.test.ts',
	'packages/data/src/processing/stats/__tests__/time-series.test.ts',
	'packages/data/src/utils/__tests__/interval.test.ts',
	'packages/data/src/utils/__tests__/stats-params.test.ts',
	'packages/datetime/src/__tests__/bucket-stamp.test.ts',
	'packages/datetime/src/__tests__/comparison-presets.test.ts',
	'packages/datetime/src/__tests__/date-range-span.test.ts',
	'packages/datetime/src/__tests__/drill-date-range.test.ts',
	'packages/datetime/src/__tests__/get-comparison-range.test.ts',
	'packages/datetime/src/__tests__/reporting-time-zone.test.ts',
	'packages/datetime/src/__tests__/site-datetime.test.ts',
	'packages/datetime/src/__tests__/site-timestamp.test.ts',
	'packages/datetime/src/__tests__/tz.test.ts',
	'packages/datetime/src/__tests__/year-presets.test.ts',
	'packages/formatters/src/date/__tests__/format-date-range.test.ts',
	'packages/formatters/src/date/__tests__/format-hour-of-day.test.ts',
	'packages/routing/src/hooks/use-report-date-filters/__tests__/build-range-patch.test.ts',
	'packages/routing/src/hooks/use-report-date-filters/__tests__/use-report-date-filters.test.tsx',
	'packages/widgets-toolkit/src/components/calendar-heatmap/__tests__/adaptive-calendar-heatmap.test.tsx',
	'packages/widgets-toolkit/src/components/post-highlight-card/__tests__/post-highlight-card.test.tsx',
	'packages/widgets-toolkit/src/helpers/__tests__/calendar-heatmap-window.test.ts',
	'routes/detail-header.test.ts',
	'routes/post-detail/components/post-header-slots/post-header-slots.test.tsx',
	'routes/video-detail/components/video-header-slots/video-header-slots.test.tsx',
	'widgets/views-over-years/__tests__/build-views-over-years.test.ts',
	'widgets/views-over-years/__tests__/use-views-over-years.test.tsx',
	'widgets/views-over-years/__tests__/views-over-years.test.tsx',
];

// A renamed suite would otherwise drop out of the timezone run without a word.
const missing = TZ_SUITES.filter( suite => ! fs.existsSync( path.join( config.rootDir, suite ) ) );
if ( missing.length ) {
	throw new Error( `tests/jest.tz.config.cjs lists missing suites: ${ missing.join( ', ' ) }` );
}

module.exports = {
	...config,
	testMatch: TZ_SUITES.map( suite => `<rootDir>/${ suite }` ),
};
