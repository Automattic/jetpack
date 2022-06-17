import restApi from '@automattic/jetpack-api';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from 'react';
import { STORE_ID } from '../../state/store';

const initialState = window?.JP_CONNECTION_INITIAL_STATE ? window.JP_CONNECTION_INITIAL_STATE : {};

export default ( {
	registrationNonce = initialState.registrationNonce,
	apiRoot = initialState.apiRoot,
	apiNonce = initialState.apiNonce,
	redirectUri,
	autoTrigger,
	from,
	skipUserConnection,
} = {} ) => {
	const { registerSite, connectUser, refreshConnectedPlugins } = useDispatch( STORE_ID );

	const registrationError = useSelect( select => select( STORE_ID ).getRegistrationError() );
	const {
		siteIsRegistering,
		userIsConnecting,
		userConnectionData,
		connectedPlugins,
		isRegistered,
		isUserConnected,
		hasConnectedOwner,
	} = useSelect( select => ( {
		siteIsRegistering: select( STORE_ID ).getSiteIsRegistering(),
		userIsConnecting: select( STORE_ID ).getUserIsConnecting(),
		userConnectionData: select( STORE_ID ).getUserConnectionData(),
		connectedPlugins: select( STORE_ID ).getConnectedPlugins(),
		...select( STORE_ID ).getConnectionStatus(),
	} ) );

	const handleConnectUser = () => {
		if ( ! skipUserConnection ) {
			connectUser( { from, redirectUri } );
		} else if ( redirectUri ) {
			window.location = redirectUri;
		}
	};

	/**
	 * Initialize the site registration process.
	 *
	 * @param {Event} [e] - Event that dispatched handleRegisterSite
	 */
	const handleRegisterSite = e => {
		e && e.preventDefault();

		if ( isRegistered ) {
			handleConnectUser();
		} else {
			registerSite( { registrationNonce, redirectUri } ).then( () => {
				handleConnectUser();
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
		handleConnectUser,
		refreshConnectedPlugins,
		isRegistered,
		isUserConnected,
		siteIsRegistering,
		userIsConnecting,
		registrationError,
		userConnectionData,
		hasConnectedOwner,
		connectedPlugins,
	};
};
