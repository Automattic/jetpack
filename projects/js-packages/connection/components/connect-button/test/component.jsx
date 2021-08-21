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
import ConnectButton from '../index';

describe( 'ConnectButton', () => {
	const testProps = {
		apiNonce: 'test',
		apiRoot: 'https://example.org/wp-json/',
		registrationNonce: 'test2',
		redirectUri: 'https://example.org',
		connectionStatus: {
			isRegistered: false,
			isUserConnected: false,
		},
		connectionStatusIsFetching: false,
	};

	describe( 'Render the ConnectButton component', () => {
		const renderer = new ShallowRenderer();
		renderer.render( <ConnectButton { ...testProps } /> );

		const wrapper = shallow( renderer.getRenderOutput() );

		it( 'component exists', () => {
			expect( wrapper.find( 'ConnectButton' ) ).to.exist;
		} );

		const button = wrapper.find( 'ForwardRef(Button)' );

		it( 'renders the register button', () => {
			expect( button.text() ).to.be.equal( 'Connect' );
		} );
	} );
} );
