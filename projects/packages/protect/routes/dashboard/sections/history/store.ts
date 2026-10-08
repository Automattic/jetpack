import apiFetch from '@wordpress/api-fetch';
import { useSyncExternalStore } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { createStore } from '../scan/store';
import type { ScanThreat } from '../scan/types';

/** The search param naming the history threat open in the inspector. */
export const HISTORY_THREAT_PARAM = 'historyThreat';

/** The search param choosing History's Fixed or Ignored list. */
export const HISTORY_STATUS_PARAM = 'status';

export type HistoryData = { threats: ScanThreat[] | null; error: string | null };

// One object, not one per read: useSyncExternalStore re-renders forever on a new snapshot.
const INITIAL: HistoryData = { threats: null, error: null };
const historyStore = createStore< HistoryData >( () => INITIAL );
let isLoading = false;

/**
 * Fetch the fixed and ignored threats once per page load; the stage and inspector share the result.
 *
 * @return Resolves once the list or the error is in the store.
 */
export function loadHistory(): Promise< void > {
	if ( isLoading || historyStore.get().threats ) {
		return Promise.resolve();
	}
	isLoading = true;
	return apiFetch< ScanThreat[] >( { path: '/jetpack/v4/protect-dashboard/history' } )
		.then( threats => historyStore.set( () => ( { threats, error: null } ) ) )
		.catch( ( e: { message?: string } ) =>
			historyStore.set( () => ( {
				threats: null,
				error: e?.message || __( 'Scan history is unavailable right now.', 'jetpack-protect-pkg' ),
			} ) )
		)
		.finally( () => {
			isLoading = false;
		} );
}

/**
 * The fixed and ignored threats, re-rendering when they load.
 *
 * @return The history.
 */
export function useHistory(): HistoryData {
	return useSyncExternalStore( historyStore.subscribe, historyStore.get );
}
