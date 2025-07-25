import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { render, renderHook, screen } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import Admin from '../index';

describe( 'Admin', () => {
	beforeAll( () => {
		window.paypalPaymentButtonsInitialState = {
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
		// Look for the link in the footer.
		expect( screen.getByRole( 'link', { name: 'PayPal Payment Buttons' } ) ).toBeInTheDocument();
		expect(
			screen.getByRole( 'heading', { name: 'Connect to start accepting PayPal payments' } )
		).toBeInTheDocument();
	} );
} );
