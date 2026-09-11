/* eslint-disable react/jsx-no-bind */
/**
 * PayPal Payment Buttons — API-managed block editor (V2).
 *
 * When PayPal is connected, merchants fill in product details and create
 * buttons directly in the editor. Shown while the API-managed buttons flag is on.
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
	URLInput,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	BaseControl,
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
import { useState, useCallback, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import ConfirmDialogs from './components/confirm-dialogs';
import ConnectionWizard from './components/connection-wizard';
import PayPalFormatControls from './components/format-controls';
import LegacyBlock from './components/legacy-block';
import PayPalButtonPreview from './components/paypal-button-preview';
import VariantBuilder, { isVariantPricingOn, validateVariants } from './components/variant-builder';
import PayPalInspectorControls from './controls';
import { broadcastConnectionChange, usePayPalConnection } from './hooks/use-paypal-connection';
import { usePayPalResource } from './hooks/use-paypal-resource';
import { API_BASE } from './utils/api-base';
import { SUPPORTED_CURRENCIES } from './utils/currencies';
import { getPricePlaceholder, getPriceStep } from './utils/currency-symbols';
import { withPartnerAttribution } from './utils/partner-attribution';
import {
	getValidationErrors,
	hasBlockingError,
	MAX_CUSTOMER_NOTES,
	MAX_DESCRIPTION_LENGTH,
	MAX_NAME_LENGTH,
} from './utils/validation';

// Button type is always 'single' — the hosted payment page handles
// payment method selection (PayPal, cards, wallets, etc.).

const helpQtyOn = __( 'Customers can buy multiple units at checkout.', 'jetpack-paypal-payments' );
const helpQtyOff = __( 'Fixed at 1 unit per purchase.', 'jetpack-paypal-payments' );
const helpTaxOn = __( 'Tax will be added at PayPal checkout.', 'jetpack-paypal-payments' );
const helpTaxOff = __( 'No tax collected.', 'jetpack-paypal-payments' );

/**
 * API-managed PayPal Payment Buttons edit component.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Block attributes.
 * @param {Function} props.setAttributes - Function to update block attributes.
 * @return {Element} Block editor UI.
 */
export default function ApiManagedEdit( { attributes, setAttributes } ) {
	const {
		isApiManaged,
		scriptSrc,
		hostedButtonId,
		buttonText,
		linkText,
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
		taxValue,
		format,
		qrShowCaption,
		qrCaption,
	} = attributes;

	// Normalize — old blocks without the attribute default to BUTTON.
	const activeFormat = format || 'BUTTON';

	// PayPal rejects any decimal in JPY, HUF and TWD, so the input must not offer one.
	const priceStep = getPriceStep( currencyCode || 'USD' );
	const pricePlaceholder = getPricePlaceholder( currencyCode || 'USD' );

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
	 * Whether per-variant pricing is turned on.
	 *
	 * The product price field goes as soon as the toggle is on, before any option price
	 * is typed. The request itself keys on the prices, in utils/sync-on-save.js.
	 */
	const variantPricingOn = useMemo(
		() => isVariantPricingOn( variantsEnabled, variants ),
		[ variantsEnabled, variants ]
	);

	// PERCENTAGE is the only type that carries a rate, and a missing type counts as one -
	// the request builder sends PERCENTAGE for it. PayPal also accepts FLAT, which this
	// form cannot produce but can be handed by a link created elsewhere.
	const taxIsPercentage = ( taxType || 'PERCENTAGE' ) === 'PERCENTAGE';

	/**
	 * Compute validation errors for all form fields.
	 * Memoized to avoid re-computing on every render.
	 */
	const validationErrors = useMemo(
		() =>
			getValidationErrors( {
				productName,
				price,
				productDescription,
				returnUrl,
				currencyCode,
				variantPricingOn,
				taxEnabled,
				taxIsPercentage,
				taxValue,
			} ),
		[
			productName,
			price,
			productDescription,
			returnUrl,
			currencyCode,
			variantPricingOn,
			taxEnabled,
			taxIsPercentage,
			taxValue,
		]
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
	// The price field only hides while per-variant pricing is on, so seeing it with product
	// options on means the merchant has been in the pricing UI - say what is wrong rather
	// than wait for a blur on a field they never asked for.
	const priceError =
		( touchedFields.price || variantsEnabled ) && validationErrors.price
			? validationErrors.price
			: null;

	const returnUrlError = touchedFields.returnUrl ? validationErrors.returnUrl : null;

	// Derived over the errors rather than listed field by field, so a new one cannot be
	// forgotten here. returnUrl stays out of the gate - a bad one warns and still saves,
	// as it always has - which is what ADVISORY_ERROR_KEYS carries.
	const isFormValid = ! hasBlockingError( validationErrors ) && variantErrors.length === 0;

	const {
		isBusy,
		error,
		setError,
		successMessage,
		setSuccessMessage,
		handleDeleteButton,
		executeDeleteButton,
	} = usePayPalResource( {
		attributes,
		setAttributes,
		isConnected,
		setShowDeleteConfirm,
	} );

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
	const hasButton = !! ( isApiManaged && resourceId && paymentLink );

	// The payment is written with the post, so the sidebar says what the save will do.
	// Three separate calls, not one behind a ternary: the minifier would fold that
	// into a single __() with a non-literal msgid, which the production build rejects.
	let saveStatus = __(
		'Complete the highlighted fields. Until then the button is not sent to PayPal when you save.',
		'jetpack-paypal-payments'
	);
	if ( isFormValid && hasButton ) {
		saveStatus = __(
			'Changes are sent to PayPal when you save the post.',
			'jetpack-paypal-payments'
		);
	}
	if ( isFormValid && ! hasButton ) {
		saveStatus = __(
			'The payment button is created on PayPal when you save or publish the post.',
			'jetpack-paypal-payments'
		);
	}

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
			<LegacyBlock
				setAttributes={ setAttributes }
				buttonText={ buttonText }
				blockProps={ blockProps }
			/>
		);
	}

	// Not connected — show the guided connection wizard. A block that already
	// holds a saved button keeps showing its preview instead (e.g. demo posts in
	// Playground, or a button created before the site was disconnected), unless
	// the merchant explicitly asked to reconnect.
	if ( ! isConnected && ( ! hasButton || showReconnect ) ) {
		return (
			<div { ...blockProps }>
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

	// Toolbar control to delete the payment button.
	const toolbarControls = hasButton ? (
		<BlockControls>
			<ToolbarGroup>
				<ToolbarButton
					icon="trash"
					label={ __( 'Delete Payment Button', 'jetpack-paypal-payments' ) }
					onClick={ handleDeleteButton }
					disabled={ isBusy || ! isConnected }
					isDestructive
				/>
			</ToolbarGroup>
		</BlockControls>
	) : null;

	// Inspector sidebar — Settings holds the connection info;
	// the group="styles" fill adds the Styles tab with Embed as and the format's
	// own controls.
	const inspectorControls = (
		<>
			<PayPalInspectorControls
				resourceId={ resourceId }
				isConnected={ isConnected }
				environment={ environment }
				setShowReconnect={ setShowReconnect }
				isBusy={ isBusy }
				handleDeleteButton={ handleDeleteButton }
				handleDisconnect={ handleDisconnect }
				hasButton={ hasButton }
			/>
			<PayPalFormatControls
				format={ activeFormat }
				attributes={ attributes }
				setAttributes={ setAttributes }
				paymentUrl={ withPartnerAttribution( paymentLink, partnerAttributionId ) }
				disabled={ isBusy }
			/>
		</>
	);

	// Shared confirmation dialogs — extracted so they render regardless of which return branch is active.
	const confirmDialogs = (
		<ConfirmDialogs
			showDeleteConfirm={ showDeleteConfirm }
			setShowDeleteConfirm={ setShowDeleteConfirm }
			showDisconnectConfirm={ showDisconnectConfirm }
			setShowDisconnectConfirm={ setShowDisconnectConfirm }
			executeDeleteButton={ executeDeleteButton }
			executeDisconnect={ executeDisconnect }
		/>
	);

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

	// A payment link can be shared by blocks on any post, so warn whenever there
	// is one. It reads in the inspector rather than on the canvas, which stays a
	// clean preview.
	const sharedResourceNotice = hasButton ? (
		<p className="jetpack-paypal-payment-buttons__shared-link-note">
			{ __(
				'Changes made will apply to all payment buttons with this link.',
				'jetpack-paypal-payments'
			) }
		</p>
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

	return (
		<div { ...blockProps }>
			{ toolbarControls }
			<InspectorControls>
				<div className="jetpack-paypal-payment-buttons__form-actions">
					<Notice status={ isFormValid ? 'info' : 'warning' } isDismissible={ false }>
						{ saveStatus }
					</Notice>
					{ sharedResourceNotice }
				</div>
			</InspectorControls>
			<InspectorControls>
				<PanelBody title={ __( 'Details', 'jetpack-paypal-payments' ) } initialOpen={ true }>
					<TextControl
						label={ __( 'Product Name', 'jetpack-paypal-payments' ) }
						value={ productName || '' }
						onChange={ value => setAttributes( { productName: value } ) }
						onBlur={ () => markTouched( 'productName' ) }
						disabled={ isBusy }
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
							touchedFields.productName && validationErrors.productName
								? 'jetpack-paypal-payment-buttons__has-error'
								: undefined
						}
					/>

					<div className="jetpack-paypal-payment-buttons__price-row">
						{ ! variantPricingOn && (
							<div>
								<TextControl
									label={ __( 'Price', 'jetpack-paypal-payments' ) }
									value={ price || '' }
									onChange={ value => setAttributes( { price: value } ) }
									onBlur={ () => markTouched( 'price' ) }
									disabled={ isBusy }
									type="number"
									min={ priceStep }
									step={ priceStep }
									placeholder={ pricePlaceholder }
									help={ priceError || undefined }
									className={ priceError ? 'jetpack-paypal-payment-buttons__has-error' : undefined }
								/>
							</div>
						) }
						{ /* No touched-gate, for the same reason the tax rate has none: the menu
						     only offers currencies PayPal takes, so a bad one arrived from a
						     paste or an older block and there is no visit coming to wait for. */ }
						<SelectControl
							label={ __( 'Currency', 'jetpack-paypal-payments' ) }
							value={ currencyCode || 'USD' }
							options={ SUPPORTED_CURRENCIES }
							onChange={ value => setAttributes( { currencyCode: value } ) }
							help={ validationErrors.currencyCode || undefined }
							className={
								validationErrors.currencyCode
									? 'jetpack-paypal-payment-buttons__has-error'
									: undefined
							}
						/>
					</div>

					<TextareaControl
						label={ __( 'Description (optional)', 'jetpack-paypal-payments' ) }
						value={ productDescription || '' }
						onChange={ value => setAttributes( { productDescription: value } ) }
						onBlur={ () => markTouched( 'productDescription' ) }
						help={
							touchedFields.productDescription && validationErrors.productDescription ? (
								validationErrors.productDescription
							) : (
								<>
									{ __( 'Shown to customers at checkout.', 'jetpack-paypal-payments' ) }
									<br />
									{ sprintf(
										/* translators: 1: current character count, 2: maximum allowed */
										__( '%1$d / %2$d characters', 'jetpack-paypal-payments' ),
										( productDescription || '' ).length,
										MAX_DESCRIPTION_LENGTH
									) }
								</>
							)
						}
						className={
							touchedFields.productDescription && validationErrors.productDescription
								? 'jetpack-paypal-payment-buttons__has-error'
								: undefined
						}
					/>

					<div className="jetpack-paypal-payment-buttons__image-field">
						<BaseControl.VisualLabel>
							{ __( 'Product Image (optional)', 'jetpack-paypal-payments' ) }
						</BaseControl.VisualLabel>
						{ imageUrl ? (
							<div className="jetpack-paypal-payment-buttons__image-preview">
								<img src={ imageUrl } alt={ productName || '' } />
								{ ! /^https:\/\//i.test( imageUrl ) && (
									<Notice status="warning" isDismissible={ false }>
										{ __(
											'PayPal only shows images served from a public HTTPS address, so this one will not appear at checkout.',
											'jetpack-paypal-payments'
										) }
									</Notice>
								) }
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
				</PanelBody>
				{ /* A closed panel renders no children, so open it when an option needs
				     fixing - otherwise the error is invisible on a saved button. */ }
				<PanelBody
					title={ __( 'Product Options', 'jetpack-paypal-payments' ) }
					initialOpen={ ! hasButton || variantErrors.length > 0 }
				>
					<VariantBuilder
						enabled={ variantsEnabled }
						variants={ variants }
						currencyCode={ currencyCode || 'USD' }
						onChange={ updates => setAttributes( updates ) }
						disabled={ isBusy }
						errors={ variantErrors }
						touched={ touchedFields }
						// A saved button's groups came out of storage already invalid, so
						// there is no blur coming - the same reason the panel opens below.
						showAll={ hasButton }
						onTouch={ markTouched }
					/>
				</PanelBody>
				{ /* Same again for the tax rate. initialOpen, not a controlled `opened`: the
				     panel opens when there is an error, and the merchant can still close it. */ }
				<PanelBody
					title={ __( 'Checkout Options', 'jetpack-paypal-payments' ) }
					initialOpen={ !! validationErrors.taxValue }
				>
					{ /* WOOPTP-170: Adjustable Quantity */ }
					<ToggleControl
						label={ __( 'Allow customers to adjust quantity', 'jetpack-paypal-payments' ) }
						help={ adjustableQuantity ? helpQtyOn : helpQtyOff }
						checked={ adjustableQuantity }
						onChange={ value => setAttributes( { adjustableQuantity: value } ) }
						disabled={ isBusy }
					/>
					{ adjustableQuantity && (
						<TextControl
							label={ __( 'Maximum quantity', 'jetpack-paypal-payments' ) }
							value={ maxQuantity || '' }
							onChange={ value => setAttributes( { maxQuantity: parseInt( value, 10 ) || 10 } ) }
							type="number"
							min={ 2 }
							max={ 999 }
							disabled={ isBusy }
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
						disabled={ isBusy }
					/>
					{ taxEnabled && (
						<>
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
								disabled={ isBusy }
							/>
							{ taxIsPercentage && (
								<TextControl
									label={ __( 'Tax rate (%)', 'jetpack-paypal-payments' ) }
									value={ taxValue || '' }
									onChange={ value => setAttributes( { taxValue: value } ) }
									type="number"
									min="0.01"
									max="99.99"
									step="0.01"
									placeholder="8.25"
									disabled={ isBusy }
									help={
										validationErrors.taxValue ||
										__( 'Percentage added to the product price.', 'jetpack-paypal-payments' )
									}
									className={
										validationErrors.taxValue
											? 'jetpack-paypal-payment-buttons__has-error'
											: undefined
									}
								/>
							) }
						</>
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
						disabled={ isBusy }
					/>
					{ customerNotes?.length > 0 && (
						<div className="jetpack-paypal-payment-buttons__customer-notes">
							{ customerNotes.map( ( note, noteIndex ) => (
								<div
									key={ noteIndex }
									className="jetpack-paypal-payment-buttons__customer-note"
									role="group"
									aria-label={ sprintf(
										/* translators: %d: field number */
										__( 'Custom field %d', 'jetpack-paypal-payments' ),
										noteIndex + 1
									) }
								>
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
										disabled={ isBusy }
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
											disabled={ isBusy }
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
												disabled={ isBusy }
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
							{ customerNotes.length < MAX_CUSTOMER_NOTES && (
								<Button
									isSmall
									variant="secondary"
									onClick={ () =>
										setAttributes( {
											customerNotes: [ ...customerNotes, { label: '', required: false } ],
										} )
									}
									disabled={ isBusy }
								>
									{ __( 'Add field', 'jetpack-paypal-payments' ) }
								</Button>
							) }
						</div>
					) }
				</PanelBody>
				<PanelBody title={ __( 'URL Redirect', 'jetpack-paypal-payments' ) } initialOpen={ false }>
					{ /* URLInput takes no onBlur, so the wrapper catches it as it bubbles, and
					     carries the error class too. URLInput gets exactly one class - it appends
					     `__suggestions` to whatever it is given, and a second one in there
					     would break the suggestion list's width. */ }
					<div
						className={ returnUrlError ? 'jetpack-paypal-payment-buttons__has-error' : undefined }
						onBlur={ () => markTouched( 'returnUrl' ) }
					>
						<URLInput
							label={ __( 'Return URL (optional)', 'jetpack-paypal-payments' ) }
							className="jetpack-paypal-payment-buttons__return-url"
							value={ returnUrl || '' }
							onChange={ value => setAttributes( { returnUrl: value } ) }
							required={ false }
							disabled={ isBusy }
							help={
								returnUrlError ||
								__( 'Redirect customers here after payment.', 'jetpack-paypal-payments' )
							}
						/>
					</div>
				</PanelBody>
			</InspectorControls>
			{ inspectorControls }

			<div className="jetpack-paypal-payment-buttons__preview">
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

				<PayPalButtonPreview
					format={ activeFormat }
					productName={ productName }
					price={ price }
					currencyCode={ currencyCode }
					productDescription={ productDescription }
					paymentLink={ paymentLink }
					variantsEnabled={ variantsEnabled }
					variants={ variants }
					imageUrl={ imageUrl }
					partnerAttributionId={ partnerAttributionId }
					buttonText={ buttonText }
					linkText={ linkText }
					qrShowCaption={ qrShowCaption }
					qrCaption={ qrCaption }
					attributes={ attributes }
				/>
			</div>

			{ confirmDialogs }
		</div>
	);
}
