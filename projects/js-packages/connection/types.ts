/**
 * The connection owner of record, derived server-side from the `master_user`
 * option. Unlike `UserConnectionData.connectionOwner` this survives a broken
 * owner token, which is exactly when connection-error UIs need it.
 */
export interface ConnectionOwner {
	id: number;
	displayName: string;
}

/**
 * The WordPress.com account behind the current user's connection, as served at
 * `window.JP_CONNECTION_INITIAL_STATE.userConnectionData.currentUser.wpcomUser`.
 *
 * Only `avatar` is guaranteed: with no connected WordPress.com user the PHP still sets
 * it, so the whole object is `{ avatar: false }`.
 *
 * Deliberately closed — an index signature typed `unknown` would resolve the `Id`
 * misspelling (JETPACK-2411) rather than erroring on it, so a new field has to be added
 * here before it can be read.
 */
export interface WpcomUser {
	/**
	 * Note the capitalisation. Callers skip `jetpackAnalytics.initialize()` when this is
	 * missing, so a misspelling costs the identity on every Tracks event, silently.
	 */
	ID?: number;
	login?: string;
	email?: string;
	display_name?: string;
	/** Gravatar URL for `email`, or `false` when core cannot resolve one. */
	avatar: string | false;
	text_direction?: string;
	site_count?: number;
	jetpack_connect?: string;
	color_scheme?: string;
	sidebar_collapsed?: boolean;
	user_locale?: string;
	user_currency?: string;
}

export type ConnectionScriptData = {
	apiRoot: string;
	apiNonce: string;
	registrationNonce: string;
	calypsoEnv: string;
	connectionStatus: {
		isActive: boolean;
		isStaging: boolean;
		isRegistered: boolean;
		isUserConnected: boolean;
		hasConnectedOwner: boolean;
		offlineMode: {
			isActive: boolean;
			constant: boolean;
			url: boolean;
			filter: boolean;
			wpLocalConstant: boolean;
		};
		isPublic: boolean;
		/** Why the last registration attempt failed; null when it did not. */
		registrationError: {
			code: string;
			message: string;
			/** Whether retrying could ever succeed without the site's environment changing. */
			isPermanent: boolean;
			attempts: number;
			lastAttemptAt: number;
			/** Unix timestamp of the next automatic attempt; null when there will not be one. */
			nextRetryAfter: number | null;
		} | null;
	};
	userConnectionData: {
		currentUser: {
			isConnected: boolean;
			isMaster: boolean;
			username: string;
			id: number;
			blogId: number;
			wpcomUser: WpcomUser;
			gravatar: string;
			permissions: {
				admin_page?: boolean;
				connect: boolean;
				connect_user: boolean;
				disconnect: boolean;
				edit_posts?: boolean;
				manage_modules?: boolean;
				manage_options?: boolean;
				manage_plugins?: boolean;
				network_admin?: boolean;
				network_sites_page?: boolean;
				publish_posts?: boolean;
				view_stats?: boolean;
			};
		};
		connectionOwner: null;
	};
	connectedPlugins: object;
	wpVersion: string;
	siteSuffix: string;
	connectionErrors: Array< string | object >;
	isOfflineMode: boolean;
	isOwnershipTransferable: boolean;
	/** Owner identity; null when unresolvable or when the viewer lacks the jetpack_connect capability. */
	connectionOwner: ConnectionOwner | null;
};
