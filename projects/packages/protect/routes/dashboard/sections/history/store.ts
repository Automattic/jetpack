import apiFetch from '@wordpress/api-fetch';
import { useSyncExternalStore } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { createStore, setScan } from '../scan/store';
import type { ScanState, ScanThreat } from '../scan/types';

/** The search param naming the history threat open in the inspector. */
export const HISTORY_THREAT_PARAM = 'historyThreat';

/** The search param choosing History's Fixed or Ignored list. */
export const HISTORY_STATUS_PARAM = 'status';

export type HistoryData = { threats: ScanThreat[] | null; error: string | null };

// One object, not one per read: useSyncExternalStore re-renders forever on a new snapshot.
const INITIAL: HistoryData = { threats: null, error: null };
const historyStore = createStore< HistoryData >( () => INITIAL );
let inFlight: Promise< void > | null = null;
let refetch = false;

/**
 * Fetch the fixed and ignored threats; the stage and inspector share the result.
 *
 * @param refresh - Fetch again even when a list is loaded, as a fix may have added to it.
 * @return Resolves once the list or the error is in the store.
 */
export function loadHistory( refresh = false ): Promise< void > {
	if ( inFlight ) {
		// The running request may predate the fix a refresh is for, so fetch once more after it.
		refetch = refetch || refresh;
		return inFlight;
	}
	if ( ! refresh && historyStore.get().threats ) {
		return Promise.resolve();
	}
	// Check and clear in one callback, so no refresh can slip in between them.
	const run = (): Promise< void > =>
		fetchHistory().then( () => {
			if ( refetch ) {
				refetch = false;
				return run();
			}
			inFlight = null;
		} );
	inFlight = run();
	return inFlight;
}

/** Forget the loaded history and any request, so tests start over; for tests. */
export function resetHistory(): void {
	historyStore.reset();
	inFlight = null;
	refetch = false;
}

/**
 * Fetch the history once and store the list or the error.
 *
 * @return Resolves once the store is updated; never rejects.
 */
function fetchHistory(): Promise< void > {
	return apiFetch< ScanThreat[] >( { path: '/jetpack/v4/protect-dashboard/history' } )
		.then( threats => {
			historyStore.set( () => ( { threats, error: null } ) );
			setScan( scan => ( { ...scan, ignored: mergeIgnored( scan, threats ) } ) );
		} )
		.catch( ( e: { message?: string } ) =>
			historyStore.set( current => ( {
				threats: current.threats,
				error: e?.message || __( 'Scan history is unavailable right now.', 'jetpack-protect-pkg' ),
			} ) )
		);
}

/**
 * The ignored list after a history load: the client's own edits, plus threats history ignored that it doesn't know of.
 *
 * @param scan    - The Scan state, whose lists may hold newer ignores and unignores.
 * @param history - The history response.
 * @return The ignored threats.
 */
function mergeIgnored( scan: ScanState, history: ScanThreat[] ): ScanThreat[] {
	const fromHistory = history.filter( item => item.status === 'ignored' );
	if ( ! scan.ignored ) {
		return fromHistory;
	}
	const known = new Set(
		[ ...scan.ignored, ...( scan.threats ?? [] ) ].map( item => String( item.id ) )
	);
	return [ ...scan.ignored, ...fromHistory.filter( item => ! known.has( String( item.id ) ) ) ];
}

/**
 * The fixed and ignored threats, re-rendering when they load.
 *
 * @return The history.
 */
export function useHistory(): HistoryData {
	return useSyncExternalStore( historyStore.subscribe, historyStore.get );
}
