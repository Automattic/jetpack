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
import {
	BlockControls,
	InspectorControls,
	MediaUpload,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	Button,
	Notice,
	PanelBody,
	SelectControl,
	Spinner,
	TextControl,
	TextareaControl,
	ToggleControl,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import PayPalButtonPreview from './paypal-button-preview';
import VariantBuilder, { validateVariants } from './variant-builder';

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
		imageUrl,
		variantsEnabled,
		variants,
		adjustableQuantity,
		maxQuantity,
		customerNotes,
		taxEnabled,
		taxType,
		taxName,
		taxValue,
	} = attributes;

	const blockProps = useBlockProps();

	// Pre-extract translated strings used in ternaries to avoid
	// i18n-check-webpack-plugin errors when the minifier collapses branches.
	const labelConnect = __( 'Connect', 'jetpack-paypal-payments' );
	const labelConnecting = __( 'Connecting\u2026', 'jetpack-paypal-payments' );
	const labelHide = __( 'Hide', 'jetpack-paypal-payments' );
	const labelShow = __( 'Show', 'jetpack-paypal-payments' );
	const labelHideSecret = __( 'Hide client secret', 'jetpack-paypal-payments' );
	const labelShowSecret = __( 'Show client secret', 'jetpack-paypal-payments' );
	const labelEditHeading = __( 'Edit PayPal Button or Link', 'jetpack-paypal-payments' );
	const labelCreateHeading = __( 'Create PayPal Button or Link', 'jetpack-paypal-payments' );

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
	// Persisted in localStorage so navigating away and back doesn't reset the wizard.
	const [ wizardStep, setWizardStep ] = useState( () => {
		try {
			const saved = window.localStorage.getItem( 'jetpack-paypal-wizard-step' );
			if ( saved && [ 'welcome', 'dashboard', 'credentials', 'success' ].includes( saved ) ) {
				return saved;
			}
		} catch {
			// localStorage unavailable — use default.
		}
		return 'welcome';
	} );
	const [ showSecretField, setShowSecretField ] = useState( false );

	// Persist wizard step changes to localStorage.
	useEffect( () => {
		try {
			if ( wizardStep === 'success' || isConnected ) {
				window.localStorage.removeItem( 'jetpack-paypal-wizard-step' );
			} else {
				window.localStorage.setItem( 'jetpack-paypal-wizard-step', wizardStep );
			}
		} catch {
			// localStorage unavailable — ignore.
		}
	}, [ wizardStep, isConnected ] );

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
	 * Variant validation errors (empty array if valid or disabled).
	 */
	const variantErrors = useMemo(
		() => validateVariants( variantsEnabled, variants ),
		[ variantsEnabled, variants ]
	);

	/**
	 * Whether the form is valid (no validation errors on required fields or variants).
	 */
	const isFormValid =
		! validationErrors.productName &&
		! validationErrors.price &&
		! validationErrors.currencyCode &&
		variantErrors.length === 0;

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
	 * Handle PayPal disconnect with confirmation.
	 */
	const handleDisconnect = useCallback( () => {
		if (
			// eslint-disable-next-line no-alert -- Confirmation required for destructive action.
			! window.confirm(
				__(
					'Disconnect your PayPal account? You will need to re-enter your credentials to create new buttons. Existing published buttons will continue to work.',
					'jetpack-paypal-payments'
				)
			)
		) {
			return;
		}
		apiFetch( {
			path: `${ API_BASE }/disconnect`,
			method: 'POST',
		} ).then( () => {
			setIsConnected( false );
			setWizardStep( 'welcome' );
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
					...( imageUrl ? { image_url: imageUrl } : {} ),
					...( variantsEnabled && variants ? { variants } : {} ),
					...( adjustableQuantity && maxQuantity > 1
						? { adjustable_quantity: { maximum: parseInt( maxQuantity, 10 ) } }
						: {} ),
					...( customerNotes?.length > 0
						? { customer_notes: customerNotes.filter( n => n.label?.trim() ) }
						: {} ),
					...( taxEnabled && taxName
						? {
								taxes: [
									{
										name: taxName,
										type: taxType || 'PERCENTAGE',
										value: taxType === 'PREFERENCE' ? 'PROFILE' : taxValue || '0',
									},
								],
						  }
						: {} ),
				},
			],
			...( returnUrl ? { return_url: returnUrl } : {} ),
		} ),
		[
			productName,
			price,
			currencyCode,
			productDescription,
			returnUrl,
			imageUrl,
			variantsEnabled,
			variants,
			adjustableQuantity,
			maxQuantity,
			customerNotes,
			taxEnabled,
			taxType,
			taxName,
			taxValue,
		]
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

		let isRecreating = false;

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
				// If the resource was deleted from PayPal (404), automatically
				// re-create it as a new button with the same product data.
				// This handles demo/playground blocks and buttons deleted outside WordPress.
				if ( err.code === 'paypal_api_resource_not_found' || err.data?.status === 404 ) {
					isRecreating = true;
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
								__(
									'Button re-created on PayPal with a new payment link.',
									'jetpack-paypal-payments'
								)
							);
							setIsEditing( false );
							setTouchedFields( {} );
						} )
						.catch( createErr => {
							setError( getUserFriendlyError( createErr ) );
						} )
						.finally( () => {
							setIsCreating( false );
						} );
					return;
				}

				setError( getUserFriendlyError( err ) );
			} )
			.finally( () => {
				if ( ! isRecreating ) {
					setIsCreating( false );
				}
			} );
	}, [ resourceId, buildRequestData, paymentLink, setAttributes, isFormValid ] );

	/**
	 * Delete the PayPal payment button via the API with confirmation.
	 */
	const handleDeleteButton = useCallback( () => {
		if ( ! resourceId ) {
			return;
		}

		if (
			// eslint-disable-next-line no-alert -- Confirmation required for destructive action.
			! window.confirm(
				__(
					'Delete this PayPal button? This permanently removes the payment resource from PayPal. Customers will no longer be able to pay using this button.',
					'jetpack-paypal-payments'
				)
			)
		) {
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

	/**
	 * PayPal logo SVG for the welcome step — provides brand trust.
	 */
	const paypalLogoSvg = (
		<svg
			className="jetpack-paypal-wizard__logo"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 101 32"
			aria-hidden="true"
			focusable="false"
		>
			<path
				d="M12.5 4.7h-7c-.5 0-.9.3-1 .8L1.6 25c0 .3.2.6.6.6h3.3c.5 0 .9-.3 1-.8l.8-5.4c0-.5.5-.8 1-.8h2.3c4.7 0 7.4-2.3 8.1-6.8.3-2 0-3.5-.9-4.6C16.7 5.5 14.9 4.7 12.5 4.7zm.8 6.7c-.4 2.6-2.3 2.6-4.2 2.6h-1l.8-4.8c0-.3.3-.5.6-.5h.5c1.3 0 2.5 0 3.1.7.4.5.5 1.2.2 2z"
				fill="#253B80"
			/>
			<path
				d="M35.2 11.3h-3.3c-.3 0-.5.2-.6.5l-.1.9-.2-.3c-.7-1-2.2-1.3-3.7-1.3-3.5 0-6.4 2.6-7 6.3-.3 1.8.1 3.6 1.2 4.8 1 1.1 2.4 1.6 4.1 1.6 2.9 0 4.5-1.9 4.5-1.9l-.1.9c0 .3.2.6.6.6h3c.5 0 .9-.3 1-.8l1.8-11.5c-.1-.4-.4-.8-.7-.8zm-4.5 6.1c-.3 1.8-1.8 3-3.6 3-.9 0-1.6-.3-2.1-.8-.4-.5-.6-1.3-.5-2.1.3-1.8 1.8-3 3.6-3 .9 0 1.6.3 2.1.8.4.6.6 1.3.5 2.1z"
				fill="#253B80"
			/>
			<path
				d="M55.1 11.3h-3.4c-.3 0-.6.2-.8.4l-4.5 6.6-1.9-6.4c-.1-.4-.5-.6-.9-.6h-3.3c-.4 0-.7.4-.5.7l3.6 10.5-3.4 4.8c-.3.4 0 .9.4.9h3.3c.3 0 .6-.1.8-.4l10.9-15.7c.3-.4 0-.8-.3-.8z"
				fill="#253B80"
			/>
			<path
				d="M67.4 4.7h-7c-.5 0-.9.3-1 .8L56.5 25c0 .3.2.6.6.6h3.5c.3 0 .6-.2.7-.6l.8-5.2c0-.5.5-.8 1-.8h2.3c4.7 0 7.4-2.3 8.1-6.8.3-2 0-3.5-.9-4.6-1.1-1.2-2.9-1.9-5.2-1.9zm.8 6.7c-.4 2.6-2.3 2.6-4.2 2.6h-1l.8-4.8c0-.3.3-.5.6-.5h.5c1.3 0 2.5 0 3.1.7.3.5.4 1.2.2 2z"
				fill="#179BD7"
			/>
			<path
				d="M90.1 11.3h-3.3c-.3 0-.5.2-.6.5l-.1.9-.2-.3c-.7-1-2.2-1.3-3.7-1.3-3.5 0-6.4 2.6-7 6.3-.3 1.8.1 3.6 1.2 4.8 1 1.1 2.4 1.6 4.1 1.6 2.9 0 4.5-1.9 4.5-1.9l-.1.9c0 .3.2.6.6.6h3c.5 0 .9-.3 1-.8l1.8-11.5c-.1-.4-.3-.8-.7-.8zm-4.5 6.1c-.3 1.8-1.8 3-3.6 3-.9 0-1.6-.3-2.1-.8-.4-.5-.6-1.3-.5-2.1.3-1.8 1.8-3 3.6-3 .9 0 1.6.3 2.1.8.4.6.5 1.3.5 2.1z"
				fill="#179BD7"
			/>
			<path
				d="M95.1 5.2l-3 19.9c0 .3.2.6.6.6h2.9c.5 0 .9-.3 1-.8L99.5 5.5c0-.3-.2-.6-.6-.6h-3.2c-.2 0-.5.1-.6.3z"
				fill="#179BD7"
			/>
		</svg>
	);

	// Not connected — show guided connection wizard.
	if ( ! isConnected ) {
		return (
			<div { ...blockProps }>
				<div className="jetpack-paypal-payment-buttons__connect">
					{ /* Step indicator */ }
					{ wizardStep !== 'welcome' && wizardStep !== 'success' && (
						<div
							className="jetpack-paypal-wizard__step-indicator"
							role="list"
							aria-label={ __( 'Setup progress', 'jetpack-paypal-payments' ) }
						>
							<span
								role="listitem"
								aria-current={ wizardStep === 'dashboard' ? 'step' : undefined }
								className={ `jetpack-paypal-wizard__step ${
									wizardStep === 'dashboard' || wizardStep === 'credentials' ? 'is-active' : ''
								}` }
							>
								{ __( '1', 'jetpack-paypal-payments' ) }
							</span>
							<span className="jetpack-paypal-wizard__step-line" aria-hidden="true" />
							<span
								role="listitem"
								aria-current={ wizardStep === 'credentials' ? 'step' : undefined }
								className={ `jetpack-paypal-wizard__step ${
									wizardStep === 'credentials' ? 'is-active' : ''
								}` }
							>
								{ __( '2', 'jetpack-paypal-payments' ) }
							</span>
							<span className="jetpack-paypal-wizard__step-line" aria-hidden="true" />
							<span role="listitem" className="jetpack-paypal-wizard__step">
								{ __( '3', 'jetpack-paypal-payments' ) }
							</span>
						</div>
					) }

					{ /* Step 1: Welcome */ }
					{ wizardStep === 'welcome' && (
						<div className="jetpack-paypal-wizard__welcome">
							{ paypalLogoSvg }
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
									aria-label={ showSecretField ? labelHideSecret : labelShowSecret }
								>
									{ showSecretField ? labelHide : labelShow }
								</Button>
							</div>

							<div className="jetpack-paypal-wizard__actions">
								<Button
									variant="primary"
									onClick={ handleConnect }
									isBusy={ isConnecting }
									disabled={ isConnecting || ! clientId || ! clientSecret }
								>
									{ isConnecting ? labelConnecting : labelConnect }
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
									<>
										<Button variant="link" onClick={ () => setEnvironment( 'production' ) }>
											{ __( 'Switch to Production (Live)', 'jetpack-paypal-payments' ) }
										</Button>
										<br />
										<span className="jetpack-paypal-wizard__env-hint">
											{ __(
												'Sandbox creates test buttons that do not process real payments.',
												'jetpack-paypal-payments'
											) }
										</span>
									</>
								) }
							</p>
						</div>
					) }

					{ /* Step 4: Success */ }
					{ wizardStep === 'success' && (
						<div className="jetpack-paypal-wizard__success">
							<div className="jetpack-paypal-wizard__success-icon" aria-hidden="true">
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

			{ /* Variant builder moved inline to the block form for discoverability. */ }

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
					<div className="jetpack-paypal-payment-buttons__destructive-actions">
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
						imageUrl={ imageUrl }
						variantsEnabled={ variantsEnabled }
						variants={ variants }
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

				<h3>{ hasButton ? labelEditHeading : labelCreateHeading }</h3>
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
					disabled={ isCreating }
					placeholder={ __( 'e.g., Premium Widget', 'jetpack-paypal-payments' ) }
					help={
						touchedFields.productName && validationErrors.productName
							? validationErrors.productName
							: sprintf(
									/* translators: 1: current character count, 2: maximum allowed */
									__( '%1$d / %2$d characters', 'jetpack-paypal-payments' ),
									( productName || '' ).length,
									MAX_NAME_LENGTH
							  )
					}
					className={
						touchedFields.productName && validationErrors.productName ? 'has-error' : undefined
					}
				/>

				<div className="jetpack-paypal-payment-buttons__price-row">
					<div>
						<TextControl
							label={ __( 'Price', 'jetpack-paypal-payments' ) }
							value={ price || '' }
							onChange={ value => setAttributes( { price: value } ) }
							onBlur={ () => markTouched( 'price' ) }
							disabled={ isCreating }
							type="number"
							min="0.01"
							step="0.01"
							placeholder="29.99"
							help={
								touchedFields.price && validationErrors.price ? validationErrors.price : undefined
							}
							className={ touchedFields.price && validationErrors.price ? 'has-error' : undefined }
						/>
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
							? validationErrors.productDescription
							: sprintf(
									/* translators: 1: current character count, 2: maximum allowed */
									__(
										'Shown to customers at checkout. %1$d / %2$d characters',
										'jetpack-paypal-payments'
									),
									( productDescription || '' ).length,
									MAX_DESCRIPTION_LENGTH
							  )
					}
					className={
						touchedFields.productDescription && validationErrors.productDescription
							? 'has-error'
							: undefined
					}
				/>

				<div className="jetpack-paypal-payment-buttons__image-upload">
					<p className="jetpack-paypal-payment-buttons__field-label">
						{ __( 'Product Image (optional)', 'jetpack-paypal-payments' ) }
					</p>
					{ imageUrl ? (
						<div className="jetpack-paypal-payment-buttons__image-preview">
							<img src={ imageUrl } alt={ productName || '' } />
							<Button
								variant="secondary"
								isDestructive
								isSmall
								onClick={ () => setAttributes( { imageUrl: '' } ) }
								disabled={ isCreating }
							>
								{ __( 'Remove Image', 'jetpack-paypal-payments' ) }
							</Button>
						</div>
					) : (
						<MediaUpload
							onSelect={ media => setAttributes( { imageUrl: media.url } ) }
							allowedTypes={ [ 'image' ] }
							render={ ( { open } ) => (
								<Button
									variant="secondary"
									onClick={ open }
									disabled={ isCreating }
									className="jetpack-paypal-payment-buttons__upload-button"
								>
									{ __( 'Upload Image', 'jetpack-paypal-payments' ) }
								</Button>
							) }
						/>
					) }
					<p className="jetpack-paypal-payment-buttons__field-help">
						{ __( 'Shown on the PayPal checkout page.', 'jetpack-paypal-payments' ) }
					</p>
				</div>
				<div className="jetpack-paypal-payment-buttons__variants-section">
					<VariantBuilder
						enabled={ variantsEnabled }
						variants={ variants }
						currencyCode={ currencyCode || 'USD' }
						onChange={ updates => setAttributes( updates ) }
						disabled={ isCreating }
					/>
				</div>

				<TextControl
					label={ __( 'Return URL (optional)', 'jetpack-paypal-payments' ) }
					value={ returnUrl || '' }
					onChange={ value => setAttributes( { returnUrl: value } ) }
					onBlur={ () => markTouched( 'returnUrl' ) }
					type="url"
					disabled={ isCreating }
					help={
						touchedFields.returnUrl && returnUrl && ! /^https:\/\/.+/.test( returnUrl )
							? __(
									'Return URL must use HTTPS (e.g., https://example.com/thank-you).',
									'jetpack-paypal-payments'
							  )
							: __( 'Redirect customers here after payment.', 'jetpack-paypal-payments' )
					}
					className={
						touchedFields.returnUrl && returnUrl && ! /^https:\/\/.+/.test( returnUrl )
							? 'has-error'
							: undefined
					}
				/>

				<div className="jetpack-paypal-payment-buttons__checkout-options">
					<h4 className="jetpack-paypal-payment-buttons__section-heading">
						{ __( 'Checkout Options', 'jetpack-paypal-payments' ) }
					</h4>

					{ /* WOOPTP-170: Adjustable Quantity */ }
					<ToggleControl
						label={ __( 'Allow customers to adjust quantity', 'jetpack-paypal-payments' ) }
						help={
							adjustableQuantity
								? __( 'Customers can buy multiple units at checkout.', 'jetpack-paypal-payments' )
								: __( 'Fixed at 1 unit per purchase.', 'jetpack-paypal-payments' )
						}
						checked={ adjustableQuantity }
						onChange={ value => setAttributes( { adjustableQuantity: value } ) }
						disabled={ isCreating }
					/>
					{ adjustableQuantity && (
						<TextControl
							label={ __( 'Maximum quantity', 'jetpack-paypal-payments' ) }
							value={ maxQuantity || '' }
							onChange={ value => setAttributes( { maxQuantity: parseInt( value, 10 ) || 10 } ) }
							type="number"
							min={ 2 }
							max={ 999 }
							disabled={ isCreating }
							help={ __(
								'Customers can select from 1 to this number.',
								'jetpack-paypal-payments'
							) }
						/>
					) }

					{ /* WOOPTP-172: Tax Configuration */ }
					<ToggleControl
						label={ __( 'Collect tax', 'jetpack-paypal-payments' ) }
						help={
							taxEnabled
								? __( 'Tax will be added at PayPal checkout.', 'jetpack-paypal-payments' )
								: __( 'No tax collected.', 'jetpack-paypal-payments' )
						}
						checked={ taxEnabled }
						onChange={ value => setAttributes( { taxEnabled: value } ) }
						disabled={ isCreating }
					/>
					{ taxEnabled && (
						<div className="jetpack-paypal-payment-buttons__tax-config">
							<SelectControl
								label={ __( 'Tax type', 'jetpack-paypal-payments' ) }
								value={ taxType || 'PERCENTAGE' }
								options={ [
									{
										label: __( 'Fixed percentage', 'jetpack-paypal-payments' ),
										value: 'PERCENTAGE',
									},
									{
										label: __( 'Use PayPal profile settings', 'jetpack-paypal-payments' ),
										value: 'PREFERENCE',
									},
								] }
								onChange={ value => setAttributes( { taxType: value } ) }
								disabled={ isCreating }
							/>
							<TextControl
								label={ __( 'Tax name', 'jetpack-paypal-payments' ) }
								value={ taxName || '' }
								onChange={ value => setAttributes( { taxName: value } ) }
								placeholder={ __( 'Sales Tax', 'jetpack-paypal-payments' ) }
								disabled={ isCreating }
							/>
							{ taxType === 'PERCENTAGE' && (
								<TextControl
									label={ __( 'Tax rate (%)', 'jetpack-paypal-payments' ) }
									value={ taxValue || '' }
									onChange={ value => setAttributes( { taxValue: value } ) }
									type="number"
									min="0.01"
									max="99.99"
									step="0.01"
									placeholder="8.25"
									disabled={ isCreating }
									help={ __( 'Percentage added to the product price.', 'jetpack-paypal-payments' ) }
								/>
							) }
						</div>
					) }

					{ /* WOOPTP-171: Customer Notes */ }
					<ToggleControl
						label={ __( 'Custom checkout fields', 'jetpack-paypal-payments' ) }
						help={
							customerNotes?.length > 0
								? sprintf(
										/* translators: %d: number of custom fields */
										__( '%d custom field(s) configured.', 'jetpack-paypal-payments' ),
										customerNotes.length
								  )
								: __(
										'Add fields for gift messages, personalization, etc.',
										'jetpack-paypal-payments'
								  )
						}
						checked={ customerNotes?.length > 0 }
						onChange={ value => {
							if ( value ) {
								setAttributes( {
									customerNotes: [ { label: '', required: false } ],
								} );
							} else {
								setAttributes( { customerNotes: [] } );
							}
						} }
						disabled={ isCreating }
					/>
					{ customerNotes?.length > 0 && (
						<div className="jetpack-paypal-payment-buttons__customer-notes">
							{ customerNotes.map( ( note, noteIndex ) => (
								<div key={ noteIndex } className="jetpack-paypal-payment-buttons__customer-note">
									<TextControl
										label={ sprintf(
											/* translators: %d: field number */
											__( 'Field %d label', 'jetpack-paypal-payments' ),
											noteIndex + 1
										) }
										value={ note.label || '' }
										onChange={ value => {
											const updated = [ ...customerNotes ];
											updated[ noteIndex ] = {
												...updated[ noteIndex ],
												label: value,
											};
											setAttributes( { customerNotes: updated } );
										} }
										placeholder={ __( 'e.g., Gift Message', 'jetpack-paypal-payments' ) }
										disabled={ isCreating }
									/>
									<div className="jetpack-paypal-payment-buttons__customer-note-controls">
										<ToggleControl
											label={ __( 'Required', 'jetpack-paypal-payments' ) }
											checked={ note.required }
											onChange={ value => {
												const updated = [ ...customerNotes ];
												updated[ noteIndex ] = {
													...updated[ noteIndex ],
													required: value,
												};
												setAttributes( { customerNotes: updated } );
											} }
											disabled={ isCreating }
										/>
										{ customerNotes.length > 1 && (
											<Button
												isSmall
												isDestructive
												variant="tertiary"
												onClick={ () => {
													const updated = customerNotes.filter( ( _, i ) => i !== noteIndex );
													setAttributes( { customerNotes: updated } );
												} }
												disabled={ isCreating }
												aria-label={ sprintf(
													/* translators: %d: field number */
													__( 'Remove field %d', 'jetpack-paypal-payments' ),
													noteIndex + 1
												) }
											>
												{ __( 'Remove', 'jetpack-paypal-payments' ) }
											</Button>
										) }
									</div>
								</div>
							) ) }
							{ customerNotes.length < 5 && (
								<Button
									isSmall
									variant="secondary"
									onClick={ () =>
										setAttributes( {
											customerNotes: [ ...customerNotes, { label: '', required: false } ],
										} )
									}
									disabled={ isCreating }
								>
									{ __( 'Add field', 'jetpack-paypal-payments' ) }
								</Button>
							) }
						</div>
					) }
				</div>

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
