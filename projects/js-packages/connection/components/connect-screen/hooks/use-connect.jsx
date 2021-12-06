/**
 * External dependencies
 */
import { useEffect } from 'react';
import { useSelect, useDispatch, resolveSelect } from '@wordpress/data';
import restApi from '@automattic/jetpack-api';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../../state/store';

export default ( { registrationNonce, redirectUri, apiRoot, apiNonce, autoTrigger, from } ) => {
	const getAuthorizationUrl = resolveSelect( STORE_ID ).getAuthorizationUrl;
	const { registerSite, connectUser } = useDispatch( STORE_ID );
	const {
		getSiteIsRegistering,
		getUserIsConnecting,
		getRegistrationError,
		getConnectionStatus,
	} = useSelect( STORE_ID );

	const { isRegistered, isUserConnected } = getConnectionStatus();
	const siteIsRegistering = getSiteIsRegistering();
	const userIsConnecting = getUserIsConnecting();
	const registrationError = getRegistrationError();

	/**
	 * Initialize the site registration process.
	 *
	 * @param {Event} [e] - Event that dispatched handleRegisterSite
	 */
	const handleRegisterSite = e => {
		e && e.preventDefault();

		const action = isRegistered
			? getAuthorizationUrl()
			: registerSite( { registrationNonce, redirectUri } );

		action.then( () => connectUser( { from } ) );
	};

	/**
	 * Initialize/Setup the REST API.
	 */
	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [ apiRoot, apiNonce ] );

	/**
	 * Auto-trigger the flow, only do it once.
	 */
	useEffect( () => {
		if ( autoTrigger && ! siteIsRegistering && ! userIsConnecting ) {
			handleRegisterSite();
		}
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	return {
		handleRegisterSite,
		isRegistered,
		isUserConnected,
		siteIsRegistering,
		userIsConnecting,
		registrationError,
	};
};
