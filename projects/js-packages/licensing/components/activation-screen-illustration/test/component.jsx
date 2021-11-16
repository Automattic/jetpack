/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import ActivationScreenIllustration from '../index';

describe( 'ActivationScreenIllustration', () => {
	describe( 'Render the ActivationScreenIllustration component with support link', () => {
		const testProps = {
			imageUrl: 'sucess.png',
			showSupportLink: true,
		};

		const wrapper = shallow( <ActivationScreenIllustration { ...testProps } /> );

		it( 'correct images src is used', () => {
			const image = wrapper.find( '.jp-license-activation-screen-illustration__img' );

			expect( image ).to.have.lengthOf( 1 );
			expect( image.prop( 'src' ) ).to.equal( testProps.imageUrl );
		} );

		it( 'support link rendered', () => {
			expect(
				wrapper.find( '.jp-license-activation-screen-illustration__support-link' )
			).to.have.lengthOf( 1 );
		} );
	} );

	describe( 'Render the ActivationScreenIllustration component without support link', () => {
		const testProps = {
			imageUrl: 'sucess.png',
			showSupportLink: false,
		};

		const wrapper = shallow( <ActivationScreenIllustration { ...testProps } /> );

		it( 'support link not rendered', () => {
			expect(
				wrapper.find( '.jp-license-activation-screen-illustration__support-link' )
			).to.have.lengthOf( 0 );
		} );
	} );
} );
