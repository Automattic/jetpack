import { buildLocationRows } from './aggregate';
import type { StatsLocationsComparisonItem } from '@jetpack-premium-analytics/data';

const items: StatsLocationsComparisonItem[] = [
	{
		label: 'Springfield',
		views: 13,
		countryCode: 'US',
		countryFull: 'United States',
		children: null,
		previousViews: 9,
	},
	{
		label: 'Springfield',
		views: 3,
		countryCode: 'CA',
		countryFull: 'Canada',
		children: null,
	},
];

describe( 'report locations aggregate', () => {
	it( 'keeps identical names in different countries apart', () => {
		expect( buildLocationRows( items ) ).toEqual( [
			{
				id: 'US:Springfield',
				label: 'Springfield',
				countryCode: 'US',
				countryFull: 'United States',
				views: 13,
				previousViews: 9,
			},
			{
				id: 'CA:Springfield',
				label: 'Springfield',
				countryCode: 'CA',
				countryFull: 'Canada',
				views: 3,
				previousViews: undefined,
			},
		] );
	} );

	it( 'leaves a missing previous period undefined', () => {
		expect( buildLocationRows( items )[ 1 ].previousViews ).toBeUndefined();
	} );

	it( 'returns no rows when the report has not arrived', () => {
		expect( buildLocationRows( undefined ) ).toEqual( [] );
	} );
} );
