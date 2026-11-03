import { useSyncExternalStore } from 'react';

// The value a click asked of a switch, held until that click's own request resolves, and
// read by every mount showing that switch.
const requested = new Map< string, { active: boolean; token: number } >();
let writes = 0;
const listeners = new Set< () => void >();

// Rebuilt only when something changes, so `useSyncExternalStore` sees a stable value.
let snapshot: Record< string, boolean > = {};

/**
 * Record the value a click asked of a switch.
 *
 * @param key    - The switch's key, as `module:<slug>` or `plugin:<slug>`.
 * @param active - The asked-for value.
 * @return A token to pass to `clearRequestedSwitch` when the request resolves.
 */
export function setRequestedSwitch( key: string, active: boolean ): number {
	const token = ++writes;

	requested.set( key, { active, token } );
	publish();

	return token;
}

/**
 * Clear a value, if this caller is still the one that wrote it.
 *
 * A second click on the same switch supersedes the first, and the first request settling
 * afterwards must not drop the value the second is waiting on.
 *
 * @param key   - The switch's key.
 * @param token - The token `setRequestedSwitch` returned.
 */
export function clearRequestedSwitch( key: string, token: number ): void {
	if ( requested.get( key )?.token !== token ) {
		return;
	}

	requested.delete( key );
	publish();
}

/**
 * Rebuild the snapshot and tell everyone reading it.
 */
function publish(): void {
	snapshot = Object.fromEntries(
		Array.from( requested, ( [ key, value ] ) => [ key, value.active ] )
	);
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
		key && requested.has( key ) ? Boolean( requested.get( key )?.active ) : null
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
 * Namespaced by what is switched, so a module and a plugin of the same name cannot
 * collide -- `module:stats`, `plugin:akismet`.
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
