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
	/**
	 * Protected owner state, or null when the viewer lacks the jetpack_connect capability.
	 * Only `required` is present until a consumer actually asks for an owner.
	 */
	protectedOwner: ProtectedOwnerState | null;
	/** Owner identity; null when unresolvable or when the viewer lacks the jetpack_connect capability. */
	connectionOwner: ConnectionOwner | null;
	/**
	 * Absolute URL of the package's committed images, with a trailing slash. Optional because
	 * only the admin script data carries it, not `JP_CONNECTION_INITIAL_STATE`.
	 */
	assetsUrl?: string;
};

/** Why the protected owner gate is closed, and what would change it. */
export type ProtectedOwnerStatus =
	| 'NOT_ELIGIBLE'
	| 'NEEDS_CONNECT_TO_ESTABLISH'
	| 'CAN_ESTABLISH'
	| 'NEEDS_OWNER_RECONNECT'
	| 'NEEDS_DIFFERENT_OWNER'
	| 'RE_EVALUATE';

/**
 * The protected owner state as the server reports it.
 *
 * Everything but `required` is absent while no consumer is asking for an owner, because
 * classifying the state can cost a WordPress.com lookup the site should not pay for.
 */
export type ProtectedOwnerState = {
	required: boolean;
	protected?: boolean;
	locked?: boolean;
	status?: ProtectedOwnerStatus;
	isCurrentUserTheOwner?: boolean;
};
