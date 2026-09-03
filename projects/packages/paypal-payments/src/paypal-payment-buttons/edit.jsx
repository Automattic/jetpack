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
	store as blockEditorStore,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	Notice,
	PanelBody,
	Spinner,
	TextControl,
	ToolbarButton,
	ToolbarGroup,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis -- Experimental API; stable ConfirmDialog not yet exported by @wordpress/components.
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState, useCallback, useMemo } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { API_BASE } from './api-base';
import BlockInspector from './block-inspector';
import metadata from './block.json';
import ConnectionWizard from './connection-wizard';
import { VALID_CURRENCY_CODES } from './currencies';
import { FORMAT_OPTIONS } from './format-switcher';
import PayPalButtonPreview from './paypal-button-preview';
import ProductForm from './product-form';
import { broadcastConnectionChange, usePayPalConnection } from './use-paypal-connection';
import { usePayPalResource } from './use-paypal-resource';
import { validatePrice, validateProductName, validateDescription } from './validation';
import { hasVariantPricing, validateVariants } from './variant-builder';

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
	const labelConnected = __( 'PayPal Connected', 'jetpack-paypal-payments' );
	const labelDisconnected = __( 'PayPal Disconnected', 'jetpack-paypal-payments' );

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
		<BlockInspector
			setAttributes={ setAttributes }
			colorScheme={ colorScheme }
			resourceId={ resourceId }
			activeFormat={ activeFormat }
			isConnected={ isConnected }
			environment={ environment }
			setShowReconnect={ setShowReconnect }
			isCreating={ isCreating }
			handleDeleteButton={ handleDeleteButton }
			handleDisconnect={ handleDisconnect }
			hasButton={ hasButton }
		/>
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

			<ProductForm
				attributes={ attributes }
				setAttributes={ setAttributes }
				buttonText={ buttonText }
				productName={ productName }
				price={ price }
				currencyCode={ currencyCode }
				productDescription={ productDescription }
				imageUrl={ imageUrl }
				imageId={ imageId }
				returnUrl={ returnUrl }
				variantsEnabled={ variantsEnabled }
				variants={ variants }
				adjustableQuantity={ adjustableQuantity }
				maxQuantity={ maxQuantity }
				customerNotes={ customerNotes }
				taxEnabled={ taxEnabled }
				taxType={ taxType }
				taxName={ taxName }
				taxValue={ taxValue }
				activeFormat={ activeFormat }
				isConnected={ isConnected }
				environment={ environment }
				setIsEditing={ setIsEditing }
				touchedFields={ touchedFields }
				setTouchedFields={ setTouchedFields }
				markTouched={ markTouched }
				usesVariantPricing={ usesVariantPricing }
				validationErrors={ validationErrors }
				isFormValid={ isFormValid }
				isCreating={ isCreating }
				error={ error }
				setError={ setError }
				successMessage={ successMessage }
				setSuccessMessage={ setSuccessMessage }
				handleCreateButton={ handleCreateButton }
				handleUpdateButton={ handleUpdateButton }
				hasButton={ hasButton }
				disconnectedNotice={ disconnectedNotice }
				sharedResourceNotice={ sharedResourceNotice }
				connectionStatus={ connectionStatus }
				connectionLabel={ connectionLabel }
			/>

			{ confirmDialogs }
		</div>
	);
}
