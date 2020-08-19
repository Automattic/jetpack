/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Tabs from './tabs';
import LoadingError from './loading-error';
import LoadingStatus from './loading-status';
import fetchDefaultProducts from './fetch-default-products';
import fetchStatus from './fetch-status';

const Edit = props => {
	const { attributes, className } = props;
	const { currency } = attributes;

	const [ isLoading, setIsLoading ] = useState( true );
	const [ loadingError, setLoadingError ] = useState( '' );
	const [ shouldUpgrade, setShouldUpgrade ] = useState( false );
	const [ stripeConnectUrl, setStripeConnectUrl ] = useState( false );
	const [ products, setProducts ] = useState( [] );
	const [ siteSlug, setSiteSlug ] = useState( '' );

	const apiError = message => {
		setLoadingError( message );
		setIsLoading( false );
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
			setLoadingError( __( 'Could not load data from WordPress.com.', 'jetpack' ) );
			setIsLoading( false );
			return;
		}
		setShouldUpgrade( result.should_upgrade_to_access_memberships );
		setStripeConnectUrl( result.connect_url );
		setSiteSlug( result.site_slug );

		const filteredProducts = filterProducts( result.products );

		if ( hasRequiredProducts( filteredProducts ) ) {
			setProducts( filteredProducts );
			setIsLoading( false );
			return;
		}

		// Set fake products when plan should be upgraded or there is no connection to Stripe so users can still try the
		// block in the editor.
		if ( result.should_upgrade_to_access_memberships || result.connect_url ) {
			setIsLoading( false );
			setProducts( {
				'one-time': -1,
				'1 month': -1,
				'1 year': -1,
			} );
			return;
		}

		// Only create products if we have the correct plan and stripe connection.
		fetchDefaultProducts( currency ).then( defaultProducts => {
			setIsLoading( false );
			return setProducts( filterProducts( defaultProducts ) );
		}, apiError );
	};

	useEffect( () => {
		const updateData = () => fetchStatus( 'donation' ).then( mapStatusToState, apiError );
		updateData();
	}, [ currency ] );

	if ( isLoading ) {
		return <LoadingStatus className={ className } />;
	}

	if ( loadingError ) {
		return <LoadingError className={ className } error={ loadingError } />;
	}

	return (
		<Tabs
			{ ...props }
			products={ products }
			shouldUpgrade={ shouldUpgrade }
			siteSlug={ siteSlug }
			stripeConnectUrl={ stripeConnectUrl }
		/>
	);
};

export default Edit;
