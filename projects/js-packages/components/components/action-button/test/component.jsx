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
import ActionButton from '../index';

describe( 'ActionButton', () => {
	const testProps = {
		label: 'Action!',
	};

	describe( 'Render the ActionButton component', () => {
		const renderer = new ShallowRenderer();
		renderer.render( <ActionButton { ...testProps } /> );

		const wrapper = shallow( renderer.getRenderOutput() );

		it( 'component exists', () => {
			expect( wrapper.find( 'ActionButton' ) ).to.exist;
		} );

		const button = wrapper.find( 'ForwardRef(Button)' );

		it( 'renders the register button', () => {
			expect( button.text() ).to.be.equal( 'Action!' );
		} );
	} );
} );
