import apiFetch from '@wordpress/api-fetch';
import { useCallback, useEffect, useState, useSyncExternalStore } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, useSearch } from '@wordpress/route';
import { recordEvent } from '../../data/tracks';
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

type ScanRequest = {
	isStarting: boolean;
	startError: string | null;
	// When this page requested a scan with a plan, until WordPress.com reports it.
	requestedAt: number | null;
	// Reads of the running scan's report since it was started or checked again.
	polls: number;
};

// Shared so the page header's Scan button and the Scan card follow the same request.
// One object, as `useSyncExternalStore` needs the same snapshot until something changes.
const NO_REQUEST: ScanRequest = {
	isStarting: false,
	startError: null,
	requestedAt: null,
	polls: 0,
};
const requestStore = createStore< ScanRequest >( () => NO_REQUEST );

// How long a requested scan may stay unreported before we stop assuming it is starting.
const REQUESTED_SCAN_TTL = 5 * 60 * 1000;

// About ten minutes of polling before asking the user to check again.
const MAX_POLLS = 40;

// Like the Protect plugin: quick checks first, then back off.
const pollInterval = ( polls: number ) => ( polls < 5 ? 5000 : 15000 );

/**
 * Parse a report's `lastChecked`.
 *
 * @param lastChecked - The last check, in UTC as `YYYY-MM-DD HH:MM:SS`.
 * @return The time, or null when unknown.
 */
export function parseLastChecked( lastChecked?: string | null ): Date | null {
	if ( ! lastChecked ) {
		return null;
	}
	const date = new Date( lastChecked.replace( ' ', 'T' ) + 'Z' );
	return Number.isNaN( date.getTime() ) ? null : date;
}

/** Forget fetched and edited reports, so tests start from the page state. */
export const resetScan = (): void => {
	scanStore.reset();
	requestStore.reset();
	delete window.jetpackProtectThreatCount;
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
	publishThreatCount( scanStore.get()?.threats?.length );
}

/**
 * Show the active threat count in the Protect menu badge and the admin bar notice, as `js/threat-count.js` does.
 *
 * @param count - Active threats, or undefined when the report has no list.
 */
function publishThreatCount( count?: number ) {
	if ( count === undefined || count === window.jetpackProtectThreatCount ) {
		return;
	}
	// The menu slug and event name are Dashboard::MENU_SLUG and Threat_Count::EVENT.
	window.jetpackMenuBadges?.setCount( 'jetpack-protect', count );
	window.jetpackProtectThreatCount = count;
	document.dispatchEvent(
		new CustomEvent( 'jetpack-protect-threat-count', { detail: { count } } )
	);
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
function mergeScan( next?: Partial< ScanState > ) {
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
 * Ask for a scan, then merge the report the request returns.
 *
 * @return Resolves once the request settles; never rejects.
 */
export function startScan(): Promise< void > {
	const hasPlan = !! getScan()?.hasPlan;
	recordEvent( 'jetpack_scan_scan_now', { has_plan: hasPlan } );
	// With Scan, show the scan as started right away; the free check only re-reads its report.
	requestStore.set( () => ( {
		...NO_REQUEST,
		isStarting: true,
		requestedAt: hasPlan ? Date.now() : null,
	} ) );
	return apiFetch< ScanState >( { path: SCAN_PATH, method: 'POST' } )
		.then( next => {
			mergeScan( next );
			requestStore.set( request => ( { ...request, isStarting: false } ) );
		} )
		.catch( ( e: { message?: string } ) =>
			requestStore.set( request => ( {
				...request,
				isStarting: false,
				requestedAt: null,
				startError: e?.message || __( 'The scan couldn’t be started.', 'jetpack-protect-pkg' ),
			} ) )
		);
}

/** Hide why the last scan request failed. */
export function dismissScanError(): void {
	requestStore.set( request => ( { ...request, startError: null } ) );
}

/**
 * Read the report again after polling gave up, with a fresh round of polls.
 *
 * @return Resolves once the store is updated; never rejects.
 */
export function checkScanAgain(): Promise< void > {
	requestStore.set( request => ( { ...request, polls: 0 } ) );
	return refreshScan();
}

/**
 * The scan this page requested, re-rendering when it changes.
 *
 * @return The request, and whether polling gave up on it.
 */
export function useScanRequest(): ScanRequest & { hasStoppedPolling: boolean } {
	const request = useSyncExternalStore( requestStore.subscribe, requestStore.get );
	return { ...request, hasStoppedPolling: request.polls >= MAX_POLLS };
}

/**
 * Whether a scan was requested but WordPress.com doesn't report it yet, as the Protect plugin checks.
 *
 * @param scan        - The latest report.
 * @param requestedAt - When this page requested a scan, if it did.
 * @return True while the request is recent and no newer report exists.
 */
function isRequestedScanNotStarted( scan: ScanState, requestedAt: number | null ): boolean {
	if ( ! requestedAt || Date.now() - requestedAt > REQUESTED_SCAN_TTL ) {
		return false;
	}
	const lastChecked = parseLastChecked( scan.lastChecked )?.getTime() ?? 0;
	return ! ( lastChecked > requestedAt );
}

/**
 * Whether a scan is running, or was just requested and is about to.
 *
 * @return True while a scan runs.
 */
export function useIsScanning(): boolean {
	const scan = useScan();
	const { requestedAt } = useScanRequest();
	return (
		!! scan &&
		! scan.error &&
		( !! scan.scanning || isRequestedScanNotStarted( scan, requestedAt ) )
	);
}

/**
 * Whether the page is in a background tab, kept up to date.
 *
 * @return True while the document is hidden.
 */
export function useIsDocumentHidden(): boolean {
	const [ isHidden, setIsHidden ] = useState( () => document.hidden );
	useEffect( () => {
		const onChange = () => setIsHidden( document.hidden );
		document.addEventListener( 'visibilitychange', onChange );
		return () => document.removeEventListener( 'visibilitychange', onChange );
	}, [] );
	return isHidden;
}

/**
 * Poll while a scan runs, pausing in background tabs and after MAX_POLLS. Mount it once per page.
 */
export function useScanPolling(): void {
	const isScanning = useIsScanning();
	const isHidden = useIsDocumentHidden();
	const { polls } = useScanRequest();

	useEffect( () => {
		if ( ! isScanning || isHidden || polls >= MAX_POLLS ) {
			return;
		}
		const timer = setTimeout(
			() =>
				refreshScan().finally( () =>
					requestStore.set( request => ( { ...request, polls: request.polls + 1 } ) )
				),
			pollInterval( polls )
		);
		return () => clearTimeout( timer );
	}, [ isScanning, isHidden, polls ] );
}

/**
 * Whether the host lets the site ignore threats.
 *
 * @return True unless the host turned ignoring off.
 */
export function useCanIgnore(): boolean {
	return useScan()?.canIgnore !== false;
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
