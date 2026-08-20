import analytics from '@automattic/jetpack-analytics';
import { getProductCheckoutUrl } from '@automattic/jetpack-components';
import {
	useConnection,
	useProductCheckoutWorkflow as useConnectionCheckoutWorkflow,
} from '@automattic/jetpack-connection';
import { select as syncSelect } from '@wordpress/data';
import { useState } from 'react';
import { STORE_ID } from 'store';

const { siteSuffix: defaultSiteSuffix } = window?.JP_CONNECTION_INITIAL_STATE
	? window.JP_CONNECTION_INITIAL_STATE
	: {};

/**
 * Custom hook that performs the needed steps to complete the checkout workflow.
 *
 * Delegates registration, the connect-after-checkout siteless flow, and checkout-URL
 * construction to `@automattic/jetpack-connection`'s `useProductCheckoutWorkflow`, so an
 * unregistered/unlinked site is routed through Calypso's `checkout/jetpack/` route
 * instead of a site-scoped URL Calypso can't resolve (which falls back to the site
 * selector). Two things stay local, since neither belongs in the shared hook: WPCOM
 * (Simple) sites, which have no "connection" concept in that package's PHP layer and so
 * must skip registration/connect entirely; and Search's own purchase-button analytics
 * event.
 *
 * @param {object}   props                                - The props passed to the hook.
 * @param {string}   props.productSlug                    - The WordPress product slug.
 * @param {string}   props.redirectUri                    - The URI to redirect to after checkout.
 * @param {string}   [props.siteSuffix]                   - The site suffix.
 * @param {string}   [props.blogID]                       - The blog ID.
 * @param {string}   [props.adminUrl]                     - The site wp-admin URL.
 * @param {Function} props.siteProductAvailabilityHandler - The function used to check whether the site already has the requested product. This will be checked after registration and the checkout page will be skipped if the promise returned resloves true.
 * @param {Function} props.from                           - The plugin slug initiated the flow.
 * @param {Function} props.isWpcom                        - Whether it's WPCOM site.
 * @return {{run: Function, isRegistered: boolean, hasCheckoutStarted: boolean}} The checkout workflow handle.
 */
export default function useProductCheckoutWorkflow( {
	productSlug,
	redirectUri,
	siteSuffix = defaultSiteSuffix,
	blogID = null,
	adminUrl,
	siteProductAvailabilityHandler = null,
	from,
	isWpcom = false,
} = {} ) {
	const [ hasCheckoutStarted, setCheckoutStarted ] = useState( false );

	const { isUserConnected, isRegistered } = useConnection( { redirectUri, from } );

	// `useBlogIdSuffix` re-checks truthiness against the connection package's own
	// `getBlogId()` selector, not this `blogID` prop -- both ultimately read the same
	// `Jetpack_Options::get_option( 'id' )` PHP option within the same request, via two
	// separate `window` initial-state globals, so they agree in practice.
	const { run: runConnectedCheckout } = useConnectionCheckoutWorkflow( {
		productSlug,
		redirectUrl: redirectUri,
		siteSuffix,
		adminUrl,
		from,
		siteProductAvailabilityHandler,
		connectAfterCheckout: ! isRegistered || ! isUserConnected,
		useBlogIdSuffix: !! blogID,
	} );

	/**
	 * Handler to run the checkout workflow.
	 *
	 * @param {Event} [event] - Event that dispatched run
	 * @return {void}          Nothing.
	 */
	const run = event => {
		event && event.preventDefault();
		setCheckoutStarted( true );

		const tracksUser = syncSelect( STORE_ID ).getWpcomUser();
		if ( tracksUser ) {
			analytics.initialize( tracksUser.ID, tracksUser.login, {
				blog_id: syncSelect( STORE_ID ).getBlogId(),
			} );
		}
		analytics.tracks.recordEvent( productSlug + '_purchase_button_click', {
			isWpcom,
			current_version: syncSelect( STORE_ID ).getVersion(),
		} );

		if ( isWpcom ) {
			// WPCOM sites are already fully connected -- skip registration/connect entirely.
			window.location.href = getProductCheckoutUrl(
				productSlug,
				blogID || siteSuffix,
				redirectUri,
				true
			);
			return;
		}

		runConnectedCheckout();
	};

	return {
		run,
		isRegistered: isRegistered || isWpcom,
		hasCheckoutStarted,
	};
}
