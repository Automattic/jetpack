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
	const { registerSite, connectUser } = useDispatch( STORE_ID );

	const registrationError = useSelect( select => select( STORE_ID ).getRegistrationError() );
	const { siteIsRegistering, userIsConnecting, isRegistered, isUserConnected } = useSelect(
		select => ( {
			siteIsRegistering: select( STORE_ID ).getSiteIsRegistering(),
			userIsConnecting: select( STORE_ID ).getUserIsConnecting(),
			...select( STORE_ID ).getConnectionStatus(),
		} )
	);

	/**
	 * Initialize the site registration process.
	 *
	 * @param {Event} [e] - Event that dispatched handleRegisterSite
	 */
	const handleRegisterSite = e => {
		e && e.preventDefault();

		if ( isRegistered ) {
			connectUser( { from } );
		} else {
			registerSite( { registrationNonce, redirectUri } ).then( () => {
				connectUser( { from } );
			} );
		}
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
