/**
 * External dependencies
 */
import { toBucketStamp } from '@jetpack-premium-analytics/datetime';
import { format } from 'date-fns';
/**
 * Internal dependencies
 */
import { wooBucketStamp } from '../../__fixtures__/woo-bucket-stamp';
import { FIXTURE_SITE_TIME_ZONE } from '../../__fixtures__/wp-date-settings';
import { buildTimeSeriesChartData } from '../build-time-series-chart-data';

const primary = {
	summary: { date_start: '2026-05-01', date_end: '2026-05-02' },
	data: [
		{ date_start: '2026-05-01', views: 10 },
		{ date_start: '2026-05-02', views: 20 },
	],
};

const comparison = {
	summary: { date_start: '2026-04-29', date_end: '2026-04-30' },
	data: [
		{ date_start: '2026-04-29', views: 5 },
		{ date_start: '2026-04-30', views: 6 },
	],
};

describe( 'buildTimeSeriesChartData', () => {
	it( 'labels both periods after the metric when a label is given', () => {
		const series = buildTimeSeriesChartData( {
			primary,
			comparison,
			metricKey: 'views',
			zone: 'UTC',
			label: 'Views',
		} );

		expect( series[ 0 ].label ).toBe( 'Views' );
		expect( series[ 1 ].label ).toContain( 'Views' );
		// The two share a group, so the legend collapses them into one item.
		expect( series[ 1 ].group ).toBe( series[ 0 ].group );
	} );

	it( 'keeps the two labels distinct so the provider can address them separately', () => {
		const series = buildTimeSeriesChartData( {
			primary,
			comparison,
			metricKey: 'views',
			zone: 'UTC',
			label: 'Views',
		} );

		expect( series[ 1 ].label ).not.toBe( series[ 0 ].label );
	} );

	it( "falls back to each period's own date range without a label", () => {
		const series = buildTimeSeriesChartData( {
			primary,
			comparison,
			metricKey: 'views',
			zone: 'UTC',
		} );

		expect( series[ 0 ].label ).not.toBe( series[ 1 ].label );
		expect( series[ 0 ].label ).not.toContain( 'Views' );
	} );

	it( 'labels the lone current period when there is no comparison', () => {
		const series = buildTimeSeriesChartData( {
			primary,
			metricKey: 'views',
			zone: 'UTC',
			label: 'Views',
		} );

		expect( series ).toHaveLength( 1 );
		expect( series[ 0 ].label ).toBe( 'Views' );
	} );
} );

describe( 'buildTimeSeriesChartData with Woo bucket stamps', () => {
	const stamped = ( wallTime: string ) => wooBucketStamp( wallTime );
	const naive = ( wallTime: string ) =>
		toBucketStamp( stamped( wallTime ), FIXTURE_SITE_TIME_ZONE );

	const pointsFor = ( dateStart: string ) =>
		buildTimeSeriesChartData( {
			primary: {
				summary: { date_start: dateStart, date_end: dateStart },
				data: [ { date_start: dateStart, views: 10 } ],
			},
			metricKey: 'views',
			zone: FIXTURE_SITE_TIME_ZONE,
			label: 'Views',
		} )[ 0 ].data;

	it( "stamps a bucket with the site's own offset, which the sanitizer then drops", () => {
		expect( stamped( '2026-05-01' ) ).toBe( '2026-05-01T00:00:00+09:00' );
		expect( naive( '2026-05-01' ) ).toBe( '2026-05-01T00:00:00' );
	} );

	it( 'reads a bucket as midnight on the site, not on the runtime', () => {
		expect(
			pointsFor( naive( '2026-05-01' ) ).map( point => format( point.date, 'yyyy-MM-dd HH:mm' ) )
		).toEqual( [ '2026-05-01 00:00' ] );
	} );

	// The wall parts round-trip through any zone, so only the instant tells the
	// site's zone apart from the runner's — and from the stamp's own offset.
	it( 'lands both stamp shapes on the instant the site puts that midnight at', () => {
		expect( pointsFor( naive( '2026-05-01' ) )[ 0 ].date.toISOString() ).toBe(
			'2026-04-30T15:00:00.000Z'
		);
		expect( pointsFor( stamped( '2026-05-01' ) )[ 0 ].date.toISOString() ).toBe(
			'2026-04-30T15:00:00.000Z'
		);
	} );
} );
