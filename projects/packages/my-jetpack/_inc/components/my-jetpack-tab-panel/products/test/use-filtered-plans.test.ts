import { renderHook } from '@testing-library/react';
import { useFilteredPlans } from '../use-filtered-plans';

const product = ( slug: string ) => ( {
	slug,
	name: slug,
	title: slug,
	relatedPlanSlugs: [ 'jetpack_complete' ],
} );
const jetpackModule = ( slug: string ) => ( {
	module: slug,
	name: slug,
	activated: true,
	available: true,
	override: false,
} );

jest.mock( '../../../../data/use-simple-query', () => ( {
	__esModule: true,
	default: () => ( {
		data: [ { ID: 1, product_name: 'Complete', product_slug: 'jetpack_complete' } ],
		isLoading: false,
		error: null,
	} ),
} ) );

jest.mock( '../../../../data/products/use-all-products', () => ( {
	useAllProducts: () => ( {
		data: Object.fromEntries( [ 'search', 'stats' ].map( s => [ s, product( s ) ] ) ),
	} ),
} ) );

jest.mock( '../use-all-jetpack-modules', () => ( {
	useAllJetpackModules: () => ( {
		modules: Object.fromEntries(
			[ 'activity-log', 'blaze' ].map( s => [ s, jetpackModule( s ) ] )
		),
		isLoading: false,
	} ),
} ) );

describe( 'useFilteredPlans', () => {
	afterEach( () => {
		delete window.myJetpackInitialState;
	} );

	it( 'drops the plan cards and free modules a host hid', () => {
		window.myJetpackInitialState = {
			myJetpackFlags: {},
			hiddenFeatures: [ 'search', 'activity-log' ],
		} as typeof window.myJetpackInitialState;

		const { result } = renderHook( () => useFilteredPlans( { search: undefined } ) );
		const listed = result.current.plans.flatMap( plan => [
			...( plan.cards ?? [] ).map( card => card.product.slug ),
			...( plan.modules ?? [] ).map( m => m.module ),
		] );

		expect( listed ).toEqual( expect.arrayContaining( [ 'stats', 'blaze' ] ) );
		expect( listed ).not.toContain( 'search' );
		expect( listed ).not.toContain( 'activity-log' );
	} );
} );
