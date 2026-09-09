/**
 * Whether a signed-in reader has already been shown the tray on this site.
 * Verbum opens it once for a newcomer, then leaves it to the gear.
 */

const KEY = 'jetpack-comments-tray-seen';

export const traySeen = (): boolean => {
	try {
		return localStorage.getItem( KEY ) === '1';
	} catch {
		return false;
	}
};

export const markTraySeen = (): void => {
	try {
		localStorage.setItem( KEY, '1' );
	} catch {
		// Then it opens again next time, which is harmless.
	}
};
