/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';

/**
 * Internal dependencies
 */
import ActivationSuccessInfo from '..';
import JetpackProductDetails from '../product-details';

describe( 'ActivationSuccessInfo', () => {
	const testProps = {
		productId: 2100,
		siteRawUrl: 'http://test-site.jurassic.ninja',
	};

	describe( 'Render the ActivationSuccessInfo component', () => {
		const wrapper = mount( <ActivationSuccessInfo { ...testProps } /> );

		const jetpackProductDetailsComponent = wrapper.find( JetpackProductDetails );

		it( 'correct product class is used', () => {
			expect( jetpackProductDetailsComponent ).to.have.lengthOf( 1 );
		} );

		it( 'shows the correct product name', () => {
			expect( jetpackProductDetailsComponent.text() ).to.contain(
				'Your Jetpack Backup is active!'
			);
		} );
	} );
} );
