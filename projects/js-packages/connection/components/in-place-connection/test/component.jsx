/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import InPlaceConnection from '../index';

describe( 'InPlaceConnection', () => {
	const testProps = {
		title: 'Sample Title',
		connectUrl: 'https://jetpack.wordpress.com/jetpack.authorize/1/',
		scrollToIframe: false,
		displayTOS: false,
		location: 'testing',
	};

	describe( 'Loading state', () => {
		const wrapper = shallow( <InPlaceConnection { ...testProps } isLoading={ true } /> );

		it( 'renders a "loading..." message', () => {
			expect( wrapper.find( 'p' ).text() ).to.be.equal( 'Loading…' );
		} );
	} );

	describe( 'When the connect url is fetched', () => {
		const wrapper = shallow( <InPlaceConnection { ...testProps } /> );

		it( 'has a link to jetpack.wordpress.com', () => {
			expect( wrapper.find( 'iframe' ).props().src ).to.be.equal(
				'https://jetpack.wordpress.com/jetpack.authorize_iframe/1/?&iframe_height=220&iframe_source=testing'
			);
		} );

		it( 'has 100% width', () => {
			expect( wrapper.find( 'iframe' ).props().width ).to.be.equal( '100%' );
		} );

		it( 'has 220 height', () => {
			expect( wrapper.find( 'iframe' ).props().height ).to.be.equal( '220' );
		} );
	} );

	describe( 'Secondary user, add "tos" flag to URL', () => {
		const wrapper = shallow( <InPlaceConnection { ...testProps } displayTOS={ true } /> );

		it( 'has a link to jetpack.wordpress.com', () => {
			expect( wrapper.find( 'iframe' ).props().src ).to.be.contain( '&display-tos' );
		} );
	} );
} );
