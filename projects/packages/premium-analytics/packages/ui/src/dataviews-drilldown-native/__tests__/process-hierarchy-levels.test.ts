import { processHierarchyLevels, withAncestors } from '../process-hierarchy-levels';

type Row = {
	id: string;
	parentId?: string;
	referrer: string;
	views: number;
};

const rows: Row[] = [
	{ id: 'search', referrer: 'Search Engines', views: 625 },
	{ id: 'google', parentId: 'search', referrer: 'Google', views: 485 },
	{ id: 'google-search', parentId: 'google', referrer: 'Google Search', views: 420 },
	{ id: 'bing', parentId: 'search', referrer: 'Bing', views: 86 },
	{ id: 'social', referrer: 'Social', views: 345 },
	{ id: 'facebook', parentId: 'social', referrer: 'Facebook', views: 210 },
];

const getItemId = ( item: Row ) => item.id;
const getItemParentId = ( item: Row ) => item.parentId;

describe( 'processHierarchyLevels', () => {
	it( 'emits rows in depth-first hierarchy order', () => {
		const { data } = processHierarchyLevels( rows, getItemId, getItemParentId );

		expect( data.map( row => row.id ) ).toEqual( [
			'search',
			'google',
			'google-search',
			'bing',
			'social',
			'facebook',
		] );
	} );

	it( 'orders children under their parent regardless of input order', () => {
		const shuffled = [ rows[ 5 ], rows[ 2 ], rows[ 0 ], rows[ 4 ], rows[ 3 ], rows[ 1 ] ];
		const { data } = processHierarchyLevels( shuffled, getItemId, getItemParentId );

		// Roots and siblings keep their input order; children still land
		// under their parent.
		expect( data.map( row => row.id ) ).toEqual( [
			'search',
			'bing',
			'google',
			'google-search',
			'social',
			'facebook',
		] );
	} );

	it( 'resolves each row depth for getItemLevel', () => {
		const { levelByItem } = processHierarchyLevels( rows, getItemId, getItemParentId );

		expect( levelByItem.get( rows[ 0 ] ) ).toBe( 0 ); // search
		expect( levelByItem.get( rows[ 1 ] ) ).toBe( 1 ); // google
		expect( levelByItem.get( rows[ 2 ] ) ).toBe( 2 ); // google-search
		expect( levelByItem.get( rows[ 3 ] ) ).toBe( 1 ); // bing
		expect( levelByItem.get( rows[ 4 ] ) ).toBe( 0 ); // social
		expect( levelByItem.get( rows[ 5 ] ) ).toBe( 1 ); // facebook
	} );

	it( 'treats rows with an absent parent as roots', () => {
		const orphan: Row = { id: 'orphan', parentId: 'missing', referrer: 'Orphan', views: 1 };
		const { data, levelByItem } = processHierarchyLevels(
			[ ...rows, orphan ],
			getItemId,
			getItemParentId
		);

		expect( data.map( row => row.id ) ).toContain( 'orphan' );
		expect( levelByItem.get( orphan ) ).toBe( 0 );
	} );

	it( 'treats self-referential rows as roots', () => {
		const selfReferential: Row = { id: 'loop', parentId: 'loop', referrer: 'Loop', views: 1 };
		const { levelByItem } = processHierarchyLevels(
			[ selfReferential ],
			getItemId,
			getItemParentId
		);

		expect( levelByItem.get( selfReferential ) ).toBe( 0 );
	} );

	it( 'emits rows in a parent cycle exactly once', () => {
		const cycle: Row[] = [
			{ id: 'a', parentId: 'b', referrer: 'A', views: 1 },
			{ id: 'b', parentId: 'a', referrer: 'B', views: 1 },
		];
		const { data, levelByItem } = processHierarchyLevels( cycle, getItemId, getItemParentId );

		expect( data.map( row => row.id ).sort() ).toEqual( [ 'a', 'b' ] );
		expect( levelByItem.get( cycle[ 0 ] ) ).toBe( 0 );
		expect( levelByItem.get( cycle[ 1 ] ) ).toBe( 1 );
	} );

	it( 'keeps every row when ids are empty or collide', () => {
		const noIdRows: Row[] = [
			{ id: '', referrer: 'First', views: 2 },
			{ id: '', referrer: 'Second', views: 1 },
		];
		const { data, levelByItem } = processHierarchyLevels( noIdRows, getItemId, getItemParentId );

		expect( data ).toHaveLength( 2 );
		expect( levelByItem.get( noIdRows[ 0 ] ) ).toBe( 0 );
		expect( levelByItem.get( noIdRows[ 1 ] ) ).toBe( 0 );
	} );
} );

describe( 'withAncestors', () => {
	it( 'includes the ancestor chain of a matched row, in data order', () => {
		const result = withAncestors(
			rows,
			new Set( [ 'google-search' ] ),
			getItemId,
			getItemParentId
		);

		expect( result.map( row => row.id ) ).toEqual( [ 'search', 'google', 'google-search' ] );
	} );

	it( 'returns a top-level match on its own', () => {
		const result = withAncestors( rows, new Set( [ 'social' ] ), getItemId, getItemParentId );

		expect( result.map( row => row.id ) ).toEqual( [ 'social' ] );
	} );

	it( 'collects a shared ancestor once for sibling matches', () => {
		const result = withAncestors(
			rows,
			new Set( [ 'google', 'bing' ] ),
			getItemId,
			getItemParentId
		);

		expect( result.map( row => row.id ) ).toEqual( [ 'search', 'google', 'bing' ] );
	} );

	it( 'returns nothing when no row matched', () => {
		expect( withAncestors( rows, new Set< string >(), getItemId, getItemParentId ) ).toEqual( [] );
	} );

	it( 'returns every row when all matched, preserving order', () => {
		const result = withAncestors(
			rows,
			new Set( rows.map( getItemId ) ),
			getItemId,
			getItemParentId
		);

		expect( result ).toEqual( rows );
	} );

	it( 'stops at a parent absent from the data', () => {
		const orphan: Row = { id: 'orphan', parentId: 'missing', referrer: 'Orphan', views: 1 };
		const result = withAncestors(
			[ ...rows, orphan ],
			new Set( [ 'orphan' ] ),
			getItemId,
			getItemParentId
		);

		expect( result.map( row => row.id ) ).toEqual( [ 'orphan' ] );
	} );

	it( 'does not loop on a parent cycle', () => {
		const cycle: Row[] = [
			{ id: 'a', parentId: 'b', referrer: 'A', views: 1 },
			{ id: 'b', parentId: 'a', referrer: 'B', views: 1 },
		];
		const result = withAncestors( cycle, new Set( [ 'a' ] ), getItemId, getItemParentId );

		expect( result.map( row => row.id ).sort() ).toEqual( [ 'a', 'b' ] );
	} );
} );
