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
import AutomatticBylineLogo from '../index';

describe( 'AutomatticBylineLogo', () => {
	const testProps = {
		className: 'sample-classname',
	};

	describe( 'Render the AutomatticBylineLogo component', () => {
		const renderer = new ShallowRenderer();
		renderer.render( <AutomatticBylineLogo { ...testProps } /> );

		const wrapper = shallow( renderer.getRenderOutput() );

		it( 'component exists', () => {
			expect( wrapper.find( 'AutomatticBylineLogo' ) ).to.exist;
		} );

		it( 'validate the class name', () => {
			expect( wrapper.hasClass( 'sample-classname' ) ).to.equal( true );
		} );
	} );
} );
