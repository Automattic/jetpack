import restApi from '@automattic/jetpack-api';
import { getScriptData } from '@automattic/jetpack-script-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from 'react';
import { STORE_ID } from '../../state/store';

const initialState = window?.JP_CONNECTION_INITIAL_STATE || getScriptData()?.connection || {};

/**
 * Hook to handle the connection process.
 *
 * @param {object}  [props]                    - The props.
 * @param {string}  [props.registrationNonce]  - The registration nonce.
 * @param {string}  [props.apiRoot]            - The API root URL.
 * @param {string}  [props.apiNonce]           - The API nonce.
 * @param {string}  [props.redirectUri]        - The redirect URI.
 * @param {boolean} [props.autoTrigger]        - Whether to auto-trigger the connection process.
 * @param {string}  [props.from]               - Value that represents the redirect origin.
 * @param {boolean} [props.skipUserConnection] - Whether to skip user connection.
 * @param {boolean} [props.skipPricingPage]    - Whether to skip the pricing page.
 * @return {object} The connection state and handlers.
 */
export default function useConnection( {
	registrationNonce = initialState.registrationNonce,
	apiRoot = initialState.apiRoot,
	apiNonce = initialState.apiNonce,
	redirectUri,
	autoTrigger,
	from,
	skipUserConnection,
	skipPricingPage,
} = {} ) {
	const { registerSite, connectUser, refreshConnectedPlugins } = useDispatch( STORE_ID );

	const registrationError = useSelect( select => select( STORE_ID ).getRegistrationError() );
	const {
		siteIsRegistering,
		userIsConnecting,
		userConnectionData,
		connectedPlugins,
		connectionErrors,
		isRegistered,
		isUserConnected,
		hasConnectedOwner,
		isOfflineMode,
	} = useSelect( select => ( {
		siteIsRegistering: select( STORE_ID ).getSiteIsRegistering(),
		userIsConnecting: select( STORE_ID ).getUserIsConnecting(),
		userConnectionData: select( STORE_ID ).getUserConnectionData(),
		connectedPlugins: select( STORE_ID ).getConnectedPlugins(),
		connectionErrors: select( STORE_ID ).getConnectionErrors(),
		isOfflineMode: select( STORE_ID ).getIsOfflineMode(),
		...select( STORE_ID ).getConnectionStatus(),
	} ) );

	/**
	 * User register process handler.
	 *
	 * @return {Promise} - Promise which resolves when the product status is activated.
	 */
	const handleConnectUser = () => {
		if ( ! skipUserConnection ) {
			return connectUser( { from, redirectUri, skipPricingPage } );
		} else if ( redirectUri ) {
			window.location = redirectUri;
			return Promise.resolve( redirectUri );
		}

		return Promise.resolve();
	};

	/**
	 * Site register process handler.
	 *
	 * It handles the process to register the site,
	 * considering also the user registration status.
	 * When they are registered, it will try to only register the site.
	 * Otherwise, will try to register the user right after
	 * the site was successfully registered.
	 *
	 * @param {Event} [e] - Event that dispatched handleRegisterSite
	 * @return {Promise}   Promise when running the registration process. Otherwise, nothing.
	 */
	const handleRegisterSite = e => {
		e && e.preventDefault();

		if ( isRegistered ) {
			return handleConnectUser();
		}

		return registerSite( { registrationNonce, redirectUri, from } ).then( () => {
			return handleConnectUser();
		} );
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
		connectionErrors,
		isOfflineMode,
	};
}
