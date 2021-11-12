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
import ConnectScreenRequiredPlan from '../index';

describe( 'ConnectScreenRequiredPlan', () => {
	const testProps = {
		apiNonce: 'test',
		apiRoot: 'https://example.org/wp-json/',
		registrationNonce: 'test2',
		redirectUri: 'https://example.org',
		priceBefore: 9,
		priceAfter: 4.5,
		pricingTitle: 'Dummy',
	};

	describe( 'Render the ConnectScreenRequiredPlan component', () => {
		const renderer = new ShallowRenderer();
		renderer.render( <ConnectScreenRequiredPlan { ...testProps } /> );

		const wrapper = shallow( renderer.getRenderOutput() );

		it( 'component exists', () => {
			expect( wrapper.find( 'ConnectScreenRequiredPlan' ) ).to.exist;
		} );

		it( 'logo component exists', () => {
			expect( wrapper.find( 'JetpackLogo' ) ).to.exist;
		} );

		it( 'pricing card component exists', () => {
			expect( wrapper.find( 'PricingCard' ) ).to.exist;
		} );

		it( 'connect button exists', () => {
			expect( wrapper.find( 'ConnectButton' ) ).to.exist;
		} );
	} );
} );
