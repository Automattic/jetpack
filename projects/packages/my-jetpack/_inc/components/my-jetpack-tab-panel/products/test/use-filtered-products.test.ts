import { renderHook } from '@testing-library/react';
import { useFilteredProducts } from '../use-filtered-products';

const product = ( slug: string ) => ( { slug, name: slug, title: slug, status: 'active' } );
const jetpackModule = ( slug: string ) => ( {
	module: slug,
	name: slug,
	activated: true,
	available: true,
	override: false,
	description: '',
	long_description: '',
	search_terms: '',
} );

jest.mock( '../../../../data/products/use-all-products', () => ( {
	useAllProducts: () => ( {
		data: Object.fromEntries( [ 'search', 'stats', 'backup' ].map( s => [ s, product( s ) ] ) ),
	} ),
} ) );

jest.mock( '../use-all-jetpack-modules', () => ( {
	useAllJetpackModules: () => ( {
		modules: Object.fromEntries(
			[ 'search', 'stats', 'activity-log', 'monitor' ].map( s => [ s, jetpackModule( s ) ] )
		),
		isLoading: false,
	} ),
} ) );

const listedSlugs = ( search?: string ) => {
	const { result } = renderHook( () =>
		useFilteredProducts( { search, selectedFilter: undefined } )
	);
	const { sections, searchResults } = result.current;

	return [
		...sections.flatMap( section => [
			...section.cards.map( card => card.product.slug ),
			...section.modules.map( m => m.module ),
		] ),
		...searchResults.map( item =>
			item.kind === 'card' ? item.card.product.slug : item.module.module
		),
	];
};

describe( 'useFilteredProducts', () => {
	afterEach( () => {
		delete window.myJetpackInitialState;
	} );

	it( 'lists every card and module when no host hid anything', () => {
		window.myJetpackInitialState = { myJetpackFlags: {} } as typeof window.myJetpackInitialState;

		expect( listedSlugs() ).toEqual( expect.arrayContaining( [ 'search', 'activity-log' ] ) );
	} );

	it( 'drops the cards and module rows a host hid', () => {
		window.myJetpackInitialState = {
			myJetpackFlags: {},
			hiddenFeatures: [ 'search', 'activity-log' ],
		} as typeof window.myJetpackInitialState;

		const listed = listedSlugs();

		expect( listed ).toEqual( expect.arrayContaining( [ 'stats', 'backup', 'monitor' ] ) );
		expect( listed ).not.toContain( 'search' );
		expect( listed ).not.toContain( 'activity-log' );
	} );

	it( 'keeps what a host hid out of search results', () => {
		window.myJetpackInitialState = {
			myJetpackFlags: {},
			hiddenFeatures: [ 'activity-log' ],
		} as typeof window.myJetpackInitialState;

		expect( listedSlugs( 'activity' ) ).not.toContain( 'activity-log' );
	} );
} );
