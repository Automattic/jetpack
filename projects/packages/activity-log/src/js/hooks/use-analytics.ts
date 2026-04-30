/**
 * Thin wrapper around `@automattic/jetpack-analytics` that identifies
 * the tracker with the connected WPCOM user (matching Backup's
 * `useAnalytics` hook). Components call `useAnalytics()` and then
 * `tracks.recordEvent( 'jetpack_activity_log_<action>', { …props } )`.
 *
 * Anonymous events still fire if the user-connection state isn't ready
 * yet; the identify call just fills in ID + login when available.
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useConnection } from '@automattic/jetpack-connection';
import { useEffect } from 'react';

// Module-level guard so multiple consumers of `useAnalytics` don't
// re-call `initialize()` with the same identity on every mount.
// `jetpackAnalytics` is a singleton; once it's been identified for a
// given (id, login) pair there's nothing to redo.
let identifiedFor: string | null = null;

/**
 * Returns the shared `jetpackAnalytics` tracker, identified with the
 * connected WPCOM user once that state becomes available.
 *
 * @return The `jetpackAnalytics` singleton. Callers typically
 * destructure `{ tracks }` and record events via
 * `tracks.recordEvent( name, props )`.
 */
export function useAnalytics() {
	const { isUserConnected, userConnectionData } = useConnection( {} );
	const wpcomUser = userConnectionData?.currentUser?.wpcomUser;
	const wpcomId = wpcomUser?.ID;
	const wpcomLogin = wpcomUser?.login;

	useEffect( () => {
		if ( ! isUserConnected || ! wpcomId || ! wpcomLogin ) {
			return;
		}
		const key = `${ wpcomId }:${ wpcomLogin }`;
		if ( identifiedFor === key ) {
			return;
		}
		jetpackAnalytics.initialize( wpcomId, wpcomLogin );
		identifiedFor = key;
	}, [ isUserConnected, wpcomId, wpcomLogin ] );

	return jetpackAnalytics;
}

export default useAnalytics;
