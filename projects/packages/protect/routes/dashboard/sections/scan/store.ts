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
	};
}

const scanStore = createStore(
	() => window.jetpackProtectDashboard?.scan as ScanState | undefined
);

/**
 * Update the latest report, which the stage's card and the inspector both read.
 *
 * @param update - Derives the next report from the current one.
 */
export function setScan( update: ( scan: ScanState ) => ScanState ) {
	scanStore.set( scan => scan && update( scan ) );
}

/**
 * Merge a report fresh from the REST API into the current one, keeping what only the client holds.
 *
 * @param next - The report.
 */
export function mergeScan( next?: Partial< ScanState > ) {
	if ( next ) {
		setScan( current => ( { ...current, ...next } ) );
	}
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
 * The threat open in the inspector, and a way to open or close one.
 *
 * @param param - The search param holding the threat id.
 * @return The open threat's id, if any, and a setter that takes an id or undefined to close.
 */
export function useThreatParam(
	param: string = THREAT_PARAM
): [ string | undefined, ( id?: string | number ) => void ] {
	// `@wordpress/route` types no route tree, so `from` and the navigate argument need a cast.
	const search: Record< string, unknown > = useSearch( { from: '/' as never, strict: false } );
	const navigate = useNavigate();
	const setThreat = useCallback(
		( id?: string | number ) =>
			navigate( {
				search: ( prev: Record< string, unknown > ) => ( {
					...prev,
					[ param ]: id === undefined ? undefined : String( id ),
				} ),
			} as Parameters< typeof navigate >[ 0 ] ),
		[ navigate, param ]
	);
	const selected = search[ param ];
	return [ selected ? String( selected ) : undefined, setThreat ];
}
