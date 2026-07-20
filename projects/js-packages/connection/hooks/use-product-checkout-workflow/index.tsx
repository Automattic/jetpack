import restApi from '@automattic/jetpack-api';
import { getScriptData } from '@automattic/jetpack-script-data';
import { Button, Modal } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';
import { useCallback, useEffect, useState, useMemo } from 'react';
import useConnection from '../../components/use-connection';
import getCalypsoOrigin from '../../helpers/get-calypso-origin';
import { STORE_ID } from '../../state/store.jsx';
import type { UseProductCheckoutWorkflowProps } from './types';

const debug = debugFactory( 'jetpack:connection:useProductCheckoutWorkflow' );

const {
	registrationNonce,
	apiRoot,
	apiNonce,
	siteSuffix: defaultSiteSuffix,
} = window?.JP_CONNECTION_INITIAL_STATE || getScriptData()?.connection || {};
const defaultAdminUrl = () =>
	typeof window !== 'undefined'
		? ( window as Window & { myJetpackInitialState?: { adminUrl?: string } } )
				?.myJetpackInitialState?.adminUrl
		: null;

/**
 * Custom hook that performs the needed steps
 * to concrete the checkout workflow.
 *
 * @param {UseProductCheckoutWorkflowProps} props - The checkout workflow properties.
 * @return The checkout workflow hook data.
 */
export default function useProductCheckoutWorkflow(
	{
		productSlug,
		redirectUrl,
		siteSuffix = defaultSiteSuffix,
		adminUrl = defaultAdminUrl(),
		connectAfterCheckout = false,
		siteProductAvailabilityHandler = null,
		quantity = null,
		from,
		useBlogIdSuffix = false,
	}: UseProductCheckoutWorkflowProps = {} as UseProductCheckoutWorkflowProps
) {
	debug( 'productSlug is %s', productSlug );
	debug( 'redirectUrl is %s', redirectUrl );
	debug( 'siteSuffix is %s', siteSuffix );
	debug( 'from is %s', from );
	const [ hasCheckoutStarted, setCheckoutStarted ] = useState( false );
	const [ isOfflineNoticeOpen, setOfflineNoticeOpen ] = useState( false );
	const { registerSite } = useDispatch( STORE_ID );

	const blogID = useSelect(
		select => ( select( STORE_ID ) as { getBlogId: () => string } ).getBlogId(),
		[]
	);
	debug( 'blogID is %s', blogID ?? 'undefined' );

	useBlogIdSuffix = useBlogIdSuffix && !! blogID;

	const { isUserConnected, isRegistered, handleConnectUser, offlineMode } = useConnection( {
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
			productCheckoutUrl.searchParams.set( 'connect_after_checkout', 'true' );
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
			window.location.href = checkoutUrl.toString();
		} );
	};

	const connectAfterCheckoutFlow = ( redirect = null ) => {
		if ( redirect ) {
			checkoutUrl.searchParams.set( 'redirect_to', redirect );
		}

		debug( 'Redirecting to connectAfterCheckout flow: %s', checkoutUrl );

		window.location.href = checkoutUrl.toString();
	};

	/**
	 * Handler to run the checkout workflow.
	 *
	 * @param {object}   [event]              - Event that dispatched run.
	 * @param {Function} event.preventDefault - Prevents the default event behavior.
	 * @param {string}   redirect             - A possible redirect URL to go to after the checkout.
	 * @return {void} Nothing.
	 */
	const run = ( event?: { preventDefault: () => void }, redirect: string | null = null ) => {
		event && event.preventDefault();

		// A local development site's URL isn't the one the purchase would attach
		// to (that has to be the live, publicly reachable site), so checkout
		// itself would be meaningless here -- explain that instead of starting
		// a workflow that can't complete correctly.
		if ( offlineMode?.isActive ) {
			setOfflineNoticeOpen( true );
			return;
		}

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

	const closeOfflineNotice = useCallback( () => setOfflineNoticeOpen( false ), [] );

	const offlineNoticeModal = isOfflineNoticeOpen ? (
		<Modal
			title={ __( 'This site is in local development mode', 'jetpack-connection-js' ) }
			onRequestClose={ closeOfflineNotice }
			className="jp-connection__checkout-offline-modal"
		>
			<p>
				{ __(
					'Purchases are tied to your site’s URL, so they need to be made from your live, publicly reachable site rather than from here.',
					'jetpack-connection-js'
				) }
			</p>
			<Button variant="primary" onClick={ closeOfflineNotice }>
				{ __( 'Got it', 'jetpack-connection-js' ) }
			</Button>
		</Modal>
	) : null;

	return {
		run,
		isRegistered,
		hasCheckoutStarted,
		offlineNoticeModal,
	};
}
