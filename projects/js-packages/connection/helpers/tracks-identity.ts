import jetpackAnalytics from '@automattic/jetpack-analytics';
import type { WpcomUser } from '../types.ts';

interface TracksIdentityUser {
	isConnected?: boolean;
	wpcomUser?: Pick< WpcomUser, 'ID' | 'login' >;
}

interface TracksIdentity {
	ID?: number;
	login?: string;
}

/**
 * The viewer's Tracks identity: their WordPress.com account, never the local WordPress user.
 *
 * @param currentUser - userConnectionData.currentUser from the jetpack-connection store.
 * @return The WordPress.com ID and login, or an empty object when the viewer isn't connected.
 */
export function getTracksIdentity( currentUser?: TracksIdentityUser | null ): TracksIdentity {
	if ( ! currentUser?.isConnected ) {
		return {};
	}
	return { ID: currentUser.wpcomUser?.ID, login: currentUser.wpcomUser?.login };
}

/**
 * Identify the viewer to Tracks, for hosts that don't bundle `@automattic/jetpack-analytics` themselves.
 *
 * @param currentUser - userConnectionData.currentUser from the jetpack-connection store.
 */
export function initializeTracksIdentity( currentUser?: TracksIdentityUser | null ): void {
	const { ID, login } = getTracksIdentity( currentUser );
	if ( ID && login ) {
		jetpackAnalytics.initialize( ID, login );
	}
}
