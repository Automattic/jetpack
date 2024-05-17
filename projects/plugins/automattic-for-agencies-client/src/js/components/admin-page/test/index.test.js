import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { render, renderHook, screen } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import React from 'react';
import Admin from '../index';

describe( 'Admin', () => {
	beforeAll( () => {
		window.automatticForAgenciesClientInitialState = {
			apiNonce: '',
			apiRoot: '',
			registrationNonce: '',
		};
	} );

	test( 'Renders the component', () => {
		let storeSelect;

		renderHook( () => useSelect( select => ( storeSelect = select( CONNECTION_STORE_ID ) ) ) );
		jest
			.spyOn( storeSelect, 'getConnectionStatus' )
			.mockReset()
			.mockReturnValue( { isRegistered: false, isUserConnected: false } );

		render( <Admin /> );
		expect( screen.getByLabelText( 'Automattic For Agencies Client' ) ).toBeInTheDocument();
		expect(
			screen.getByRole( 'heading', { name: 'Connection screen title' } )
		).toBeInTheDocument();
	} );
} );
