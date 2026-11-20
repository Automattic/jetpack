import { getProductModules, PRODUCT_MODULES } from '../mappings';

describe( 'getProductModules', () => {
	it( 'omits the AI mapping while the pre-release gate is on', () => {
		window.myJetpackInitialState = {
			myJetpackFlags: {},
		} as unknown as Window[ 'myJetpackInitialState' ];

		const map = getProductModules();

		// No AI mapping means AI cards resolve no module, exactly as they did
		// before AI became a module. Other products keep theirs.
		expect( map ).not.toHaveProperty( 'jetpack-ai' );
		expect( map[ 'jetpack-forms' ] ).toBe( 'contact-form' );
	} );

	it( 'keeps the AI mapping for internal testing environments', () => {
		window.myJetpackInitialState = {
			myJetpackFlags: { showAiModuleToggle: true },
		} as unknown as Window[ 'myJetpackInitialState' ];

		expect( getProductModules() ).toEqual( PRODUCT_MODULES );
	} );
} );
