/**
 * External dependencies
 */
import { useEffect } from 'react';
import { useSelect, useDispatch } from '@wordpress/data';
import restApi from '@automattic/jetpack-api';
import { getProductCheckoutUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../state/store.jsx';

const { registrationNonce, apiRoot, apiNonce } = window?.JP_CONNECTION_INITIAL_STATE
	? window.JP_CONNECTION_INITIAL_STATE
	: {};

/**
 * Custom hook that handles the checkout workflow.
 *
 * @param {object} props             - The props passed to the component.
 * @param {string} props.productSlug - The product slug.
 * @param {string} props.siteSuffix  - The site suffix.
 * @param {string} props.redirectUri - The URI to redirect to after checkout.
 * @returns {Function}				 - The useEffect hook.
 */
export default function useProductCheckoutWorkflow( {
	productSlug,
	siteSuffix,
	redirectUri,
} = {} ) {
	const { registerSite } = useDispatch( STORE_ID );

	const { isUserConnected } = useSelect( select => select( STORE_ID ).getConnectionStatus() );

	// Build the checkout URL.
	const checkoutProductUrl = getProductCheckoutUrl(
		productSlug,
		siteSuffix,
		redirectUri,
		isUserConnected
	);

	/**
	 * Initialize the site registration process.
	 *
	 * @param {Event} [event] - Event that dispatched onCheckoutHandler
	 */
	const onCheckoutHandler = event => {
		event && event.preventDefault();

		registerSite( { registrationNonce, redirectUri } ).then( () => {
			if ( checkoutProductUrl ) {
				window.location = checkoutProductUrl;
			}
		} );
	};

	/**
	 * Initialize/Setup the REST API.
	 */
	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [] );

	return {
		onCheckoutHandler,
	};
}
