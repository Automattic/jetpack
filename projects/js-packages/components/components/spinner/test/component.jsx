import { expect } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import Spinner from '../index';

describe( 'Spinner', () => {
	const testProps = {
		className: 'sample-classname',
	};

	describe( 'Render the Spinner component', () => {
		const renderer = new ShallowRenderer();
		renderer.render( <Spinner { ...testProps } /> );

		const wrapper = shallow( renderer.getRenderOutput() );

		it( 'component exists', () => {
			expect( wrapper.find( 'Spinner' ) ).to.exist;
		} );

		it( 'validate the class name', () => {
			expect( wrapper.hasClass( 'sample-classname' ) ).to.equal( true );
		} );
	} );
} );
