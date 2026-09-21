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
	CheckboxControl,
	CustomSelectControl,
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
import {
	createInterpolateElement,
	useState,
	useCallback,
	useEffect,
	useMemo,
	useRef,
} from '@wordpress/element';
import { __, isRTL, sprintf } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { Link } from '@wordpress/ui';
import clsx from 'clsx';
import GridiconPlus from 'gridicons/dist/plus-small';
import PayPalAccountHeader from './components/account-header';
import AmountField from './components/amount-field';
import ConfirmDialogs from './components/confirm-dialogs';
import ConnectionWizard, { OnboardingFrame } from './components/connection-wizard';
import ExistingLinksStep from './components/existing-links-step';
import PayPalFormatControls from './components/format-controls';
import LegacyBlock from './components/legacy-block';
import LinkDetails from './components/link-details';
import PayPalButtonPreview from './components/paypal-button-preview';
import VariantBuilder, {
	getComparisonPrice,
	isVariantPricingOn,
	validateCustomerNotes,
	validateVariants,
} from './components/variant-builder';
import PayPalInspectorControls from './controls';
import { useExistingLinks } from './hooks/use-existing-links';
import { broadcastConnectionChange, usePayPalConnection } from './hooks/use-paypal-connection';
import { usePayPalResource } from './hooks/use-paypal-resource';
import { API_BASE } from './utils/api-base';
import { SUPPORTED_CURRENCIES } from './utils/currencies';
import { CURRENCY_SYMBOLS, getPricePlaceholder, getPriceStep } from './utils/currency-symbols';
import { withPartnerAttribution } from './utils/partner-attribution';
import { RESOURCE_ATTRIBUTES, resetToDefaults, turnGateOff } from './utils/resource-sync';
import { recordPaymentRead } from './utils/sync-on-save';
import { toast } from './utils/toast';
import {
	getUserFriendlyError,
	getValidationErrors,
	hasBlockingError,
	hasCheckoutOptionError,
	MAX_CUSTOMER_NOTES,
	MAX_DESCRIPTION_LENGTH,
	MAX_NAME_LENGTH,
	MAX_PRODUCT_ID_LENGTH,
	SHIPPING_MODES_WITH_FEE,
} from './utils/validation';

// Button type is always 'single' — the hosted payment page handles
// payment method selection (PayPal, cards, wallets, etc.).

// Touched marks key on the row index. A stable `_key` would make every mount report a
// change, since resource-sync.js strips `_key` from variants only.
const NOTE_KEY_PREFIX = 'customerNote:';
const noteFieldKey = noteIndex => `${ NOTE_KEY_PREFIX }${ noteIndex }`;

const helpQuantity = __( 'Fixed at 1 unit per purchase', 'jetpack-paypal-payments' );
// The minifier folds a ternary between two __() calls into one non-literal msgid and
// i18n-check-webpack-plugin then rejects the build, so each branch gets its own const.
const placeholderTaxRate = __( 'Enter tax rate', 'jetpack-paypal-payments' );
const placeholderTaxValue = __( 'Enter tax value', 'jetpack-paypal-payments' );

// FLAT and PERCENTAGE are PayPal's own values, so the select writes them straight to
// the attribute. CustomSelectControl renders each option's hint as a second line.
const DISCOUNT_TYPES = [
	{
		key: 'FLAT',
		name: __( 'Amount off', 'jetpack-paypal-payments' ),
		hint: __( 'Fixed amount off the price', 'jetpack-paypal-payments' ),
	},
	{
		key: 'PERCENTAGE',
		name: __( 'Percentage', 'jetpack-paypal-payments' ),
		hint: __( 'Percentage based on price', 'jetpack-paypal-payments' ),
	},
];

// Both selects write taxType.
const TAX_TYPE_PROFILE = {
	key: 'profile',
	name: __( 'Use tax from my PayPal settings', 'jetpack-paypal-payments' ),
};
const TAX_TYPE_SPECIFIC = {
	key: 'specific',
	name: __( 'Use a specific tax rate', 'jetpack-paypal-payments' ),
};
const TAX_TYPES = [ TAX_TYPE_PROFILE, TAX_TYPE_SPECIFIC ];

const TAX_RATE_TYPES = [
	{ key: 'PERCENTAGE', name: __( 'Percentage', 'jetpack-paypal-payments' ) },
	{ key: 'FLAT', name: __( 'Amount', 'jetpack-paypal-payments' ) },
];

// PayPal's tax settings page, per environment.
const TAX_PROFILE_URL = {
	sandbox: 'https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_profile-sales-tax',
	production: 'https://www.paypal.com/cgi-bin/webscr?cmd=_profile-sales-tax',
};

// PayPal's shipping settings page, per environment. Its own cgi-bin script,
// separate from the tax one.
const SHIPPING_PROFILE_URL = {
	sandbox: 'https://www.sandbox.paypal.com/cgi-bin/customerprofileweb?cmd=_profile-shipping',
	production: 'https://www.paypal.com/cgi-bin/customerprofileweb?cmd=_profile-shipping',
};

// Editor modes. buildShipping() maps them onto PayPal's two types: PROFILE and FREE
// send PREFERENCE, FLAT and QUANTITY send FLAT.
const SHIPPING_MODES = [
	{
		key: 'PROFILE',
		name: __( 'Use shipping from my PayPal settings', 'jetpack-paypal-payments' ),
	},
	{ key: 'QUANTITY', name: __( 'Use quantity-based shipping fee', 'jetpack-paypal-payments' ) },
	{ key: 'FLAT', name: __( 'Use specific shipping fee', 'jetpack-paypal-payments' ) },
	{ key: 'FREE', name: __( 'Free shipping', 'jetpack-paypal-payments' ) },
];

// The address checkbox swaps its help when a profile tax makes it mandatory.
const helpAddress = __(
	'Requires customer to add shipping address during checkout',
	'jetpack-paypal-payments'
);
const helpAddressWithProfileTax = __(
	'Required while the tax comes from your PayPal settings.',
	'jetpack-paypal-payments'
);

// Own const per branch, same i18n reason as the tax placeholders above: the first
// amount field's label changes with the mode.
const labelShippingFirstItem = __( 'Shipping fee for first item', 'jetpack-paypal-payments' );
const labelShippingFee = __( 'Enter shipping fee', 'jetpack-paypal-payments' );

/**
 * API-managed PayPal Payment Buttons edit component.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Block attributes.
 * @param {Function} props.setAttributes - Function to update block attributes.
 * @param {string}   props.clientId      - The block's client id, renamed because
 *                                       usePayPalConnection() returns PayPal's own clientId.
 * @param {boolean}  props.isSelected    - Whether this block is the selected one.
 * @return {Element} Block editor UI.
 */
export default function ApiManagedEdit( {
	attributes,
	setAttributes,
	clientId: blockClientId,
	isSelected,
} ) {
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
		productId,
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
		handlingEnabled,
		handlingValue,
		discountEnabled,
		discountType,
		discountValue,
		shippingEnabled,
		shippingMode,
		shippingValue,
		shippingAdditionalValue,
		collectShippingAddress,
		format,
		qrShowCaption,
		qrCaption,
	} = attributes;

	// Normalize — old blocks without the attribute default to BUTTON.
	const activeFormat = format || 'BUTTON';

	// PayPal rejects any decimal in JPY, HUF and TWD, so the input must not offer one.
	const priceStep = getPriceStep( currencyCode || 'USD' );
	const pricePlaceholder = getPricePlaceholder( currencyCode || 'USD' );
	const currencySymbol = CURRENCY_SYMBOLS[ currencyCode || 'USD' ] || currencyCode || 'USD';

	const blockProps = useBlockProps();

	// Separate __() calls keep each msgid literal for the minifier.
	const labelConnected = __( 'PayPal Connected', 'jetpack-paypal-payments' );
	const labelDisconnected = __( 'PayPal Disconnected', 'jetpack-paypal-payments' );

	const {
		isConnected,
		setIsConnected,
		environment,
		setEnvironment,
		connectionLoading,
		partnerAttributionId,
		accountEmail,
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

	// One string with the link inside it so translators keep the sentence order.
	const taxProfileHint = createInterpolateElement(
		__(
			'This will be applied when the customer enters their address. <TaxSettingsLink>Set up or manage tax settings</TaxSettingsLink>',
			'jetpack-paypal-payments'
		),
		{
			TaxSettingsLink: (
				<Link openInNewTab href={ TAX_PROFILE_URL[ environment ] || TAX_PROFILE_URL.production } />
			),
		}
	);

	const shippingProfileHint = createInterpolateElement(
		__(
			'This will be applied when the customer enters their address. <ShippingSettingsLink>Set up or manage shipping settings</ShippingSettingsLink>',
			'jetpack-paypal-payments'
		),
		{
			ShippingSettingsLink: (
				<Link
					openInNewTab
					href={ SHIPPING_PROFILE_URL[ environment ] || SHIPPING_PROFILE_URL.production }
				/>
			),
		}
	);

	// Confirmation dialog state for destructive actions.
	const [ showDeleteConfirm, setShowDeleteConfirm ] = useState( false );
	const [ showDisconnectConfirm, setShowDisconnectConfirm ] = useState( false );
	const [ showLogOutConfirm, setShowLogOutConfirm ] = useState( false );

	// Inline validation state — track which fields have been touched.
	//
	// A note row that opens blank gets marked touched up front, so its error shows
	// without a blur. A block saved that way has no resourceId, so hasButton misses it.
	const [ touchedFields, setTouchedFields ] = useState( () =>
		Object.fromEntries(
			( attributes.customerNotes || [] )
				.map( ( note, i ) => ( note.label?.trim() ? null : [ noteFieldKey( i ), true ] ) )
				.filter( Boolean )
		)
	);

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

	const taxHasValue = ( taxType || 'PERCENTAGE' ) !== 'PREFERENCE';
	const taxIsPercentage = ( taxType || 'PERCENTAGE' ) === 'PERCENTAGE';

	// PayPal rejects a payment that takes its tax from the profile and collects no
	// address, so the checkbox is locked on for as long as that tax type is picked.
	const addressIsRequired = !! taxEnabled && ! taxHasValue;

	const discountIsPercentage = ( discountType || 'FLAT' ) === 'PERCENTAGE';

	const activeShippingMode = shippingMode || 'FLAT';
	const shippingHasFee = SHIPPING_MODES_WITH_FEE.includes( activeShippingMode );

	const comparisonPrice = getComparisonPrice( variantPricingOn, variants, price );

	/**
	 * Compute validation errors for all form fields.
	 * Memoized to avoid re-computing on every render.
	 */
	const validationErrors = useMemo(
		() => getValidationErrors( { ...attributes, variantPricingOn, comparisonPrice } ),
		[ attributes, variantPricingOn, comparisonPrice ]
	);

	/**
	 * Variant validation errors (empty array if valid or disabled).
	 */
	const variantErrors = useMemo(
		() => validateVariants( variantsEnabled, variants, currencyCode || 'USD' ),
		[ variantsEnabled, variants, currencyCode ]
	);

	/**
	 * Customer note errors, one per row with a blank label (empty array if valid).
	 */
	const customerNoteErrors = useMemo(
		() => validateCustomerNotes( customerNotes ),
		[ customerNotes ]
	);

	/**
	 * Whether the block has a created button to preview.
	 */
	const hasButton = !! ( isApiManaged && resourceId && paymentLink );

	/**
	 * Show a field's error once the merchant leaves it, or right away on a saved
	 * button - the same rule as noteErrorFor() below and VariantBuilder's showAll.
	 *
	 * @param {string} field - Attribute name.
	 * @return {string|undefined} The message, or undefined while it is still hidden.
	 */
	const errorFor = field =>
		hasButton || touchedFields[ field ] ? validationErrors[ field ] : undefined;

	// The price field only hides while per-variant pricing is on, so seeing it with product
	// options on means the merchant has been in the pricing UI - say what is wrong rather
	// than wait for a blur on a field they never asked for.
	const priceError = variantsEnabled ? validationErrors.price : errorFor( 'price' );

	const returnUrlError = errorFor( 'returnUrl' );

	// Whether the form is valid: no validation errors on required fields or variants.
	// Derived over the errors rather than listed field by field, so a new one cannot be
	// forgotten here. returnUrl stays out of the gate - a bad one warns and still saves,
	// as it always has - which is what ADVISORY_ERROR_KEYS carries.
	const isFormValid =
		! hasBlockingError( validationErrors ) &&
		variantErrors.length === 0 &&
		customerNoteErrors.length === 0;

	const {
		resource,
		isBusy,
		linkDeleted,
		paymentChanged,
		dismissPaymentChanged,
		handleDeleteButton,
		executeDeleteButton,
	} = usePayPalResource( {
		attributes,
		setAttributes,
		isConnected,
		clientId: blockClientId,
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
				// Back to block.json defaults, so reconnecting starts the next payment clean.
				...resetToDefaults( 'isApiManaged', 'resourceId', ...RESOURCE_ATTRIBUTES ),
				// The image is block-owned and has no default to read.
				imageUrl: undefined,
				imageId: undefined,
			} );
			toast( 'success', __( 'PayPal account disconnected.', 'jetpack-paypal-payments' ) );
		};

		apiFetch( {
			path: `${ API_BASE }/disconnect`,
			method: 'POST',
		} )
			.then( doDisconnect )
			.catch( doDisconnect ); // Still disconnect locally if API fails.
	}, [ setAttributes, setIsConnected, setShowReconnect, setWizardStep ] );

	/**
	 * Show a row's error once the merchant leaves the field, or right away on a saved
	 * button - the same rule as VariantBuilder's showAll.
	 *
	 * @param {number} noteIndex - Which row.
	 * @return {string|undefined} The message, or undefined while it is still hidden.
	 */
	const noteErrorFor = noteIndex =>
		hasButton || touchedFields[ noteFieldKey( noteIndex ) ]
			? customerNoteErrors.find( e => e.index === noteIndex )?.message
			: undefined;

	/**
	 * Patch one note row.
	 *
	 * @param {number} noteIndex - Which row.
	 * @param {object} patch     - The fields to change.
	 */
	const updateNote = ( noteIndex, patch ) => {
		setAttributes( {
			customerNotes: customerNotes.map( ( note, i ) =>
				i === noteIndex ? { ...note, ...patch } : note
			),
		} );
	};

	/**
	 * Every touched mark except the note ones.
	 *
	 * @param {object} marks - The current touchedFields.
	 * @return {object} The same marks with the note rows removed.
	 */
	const withoutNoteMarks = marks =>
		Object.fromEntries(
			Object.entries( marks ).filter( ( [ key ] ) => ! key.startsWith( NOTE_KEY_PREFIX ) )
		);

	/**
	 * Drop a note row and shift the touched marks down with it, so the next row keeps
	 * its own mark.
	 *
	 * @param {number} noteIndex - Which row.
	 */
	const removeNote = noteIndex => {
		const remaining = customerNotes.filter( ( _, i ) => i !== noteIndex );

		setAttributes( { customerNotes: remaining } );
		setTouchedFields( prev => {
			const next = withoutNoteMarks( prev );
			remaining.forEach( ( _, i ) => {
				if ( prev[ noteFieldKey( i < noteIndex ? i : i + 1 ) ] ) {
					next[ noteFieldKey( i ) ] = true;
				}
			} );
			return next;
		} );
	};

	/**
	 * Add an empty note row.
	 */
	const addNote = () => {
		setAttributes( {
			customerNotes: [ ...customerNotes, { label: '', required: false } ],
		} );
	};

	// A saved link opens on its details; the form is a menu click away. A link
	// with something to fix opens on the form instead, or the error would be
	// hidden behind a view that cannot show it. Decided once, as the block first
	// sees the link - re-reading validity every render would pull the form away
	// on the keystroke that fixes the error.
	const formIsValid = useRef( isFormValid );
	formIsValid.current = isFormValid;
	const [ isEditing, setIsEditing ] = useState( ! isFormValid );
	// A saved link can be switched for another of the account's links from its
	// details menu. A new link, however it arrived, closes the picker.
	const [ isSwitching, setIsSwitching ] = useState( false );
	useEffect( () => {
		setIsEditing( ! formIsValid.current );
		setIsSwitching( false );
	}, [ resourceId ] );
	// An undo, or a read writing back a value that fails validation, can break the
	// link later on, and the details have nowhere to show it. Opening only, so the
	// form stays put while the merchant works through the error.
	useEffect( () => {
		if ( ! isFormValid ) {
			setIsEditing( true );
		}
	}, [ isFormValid ] );
	const showDetails = hasButton && ! isEditing;
	const showSwitch = hasButton && isSwitching;

	// The changed-at-PayPal warning is done once the merchant leaves the details
	// screen it was raised on. Keyed to that screen rather than to selection, which
	// drops the sidebar on any click elsewhere in the post and would clear a warning
	// still unread.
	const detailsWasShown = useRef( showDetails );
	useEffect( () => {
		if ( detailsWasShown.current && ! showDetails ) {
			dismissPaymentChanged();
		}
		detailsWasShown.current = showDetails;
	}, [ showDetails, dismissPaymentChanged ] );

	// A block with nothing in it yet first offers the links the account already
	// has, and the step is skipped when there are none.
	const isFreshBlock = ! hasButton && ! productName && ! price;
	const [ createNewChosen, setCreateNewChosen ] = useState( false );
	const [ isPicking, setIsPicking ] = useState( false );
	const wantsLinkStep = isFreshBlock && ! createNewChosen;
	// A saved link reads the list too, so its menu can say whether there is another
	// link to switch to. Only once selected: the sidebar is not up before that, and
	// every block on the canvas mounts this component.
	const { links: existingLinks, isLoading: linksLoading } = useExistingLinks( {
		enabled: isConnected && ( wantsLinkStep || ( isSelected && ( showDetails || showSwitch ) ) ),
	} );
	const showLinkStep = isConnected && wantsLinkStep && ( linksLoading || existingLinks.length > 0 );
	const otherLinks = useMemo(
		() => existingLinks.filter( link => link.id !== resourceId ),
		[ existingLinks, resourceId ]
	);
	const canChangeLink = isConnected && ! isBusy && ( linksLoading || otherLinks.length > 0 );

	/**
	 * Point the block at an existing link, with the attributes PayPal holds for it.
	 *
	 * @param {object} link - A payment resource from the list.
	 */
	const pickExistingLink = useCallback(
		link => {
			setIsPicking( true );
			apiFetch( { path: `${ API_BASE }/buttons/${ link.id }` } )
				.then( response => {
					if ( ! response?.attributes ) {
						return;
					}
					// The block just read the payment, so the save can write it without a second fetch.
					recordPaymentRead( blockClientId, link.id );
					// The read only carries what the payment has, so what the last link had
					// goes back to its default first. The image stays: it belongs to the block.
					setAttributes( {
						...resetToDefaults( ...RESOURCE_ATTRIBUTES ),
						isApiManaged: true,
						resourceId: link.id,
						...response.attributes,
					} );
				} )
				.catch( err => toast( 'error', getUserFriendlyError( err ) ) )
				.finally( () => setIsPicking( false ) );
		},
		[ blockClientId, setAttributes ]
	);

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

	// Not connected — the canvas says what the block is for and the sidebar
	// carries the connection wizard. A block that already holds a saved button
	// keeps showing its preview instead (e.g. demo posts in Playground, or a
	// button created before the site was disconnected), unless the merchant
	// explicitly asked to reconnect.
	if ( ! isConnected && ( ! hasButton || showReconnect ) ) {
		return (
			<div { ...blockProps }>
				<div className="jetpack-paypal-payment-buttons__placeholder">
					<h4>{ __( 'PayPal Payment Button', 'jetpack-paypal-payments' ) }</h4>
					<p>
						{ __(
							'Log in to or create a PayPal business account to use payment buttons',
							'jetpack-paypal-payments'
						) }
					</p>
				</div>
				<OnboardingFrame
					signupUrl={ signupUrl }
					isOverlayOpen={ isOverlayOpen }
					setFrameNode={ setFrameNode }
					cancelOnboarding={ cancelOnboarding }
				/>
				<InspectorControls>
					<ConnectionWizard
						setIsConnected={ setIsConnected }
						environment={ environment }
						setEnvironment={ setEnvironment }
						showReconnect={ showReconnect }
						setShowReconnect={ setShowReconnect }
						signupUrl={ signupUrl }
						setOnboardingRequested={ setOnboardingRequested }
						isOpeningPayPal={ isOpeningPayPal }
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
					/>
				</InspectorControls>
			</div>
		);
	}

	// Toolbar control to delete the payment button.
	const toolbarControls = hasButton ? (
		<BlockControls>
			<ToolbarGroup>
				<ToolbarButton
					icon="trash"
					label={ __( 'Delete payment link', 'jetpack-paypal-payments' ) }
					onClick={ handleDeleteButton }
					disabled={ isBusy || ! isConnected }
					isDestructive
				/>
			</ToolbarGroup>
		</BlockControls>
	) : null;

	// The account header replaces core's block card. A block can still hold a button
	// after a site-wide disconnect, and there the canvas offers Reconnect instead.
	const accountHeader = isConnected ? (
		<PayPalAccountHeader
			isSelected={ isSelected }
			environment={ environment }
			accountEmail={ accountEmail }
			onLogOut={ () => setShowLogOutConfirm( true ) }
		/>
	) : null;

	// The connection panel sits last in the Settings tab, under whichever view is showing.
	const connectionPanel = (
		<PayPalInspectorControls
			isConnected={ isConnected }
			environment={ environment }
			setShowReconnect={ setShowReconnect }
			isBusy={ isBusy }
			handleDeleteButton={ handleDeleteButton }
			handleDisconnect={ handleDisconnect }
			hasButton={ hasButton }
		/>
	);

	// The Styles tab — Embed as and the format's own controls — is a fill of its own.
	const formatControls = (
		<PayPalFormatControls
			format={ activeFormat }
			attributes={ attributes }
			setAttributes={ setAttributes }
			paymentUrl={ withPartnerAttribution( paymentLink, partnerAttributionId ) }
			disabled={ isBusy }
		/>
	);

	// Shared confirmation dialogs — extracted so they render regardless of which return branch is active.
	const confirmDialogs = (
		<ConfirmDialogs
			showDeleteConfirm={ showDeleteConfirm }
			setShowDeleteConfirm={ setShowDeleteConfirm }
			showDisconnectConfirm={ showDisconnectConfirm }
			setShowDisconnectConfirm={ setShowDisconnectConfirm }
			showLogOutConfirm={ showLogOutConfirm }
			setShowLogOutConfirm={ setShowLogOutConfirm }
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

	// A payment link can be shared by blocks on any post, so warn whenever there is one.
	const sharedResourceNotice = hasButton ? (
		<p className="jetpack-paypal-payment-buttons__shared-link-note">
			{ __(
				'Changes made will apply to all payment buttons with this link.',
				'jetpack-paypal-payments'
			) }
		</p>
	) : null;

	// Both screens show this, at the top of the sidebar: the warning belongs to the
	// link, and the read that raises it comes in while the details are showing.
	const paymentChangedNotice = paymentChanged ? (
		<Notice status="warning" isDismissible={ false }>
			{ __(
				'This payment link was updated elsewhere and this block has been updated to match.',
				'jetpack-paypal-payments'
			) }
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

	const linkStep = (
		<ExistingLinksStep
			links={ existingLinks }
			isLoading={ linksLoading }
			onCreateNew={ () => setCreateNewChosen( true ) }
			onPick={ pickExistingLink }
			isPicking={ isPicking }
		/>
	);

	// The same picker, minus Create new and the link the block already has.
	const switchView = (
		<>
			<div className="jetpack-paypal-payment-buttons__form-actions">
				<Button
					icon={ isRTL() ? chevronRight : chevronLeft }
					onClick={ () => setIsSwitching( false ) }
					className="jetpack-paypal-payment-buttons__back-to-details"
				>
					{ __( 'Change item', 'jetpack-paypal-payments' ) }
				</Button>
			</div>
			<ExistingLinksStep
				links={ otherLinks }
				isLoading={ linksLoading }
				onPick={ pickExistingLink }
				isPicking={ isPicking }
			/>
		</>
	);

	const detailsView = (
		<LinkDetails
			attributes={ attributes }
			resource={ resource }
			notices={ paymentChangedNotice }
			onEdit={ () => setIsEditing( true ) }
			onChangeLink={ () => setIsSwitching( true ) }
			canChangeLink={ canChangeLink }
		/>
	);

	const formPanels = (
		<>
			{ /* Form-wide notices go here. A field's own notice renders next to that field. */ }
			{ ( hasButton || paymentChanged ) && (
				<div className="jetpack-paypal-payment-buttons__form-actions">
					{ /* Plain, so the back link keeps the sidebar's own foreground -
					     `tertiary` would paint it the admin accent. */ }
					{ hasButton && (
						<Button
							icon={ isRTL() ? chevronRight : chevronLeft }
							onClick={ () => setIsEditing( false ) }
							className="jetpack-paypal-payment-buttons__back-to-details"
						>
							{ __( 'Edit Button', 'jetpack-paypal-payments' ) }
						</Button>
					) }
					{ sharedResourceNotice }
					{ paymentChangedNotice }
				</div>
			) }
			<PanelBody title={ __( 'Details', 'jetpack-paypal-payments' ) } initialOpen={ true }>
				<TextControl
					label={ __( 'Product Name', 'jetpack-paypal-payments' ) }
					value={ productName || '' }
					onChange={ value => setAttributes( { productName: value } ) }
					onBlur={ () => markTouched( 'productName' ) }
					disabled={ isBusy }
					placeholder={ __( 'e.g., Premium Widget', 'jetpack-paypal-payments' ) }
					help={
						errorFor( 'productName' ) ||
						sprintf(
							/* translators: 1: current character count, 2: maximum allowed */
							__( '%1$d / %2$d characters', 'jetpack-paypal-payments' ),
							( productName || '' ).length,
							MAX_NAME_LENGTH
						)
					}
					className={
						errorFor( 'productName' ) ? 'jetpack-paypal-payment-buttons__has-error' : undefined
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
						errorFor( 'productDescription' ) || (
							<>
								{ __( 'Shown to customers at checkout.', 'jetpack-paypal-payments' ) }
								<br />
								{ sprintf(
									/* translators: 1: current character count, 2: maximum allowed */
									__( '%1$d / %2$d characters', 'jetpack-paypal-payments' ),
									// Trim first: validateDescription() and the server both measure the trimmed length.
									( productDescription || '' ).trim().length,
									MAX_DESCRIPTION_LENGTH
								) }
							</>
						)
					}
					className={
						errorFor( 'productDescription' )
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
				<TextControl
					label={ __( 'Product ID (optional)', 'jetpack-paypal-payments' ) }
					value={ productId || '' }
					onChange={ value => setAttributes( { productId: value } ) }
					disabled={ isBusy }
					maxLength={ MAX_PRODUCT_ID_LENGTH }
					placeholder={ __( 'SKU number or other identifiers', 'jetpack-paypal-payments' ) }
				/>
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
			{ /* `initialOpen`, so the panel opens itself on a checkout-field error and the
			     merchant can still close it. */ }
			<PanelBody
				title={ __( 'Checkout Options', 'jetpack-paypal-payments' ) }
				initialOpen={ hasCheckoutOptionError( validationErrors ) || customerNoteErrors.length > 0 }
			>
				{ /* WOOPTP-171: Customer Notes */ }
				<ToggleControl
					label={ __( 'Add customer note', 'jetpack-paypal-payments' ) }
					help={ __(
						'Tell customers what you need, like personalization, gift messages, etc.',
						'jetpack-paypal-payments'
					) }
					checked={ customerNotes?.length > 0 }
					onChange={ value => {
						if ( value ) {
							setAttributes( {
								customerNotes: [ { label: '', required: false } ],
							} );
						} else {
							setAttributes( resetToDefaults( 'customerNotes' ) );
						}
						// A fresh row starts untouched, so the old marks go with the old rows.
						setTouchedFields( withoutNoteMarks );
					} }
					disabled={ isBusy }
				/>
				{ customerNotes?.length > 0 && (
					<div className="jetpack-paypal-payment-buttons__customer-notes">
						{ customerNotes.map( ( note, noteIndex ) => {
							const noteError = noteErrorFor( noteIndex );

							return (
								<div
									key={ noteIndex }
									className="jetpack-paypal-payment-buttons__customer-note"
									role="group"
									aria-label={ sprintf(
										/* translators: %d: note number */
										__( 'Customer note %d', 'jetpack-paypal-payments' ),
										noteIndex + 1
									) }
								>
									{ /* Rows share one label; the group's aria-label above tells them apart. */ }
									<TextControl
										__nextHasNoMarginBottom
										label={ __( 'Customer note label', 'jetpack-paypal-payments' ) }
										value={ note.label || '' }
										onChange={ value => updateNote( noteIndex, { label: value } ) }
										placeholder={ __( 'For example: Gift message', 'jetpack-paypal-payments' ) }
										onBlur={ () => markTouched( noteFieldKey( noteIndex ) ) }
										help={ noteError }
										className={ clsx( 'jetpack-paypal-payment-buttons__field', {
											'jetpack-paypal-payment-buttons__has-error': noteError,
										} ) }
										disabled={ isBusy }
									/>
									<CheckboxControl
										__nextHasNoMarginBottom
										label={ __( 'Required', 'jetpack-paypal-payments' ) }
										checked={ !! note.required }
										onChange={ value => updateNote( noteIndex, { required: value } ) }
										disabled={ isBusy }
									/>
									{ customerNotes.length > 1 && (
										<Button
											size="small"
											isDestructive
											variant="tertiary"
											onClick={ () => removeNote( noteIndex ) }
											disabled={ isBusy }
											label={ sprintf(
												/* translators: %d: note number */
												__( 'Remove customer note %d', 'jetpack-paypal-payments' ),
												noteIndex + 1
											) }
										>
											{ __( 'Remove', 'jetpack-paypal-payments' ) }
										</Button>
									) }
								</div>
							);
						} ) }
						{ customerNotes.length < MAX_CUSTOMER_NOTES && (
							<Button
								__next40pxDefaultSize
								variant="tertiary"
								icon={ GridiconPlus }
								onClick={ addNote }
								disabled={ isBusy }
							>
								{ __( 'Add another note', 'jetpack-paypal-payments' ) }
							</Button>
						) }
					</div>
				) }
				{ /* Adjustable quantity */ }
				<ToggleControl
					label={ __( 'Let customers set quantity', 'jetpack-paypal-payments' ) }
					help={ helpQuantity }
					checked={ adjustableQuantity }
					onChange={ value =>
						setAttributes(
							value ? { adjustableQuantity: true } : turnGateOff( 'adjustableQuantity' )
						)
					}
					disabled={ isBusy }
				/>
				{ adjustableQuantity && (
					<TextControl
						className="jetpack-paypal-payment-buttons__field"
						label={ __( 'Maximum quantity', 'jetpack-paypal-payments' ) }
						value={ maxQuantity || '' }
						onChange={ value =>
							setAttributes( {
								maxQuantity: parseInt( value, 10 ) || resetToDefaults( 'maxQuantity' ).maxQuantity,
							} )
						}
						type="number"
						min={ 2 }
						max={ 999 }
						disabled={ isBusy }
						help={ __( 'Customers can buy up to this number', 'jetpack-paypal-payments' ) }
					/>
				) }

				{ /* Tax */ }
				<ToggleControl
					label={ __( 'Add tax', 'jetpack-paypal-payments' ) }
					help={ __( 'Set the tax rate for this item', 'jetpack-paypal-payments' ) }
					checked={ taxEnabled }
					onChange={ value =>
						setAttributes( value ? { taxEnabled: true } : turnGateOff( 'taxEnabled' ) )
					}
					disabled={ isBusy }
				/>
				{ taxEnabled && (
					<>
						<CustomSelectControl
							className={ clsx(
								'jetpack-paypal-payment-buttons__field',
								'jetpack-paypal-payment-buttons__select-menu',
								{ 'jetpack-paypal-payment-buttons__has-hint': ! taxHasValue }
							) }
							label={ __( 'Tax type', 'jetpack-paypal-payments' ) }
							value={ taxHasValue ? TAX_TYPE_SPECIFIC : TAX_TYPE_PROFILE }
							options={ TAX_TYPES }
							// PayPal reads a profile tax back with an empty value, so a leftover rate
							// would show up as a change on the next mount.
							onChange={ ( { selectedItem } ) =>
								setAttributes(
									'profile' === selectedItem.key
										? {
												taxType: 'PREFERENCE',
												...resetToDefaults( 'taxValue' ),
												collectShippingAddress: true,
											}
										: { taxType: 'PERCENTAGE' }
								)
							}
							disabled={ isBusy }
						/>
						{ /* CustomSelectControl passes `help` to the trigger as a DOM attribute, so
						     the hint gets its own paragraph. */ }
						{ ! taxHasValue && (
							<p className="jetpack-paypal-payment-buttons__field-hint">{ taxProfileHint }</p>
						) }
						{ taxHasValue && (
							<>
								<CustomSelectControl
									className="jetpack-paypal-payment-buttons__field jetpack-paypal-payment-buttons__select-menu"
									label={ __( 'Rate type', 'jetpack-paypal-payments' ) }
									value={
										TAX_RATE_TYPES.find( option => option.key === taxType ) ?? TAX_RATE_TYPES[ 0 ]
									}
									options={ TAX_RATE_TYPES }
									// 7.5% and $7.50 are different numbers, so the value clears with the type.
									onChange={ ( { selectedItem } ) =>
										setAttributes( {
											taxType: selectedItem.key,
											...resetToDefaults( 'taxValue' ),
										} )
									}
									disabled={ isBusy }
								/>
								<AmountField
									label={ __( 'Tax rate', 'jetpack-paypal-payments' ) }
									value={ taxValue }
									onChange={ value => setAttributes( { taxValue: value } ) }
									suffix={ taxIsPercentage ? '%' : currencySymbol }
									step={ taxIsPercentage ? '0.01' : priceStep }
									min="0"
									max={ taxIsPercentage ? '99.99' : undefined }
									placeholder={ taxIsPercentage ? placeholderTaxRate : placeholderTaxValue }
									error={ validationErrors.taxValue }
									disabled={ isBusy }
								/>
							</>
						) }
					</>
				) }

				{ /* Shipping */ }
				<ToggleControl
					label={ __( 'Add shipping', 'jetpack-paypal-payments' ) }
					help={ __( 'Set shipping fees and get address', 'jetpack-paypal-payments' ) }
					checked={ shippingEnabled }
					onChange={ value =>
						setAttributes( value ? { shippingEnabled: true } : turnGateOff( 'shippingEnabled' ) )
					}
					disabled={ isBusy }
				/>
				{ shippingEnabled && (
					<>
						<CustomSelectControl
							className={ clsx(
								'jetpack-paypal-payment-buttons__field',
								'jetpack-paypal-payment-buttons__select-menu',
								{
									'jetpack-paypal-payment-buttons__has-hint': 'PROFILE' === activeShippingMode,
								}
							) }
							label={ __( 'Shipping fee', 'jetpack-paypal-payments' ) }
							value={
								SHIPPING_MODES.find( option => option.key === activeShippingMode ) ??
								SHIPPING_MODES[ 0 ]
							}
							options={ SHIPPING_MODES }
							// Clear the fees the new mode hides. A leftover fee comes back blank from the
							// next read-back, which shows up as PayPal changing the button.
							onChange={ ( { selectedItem } ) =>
								setAttributes( {
									shippingMode: selectedItem.key,
									...( SHIPPING_MODES_WITH_FEE.includes( selectedItem.key )
										? {}
										: resetToDefaults( 'shippingValue' ) ),
									...( 'QUANTITY' === selectedItem.key
										? {}
										: resetToDefaults( 'shippingAdditionalValue' ) ),
								} )
							}
							disabled={ isBusy }
						/>
						{ 'PROFILE' === activeShippingMode && (
							<p className="jetpack-paypal-payment-buttons__field-hint">{ shippingProfileHint }</p>
						) }
						{ shippingHasFee && (
							<AmountField
								label={
									'QUANTITY' === activeShippingMode ? labelShippingFirstItem : labelShippingFee
								}
								value={ shippingValue }
								onChange={ value => setAttributes( { shippingValue: value } ) }
								suffix={ currencySymbol }
								step={ priceStep }
								min="0"
								placeholder={ __( 'Amount', 'jetpack-paypal-payments' ) }
								error={ validationErrors.shippingValue }
								disabled={ isBusy }
							/>
						) }
						{ 'QUANTITY' === activeShippingMode && (
							<AmountField
								label={ __( 'Additional items (optional)', 'jetpack-paypal-payments' ) }
								value={ shippingAdditionalValue }
								onChange={ value => setAttributes( { shippingAdditionalValue: value } ) }
								suffix={ currencySymbol }
								step={ priceStep }
								min="0"
								placeholder={ __( 'Amount', 'jetpack-paypal-payments' ) }
								error={ validationErrors.shippingAdditionalValue }
								disabled={ isBusy }
							/>
						) }
						<CheckboxControl
							label={ __( 'Collect shipping address', 'jetpack-paypal-payments' ) }
							help={ addressIsRequired ? helpAddressWithProfileTax : helpAddress }
							checked={ addressIsRequired || !! collectShippingAddress }
							onChange={ value => setAttributes( { collectShippingAddress: value } ) }
							disabled={ isBusy || addressIsRequired }
						/>
					</>
				) }

				{ /* Handling fee */ }
				<ToggleControl
					label={ __( 'Add handling fee', 'jetpack-paypal-payments' ) }
					help={ __( 'One fee per purchase', 'jetpack-paypal-payments' ) }
					checked={ handlingEnabled }
					onChange={ value =>
						setAttributes( value ? { handlingEnabled: true } : turnGateOff( 'handlingEnabled' ) )
					}
					disabled={ isBusy }
				/>
				{ handlingEnabled && (
					<AmountField
						label={ __( 'Handling fee', 'jetpack-paypal-payments' ) }
						value={ handlingValue }
						onChange={ value => setAttributes( { handlingValue: value } ) }
						suffix={ currencySymbol }
						step={ priceStep }
						min="0"
						placeholder={ __( 'Amount', 'jetpack-paypal-payments' ) }
						error={ validationErrors.handlingValue }
						disabled={ isBusy }
					/>
				) }

				{ /* Discount */ }
				<ToggleControl
					label={ __( 'Add discount', 'jetpack-paypal-payments' ) }
					help={ __( 'Applies to each item, no matter quantity', 'jetpack-paypal-payments' ) }
					checked={ discountEnabled }
					onChange={ value =>
						setAttributes( value ? { discountEnabled: true } : turnGateOff( 'discountEnabled' ) )
					}
					disabled={ isBusy }
				/>
				{ discountEnabled && (
					<>
						{ /* CustomSelectControl, for the second hint line each option carries. */ }
						<CustomSelectControl
							className="jetpack-paypal-payment-buttons__field jetpack-paypal-payment-buttons__select-menu"
							label={ __( 'Discount type', 'jetpack-paypal-payments' ) }
							// Keeps the control controlled when the stored type has no option here.
							value={
								DISCOUNT_TYPES.find( option => option.key === discountType ) ?? DISCOUNT_TYPES[ 0 ]
							}
							options={ DISCOUNT_TYPES }
							// Clear the value with the type: 2 kept across a switch turns $2 off
							// into 2% off, and both are legal.
							onChange={ ( { selectedItem } ) =>
								setAttributes( {
									discountType: selectedItem.key,
									...resetToDefaults( 'discountValue' ),
								} )
							}
							disabled={ isBusy }
						/>
						<AmountField
							label={ __( 'Discount value', 'jetpack-paypal-payments' ) }
							value={ discountValue }
							onChange={ value => setAttributes( { discountValue: value } ) }
							suffix={ discountIsPercentage ? '%' : currencySymbol }
							// PayPal takes a whole-number percentage only, 1 to 99.
							step={ discountIsPercentage ? '1' : priceStep }
							min={ discountIsPercentage ? '1' : priceStep }
							max={ discountIsPercentage ? '99' : undefined }
							help={ __( 'Reduced from the product price', 'jetpack-paypal-payments' ) }
							error={ validationErrors.discountValue }
							disabled={ isBusy }
						/>
					</>
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
		</>
	);

	let sidebar = formPanels;
	if ( showLinkStep ) {
		sidebar = linkStep;
	} else if ( showSwitch ) {
		sidebar = switchView;
	} else if ( showDetails ) {
		sidebar = detailsView;
	}

	return (
		<div { ...blockProps }>
			{ toolbarControls }
			{ /* One fill for the whole Settings tab. Separate fills portal into the same
			     container, so the sidebar orders them by which mounted last rather than
			     by source. */ }
			<InspectorControls>
				{ sidebar }
				{ connectionPanel }
			</InspectorControls>
			{ accountHeader }
			{ formatControls }

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

				{ /* The inspector only mounts when the block is selected, so notices about a
				     broken block go on the canvas. */ }
				{ disconnectedNotice }

				{ linkDeleted && (
					<Notice status="warning" isDismissible={ false }>
						{ __(
							'This payment link was deleted from PayPal, so the published button shows nothing. Updating the post creates a new link with a new URL and QR code. Remove the block instead if you no longer sell this.',
							'jetpack-paypal-payments'
						) }
					</Notice>
				) }

				{ showLinkStep ? (
					<p className="jetpack-paypal-payment-buttons__links-hint">
						{ __(
							'Choose a payment link you already have, or create a new one, in the block settings.',
							'jetpack-paypal-payments'
						) }
					</p>
				) : (
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
				) }
			</div>

			{ confirmDialogs }
		</div>
	);
}
