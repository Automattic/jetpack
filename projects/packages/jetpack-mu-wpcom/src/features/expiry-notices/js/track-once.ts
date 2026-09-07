import { wpcomTrackEvent } from '../../../common/tracks';

// sessionStorage can throw in private browsing / sandboxed iframes, so a flag
// that cannot be stored reads as unset and the event may fire again.
const hasSessionFlag = ( key: string ): boolean => {
	try {
		return sessionStorage.getItem( key ) === '1';
	} catch {
		return false;
	}
};

const setSessionFlag = ( key: string ): void => {
	try {
		sessionStorage.setItem( key, '1' );
	} catch {
		// Storage unavailable.
	}
};

/**
 * Record an event once per browser session.
 *
 * @param key       - Session flag the event is counted under.
 * @param eventName - Tracks event name.
 * @param props     - Event properties.
 */
export const trackOncePerSession = (
	key: string,
	eventName: string,
	props: Record< string, string | number >
): void => {
	if ( hasSessionFlag( key ) ) {
		return;
	}
	wpcomTrackEvent( eventName, props );
	setSessionFlag( key );
};
