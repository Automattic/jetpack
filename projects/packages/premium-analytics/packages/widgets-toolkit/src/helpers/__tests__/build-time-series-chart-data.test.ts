/**
 * External dependencies
 */
import { setSettings } from '@wordpress/date';
import { format } from 'date-fns';
/**
 * Internal dependencies
 */
import { wooBucketStamp } from '../../__fixtures__/woo-bucket-stamp';
import { FIXTURE_SITE_TIME_ZONE, siteSettingsIn } from '../../__fixtures__/wp-date-settings';
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
			label: 'Views',
		} );

		expect( series[ 1 ].label ).not.toBe( series[ 0 ].label );
	} );

	it( "falls back to each period's own date range without a label", () => {
		const series = buildTimeSeriesChartData( { primary, comparison, metricKey: 'views' } );

		expect( series[ 0 ].label ).not.toBe( series[ 1 ].label );
		expect( series[ 0 ].label ).not.toContain( 'Views' );
	} );

	it( 'labels the lone current period when there is no comparison', () => {
		const series = buildTimeSeriesChartData( { primary, metricKey: 'views', label: 'Views' } );

		expect( series ).toHaveLength( 1 );
		expect( series[ 0 ].label ).toBe( 'Views' );
	} );
} );

describe( 'buildTimeSeriesChartData with Woo bucket stamps', () => {
	beforeEach( () => {
		setSettings( siteSettingsIn( FIXTURE_SITE_TIME_ZONE ) );
	} );

	const wooPrimary = {
		summary: {
			date_start: wooBucketStamp( '2026-05-01' ),
			date_end: wooBucketStamp( '2026-05-02T23:59:59' ),
		},
		data: [
			{ date_start: wooBucketStamp( '2026-05-01' ), views: 10 },
			{ date_start: wooBucketStamp( '2026-05-02' ), views: 20 },
		],
	};

	it( "stamps a bucket with the site's own offset", () => {
		expect( wooPrimary.data[ 0 ].date_start ).toBe( '2026-05-01T00:00:00+09:00' );
	} );

	it( 'reads a bucket as midnight on the site, not on the runtime', () => {
		const [ series ] = buildTimeSeriesChartData( {
			primary: wooPrimary,
			metricKey: 'views',
			label: 'Views',
		} );

		expect( series.data.map( point => format( point.date, 'yyyy-MM-dd HH:mm' ) ) ).toEqual( [
			'2026-05-01 00:00',
			'2026-05-02 00:00',
		] );
	} );
} );
