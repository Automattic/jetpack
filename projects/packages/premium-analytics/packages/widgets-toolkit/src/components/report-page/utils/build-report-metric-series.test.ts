/**
 * Internal dependencies
 */
import { buildReportMetricSeries } from './build-report-metric-series';
import type { StatsTimeSeriesReport } from '@jetpack-premium-analytics/data';

const report = (
	days: Array< Record< string, number | string > >,
	month = '06'
): StatsTimeSeriesReport => {
	const data = days.map( ( metrics, index ) => {
		const date = `2026-${ month }-0${ index + 1 }`;
		return {
			time_interval: date,
			date_start: date,
			date_end: date,
			label: date,
			value: Number( metrics.views ?? 0 ),
			items: [],
			...metrics,
		};
	} );

	return {
		summary: {
			...( data[ 0 ] ? { date_start: data[ 0 ].date_start } : {} ),
			...( data[ data.length - 1 ] ? { date_end: data[ data.length - 1 ].date_end } : {} ),
		},
		data,
	};
};

const PRIMARY = report( [
	{ views: 100, visitors: 40, comments: 3, likes: 5 },
	{ views: 120, visitors: 50, comments: 1, likes: 8 },
] );

// The preceding month, so the two periods carry distinct date-range labels.
const COMPARISON = report(
	[
		{ views: 80, visitors: 30, comments: 2, likes: 4 },
		{ views: 90, visitors: 35, comments: 0, likes: 6 },
	],
	'05'
);

const VIEWS = { key: 'views', label: 'Views' };
const VISITORS = { key: 'visitors', label: 'Visitors' };

describe( 'buildReportMetricSeries', () => {
	it( 'returns no series without primary data', () => {
		expect( buildReportMetricSeries( { metrics: [ VIEWS ] } ) ).toEqual( [] );
		expect( buildReportMetricSeries( { primary: report( [] ), metrics: [ VIEWS ] } ) ).toEqual(
			[]
		);
	} );

	it( 'builds one metric-labelled series per visible metric', () => {
		const series = buildReportMetricSeries( {
			primary: PRIMARY,
			metrics: [ VIEWS, VISITORS ],
		} );

		expect( series ).toHaveLength( 2 );
		expect( series.map( entry => entry.label ) ).toEqual( [ 'Views', 'Visitors' ] );
		expect( series[ 0 ].group ).toBe( 'views' );
		expect( series[ 0 ].data.map( point => point.value ) ).toEqual( [ 100, 120 ] );
		expect( series[ 1 ].data.map( point => point.value ) ).toEqual( [ 40, 50 ] );
	} );

	it( 'omits the comparison when several metrics are visible', () => {
		const series = buildReportMetricSeries( {
			primary: PRIMARY,
			comparison: COMPARISON,
			metrics: [ VIEWS, VISITORS ],
		} );

		expect( series ).toHaveLength( 2 );
		expect( series.every( entry => entry.options?.type !== 'comparison' ) ).toBe( true );
	} );

	it( 'adds a dashed same-group comparison series for a single visible metric', () => {
		const series = buildReportMetricSeries( {
			primary: PRIMARY,
			comparison: COMPARISON,
			metrics: [ VIEWS ],
		} );

		expect( series ).toHaveLength( 2 );
		expect( series[ 0 ].group ).toBe( 'views' );
		expect( series[ 1 ].group ).toBe( 'views' );
		expect( series[ 1 ].options?.type ).toBe( 'comparison' );
		expect( series[ 1 ].data.map( point => point.value ) ).toEqual( [ 80, 90 ] );
		// Legend labels switch to date ranges so the two periods are tellable apart.
		expect( series[ 0 ].label ).not.toBe( 'Views' );
		expect( series[ 0 ].label ).not.toBe( series[ 1 ].label );
	} );

	it( 'uses supplied legend labels for single-metric comparison series', () => {
		const series = buildReportMetricSeries( {
			primary: PRIMARY,
			comparison: COMPARISON,
			metrics: [ VIEWS ],
			legendLabels: {
				primary: 'Apr 4-Jul 4, 2026',
				comparison: 'Jan 2-Apr 3, 2026',
			},
		} );

		expect( series.map( entry => entry.label ) ).toEqual( [
			'Apr 4-Jul 4, 2026',
			'Jan 2-Apr 3, 2026',
		] );
	} );

	it( 'treats missing metric fields as zero', () => {
		const series = buildReportMetricSeries( {
			primary: report( [ { views: 10 } ] ),
			metrics: [ VISITORS ],
		} );

		expect( series[ 0 ].data.map( point => point.value ) ).toEqual( [ 0 ] );
	} );
} );
