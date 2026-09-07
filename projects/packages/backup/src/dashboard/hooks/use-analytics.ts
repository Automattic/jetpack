import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useEffect } from '@wordpress/element';

/**
 * The two fields `jetpackAnalytics.initialize()` needs, which the
 * ambient type for `wpcomUser` does not declare.
 *
 * `@automattic/jetpack-connection`'s ambient `ConnectionScriptData` —
 * the one `declarations.d.ts` wires to `window.JP_CONNECTION_INITIAL_STATE`
 * — types that object as `{ avatar, display_name, email }`. The runtime
 * object has twelve keys, verified against a connected site, including
 * `ID` and `login`.
 *
 * The same package already declares the correct shape as `WpcomUser` in
 * `components/use-connection/types.ts`, so the real fix is to point the
 * ambient declaration at it. That belongs in `js-packages/connection`
 * with its own changelog entry, and it would delete this type and the
 * cast below along with every other reader's copy of them.
 *
 * Note the capitalisation: WordPress.com's `/me` returns `ID`, not `Id`.
 * Getting it wrong is silent — `initialize()` would be skipped and every
 * event would then do nothing, which looks exactly like a dashboard
 * nobody opened.
 */
type WpcomUserIdentity = {
	ID?: number;
	login?: string;
};

/**
 * Whether the reader has already been identified on this page load.
 *
 * Module scope rather than a ref, because "once" means once per page
 * load and this hook has several consumers: `OverviewScreen` and its
 * descendant `BackupNowButton` both call it, so a per-component guard
 * would identify twice per mount and four times under StrictMode,
 * pushing a duplicate `identifyUser` onto `_tkq` each time. Matches
 * `packages/podcast/src/dashboard/analytics.ts`.
 */
let hasIdentified = false;

/**
 * Reset the identify latch. Test-only.
 *
 * Module state outlives a `render()`/`unmount()` cycle by design, which
 * is the whole point of the latch — but it also means one test's first
 * render would otherwise silence every later one in the same file.
 */
export function resetAnalyticsForTesting(): void {
	hasIdentified = false;
}

/**
 * The Tracks client for the modernized dashboard.
 *
 * Deliberately not a port of `src/js/hooks/useAnalytics.js`. That one
 * reads the API root and nonce out of the legacy Redux store and hands
 * them to `@automattic/jetpack-connection`'s `useConnection()`, which
 * fetches the connected user over REST. Neither is available here: there
 * is no store, and `use-connection.ts` documents why this package cannot
 * import that package's hooks at all — its barrel pulls in SCSS that
 * wp-build's bundler will not resolve.
 *
 * `@automattic/jetpack-analytics` itself is safe to import: a single
 * `.` export pointing at one JSX file, with no stylesheet anywhere in
 * the package.
 *
 * The identity is read synchronously from the same
 * `JP_CONNECTION_INITIAL_STATE` global `useConnection()` uses, so this
 * costs no request where legacy costs one.
 *
 * Identification is skipped when the site has no connected WordPress.com
 * user. Recording still works — the events simply carry no identity —
 * which is the legacy behaviour and the reason the page view fires on
 * an unconnected site too.
 *
 * The Tracks *script* is enqueued by PHP, in `Jetpack_Backup`'s
 * `enqueue_admin_scripts()`. Without that this client has nothing to
 * post to, and it fails silently rather than throwing.
 *
 * @return The analytics client, whose `tracks.recordEvent()` sends events.
 */
export function useAnalytics() {
	const state = typeof window !== 'undefined' ? window.JP_CONNECTION_INITIAL_STATE : undefined;
	const wpcomUser = state?.userConnectionData?.currentUser?.wpcomUser as
		| WpcomUserIdentity
		| undefined;

	const userId = wpcomUser?.ID;
	const login = wpcomUser?.login;

	useEffect( () => {
		if ( hasIdentified || ! userId || ! login ) {
			return;
		}

		hasIdentified = true;
		jetpackAnalytics.initialize( userId, login );
	}, [ userId, login ] );

	return jetpackAnalytics;
}
