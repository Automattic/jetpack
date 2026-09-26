const KEY = 'jetpack-onboarding-connecting';

// Read once per page load and remembered, because the flag is consumed on the
// first read and a remount would otherwise find it gone.
let answer: boolean | null = null;

/**
 * Records that this session is on its way to WordPress.com to connect.
 *
 * Session storage rather than the return URL: the takeover's redirect builds
 * its URL from a fixed set of arguments and drops everything else, so a
 * parameter would not survive the trip back.
 */
export function markConnecting(): void {
	try {
		window.sessionStorage.setItem( KEY, '1' );
	} catch {
		// Private browsing and blocked site data both throw. The flow works
		// without the flag; only the arrival moment is lost.
	}
}

/**
 * Whether the user has just come back from connecting.
 *
 * True once per return, then false: the moment is for arriving, not for every
 * render of the step you arrive on.
 *
 * @return True on the first call after a connection round trip.
 */
export function useJustConnected(): boolean {
	if ( answer === null ) {
		try {
			answer = window.sessionStorage.getItem( KEY ) === '1';
			window.sessionStorage.removeItem( KEY );
		} catch {
			answer = false;
		}
	}

	return answer;
}
