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
import Main from '../index';

describe( 'Main', () => {
	const testProps = {
		apiNonce: 'test',
		apiRoot: 'https://example.org/wp-json/',
		authorizationUrl: 'https://jetpack.wordpress.com/jetpack.authorize/1/?response_type=code',
		hasConnectedOwner: false,
		isRegistered: false,
		isUserConnected: false,
		registrationNonce: 'test2',
	};

	describe( 'Render the Main component', () => {
		const renderer = new ShallowRenderer();
		renderer.render( <Main { ...testProps } /> );

		const wrapper = shallow( renderer.getRenderOutput() );

		it( 'component exists', () => {
			expect( wrapper.find( 'Main' ) ).to.exist;
		} );

		const button = wrapper.find( 'ForwardRef(Button)' );

		it( 'renders the register button', () => {
			expect( button.text() ).to.be.equal( 'Connect' );
		} );
	} );

	describe( 'Render the user connection - iframe', () => {
		const renderer = new ShallowRenderer();
		renderer.render( <Main { ...testProps } isRegistered={ true } /> );

		shallow( renderer.getRenderOutput() ).find( 'ForwardRef(Button)' ).simulate( 'click' );
		const wrapper = shallow( renderer.getRenderOutput() );

		it( 'renders the InPlaceConnection', () => {
			expect( wrapper.find( 'InPlaceConnection' ).props().connectUrl ).to.be.equal(
				testProps.authorizationUrl
			);
		} );
	} );

	describe( 'Render the user connection - calypso', () => {
		let redirectUrl = null;
		const redirectFunc = url => ( redirectUrl = url );

		const renderer = new ShallowRenderer();
		renderer.render(
			<Main
				{ ...testProps }
				isRegistered={ true }
				forceCalypsoFlow={ true }
				redirectFunc={ redirectFunc } // eslint-disable-line react/jsx-no-bind
			/>
		);
		shallow( renderer.getRenderOutput() ).find( 'ForwardRef(Button)' ).simulate( 'click' );

		it( 'the redirect happened', () => {
			expect( redirectUrl ).to.be.equal( testProps.authorizationUrl );
		} );
	} );
} );
