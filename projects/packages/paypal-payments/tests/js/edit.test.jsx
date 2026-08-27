/* eslint-disable react/jsx-no-bind */
/**
 * Tests for the PayPal Payment Buttons V2 edit component.
 *
 * Tests the API-driven block editor UI including connection checking,
 * connection form, product creation form, and preview states.
 *
 * @package
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Edit from '../../src/paypal-payment-buttons/edit';
// apiFetch mock — controls what the component receives from the REST API.
const apiFetch = require( '@wordpress/api-fetch' );

// Mock WordPress element with real React hooks.
jest.mock( '@wordpress/element', () => {
	const React = require( 'react' );
	return {
		createElement: React.createElement,
		Fragment: React.Fragment,
		useState: React.useState,
		useEffect: React.useEffect,
		useCallback: React.useCallback,
		useMemo: React.useMemo,
		useRef: React.useRef,
		createInterpolateElement: text => text,
	};
} );

// Mock WordPress i18n.
jest.mock( '@wordpress/i18n', () => ( {
	__: text => text,
	_x: text => text,
	sprintf: ( format, ...args ) => {
		let i = 0;
		return format.replace( /%[ds]/g, () => args[ i++ ] );
	},
} ) );

// Mock WordPress block-editor.
jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: () => ( { className: 'wp-block-paypal-payment-buttons' } ),
	BlockControls: ( { children } ) => <div data-testid="block-controls">{ children }</div>,
	InspectorControls: ( { children } ) => <div data-testid="inspector-controls">{ children }</div>,
	MediaUpload: ( { render: renderProp } ) => renderProp( { open: jest.fn() } ),
	MediaUploadCheck: ( { children } ) => <>{ children }</>,
} ) );

// Mock WordPress components with simple HTML equivalents.
jest.mock( '@wordpress/components', () => ( {
	Button: ( { children, onClick, disabled, variant, isBusy, ...rest } ) => (
		<button
			onClick={ onClick }
			disabled={ disabled }
			data-variant={ variant }
			data-busy={ isBusy }
			{ ...rest }
		>
			{ children }
		</button>
	),
	Notice: ( { children, status, isDismissible, onDismiss } ) => (
		<div data-testid="notice" data-status={ status }>
			{ children }
			{ isDismissible && onDismiss && (
				<button data-testid="dismiss-notice" onClick={ onDismiss }>
					Dismiss
				</button>
			) }
		</div>
	),
	PanelBody: ( { children, title } ) => (
		<div data-testid="panel-body" data-title={ title }>
			{ children }
		</div>
	),
	SelectControl: ( { label, value, options, onChange } ) => (
		<select aria-label={ label } value={ value } onChange={ e => onChange( e.target.value ) }>
			{ options &&
				options.map( opt => (
					<option key={ opt.value } value={ opt.value }>
						{ opt.label }
					</option>
				) ) }
		</select>
	),
	Spinner: () => <div data-testid="spinner">Loading...</div>,
	ToggleControl: ( { label, checked, onChange, help, disabled } ) => {
		const id = `toggle-${ label }`;
		return (
			<div>
				<input
					id={ id }
					type="checkbox"
					checked={ checked }
					onChange={ () => onChange( ! checked ) }
					disabled={ disabled }
				/>
				<label htmlFor={ id }>{ label }</label>
				{ help && <span>{ help }</span> }
			</div>
		);
	},
	TextControl: ( { label, value, onChange, onBlur, type, help, className, ...rest } ) => (
		<div>
			<label htmlFor={ `field-${ label }` }>{ label }</label>
			<input
				id={ `field-${ label }` }
				aria-label={ label }
				value={ value || '' }
				onChange={ e => onChange( e.target.value ) }
				onBlur={ onBlur }
				type={ type || 'text' }
				className={ className }
				{ ...rest }
			/>
			{ help && <span className="help-text">{ help }</span> }
		</div>
	),
	TextareaControl: ( { label, value, onChange, onBlur, help, className } ) => (
		<div>
			<label htmlFor={ `field-${ label }` }>{ label }</label>
			<textarea
				id={ `field-${ label }` }
				aria-label={ label }
				value={ value || '' }
				onChange={ e => onChange( e.target.value ) }
				onBlur={ onBlur }
				className={ className }
			/>
			{ help && <span className="help-text">{ help }</span> }
		</div>
	),
	ToolbarButton: ( { label, onClick, isPressed } ) => (
		<button data-testid={ `toolbar-${ label }` } onClick={ onClick } data-pressed={ isPressed }>
			{ label }
		</button>
	),
	ToolbarGroup: ( { children } ) => <div data-testid="toolbar-group">{ children }</div>,
} ) );

// Mock PayPal button preview component.
jest.mock( '../../src/paypal-payment-buttons/paypal-button-preview', () => {
	return function MockPayPalButtonPreview( props ) {
		return (
			<div data-testid="paypal-button-preview" data-product-name={ props.productName }>
				Preview: { props.productName } - { props.price } { props.currencyCode }
			</div>
		);
	};
} );

describe( 'PayPalPaymentButtonsEdit (V2)', () => {
	const setAttributes = jest.fn();

	beforeEach( () => {
		jest.clearAllMocks();
		// Clear persisted wizard step to ensure tests start from 'welcome'.
		window.localStorage.removeItem( 'jetpack-paypal-wizard-step' );
		// Default: connection check returns not connected.
		apiFetch.mockReset();
		apiFetch.mockResolvedValue( { connected: false, environment: 'sandbox' } );
	} );

	describe( 'Loading State', () => {
		it( 'shows a spinner while checking connection', () => {
			// Make apiFetch hang (never resolve) to keep loading state.
			apiFetch.mockReturnValue( new Promise( () => {} ) );

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			expect( screen.getByTestId( 'spinner' ) ).toBeInTheDocument();
			expect( screen.getByText( /Checking PayPal connection/ ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Connection Form (not connected)', () => {
		/**
		 * Navigate the WOOPTP-162 wizard to the credentials step.
		 *
		 * @param {object} user - userEvent instance.
		 */
		async function navigateToCredentialsStep( user ) {
			await user.click( await screen.findByRole( 'button', { name: /Get Started/i } ) );
			await user.click( await screen.findByRole( 'button', { name: /I have my credentials/i } ) );
		}

		it( 'shows the connection form when PayPal is not connected', async () => {
			const user = userEvent.setup();
			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			await navigateToCredentialsStep( user );

			expect( screen.getByLabelText( 'Client ID' ) ).toBeInTheDocument();
			expect( screen.getByLabelText( 'Client Secret' ) ).toBeInTheDocument();
			expect(
				screen.getByRole( 'button', { name: /Use Sandbox for testing|Switch to Production/i } )
			).toBeInTheDocument();
		} );

		it( 'disables connect button when credentials are empty', async () => {
			const user = userEvent.setup();
			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			await navigateToCredentialsStep( user );

			expect( screen.getByRole( 'button', { name: /^Connect$/i } ) ).toBeDisabled();
		} );
	} );

	describe( 'Legacy Block', () => {
		it( 'shows legacy message for paste-code blocks', async () => {
			apiFetch.mockResolvedValue( { connected: true, environment: 'sandbox' } );

			render(
				<Edit
					attributes={ {
						isApiManaged: false,
						scriptSrc: 'https://www.paypal.com/sdk/js?client-id=test',
						hostedButtonId: 'BTN_123',
					} }
					setAttributes={ setAttributes }
				/>
			);

			await expect( screen.findByText( /legacy paste-code format/ ) ).resolves.toBeInTheDocument();
		} );
	} );

	describe( 'Create Form (connected, no button)', () => {
		beforeEach( () => {
			apiFetch.mockResolvedValue( { connected: true, environment: 'sandbox' } );
		} );

		it( 'shows the create form when connected but no button exists', async () => {
			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			await expect( screen.findByText( /Create PayPal Button/ ) ).resolves.toBeInTheDocument();
			expect( screen.getByLabelText( 'Product Name' ) ).toBeInTheDocument();
			expect( screen.getByLabelText( 'Price' ) ).toBeInTheDocument();
			expect( screen.getByLabelText( 'Currency' ) ).toBeInTheDocument();
			expect( screen.getByLabelText( /Description/ ) ).toBeInTheDocument();
		} );

		it( 'shows PayPal Connected status', async () => {
			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			await expect( screen.findByText( 'PayPal Connected' ) ).resolves.toBeInTheDocument();
		} );

		it( 'shows sandbox badge when in sandbox mode', async () => {
			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			await expect( screen.findByText( 'Sandbox' ) ).resolves.toBeInTheDocument();
		} );

		it( 'calls setAttributes when product name changes', async () => {
			const user = userEvent.setup();

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			await expect( screen.findByLabelText( 'Product Name' ) ).resolves.toBeInTheDocument();
			const nameInput = screen.getByLabelText( 'Product Name' );
			await user.type( nameInput, 'T' );

			expect( setAttributes ).toHaveBeenCalledWith( { productName: 'T' } );
		} );

		it( 'disables Create Button when form is invalid', async () => {
			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			await expect( screen.findByText( /Create Button/ ) ).resolves.toBeInTheDocument();
			const createButton = screen.getByText( /Create Button/ );
			expect( createButton ).toBeDisabled();
		} );

		it( 'enables Create Button when required fields are filled', async () => {
			render(
				<Edit
					attributes={ {
						productName: 'Test Widget',
						price: '29.99',
						currencyCode: 'USD',
					} }
					setAttributes={ setAttributes }
				/>
			);

			await expect( screen.findByText( /Create Button/ ) ).resolves.toBeInTheDocument();
			const createButton = screen.getByText( /Create Button/ );
			expect( createButton ).toBeEnabled();
		} );

		it( 'submits create request with correct data', async () => {
			const user = userEvent.setup();

			// First call: connection check. Second call: create button.
			apiFetch
				.mockResolvedValueOnce( { connected: true, environment: 'sandbox' } )
				.mockResolvedValueOnce( {
					id: 'PLB-TEST123',
					payment_link: 'https://www.paypal.com/paymentpage/PLB-TEST123',
				} );

			render(
				<Edit
					attributes={ {
						productName: 'Test Widget',
						price: '29.99',
						currencyCode: 'USD',
					} }
					setAttributes={ setAttributes }
				/>
			);

			await expect( screen.findByText( /Create Button/ ) ).resolves.toBeInTheDocument();
			const createButton = screen.getByText( /Create Button/ );
			await user.click( createButton );

			// Should have called apiFetch with the create request.
			expect( apiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					path: '/jetpack/v4/paypal/buttons',
					method: 'POST',
					data: expect.objectContaining( {
						type: 'BUY_NOW',
						integration_mode: 'LINK',
						line_items: expect.arrayContaining( [
							expect.objectContaining( {
								name: 'Test Widget',
								unit_amount: { currency_code: 'USD', value: '29.99' },
							} ),
						] ),
					} ),
				} )
			);
		} );
	} );

	describe( 'Preview Mode (connected, has button)', () => {
		beforeEach( () => {
			apiFetch.mockResolvedValue( { connected: true, environment: 'sandbox' } );
		} );

		it( 'shows button preview when API-managed button exists', async () => {
			render(
				<Edit
					attributes={ {
						isApiManaged: true,
						resourceId: 'PLB-TEST123',
						paymentLink: 'https://www.paypal.com/paymentpage/PLB-TEST123',
						productName: 'Test Widget',
						price: '29.99',
						currencyCode: 'USD',
						buttonType: 'stacked',
					} }
					setAttributes={ setAttributes }
				/>
			);

			await expect( screen.findByTestId( 'paypal-button-preview' ) ).resolves.toBeInTheDocument();
		} );

		it( 'shows edit toolbar when button exists', async () => {
			render(
				<Edit
					attributes={ {
						isApiManaged: true,
						resourceId: 'PLB-TEST123',
						paymentLink: 'https://www.paypal.com/paymentpage/PLB-TEST123',
						productName: 'Test Widget',
						price: '29.99',
						currencyCode: 'USD',
					} }
					setAttributes={ setAttributes }
				/>
			);

			await expect( screen.findByTestId( 'toolbar-Edit' ) ).resolves.toBeInTheDocument();
			expect( screen.getByTestId( 'toolbar-Preview' ) ).toBeInTheDocument();
		} );

		it( 'switches to edit mode when Edit toolbar button is clicked', async () => {
			const user = userEvent.setup();

			render(
				<Edit
					attributes={ {
						isApiManaged: true,
						resourceId: 'PLB-TEST123',
						paymentLink: 'https://www.paypal.com/paymentpage/PLB-TEST123',
						productName: 'Test Widget',
						price: '29.99',
						currencyCode: 'USD',
					} }
					setAttributes={ setAttributes }
				/>
			);

			await expect( screen.findByTestId( 'toolbar-Edit' ) ).resolves.toBeInTheDocument();
			const editButton = screen.getByTestId( 'toolbar-Edit' );
			await user.click( editButton );

			// Should now show the edit form with "Edit PayPal Button" heading.
			expect( screen.getByText( /Edit PayPal Button/ ) ).toBeInTheDocument();
			expect( screen.getByText( /Update Button/ ) ).toBeInTheDocument();
		} );
	} );

	describe( 'API Error Handling', () => {
		it( 'shows connection form when connection check fails', async () => {
			apiFetch.mockRejectedValue( new Error( 'Network error' ) );

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			// Should fall back to not-connected state.
			await expect( screen.findAllByText( 'Connect PayPal' ) ).resolves.toEqual(
				expect.any( Array )
			);
		} );
	} );

	describe( 'Connection Check', () => {
		it( 'calls apiFetch to check connection on mount', async () => {
			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			await expect( screen.findAllByText( 'Connect PayPal' ) ).resolves.toEqual(
				expect.any( Array )
			);

			expect( apiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					path: '/jetpack/v4/paypal/connection',
				} )
			);
		} );
	} );
} );
