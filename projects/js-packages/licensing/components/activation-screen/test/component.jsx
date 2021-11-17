/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import ActivationScreen from '..';
import ActivationScreenControls from '../../activation-screen-controls';

describe( 'ActivationScreen', () => {

	describe( 'Render the ActivationScreen with fresh props', () => {
		const testProps = {
			assetBaseUrl: 'jetpack.com',
			lockImage: '/lock.png',
			siteRawUrl: 'jetpack.com',
			successImage: '/success.png',
		};

		const wrapper = shallow( <ActivationScreen { ...testProps } /> );

		it( 'Renders ActivationScreenControls first', () => {
			const activationScreenControls = wrapper.find( ActivationScreenControls );

			expect( activationScreenControls ).to.have.lengthOf( 1 );
		} );
	} );
} );
