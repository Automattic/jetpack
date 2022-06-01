import { expect } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import JetpackFooter from '../index';

describe( 'JetpackFooter', () => {
	const testProps = {
		className: 'sample-classname',
	};

	describe( 'Render the JetpackFooter component', () => {
		const renderer = new ShallowRenderer();
		renderer.render( <JetpackFooter { ...testProps } /> );

		const wrapper = shallow( renderer.getRenderOutput() );

		it( 'component exists', () => {
			expect( wrapper.find( 'JetpackFooter' ) ).to.exist;
		} );

		it( 'validate the class name', () => {
			expect( wrapper.hasClass( 'sample-classname' ) ).to.equal( true );
		} );
	} );
} );
