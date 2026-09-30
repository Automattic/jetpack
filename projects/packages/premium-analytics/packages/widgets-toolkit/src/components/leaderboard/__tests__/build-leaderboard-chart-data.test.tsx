/**
 * Internal dependencies
 */
import {
	buildLeaderboardChartData,
	type LeaderboardRowInput,
} from '../build-leaderboard-chart-data';
import type { LeaderboardRowProps } from '../../chart-leaderboard/leaderboard-row';
import type { ReactElement } from 'react';

const rowProps = ( label: unknown ) => ( label as ReactElement ).props as LeaderboardRowProps;

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

		expect( rowProps( row.label ) ).toEqual( {
			label: 'Alpha',
			media: { kind: 'none' },
			action: { kind: 'static' },
		} );
		expect( row.onClick ).toBeUndefined();
	} );

	it( 'fills the dashboard window into a detail link that declares none', () => {
		const detailSearch = { from: '2026-06-01', to: '2026-06-16' };
		const [ video, post, own ] = buildLeaderboardChartData(
			[
				{ id: 'v', label: 'Video', value: 1, action: { kind: 'videoLink', id: 7 } },
				{ id: 'p', label: 'Post', value: 1, action: { kind: 'postLink', id: 9, href: '/p' } },
				{ id: 'o', label: 'Own', value: 1, action: { kind: 'postLink', id: 3, search: {} } },
			],
			{ detailSearch }
		);

		expect( rowProps( video.label ).action ).toEqual( {
			kind: 'videoLink',
			id: 7,
			search: detailSearch,
		} );
		expect( rowProps( post.label ).action ).toEqual( {
			kind: 'postLink',
			id: 9,
			href: '/p',
			search: detailSearch,
		} );
		expect( rowProps( own.label ).action ).toEqual( { kind: 'postLink', id: 3, search: {} } );
	} );

	it( 'carries a drill-down action to the chart row', () => {
		const onClick = jest.fn();
		const [ row ] = buildLeaderboardChartData( [
			{
				id: 'd',
				label: 'Drill',
				value: 1,
				action: { kind: 'drillDown', onClick, ariaLabel: 'View Drill' },
			},
		] );

		expect( row.onClick ).toBe( onClick );
		expect( row.ariaLabel ).toBe( 'View Drill' );
	} );
} );
