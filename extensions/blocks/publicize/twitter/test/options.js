/**
 * @jest-environment jsdom
 */

/**
 * Internal dependencies
 */
import PublicizeTwitterOptions from '../options';

describe( 'PublicizeTwitterOptions', () => {
	it( 'should expose the options component', () => {
		expect( PublicizeTwitterOptions ).toBeDefined();
	} );
} );
