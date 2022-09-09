import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { useSelect } from '@wordpress/data';
import React from 'react';
import { STORE_ID } from '../../../state/store';
import ConnectionStatusCard from '../index';

// TODO Mock requests with dummy data.
describe( 'ConnectionStatusCard', () => {
	const testProps = {
		apiNonce: 'test',
		apiRoot: 'https://example.org/wp-json/',
		redirectUri: 'https://example.org',
	};

	describe( 'When the user has not connected their Jetpack account', () => {
		const setup = () => {
			let storeSelect;
			renderHook( () => useSelect( select => ( storeSelect = select( STORE_ID ) ) ) );
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

		it( 'renders the "Disconnect" button', () => {
			setup();
			expect( screen.getByRole( 'button', { name: 'Disconnect' } ) ).toBeInTheDocument();
		} );

		it( 'renders the "Requires user connection" error list item', () => {
			setup();
			expect( screen.getByText( 'Requires user connection.' ) ).toBeInTheDocument();
		} );

		it( 'renders the "Connect your user account" button', () => {
			setup();
			expect(
				screen.getByRole( 'button', { name: 'Connect your user account' } )
			).toBeInTheDocument();
		} );
	} );

	describe( "When the user has not connected their Jetpack account but the site has an owner and we don't need a user connection", () => {
		const setup = () => {
			let storeSelect;
			renderHook( () => useSelect( select => ( storeSelect = select( STORE_ID ) ) ) );
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

		it( 'renders the "Disconnect" button', () => {
			setup();
			expect( screen.getByRole( 'button', { name: 'Disconnect' } ) ).toBeInTheDocument();
		} );

		it( 'Doesn\'t render the "Requires user connection" error list item', () => {
			setup();
			expect( screen.queryByText( 'Requires user connection.' ) ).not.toBeInTheDocument();
		} );

		it( 'renders the "Connect your user account" button', () => {
			setup();
			expect(
				screen.getByRole( 'button', { name: 'Connect your user account' } )
			).toBeInTheDocument();
		} );
	} );

	describe( 'When the user has connected their Jetpack account', () => {
		const setup = () => {
			let storeSelect;
			renderHook( () => useSelect( select => ( storeSelect = select( STORE_ID ) ) ) );
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

		it( 'renders the "Disconnect" button', () => {
			setup();
			expect( screen.getByRole( 'button', { name: 'Disconnect' } ) ).toBeInTheDocument();
		} );

		it( 'renders the "Logged in as" success list item', () => {
			setup();
			expect( screen.getByText( /Logged in as/ ) ).toBeInTheDocument();
		} );

		it( 'Doesn\'t render the "Requires user connection" error list item', () => {
			setup();
			expect( screen.queryByText( 'Requires user connection.' ) ).not.toBeInTheDocument();
		} );

		it( 'doesn\'t render the "Connect your Jetpack account" button', () => {
			setup();
			expect(
				screen.queryByRole( 'button', { name: 'Connect your user account' } )
			).not.toBeInTheDocument();
		} );
	} );
} );
