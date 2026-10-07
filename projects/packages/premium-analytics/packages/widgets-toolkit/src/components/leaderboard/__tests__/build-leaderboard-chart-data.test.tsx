/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import {
	buildLeaderboardChartData,
	type LeaderboardRowInput,
} from '../build-leaderboard-chart-data';
import { resolveDrillDownTrail } from '../drill-down-trail';

const ROWS: LeaderboardRowInput[] = [
	{ id: 'a', label: 'Alpha', value: 80, previousValue: 100 },
	{ id: 'b', label: 'Beta', value: 40 },
	{ id: 'c', label: 'Gamma', value: 20, previousValue: 10 },
];

describe( 'buildLeaderboardChartData', () => {
	it( 'shares every row against the largest value of either period when comparing', () => {
		const data = buildLeaderboardChartData( ROWS, { hasComparison: true } );

		expect( data.map( row => row.currentShare ) ).toEqual( [ 80, 40, 20 ] );
		expect( data.map( row => row.previousShare ) ).toEqual( [ 100, undefined, 10 ] );
		expect( data.map( row => row.delta ) ).toEqual( [ -20, undefined, 100 ] );
	} );

	it( 'ignores the previous values when the comparison is off', () => {
		const data = buildLeaderboardChartData( ROWS );

		expect( data.map( row => row.currentShare ) ).toEqual( [ 100, 50, 25 ] );
		expect( data.every( row => row.previousShare === undefined && row.delta === undefined ) ).toBe(
			true
		);
		// The value still travels: the chart only draws it in comparison mode.
		expect( data[ 0 ].previousValue ).toBe( 100 );
	} );

	it( 'keeps the first maxRows rows and sizes the shares to them', () => {
		const data = buildLeaderboardChartData( ROWS, { maxRows: 2 } );

		expect( data.map( row => row.id ) ).toEqual( [ 'a', 'b' ] );
		expect( data.map( row => row.currentShare ) ).toEqual( [ 100, 50 ] );
	} );

	it( 'defaults a row to no media and no action', () => {
		const [ row ] = buildLeaderboardChartData( [ { id: 'a', label: 'Alpha', value: 1 } ] );

		render( row.label );

		expect( screen.getByText( 'Alpha' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'img' ) ).not.toBeInTheDocument();
		expect( row.onClick ).toBeUndefined();
	} );

	it( 'turns a row with children into a drill-down when asked, over its own action', () => {
		const onSelect = jest.fn();
		const parent: LeaderboardRowInput = {
			id: 'p',
			label: 'Parent',
			value: 3,
			action: { kind: 'link', href: 'https://example.com/' },
			children: [ { id: 'c', label: 'Child', value: 1 } ],
		};

		const [ drilled ] = buildLeaderboardChartData( [ parent ], {
			drillDown: { onSelect, rowAriaLabel: row => `Open ${ row.label }` },
		} );
		drilled.onClick?.( {} as never );

		expect( drilled.ariaLabel ).toBe( 'Open Parent' );
		expect( onSelect ).toHaveBeenCalledWith( parent );

		// Without a drill-down the row keeps its link.
		render( buildLeaderboardChartData( [ parent ] )[ 0 ].label );
		expect( screen.getByRole( 'link', { name: /Parent/ } ) ).toHaveAttribute(
			'href',
			'https://example.com/'
		);
	} );
} );

describe( 'resolveDrillDownTrail', () => {
	const TREE: LeaderboardRowInput[] = [
		{
			id: 'google',
			label: 'Google',
			value: 10,
			children: [
				{
					id: 'images',
					label: 'Images',
					value: 4,
					children: [ { id: 'x', label: 'X', value: 1 } ],
				},
				{ id: 'search', label: 'Search', value: 6 },
			],
		},
		{ id: 'direct', label: 'Direct', value: 5 },
	];

	it( 'walks the path through the children', () => {
		expect( resolveDrillDownTrail( TREE, [ 'google', 'images' ] ).map( row => row.id ) ).toEqual( [
			'google',
			'images',
		] );
	} );

	it( 'stops where the path no longer matches a row with children', () => {
		expect( resolveDrillDownTrail( TREE, [ 'google', 'search' ] ).map( row => row.id ) ).toEqual( [
			'google',
		] );
		expect( resolveDrillDownTrail( TREE, [ 'direct' ] ) ).toEqual( [] );
		expect( resolveDrillDownTrail( TREE, [ 'gone' ] ) ).toEqual( [] );
	} );

	it( 'is empty without a path', () => {
		expect( resolveDrillDownTrail( TREE, null ) ).toEqual( [] );
	} );
} );
