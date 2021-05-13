/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import ShallowRenderer from 'react-test-renderer/shallow';

/**
 * Internal dependencies
 */
import ConnectUser from '../index';

describe( 'ConnectUser', () => {
	const testProps = {
		connectUrl: 'https://jetpack.wordpress.com/jetpack.authorize/1/?response_type=code',
		displayTOS: true,
		from: 'example',
	};

	describe( 'Render the user connection - iframe', () => {
		const renderer = new ShallowRenderer();
		renderer.render( <ConnectUser { ...testProps } /> );
		const wrapper = shallow( renderer.getRenderOutput() );

		it( 'renders the InPlaceConnection', () => {
			expect( wrapper.find( 'iframe' ).props().src ).to.be.equal(
				testProps.connectUrl.replace( '.authorize', '.authorize_iframe' ) +
					'&display-tos&iframe_height=350'
			);
		} );
	} );

	describe( 'Render the user connection - calypso', () => {
		let redirectUrl = null;
		const redirectFunc = url => ( redirectUrl = url );

		const renderer = new ShallowRenderer();
		renderer.render(
			<ConnectUser
				{ ...testProps }
				forceCalypsoFlow={ true }
				redirectFunc={ redirectFunc } // eslint-disable-line react/jsx-no-bind
			/>
		);

		it( 'the redirect happened', () => {
			expect( redirectUrl ).to.be.equal( testProps.connectUrl + '&from=' + testProps.from );
		} );
	} );
} );
