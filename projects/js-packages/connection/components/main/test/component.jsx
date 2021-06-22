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
		registrationNonce: 'test2',
		redirectUri: 'https://example.org',
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
} );
