/**
 * External dependencies
 */
import { useEffect, useState } from 'react';
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
 * Custom hook that performs the needed steps
 * to concrete the checkout workflow.
 *
 * @param {object} props             - The props passed to the hook.
 * @param {string} props.productSlug - The WordPress product slug.
 * @param {string} props.siteSuffix  - The site suffix.
 * @param {string} props.redirectUrl - The URI to redirect to after checkout.
 * @returns {Function}				 - The useEffect hook.
 */
export default function useProductCheckoutWorkflow( {
	productSlug,
	siteSuffix,
	redirectUrl,
} = {} ) {
	const [ hasCheckoutStarted, setCheckoutStarted ] = useState( false );
	const { registerSite } = useDispatch( STORE_ID );

	const { isUserConnected, isRegistered } = useSelect( select =>
		select( STORE_ID ).getConnectionStatus()
	);

	// Build the checkout URL.
	const checkoutProductUrl = getProductCheckoutUrl(
		productSlug,
		siteSuffix,
		redirectUrl,
		isUserConnected
	);

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
			return ( window.location.href = checkoutProductUrl );
		}

		registerSite( { registrationNonce, redirectUrl } ).then( () => {
			window.location = checkoutProductUrl;
		} );
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
