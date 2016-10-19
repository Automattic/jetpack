/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { Masthead } from '../index';

describe( 'Masthead', () => {

	let component = shallow( <Masthead /> );

	it( 'renders main nav', () => {
		expect( component.find( 'Masthead' ) ).to.exist;
	} );

	it( 'finds selector .jp-masthead in main nav', () => {
		expect( component.find( '.jp-masthead' ) ).to.have.length( 1 );
	} );

	it( 'does not display the Dev Mode badge when connected', () => {
		expect( component.find( 'code' ) ).to.have.length( 0 );
	} );

	it( 'displays the badge in Dev Mode', () => {
		component = shallow( <Masthead siteConnectionStatus="dev"/> );
		expect( component.find( 'code' ) ).to.have.length( 1 );
	} );
} );