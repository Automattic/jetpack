import { useDispatch, useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import getConnectUrl from '../../shared/get-connect-url';
import { STORE_NAME as MEMBERSHIPS_PRODUCTS_STORE } from '../../store/membership-products/constants';
import fetchDefaultProducts from './fetch-default-products';
import fetchStatus from './fetch-status';
import LoadingError from './loading-error';
import Tabs from './tabs';

const Edit = props => {
	const { attributes, className, setAttributes } = props;
	const { currency } = attributes;

	const [ loadingError, setLoadingError ] = useState( '' );
	const [ products, setProducts ] = useState( [] );

	const { lockPostSaving, unlockPostSaving } = useDispatch( 'core/editor' );
	const post = useSelect( select => select( 'core/editor' ).getCurrentPost(), [] );
	const { setShouldUpgrade, setConnectUrl } = useDispatch( MEMBERSHIPS_PRODUCTS_STORE );
	useEffect( () => {
		setAttributes( { fallbackLinkUrl: post.link } );
	}, [ post.link, setAttributes ] );

	const apiError = message => {
		setLoadingError( message );
	};

	const filterProducts = productList =>
		productList.reduce( ( filteredProducts, { id, currency: productCurrency, type, interval } ) => {
			if ( productCurrency === currency && type === 'donation' ) {
				filteredProducts[ interval ] = id;
			}
			return filteredProducts;
		}, {} );

	const hasRequiredProducts = productIdsPerInterval => {
		const intervals = Object.keys( productIdsPerInterval );

		return (
			intervals.includes( 'one-time' ) &&
			intervals.includes( '1 month' ) &&
			intervals.includes( '1 year' )
		);
	};

	const mapStatusToState = result => {
		if ( ( ! result && typeof result !== 'object' ) || result.errors ) {
			unlockPostSaving( 'donations' );
			setLoadingError( __( 'Could not load data from WordPress.com.', 'jetpack' ) );
			return;
		}
		setShouldUpgrade( result.should_upgrade_to_access_memberships );
		setConnectUrl( getConnectUrl( post.id, result.connect_url ) );

		const filteredProducts = filterProducts( result.products );

		if ( hasRequiredProducts( filteredProducts ) ) {
			setProducts( filteredProducts );
			unlockPostSaving( 'donations' );
			return;
		}

		// Set fake products when plan should be upgraded or there is no connection to Stripe so users can still try the
		// block in the editor.
		if ( result.should_upgrade_to_access_memberships || result.connect_url ) {
			setProducts( {
				'one-time': -1,
				'1 month': -1,
				'1 year': -1,
			} );
			unlockPostSaving( 'donations' );
			return;
		}

		// Only create products if we have the correct plan and stripe connection.
		fetchDefaultProducts( currency ).then( defaultProducts => {
			setProducts( filterProducts( defaultProducts ) );
			unlockPostSaving( 'donations' );
		}, apiError );
	};

	useEffect( () => {
		lockPostSaving( 'donations' );
		const updateData = () => fetchStatus( 'donation' ).then( mapStatusToState, apiError );
		updateData();
	}, [ currency ] );

	if ( loadingError ) {
		return <LoadingError className={ className } error={ loadingError } />;
	}

	return <Tabs { ...props } products={ products } />;
};

export default Edit;
