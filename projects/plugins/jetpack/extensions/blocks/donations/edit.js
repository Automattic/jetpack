import { Spinner } from '@automattic/jetpack-components';
import { useBlockProps } from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import ConnectBanner from '../../shared/components/connect-banner';
import { StripeNudge } from '../../shared/components/stripe-nudge';
import { SUPPORTED_CURRENCIES } from '../../shared/currencies';
import getConnectUrl from '../../shared/get-connect-url';
import useIsUserConnected from '../../shared/use-is-user-connected';
import { store as membershipProductsStore } from '../../store/membership-products';
import { STORE_NAME as MEMBERSHIPS_PRODUCTS_STORE } from '../../store/membership-products/constants';
import fetchDefaultProducts from './fetch-default-products';
import fetchStatus from './fetch-status';
import FirstTimeModal from './first-time-modal';
import './first-time-modal.scss';
import LoadingError from './loading-error';
import Tabs from './tabs';

const Edit = props => {
	const { attributes, setAttributes } = props;
	const { currency } = attributes;

	const blockProps = useBlockProps();
	const [ loadingError, setLoadingError ] = useState( '' );
	const [ products, setProducts ] = useState( [] );
	const [ showFirstTimeModal, setShowFirstTimeModal ] = useState( false );
	const isUserConnected = useIsUserConnected();

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
		if ( currentUser?.id && hasDismissedDonationWarning === false ) {
			setShowFirstTimeModal( true );
		}
	}, [ currentUser, hasDismissedDonationWarning ] );

	useEffect( () => {
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
	] );

	let content;

	if ( ! isUserConnected ) {
		content = (
			<ConnectBanner
				block="Donations Form"
				explanation={ __( 'Connect your WordPress.com account to enable donations.', 'jetpack' ) }
			/>
		);
	} else if ( loadingError ) {
		content = <LoadingError error={ loadingError } />;
	} else if ( stripeConnectUrl ) {
		// Need to connect Stripe first
		content = <StripeNudge blockName="donations" />;
	} else if ( ! currency ) {
		// Memberships settings are still loading
		content = <Spinner color="black" />;
	} else {
		content = <Tabs { ...props } products={ products } />;
	}

	// When the first time modal is closed, update the user meta to mark the donation warning as dismissed
	const handleModalClose = async () => {
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
	};

	return (
		<div { ...blockProps }>
			{ content }
			{ showFirstTimeModal && <FirstTimeModal onClose={ handleModalClose } /> }
		</div>
	);
};

export default Edit;
