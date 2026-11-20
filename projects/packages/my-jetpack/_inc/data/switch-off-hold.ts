import { useSyncExternalStore } from 'react';

type Hold = { token: number; asking: boolean };

// Modules whose switch-off waits on a check, then a confirmation, held by one mount at a
// time and read by every mount showing that module's switch.
const holds = new Map< string, Hold >();
let taken = 0;
const listeners = new Set< () => void >();

/**
 * Hold a module's switch-off while it is checked and confirmed, unless a mount already does.
 *
 * @param slug - The module's slug.
 * @return The token that owns the hold, or null when another mount holds it.
 */
export function holdSwitchOff( slug: string ): number | null {
	if ( holds.has( slug ) ) {
		return null;
	}

	const token = ++taken;
	holds.set( slug, { token, asking: false } );
	publish();

	return token;
}

/**
 * Move a hold from checking to asking, if the token still owns it.
 *
 * @param slug  - The module's slug.
 * @param token - The token `holdSwitchOff` returned.
 */
export function askSwitchOff( slug: string, token: number ): void {
	if ( holds.get( slug )?.token === token ) {
		holds.set( slug, { token, asking: true } );
		publish();
	}
}

/**
 * Release a hold, if the token still owns it.
 *
 * @param slug  - The module's slug.
 * @param token - The token `holdSwitchOff` returned.
 */
export function releaseSwitchOff( slug: string, token: number ): void {
	if ( holds.get( slug )?.token === token ) {
		holds.delete( slug );
		publish();
	}
}

/**
 * Tell every mount reading a hold.
 */
function publish(): void {
	listeners.forEach( listener => listener() );
}

/**
 * Subscribe to changes, for `useSyncExternalStore`.
 *
 * @param listener - Called whenever any hold changes.
 * @return The unsubscribe function.
 */
function subscribe( listener: () => void ): () => void {
	listeners.add( listener );

	return () => {
		listeners.delete( listener );
	};
}

/**
 * A module's switch-off hold, whichever mount took it.
 *
 * @param slug - The module's slug.
 * @return The hold, or null when the module's switch-off is not waiting on anything.
 */
export function useSwitchOffHold( slug: string ): Hold | null {
	return useSyncExternalStore( subscribe, () => holds.get( slug ) ?? null );
}
