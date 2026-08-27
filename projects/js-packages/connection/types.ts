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
 * Server-side this is the decoded body of WordPress.com's
 * `/sites/<blog_id>/jetpack-wpcom-user-data` endpoint, fetched by
 * `Connection\Manager::get_connected_user_data()`, with `avatar` added on top by
 * `REST_Connector::get_user_connection_data()`. The field list mirrors the
 * payload that `ManagerIntegrationTest::test_get_connected_user_data_fetches_from_rest_endpoint()`
 * exercises, which is the response shape that endpoint call was written against.
 *
 * Only `avatar` is guaranteed. With no connected WordPress.com user
 * `get_connected_user_data()` returns `false`, `get_user_connection_data()`
 * substitutes an empty array for it and then sets `avatar` unconditionally, so
 * the whole object is `{ avatar: false }`.
 *
 * Deliberately closed: there is no `[ key: string ]: unknown` index signature.
 * Listing `ID` is only half of what makes the `Id` misspelling (JETPACK-2411)
 * catchable — an index signature typed `unknown` resolves `Id` to `unknown`
 * rather than erroring, so the misspelling would go on typechecking. Reading a
 * field absent from this list is a compile error instead, so adding one is a
 * deliberate edit here.
 *
 * This is the package's only `WpcomUser`. `components/use-connection/types.ts`
 * re-exports it, so the ambient global and the `useConnection()` return value
 * resolve to one declaration; `test/wpcom-user-types.test.ts` asserts they still
 * do. That direction costs consumers something real: reading a `wpcomUser` field
 * that is not listed here used to be absorbed by the open declaration's index
 * signature and is now a compile error. No consumer relies on that today — every
 * typed read in the monorepo is `ID`, `login`, `display_name`, `email` or
 * `avatar` — but a new field has to be added here first rather than just used.
 *
 * One caveat on the unification: `tsconfig.base.json` sets `strict: false`, so
 * `strictNullChecks` is off and optionality differences between the two former
 * declarations cannot surface. A clean typecheck today is therefore not evidence
 * that a future strict migration stays clean.
 */
export interface WpcomUser {
	/**
	 * The WordPress.com user ID, the first argument to `jetpackAnalytics.initialize()`.
	 * Note the capitalisation: WordPress.com spells it `ID`. Every caller skips
	 * `initialize()` when it is missing, so a misspelling costs the identity on
	 * every Tracks event the page sends without failing anywhere visible.
	 */
	ID?: number;
	/** The WordPress.com username, the second argument to `jetpackAnalytics.initialize()`. */
	login?: string;
	email?: string;
	display_name?: string;
	/**
	 * Gravatar URL for `email`, or `false`. The PHP passes `false` straight
	 * through when `email` is empty, and `get_avatar_url()` is itself declared
	 * `string|false` in WordPress core — it returns `false` when it cannot
	 * resolve an avatar. Neither `boolean` nor `string` alone describes it.
	 */
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
	/** Owner identity; null when unresolvable or when the viewer lacks the jetpack_connect capability. */
	connectionOwner: ConnectionOwner | null;
};
