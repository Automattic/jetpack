/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import { cleanLocale } from '../';

describe( 'cleanLocale', () => {
	it( 'en_US locale is cleaned into en-US', () => {
		expect( cleanLocale( 'en_US' ) ).to.be.equal( 'en-US' );
	} );
	it( 'de_DE_formal locale is cleaned into de-DE', () => {
		expect( cleanLocale( 'de_DE_formal' ) ).to.be.equal( 'de-DE' );
	} );
	it( 'en locale does not change', () => {
		expect( cleanLocale( 'en' ) ).to.be.equal( 'en' );
	} );
} );
