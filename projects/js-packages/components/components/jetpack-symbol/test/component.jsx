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
import JetpackLogoOnly from '../index';

describe( 'JetpackLogoOnly', () => {
	const testProps = {
		className: 'sample-classname',
	};

	describe( 'Render the JetpackLogoOnly component', () => {
		const renderer = new ShallowRenderer();
		renderer.render( <JetpackLogoOnly { ...testProps } /> );

		const wrapper = shallow( renderer.getRenderOutput() );

		it( 'component exists', () => {
			expect( wrapper.find( 'JetpackLogoOnly' ) ).to.exist;
		} );

		it( 'validate the class name', () => {
			expect( wrapper.hasClass( 'sample-classname' ) ).to.equal( true );
		} );
	} );
} );
