import apiFetch from '@wordpress/api-fetch';
import { useCallback, useSyncExternalStore } from '@wordpress/element';
import { useNavigate, useSearch } from '@wordpress/route';
import type { ScanState } from './types';

export const SCAN_PATH = '/jetpack/v4/protect-dashboard/scan';

/** The search param naming the threat open in the inspector. */
export const THREAT_PARAM = 'threat';

/**
 * A value shared by the stage and the inspector, which wp-build renders as separate React trees.
 *
 * @param initial - Reads the starting value, until the first update.
 * @return Read, update and subscribe to the value.
 */
export function createStore< T >( initial: () => T ) {
	let value: T | undefined;
	let isSet = false;
	const listeners = new Set< () => void >();
	const get = () => ( isSet ? ( value as T ) : initial() );

	return {
		get,
		set( update: ( current: T ) => T ) {
			value = update( get() );
			isSet = true;
			listeners.forEach( listener => listener() );
		},
		subscribe( listener: () => void ) {
			listeners.add( listener );
			return () => listeners.delete( listener );
		},
		/** Drop updates so the next read starts over from `initial`; for tests. */
		reset() {
			value = undefined;
			isSet = false;
		},
	};
}

const scanStore = createStore(
	() => window.jetpackProtectDashboard?.scan as ScanState | undefined
);

type ScanEdit = ( scan: ScanState ) => ScanState;

// The reader's edits, in order; each is a pure update that can be replayed.
let edits: ScanEdit[] = [];
// Scan reads in start order, so an older answer can't replace a newer one.
let readsStarted = 0;
let readApplied = 0;

/** Forget fetched and edited reports, so tests start from the page state. */
export const resetScan = (): void => {
	scanStore.reset();
	edits = [];
	readsStarted = 0;
	readApplied = 0;
};

/**
 * The latest report, for code outside React.
 *
 * @return The report, or undefined when PHP registered no Scan section.
 */
export const getScan = () => scanStore.get();

/**
 * Update the latest report, which the stage's card and the inspector both read.
 *
 * @param update - Derives the next report from the current one.
 */
export function setScan( update: ( scan: ScanState ) => ScanState ) {
	scanStore.set( scan => scan && update( scan ) );
}

/**
 * Change the threat lists for something the reader did, such as an ignore, so reads already in flight keep it.
 *
 * @param update - Derives the next report from the current one.
 */
export function editScan( update: ScanEdit ) {
	edits.push( update );
	setScan( update );
}

/**
 * Merge a report fresh from the REST API into the current one, keeping what only the client holds.
 * Unlike a startRead answer, this doesn't replay the reader's edits.
 *
 * @param next - The report.
 */
export function mergeScan( next?: Partial< ScanState > ) {
	if ( next ) {
		setScan( current => ( { ...current, ...next } ) );
	}
}

/**
 * Start a read: its answer is applied, then any edits the reader made since, so an older read never undoes one.
 *
 * @return Applies the read's answer.
 */
export function startRead(): ( next: Partial< ScanState > ) => void {
	const at = edits.length;
	return next =>
		setScan( current =>
			edits.slice( at ).reduce( ( scan, update ) => update( scan ), { ...current, ...next } )
		);
}

/**
 * Start a read of Scan's report, whose answer is dropped if one from a later read already landed.
 *
 * @return Applies the read's answer.
 */
export function startReportRead(): ( next: Partial< ScanState >, failed?: boolean ) => void {
	const read = ++readsStarted;
	const apply = startRead();
	return ( next, failed = false ) => {
		if ( read > readApplied ) {
			// A failure carries no report, so a good answer from an older read may still replace it.
			if ( ! failed ) {
				readApplied = read;
			}
			apply( next );
		}
	};
}

/**
 * Fetch Scan's report from WordPress.com into the store, marking it failed when that doesn't work.
 *
 * @return Resolves once the store is updated; never rejects.
 */
export function refreshScan(): Promise< void > {
	const apply = startReportRead();
	return apiFetch< ScanState >( { path: SCAN_PATH } )
		.then( apply )
		.catch( () => apply( { error: true, scanning: false }, true ) );
}

/**
 * The latest report, re-rendering when it changes.
 *
 * @return The report, or undefined when PHP registered no Scan section.
 */
export function useScan(): ScanState | undefined {
	return useSyncExternalStore( scanStore.subscribe, scanStore.get );
}

/**
 * A search param's value, such as the threat open in the inspector, and a way to set or clear it.
 *
 * @param param - The search param.
 * @return The value, if any, and a setter that takes a value or undefined to clear it.
 */
export function useSearchParam(
	param: string
): [ string | undefined, ( value?: string | number ) => void ] {
	// `@wordpress/route` types no route tree, so `from` and the navigate argument need a cast.
	const search: Record< string, unknown > = useSearch( { from: '/' as never, strict: false } );
	const navigate = useNavigate();
	const setValue = useCallback(
		( value?: string | number ) =>
			navigate( {
				search: ( prev: Record< string, unknown > ) => ( {
					...prev,
					[ param ]: value === undefined ? undefined : String( value ),
				} ),
			} as Parameters< typeof navigate >[ 0 ] ),
		[ navigate, param ]
	);
	const selected = search[ param ];
	return [ selected ? String( selected ) : undefined, setValue ];
}
