import { render, screen } from '@testing-library/react';
import ActivationScreenControls from '../index';

describe( 'ActivationScreenControls', () => {
	describe( 'Render the ActivationScreenControls with fresh props', () => {
		const testProps = {
			activateLicense: () => null,
			availableLicenses: [],
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

		it( 'disables the Activate button while activating', () => {
			render( <ActivationScreenControls { ...testProps } isActivating /> );
			const button = screen.getByRole( 'button' );
			expect( button.disabled || button.getAttribute( 'aria-disabled' ) === 'true' ).toBe( true );
		} );
	} );

	describe( 'Render the ActivationScreenControls with license error', () => {
		const testProps = {
			activateLicense: () => null,
			availableLicenses: [],
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
				// The error now renders in a @wordpress/ui Notice (.activation-screen-error).
				// eslint-disable-next-line testing-library/no-node-access
				node.closest( '.activation-screen-error' )
			).toBeInTheDocument();
		} );
	} );

	describe( 'Render the ActivationScreenControls with the license key selector', () => {
		const testProps = {
			activateLicense: () => null,
			availableLicenses: [ { product: 'jetpack-complete', license_key: 'key' } ],
			disabled: true,
			isActivating: false,
			license: 'test',
			onLicenseChange: () => null,
			siteUrl: 'jetpack.com',
		};

		it( 'Select component shows the selected license', () => {
			render( <ActivationScreenControls { ...testProps } /> );
			// The @wordpress/ui SelectControl renders a dropdown trigger (not a
			// native <select>). The selected license label shows in the trigger
			// (and again in the portalled listbox), so assert at least one match.
			expect( screen.getAllByText( 'jetpack-complete - key' ).length ).toBeGreaterThan( 0 );
		} );
	} );
} );
