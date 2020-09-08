/**
 * @jest-environment jsdom
 */

/**
 * Internal dependencies
 */
import TwitterThreadListener from '..';

describe( 'TwitterThreadListener', () => {
	it( 'should expose the listener component', () => {
		expect( TwitterThreadListener ).toBeDefined();
	} );
} );
