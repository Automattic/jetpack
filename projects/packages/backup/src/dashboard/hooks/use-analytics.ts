import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useEffect } from 'react';

/**
 * The two fields `jetpackAnalytics.initialize()` needs, which the
 * ambient type for `wpcomUser` does not declare.
 *
 * `@automattic/jetpack-connection`'s `types.ts` types that object as
 * `{ avatar, display_name, email }`. The runtime object has twelve keys
 * — verified against a connected site, where it carries `ID`, `login`,
 * `email`, `display_name`, `text_direction`, `site_count`,
 * `jetpack_connect`, `color_scheme`, `sidebar_collapsed`, `user_locale`,
 * `user_currency` and `avatar`. So the declaration is incomplete rather
 * than wrong, and the two fields read here are the ones the legacy
 * dashboard has always used.
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
 * Initialization is skipped when the site has no connected WordPress.com
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
		if ( ! userId || ! login ) {
			return;
		}

		jetpackAnalytics.initialize( userId, login );
	}, [ userId, login ] );

	return jetpackAnalytics;
}
