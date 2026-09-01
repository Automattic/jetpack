import restApi from '@automattic/jetpack-api';
import { jest } from '@jest/globals';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActivationScreen from '..';

describe( 'ActivationScreen', () => {
	const testProps = {
		assetBaseUrl: 'jetpack.com',
		lockImage: '/lock.png',
		siteAdminUrl: 'jetpack.com/wp-admin',
		siteRawUrl: 'jetpack.com',
		successImage: '/success.png',
	};

	const apiStub = jest.spyOn( restApi, 'attachLicenses' ).mockReturnValue();

	afterEach( () => {
		apiStub.mockReset().mockReturnValue();
	} );

	it( 'should render ActivationScreenControls first', () => {
		render( <ActivationScreen { ...testProps } /> );
		expect( screen.getByLabelText( 'License key' ) ).toBeInTheDocument();
	} );

	it( 'should render an error from API', async () => {
		const user = userEvent.setup();
		render( <ActivationScreen { ...testProps } startingLicense={ 'a' } /> );

		// stub the api to return an error
		apiStub.mockResolvedValue( [ { errors: { 400: [ 'an error' ] } } ] );

		await user.click( screen.getByRole( 'button', { name: 'Activate' } ) );
		expect( screen.getByText( 'an error' ) ).toBeInTheDocument();
	} );

	it( 'keeps a visible error when a background refetch returns the same license key', async () => {
		const user = userEvent.setup();
		const { rerender } = render(
			<ActivationScreen
				{ ...testProps }
				availableLicenses={ [ { product: 'Jetpack Backup', license_key: 'abc' } ] }
			/>
		);

		apiStub.mockResolvedValue( [ { errors: { 400: [ 'an error' ] } } ] );
		await user.click( screen.getByRole( 'button', { name: 'Activate' } ) );
		expect( screen.getByText( 'an error' ) ).toBeInTheDocument();

		// A refetch hands back a new array reference with the same first key; the
		// error on the current key must survive it.
		rerender(
			<ActivationScreen
				{ ...testProps }
				availableLicenses={ [ { product: 'Jetpack Backup', license_key: 'abc' } ] }
			/>
		);
		expect( screen.getByText( 'an error' ) ).toBeInTheDocument();

		// @wordpress/ui's SelectControl schedules an async positioner update on mount;
		// flush it here (inside act) so it doesn't leak an act() warning into a later test.
		await act( async () => {
			await new Promise( resolve => setTimeout( resolve, 0 ) );
		} );
	} );

	it( 'should render success with an activated product id from API', async () => {
		const user = userEvent.setup();
		render( <ActivationScreen { ...testProps } startingLicense={ 'a' } /> );

		// stub the api to return an activated product id
		apiStub.mockResolvedValue( [ [ { activatedProductId: 3000 } ] ] );

		await user.click( screen.getByRole( 'button', { name: 'Activate' } ) );
		expect(
			screen.getByRole( 'heading', { name: /Your product is active!/ } )
		).toBeInTheDocument();
	} );

	it( 'should render a generic error for malformed response', async () => {
		const user = userEvent.setup();
		render( <ActivationScreen { ...testProps } startingLicense={ 'a' } /> );

		// stub the api to return a malformed response
		apiStub.mockResolvedValue( [ { bug: 'an error' } ] );

		await user.click( screen.getByRole( 'button', { name: 'Activate' } ) );
		expect(
			screen.getByText( 'An unknown error occurred during license activation. Please try again.' )
		).toBeInTheDocument();
	} );

	it( 'should call onActivationSuccess if activation successful', async () => {
		const user = userEvent.setup();
		const onActivationSuccessSpy = jest.fn();
		render(
			<ActivationScreen
				{ ...testProps }
				startingLicense={ 'a' }
				onActivationSuccess={ onActivationSuccessSpy }
			/>
		);

		// stub the api to return an activated product id
		apiStub.mockResolvedValue( [ [ { activatedProductId: 3000 } ] ] );

		await user.click( screen.getByRole( 'button', { name: 'Activate' } ) );
		expect( onActivationSuccessSpy ).toHaveBeenCalledTimes( 1 );
		expect( onActivationSuccessSpy ).toHaveBeenCalledWith( 3000 );
	} );
} );
