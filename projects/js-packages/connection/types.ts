/**
 * The connection owner of record, derived server-side from the `master_user`
 * option. Unlike `UserConnectionData.connectionOwner` this survives a broken
 * owner token, which is exactly when connection-error UIs need it.
 */
export interface ConnectionOwner {
	id: number;
	displayName: string;
	/** Optional: the store's post-transfer owner carries no avatar. */
	avatar?: string;
}

/**
 * Whether a raw store value is a usable connection owner.
 *
 * The value starts life as server-provided JSON and crosses an untyped store, so
 * it is checked rather than asserted: consumers decide ownership by comparing
 * `owner.id` to the viewer's ID, and a partial owner would pass that test by
 * matching `undefined` against `undefined`. Anything short of a complete owner
 * means "owner unknown".
 *
 * @param {unknown} value - The raw selector value.
 * @return {boolean} Whether the value is a complete connection owner.
 */
export function isConnectionOwner( value: unknown ): value is ConnectionOwner {
	return (
		!! value &&
		typeof value === 'object' &&
		'id' in value &&
		typeof value.id === 'number' &&
		'displayName' in value &&
		typeof value.displayName === 'string'
	);
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
		/** Same value as `isInSafeMode`, which replaces it once its last consumers move over. */
		isStaging: boolean;
		/** Absent when the PHP connection package is older than this type. */
		isInSafeMode?: boolean;
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
		/**
		 * Why the last registration attempt failed; null when it did not. Only sent to users who can
		 * connect the site, and absent when the PHP connection package is older than this type.
		 * (The store's `registrationError` is a live register call's failure instead.)
		 */
		registrationFailure?: {
			code: string;
			message: string;
			/** Whether retrying can only succeed once the site's environment changes. */
			needsSiteChange: boolean;
			attempts: number;
			lastAttemptAt: number;
			/** Unix timestamp of the next automatic attempt. */
			nextRetryAfter: number;
		} | null;
	};
	userConnectionData: {
		currentUser: {
			isConnected: boolean;
			isMaster: boolean;
			username: string;
			id: number;
			/** The viewer's local display name. */
			displayName: string;
			/** The viewer's local email address. */
			email: string;
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
	/**
	 * Whether the site has a protected owner WordPress.com confirms. Null when the viewer lacks
	 * the jetpack_connect capability, because deciding it can cost a WordPress.com lookup and the
	 * answer is not theirs to see — null is "cannot say", not "no".
	 */
	hasProtectedOwner: boolean | null;
	/** Whether a consumer requires a protected owner at this moment. Null as above. */
	requiresProtectedOwner: boolean | null;
	/** Whether the package renders its own protected owner UI. Null as above. */
	useDefaultProtectedOwnerUi: boolean | null;
	/**
	 * Absolute URL of the package's committed images, with a trailing slash. Optional because
	 * only the admin script data carries it, not `JP_CONNECTION_INITIAL_STATE`.
	 */
	assetsUrl?: string;
};
