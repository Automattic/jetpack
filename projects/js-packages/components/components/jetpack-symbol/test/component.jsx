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
import JetpackSymbol from '../index';

describe( 'JetpackSymbol', () => {
	const testProps = {
		className: 'sample-classname',
	};

	describe( 'Render the JetpackSymbol component', () => {
		const renderer = new ShallowRenderer();
		renderer.render( <JetpackSymbol { ...testProps } /> );

		const wrapper = shallow( renderer.getRenderOutput() );

		it( 'component exists', () => {
			expect( wrapper.find( 'JetpackSymbol' ) ).to.exist;
		} );

		it( 'validate the class name', () => {
			expect( wrapper.hasClass( 'sample-classname' ) ).to.equal( true );
		} );
	} );
} );
