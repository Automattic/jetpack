import { processHierarchyLevels } from '../process-hierarchy-levels';

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

	it( 'falls back to the row index when getItemId returns an empty id', () => {
		const noIdRows: Row[] = [
			{ id: '', referrer: 'First', views: 2 },
			{ id: '', referrer: 'Second', views: 1 },
		];
		const { data, levelById } = processHierarchyLevels( noIdRows, getItemId, getItemParentId );

		expect( data ).toHaveLength( 2 );
		expect( levelById.get( '0' ) ).toBe( 0 );
		expect( levelById.get( '1' ) ).toBe( 0 );
	} );
} );
