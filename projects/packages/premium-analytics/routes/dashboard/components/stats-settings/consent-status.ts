import { getScriptData } from '@automattic/jetpack-script-data';
import { useSyncExternalStore } from 'react';
import type { JetpackScriptData } from '@automattic/jetpack-script-data';

export type ConsentStatus = NonNullable<
	NonNullable<
		NonNullable< JetpackScriptData[ 'premium_analytics' ] >[ 'stats_settings' ]
	>[ 'consent' ]
>;

// The fields the Settings card can change; the rest only the site decides.
type ConsentChange = Partial< Pick< ConsentStatus, 'api_installed' | 'api_active' > >;

// What the Settings card changed this load, over the setup the page loaded with.
let changes: ConsentChange = {};
let cached: { loaded: ConsentStatus; changes: typeof changes; status: ConsentStatus } | undefined;
const listeners = new Set< () => void >();

/**
 * The site's visitor consent setup as it stands now, the same object until it changes.
 *
 * @return The setup, or undefined when the site sent none.
 */
function getConsentStatus(): ConsentStatus | undefined {
	const loaded = getScriptData()?.premium_analytics?.stats_settings?.consent;
	if ( ! loaded ) {
		return undefined;
	}
	if ( cached?.loaded !== loaded || cached.changes !== changes ) {
		cached = { loaded, changes, status: { ...loaded, ...changes } };
	}
	return cached.status;
}

/**
 * Subscribe to changes to the setup.
 *
 * @param listener - Called after each change.
 * @return Unsubscribes.
 */
function subscribe( listener: () => void ) {
	listeners.add( listener );
	return () => {
		listeners.delete( listener );
	};
}

/**
 * Record a change the Settings card made, so it outlives the card when switching tabs remounts it.
 *
 * @param change - The fields that changed.
 */
export function updateConsentStatus( change: ConsentChange ) {
	changes = { ...changes, ...change };
	listeners.forEach( listener => listener() );
}

/**
 * Forget the changes made this load. Test-only.
 */
export function resetConsentStatusForTesting() {
	changes = {};
	cached = undefined;
}

/**
 * The site's visitor consent setup, kept current as the Settings card changes it.
 *
 * @return The setup, or undefined when the site sent none.
 */
export function useConsentStatus(): ConsentStatus | undefined {
	return useSyncExternalStore( subscribe, getConsentStatus, getConsentStatus );
}
