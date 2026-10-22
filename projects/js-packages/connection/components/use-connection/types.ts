import type { ConnectionOwner, WpcomUser } from '../../types.ts';
import type { SyntheticEvent } from 'react';

export type { ConnectionOwner, WpcomUser };

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

/**
 * The viewer's capabilities, as `REST_Connector::get_user_connection_data()` sends them.
 *
 * Named rather than a `Record`, so a mistyped capability is a compile error instead of a
 * silent `false` — which would read as a legitimate denial.
 */
export interface ConnectionUserPermissions {
	connect?: boolean;
	connect_user?: boolean;
	unlink_user?: boolean;
	disconnect?: boolean;
	manage_options?: boolean;
}

export interface UserConnectionData {
	currentUser?: {
		wpcomUser?: WpcomUser;
		username?: string;
		/** The viewer's local WordPress user ID. */
		id?: number;
		/** The viewer's local display name. */
		displayName?: string;
		/** The viewer's local email address. */
		email?: string;
		isMaster?: boolean;
		permissions?: ConnectionUserPermissions;
		possibleAccountErrors?: Record< string, unknown >;
		[ key: string ]: unknown;
	};
	connectionOwner?: string | null;
	[ key: string ]: unknown;
}

export interface RegistrationError {
	message?: string;
	response?: { code?: string; message?: string };
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
	/** The owner of record; null when unresolvable or withheld from this viewer. */
	connectionOwner: ConnectionOwner | null;
	hasConnectedOwner: boolean;
	connectedPlugins: Record< string, unknown > | unknown[];
	connectionErrors: Array< string | object >;
	isOfflineMode: boolean;
}
