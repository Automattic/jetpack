import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { store as blockEditorStore, useBlockProps } from '@wordpress/block-editor';
import { Icon, Spinner } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import ConnectBanner from '../../shared/components/connect-banner';
import { StripeNudge } from '../../shared/components/stripe-nudge';
import { SUPPORTED_CURRENCIES } from '../../shared/currencies';
import getConnectUrl from '../../shared/get-connect-url';
import useIsUserConnected from '../../shared/use-is-user-connected';
import { store as membershipProductsStore } from '../../store/membership-products';
import { STORE_NAME as MEMBERSHIPS_PRODUCTS_STORE } from '../../store/membership-products/constants';
import buildCustomStyles from './build-custom-styles';
import Controls from './controls';
import fetchDefaultProducts from './fetch-default-products';
import fetchStatus from './fetch-status';
import FirstTimeModal from './first-time-modal';
import { TRIGGER_ICONS } from './icons';
import './first-time-modal.scss';
import LoadingError from './loading-error';
import StyleControls from './style-controls';
import Tabs from './tabs';

// Dedupe block_loaded event firings across React re-mounts within the same editor session.
const blockLoadedFiredClientIds = new Set();

const Edit = props => {
	const { attributes, setAttributes, clientId } = props;
	const {
		currency,
		tabsAppearance,
		className,
		displayMode,
		triggerButtonText,
		triggerIcon,
		triggerSticky,
	} = attributes;
	const { tracks } = useAnalytics();

	// Migrate legacy blocks that used the block-style variation
	// (`is-style-buttons` saved into `className`) over to the new
	// `tabsAppearance` attribute. Strips the class so the toggle in the
	// Appearance control reflects reality and can switch back to "Tabs".
	useEffect( () => {
		if ( typeof className === 'string' && className.split( ' ' ).includes( 'is-style-buttons' ) ) {
			const cleaned = className
				.split( ' ' )
				.filter( c => c !== 'is-style-buttons' )
				.join( ' ' )
				.trim();
			setAttributes( {
				tabsAppearance: 'buttons',
				className: cleaned || undefined,
			} );
		}
	}, [ className, setAttributes ] );

	const instanceId = useInstanceId( Edit, 'jp-donations' );
	const customStyles = buildCustomStyles( attributes, `.${ instanceId }` );

	const wrapperClassName = [
		instanceId,
		tabsAppearance === 'buttons' && 'is-style-buttons',
		displayMode === 'modal' && 'is-display-modal',
		displayMode === 'modal' && triggerSticky && 'is-sticky',
	]
		.filter( Boolean )
		.join( ' ' );
	const blockProps = useBlockProps( { className: wrapperClassName } );
	const [ loadingError, setLoadingError ] = useState( '' );
	const [ products, setProducts ] = useState( [] );
	const [ showFirstTimeModal, setShowFirstTimeModal ] = useState( false );
	const isUserConnected = useIsUserConnected();

	// When the inserter renders this block as an example/preview (it declares
	// `"example": {}` in block.json), Gutenberg mounts this Edit component inside
	// a BlockPreview with `isPreviewMode` set. We use this flag to skip all editor
	// side effects (Stripe status fetch, post-saving lock, first-time modal,
	// analytics) so hovering the block in the inserter doesn't flicker the screen,
	// lock post saving, or fire tracking events. Mirrors the `map` block.
	const isPreviewMode = useSelect(
		select => select( blockEditorStore ).getSettings().isPreviewMode,
		[]
	);

	const { lockPostSaving, unlockPostSaving } = useDispatch( 'core/editor' );
	const { getEntityRecord, getCurrentUser } = useSelect( 'core' );
	const { editEntityRecord, saveEditedEntityRecord } = useDispatch( 'core' );
	const post = useSelect( select => select( 'core/editor' ).getCurrentPost(), [] );
	const isPostSavingLocked = useSelect(
		select => select( 'core/editor' ).isPostSavingLocked(),
		[]
	);

	const stripeConnectUrl = useSelect(
		select => select( membershipProductsStore ).getConnectUrl() || '',
		[]
	);

	const { setConnectUrl, setConnectedAccountDefaultCurrency } = useDispatch(
		MEMBERSHIPS_PRODUCTS_STORE
	);

	const stripeDefaultCurrency = useSelect( select =>
		select( MEMBERSHIPS_PRODUCTS_STORE ).getConnectedAccountDefaultCurrency()
	);

	// Fire jetpack_donations_block_loaded once per clientId per session.
	// Wait until either Stripe state has resolved (stripeConnectUrl OR
	// stripeDefaultCurrency populated) or the user is not Jetpack-connected,
	// so the stripe_connected snapshot is accurate.
	useEffect( () => {
		if ( isPreviewMode || ! clientId || blockLoadedFiredClientIds.has( clientId ) ) {
			return;
		}
		const stripeStateResolved = !! stripeConnectUrl || !! stripeDefaultCurrency;
		if ( isUserConnected && ! stripeStateResolved ) {
			return;
		}
		blockLoadedFiredClientIds.add( clientId );
		tracks.recordEvent( 'jetpack_donations_block_loaded', {
			feature: 'donations',
			surface: 'block_editor',
			is_user_connected: !! isUserConnected,
			stripe_connected: isUserConnected ? ! stripeConnectUrl : null,
		} );
	}, [
		clientId,
		isUserConnected,
		stripeConnectUrl,
		stripeDefaultCurrency,
		tracks,
		isPreviewMode,
	] );

	useEffect( () => {
		if ( ! currency && stripeDefaultCurrency && ! isPostSavingLocked ) {
			const uppercasedStripeCurrency = stripeDefaultCurrency.toUpperCase();
			const isCurrencySupported = !! SUPPORTED_CURRENCIES[ uppercasedStripeCurrency ];
			if ( isCurrencySupported ) {
				// If no currency is available, default to the stripe one
				setAttributes( { currency: uppercasedStripeCurrency } );
			} else {
				// We default to USD
				setAttributes( { currency: 'USD' } );
			}
		}
	}, [ currency, stripeDefaultCurrency, isPostSavingLocked, setAttributes ] );

	const apiError = message => {
		setLoadingError( message );
	};

	const hasRequiredProducts = productIdsPerInterval => {
		const intervals = Object.keys( productIdsPerInterval );

		return (
			intervals.includes( 'one-time' ) &&
			intervals.includes( '1 month' ) &&
			intervals.includes( '1 year' )
		);
	};

	//
	// Check if this is the first time using the donations block
	//

	// Add this to preload the user entity
	const currentUser = getCurrentUser();
	useEffect( () => {
		if ( currentUser?.id ) {
			// Ensure the user entity is loaded
			getEntityRecord( 'root', 'user', currentUser.id );
		}
	}, [ currentUser?.id, getEntityRecord ] );

	const hasDismissedDonationWarning =
		currentUser?.meta?.jetpack_donation_warning_dismissed || false;

	// Show the modal if the user has not dismissed the warning
	useEffect( () => {
		if ( isPreviewMode ) {
			return;
		}
		if ( currentUser?.id && hasDismissedDonationWarning === false ) {
			setShowFirstTimeModal( true );
		}
	}, [ currentUser, hasDismissedDonationWarning, isPreviewMode ] );

	useEffect( () => {
		if ( isPreviewMode ) {
			return;
		}

		lockPostSaving( 'donations' );

		const filterProducts = productList =>
			productList.reduce(
				( filteredProducts, { id, currency: productCurrency, type, interval } ) => {
					if ( productCurrency === currency && type === 'donation' ) {
						filteredProducts[ interval ] = id;
					}
					return filteredProducts;
				},
				{}
			);

		fetchStatus( 'donation' ).then( result => {
			if ( ( ! result && typeof result !== 'object' ) || result.errors ) {
				unlockPostSaving( 'donations' );
				setLoadingError( __( 'Could not load data from WordPress.com.', 'jetpack' ) );
				return;
			}
			setConnectUrl( getConnectUrl( post.id, result.connect_url ) );
			setConnectedAccountDefaultCurrency(
				result?.connected_account_default_currency?.toUpperCase()
			);

			const filteredProducts = filterProducts( result.products );

			if ( hasRequiredProducts( filteredProducts ) ) {
				setProducts( filteredProducts );
				unlockPostSaving( 'donations' );
				return;
			}

			// Set fake products when there is no connection to Stripe so users can still try the block in the editor.
			if ( result.connect_url ) {
				setProducts( {
					'one-time': -1,
					'1 month': -1,
					'1 year': -1,
				} );
				unlockPostSaving( 'donations' );
				return;
			}

			if ( currency ) {
				// Only create products if we have the correct plan and stripe connection.
				fetchDefaultProducts( currency ).then( defaultProducts => {
					setProducts( filterProducts( defaultProducts ) );
					unlockPostSaving( 'donations' );
				}, apiError );
			}

			unlockPostSaving( 'donations' );
		}, apiError );
	}, [
		lockPostSaving,
		currency,
		post.id,
		setConnectUrl,
		setConnectedAccountDefaultCurrency,
		unlockPostSaving,
		isPreviewMode,
	] );

	// In preview/example mode the Stripe status fetch is skipped, so fall back to
	// placeholder products and a valid currency to render a representative form
	// rather than a perpetual spinner or a "connect Stripe" nudge.
	const previewProducts = { 'one-time': -1, '1 month': -1, '1 year': -1 };
	const effectiveProducts = isPreviewMode ? previewProducts : products;
	const effectiveProps =
		isPreviewMode && ! currency
			? { ...props, attributes: { ...attributes, currency: 'USD' } }
			: props;

	let content;

	if ( ! isPreviewMode && ! isUserConnected ) {
		content = (
			<ConnectBanner
				block="Donations Form"
				explanation={ __( 'Connect your WordPress.com account to enable donations.', 'jetpack' ) }
			/>
		);
	} else if ( ! isPreviewMode && loadingError ) {
		content = <LoadingError error={ loadingError } />;
	} else if ( ! isPreviewMode && stripeConnectUrl ) {
		// Need to connect Stripe first
		content = <StripeNudge blockName="donations" />;
	} else if ( ! isPreviewMode && ! currency ) {
		// Memberships settings are still loading
		content = <Spinner />;
	} else if ( displayMode === 'modal' ) {
		const triggerIconEntry = TRIGGER_ICONS.find( ( { key } ) => key === triggerIcon );
		const triggerLabel = triggerButtonText || __( 'Donate', 'jetpack' );
		content = (
			<>
				<Controls { ...props } />
				<button
					className="donations__trigger-button wp-block-button__link"
					tabIndex={ -1 }
					aria-hidden="true"
				>
					{ triggerIconEntry && triggerIcon !== 'none' && (
						<Icon className="donations__trigger-icon" icon={ triggerIconEntry.icon } size={ 20 } />
					) }
					{ triggerLabel }
				</button>
			</>
		);
	} else {
		content = <Tabs { ...effectiveProps } products={ effectiveProducts } />;
	}

	// When the first time modal is closed, update the user meta to mark the donation warning as dismissed
	const handleModalClose = useCallback( async () => {
		setShowFirstTimeModal( false );

		if ( ! currentUser?.id ) {
			// eslint-disable-next-line no-console
			console.error( 'Cannot update user meta: User not loaded' );
			return;
		}

		try {
			await editEntityRecord( 'root', 'user', currentUser.id, {
				meta: {
					jetpack_donation_warning_dismissed: true,
				},
			} );
			await saveEditedEntityRecord( 'root', 'user', currentUser.id );
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error( 'Failed to update user meta:', error );
		}
	}, [ currentUser, editEntityRecord, saveEditedEntityRecord ] );

	return (
		<div { ...blockProps }>
			<StyleControls attributes={ attributes } setAttributes={ setAttributes } />
			{ customStyles && <style>{ customStyles }</style> }
			{ content }
			{ showFirstTimeModal && <FirstTimeModal onClose={ handleModalClose } /> }
		</div>
	);
};

export default Edit;
