/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { AuthIframe } from '../index';

describe( 'AuthIframe', () => {

	const testProps = {
		fetchingConnectUrl: true,
		connectUrl: 'https://jetpack.wordpress.com/jetpack.authorize/1/',
		scrollToIframe: false,
		hasConnectedOwner: false,
		displayTOS: false,
	};

	describe( 'Initially (connect url still fetching)', () => {

		const wrapper = shallow( <AuthIframe { ...testProps } /> );

		it( 'is loading', () => {
			expect( wrapper.find( 'InPlaceConnection' ).props().isLoading ).to.be.true;
		} );
	} );

	// Fetching done
	testProps.fetchingConnectUrl = false;

	describe( 'When the connect url is fetched', () => {

		const wrapper = shallow( <AuthIframe { ...testProps } /> );

		it( 'is no longer loading', () => {
			expect( wrapper.find( 'InPlaceConnection' ).props().isLoading ).to.be.false;
		} );

		it( 'has a link to jetpack.wordpress.com', () => {
			expect( wrapper.find( 'InPlaceConnection' ).props().connectUrl ).to.be.equal( 'https://jetpack.wordpress.com/jetpack.authorize/1/' );
		} );

		it( 'has 100% width', () => {
			expect( wrapper.find( 'InPlaceConnection' ).props().width ).to.be.equal( '100%' );
		} );

		it( 'has 330 height', () => {
			expect( wrapper.find( 'InPlaceConnection' ).props().height ).to.be.equal( '330' );
		} );
	} );

} );
