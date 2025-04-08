import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import OwnerDisconnectDialog from '../index';

// Mock the external dependencies
jest.mock( '@automattic/jetpack-analytics', () => ( {
	tracks: {
		recordEvent: jest.fn(),
	},
} ) );

jest.mock( '@automattic/jetpack-api', () => ( {
	setApiRoot: jest.fn(),
	setApiNonce: jest.fn(),
	unlinkUser: jest.fn().mockResolvedValue( {} ),
} ) );

describe( 'OwnerDisconnectDialog', () => {
	const defaultProps = {
		isOpen: true,
		onClose: jest.fn(),
		apiRoot: 'https://example.com/wp-json',
		apiNonce: 'test-nonce',
		onDisconnected: jest.fn(),
	};

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should render the dialog when isOpen is true', () => {
		render( <OwnerDisconnectDialog { ...defaultProps } /> );

		expect( screen.getByText( 'Disconnect Owner Account' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Transfer ownership to another admin' ) ).toBeInTheDocument();
		expect( screen.getByText( 'View other connected accounts' ) ).toBeInTheDocument();
	} );

	it( 'should call onClose when "Stay Connected" is clicked', async () => {
		const user = userEvent.setup();
		render( <OwnerDisconnectDialog { ...defaultProps } /> );

		await user.click( screen.getByText( 'Stay Connected' ) );
		expect( defaultProps.onClose ).toHaveBeenCalled();
	} );

	it( 'should show loading state when disconnecting', async () => {
		const user = userEvent.setup();
		render( <OwnerDisconnectDialog { ...defaultProps } /> );

		const disconnectButton = screen.getByText( 'Disconnect' );
		await user.click( disconnectButton );

		expect( screen.getByText( 'Disconnecting…' ) ).toBeInTheDocument();
		expect( disconnectButton ).toBeDisabled();
	} );

	it( 'should call onDisconnected when disconnect is successful', async () => {
		const mockUnlinkUser = jest.fn().mockResolvedValue( {} );
		require( '@automattic/jetpack-api' ).unlinkUser = mockUnlinkUser;

		render( <OwnerDisconnectDialog { ...defaultProps } /> );
		const user = userEvent.setup();
		await user.click( screen.getByText( 'Disconnect' ) );

		await expect( screen.findByText( 'Disconnecting…' ) ).resolves.toBeInTheDocument();
		expect( mockUnlinkUser ).toHaveBeenCalledWith( true, { disconnectAllUsers: true } );
		expect( defaultProps.onDisconnected ).toHaveBeenCalled();
	} );

	it( 'should show error message when disconnect fails', async () => {
		require( '@automattic/jetpack-api' ).unlinkUser.mockRejectedValueOnce(
			new Error( 'Failed to disconnect' )
		);

		render( <OwnerDisconnectDialog { ...defaultProps } /> );
		const user = userEvent.setup();
		await user.click( screen.getByText( 'Disconnect' ) );

		await expect(
			screen.findByText( 'There was a problem disconnecting your account. Please try again.' )
		).resolves.toBeInTheDocument();
		expect( defaultProps.onDisconnected ).not.toHaveBeenCalled();
	} );
} );
