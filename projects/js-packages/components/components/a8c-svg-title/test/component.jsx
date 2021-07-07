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
import A8cSvgTitle from '../index';

describe( 'A8cSvgTitle', () => {
	const testProps = {
		className: 'sample-classname',
	};

	describe( 'Render the A8cSvgTitle component', () => {
		const renderer = new ShallowRenderer();
		renderer.render( <A8cSvgTitle { ...testProps } /> );

		const wrapper = shallow( renderer.getRenderOutput() );

		it( 'component exists', () => {
			expect( wrapper.find( 'A8cSvgTitle' ) ).to.exist;
		} );

		it( 'validate the class name', () => {
			expect( wrapper.hasClass( 'sample-classname' ) ).to.equal( true );
		} );
	} );
} );
