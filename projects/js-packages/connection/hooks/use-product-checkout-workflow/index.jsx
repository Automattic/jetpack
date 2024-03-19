import restApi from '@automattic/jetpack-api';
import { getCalypsoOrigin } from '@automattic/jetpack-connection';
import { useDispatch, useSelect } from '@wordpress/data';
import debugFactory from 'debug';
import { useEffect, useState, useMemo } from 'react';
import useConnection from '../../components/use-connection';
import { STORE_ID } from '../../state/store.jsx';

const debug = debugFactory( 'jetpack:connection:useProductCheckoutWorkflow' );

const {
	registrationNonce,
	apiRoot,
	apiNonce,
	siteSuffix: defaultSiteSuffix,
} = window?.JP_CONNECTION_INITIAL_STATE ? window.JP_CONNECTION_INITIAL_STATE : {};
const defaultAdminUrl =
	typeof window !== 'undefined' ? window?.myJetpackInitialState?.adminUrl : null;

/**
 * Custom hook that performs the needed steps
 * to concrete the checkout workflow.
 *
 * @param {object} props                                  - The props passed to the hook.
 * @param {string} props.productSlug                      - The WordPress product slug.
 * @param {string} props.redirectUrl                      - The URI to redirect to after checkout.
 * @param {string} [props.siteSuffix]                     - The site suffix.
 * @param {string} [props.adminUrl]                       - The site wp-admin url.
 * @param {boolean} props.connectAfterCheckout            - Whether or not to conect after checkout if not connected (default false - connect before).
 * @param {Function} props.siteProductAvailabilityHandler - The function used to check whether the site already has the requested product. This will be checked after registration and the checkout page will be skipped if the promise returned resloves true.
 * @param {Function} props.from                           - The plugin slug initiated the flow.
 * @param {number} [props.quantity]                       - The quantity of the product to purchase.
 * @param {boolean} [props.useBlogIdSuffix]               - Use blog ID instead of site suffix in the checkout URL.
 * @returns {Function}                                      The useEffect hook.
 */
export default function useProductCheckoutWorkflow( {
	productSlug,
	redirectUrl,
	siteSuffix = defaultSiteSuffix,
	adminUrl = defaultAdminUrl,
	connectAfterCheckout = false,
	siteProductAvailabilityHandler = null,
	quantity = null,
	from,
	useBlogIdSuffix = false,
} = {} ) {
	debug( 'productSlug is %s', productSlug );
	debug( 'redirectUrl is %s', redirectUrl );
	debug( 'siteSuffix is %s', siteSuffix );
	debug( 'from is %s', from );
	const [ hasCheckoutStarted, setCheckoutStarted ] = useState( false );
	const { registerSite } = useDispatch( STORE_ID );

	const blogID = useSelect( select => select( STORE_ID ).getBlogId(), [ STORE_ID ] );
	debug( 'blogID is %s', blogID ?? 'undefined' );

	useBlogIdSuffix = useBlogIdSuffix && !! blogID;

	const { isUserConnected, isRegistered, handleConnectUser } = useConnection( {
		redirectUri: redirectUrl,
		from,
	} );

	const checkoutUrl = useMemo( () => {
		const origin = getCalypsoOrigin();
		const shouldConnectAfterCheckout =
			( ! isRegistered || ! isUserConnected ) && connectAfterCheckout;

		const checkoutPath = shouldConnectAfterCheckout
			? 'checkout/jetpack/'
			: `checkout/${ useBlogIdSuffix ? blogID.toString() : siteSuffix }/`;

		const quantitySuffix = quantity != null ? `:-q-${ quantity }` : '';

		const productCheckoutUrl = new URL(
			`${ origin }${ checkoutPath }${ productSlug }${ quantitySuffix }`
		);

		if ( shouldConnectAfterCheckout ) {
			productCheckoutUrl.searchParams.set( 'connect_after_checkout', true );
			productCheckoutUrl.searchParams.set( 'admin_url', adminUrl );
			/**
			 * `from_site_slug` is the Jetpack site slug (siteSuffix) passed 'from the site' via url
			 * query arg (into Calypso), for use cases when there is not a site in context (such
			 * as when Jetpack is not connected or the user is not logged in) but we need to know
			 * the site we're working with). As opposed to Calypso's use of `siteSlug`
			 * which is the site slug present when the site is in context (ie- the site is available
			 * in State, such as when the site is connected and the user is logged in).
			 */
			productCheckoutUrl.searchParams.set( 'from_site_slug', siteSuffix );
		} else {
			productCheckoutUrl.searchParams.set( 'site', siteSuffix );
		}

		productCheckoutUrl.searchParams.set( 'source', from );
		productCheckoutUrl.searchParams.set( 'redirect_to', redirectUrl );
		if ( ! isUserConnected ) {
			productCheckoutUrl.searchParams.set( 'unlinked', '1' );
		}

		return productCheckoutUrl;
	}, [
		isRegistered,
		isUserConnected,
		connectAfterCheckout,
		siteSuffix,
		quantity,
		productSlug,
		from,
		redirectUrl,
		adminUrl,
		useBlogIdSuffix,
		blogID,
	] );

	debug( 'isRegistered is %s', isRegistered );
	debug( 'isUserConnected is %s', isUserConnected );
	debug( 'connectAfterCheckout is %s', connectAfterCheckout );
	debug( 'checkoutUrl is %s', checkoutUrl );

	const handleAfterRegistration = ( redirect = null ) => {
		return Promise.resolve(
			siteProductAvailabilityHandler && siteProductAvailabilityHandler()
		).then( siteHasWpcomProduct => {
			if ( redirect ) {
				checkoutUrl.searchParams.set( 'redirect_to', redirect );
			}

			if ( siteHasWpcomProduct ) {
				debug( 'handleAfterRegistration: Site has a product associated' );
				return handleConnectUser();
			}
			debug(
				'handleAfterRegistration: Site does not have a product associated. Redirecting to checkout %s',
				checkoutUrl
			);
			window.location.href = checkoutUrl;
		} );
	};

	const connectAfterCheckoutFlow = ( redirect = null ) => {
		if ( redirect ) {
			checkoutUrl.searchParams.set( 'redirect_to', redirect );
		}

		debug( 'Redirecting to connectAfterCheckout flow: %s', checkoutUrl );

		window.location.href = checkoutUrl;
	};

	/**
	 * Handler to run the checkout workflow.
	 *
	 * @param {Event} [event] - Event that dispatched run
	 * @param {string} redirect - A possible redirect URL to go to after the checkout
	 * @returns {void}          Nothing.
	 */
	const run = ( event, redirect = null ) => {
		event && event.preventDefault();
		setCheckoutStarted( true );
		// By default we will connect first prior to checkout unless `props.connectAfterCheckout`
		// is set (true), in which we will connect after purchase is completed.
		if ( connectAfterCheckout ) {
			return connectAfterCheckoutFlow( redirect );
		}

		if ( isRegistered ) {
			return handleAfterRegistration( redirect );
		}

		registerSite( { registrationNonce, redirectUri: redirectUrl } ).then( () =>
			handleAfterRegistration( redirect )
		);
	};

	// Initialize/Setup the REST API.
	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [] );

	return {
		run,
		isRegistered,
		hasCheckoutStarted,
	};
}
