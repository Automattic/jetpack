import { useSyncExternalStore } from 'react';

// The value a click asked for, held until the modules store catches up. Shared rather
// than component state: the card's badge, its switch and the modal's button are three
// mounts that have to agree, and none of them owns the answer.
const requested = new Map< string, boolean >();
const listeners = new Set< () => void >();

// Rebuilt only when something changes, so `useSyncExternalStore` sees a stable value.
let snapshot: Record< string, boolean > = {};

/**
 * Record, or clear, the value a click asked of a module.
 *
 * @param module - The module's slug.
 * @param active - The asked-for value, or null once the store knows the answer.
 */
export function setRequestedModuleState( module: string, active: boolean | null ): void {
	if ( active === null ) {
		requested.delete( module );
	} else {
		requested.set( module, active );
	}

	snapshot = Object.fromEntries( requested );
	listeners.forEach( listener => listener() );
}

/**
 * Subscribe to changes, for `useSyncExternalStore`.
 *
 * @param listener - Called whenever any module's asked-for value changes.
 * @return The unsubscribe function.
 */
function subscribe( listener: () => void ): () => void {
	listeners.add( listener );

	return () => {
		listeners.delete( listener );
	};
}

/**
 * The value a click asked of a module, if one is still in flight.
 *
 * @param module - The module's slug, or an empty string for no module.
 * @return The asked-for value, or null when nothing is pending.
 */
export function useRequestedModuleState( module: string ): boolean | null {
	return useSyncExternalStore( subscribe, () =>
		module && requested.has( module ) ? Boolean( requested.get( module ) ) : null
	);
}

/**
 * Every module with a request in flight, and the value it asked for.
 *
 * One subscription for the whole grid: a hook per feature would change in number as the
 * catalog arrives, which React does not allow.
 *
 * @return Module slug to the value asked of it.
 */
export function useRequestedModuleStates(): Record< string, boolean > {
	return useSyncExternalStore( subscribe, () => snapshot );
}
