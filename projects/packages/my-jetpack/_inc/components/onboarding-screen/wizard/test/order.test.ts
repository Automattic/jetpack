import { SETUP_MODULES, orderSetupModules } from '../use-setup-modules';
import type { SetupModuleSlug } from '../use-setup-modules';

const ALL = SETUP_MODULES as readonly SetupModuleSlug[];

describe( 'Ordering the feature list by what the site is for', () => {
	it( 'leads a blog with its readers', () => {
		expect( orderSetupModules( 'blog', ALL ).slice( 0, 2 ) ).toEqual( [
			'stats',
			'subscriptions',
		] );
	} );

	it( 'leads a store with staying up and staying locked', () => {
		expect( orderSetupModules( 'store', ALL ).slice( 0, 2 ) ).toEqual( [ 'monitor', 'protect' ] );
	} );

	it( 'leads a portfolio and a business site with being contacted', () => {
		expect( orderSetupModules( 'portfolio', ALL )[ 0 ] ).toBe( 'contact-form' );
		expect( orderSetupModules( 'business', ALL )[ 0 ] ).toBe( 'contact-form' );
	} );

	// Free text and a skipped question both arrive here as nothing to order by.
	it( 'leaves the written order alone when there is no answer', () => {
		expect( orderSetupModules( undefined, ALL ) ).toEqual( [ ...ALL ] );
		expect( orderSetupModules( 'other', ALL ) ).toEqual( [ ...ALL ] );
	} );

	// The sort has to be total: a site missing a module still gets a full list of
	// what it does have, and an order that forgot one still renders it.
	it( 'keeps every module it is given, whatever the order says', () => {
		const some: SetupModuleSlug[] = [ 'monitor', 'stats' ];

		expect( orderSetupModules( 'store', some ).sort() ).toEqual( some.sort() );
		expect( orderSetupModules( 'blog', ALL ) ).toHaveLength( ALL.length );
	} );
} );
