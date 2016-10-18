/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { expect } from 'chai';
import { mount } from 'enzyme';
import { createMockStore } from 'redux-test-utils';

/**
 * Internal dependencies
 */
import Masthead from '../index.jsx';

describe( 'Masthead', () => {

	let state = {
		jetpack: {
			initialState: {
				currentVersion: '4.3.2'
			},
			connection: {
				status: {
					siteConnected: {
						isActive: true,
						devMode: {
							isActive: false
						}
					}
				}
			}
		}
	};

	const component = mount( <Masthead />, {
		context: {
			store: createMockStore( state )
		}
	} );

	it( 'should render main nav', () => {
		expect( component.find( 'Masthead' ) ).to.exist;
	} );

	it( 'should find selector .jp-masthead in main nav', () => {
		expect( component.find( '.jp-masthead' ) ).to.have.length( 1 );
	} );

	it( 'should display the Dev Mode badge when connected', () => {
		expect( component.find( 'code' ) ).to.have.length( 0 );
	} );

	it( 'should display the badge in Dev Mode', () => {

		// Mock Dev Mode
		state.jetpack.connection.status.siteConnected = {
			isActive: false,
			devMode: {
				isActive: true
			}
		};
		const componentDevMode = mount( <Masthead />, {
			context: {
				store: createMockStore( state )
			}
		} );
		expect( componentDevMode.find( 'code' ) ).to.have.length( 1 );
	} );
} );