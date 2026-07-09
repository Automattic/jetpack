import type { ConnectionErrorMap } from '../../hooks/use-connection-error-notice/types.ts';
import type { SyntheticEvent } from 'react';

export interface UseConnectionProps {
	/**
	 * The registration nonce.
	 */
	registrationNonce?: string;
	/**
	 * The API root URL.
	 */
	apiRoot?: string;
	/**
	 * The API nonce.
	 */
	apiNonce?: string;
	/**
	 * The redirect URI.
	 */
	redirectUri?: string;
	/**
	 * Whether to auto-trigger the connection process.
	 */
	autoTrigger?: boolean;
	/**
	 * Value that represents the redirect origin.
	 */
	from?: string;
	/**
	 * Whether to skip user connection.
	 */
	skipUserConnection?: boolean;
	/**
	 * Whether to skip the pricing page.
	 */
	skipPricingPage?: boolean;
}

export interface WpcomUser {
	display_name?: string;
	email?: string;
	login?: string;
	avatar?: string;
	ID?: number;
	[ key: string ]: unknown;
}

export interface UserConnectionData {
	currentUser?: {
		wpcomUser?: WpcomUser;
		username?: string;
		isMaster?: boolean;
		possibleAccountErrors?: Record< string, unknown >;
		[ key: string ]: unknown;
	};
	connectionOwner?: string | null;
	[ key: string ]: unknown;
}

export interface RegistrationError {
	message?: string;
	response?: { code?: string };
	[ key: string ]: unknown;
}

export interface UseConnectionReturn {
	handleRegisterSite: ( e?: Event | SyntheticEvent ) => Promise< unknown >;
	handleConnectUser: () => Promise< unknown >;
	refreshConnectedPlugins: () => Promise< unknown >;
	isRegistered: boolean;
	isUserConnected: boolean;
	siteIsRegistering: boolean;
	userIsConnecting: boolean;
	registrationError: RegistrationError | false;
	userConnectionData: UserConnectionData;
	hasConnectedOwner: boolean;
	connectedPlugins: Record< string, unknown > | unknown[];
	connectionErrors: Array< string | object >;
	connectionHealthErrors: ConnectionErrorMap;
	isOfflineMode: boolean;
}
