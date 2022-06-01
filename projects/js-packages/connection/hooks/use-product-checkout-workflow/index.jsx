import restApi from '@automattic/jetpack-api';
import { getProductCheckoutUrl } from '@automattic/jetpack-components';
import { useDispatch } from '@wordpress/data';
import { useEffect, useState } from 'react';
import useConnection from '../../components/use-connection';
import { STORE_ID } from '../../state/store.jsx';

const {
	registrationNonce,
	apiRoot,
	apiNonce,
	siteSuffix: defaultSiteSuffix,
} = window?.JP_CONNECTION_INITIAL_STATE ? window.JP_CONNECTION_INITIAL_STATE : {};

/**
 * Custom hook that performs the needed steps
 * to concrete the checkout workflow.
 *
 * @param {object} props              - The props passed to the hook.
 * @param {string} props.productSlug  - The WordPress product slug.
 * @param {string} props.redirectUrl  - The URI to redirect to after checkout.
 * @param {string} [props.siteSuffix] - The site suffix.
 * @param {Function} props.siteProductAvailabilityHandler - The function used to check whether the site already has the requested product. This will be checked after registration and the checkout page will be skipped if the promise returned resloves true.
 * @param {Function} props.from       - The plugin slug initiated the flow.
 * @returns {Function}				  - The useEffect hook.
 */
export default function useProductCheckoutWorkflow( {
	productSlug,
	redirectUrl,
	siteSuffix = defaultSiteSuffix,
	siteProductAvailabilityHandler = null,
	from,
} = {} ) {
	const [ hasCheckoutStarted, setCheckoutStarted ] = useState( false );
	const { registerSite } = useDispatch( STORE_ID );

	const { isUserConnected, isRegistered, handleConnectUser } = useConnection( {
		redirectUri: redirectUrl,
		from,
	} );

	// Build the checkout URL.
	const checkoutProductUrl = getProductCheckoutUrl(
		productSlug,
		siteSuffix,
		redirectUrl,
		isUserConnected
	);

	const handleAfterRegistration = () => {
		return Promise.resolve(
			siteProductAvailabilityHandler && siteProductAvailabilityHandler()
		).then( siteHasWpcomProduct => {
			if ( siteHasWpcomProduct ) {
				return handleConnectUser();
			}
			window.location.href = checkoutProductUrl;
		} );
	};

	/**
	 * Handler to run the checkout workflow.
	 *
	 * @param {Event} [event] - Event that dispatched run
	 * @returns {void}          Nothing.
	 */
	const run = event => {
		event && event.preventDefault();
		setCheckoutStarted( true );

		if ( isRegistered ) {
			return handleAfterRegistration();
		}

		registerSite( { registrationNonce, redirectUri: redirectUrl } ).then( handleAfterRegistration );
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
