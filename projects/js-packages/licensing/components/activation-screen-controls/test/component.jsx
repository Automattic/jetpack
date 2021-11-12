/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import ActivationScreenControls from '../index';

describe( 'ActivationScreenControls', () => {
	describe( 'Render the ActivationScreenControls with fresh props', () => {
		const testProps = {
			activateLicense: () => null,
			disabled: false,
			license: 'test',
			onLicenseChange: () => null,
			siteUrl: 'jetpack.com',
		};

		const wrapper = shallow( <ActivationScreenControls { ...testProps } /> );

		it( 'correct license is shown', () => {
			const licenseField = wrapper.find( '.jp-license-activation-screen-controls--license-field' );

			expect( licenseField ).to.have.lengthOf( 1 );
			expect( licenseField.prop( 'value' ) ).to.equal( testProps.license );
		} );
	} );

	describe( 'Render the ActivationScreenControls disabled', () => {
		const testProps = {
			activateLicense: () => null,
			disabled: true,
			license: 'test',
			onLicenseChange: () => null,
			siteUrl: 'jetpack.com',
		};

		const wrapper = shallow( <ActivationScreenControls { ...testProps } /> );

		it( 'controls are correctly disabled', () => {
			const licenseField = wrapper.find( '.jp-license-activation-screen-controls--license-field' );

			expect( licenseField ).to.have.lengthOf( 1 );
			expect( licenseField.prop( 'disabled' ) ).to.equal( true );

			const activateButton = wrapper.find( '.jp-license-activation-screen-controls--button' );

			expect( activateButton ).to.have.lengthOf( 1 );
			expect( activateButton.prop( 'disabled' ) ).to.equal( true );
		} );
	} );

	describe( 'Render the ActivationScreenControls with license error', () => {
		const testProps = {
			activateLicense: () => null,
			disabled: true,
			license: 'test',
			onLicenseChange: () => null,
			siteUrl: 'jetpack.com',
		};

		const wrapper = shallow( <ActivationScreenControls { ...testProps } /> );

		{
			/* 		it( 'correct license is shown', () => {
			const licenseField = wrapper.find( '.jp-license-activation-screen-controls--license-field' );

			expect( licenseField ).to.have.lengthOf( 1 );
			expect( licenseField.prop('value') ).to.equal( testProps.license );
		} ); */
		}
	} );
} );
