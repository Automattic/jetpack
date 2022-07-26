import restApi from '@automattic/jetpack-api';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import ActivationScreen from '..';

describe( 'ActivationScreen', () => {
	const testProps = {
		assetBaseUrl: 'jetpack.com',
		lockImage: '/lock.png',
		siteAdminUrl: 'jetpack.com/wp-admin',
		siteRawUrl: 'jetpack.com',
		successImage: '/success.png',
	};

	const apiStub = jest.spyOn( restApi, 'attachLicenses' ).mockReset();

	afterEach( () => {
		apiStub.mockReset();
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
