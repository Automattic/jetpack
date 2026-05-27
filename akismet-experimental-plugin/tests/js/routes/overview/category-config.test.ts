import { CATEGORIES, type CategoryDefinition } from '@/routes/overview/category-config';

describe( 'CATEGORIES', () => {
	it( 'contains the six expected category ids in display order', () => {
		expect( CATEGORIES.map( c => c.id ) ).toEqual( [
			'comments',
			'forms',
			'logins',
			'checkouts',
			'bots',
			'brute-force',
		] );
	} );

	it( 'every entry has a unique id', () => {
		const ids = CATEGORIES.map( c => c.id );
		expect( new Set( ids ).size ).toBe( ids.length );
	} );

	it( 'every entry has a non-empty label and short copy', () => {
		for ( const c of CATEGORIES ) {
			expect( c.label.length ).toBeGreaterThan( 0 );
			expect( c.short.length ).toBeGreaterThan( 0 );
		}
	} );

	it( 'comments resolves via the akismet-stats fetch kind', () => {
		const comments = CATEGORIES.find( c => c.id === 'comments' )!;
		expect( comments.fetch ).toEqual( { kind: 'akismet-stats' } );
	} );

	it( 'four blackbox-aggregates categories — logins, forms, bots, brute-force', () => {
		const bbox: CategoryDefinition[] = CATEGORIES.filter(
			c => c.fetch.kind === 'blackbox-aggregates'
		);
		expect( bbox.map( c => c.id ).sort() ).toEqual( [ 'bots', 'brute-force', 'forms', 'logins' ] );
	} );

	it( 'checkouts requires woocommerce and uses the woocommerce-fraud fetch kind', () => {
		const checkouts = CATEGORIES.find( c => c.id === 'checkouts' )!;
		expect( checkouts.fetch ).toEqual( { kind: 'woocommerce-fraud' } );
		expect( checkouts.requires ).toBe( 'woocommerce' );
	} );
} );
