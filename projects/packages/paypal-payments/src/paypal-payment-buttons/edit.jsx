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
import { useSelect } from '@wordpress/data';
import { useState, useCallback, useMemo } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { API_BASE } from './api-base';
import metadata from './block.json';
import ConnectionWizard from './connection-wizard';
import { SUPPORTED_CURRENCIES, VALID_CURRENCY_CODES } from './currencies';
import { getPriceStep } from './currency-symbols';
import FormatSwitcher, { FORMAT_OPTIONS } from './format-switcher';
import PayPalButtonPreview from './paypal-button-preview';
import { broadcastConnectionChange, usePayPalConnection } from './use-paypal-connection';
import { usePayPalResource } from './use-paypal-resource';
import {
	validatePrice,
	validateProductName,
	validateDescription,
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

	// Confirmation dialog state for destructive actions.
	const [ showDeleteConfirm, setShowDeleteConfirm ] = useState( false );
	const [ showDisconnectConfirm, setShowDisconnectConfirm ] = useState( false );

	// Edit/preview mode toggle. Start in preview if button already exists.
	const [ isEditing, setIsEditing ] = useState( ! ( isApiManaged && resourceId && paymentLink ) );

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

	const {
		isCreating,
		error,
		setError,
		successMessage,
		setSuccessMessage,
		handleCreateButton,
		handleUpdateButton,
		handleDeleteButton,
		executeDeleteButton,
	} = usePayPalResource( {
		attributes,
		setAttributes,
		isConnected,
		usesVariantPricing,
		isFormValid,
		setIsEditing,
		setTouchedFields,
		setShowDeleteConfirm,
	} );

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
	}, [ setAttributes, setIsConnected, setShowReconnect, setSuccessMessage, setWizardStep ] );

	/**
	 * Whether the block has a created button to preview.
	 */
	const hasButton = isApiManaged && resourceId && paymentLink;

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

	// Not connected — show the guided connection wizard. A block that already
	// holds a saved button keeps showing its preview instead (e.g. demo posts in
	// Playground, or a button created before the site was disconnected), unless
	// the merchant explicitly asked to reconnect.
	if ( ! isConnected && ( ! hasButton || showReconnect ) ) {
		return (
			<div { ...blockProps } data-color-scheme={ colorScheme || 'auto' }>
				<ConnectionWizard
					setIsConnected={ setIsConnected }
					environment={ environment }
					setEnvironment={ setEnvironment }
					showReconnect={ showReconnect }
					setShowReconnect={ setShowReconnect }
					signupUrl={ signupUrl }
					setOnboardingRequested={ setOnboardingRequested }
					isOverlayOpen={ isOverlayOpen }
					isOpeningPayPal={ isOpeningPayPal }
					setFrameNode={ setFrameNode }
					clientId={ clientId }
					clientSecret={ clientSecret }
					connectError={ connectError }
					setConnectError={ setConnectError }
					connectErrorDismissed={ connectErrorDismissed }
					setConnectErrorDismissed={ setConnectErrorDismissed }
					isConnecting={ isConnecting }
					isCompletingOnboarding={ isCompletingOnboarding }
					wizardStep={ wizardStep }
					setWizardStep={ setWizardStep }
					showSecretField={ showSecretField }
					setShowSecretField={ setShowSecretField }
					partnerReferralsAvailable={ partnerReferralsAvailable }
					handleClientIdChange={ handleClientIdChange }
					handleClientSecretChange={ handleClientSecretChange }
					clientIdWarning={ clientIdWarning }
					handleConnect={ handleConnect }
					fetchSignupLink={ fetchSignupLink }
					cancelOnboarding={ cancelOnboarding }
				/>
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
