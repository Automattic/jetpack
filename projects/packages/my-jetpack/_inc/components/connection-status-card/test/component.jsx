import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { useSelect } from '@wordpress/data';
import React from 'react';
import ConnectionStatusCard from '../index';

// TODO Mock requests with dummy data.
describe( 'ConnectionStatusCard', () => {
	const testProps = {
		apiNonce: 'test',
		apiRoot: 'https://example.org/wp-json/',
		redirectUri: 'https://example.org',
	};

	describe( 'When the user has not connected their WordPress.com account', () => {
		const setup = () => {
			let storeSelect;
			renderHook( () => useSelect( select => ( storeSelect = select( CONNECTION_STORE_ID ) ) ) );
			jest
				.spyOn( storeSelect, 'getConnectionStatus' )
				.mockReset()
				.mockReturnValue( { isRegistered: true, isUserConnected: false } );
			return render( <ConnectionStatusCard { ...testProps } /> );
		};

		it( 'renders the "Site connected" success list item', () => {
			setup();
			expect( screen.getByText( 'Site connected.' ) ).toBeInTheDocument();
		} );

		it( 'renders the "Manage" button', () => {
			setup();
			expect( screen.getByRole( 'button', { name: 'Manage' } ) ).toBeInTheDocument();
		} );

		it( 'renders the "You’re not connected" error list item', () => {
			setup();
			expect( screen.getByText( 'You’re not connected.' ) ).toBeInTheDocument();
		} );

		it( 'renders the "Connect your user account" button', () => {
			setup();
			expect( screen.getByRole( 'button', { name: 'Connect' } ) ).toBeInTheDocument();
		} );
	} );

	describe( "When the user has not connected their WordPress.com account but the site has an owner and we don't need a user connection", () => {
		const setup = () => {
			let storeSelect;
			renderHook( () => useSelect( select => ( storeSelect = select( CONNECTION_STORE_ID ) ) ) );
			jest.spyOn( storeSelect, 'getConnectionStatus' ).mockReset().mockReturnValue( {
				isRegistered: true,
				isUserConnected: false,
				hasConnectedOwner: true,
			} );
			return render( <ConnectionStatusCard { ...testProps } requiresUserConnection={ false } /> );
		};

		it( 'renders the "Site connected" success list item', () => {
			setup();
			expect( screen.getByText( 'Site connected.' ) ).toBeInTheDocument();
		} );

		it( 'renders the "Manage" button', () => {
			setup();
			expect( screen.getByRole( 'button', { name: 'Manage' } ) ).toBeInTheDocument();
		} );

		it( 'Render the "You’re not connected" error list item', () => {
			setup();
			expect( screen.getByText( 'You’re not connected.' ) ).toBeInTheDocument();
		} );

		it( 'renders the "Connect" button', () => {
			setup();
			expect( screen.getByRole( 'button', { name: 'Connect' } ) ).toBeInTheDocument();
		} );

		it.todo( 'Render the "Also connected:" error list item' );
	} );

	describe( 'When the user has connected their WordPress.com account', () => {
		const setup = () => {
			let storeSelect;
			renderHook( () => useSelect( select => ( storeSelect = select( CONNECTION_STORE_ID ) ) ) );
			jest.spyOn( storeSelect, 'getConnectionStatus' ).mockReset().mockReturnValue( {
				isRegistered: true,
				isUserConnected: true,
				hasConnectedOwner: true,
			} );
			return render( <ConnectionStatusCard { ...testProps } /> );
		};

		it( 'renders the "Site connected" success list item', () => {
			setup();
			expect( screen.getByText( 'Site connected.' ) ).toBeInTheDocument();
		} );

		it( 'renders the "Manage" button', () => {
			setup();
			expect( screen.getByRole( 'button', { name: 'Manage' } ) ).toBeInTheDocument();
		} );

		it( 'renders the "Logged in as" success list item', () => {
			setup();
			expect( screen.getByText( /Connected as/ ) ).toBeInTheDocument();
		} );

		it( 'Doesn\'t render the "Requires user connection" error list item', () => {
			setup();
			expect( screen.queryByText( 'Requires user connection.' ) ).not.toBeInTheDocument();
		} );

		it( 'doesn\'t render the "Connect your WordPress.com account" button', () => {
			setup();
			expect( screen.queryByRole( 'button', { name: 'Connect' } ) ).not.toBeInTheDocument();
		} );
	} );
} );
