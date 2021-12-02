/**
 * External dependencies
 */
import { useEffect } from 'react';
import { useSelect, useDispatch } from '@wordpress/data';
import restApi from '@automattic/jetpack-api';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../../state/store';

export default ( { registrationNonce, redirectUri, apiRoot, apiNonce, autoTrigger, from } ) => {
	const { fetchAuthorizationUrl, registerSite, connectUser } = useDispatch( STORE_ID );
	const siteIsRegistering = useSelect( select => select( STORE_ID ).getSiteIsRegistering(), [] );
	const userIsConnecting = useSelect( select => select( STORE_ID ).getUserIsConnecting(), [] );
	const registrationError = useSelect( select => select( STORE_ID ).getRegistrationError(), [] );
	const authorizationUrl = useSelect( select => select( STORE_ID ).getAuthorizationUrl(), [] );
	const { isRegistered, isUserConnected } = useSelect(
		select => select( STORE_ID ).getConnectionStatus(),
		[]
	);

	/**
	 * Initialize the site registration process.
	 *
	 * @param {Event} [e] - Event that dispatched handleRegisterSite
	 */
	const handleRegisterSite = e => {
		e && e.preventDefault();

		const action = isRegistered
			? fetchAuthorizationUrl( redirectUri )
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
		authorizationUrl,
	};
};
