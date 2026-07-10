import restApi from '@automattic/jetpack-api';
import { getScriptData } from '@automattic/jetpack-script-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from 'react';
import { STORE_ID } from '../../state/store.jsx';
import type {
	RegistrationError,
	UserConnectionData,
	UseConnectionProps,
	UseConnectionReturn,
} from './types.ts';
import type { ConnectionErrorMap } from '../../hooks/use-connection-error-notice/types.ts';
import type { SyntheticEvent } from 'react';

type StoreSelector = ( storeId: string ) => Record< string, ( ...args: unknown[] ) => unknown >;

const initialState =
	window?.JP_CONNECTION_INITIAL_STATE ||
	getScriptData()?.connection ||
	( {} as Record< string, string > );

/**
 * Hook to handle the connection process.
 *
 * @param {UseConnectionProps} props - The props.
 * @return {UseConnectionReturn} The connection state and handlers.
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
}: UseConnectionProps = {} ): UseConnectionReturn {
	const { registerSite, connectUser, refreshConnectedPlugins } = useDispatch( STORE_ID );

	const registrationError = useSelect(
		( select: StoreSelector ) =>
			select( STORE_ID ).getRegistrationError() as RegistrationError | false,
		[]
	);
	const {
		siteIsRegistering,
		userIsConnecting,
		userConnectionData,
		connectedPlugins,
		connectionErrors,
		connectionHealthErrors,
		isRegistered,
		isUserConnected,
		hasConnectedOwner,
		isOfflineMode,
	} = useSelect( ( select: StoreSelector ) => {
		const connectionStatus = select( STORE_ID ).getConnectionStatus() as Record< string, unknown >;
		return {
			siteIsRegistering: select( STORE_ID ).getSiteIsRegistering() as boolean,
			userIsConnecting: select( STORE_ID ).getUserIsConnecting() as boolean,
			userConnectionData: ( select( STORE_ID ).getUserConnectionData() ||
				{} ) as UserConnectionData,
			connectedPlugins: select( STORE_ID ).getConnectedPlugins() as
				| Record< string, unknown >
				| unknown[],
			connectionErrors: select( STORE_ID ).getConnectionErrors() as Array< string | object >,
			// Always a code→user→error map (selector defaults to `{}`), unlike
			// `connectionErrors` which can be an array — so type it as the real
			// `ConnectionErrorMap` and skip the array normalization downstream.
			// Optional-call the selector: downstream consumers that register a
			// partial connection-store mock may not define it.
			connectionHealthErrors: ( select( STORE_ID ).getConnectionHealthErrors?.() ??
				{} ) as ConnectionErrorMap,
			isOfflineMode: select( STORE_ID ).getIsOfflineMode() as boolean,
			isRegistered: ( connectionStatus.isRegistered ?? false ) as boolean,
			isUserConnected: ( connectionStatus.isUserConnected ?? false ) as boolean,
			hasConnectedOwner: ( connectionStatus.hasConnectedOwner ?? false ) as boolean,
		};
	}, [] );

	/**
	 * User register process handler.
	 *
	 * @return Promise when running the user connection process. Otherwise, nothing.
	 */
	const handleConnectUser = (): Promise< unknown > => {
		if ( ! skipUserConnection ) {
			return connectUser( { from, redirectUri, skipPricingPage } );
		} else if ( redirectUri ) {
			window.location.href = redirectUri;
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
	 * @return Promise when running the site connection process. Otherwise, nothing.
	 */
	const handleRegisterSite = ( e?: Event | SyntheticEvent ): Promise< unknown > => {
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
		connectionHealthErrors,
		isOfflineMode,
	};
}
