import { useSyncExternalStore } from 'react';

// The value a click asked of a switch, held until that click's own request resolves.
//
// Shared rather than component state for two reasons: the card's badge, its switch and
// the modal's button are three mounts that have to agree, and a response carrying the
// whole site's state would otherwise overwrite a feature someone is still toggling.
//
// Keys are namespaced by what is being switched -- `module:stats`, `plugin:akismet`.
const requested = new Map< string, boolean >();
const listeners = new Set< () => void >();

// Rebuilt only when something changes, so `useSyncExternalStore` sees a stable value.
let snapshot: Record< string, boolean > = {};

/**
 * Record, or clear, the value a click asked of a switch.
 *
 * @param key    - The switch's key, as `module:<slug>` or `plugin:<slug>`.
 * @param active - The asked-for value, or null once its request has resolved.
 */
export function setRequestedSwitch( key: string, active: boolean | null ): void {
	if ( active === null ) {
		requested.delete( key );
	} else {
		requested.set( key, active );
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
 * The value a click asked of one switch, if its request is still in flight.
 *
 * @param key - The switch's key, or an empty string when there is no switch.
 * @return The asked-for value, or null when nothing is pending.
 */
export function useRequestedSwitch( key: string ): boolean | null {
	return useSyncExternalStore( subscribe, () =>
		key && requested.has( key ) ? Boolean( requested.get( key ) ) : null
	);
}

/**
 * Every switch with a request in flight, and the value it asked for.
 *
 * One subscription for the whole grid: a hook per feature would change in number as the
 * catalog arrives, which React does not allow.
 *
 * @return Module slug to the value asked of it.
 */
export function useRequestedSwitches(): Record< string, boolean > {
	return useSyncExternalStore( subscribe, () => snapshot );
}

/**
 * The key a module's switch is recorded under.
 *
 * @param module - The module's slug.
 * @return The key, or an empty string when there is no module.
 */
export function moduleSwitchKey( module: string ): string {
	return module ? `module:${ module }` : '';
}

/**
 * The key a plugin's switch is recorded under.
 *
 * @param plugin - The plugin's slug.
 * @return The key, or an empty string when there is no plugin.
 */
export function pluginSwitchKey( plugin: string ): string {
	return plugin ? `plugin:${ plugin }` : '';
}
