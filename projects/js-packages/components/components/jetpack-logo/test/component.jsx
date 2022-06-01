import { expect } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import JetpackLogo from '../index';

describe( 'JetpackLogo', () => {
	const testProps = {
		className: 'sample-classname',
	};

	describe( 'Render the JetpackLogo component', () => {
		const renderer = new ShallowRenderer();
		renderer.render( <JetpackLogo { ...testProps } /> );

		const wrapper = shallow( renderer.getRenderOutput() );

		it( 'component exists', () => {
			expect( wrapper.find( 'JetpackLogo' ) ).to.exist;
		} );

		it( 'validate the class name', () => {
			expect( wrapper.hasClass( 'sample-classname' ) ).to.equal( true );
		} );
	} );
} );
