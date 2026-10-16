import { collectAncestorIds, findParentIds, filterCollapsedRows } from '../collapsible-rows';

type Row = {
	id: string;
	parentId?: string;
	referrer: string;
};

const rows: Row[] = [
	{ id: 'search', referrer: 'Search Engines' },
	{ id: 'google', parentId: 'search', referrer: 'Google' },
	{ id: 'google-search', parentId: 'google', referrer: 'Google Search' },
	{ id: 'bing', parentId: 'search', referrer: 'Bing' },
	{ id: 'social', referrer: 'Social' },
	{ id: 'facebook', parentId: 'social', referrer: 'Facebook' },
];

const getItemId = ( item: Row ) => item.id;

const levelById = new Map( [
	[ 'search', 0 ],
	[ 'google', 1 ],
	[ 'google-search', 2 ],
	[ 'bing', 1 ],
	[ 'social', 0 ],
	[ 'facebook', 1 ],
] );

const visibleIds = ( collapsedIds: string[] ) =>
	filterCollapsedRows( rows, getItemId, levelById, id => ! collapsedIds.includes( id ) ).map(
		getItemId
	);

describe( 'filterCollapsedRows', () => {
	it( 'keeps every row when nothing is collapsed', () => {
		expect( visibleIds( [] ) ).toEqual( [
			'search',
			'google',
			'google-search',
			'bing',
			'social',
			'facebook',
		] );
	} );

	it( 'keeps a collapsed row itself and drops its whole subtree', () => {
		expect( visibleIds( [ 'search' ] ) ).toEqual( [ 'search', 'social', 'facebook' ] );
	} );

	it( 'drops only the collapsed branch, leaving deeper siblings visible', () => {
		expect( visibleIds( [ 'google' ] ) ).toEqual( [
			'search',
			'google',
			'bing',
			'social',
			'facebook',
		] );
	} );

	it( 'ignores a collapsed leaf, which has no subtree to hide', () => {
		expect( visibleIds( [ 'bing' ] ) ).toEqual( [
			'search',
			'google',
			'google-search',
			'bing',
			'social',
			'facebook',
		] );
	} );

	it( 'treats a row with no recorded level as a root', () => {
		const orphan: Row[] = [ ...rows, { id: 'stray', referrer: 'Stray' } ];

		expect(
			filterCollapsedRows( orphan, getItemId, levelById, id => id !== 'search' ).map( getItemId )
		).toEqual( [ 'search', 'social', 'facebook', 'stray' ] );
	} );
} );

describe( 'findParentIds', () => {
	const getItemParentId = ( item: Row ) => item.parentId;

	it( 'returns the ids of rows that have at least one child', () => {
		expect( [ ...findParentIds( rows, getItemId, getItemParentId ) ].sort() ).toEqual( [
			'google',
			'search',
			'social',
		] );
	} );

	it( 'ignores a child whose parent is absent from the rows', () => {
		const detached: Row[] = [ { id: 'orphan', parentId: 'gone', referrer: 'Orphan' } ];

		expect( [ ...findParentIds( detached, getItemId, getItemParentId ) ] ).toEqual( [] );
	} );

	it( 'ignores a self-referential parent', () => {
		const loop: Row[] = [ { id: 'loop', parentId: 'loop', referrer: 'Loop' } ];

		expect( [ ...findParentIds( loop, getItemId, getItemParentId ) ] ).toEqual( [] );
	} );
} );

describe( 'collectAncestorIds', () => {
	const getItemParentId = ( item: Row ) => item.parentId;
	const ancestorsOf = ( ids: string[] ) =>
		[ ...collectAncestorIds( rows, new Set( ids ), getItemId, getItemParentId ) ].sort();

	it( 'returns every ancestor of a match, without the match itself', () => {
		expect( ancestorsOf( [ 'google-search' ] ) ).toEqual( [ 'google', 'search' ] );
	} );

	it( 'leaves out the siblings the match does not sit under', () => {
		expect( ancestorsOf( [ 'google' ] ) ).toEqual( [ 'search' ] );
	} );

	it( 'returns nothing for a root match', () => {
		expect( ancestorsOf( [ 'social' ] ) ).toEqual( [] );
	} );

	it( 'stops on a parent cycle instead of looping', () => {
		const cyclic: Row[] = [
			{ id: 'a', parentId: 'b', referrer: 'A' },
			{ id: 'b', parentId: 'a', referrer: 'B' },
		];

		expect(
			[ ...collectAncestorIds( cyclic, new Set( [ 'a' ] ), getItemId, getItemParentId ) ].sort()
		).toEqual( [ 'a', 'b' ] );
	} );
} );
