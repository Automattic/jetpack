import { processHierarchyLevels, withHierarchyContext } from '../process-hierarchy-levels';

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
		const { levelById } = processHierarchyLevels( rows, getItemId, getItemParentId );

		expect( levelById.get( 'search' ) ).toBe( 0 );
		expect( levelById.get( 'google' ) ).toBe( 1 );
		expect( levelById.get( 'google-search' ) ).toBe( 2 );
		expect( levelById.get( 'bing' ) ).toBe( 1 );
		expect( levelById.get( 'social' ) ).toBe( 0 );
		expect( levelById.get( 'facebook' ) ).toBe( 1 );
	} );

	it( 'treats rows with an absent parent as roots', () => {
		const orphan: Row = { id: 'orphan', parentId: 'missing', referrer: 'Orphan', views: 1 };
		const { data, levelById } = processHierarchyLevels(
			[ ...rows, orphan ],
			getItemId,
			getItemParentId
		);

		expect( data.map( row => row.id ) ).toContain( 'orphan' );
		expect( levelById.get( 'orphan' ) ).toBe( 0 );
	} );

	it( 'treats self-referential rows as roots', () => {
		const selfReferential: Row = { id: 'loop', parentId: 'loop', referrer: 'Loop', views: 1 };
		const { levelById } = processHierarchyLevels( [ selfReferential ], getItemId, getItemParentId );

		expect( levelById.get( 'loop' ) ).toBe( 0 );
	} );

	it( 'emits rows in a parent cycle exactly once', () => {
		const cycle: Row[] = [
			{ id: 'a', parentId: 'b', referrer: 'A', views: 1 },
			{ id: 'b', parentId: 'a', referrer: 'B', views: 1 },
		];
		const { data, levelById } = processHierarchyLevels( cycle, getItemId, getItemParentId );

		expect( data.map( row => row.id ).sort() ).toEqual( [ 'a', 'b' ] );
		expect( levelById.get( 'a' ) ).toBe( 0 );
		expect( levelById.get( 'b' ) ).toBe( 1 );
	} );

	it( 'keeps every row when ids are empty or collide', () => {
		const noIdRows: Row[] = [
			{ id: '', referrer: 'First', views: 2 },
			{ id: '', referrer: 'Second', views: 1 },
		];
		const { data, levelById } = processHierarchyLevels( noIdRows, getItemId, getItemParentId );

		expect( data ).toHaveLength( 2 );
		expect( levelById.get( '' ) ).toBe( 0 );
	} );
} );

describe( 'withHierarchyContext', () => {
	it( 'includes the ancestor chain of a matched row, in data order', () => {
		const result = withHierarchyContext(
			rows,
			new Set( [ 'google-search' ] ),
			getItemId,
			getItemParentId
		);

		expect( result.map( row => row.id ) ).toEqual( [ 'search', 'google', 'google-search' ] );
	} );

	it( 'includes the whole subtree of a matched row', () => {
		const result = withHierarchyContext(
			rows,
			new Set( [ 'search' ] ),
			getItemId,
			getItemParentId
		);

		expect( result.map( row => row.id ) ).toEqual( [
			'search',
			'google',
			'google-search',
			'bing',
		] );
	} );

	it( 'returns a childless top-level match on its own', () => {
		const childless: Row = { id: 'direct', referrer: 'Direct', views: 12 };
		const result = withHierarchyContext(
			[ ...rows, childless ],
			new Set( [ 'direct' ] ),
			getItemId,
			getItemParentId
		);

		expect( result.map( row => row.id ) ).toEqual( [ 'direct' ] );
	} );

	it( 'collects a shared ancestor once for sibling matches', () => {
		const result = withHierarchyContext(
			rows,
			new Set( [ 'google', 'bing' ] ),
			getItemId,
			getItemParentId
		);

		expect( result.map( row => row.id ) ).toEqual( [
			'search',
			'google',
			'google-search',
			'bing',
		] );
	} );

	it( 'does not pull in the siblings of an ancestor it collected', () => {
		// `bing` is a sibling of `google`, so reaching `search` as an ancestor
		// of `google-search` must not sweep it in.
		const result = withHierarchyContext(
			rows,
			new Set( [ 'google-search' ] ),
			getItemId,
			getItemParentId
		);

		expect( result.map( row => row.id ) ).not.toContain( 'bing' );
	} );

	it( 'returns nothing when no row matched', () => {
		expect( withHierarchyContext( rows, new Set< string >(), getItemId, getItemParentId ) ).toEqual(
			[]
		);
	} );

	it( 'returns every row when all matched, preserving order', () => {
		const result = withHierarchyContext(
			rows,
			new Set( rows.map( getItemId ) ),
			getItemId,
			getItemParentId
		);

		expect( result ).toEqual( rows );
	} );

	it( 'stops at a parent absent from the data', () => {
		const orphan: Row = { id: 'orphan', parentId: 'missing', referrer: 'Orphan', views: 1 };
		const result = withHierarchyContext(
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
		const result = withHierarchyContext( cycle, new Set( [ 'a' ] ), getItemId, getItemParentId );

		expect( result.map( row => row.id ).sort() ).toEqual( [ 'a', 'b' ] );
	} );

	it( 'does not loop on a self-referential row', () => {
		const selfReferential: Row[] = [ { id: 'loop', parentId: 'loop', referrer: 'Loop', views: 1 } ];
		const result = withHierarchyContext(
			selfReferential,
			new Set( [ 'loop' ] ),
			getItemId,
			getItemParentId
		);

		expect( result.map( row => row.id ) ).toEqual( [ 'loop' ] );
	} );
} );
