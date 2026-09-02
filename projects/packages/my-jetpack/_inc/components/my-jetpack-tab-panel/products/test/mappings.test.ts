import { PRODUCT_MODULES } from '../mappings';

describe( 'PRODUCT_MODULES', () => {
	it( 'backs the AI card with the ai module for everyone', () => {
		expect( PRODUCT_MODULES[ 'jetpack-ai' ] ).toBe( 'ai' );
		expect( PRODUCT_MODULES[ 'jetpack-forms' ] ).toBe( 'contact-form' );
	} );
} );
