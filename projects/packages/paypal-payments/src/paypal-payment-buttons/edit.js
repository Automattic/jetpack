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
	MediaUploadCheck,
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
import {
	validatePrice,
	validateProductName,
	validateDescription,
	getUserFriendlyError,
	MAX_NAME_LENGTH,
	MAX_DESCRIPTION_LENGTH,
} from './validation';
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
];

/**
 * Currency code set for fast lookup.
 */
const VALID_CURRENCY_CODES = new Set( SUPPORTED_CURRENCIES.map( c => c.value ) );

/**
 * Button type options for the block display style.
 */
const BUTTON_TYPE_OPTIONS = [
	{ label: __( 'PayPal + Debit/Credit Card', 'jetpack-paypal-payments' ), value: 'stacked' },
	{ label: __( 'PayPal Only', 'jetpack-paypal-payments' ), value: 'single' },
];

/**
 * REST API base path for PayPal endpoints.
 */
const API_BASE = '/jetpack/v4/paypal';

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
		imageUrl,
		imageId,
		returnUrl,
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
	const labelEditHeading = __( 'Edit PayPal Payment Button', 'jetpack-paypal-payments' );
	const labelCreateHeading = __( 'Create PayPal Payment Button', 'jetpack-paypal-payments' );
	const helpQtyOn = __(
		'Customers can buy multiple units at checkout.',
		'jetpack-paypal-payments'
	);
	const helpQtyOff = __( 'Fixed at 1 unit per purchase.', 'jetpack-paypal-payments' );
	const helpTaxOn = __( 'Tax will be added at PayPal checkout.', 'jetpack-paypal-payments' );
	const helpTaxOff = __( 'No tax collected.', 'jetpack-paypal-payments' );

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

		const doDisconnect = () => {
			setIsConnected( false );
			setWizardStep( 'welcome' );
			// Clear block attributes so the block shows the connect wizard.
			setAttributes( {
				isApiManaged: false,
				resourceId: '',
				paymentLink: '',
				productName: '',
				price: '',
				productDescription: '',
			} );
			setSuccessMessage( __( 'PayPal account disconnected.', 'jetpack-paypal-payments' ) );
		};

		apiFetch( {
			path: `${ API_BASE }/disconnect`,
			method: 'POST',
		} )
			.then( doDisconnect )
			.catch( doDisconnect ); // Still disconnect locally if API fails.
	}, [ setAttributes ] );

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
							label={ __( 'Payment Methods', 'jetpack-paypal-payments' ) }
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
	 * PayPal full-color logo SVG for the wizard welcome step.
	 * Source: paypalobjects.com/digitalassets/c/website/logo/full-text/pp_fc_hl.svg
	 * Includes the double-P monogram + wordmark for brand recognition.
	 */
	const paypalLogoSvg = (
		<svg
			className="jetpack-paypal-wizard__logo"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 246 60"
			aria-hidden="true"
			focusable="false"
		>
			{ /* Double-P monogram — dark blue back P */ }
			<path
				d="M45.4 15.6c-.06.35-.12.71-.19 1.08C42.82 29.22 34.47 33.55 23.81 33.55h-5.43c-1.3 0-2.4.95-2.6 2.23l-3.57 22.61c-.13.84.52 1.61 1.38 1.61h9.62c1.14 0 2.11-.83 2.29-1.95l.09-.49 1.81-11.5.12-.63c.18-1.13 1.15-1.95 2.29-1.95h1.44c9.32 0 16.62-3.79 18.75-14.74.89-4.58.43-8.4-1.93-11.08-.69-.81-1.58-1.48-2.61-2.03"
				fill="#2790C3"
			/>
			{ /* Double-P monogram — shadow */ }
			<path
				d="M42.89 14.6c-.37-.11-.75-.21-1.15-.3-.4-.09-.81-.17-1.22-.23-1.46-.24-3.07-.35-4.78-.35H21.24c-.36 0-.69.08-1 .23-.67.32-1.17.95-1.29 1.73l-3.08 19.54-.09.57c.2-1.29 1.3-2.23 2.6-2.23h5.43c10.66 0 19-4.33 21.44-16.85.07-.37.13-.73.19-1.07-.62-.33-1.28-.55-2-.79-.18-.06-.36-.11-.54-.16"
				fill="#1F264F"
			/>
			{ /* Double-P monogram — dark blue front P */ }
			<path
				d="M18.95 15.68c.12-.77.62-1.41 1.29-1.73.31-.15.64-.23 1-.23h14.5c1.72 0 3.32.11 4.78.35.41.07.82.14 1.22.24.4.09.78.18 1.15.3.18.06.36.11.54.16.72.24 1.39.5 2 .79.73-4.63 0-7.78-2.5-10.63C40.18 1.84 35.2.5 28.83.5H10.33c-1.3 0-2.4.95-2.61 2.23L.02 51.56c-.15.96.61 1.84 1.59 1.84h11.42l4.95-31.72"
				fill="#27346A"
			/>
			{ /* Wordmark — "Pay" dark blue */ }
			<path
				d="M92.69 13.8H79.2c-.92 0-1.71.67-1.85 1.58l-5.45 34.58c-.11.68.42 1.3 1.11 1.3h5.57c.64 0 1.19-.47 1.3-1.1l1.55-9.83c.14-.91.93-1.58 1.85-1.58h4.27c8.88 0 14 -4.3 15.35-12.82.6-3.73.02-6.65-1.72-8.7-1.92-2.25-5.32-3.44-9.83-3.44zm.82 12.63c-.74 4.84-4.44 4.84-8.01 4.84h-2.03l1.43-9.04c.09-.55.56-.95 1.11-.95h.93c2.43 0 4.73 0 5.92 1.39.71.83.93 2.06.65 3.77z"
				fill="#27346A"
			/>
			<path
				d="M124 38.85c-.63 3.69-3.55 6.17-7.29 6.17-1.87 0-3.37-.6-4.33-1.74-.96-1.13-1.32-2.74-1.02-4.53.58-3.66 3.56-6.2 7.24-6.2 1.83 0 3.32.61 4.3 1.76.99 1.16 1.38 2.78 1.1 4.57zm9-12.57h-6.46c-.55 0-1.02.4-1.11.95l-.28 1.81-.45-.65c-1.4-2.03-4.51-2.71-7.63-2.71-7.13 0-13.23 5.4-14.41 12.99-.62 3.78.16 7.4 2.3 9.92 1.97 2.32 4.78 3.28 8.13 3.28 5.75 0 8.94-3.69 8.94-3.69l-.29 1.79c-.11.68.42 1.3 1.11 1.3h5.82c.92 0 1.71-.67 1.85-1.58l3.49-22.1c.11-.68-.42-1.3-1.11-1.3z"
				fill="#27346A"
			/>
			<path
				d="M167.38 26.28h-6.49c-.62 0-1.2.31-1.55.82l-8.95 13.19-3.79-12.67c-.24-.79-.97-1.34-1.8-1.34h-6.38c-.77 0-1.31.76-1.06 1.49l7.15 20.97-6.72 9.49c-.53.74 0 1.77.91 1.77h6.48c.61 0 1.19-.3 1.54-.8L168.31 28c.52-.74-.01-1.77-.93-1.77"
				fill="#27346A"
			/>
			{ /* Wordmark — "Pal" light blue */ }
			<path
				d="M188.87 13.8h-13.49c-.92 0-1.71.67-1.85 1.58l-5.45 34.58c-.11.68.42 1.3 1.11 1.3h6.92c.64 0 1.2-.47 1.3-1.11l1.55-9.8c.14-.91.93-1.58 1.85-1.58h4.27c8.88 0 14-4.3 15.34-12.82.61-3.73.03-6.65-1.72-8.7-1.92-2.25-5.32-3.44-9.83-3.44zm.82 12.63c-.74 4.84-4.44 4.84-8.01 4.84h-2.03l1.43-9.04c.09-.55.56-.95 1.11-.95h.93c2.43 0 4.73 0 5.92 1.39.71.83.93 2.06.65 3.77z"
				fill="#2790C3"
			/>
			<path
				d="M220.17 38.85c-.62 3.69-3.55 6.17-7.29 6.17-1.87 0-3.37-.6-4.33-1.74-.96-1.13-1.33-2.74-1.02-4.53.58-3.66 3.56-6.2 7.24-6.2 1.83 0 3.32.61 4.3 1.76.99 1.16 1.38 2.78 1.1 4.57zm9-12.57h-6.46c-.55 0-1.02.4-1.11.95l-.28 1.81-.45-.65c-1.4-2.03-4.52-2.71-7.63-2.71-7.13 0-13.23 5.4-14.42 12.99-.62 3.78.16 7.4 2.3 9.92 1.97 2.32 4.79 3.28 8.13 3.28 5.75 0 8.94-3.69 8.94-3.69l-.29 1.79c-.11.68.42 1.3 1.11 1.3h5.82c.92 0 1.71-.67 1.85-1.58l3.49-22.1c.11-.68-.42-1.3-1.11-1.3z"
				fill="#2790C3"
			/>
			<path
				d="M236.78 14.75l-5.53 35.21c-.11.68.42 1.3 1.11 1.3h5.57c.92 0 1.71-.67 1.85-1.58l5.46-34.58c.11-.68-.42-1.3-1.11-1.3h-6.23c-.55 0-1.02.4-1.11.95"
				fill="#2790C3"
			/>
		</svg>
	);

	// Not connected and no existing button — show guided connection wizard.
	// Skip the wizard if the block already has a saved button (e.g. demo posts in Playground).
	if ( ! isConnected && ! hasButton ) {
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
								{ '1' }
							</span>
							<span className="jetpack-paypal-wizard__step-line" aria-hidden="true" />
							<span
								role="listitem"
								aria-current={ wizardStep === 'credentials' ? 'step' : undefined }
								className={ `jetpack-paypal-wizard__step ${
									wizardStep === 'credentials' ? 'is-active' : ''
								}` }
							>
								{ '2' }
							</span>
							<span className="jetpack-paypal-wizard__step-line" aria-hidden="true" />
							<span role="listitem" className="jetpack-paypal-wizard__step">
								{ '3' }
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
									'Accept payments with PayPal by connecting your PayPal account.',
									'jetpack-paypal-payments'
								) }
							</p>
							<p>
								{ __(
									"You will grab API credentials - don't worry; we will walk you through getting them.",
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
							<h3>{ __( 'Step 1 of 3: Get Your API Credentials', 'jetpack-paypal-payments' ) }</h3>
							<ol className="jetpack-paypal-wizard__instructions">
								<li>
									{ __(
										'Open the PayPal Developer Dashboard (opens in a new tab)',
										'jetpack-paypal-payments'
									) }
								</li>
								<li>
									{ __( 'Log in with your PayPal Business account', 'jetpack-paypal-payments' ) }
								</li>
								<li>{ __( 'Go to Apps & Credentials', 'jetpack-paypal-payments' ) }</li>
								<li>
									{ __(
										'Copy the Client ID and Client Secret from your app',
										'jetpack-paypal-payments'
									) }
								</li>
							</ol>
							<div className="jetpack-paypal-wizard__actions">
								<Button
									variant="primary"
									href="https://developer.paypal.com/dashboard/applications/"
									target="_blank"
									rel="noopener noreferrer"
								>
									{ __( 'Open PayPal Dashboard ↗', 'jetpack-paypal-payments' ) }
								</Button>
							</div>
							<p className="jetpack-paypal-wizard__hint">
								{ __(
									'Once you have your Client ID and Secret, come back here and continue.',
									'jetpack-paypal-payments'
								) }
							</p>
							<div className="jetpack-paypal-wizard__actions">
								<Button variant="primary" onClick={ () => setWizardStep( 'credentials' ) }>
									{ __( 'I have my credentials — Next', 'jetpack-paypal-payments' ) }
								</Button>
							</div>
							<div className="jetpack-paypal-wizard__nav">
								<Button variant="link" onClick={ () => setWizardStep( 'welcome' ) }>
									{ __( '← Back', 'jetpack-paypal-payments' ) }
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
									'Enter the API credentials from your PayPal account:',
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
							</div>
							<div className="jetpack-paypal-wizard__nav">
								<Button
									variant="link"
									onClick={ () => setWizardStep( 'dashboard' ) }
									disabled={ isConnecting }
								>
									{ __( '← Back', 'jetpack-paypal-payments' ) }
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

	// Inspector sidebar — connection info and admin actions only.
	const inspectorControls = (
		<InspectorControls>
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
						variantsEnabled={ variantsEnabled }
						variants={ variants }
						imageUrl={ imageUrl }
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
							'Use the button on this page, or share the link anywhere.',
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

				<div className="jetpack-paypal-payment-buttons__image-field">
					<p className="components-base-control__label">
						{ __( 'Product Image (optional)', 'jetpack-paypal-payments' ) }
					</p>
					{ imageUrl ? (
						<div className="jetpack-paypal-payment-buttons__image-preview">
							<img src={ imageUrl } alt={ productName || '' } />
							<div className="jetpack-paypal-payment-buttons__image-actions">
								<MediaUploadCheck>
									<MediaUpload
										onSelect={ media =>
											setAttributes( { imageUrl: media.url, imageId: media.id } )
										}
										allowedTypes={ [ 'image' ] }
										value={ imageId }
										render={ ( { open } ) => (
											<Button variant="secondary" onClick={ open } size="small">
												{ __( 'Replace', 'jetpack-paypal-payments' ) }
											</Button>
										) }
									/>
								</MediaUploadCheck>
								<Button
									variant="link"
									isDestructive
									onClick={ () => setAttributes( { imageUrl: undefined, imageId: undefined } ) }
									size="small"
								>
									{ __( 'Remove', 'jetpack-paypal-payments' ) }
								</Button>
							</div>
						</div>
					) : (
						<MediaUploadCheck>
							<MediaUpload
								onSelect={ media => setAttributes( { imageUrl: media.url, imageId: media.id } ) }
								allowedTypes={ [ 'image' ] }
								value={ imageId }
								render={ ( { open } ) => (
									<Button
										variant="secondary"
										onClick={ open }
										className="jetpack-paypal-payment-buttons__upload-button"
									>
										{ __( 'Upload Image', 'jetpack-paypal-payments' ) }
									</Button>
								) }
							/>
						</MediaUploadCheck>
					) }
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
						help={ adjustableQuantity ? helpQtyOn : helpQtyOff }
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
						help={ taxEnabled ? helpTaxOn : helpTaxOff }
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

				<div className="jetpack-paypal-payment-buttons__button-appearance">
					<h4 className="jetpack-paypal-payment-buttons__section-heading">
						{ __( 'Button Appearance', 'jetpack-paypal-payments' ) }
					</h4>
					<SelectControl
						label={ __( 'Payment Methods', 'jetpack-paypal-payments' ) }
						value={ buttonType }
						options={ BUTTON_TYPE_OPTIONS }
						onChange={ value => setAttributes( { buttonType: value } ) }
						disabled={ isCreating }
					/>
					<TextControl
						label={ __( 'Button Text', 'jetpack-paypal-payments' ) }
						value={ buttonText || '' }
						onChange={ value => setAttributes( { buttonText: value } ) }
						disabled={ isCreating }
					/>
					<ToggleControl
						label={ __( 'Show QR code', 'jetpack-paypal-payments' ) }
						help={ __(
							'Display a QR code below the button for in-person sharing.',
							'jetpack-paypal-payments'
						) }
						checked={ attributes.showQrCode !== false }
						onChange={ value => setAttributes( { showQrCode: value } ) }
						disabled={ isCreating }
					/>
				</div>

				<div className="jetpack-paypal-payment-buttons__form-actions">
					<Button
						variant="primary"
						onClick={ hasButton ? handleUpdateButton : handleCreateButton }
						isBusy={ isCreating }
						disabled={ isCreating || ! isFormValid }
					>
						{ isCreating && __( 'Saving…', 'jetpack-paypal-payments' ) }
						{ ! isCreating && hasButton && __( 'Update Button', 'jetpack-paypal-payments' ) }
						{ ! isCreating && ! hasButton && __( 'Create Button', 'jetpack-paypal-payments' ) }
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
