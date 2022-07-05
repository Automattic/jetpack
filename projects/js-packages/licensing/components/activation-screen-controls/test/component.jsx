import { render, screen } from '@testing-library/react';
import React from 'react';
import ActivationScreenControls from '../index';

describe( 'ActivationScreenControls', () => {
	describe( 'Render the ActivationScreenControls with fresh props', () => {
		const testProps = {
			activateLicense: () => null,
			disabled: false,
			isActivating: false,
			license: 'test',
			onLicenseChange: () => null,
			siteUrl: 'jetpack.com',
		};

		it( 'correct license is shown', () => {
			render( <ActivationScreenControls { ...testProps } /> );
			expect( screen.getByLabelText( 'License key' ) ).toHaveValue( testProps.license );
		} );
	} );

	describe( 'Render the ActivationScreenControls with license error', () => {
		const testProps = {
			activateLicense: () => null,
			disabled: true,
			isActivating: false,
			license: 'test',
			licenseError: 'Invalid license.',
			onLicenseChange: () => null,
			siteUrl: 'jetpack.com',
		};

		it( 'license field has error styling', () => {
			render( <ActivationScreenControls { ...testProps } /> );
			const input = screen.getByLabelText( 'License key' );
			expect(
				// eslint-disable-next-line testing-library/no-node-access
				input.closest( '.jp-license-activation-screen-controls--license-field-with-error' )
			).toBeInTheDocument();
		} );

		it( 'license error is shown', () => {
			render( <ActivationScreenControls { ...testProps } /> );
			const node = screen.getByText( 'Invalid license.' );
			expect( node ).toBeInTheDocument();
			expect(
				// eslint-disable-next-line testing-library/no-node-access
				node.closest( '.jp-license-activation-screen-controls--license-field-error' )
			).toBeInTheDocument();
		} );
	} );
} );
