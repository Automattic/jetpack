import apiFetch from '@wordpress/api-fetch';
import { useSyncExternalStore } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { createStore, setScan } from '../scan/store';
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
 * Fetch the fixed and ignored threats; the stage and inspector share the result.
 *
 * @param refresh - Fetch again even when a list is loaded, as a fix may have added to it.
 * @return Resolves once the list or the error is in the store.
 */
export function loadHistory( refresh = false ): Promise< void > {
	if ( isLoading || ( ! refresh && historyStore.get().threats ) ) {
		return Promise.resolve();
	}
	isLoading = true;
	return apiFetch< ScanThreat[] >( { path: '/jetpack/v4/protect-dashboard/history' } )
		.then( threats => {
			historyStore.set( () => ( { threats, error: null } ) );
			// The same response has the ignored threats; a list Scan already holds may have newer edits.
			setScan( scan =>
				scan.ignored
					? scan
					: { ...scan, ignored: threats.filter( item => item.status === 'ignored' ) }
			);
		} )
		.catch( ( e: { message?: string } ) =>
			historyStore.set( current => ( {
				threats: current.threats,
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
