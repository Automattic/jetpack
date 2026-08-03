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
	// Region and city names repeat across countries, so the country code has to
	// stay part of the row identity.
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

	// A location with no match in the previous period must stay undefined, not
	// collapse to 0, so the table shows no delta rather than a false one.
	it( 'leaves a missing previous period undefined', () => {
		expect( buildLocationRows( items )[ 1 ].previousViews ).toBeUndefined();
	} );

	it( 'returns no rows when the report has not arrived', () => {
		expect( buildLocationRows( undefined ) ).toEqual( [] );
	} );
} );
