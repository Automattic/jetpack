import { aggregateLocationRows, locationsToTimeSeries } from './aggregate';
import type { StatsLocationsItem, StatsNormalizedReport } from '@jetpack-premium-analytics/data';

const report: StatsNormalizedReport< StatsLocationsItem > = {
	summary: {},
	data: [
		{
			time_interval: '2026-06-01',
			date_start: '2026-06-01T00:00:00+00:00',
			date_end: '2026-06-01T23:59:59+00:00',
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
			time_interval: '2026-06-02',
			date_start: '2026-06-02T00:00:00+00:00',
			date_end: '2026-06-02T23:59:59+00:00',
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
			date_start: '2026-06-01T00:00:00+00:00',
			date_end: '2026-06-02T23:59:59+00:00',
		} );
		expect( series.data.map( point => point.views ) ).toEqual( [ 11, 5 ] );
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
