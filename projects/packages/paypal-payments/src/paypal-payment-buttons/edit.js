/* eslint-disable react/jsx-no-bind */
/**
 * PayPal Payment Buttons — Block Editor Component.
 *
 * Replaces the legacy paste-code textarea with an API-driven form UI.
 * When PayPal is connected, merchants fill in product details and create
 * buttons directly in the editor. Falls back to the paste-code interface
 * when PayPal is not connected.
 *
 * Updated for WOOPTP-151: Client-side validation with inline errors,
 * user-friendly API error mapping, and graceful 404 handling.
 *
 * @package
 * @since 0.8.0
 */

import apiFetch from '@wordpress/api-fetch'; // eslint-disable-line import/no-unresolved
import { BlockControls, InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	Button,
	Notice,
	PanelBody,
	SelectControl,
	Spinner,
	TextControl,
	TextareaControl,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import PayPalButtonPreview from './paypal-button-preview';

/**
 * Supported currencies for the currency selector.
 * Matches PayPal_Attribute_Mapper::SUPPORTED_CURRENCIES on the server.
 */
const SUPPORTED_CURRENCIES = [
	{ label: 'USD — US Dollar', value: 'USD' },
	{ label: 'EUR — Euro', value: 'EUR' },
	{ label: 'GBP — British Pound', value: 'GBP' },
	{ label: 'CAD — Canadian Dollar', value: 'CAD' },
	{ label: 'AUD — Australian Dollar', value: 'AUD' },
	{ label: 'JPY — Japanese Yen', value: 'JPY' },
	{ label: 'CHF — Swiss Franc', value: 'CHF' },
	{ label: 'SEK — Swedish Krona', value: 'SEK' },
	{ label: 'NOK — Norwegian Krone', value: 'NOK' },
	{ label: 'DKK — Danish Krone', value: 'DKK' },
	{ label: 'NZD — New Zealand Dollar', value: 'NZD' },
	{ label: 'SGD — Singapore Dollar', value: 'SGD' },
	{ label: 'HKD — Hong Kong Dollar', value: 'HKD' },
	{ label: 'MXN — Mexican Peso', value: 'MXN' },
	{ label: 'BRL — Brazilian Real', value: 'BRL' },
	{ label: 'PLN — Polish Zloty', value: 'PLN' },
	{ label: 'CZK — Czech Koruna', value: 'CZK' },
	{ label: 'HUF — Hungarian Forint', value: 'HUF' },
	{ label: 'ILS — Israeli Shekel', value: 'ILS' },
	{ label: 'MYR — Malaysian Ringgit', value: 'MYR' },
	{ label: 'PHP — Philippine Peso', value: 'PHP' },
	{ label: 'TWD — Taiwan Dollar', value: 'TWD' },
	{ label: 'THB — Thai Baht', value: 'THB' },
	{ label: 'INR — Indian Rupee', value: 'INR' },
	{ label: 'CNY — Chinese Yuan', value: 'CNY' },
	{ label: 'RUB — Russian Ruble', value: 'RUB' },
];

/**
 * Currency code set for fast lookup.
 */
const VALID_CURRENCY_CODES = new Set( SUPPORTED_CURRENCIES.map( c => c.value ) );

/**
 * Validation constants — match server-side limits.
 */
const MAX_NAME_LENGTH = 127;
const MAX_DESCRIPTION_LENGTH = 256;

/**
 * Button type options for the block display style.
 */
const BUTTON_TYPE_OPTIONS = [
	{ label: __( 'Stacked', 'jetpack-paypal-payments' ), value: 'stacked' },
	{ label: __( 'Single', 'jetpack-paypal-payments' ), value: 'single' },
];

/**
 * REST API base path for PayPal endpoints.
 */
const API_BASE = '/jetpack/v4/paypal';

/**
 * Validate a price string.
 *
 * @param {string} value - The price value.
 * @return {string|null} Error message or null if valid.
 */
function validatePrice( value ) {
	if ( ! value || value.trim() === '' ) {
		return __( 'Price is required.', 'jetpack-paypal-payments' );
	}

	const num = parseFloat( value );
	if ( isNaN( num ) || num <= 0 ) {
		return __( 'Price must be a positive number.', 'jetpack-paypal-payments' );
	}

	// Check max 2 decimal places.
	if ( ! /^\d+(\.\d{1,2})?$/.test( value.trim() ) ) {
		return __(
			'Price can have at most 2 decimal places (e.g., "29.99").',
			'jetpack-paypal-payments'
		);
	}

	return null;
}

/**
 * Validate a product name.
 *
 * @param {string} value - The product name.
 * @return {string|null} Error message or null if valid.
 */
function validateProductName( value ) {
	if ( ! value || value.trim() === '' ) {
		return __( 'Product name is required.', 'jetpack-paypal-payments' );
	}

	if ( value.length > MAX_NAME_LENGTH ) {
		return sprintf(
			/* translators: %d: maximum number of characters allowed for the product name */
			__( 'Product name must be %d characters or fewer.', 'jetpack-paypal-payments' ),
			MAX_NAME_LENGTH
		);
	}

	return null;
}

/**
 * Validate a description (optional field).
 *
 * @param {string} value - The description.
 * @return {string|null} Error message or null if valid.
 */
function validateDescription( value ) {
	if ( value && value.length > MAX_DESCRIPTION_LENGTH ) {
		return sprintf(
			/* translators: %d: maximum number of characters allowed for the description */
			__( 'Description must be %d characters or fewer.', 'jetpack-paypal-payments' ),
			MAX_DESCRIPTION_LENGTH
		);
	}

	return null;
}

/**
 * Map an API error response to a user-friendly message.
 *
 * The server-side already returns user-friendly messages, but this
 * provides client-side fallbacks for network errors and edge cases.
 *
 * @param {object} err - The error object from apiFetch.
 * @return {string} User-friendly error message.
 */
function getUserFriendlyError( err ) {
	// Server already provides friendly messages — use them.
	if ( err.message ) {
		return err.message;
	}

	// Network-level errors (no response from server).
	if ( err.code === 'fetch_error' ) {
		return __(
			'Could not reach the server. Please check your internet connection and try again.',
			'jetpack-paypal-payments'
		);
	}

	return __( 'An unexpected error occurred. Please try again.', 'jetpack-paypal-payments' );
}

/**
 * PayPal Payment Buttons edit component.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Block attributes.
 * @param {Function} props.setAttributes - Function to update block attributes.
 * @return {Element} Block editor UI.
 */
export default function PayPalPaymentButtonsEdit( { attributes, setAttributes } ) {
	const {
		isApiManaged,
		buttonType,
		scriptSrc,
		hostedButtonId,
		buttonText,
		resourceId,
		paymentLink,
		productName,
		price,
		currencyCode,
		productDescription,
		returnUrl,
	} = attributes;

	const blockProps = useBlockProps();

	// Connection state.
	const [ isConnected, setIsConnected ] = useState( false );
	const [ environment, setEnvironment ] = useState( 'production' );
	const [ connectionLoading, setConnectionLoading ] = useState( true );

	// Form state.
	const [ isCreating, setIsCreating ] = useState( false );
	const [ error, setError ] = useState( null );
	const [ successMessage, setSuccessMessage ] = useState( null );

	// Edit/preview mode toggle. Start in preview if button already exists.
	const [ isEditing, setIsEditing ] = useState( ! ( isApiManaged && resourceId && paymentLink ) );

	// Connect form state.
	const [ clientId, setClientId ] = useState( '' );
	const [ clientSecret, setClientSecret ] = useState( '' );
	const [ connectError, setConnectError ] = useState( null );
	const [ isConnecting, setIsConnecting ] = useState( false );

	// Wizard step state: 'welcome' | 'dashboard' | 'credentials' | 'success'
	const [ wizardStep, setWizardStep ] = useState( 'welcome' );
	const [ showSecretField, setShowSecretField ] = useState( false );

	// Inline validation state — track which fields have been touched.
	const [ touchedFields, setTouchedFields ] = useState( {} );

	/**
	 * Mark a field as touched (user has interacted with it).
	 *
	 * @param {string} field - Field name.
	 */
	const markTouched = useCallback( field => {
		setTouchedFields( prev => ( { ...prev, [ field ]: true } ) );
	}, [] );

	/**
	 * Compute validation errors for all form fields.
	 * Memoized to avoid re-computing on every render.
	 */
	const validationErrors = useMemo(
		() => ( {
			productName: validateProductName( productName ),
			price: validatePrice( price ),
			productDescription: validateDescription( productDescription ),
			currencyCode:
				currencyCode && ! VALID_CURRENCY_CODES.has( currencyCode )
					? __( 'Unsupported currency.', 'jetpack-paypal-payments' )
					: null,
		} ),
		[ productName, price, productDescription, currencyCode ]
	);

	/**
	 * Whether the form is valid (no validation errors on required fields).
	 */
	const isFormValid =
		! validationErrors.productName && ! validationErrors.price && ! validationErrors.currencyCode;

	/**
	 * Check PayPal connection status on mount.
	 */
	useEffect( () => {
		apiFetch( { path: `${ API_BASE }/connection` } )
			.then( response => {
				setIsConnected( response.connected );
				setEnvironment( response.environment );
			} )
			.catch( () => {
				setIsConnected( false );
			} )
			.finally( () => {
				setConnectionLoading( false );
			} );
	}, [] );

	/**
	 * Handle Client ID paste — auto-trim whitespace.
	 *
	 * @param {string} value - Pasted or typed value.
	 */
	const handleClientIdChange = useCallback( value => {
		setClientId( value.trim() );
	}, [] );

	/**
	 * Handle Client Secret paste — auto-trim whitespace.
	 *
	 * @param {string} value - Pasted or typed value.
	 */
	const handleClientSecretChange = useCallback( value => {
		setClientSecret( value.trim() );
	}, [] );

	/**
	 * Validate Client ID format.
	 * PayPal Client IDs typically start with 'A' and are ~80 characters.
	 *
	 * @param {string} value - The Client ID.
	 * @return {string|null} Warning message or null.
	 */
	const clientIdWarning = useMemo( () => {
		if ( ! clientId ) {
			return null;
		}
		if ( clientId.length < 20 ) {
			return __(
				'This looks too short for a Client ID. Make sure you copied the full value.',
				'jetpack-paypal-payments'
			);
		}
		if ( ! /^A[A-Za-z0-9_-]+$/.test( clientId ) ) {
			return __(
				'PayPal Client IDs usually start with "A". Double-check you copied the Client ID, not the app name.',
				'jetpack-paypal-payments'
			);
		}
		return null;
	}, [ clientId ] );

	/**
	 * Handle PayPal OAuth connection.
	 */
	const handleConnect = useCallback( () => {
		setConnectError( null );
		setIsConnecting( true );

		apiFetch( {
			path: `${ API_BASE }/connect`,
			method: 'POST',
			data: {
				client_id: clientId,
				client_secret: clientSecret,
				environment,
			},
		} )
			.then( response => {
				setIsConnected( response.connected );
				setEnvironment( response.environment );
				setClientId( '' );
				setClientSecret( '' );
				setWizardStep( 'success' );
			} )
			.catch( err => {
				setConnectError( getUserFriendlyError( err ) );
			} )
			.finally( () => {
				setIsConnecting( false );
			} );
	}, [ clientId, clientSecret, environment ] );

	/**
	 * Handle PayPal disconnect.
	 */
	const handleDisconnect = useCallback( () => {
		apiFetch( {
			path: `${ API_BASE }/disconnect`,
			method: 'POST',
		} ).then( () => {
			setIsConnected( false );
		} );
	}, [] );

	/**
	 * Build the line_items payload from current attributes.
	 *
	 * @return {object} API request data.
	 */
	const buildRequestData = useCallback(
		() => ( {
			type: 'BUY_NOW',
			integration_mode: 'LINK',
			reusable: 'MULTIPLE',
			line_items: [
				{
					name: productName,
					unit_amount: {
						currency_code: currencyCode || 'USD',
						value: price,
					},
					...( productDescription ? { description: productDescription } : {} ),
				},
			],
			...( returnUrl ? { return_url: returnUrl } : {} ),
		} ),
		[ productName, price, currencyCode, productDescription, returnUrl ]
	);

	/**
	 * Create a PayPal payment button via the API.
	 */
	const handleCreateButton = useCallback( () => {
		// Mark all fields as touched to show any remaining errors.
		setTouchedFields( {
			productName: true,
			price: true,
			currencyCode: true,
			productDescription: true,
		} );

		if ( ! isFormValid ) {
			return;
		}

		setError( null );
		setSuccessMessage( null );
		setIsCreating( true );

		apiFetch( {
			path: `${ API_BASE }/buttons`,
			method: 'POST',
			data: buildRequestData(),
		} )
			.then( response => {
				setAttributes( {
					isApiManaged: true,
					resourceId: response.id,
					paymentLink: response.payment_link,
				} );
				setSuccessMessage(
					__( 'PayPal button and payment link created successfully!', 'jetpack-paypal-payments' )
				);
				setIsEditing( false );
				setTouchedFields( {} );
			} )
			.catch( err => {
				setError( getUserFriendlyError( err ) );
			} )
			.finally( () => {
				setIsCreating( false );
			} );
	}, [ buildRequestData, setAttributes, isFormValid ] );

	/**
	 * Update an existing PayPal payment button via the API.
	 */
	const handleUpdateButton = useCallback( () => {
		if ( ! resourceId ) {
			return;
		}

		// Mark all fields as touched to show any remaining errors.
		setTouchedFields( {
			productName: true,
			price: true,
			currencyCode: true,
			productDescription: true,
		} );

		if ( ! isFormValid ) {
			return;
		}

		setError( null );
		setSuccessMessage( null );
		setIsCreating( true );

		apiFetch( {
			path: `${ API_BASE }/buttons/${ resourceId }`,
			method: 'PUT',
			data: buildRequestData(),
		} )
			.then( response => {
				setAttributes( {
					paymentLink: response.payment_link || paymentLink,
				} );
				setSuccessMessage( __( 'PayPal button updated successfully!', 'jetpack-paypal-payments' ) );
				setIsEditing( false );
				setTouchedFields( {} );
			} )
			.catch( err => {
				const errorMessage = getUserFriendlyError( err );

				// If the resource was not found (404), clear stale state and prompt re-creation.
				if ( err.code === 'paypal_api_resource_not_found' || err.data?.status === 404 ) {
					setAttributes( {
						isApiManaged: false,
						resourceId: undefined,
						paymentLink: undefined,
					} );
					setError(
						__(
							'This button no longer exists on PayPal. Please create a new one.',
							'jetpack-paypal-payments'
						)
					);
				} else {
					setError( errorMessage );
				}
			} )
			.finally( () => {
				setIsCreating( false );
			} );
	}, [ resourceId, buildRequestData, paymentLink, setAttributes, isFormValid ] );

	/**
	 * Delete the PayPal payment button via the API.
	 */
	const handleDeleteButton = useCallback( () => {
		if ( ! resourceId ) {
			return;
		}

		setError( null );
		setIsCreating( true );

		apiFetch( {
			path: `${ API_BASE }/buttons/${ resourceId }`,
			method: 'DELETE',
		} )
			.then( () => {
				setAttributes( {
					isApiManaged: false,
					resourceId: undefined,
					paymentLink: undefined,
				} );
				setIsEditing( true );
				setSuccessMessage( __( 'PayPal button deleted.', 'jetpack-paypal-payments' ) );
			} )
			.catch( err => {
				// If already deleted (404), clear state anyway.
				if ( err.code === 'paypal_api_resource_not_found' || err.data?.status === 404 ) {
					setAttributes( {
						isApiManaged: false,
						resourceId: undefined,
						paymentLink: undefined,
					} );
					setIsEditing( true );
					setSuccessMessage(
						__( 'Button was already removed from PayPal.', 'jetpack-paypal-payments' )
					);
				} else {
					setError( getUserFriendlyError( err ) );
				}
			} )
			.finally( () => {
				setIsCreating( false );
			} );
	}, [ resourceId, setAttributes ] );

	/**
	 * Whether the block has a created button to preview.
	 */
	const hasButton = isApiManaged && resourceId && paymentLink;

	// Loading state while checking connection.
	if ( connectionLoading ) {
		return (
			<div { ...blockProps }>
				<div className="jetpack-paypal-payment-buttons__loading">
					<Spinner />
					<p>{ __( 'Checking PayPal connection…', 'jetpack-paypal-payments' ) }</p>
				</div>
			</div>
		);
	}

	// Legacy paste-code block — render as-is without the new UI.
	if ( ! isApiManaged && ( scriptSrc || hostedButtonId ) ) {
		return (
			<div { ...blockProps }>
				<div className="jetpack-paypal-payment-buttons__legacy">
					<p>
						{ __(
							'This PayPal button uses the legacy paste-code format.',
							'jetpack-paypal-payments'
						) }
					</p>
					<p>
						{ __( 'It will continue to work as-is on the frontend.', 'jetpack-paypal-payments' ) }
					</p>
				</div>
				<InspectorControls>
					<PanelBody title={ __( 'Button Settings', 'jetpack-paypal-payments' ) }>
						<SelectControl
							label={ __( 'Button Layout', 'jetpack-paypal-payments' ) }
							value={ buttonType }
							options={ BUTTON_TYPE_OPTIONS }
							onChange={ value => setAttributes( { buttonType: value } ) }
						/>
						<TextControl
							label={ __( 'Button Text', 'jetpack-paypal-payments' ) }
							value={ buttonText }
							onChange={ value => setAttributes( { buttonText: value } ) }
						/>
					</PanelBody>
				</InspectorControls>
			</div>
		);
	}

	// Not connected — show guided connection wizard.
	if ( ! isConnected ) {
		return (
			<div { ...blockProps }>
				<div className="jetpack-paypal-payment-buttons__connect">
					{ /* Step indicator */ }
					{ wizardStep !== 'welcome' && wizardStep !== 'success' && (
						<div className="jetpack-paypal-wizard__step-indicator">
							<span
								className={ `jetpack-paypal-wizard__step ${
									wizardStep === 'dashboard' || wizardStep === 'credentials' ? 'is-active' : ''
								}` }
							>
								{ __( '1', 'jetpack-paypal-payments' ) }
							</span>
							<span className="jetpack-paypal-wizard__step-line" />
							<span
								className={ `jetpack-paypal-wizard__step ${
									wizardStep === 'credentials' ? 'is-active' : ''
								}` }
							>
								{ __( '2', 'jetpack-paypal-payments' ) }
							</span>
							<span className="jetpack-paypal-wizard__step-line" />
							<span className="jetpack-paypal-wizard__step">
								{ __( '3', 'jetpack-paypal-payments' ) }
							</span>
						</div>
					) }

					{ /* Step 1: Welcome */ }
					{ wizardStep === 'welcome' && (
						<div className="jetpack-paypal-wizard__welcome">
							<h3>{ __( 'Connect PayPal', 'jetpack-paypal-payments' ) }</h3>
							<p>
								{ __(
									'Accept payments with PayPal by connecting your PayPal Developer account.',
									'jetpack-paypal-payments'
								) }
							</p>
							<p>
								{ __(
									"You'll need your API credentials — we'll walk you through finding them.",
									'jetpack-paypal-payments'
								) }
							</p>
							<Button variant="primary" onClick={ () => setWizardStep( 'dashboard' ) }>
								{ __( 'Get Started', 'jetpack-paypal-payments' ) }
							</Button>
						</div>
					) }

					{ /* Step 2: Open PayPal Dashboard */ }
					{ wizardStep === 'dashboard' && (
						<div className="jetpack-paypal-wizard__dashboard">
							<h3>{ __( 'Step 1 of 3: Open PayPal Dashboard', 'jetpack-paypal-payments' ) }</h3>
							<ol className="jetpack-paypal-wizard__instructions">
								<li>
									{ __(
										'Click the button below to open the PayPal Developer Dashboard',
										'jetpack-paypal-payments'
									) }
								</li>
								<li>
									{ __( 'Log in with your PayPal Business account', 'jetpack-paypal-payments' ) }
								</li>
								<li>{ __( 'Go to Apps & Credentials', 'jetpack-paypal-payments' ) }</li>
								<li>{ __( 'Select your app (or create one)', 'jetpack-paypal-payments' ) }</li>
							</ol>
							<div className="jetpack-paypal-wizard__actions">
								<Button
									variant="primary"
									href="https://developer.paypal.com/dashboard/applications/"
									target="_blank"
									rel="noopener noreferrer"
								>
									{ __( 'Open PayPal Dashboard', 'jetpack-paypal-payments' ) }
								</Button>
							</div>
							<div className="jetpack-paypal-wizard__nav">
								<Button variant="secondary" onClick={ () => setWizardStep( 'credentials' ) }>
									{ __( 'I have my credentials', 'jetpack-paypal-payments' ) }
								</Button>
								<Button variant="tertiary" onClick={ () => setWizardStep( 'welcome' ) }>
									{ __( 'Back', 'jetpack-paypal-payments' ) }
								</Button>
							</div>
						</div>
					) }

					{ /* Step 3: Enter Credentials */ }
					{ wizardStep === 'credentials' && (
						<div className="jetpack-paypal-wizard__credentials">
							<h3>{ __( 'Step 2 of 3: Enter Credentials', 'jetpack-paypal-payments' ) }</h3>
							<p className="jetpack-paypal-wizard__subtitle">
								{ __(
									'Copy these from your app in the PayPal Developer Dashboard:',
									'jetpack-paypal-payments'
								) }
							</p>

							{ connectError && (
								<Notice status="error" isDismissible onDismiss={ () => setConnectError( null ) }>
									{ connectError }
								</Notice>
							) }

							{ environment === 'sandbox' && (
								<Notice status="warning" isDismissible={ false }>
									{ __(
										'Sandbox mode — buttons will use test credentials.',
										'jetpack-paypal-payments'
									) }
								</Notice>
							) }

							<TextControl
								label={ __( 'Client ID', 'jetpack-paypal-payments' ) }
								value={ clientId }
								onChange={ handleClientIdChange }
								help={
									clientIdWarning
										? undefined
										: __( 'Found under your app name in the dashboard.', 'jetpack-paypal-payments' )
								}
								className={ clientIdWarning ? 'has-warning' : undefined }
								autoComplete="off"
							/>
							{ clientIdWarning && (
								<p className="jetpack-paypal-payment-buttons__field-warning">{ clientIdWarning }</p>
							) }

							<div className="jetpack-paypal-wizard__secret-field">
								<TextControl
									label={ __( 'Client Secret', 'jetpack-paypal-payments' ) }
									value={ clientSecret }
									onChange={ handleClientSecretChange }
									type={ showSecretField ? 'text' : 'password' }
									help={ __(
										'Click "Show" in PayPal to reveal it, then copy.',
										'jetpack-paypal-payments'
									) }
									autoComplete="off"
								/>
								<Button
									variant="tertiary"
									className="jetpack-paypal-wizard__toggle-secret"
									onClick={ () => setShowSecretField( ! showSecretField ) }
									aria-label={
										showSecretField
											? __( 'Hide client secret', 'jetpack-paypal-payments' )
											: __( 'Show client secret', 'jetpack-paypal-payments' )
									}
								>
									{ showSecretField
										? __( 'Hide', 'jetpack-paypal-payments' )
										: __( 'Show', 'jetpack-paypal-payments' ) }
								</Button>
							</div>

							<div className="jetpack-paypal-wizard__actions">
								<Button
									variant="primary"
									onClick={ handleConnect }
									isBusy={ isConnecting }
									disabled={ isConnecting || ! clientId || ! clientSecret }
								>
									{ isConnecting
										? __( 'Connecting…', 'jetpack-paypal-payments' )
										: __( 'Connect', 'jetpack-paypal-payments' ) }
								</Button>
								<Button
									variant="tertiary"
									onClick={ () => setWizardStep( 'dashboard' ) }
									disabled={ isConnecting }
								>
									{ __( 'Back', 'jetpack-paypal-payments' ) }
								</Button>
							</div>

							<p className="jetpack-paypal-wizard__env-toggle">
								{ environment === 'production' ? (
									<Button variant="link" onClick={ () => setEnvironment( 'sandbox' ) }>
										{ __( 'Use Sandbox for testing', 'jetpack-paypal-payments' ) }
									</Button>
								) : (
									<Button variant="link" onClick={ () => setEnvironment( 'production' ) }>
										{ __( 'Switch to Production (Live)', 'jetpack-paypal-payments' ) }
									</Button>
								) }
							</p>
						</div>
					) }

					{ /* Step 4: Success */ }
					{ wizardStep === 'success' && (
						<div className="jetpack-paypal-wizard__success">
							<div className="jetpack-paypal-wizard__success-icon">
								<span>&#10003;</span>
							</div>
							<h3>{ __( 'PayPal account connected!', 'jetpack-paypal-payments' ) }</h3>
							<p>
								{ __(
									"You're ready to create payment buttons and links. Fill in your product details and we'll create both an embeddable PayPal button and a shareable payment link.",
									'jetpack-paypal-payments'
								) }
							</p>
							<Button variant="primary" onClick={ () => setIsConnected( true ) }>
								{ __( 'Create Your First Button', 'jetpack-paypal-payments' ) }
							</Button>
						</div>
					) }
				</div>
			</div>
		);
	}

	// Toolbar controls for edit/preview toggle (only when button exists).
	const toolbarControls = hasButton ? (
		<BlockControls>
			<ToolbarGroup>
				<ToolbarButton
					icon="visibility"
					label={ __( 'Preview', 'jetpack-paypal-payments' ) }
					isPressed={ ! isEditing }
					onClick={ () => setIsEditing( false ) }
				/>
				<ToolbarButton
					icon="edit"
					label={ __( 'Edit', 'jetpack-paypal-payments' ) }
					isPressed={ isEditing }
					onClick={ () => setIsEditing( true ) }
				/>
			</ToolbarGroup>
		</BlockControls>
	) : null;

	// Inspector sidebar — always shown when connected.
	const inspectorControls = (
		<InspectorControls>
			<PanelBody title={ __( 'Button Settings', 'jetpack-paypal-payments' ) }>
				<SelectControl
					label={ __( 'Button Layout', 'jetpack-paypal-payments' ) }
					value={ buttonType }
					options={ BUTTON_TYPE_OPTIONS }
					onChange={ value => setAttributes( { buttonType: value } ) }
				/>
				<TextControl
					label={ __( 'Button Text', 'jetpack-paypal-payments' ) }
					value={ buttonText || '' }
					onChange={ value => setAttributes( { buttonText: value } ) }
				/>
			</PanelBody>

			{ hasButton && (
				<PanelBody
					title={ __( 'PayPal Connection', 'jetpack-paypal-payments' ) }
					initialOpen={ false }
				>
					<p>
						{ __( 'Resource ID:', 'jetpack-paypal-payments' ) } <code>{ resourceId }</code>
					</p>
					<p>
						{ __( 'Environment:', 'jetpack-paypal-payments' ) } <strong>{ environment }</strong>
					</p>
					<div style={ { display: 'flex', gap: '8px', marginTop: '12px' } }>
						<Button
							variant="secondary"
							isDestructive
							onClick={ handleDeleteButton }
							disabled={ isCreating }
						>
							{ __( 'Delete Button', 'jetpack-paypal-payments' ) }
						</Button>
						<Button variant="secondary" isDestructive onClick={ handleDisconnect }>
							{ __( 'Disconnect', 'jetpack-paypal-payments' ) }
						</Button>
					</div>
				</PanelBody>
			) }

			{ ! hasButton && (
				<PanelBody
					title={ __( 'PayPal Connection', 'jetpack-paypal-payments' ) }
					initialOpen={ false }
				>
					<p>
						{ __( 'Environment:', 'jetpack-paypal-payments' ) } <strong>{ environment }</strong>
					</p>
					<Button variant="secondary" isDestructive onClick={ handleDisconnect }>
						{ __( 'Disconnect PayPal', 'jetpack-paypal-payments' ) }
					</Button>
				</PanelBody>
			) }
		</InspectorControls>
	);

	// Connected + has button + preview mode — show live button preview.
	if ( hasButton && ! isEditing ) {
		return (
			<div { ...blockProps }>
				{ toolbarControls }
				{ inspectorControls }

				<div className="jetpack-paypal-payment-buttons__preview">
					<div className="jetpack-paypal-payment-buttons__preview-status">
						<span className="jetpack-paypal-payment-buttons__status-dot jetpack-paypal-payment-buttons__status-dot--connected" />
						{ __( 'PayPal Connected', 'jetpack-paypal-payments' ) }
						{ environment === 'sandbox' && (
							<span className="jetpack-paypal-payment-buttons__sandbox-badge">
								{ __( 'Sandbox', 'jetpack-paypal-payments' ) }
							</span>
						) }
					</div>

					{ successMessage && (
						<Notice status="success" isDismissible onDismiss={ () => setSuccessMessage( null ) }>
							{ successMessage }
						</Notice>
					) }

					{ error && (
						<Notice status="error" isDismissible onDismiss={ () => setError( null ) }>
							{ error }
						</Notice>
					) }

					<PayPalButtonPreview
						buttonText={ buttonText }
						buttonType={ buttonType }
						productName={ productName }
						price={ price }
						currencyCode={ currencyCode }
						productDescription={ productDescription }
						paymentLink={ paymentLink }
					/>
				</div>
			</div>
		);
	}

	// Connected — edit mode (either creating new or editing existing).
	return (
		<div { ...blockProps }>
			{ toolbarControls }
			{ inspectorControls }

			<div className="jetpack-paypal-payment-buttons__create-form">
				<div className="jetpack-paypal-payment-buttons__preview-status">
					<span className="jetpack-paypal-payment-buttons__status-dot jetpack-paypal-payment-buttons__status-dot--connected" />
					{ __( 'PayPal Connected', 'jetpack-paypal-payments' ) }
					{ environment === 'sandbox' && (
						<span className="jetpack-paypal-payment-buttons__sandbox-badge">
							{ __( 'Sandbox', 'jetpack-paypal-payments' ) }
						</span>
					) }
				</div>

				<h3>
					{ hasButton
						? __( 'Edit PayPal Button or Link', 'jetpack-paypal-payments' )
						: __( 'Create PayPal Button or Link', 'jetpack-paypal-payments' ) }
				</h3>
				{ ! hasButton && (
					<p className="jetpack-paypal-payment-buttons__form-intro">
						{ __(
							'This creates a PayPal payment resource — you get both an embeddable branded button and a shareable payment link URL. Use the button on this page, or share the link anywhere.',
							'jetpack-paypal-payments'
						) }
					</p>
				) }

				{ error && (
					<Notice status="error" isDismissible onDismiss={ () => setError( null ) }>
						{ error }
					</Notice>
				) }

				{ successMessage && (
					<Notice status="success" isDismissible onDismiss={ () => setSuccessMessage( null ) }>
						{ successMessage }
					</Notice>
				) }

				<TextControl
					label={ __( 'Product Name', 'jetpack-paypal-payments' ) }
					value={ productName || '' }
					onChange={ value => setAttributes( { productName: value } ) }
					onBlur={ () => markTouched( 'productName' ) }
					placeholder={ __( 'e.g., Premium Widget', 'jetpack-paypal-payments' ) }
					help={
						touchedFields.productName && validationErrors.productName
							? undefined
							: sprintf(
									/* translators: %d: maximum number of characters allowed */
									__( 'Max %d characters.', 'jetpack-paypal-payments' ),
									MAX_NAME_LENGTH
							  )
					}
					className={
						touchedFields.productName && validationErrors.productName ? 'has-error' : undefined
					}
				/>
				{ touchedFields.productName && validationErrors.productName && (
					<p className="jetpack-paypal-payment-buttons__field-error">
						{ validationErrors.productName }
					</p>
				) }

				<div className="jetpack-paypal-payment-buttons__price-row">
					<div>
						<TextControl
							label={ __( 'Price', 'jetpack-paypal-payments' ) }
							value={ price || '' }
							onChange={ value => setAttributes( { price: value } ) }
							onBlur={ () => markTouched( 'price' ) }
							type="number"
							min="0.01"
							step="0.01"
							placeholder="29.99"
							className={ touchedFields.price && validationErrors.price ? 'has-error' : undefined }
						/>
						{ touchedFields.price && validationErrors.price && (
							<p className="jetpack-paypal-payment-buttons__field-error">
								{ validationErrors.price }
							</p>
						) }
					</div>
					<SelectControl
						label={ __( 'Currency', 'jetpack-paypal-payments' ) }
						value={ currencyCode || 'USD' }
						options={ SUPPORTED_CURRENCIES }
						onChange={ value => setAttributes( { currencyCode: value } ) }
					/>
				</div>

				<TextareaControl
					label={ __( 'Description (optional)', 'jetpack-paypal-payments' ) }
					value={ productDescription || '' }
					onChange={ value => setAttributes( { productDescription: value } ) }
					onBlur={ () => markTouched( 'productDescription' ) }
					help={
						touchedFields.productDescription && validationErrors.productDescription
							? undefined
							: sprintf(
									/* translators: %d: maximum number of characters allowed */
									__(
										'Shown to customers at checkout. Max %d characters.',
										'jetpack-paypal-payments'
									),
									MAX_DESCRIPTION_LENGTH
							  )
					}
					className={
						touchedFields.productDescription && validationErrors.productDescription
							? 'has-error'
							: undefined
					}
				/>
				{ touchedFields.productDescription && validationErrors.productDescription && (
					<p className="jetpack-paypal-payment-buttons__field-error">
						{ validationErrors.productDescription }
					</p>
				) }

				<TextControl
					label={ __( 'Return URL (optional)', 'jetpack-paypal-payments' ) }
					value={ returnUrl || '' }
					onChange={ value => setAttributes( { returnUrl: value } ) }
					type="url"
					help={ __( 'Redirect customers here after payment.', 'jetpack-paypal-payments' ) }
				/>

				<div className="jetpack-paypal-payment-buttons__form-actions">
					<Button
						variant="primary"
						onClick={ hasButton ? handleUpdateButton : handleCreateButton }
						isBusy={ isCreating }
						disabled={ isCreating || ! isFormValid }
					>
						{ isCreating && __( 'Saving…', 'jetpack-paypal-payments' ) }
						{ ! isCreating && hasButton && __( 'Update Button & Link', 'jetpack-paypal-payments' ) }
						{ ! isCreating &&
							! hasButton &&
							__( 'Create Button & Link', 'jetpack-paypal-payments' ) }
					</Button>

					{ hasButton && (
						<Button
							variant="tertiary"
							onClick={ () => {
								setIsEditing( false );
								setTouchedFields( {} );
							} }
						>
							{ __( 'Cancel', 'jetpack-paypal-payments' ) }
						</Button>
					) }
				</div>
			</div>
		</div>
	);
}
