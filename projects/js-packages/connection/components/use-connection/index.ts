import restApi from '@automattic/jetpack-api';
import { getScriptData } from '@automattic/jetpack-script-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from 'react';
import { initConnectionStore } from '../../state/store.jsx';
import type {
	RegistrationError,
	UserConnectionData,
	UseConnectionProps,
	UseConnectionReturn,
} from './types.ts';
import type { ConnectionErrorMap } from '../../hooks/use-connection-error-notice/types.ts';
import type { StoreDescriptor } from '@wordpress/data';
import type { SyntheticEvent } from 'react';

type StoreSelector = (
	store: StoreDescriptor | string
) => Record< string, ( ...args: unknown[] ) => unknown >;

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
	// Register the connection store lazily and use the returned descriptor so
	// the store can't be selected/dispatched without being initialized first.
	// Idempotent across consumers.
	const connectionStore = initConnectionStore();

	const { registerSite, connectUser, refreshConnectedPlugins } = useDispatch( connectionStore );

	const registrationError = useSelect(
		( select: StoreSelector ) =>
			select( connectionStore ).getRegistrationError() as RegistrationError | false,
		[ connectionStore ]
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
	} = useSelect(
		( select: StoreSelector ) => {
			const connectionStatus = select( connectionStore ).getConnectionStatus() as Record<
				string,
				unknown
			>;
			return {
				siteIsRegistering: select( connectionStore ).getSiteIsRegistering() as boolean,
				userIsConnecting: select( connectionStore ).getUserIsConnecting() as boolean,
				userConnectionData: ( select( connectionStore ).getUserConnectionData() ||
					{} ) as UserConnectionData,
				connectedPlugins: select( connectionStore ).getConnectedPlugins() as
					| Record< string, unknown >
					| unknown[],
				connectionErrors: select( connectionStore ).getConnectionErrors() as Array<
					string | object
				>,
				// Always a code→user→error map (selector defaults to `{}`), unlike
				// `connectionErrors` which can be an array — so type it as the real
				// `ConnectionErrorMap` and skip the array normalization downstream.
				// Optional-call the selector: downstream consumers that register a
				// partial connection-store mock may not define it.
				connectionHealthErrors: ( select( connectionStore ).getConnectionHealthErrors?.() ??
					{} ) as ConnectionErrorMap,
				isOfflineMode: select( connectionStore ).getIsOfflineMode() as boolean,
				isRegistered: ( connectionStatus.isRegistered ?? false ) as boolean,
				isUserConnected: ( connectionStatus.isUserConnected ?? false ) as boolean,
				hasConnectedOwner: ( connectionStatus.hasConnectedOwner ?? false ) as boolean,
			};
		},
		[ connectionStore ]
	);

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
