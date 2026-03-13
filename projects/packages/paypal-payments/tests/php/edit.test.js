/* eslint-disable testing-library/no-node-access, testing-library/prefer-user-event */
/**
 * PayPal Payment Buttons — Editor Component Tests
 *
 * Tests for the block editor React component covering:
 * - Loading state while checking connection
 * - Connection form when not connected
 * - Product creation form when connected
 * - Button preview after creation
 * - Legacy block detection
 * - API calls for connect/create/update/delete
 *
 * @package
 * @since 0.7.0
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch'; // eslint-disable-line import/no-unresolved
import PayPalPaymentButtonsEdit from './edit'; // eslint-disable-line import/no-unresolved

// Mock @wordpress/api-fetch.
jest.mock( '@wordpress/api-fetch' );

// Mock @wordpress/block-editor.
jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: () => ( { className: 'wp-block-jetpack-paypal-payment-buttons' } ),
	InspectorControls: ( { children } ) => <div data-testid="inspector-controls">{ children }</div>,
} ) );

// Default block attributes for a fresh block.
const defaultAttributes = {
	apiManaged: false,
	resourceId: '',
	paymentUrl: '',
	productName: '',
	price: '',
	currency: 'USD',
	productDescription: '',
	buttonLabel: 'Buy Now',
	buttonType: '',
	scriptSrc: '',
	hostedButtonId: '',
	buttonText: '',
};

// Helper to render the component with default/override attributes.
const renderEdit = ( attributeOverrides = {}, setAttributes = jest.fn() ) => {
	const attributes = { ...defaultAttributes, ...attributeOverrides };
	return {
		...render(
			<PayPalPaymentButtonsEdit attributes={ attributes } setAttributes={ setAttributes } />
		),
		setAttributes,
	};
};

describe( 'PayPalPaymentButtonsEdit', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	// ─── Loading state ───

	describe( 'Loading state', () => {
		it( 'shows a spinner while checking connection status', () => {
			// apiFetch never resolves — stays in loading state.
			apiFetch.mockReturnValue( new Promise( () => {} ) );

			renderEdit();

			expect( screen.getByText( 'PayPal Payment Buttons' ) ).toBeInTheDocument();
			// Spinner is rendered (WordPress Spinner component).
			expect( document.querySelector( '.components-spinner' ) ).toBeTruthy();
		} );
	} );

	// ─── Connection form (not connected) ───

	describe( 'Connection form', () => {
		beforeEach( () => {
			apiFetch.mockResolvedValueOnce( { connected: false } );
		} );

		it( 'renders the connection form when not connected', async () => {
			renderEdit();

			await waitFor( () => {
				expect( screen.getByText( /Connect your PayPal account/ ) ).toBeInTheDocument();
			} );

			expect( screen.getByLabelText( /Client ID/i ) ).toBeInTheDocument();
			expect( screen.getByLabelText( /Client Secret/i ) ).toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: /Connect PayPal/i } ) ).toBeInTheDocument();
		} );

		it( 'disables the connect button when fields are empty', async () => {
			renderEdit();

			await waitFor( () => {
				expect( screen.getByRole( 'button', { name: /Connect PayPal/i } ) ).toBeDisabled();
			} );
		} );

		it( 'enables the connect button when both fields are filled', async () => {
			const user = userEvent.setup();
			renderEdit();

			await waitFor( () => {
				expect( screen.getByLabelText( /Client ID/i ) ).toBeInTheDocument();
			} );

			await user.type( screen.getByLabelText( /Client ID/i ), 'AWxR123' );
			await user.type( screen.getByLabelText( /Client Secret/i ), 'EL1t456' );

			expect( screen.getByRole( 'button', { name: /Connect PayPal/i } ) ).toBeEnabled();
		} );

		it( 'calls the connect endpoint and updates state on success', async () => {
			const user = userEvent.setup();
			apiFetch.mockResolvedValueOnce( {
				connected: true,
				environment: 'sandbox',
				message: 'Connected.',
			} );

			renderEdit();

			await waitFor( () => {
				expect( screen.getByLabelText( /Client ID/i ) ).toBeInTheDocument();
			} );

			await user.type( screen.getByLabelText( /Client ID/i ), 'AWxR123' );
			await user.type( screen.getByLabelText( /Client Secret/i ), 'EL1t456' );
			await user.click( screen.getByRole( 'button', { name: /Connect PayPal/i } ) );

			await waitFor( () => {
				expect( apiFetch ).toHaveBeenCalledWith(
					expect.objectContaining( {
						path: '/jetpack/v4/paypal/connect',
						method: 'POST',
						data: expect.objectContaining( {
							client_id: 'AWxR123',
							client_secret: 'EL1t456',
						} ),
					} )
				);
			} );

			// After successful connection, should show the product form.
			await waitFor( () => {
				expect( screen.getByLabelText( /Product Name/i ) ).toBeInTheDocument();
			} );
		} );

		it( 'shows an error notice when connection fails', async () => {
			const user = userEvent.setup();
			apiFetch.mockRejectedValueOnce( {
				message: 'Invalid credentials.',
			} );

			renderEdit();

			await waitFor( () => {
				expect( screen.getByLabelText( /Client ID/i ) ).toBeInTheDocument();
			} );

			await user.type( screen.getByLabelText( /Client ID/i ), 'bad-id' );
			await user.type( screen.getByLabelText( /Client Secret/i ), 'bad-secret' );
			await user.click( screen.getByRole( 'button', { name: /Connect PayPal/i } ) );

			await waitFor( () => {
				expect( screen.getByText( 'Invalid credentials.' ) ).toBeInTheDocument();
			} );
		} );
	} );

	// ─── Product creation form (connected, no button yet) ───

	describe( 'Product creation form', () => {
		beforeEach( () => {
			apiFetch.mockResolvedValueOnce( { connected: true, environment: 'sandbox' } );
		} );

		it( 'renders the product form when connected', async () => {
			renderEdit();

			await waitFor( () => {
				expect( screen.getByText( /Create PayPal Button/i ) ).toBeInTheDocument();
			} );

			expect( screen.getByLabelText( /Product Name/i ) ).toBeInTheDocument();
			expect( screen.getByLabelText( /Price/i ) ).toBeInTheDocument();
			expect( screen.getByLabelText( /Currency/i ) ).toBeInTheDocument();
			expect( screen.getByLabelText( /Description/i ) ).toBeInTheDocument();
			expect( screen.getByLabelText( /Button Label/i ) ).toBeInTheDocument();
		} );

		it( 'disables the create button when form is invalid', async () => {
			renderEdit();

			await waitFor( () => {
				expect( screen.getByRole( 'button', { name: /Create Button/i } ) ).toBeDisabled();
			} );
		} );

		it( 'calls the create endpoint with correct data', async () => {
			const setAttributes = jest.fn();
			apiFetch.mockResolvedValueOnce( {
				id: 'PLB-ABC123',
				payment_link: 'https://www.paypal.com/ncp/payment/PLB-ABC123',
				status: 'ACTIVE',
			} );

			renderEdit(
				{
					productName: 'Test Product',
					price: '29.99',
					currency: 'USD',
				},
				setAttributes
			);

			await waitFor( () => {
				expect( screen.getByRole( 'button', { name: /Create Button/i } ) ).toBeEnabled();
			} );

			fireEvent.click( screen.getByRole( 'button', { name: /Create Button/i } ) );

			await waitFor( () => {
				expect( apiFetch ).toHaveBeenCalledWith(
					expect.objectContaining( {
						path: '/jetpack/v4/paypal/buttons',
						method: 'POST',
						data: expect.objectContaining( {
							type: 'BUY_NOW',
							integration_mode: 'LINK',
							reusable: 'MULTIPLE',
							line_items: [
								expect.objectContaining( {
									name: 'Test Product',
									unit_amount: {
										currency_code: 'USD',
										value: '29.99',
									},
								} ),
							],
						} ),
					} )
				);
			} );

			// Should set apiManaged, resourceId, and paymentUrl attributes.
			await waitFor( () => {
				expect( setAttributes ).toHaveBeenCalledWith( {
					apiManaged: true,
					resourceId: 'PLB-ABC123',
					paymentUrl: 'https://www.paypal.com/ncp/payment/PLB-ABC123',
				} );
			} );
		} );

		it( 'shows an error when button creation fails', async () => {
			apiFetch.mockRejectedValueOnce( {
				message: 'Missing required field: name.',
			} );

			renderEdit( {
				productName: 'Test',
				price: '10.00',
			} );

			await waitFor( () => {
				expect( screen.getByRole( 'button', { name: /Create Button/i } ) ).toBeEnabled();
			} );

			fireEvent.click( screen.getByRole( 'button', { name: /Create Button/i } ) );

			await waitFor( () => {
				expect( screen.getByText( /Missing required field/ ) ).toBeInTheDocument();
			} );
		} );
	} );

	// ─── Button preview (API-managed button exists) ───

	describe( 'Button preview', () => {
		beforeEach( () => {
			apiFetch.mockResolvedValueOnce( { connected: true, environment: 'sandbox' } );
		} );

		it( 'renders the button preview when apiManaged is true', async () => {
			renderEdit( {
				apiManaged: true,
				resourceId: 'PLB-XYZ789',
				paymentUrl: 'https://www.paypal.com/ncp/payment/PLB-XYZ789',
				productName: 'My Product',
				price: '49.99',
				currency: 'EUR',
				buttonLabel: 'Purchase',
			} );

			await waitFor( () => {
				expect( screen.getByText( 'My Product' ) ).toBeInTheDocument();
			} );

			expect( screen.getByText( /49\.99/ ) ).toBeInTheDocument();
			expect( screen.getByText( /EUR/ ) ).toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: 'Purchase' } ) ).toBeInTheDocument();
		} );

		it( 'shows edit and delete buttons in the sidebar', async () => {
			renderEdit( {
				apiManaged: true,
				resourceId: 'PLB-XYZ789',
				paymentUrl: 'https://www.paypal.com/ncp/payment/PLB-XYZ789',
				productName: 'My Product',
				price: '49.99',
				currency: 'EUR',
			} );

			await waitFor( () => {
				expect( screen.getByText( 'My Product' ) ).toBeInTheDocument();
			} );

			expect( screen.getByRole( 'button', { name: /Edit Button/i } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: /Delete Button/i } ) ).toBeInTheDocument();
		} );

		it( 'switches to edit mode when Edit Button is clicked', async () => {
			renderEdit( {
				apiManaged: true,
				resourceId: 'PLB-XYZ789',
				paymentUrl: 'https://www.paypal.com/ncp/payment/PLB-XYZ789',
				productName: 'My Product',
				price: '49.99',
				currency: 'EUR',
			} );

			await waitFor( () => {
				expect( screen.getByText( 'My Product' ) ).toBeInTheDocument();
			} );

			fireEvent.click( screen.getByRole( 'button', { name: /Edit Button/i } ) );

			await waitFor( () => {
				expect( screen.getByText( /Edit PayPal Button/i ) ).toBeInTheDocument();
			} );

			// Should show Update Button, not Create Button.
			expect( screen.getByRole( 'button', { name: /Update Button/i } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: /Cancel/i } ) ).toBeInTheDocument();
		} );

		it( 'calls the update endpoint when updating', async () => {
			const setAttributes = jest.fn();
			apiFetch.mockResolvedValueOnce( {
				id: 'PLB-XYZ789',
				payment_link: 'https://www.paypal.com/ncp/payment/PLB-XYZ789',
			} );

			renderEdit(
				{
					apiManaged: true,
					resourceId: 'PLB-XYZ789',
					paymentUrl: 'https://www.paypal.com/ncp/payment/PLB-XYZ789',
					productName: 'Updated Product',
					price: '59.99',
					currency: 'USD',
				},
				setAttributes
			);

			await waitFor( () => {
				expect( screen.getByText( 'Updated Product' ) ).toBeInTheDocument();
			} );

			// Enter edit mode.
			fireEvent.click( screen.getByRole( 'button', { name: /Edit Button/i } ) );

			await waitFor( () => {
				expect( screen.getByRole( 'button', { name: /Update Button/i } ) ).toBeEnabled();
			} );

			fireEvent.click( screen.getByRole( 'button', { name: /Update Button/i } ) );

			await waitFor( () => {
				expect( apiFetch ).toHaveBeenCalledWith(
					expect.objectContaining( {
						path: '/jetpack/v4/paypal/buttons/PLB-XYZ789',
						method: 'PUT',
					} )
				);
			} );
		} );

		it( 'calls the delete endpoint and resets attributes on delete', async () => {
			const setAttributes = jest.fn();
			apiFetch.mockResolvedValueOnce( {
				deleted: true,
				resource_id: 'PLB-XYZ789',
			} );

			renderEdit(
				{
					apiManaged: true,
					resourceId: 'PLB-XYZ789',
					paymentUrl: 'https://www.paypal.com/ncp/payment/PLB-XYZ789',
					productName: 'To Delete',
					price: '10.00',
				},
				setAttributes
			);

			await waitFor( () => {
				expect( screen.getByText( 'To Delete' ) ).toBeInTheDocument();
			} );

			fireEvent.click( screen.getByRole( 'button', { name: /Delete Button/i } ) );

			await waitFor( () => {
				expect( apiFetch ).toHaveBeenCalledWith(
					expect.objectContaining( {
						path: '/jetpack/v4/paypal/buttons/PLB-XYZ789',
						method: 'DELETE',
					} )
				);
			} );

			await waitFor( () => {
				expect( setAttributes ).toHaveBeenCalledWith(
					expect.objectContaining( {
						apiManaged: false,
						resourceId: '',
						paymentUrl: '',
					} )
				);
			} );
		} );
	} );

	// ─── Legacy block detection ───

	describe( 'Legacy block', () => {
		beforeEach( () => {
			apiFetch.mockResolvedValueOnce( { connected: true, environment: 'sandbox' } );
		} );

		it( 'shows a legacy notice for paste-code blocks', async () => {
			renderEdit( {
				buttonType: 'single',
				hostedButtonId: 'HOSTED123',
				buttonText: 'Pay Now',
			} );

			await waitFor( () => {
				expect( screen.getByText( /Legacy/ ) ).toBeInTheDocument();
			} );

			expect( screen.getByText( /paste-code method/ ) ).toBeInTheDocument();
		} );

		it( 'shows a legacy notice for stacked paste-code blocks', async () => {
			renderEdit( {
				buttonType: 'stacked',
				scriptSrc: 'https://www.paypal.com/sdk/js?components=hosted-buttons',
				hostedButtonId: 'HOSTED456',
			} );

			await waitFor( () => {
				expect( screen.getByText( /Legacy/ ) ).toBeInTheDocument();
			} );
		} );
	} );

	// ─── Disconnect flow ───

	describe( 'Disconnect', () => {
		it( 'calls disconnect endpoint and returns to connection form', async () => {
			apiFetch
				.mockResolvedValueOnce( { connected: true, environment: 'sandbox' } ) // initial status
				.mockResolvedValueOnce( { connected: false } ); // disconnect response

			renderEdit();

			// Wait for product form to appear.
			await waitFor( () => {
				expect( screen.getByText( /Create PayPal Button/i ) ).toBeInTheDocument();
			} );

			// Disconnect button is in the sidebar.
			fireEvent.click( screen.getByRole( 'button', { name: /Disconnect PayPal/i } ) );

			await waitFor( () => {
				expect( apiFetch ).toHaveBeenCalledWith(
					expect.objectContaining( {
						path: '/jetpack/v4/paypal/disconnect',
						method: 'POST',
					} )
				);
			} );
		} );
	} );
} );
