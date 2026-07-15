import { aggregateLocationRows, locationsToTimeSeries } from './aggregate';
import type { StatsLocationsItem, StatsNormalizedReport } from '@jetpack-premium-analytics/data';

const report: StatsNormalizedReport< StatsLocationsItem > = {
	summary: {},
	data: [
		{
			time_interval: '2026-07-09',
			date_start: '2026-07-09T00:00:00+00:00',
			date_end: '2026-07-09T23:59:59+00:00',
			items: [
				{
					label: 'Springfield',
					views: 8,
					countryCode: 'US',
					countryFull: 'United States',
					children: null,
				},
				{
					label: 'Springfield',
					views: 3,
					countryCode: 'CA',
					countryFull: 'Canada',
					children: null,
				},
			],
		},
		{
			time_interval: '2026-07-10',
			date_start: '2026-07-10T00:00:00+00:00',
			date_end: '2026-07-10T23:59:59+00:00',
			items: [
				{
					label: 'Springfield',
					views: 5,
					countryCode: 'US',
					countryFull: 'United States',
					children: null,
				},
			],
		},
	],
};

describe( 'report locations aggregate', () => {
	it( 'sums every location in each bucket for the chart', () => {
		const series = locationsToTimeSeries( report );

		expect( series.summary ).toEqual( {
			date_start: '2026-07-09T00:00:00+00:00',
			date_end: '2026-07-10T23:59:59+00:00',
		} );
		expect( series.data.map( point => point.views ) ).toEqual( [ 11, 5 ] );
	} );

	it( 'groups daily totals into ISO weeks for the chart', () => {
		const series = locationsToTimeSeries( report, 'week' );

		expect( series.data ).toEqual( [
			expect.objectContaining( {
				time_interval: '2026-07-06',
				date_start: '2026-07-09T00:00:00+00:00',
				date_end: '2026-07-10T23:59:59+00:00',
				views: 16,
			} ),
		] );
	} );

	it( 'groups daily totals into calendar months for the chart', () => {
		const series = locationsToTimeSeries( report, 'month' );

		expect( series.data ).toEqual( [
			expect.objectContaining( {
				time_interval: '2026-07-01',
				date_start: '2026-07-09T00:00:00+00:00',
				date_end: '2026-07-10T23:59:59+00:00',
				views: 16,
			} ),
		] );
	} );

	it( 'aggregates matching locations without merging identical names in different countries', () => {
		expect( aggregateLocationRows( report ) ).toEqual( [
			{
				id: 'US:Springfield',
				label: 'Springfield',
				countryCode: 'US',
				countryFull: 'United States',
				views: 13,
			},
			{
				id: 'CA:Springfield',
				label: 'Springfield',
				countryCode: 'CA',
				countryFull: 'Canada',
				views: 3,
			},
		] );
	} );
} );
