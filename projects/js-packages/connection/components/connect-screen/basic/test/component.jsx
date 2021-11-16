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
import ConnectScreen from '../index';

describe( 'ConnectScreen', () => {
	const testProps = {
		apiNonce: 'test',
		apiRoot: 'https://example.org/wp-json/',
		registrationNonce: 'test2',
		redirectUri: 'https://example.org',
	};

	describe( 'Render the ConnectScreen component', () => {
		const renderer = new ShallowRenderer();
		renderer.render( <ConnectScreen { ...testProps } /> );

		const wrapper = shallow( renderer.getRenderOutput() );

		it( 'component exists', () => {
			expect( wrapper.find( 'ConnectScreen' ) ).to.exist;
		} );

		it( 'logo component exists', () => {
			expect( wrapper.find( 'JetpackLogo' ) ).to.exist;
		} );

		it( 'connect button exists', () => {
			expect( wrapper.find( 'ConnectButton' ) ).to.exist;
		} );
	} );
} );
