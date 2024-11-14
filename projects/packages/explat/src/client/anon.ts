/**
 * External dependencies
 */
import cookie from 'cookie';

let initializeAnonIdPromise: Promise< string | null > | null = null;
const anonIdPollingIntervalMilliseconds = 50;
const anonIdPollingIntervalMaxAttempts = 100; // 50 * 100 = 5000 = 5 seconds

/**
 * Gather w.js anonymous cookie, tk_ai
 *
 * @return {?string} The anonymous cookie value, or null if it doesn't exist
 */
export const readAnonCookie = (): string | null => {
	return cookie.parse( document.cookie ).tk_ai || null;
};

/**
 * Initializes the anonId:
 * - Polls for AnonId receival
 * - Should only be called once at startup
 * - Happens to be safe to call multiple times if it is necessary to reset the anonId - something like this was necessary for testing.
 *
 * This purely for boot-time initialization, in usual circumstances it will be retrieved within 100-300ms, it happens in parallel booting
 * so should only delay experiment loading that much for boot-time experiments. In some circumstances such as a very slow connection this
 * can take a lot longer.
 *
 * The state of initializeAnonIdPromise should be used rather than the return of this function.
 * The return is only avaliable to make this easier to test.
 *
 * Throws on error.
 *
 * @return {Promise<string | null>} The anonymous cookie value, or null if it doesn't exist
 */
export const initializeAnonId = async (): Promise< string | null > => {
	let attempt = 0;
	initializeAnonIdPromise = new Promise( res => {
		const poll = () => {
			const anonId = readAnonCookie();
			if ( typeof anonId === 'string' && anonId !== '' ) {
				res( anonId );
				return;
			}

			if ( anonIdPollingIntervalMaxAttempts - 1 <= attempt ) {
				res( null );
				return;
			}
			attempt += 1;
			setTimeout( poll, anonIdPollingIntervalMilliseconds );
		};
		poll();
	} );

	return initializeAnonIdPromise;
};

export const getAnonId = async (): Promise< string | null > => {
	return await initializeAnonIdPromise;
};
