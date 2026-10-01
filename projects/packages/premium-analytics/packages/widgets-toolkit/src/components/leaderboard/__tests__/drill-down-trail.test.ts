/**
 * Internal dependencies
 */
import { resolveDrillDownTrail } from '../drill-down-trail';
import type { LeaderboardRowInput } from '../build-leaderboard-chart-data';

const ROWS: LeaderboardRowInput[] = [
	{
		id: 'google',
		label: 'Google',
		value: 10,
		children: [
			{ id: 'images', label: 'Images', value: 4, children: [ { id: 'x', label: 'X', value: 1 } ] },
			{ id: 'search', label: 'Search', value: 6 },
		],
	},
	{ id: 'direct', label: 'Direct', value: 5 },
];

describe( 'resolveDrillDownTrail', () => {
	it( 'walks the path through the children', () => {
		expect( resolveDrillDownTrail( ROWS, [ 'google', 'images' ] ).map( row => row.id ) ).toEqual( [
			'google',
			'images',
		] );
	} );

	it( 'stops where the path no longer matches a row with children', () => {
		expect( resolveDrillDownTrail( ROWS, [ 'google', 'search' ] ).map( row => row.id ) ).toEqual( [
			'google',
		] );
		expect( resolveDrillDownTrail( ROWS, [ 'direct' ] ) ).toEqual( [] );
		expect( resolveDrillDownTrail( ROWS, [ 'gone' ] ) ).toEqual( [] );
	} );

	it( 'is empty without a path', () => {
		expect( resolveDrillDownTrail( ROWS, null ) ).toEqual( [] );
	} );
} );
