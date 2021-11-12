/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import ActivationSuccessInfo from '..';
import { JetpackBackupDailyProductDetails } from '../product-details'

describe( 'ActivationSuccessInfo', () => {

	const testProps = {
		productId: 2100,
		dashboardUrl: 'jetpack.com'
	};

	describe( 'Render the ActivationSuccessInfo component', () => {

		const wrapper = shallow( <ActivationSuccessInfo { ...testProps } /> );

		it( 'correct product class is used', () => {
			expect( wrapper.find( JetpackBackupDailyProductDetails ) ).to.have.lengthOf( 1 );
		} );

	} );

} );
