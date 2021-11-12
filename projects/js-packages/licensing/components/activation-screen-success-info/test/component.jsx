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
import ActivationSuccessInfo from '../index';

describe( 'ActivationSuccessInfo', () => {

	const testProps = {
		productId: 2100,
		dashboardUrl: 'jetpack.com'
	};

	describe( 'Render the ActivationSuccessInfo component', () => {
		const renderer = new ShallowRenderer();
		renderer.render( <ActivationSuccessInfo { ...testProps } /> );

		const wrapper = shallow( renderer.getRenderOutput() );

		it( 'component exists', () => {
				expect( wrapper.find( 'ActivationSuccessInfo' ) ).to.exist;
			} );


	} );

} );
