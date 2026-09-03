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
	store as blockEditorStore,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	Button,
	ButtonGroup,
	Notice,
	PanelBody,
	SelectControl,
	Spinner,
	TextControl,
	TextareaControl,
	ToggleControl,
	ToolbarButton,
	ToolbarGroup,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis -- Experimental API; stable ConfirmDialog not yet exported by @wordpress/components.
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState, useEffect, useCallback, useMemo, useRef } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { API_BASE } from './api-base';
import metadata from './block.json';
import { SUPPORTED_CURRENCIES, VALID_CURRENCY_CODES } from './currencies';
import { getPriceStep } from './currency-symbols';
import FormatSwitcher, { FORMAT_OPTIONS } from './format-switcher';
import PayPalButtonPreview from './paypal-button-preview';
import { broadcastConnectionChange, usePayPalConnection } from './paypal-connection';
import { paypalLogoSvg } from './paypal-full-logo';
import { ONBOARDING_SANDBOX } from './paypal-partner-sdk';
import { getResourceAttributeUpdates } from './resource-sync';
import {
	validatePrice,
	validateProductName,
	validateDescription,
	getUserFriendlyError,
	MAX_NAME_LENGTH,
	MAX_DESCRIPTION_LENGTH,
} from './validation';
import VariantBuilder, { hasVariantPricing, validateVariants } from './variant-builder';

// Button type is always 'single' — the hosted payment page handles
// payment method selection (PayPal, cards, wallets, etc.).

/**
 * PayPal Payment Buttons edit component.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Block attributes.
 * @param {Function} props.setAttributes - Function to update block attributes.
 * @param {string}   props.clientId      - The block's client ID (not the PayPal one).
 * @return {Element} Block editor UI.
 */
export default function PayPalPaymentButtonsEdit( {
	attributes,
	setAttributes,
	clientId: blockClientId,
} ) {
	const {
		colorScheme,
		isApiManaged,
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
		format,
	} = attributes;

	// Normalize — old blocks without the attribute default to BUTTON.
	const activeFormat = format || 'BUTTON';

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
	const labelConnected = __( 'PayPal Connected', 'jetpack-paypal-payments' );
	const labelDisconnected = __( 'PayPal Disconnected', 'jetpack-paypal-payments' );
	const labelPrice = __( 'Price', 'jetpack-paypal-payments' );
	const labelPriceOptional = __( 'Price (not used)', 'jetpack-paypal-payments' );
	const helpPriceFromOptions = __(
		'Each product option sets its own price, so this value is ignored.',
		'jetpack-paypal-payments'
	);

	// PayPal rejects any decimal in JPY, HUF and TWD, so the input must not offer one.
	const priceStep = getPriceStep( currencyCode || 'USD' );
	const pricePlaceholder = priceStep === '1' ? '1500' : '29.99';

	const {
		isConnected,
		setIsConnected,
		environment,
		setEnvironment,
		connectionLoading,
		partnerAttributionId,
		showReconnect,
		setShowReconnect,
		signupUrl,
		setOnboardingRequested,
		isOverlayOpen,
		isOpeningPayPal,
		setFrameNode,
		clientId,
		clientSecret,
		connectError,
		setConnectError,
		connectErrorDismissed,
		setConnectErrorDismissed,
		isConnecting,
		isCompletingOnboarding,
		wizardStep,
		setWizardStep,
		showSecretField,
		setShowSecretField,
		partnerReferralsAvailable,
		handleClientIdChange,
		handleClientSecretChange,
		clientIdWarning,
		handleConnect,
		fetchSignupLink,
		cancelOnboarding,
	} = usePayPalConnection();

	// Form state.
	const [ isCreating, setIsCreating ] = useState( false );
	const [ error, setError ] = useState( null );
	const [ successMessage, setSuccessMessage ] = useState( null );

	// Confirmation dialog state for destructive actions.
	const [ showDeleteConfirm, setShowDeleteConfirm ] = useState( false );
	const [ showDisconnectConfirm, setShowDisconnectConfirm ] = useState( false );

	// Edit/preview mode toggle. Start in preview if button already exists.
	const [ isEditing, setIsEditing ] = useState( ! ( isApiManaged && resourceId && paymentLink ) );

	// Pre-compute "Connect with PayPal" button label to avoid nested ternary.
	const labelConnectWithPayPal = __( 'Connect with PayPal', 'jetpack-paypal-payments' );
	const labelCompletingSetup = __( 'Completing setup\u2026', 'jetpack-paypal-payments' );
	let connectWithPayPalLabel = labelConnectWithPayPal;
	if ( isOpeningPayPal ) {
		connectWithPayPalLabel = labelConnecting;
	} else if ( isCompletingOnboarding ) {
		connectWithPayPalLabel = labelCompletingSetup;
	}

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
	 * Whether the options group carries its own per-option prices.
	 *
	 * PayPal rejects a request with `unit_amount` at both the product and the
	 * variant level, so per-option prices replace the product-level price
	 * rather than sitting alongside it.
	 */
	const usesVariantPricing = useMemo(
		() => hasVariantPricing( variantsEnabled, variants ),
		[ variantsEnabled, variants ]
	);

	/**
	 * Compute validation errors for all form fields.
	 * Memoized to avoid re-computing on every render.
	 */
	const validationErrors = useMemo(
		() => ( {
			productName: validateProductName( productName ),
			// The product price is only required when the options aren't priced
			// individually. A stray value is still validated so it can't be sent
			// half-formed if the merchant clears the per-option prices later.
			price: usesVariantPricing && ! price ? null : validatePrice( price, currencyCode || 'USD' ),
			productDescription: validateDescription( productDescription ),
			currencyCode:
				currencyCode && ! VALID_CURRENCY_CODES.has( currencyCode )
					? __( 'Unsupported currency.', 'jetpack-paypal-payments' )
					: null,
		} ),
		[ productName, price, productDescription, currencyCode, usesVariantPricing ]
	);

	/**
	 * Variant validation errors (empty array if valid or disabled).
	 */
	const variantErrors = useMemo(
		() => validateVariants( variantsEnabled, variants, currencyCode || 'USD' ),
		[ variantsEnabled, variants, currencyCode ]
	);

	/**
	 * Whether the form is valid (no validation errors on required fields or variants).
	 */
	const isFormValid =
		! validationErrors.productName &&
		! validationErrors.price &&
		! validationErrors.productDescription &&
		! validationErrors.currencyCode &&
		variantErrors.length === 0;

	// Two blocks can share one PayPal payment — a duplicate, or one product
	// shown as a button, a link and a QR code — and only the block that saved
	// last has seen what PayPal holds. Read it back so every block agrees.
	const { __unstableMarkNextChangeAsNotPersistent } = useDispatch( blockEditorStore );
	const latestAttributes = useRef( attributes );
	latestAttributes.current = attributes;

	useEffect( () => {
		if ( ! isConnected || ! isApiManaged || ! resourceId ) {
			return;
		}

		let cancelled = false;

		apiFetch( { path: `${ API_BASE }/buttons/${ resourceId }` } )
			.then( response => {
				if ( cancelled || ! response?.attributes ) {
					return;
				}
				const updates = getResourceAttributeUpdates(
					latestAttributes.current,
					response.attributes
				);
				if ( ! Object.keys( updates ).length ) {
					return;
				}
				// Opening a post must not mark it dirty.
				__unstableMarkNextChangeAsNotPersistent?.();
				setAttributes( updates );
			} )
			// A payment deleted on PayPal is re-created when the merchant next saves the block.
			.catch( () => {} );

		return () => {
			cancelled = true;
		};
	}, [
		isConnected,
		isApiManaged,
		resourceId,
		setAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	] );

	// Other blocks on this page pointing at the same PayPal payment.
	const sharedResourceCount = useSelect(
		select => {
			if ( ! resourceId || ! blockClientId ) {
				return 0;
			}
			const { getClientIdsWithDescendants, getBlockName, getBlockAttributes } =
				select( blockEditorStore );
			return getClientIdsWithDescendants().filter(
				id =>
					id !== blockClientId &&
					getBlockName( id ) === metadata.name &&
					getBlockAttributes( id )?.resourceId === resourceId
			).length;
		},
		[ blockClientId, resourceId ]
	);

	/**
	 * Handle PayPal disconnect with confirmation.
	 * Triggers a ConfirmDialog — actual disconnect runs in executeDisconnect().
	 */
	const handleDisconnect = useCallback( () => {
		setShowDisconnectConfirm( true );
	}, [] );

	/**
	 * Execute the PayPal disconnect after the user confirms.
	 */
	const executeDisconnect = useCallback( () => {
		setShowDisconnectConfirm( false );

		const doDisconnect = () => {
			setIsConnected( false );
			setWizardStep( 'welcome' );
			setShowReconnect( false );
			broadcastConnectionChange( false );
			// Clear block attributes so the block shows the connect wizard.
			setAttributes( {
				isApiManaged: false,
				resourceId: '',
				paymentLink: '',
				productName: '',
				price: '',
				productDescription: '',
				imageUrl: undefined,
				imageId: undefined,
				returnUrl: '',
				variantsEnabled: false,
				variants: null,
				currencyCode: 'USD',
			} );
			setSuccessMessage( __( 'PayPal account disconnected.', 'jetpack-paypal-payments' ) );
		};

		apiFetch( {
			path: `${ API_BASE }/disconnect`,
			method: 'POST',
		} )
			.then( doDisconnect )
			.catch( doDisconnect ); // Still disconnect locally if API fails.
	}, [ setAttributes, setIsConnected, setShowReconnect, setWizardStep ] );

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
					// PayPal errors with "unit_amount is specified at both product
					// level and variant level" when both are present, so the
					// product-level amount is dropped once options are priced.
					...( usesVariantPricing
						? {}
						: {
								unit_amount: {
									currency_code: currencyCode || 'USD',
									value: price,
								},
						  } ),
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
			usesVariantPricing,
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
	 * Request delete confirmation via ConfirmDialog.
	 * Actual deletion runs in executeDeleteButton().
	 */
	const handleDeleteButton = useCallback( () => {
		if ( ! resourceId ) {
			return;
		}
		setShowDeleteConfirm( true );
	}, [ resourceId ] );

	/**
	 * Execute the button deletion after the user confirms.
	 */
	const executeDeleteButton = useCallback( () => {
		setShowDeleteConfirm( false );
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

	// The welcome step is all Partner Referrals, and wizardStep can still say
	// 'welcome' after a failed connection check or a disconnect.
	const visibleStep =
		wizardStep === 'welcome' && ! partnerReferralsAvailable ? 'dashboard' : wizardStep;

	// Loading state while checking connection.
	if ( connectionLoading ) {
		return (
			<div { ...blockProps } data-color-scheme={ colorScheme || 'auto' }>
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
			<div { ...blockProps } data-color-scheme={ colorScheme || 'auto' }>
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

	/*
	 * No src: the frame keeps its initial document, which the effect above writes
	 * the link and SDK into. Pointing src at about:blank navigates over that
	 * write and leaves the frame empty.
	 */
	const onboardingFrame = signupUrl ? (
		<>
			{ /* Only while the overlay is up: the frame is mounted hidden long
			     before anyone clicks Connect, and a close button in the tab
			     order then has nothing to close. */ }
			{ isOverlayOpen && (
				<Button
					className="jetpack-paypal-onboarding-frame__close"
					variant="secondary"
					aria-label={ __( 'Close PayPal onboarding', 'jetpack-paypal-payments' ) }
					onClick={ cancelOnboarding }
				>
					{ __( 'Close', 'jetpack-paypal-payments' ) }
				</Button>
			) }
			<iframe
				ref={ setFrameNode }
				title={ __( 'PayPal onboarding', 'jetpack-paypal-payments' ) }
				sandbox={ ONBOARDING_SANDBOX }
				className={
					'jetpack-paypal-onboarding-frame' +
					( isOverlayOpen ? ' jetpack-paypal-onboarding-frame--active' : '' )
				}
			/>
		</>
	) : null;

	// Not connected — show the guided connection wizard. A block that already
	// holds a saved button keeps showing its preview instead (e.g. demo posts in
	// Playground, or a button created before the site was disconnected), unless
	// the merchant explicitly asked to reconnect.
	if ( ! isConnected && ( ! hasButton || showReconnect ) ) {
		return (
			<div { ...blockProps } data-color-scheme={ colorScheme || 'auto' }>
				<div className="jetpack-paypal-payment-buttons__connect">
					{ /* Reconnecting from a block that still holds a button — let the
					     merchant back out to its preview without connecting. */ }
					{ showReconnect && (
						<div className="jetpack-paypal-payment-buttons__reconnect-header">
							<Button variant="tertiary" onClick={ () => setShowReconnect( false ) }>
								{ __( 'Cancel', 'jetpack-paypal-payments' ) }
							</Button>
						</div>
					) }

					{ /* Step indicator */ }
					{ visibleStep !== 'welcome' && visibleStep !== 'success' && (
						<div
							className="jetpack-paypal-wizard__step-indicator"
							role="list"
							aria-label={ __( 'Setup progress', 'jetpack-paypal-payments' ) }
						>
							<span
								role="listitem"
								aria-current={ visibleStep === 'dashboard' ? 'step' : undefined }
								className={ `jetpack-paypal-wizard__step ${
									visibleStep === 'dashboard' || visibleStep === 'credentials' ? 'is-active' : ''
								}` }
							>
								{ '1' }
							</span>
							<span className="jetpack-paypal-wizard__step-line" aria-hidden="true" />
							<span
								role="listitem"
								aria-current={ visibleStep === 'credentials' ? 'step' : undefined }
								className={ `jetpack-paypal-wizard__step ${
									visibleStep === 'credentials' ? 'is-active' : ''
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

					{ /* Step 1: Welcome — Partner Referrals primary, manual credentials secondary */ }
					{ visibleStep === 'welcome' && (
						<div className="jetpack-paypal-wizard__welcome">
							{ paypalLogoSvg }
							<h3>{ __( 'Connect PayPal', 'jetpack-paypal-payments' ) }</h3>
							<p>
								{ __(
									'Accept payments with PayPal by connecting your PayPal account.',
									'jetpack-paypal-payments'
								) }
							</p>
							<div className="jetpack-paypal-wizard__env-toggle">
								<ToggleControl
									label={ __( 'Use sandbox (testing)', 'jetpack-paypal-payments' ) }
									checked={ environment === 'sandbox' }
									onChange={ checked => setEnvironment( checked ? 'sandbox' : 'production' ) }
								/>
							</div>
							<div className="jetpack-paypal-wizard__actions">
								<Button
									variant="primary"
									onClick={ () => {
										// A frame built after the click misses that click's user
										// activation, so PayPal's window.open inside it is
										// popup-blocked. Fetch the referral and stop; that
										// builds the frame for the next click to activate.
										if ( ! signupUrl ) {
											fetchSignupLink();
											return;
										}

										setOnboardingRequested( true );
									} }
									isBusy={ isOpeningPayPal || isCompletingOnboarding }
									disabled={ isOpeningPayPal || isCompletingOnboarding }
								>
									{ connectWithPayPalLabel }
								</Button>
							</div>
							{ connectError && ! connectErrorDismissed && (
								<Notice
									status="error"
									isDismissible
									onDismiss={ () => setConnectErrorDismissed( true ) }
								>
									{ connectError }
								</Notice>
							) }
							<p className="jetpack-paypal-wizard__hint">
								<Button variant="link" onClick={ () => setWizardStep( 'dashboard' ) }>
									{ __( 'Or enter your API credentials manually', 'jetpack-paypal-payments' ) }
								</Button>
							</p>
						</div>
					) }

					{ /* Step 2: Open PayPal Dashboard */ }
					{ visibleStep === 'dashboard' && (
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
									href={ `https://developer.paypal.com/dashboard/applications/${
										environment === 'sandbox' ? 'sandbox' : 'live'
									}` }
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
							{ partnerReferralsAvailable && (
								<div className="jetpack-paypal-wizard__nav">
									<Button variant="link" onClick={ () => setWizardStep( 'welcome' ) }>
										{ __( '← Back', 'jetpack-paypal-payments' ) }
									</Button>
								</div>
							) }
						</div>
					) }

					{ /* Step 3: Enter Credentials */ }
					{ visibleStep === 'credentials' && (
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
					{ visibleStep === 'success' && (
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
				{ onboardingFrame }
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
			<ToolbarGroup>
				<ToolbarButton
					icon="trash"
					label={ __( 'Delete Payment Button', 'jetpack-paypal-payments' ) }
					onClick={ handleDeleteButton }
					disabled={ isCreating || ! isConnected }
					isDestructive
				/>
			</ToolbarGroup>
		</BlockControls>
	) : null;

	// Inspector sidebar — format switcher, Style preset, and connection info.
	const inspectorControls = (
		<InspectorControls>
			{ /* Style preset: Light / Auto / Dark — overrides the OS/theme auto-detect */ }
			<PanelBody title={ __( 'Style', 'jetpack-paypal-payments' ) } initialOpen={ true }>
				<p className="jetpack-paypal-payment-buttons__scheme-label">
					{ __(
						'Choose how the button adapts to your site theme. "Auto" follows the visitor\'s OS preference.',
						'jetpack-paypal-payments'
					) }
				</p>
				<ButtonGroup className="jetpack-paypal-payment-buttons__scheme-toggle">
					<Button
						variant={ colorScheme === 'light' ? 'primary' : 'secondary' }
						aria-pressed={ colorScheme === 'light' }
						onClick={ () => setAttributes( { colorScheme: 'light' } ) }
					>
						{ __( 'Light', 'jetpack-paypal-payments' ) }
					</Button>
					<Button
						variant={ colorScheme === 'auto' || ! colorScheme ? 'primary' : 'secondary' }
						aria-pressed={ colorScheme === 'auto' || ! colorScheme }
						onClick={ () => setAttributes( { colorScheme: 'auto' } ) }
					>
						{ __( 'Auto', 'jetpack-paypal-payments' ) }
					</Button>
					<Button
						variant={ colorScheme === 'dark' ? 'primary' : 'secondary' }
						aria-pressed={ colorScheme === 'dark' }
						onClick={ () => setAttributes( { colorScheme: 'dark' } ) }
					>
						{ __( 'Dark', 'jetpack-paypal-payments' ) }
					</Button>
				</ButtonGroup>
				<p className="jetpack-paypal-payment-buttons__scheme-hint">
					{ __(
						'For advanced styling, target .wp-block-jetpack-paypal-payment-buttons or use data-color-scheme="light|dark|auto" in custom CSS.',
						'jetpack-paypal-payments'
					) }
				</p>
			</PanelBody>

			{ hasButton && (
				<PanelBody title={ __( 'Display Format', 'jetpack-paypal-payments' ) } initialOpen={ true }>
					<FormatSwitcher
						value={ activeFormat }
						onChange={ value => setAttributes( { format: value } ) }
						disabled={ isCreating }
					/>
				</PanelBody>
			) }

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
							disabled={ isCreating || ! isConnected }
						>
							{ __( 'Delete Button', 'jetpack-paypal-payments' ) }
						</Button>
						{ isConnected ? (
							<Button variant="secondary" isDestructive onClick={ handleDisconnect }>
								{ __( 'Disconnect', 'jetpack-paypal-payments' ) }
							</Button>
						) : (
							<Button variant="secondary" onClick={ () => setShowReconnect( true ) }>
								{ __( 'Reconnect', 'jetpack-paypal-payments' ) }
							</Button>
						) }
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
					{ isConnected ? (
						<Button variant="secondary" isDestructive onClick={ handleDisconnect }>
							{ __( 'Disconnect PayPal', 'jetpack-paypal-payments' ) }
						</Button>
					) : (
						<Button variant="secondary" onClick={ () => setShowReconnect( true ) }>
							{ __( 'Reconnect PayPal', 'jetpack-paypal-payments' ) }
						</Button>
					) }
				</PanelBody>
			) }
		</InspectorControls>
	);

	// Shared confirmation dialogs — extracted so they render regardless of which return branch is active.
	const confirmDialogs = (
		<>
			{ showDeleteConfirm && (
				<ConfirmDialog
					title={ __( 'Delete Payment Button', 'jetpack-paypal-payments' ) }
					confirmButtonText={ __( 'Delete Permanently', 'jetpack-paypal-payments' ) }
					onConfirm={ executeDeleteButton }
					onCancel={ () => setShowDeleteConfirm( false ) }
				>
					{ __(
						'This will permanently delete your payment button. Any links, QR codes, or embedded buttons using this payment will stop working and cannot be recovered.',
						'jetpack-paypal-payments'
					) }
				</ConfirmDialog>
			) }
			{ showDisconnectConfirm && (
				<ConfirmDialog
					title={ __( 'Disconnect PayPal Account', 'jetpack-paypal-payments' ) }
					confirmButtonText={ __( 'Disconnect', 'jetpack-paypal-payments' ) }
					onConfirm={ executeDisconnect }
					onCancel={ () => setShowDisconnectConfirm( false ) }
				>
					<div className="jetpack-paypal-payment-buttons__confirm-body">
						<p>
							{ __(
								'This disconnects PayPal for the whole site, not just this block.',
								'jetpack-paypal-payments'
							) }
						</p>
						<ul>
							<li>
								{ __(
									'Every payment button on this site will need PayPal reconnected before it can be edited or deleted.',
									'jetpack-paypal-payments'
								) }
							</li>
							<li>
								{ __(
									'Buttons you have already published keep working for buyers.',
									'jetpack-paypal-payments'
								) }
							</li>
						</ul>
					</div>
				</ConfirmDialog>
			) }
		</>
	);

	const formatLabel = FORMAT_OPTIONS.find( o => o.value === activeFormat )?.label || activeFormat;

	// The PayPal connection is site-wide, so a block can still hold a working
	// button after the account was disconnected — from this post, another post,
	// or the admin. The button keeps paying out; only editing it needs the
	// connection back, so say so instead of failing on save.
	const disconnectedNotice = ! isConnected ? (
		<Notice
			status="warning"
			isDismissible={ false }
			actions={ [
				{
					label: __( 'Reconnect PayPal', 'jetpack-paypal-payments' ),
					onClick: () => setShowReconnect( true ),
					variant: 'primary',
				},
			] }
		>
			{ __(
				'Your PayPal account is disconnected. This payment link still works for buyers, but you need to reconnect before you can edit or delete it.',
				'jetpack-paypal-payments'
			) }
		</Notice>
	) : null;

	const sharedResourceMessage = sprintf(
		/* translators: %d: number of other blocks on this page using the same PayPal payment */
		_n(
			'%d other block on this page uses this PayPal payment. Changing the product or price here changes it there too. To sell something different, add a new block and create a new payment.',
			'%d other blocks on this page use this PayPal payment. Changing the product or price here changes it there too. To sell something different, add a new block and create a new payment.',
			sharedResourceCount,
			'jetpack-paypal-payments'
		),
		sharedResourceCount
	);
	const sharedResourceNotice =
		sharedResourceCount > 0 ? (
			<Notice status="info" isDismissible={ false }>
				{ sharedResourceMessage }
			</Notice>
		) : null;

	const connectionStatus = (
		<span
			className={ `jetpack-paypal-payment-buttons__status-dot ${
				isConnected
					? 'jetpack-paypal-payment-buttons__status-dot--connected'
					: 'jetpack-paypal-payment-buttons__status-dot--disconnected'
			}` }
		/>
	);

	const connectionLabel = isConnected ? labelConnected : labelDisconnected;

	// Connected + has button + preview mode — show live button preview.
	if ( hasButton && ! isEditing ) {
		return (
			<div { ...blockProps } data-color-scheme={ colorScheme || 'auto' }>
				{ toolbarControls }
				{ inspectorControls }

				<div className="jetpack-paypal-payment-buttons__preview">
					<div className="jetpack-paypal-payment-buttons__preview-status">
						{ connectionStatus }
						{ connectionLabel }
						<span className="jetpack-paypal-payment-buttons__format-badge">
							{ sprintf(
								/* translators: %s: format label (Button, Link, or QR Code) */
								__( 'Format: %s', 'jetpack-paypal-payments' ),
								formatLabel
							) }
						</span>
						{ environment === 'sandbox' && (
							<span className="jetpack-paypal-payment-buttons__sandbox-badge">
								{ __( 'Sandbox', 'jetpack-paypal-payments' ) }
							</span>
						) }
					</div>

					{ disconnectedNotice }
					{ sharedResourceNotice }

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
						productName={ productName }
						price={ price }
						currencyCode={ currencyCode }
						productDescription={ productDescription }
						paymentLink={ paymentLink }
						variantsEnabled={ variantsEnabled }
						variants={ variants }
						imageUrl={ imageUrl }
						partnerAttributionId={ partnerAttributionId }
					/>
				</div>

				{ confirmDialogs }
			</div>
		);
	}

	// Connected — edit mode (either creating new or editing existing).
	return (
		<div { ...blockProps } data-color-scheme={ colorScheme || 'auto' }>
			{ toolbarControls }
			{ inspectorControls }

			<div className="jetpack-paypal-payment-buttons__create-form">
				<div className="jetpack-paypal-payment-buttons__preview-status">
					{ connectionStatus }
					{ connectionLabel }
					{ environment === 'sandbox' && (
						<span className="jetpack-paypal-payment-buttons__sandbox-badge">
							{ __( 'Sandbox', 'jetpack-paypal-payments' ) }
						</span>
					) }
				</div>

				{ disconnectedNotice }
				{ sharedResourceNotice }

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
							label={ usesVariantPricing ? labelPriceOptional : labelPrice }
							value={ price || '' }
							onChange={ value => setAttributes( { price: value } ) }
							onBlur={ () => markTouched( 'price' ) }
							disabled={ isCreating }
							type="number"
							min={ priceStep }
							step={ priceStep }
							placeholder={ pricePlaceholder }
							help={
								touchedFields.price && validationErrors.price
									? validationErrors.price
									: ( usesVariantPricing && helpPriceFromOptions ) || undefined
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

				<div className="jetpack-paypal-payment-buttons__format-section">
					<h4 className="jetpack-paypal-payment-buttons__section-heading">
						{ __( 'Display Format', 'jetpack-paypal-payments' ) }
					</h4>
					<FormatSwitcher
						value={ activeFormat }
						onChange={ value => setAttributes( { format: value } ) }
						disabled={ isCreating }
					/>
				</div>

				<div className="jetpack-paypal-payment-buttons__form-actions">
					<Button
						variant="primary"
						onClick={ hasButton ? handleUpdateButton : handleCreateButton }
						isBusy={ isCreating }
						disabled={ isCreating || ! isFormValid || ! isConnected }
					>
						{ isCreating && __( 'Saving…', 'jetpack-paypal-payments' ) }
						{ ! isCreating &&
							hasButton &&
							activeFormat === 'LINK' &&
							__( 'Update Link', 'jetpack-paypal-payments' ) }
						{ ! isCreating &&
							hasButton &&
							activeFormat === 'QR' &&
							__( 'Update QR Code', 'jetpack-paypal-payments' ) }
						{ ! isCreating &&
							hasButton &&
							activeFormat === 'BUTTON' &&
							__( 'Update Button', 'jetpack-paypal-payments' ) }
						{ ! isCreating &&
							! hasButton &&
							activeFormat === 'LINK' &&
							__( 'Create Link', 'jetpack-paypal-payments' ) }
						{ ! isCreating &&
							! hasButton &&
							activeFormat === 'QR' &&
							__( 'Create QR Code', 'jetpack-paypal-payments' ) }
						{ ! isCreating &&
							! hasButton &&
							activeFormat === 'BUTTON' &&
							__( 'Create Button', 'jetpack-paypal-payments' ) }
					</Button>

					<Button
						variant="tertiary"
						onClick={ () => {
							if ( hasButton ) {
								// Return to preview — discard unsaved edits.
								setIsEditing( false );
								setTouchedFields( {} );
							} else {
								// No saved button yet — reset form fields so merchant can
								// remove the block if they want.
								setAttributes( {
									productName: metadata.attributes.productName.default,
									price: metadata.attributes.price.default,
									currencyCode: metadata.attributes.currencyCode.default,
									productDescription: metadata.attributes.productDescription.default,
									imageUrl: undefined,
									imageId: undefined,
									returnUrl: metadata.attributes.returnUrl.default,
									variantsEnabled: metadata.attributes.variantsEnabled.default,
									variants: undefined,
									adjustableQuantity: metadata.attributes.adjustableQuantity.default,
									maxQuantity: metadata.attributes.maxQuantity.default,
									customerNotes: metadata.attributes.customerNotes.default,
									taxEnabled: metadata.attributes.taxEnabled.default,
									taxType: metadata.attributes.taxType.default,
									taxName: metadata.attributes.taxName.default,
									taxValue: metadata.attributes.taxValue.default,
									buttonText: metadata.attributes.buttonText.default,
									showQrCode: metadata.attributes.showQrCode.default,
								} );
								setTouchedFields( {} );
								setError( null );
							}
						} }
						disabled={ isCreating }
					>
						{ __( 'Cancel', 'jetpack-paypal-payments' ) }
					</Button>
				</div>
			</div>

			{ confirmDialogs }
		</div>
	);
}
