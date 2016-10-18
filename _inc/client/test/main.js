/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { createMockStore } from 'redux-test-utils';

/**
 * Internal dependencies
 */
import Main from '../main';

describe( 'Main', () => {
	it( 'should render the Main component', () => {

		const MainConnected = connect( state => ({
			state
		}) )( Main );

		const component = shallow( <MainConnected />, {
			context: {
				store: createMockStore( 'JETPACK_SET_INITIAL_STATE' )
			}
		} );

		expect( component.find( 'Main' ) ).to.exist;
	});
} );