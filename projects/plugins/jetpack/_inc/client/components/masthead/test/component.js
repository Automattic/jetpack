import { shallow } from 'enzyme';
import React from 'react';
import { Masthead } from '../index';

describe( 'Masthead', () => {
	let component = shallow( <Masthead /> );

	it( 'renders main nav', () => {
		expect( component.find( 'Masthead' ) ).toBeDefined();
	} );

	it( 'finds selector .jp-masthead in main nav', () => {
		expect( component.find( '.jp-masthead' ) ).toHaveLength( 1 );
	} );

	it( 'does not display the Offline Mode badge when connected', () => {
		expect( component.find( 'code' ) ).toHaveLength( 0 );
	} );

	it( 'displays the badge in Offline Mode', () => {
		component = shallow( <Masthead siteConnectionStatus="offline" /> );
		expect( component.find( 'code' ) ).toHaveLength( 1 );
	} );
} );
