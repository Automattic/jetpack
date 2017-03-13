/**
 * External dependencies
 */
import React from 'react';
import { Provider } from 'react-redux';
import { expect } from 'chai';
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import Main from '../main';
import store from 'state/redux-store';

describe( 'Main', () => {
	it( 'should render the Main component', () => {
		const component = shallow( <Provider store={ store }><Main /></Provider> );
		expect( component.find( 'Main' ) ).to.exist;
	} );
} );
