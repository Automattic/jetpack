import apiFetch from '@wordpress/api-fetch';
import { dispatch } from '@wordpress/data';
import { createElement, useCallback, useSyncExternalStore } from '@wordpress/element';
import { __, _n, sprintf, type TransformedText } from '@wordpress/i18n';
import { Icon, check } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { recordEvent } from '../../data/tracks';
import { loadHistory } from '../history/store';
import { getThreatLabel } from './labels';
import { SCAN_PATH, createStore, editScan, getScan, startRead, startReportRead } from './store';
import type { ScanState, ScanThreat } from './types';

type FixStatus = { status: string; error?: string | null; scan?: ScanState };

/** The action running on a threat, if any. */
export type ThreatActionState = { busy?: 'fixing' | 'ignoring' | 'unignoring' | 'deleting' };

const threatPath = ( id: string | number, action: string ) =>
	`${ SCAN_PATH }/threats/${ id }/${ action }`;

// Like the Protect plugin: check a running fix every few seconds, for about five minutes.
const FIX_POLL_INTERVAL = 3000;
const FIX_TIMEOUT = 5 * 60 * 1000;
// A fix keeps running on WordPress.com, so a few failed checks in a row don't end it.
const MAX_MISSED_POLLS = 3;
// Requests a bulk action keeps in flight at once, so a large selection doesn't flood the site.
const BULK_CONCURRENCY = 5;
let bulkRequests = 0;
const bulkQueue: Array< () => void > = [];

/**
 * Send one of a bulk action's requests once fewer than BULK_CONCURRENCY are in flight.
 *
 * @param send - Sends the request.
 * @return The request's promise.
 */
async function throttled< T >( send: () => Promise< T > ): Promise< T > {
	if ( bulkRequests < BULK_CONCURRENCY ) {
		bulkRequests++;
	} else {
		// A finishing request hands its slot straight over, so the count never overshoots.
		await new Promise< void >( resolve => bulkQueue.push( resolve ) );
	}
	try {
		return await send();
	} finally {
		const next = bulkQueue.shift();
		if ( next ) {
			next();
		} else {
			bulkRequests--;
		}
	}
}

// One id per threat, so its snackbar replaces its last ("Ignoring…" with "ignored") but not another threat's.
const noticeId = ( threat: ScanThreat ) => `jetpack-protect-threat-action-${ threat.id }`;

const describe = ( threat: ScanThreat ) => getThreatLabel( threat ).subject || threat.title || '';

// The store types `icon` as a string, but the snackbar renders any node; currentColor keeps it white.
const SUCCESS_ICON = createElement( Icon, {
	icon: check,
	fill: 'currentColor',
} ) as unknown as string;

const EMPTY: ThreatActionState = {};
const NO_ACTIONS: Record< string, ThreatActionState > = {};
const actionStore = createStore( () => NO_ACTIONS );

// Every action checks this first, so a second click can't send a duplicate request.
const isBusy = ( id: string | number ) => !! actionStore.get()[ String( id ) ]?.busy;

const setBusy = ( id: string | number, busy?: ThreatActionState[ 'busy' ] ) =>
	actionStore.set( states => ( { ...states, [ String( id ) ]: busy ? { busy } : EMPTY } ) );

type NoticeStatus = 'success' | 'info' | 'error';

/** Opens a threat in the inspector. */
type OpenThreat = ( threat: ScanThreat ) => void;

type NoticeAction = { label: string; onClick: () => void };

/** A translated message with `%s` for the threat's name. */
type Template = TransformedText< `${ string }%s${ string }` >;

/**
 * Show a threat's snackbar in the page's notices area, optionally with one action.
 *
 * @param threat  - The threat the message is about.
 * @param content - The finished message.
 * @param status  - The notice's kind.
 * @param action  - The snackbar's button, such as Undo.
 */
function show( threat: ScanThreat, content: string, status: NoticeStatus, action?: NoticeAction ) {
	showNotice( noticeId( threat ), content, status, action );
}

/**
 * Show a snackbar in the page's notices area, replacing any with the same id.
 *
 * @param id      - The notice id.
 * @param content - The finished message.
 * @param status  - The notice's kind.
 * @param action  - The snackbar's button, such as Undo.
 */
function showNotice( id: string, content: string, status: NoticeStatus, action?: NoticeAction ) {
	dispatch( noticesStore ).createNotice( status, content, {
		type: 'snackbar',
		id,
		// Progress and errors stay until dismissed, so they can't vanish before the action ends.
		explicitDismiss: status !== 'success',
		icon: status === 'success' ? SUCCESS_ICON : null,
		actions: action ? [ action ] : [],
	} );
}

/**
 * Show a threat's snackbar from a message that names it.
 *
 * @param threat   - The threat.
 * @param template - The message, with `%s` for the threat's name.
 * @param status   - The notice's kind.
 * @param action   - The snackbar's button, such as Undo.
 */
function notify(
	threat: ScanThreat,
	template: Template,
	status: NoticeStatus = 'success',
	action?: NoticeAction
) {
	show( threat, sprintf( template, describe( threat ) ), status, action );
}

/**
 * Say an action has started, with a button that opens the threat in the inspector.
 *
 * @param threat   - The threat.
 * @param template - The message, with `%s` for the threat's name.
 * @param open     - Opens the threat in the inspector.
 */
function notifyStarted( threat: ScanThreat, template: Template, open?: OpenThreat ) {
	const content = sprintf( template, describe( threat ) );
	const view: NoticeAction | undefined = open && {
		label: __( 'View', 'jetpack-protect-pkg' ),
		// A snackbar removes itself when its action is clicked, so show it again.
		onClick: () => {
			open( threat );
			show( threat, content, 'info', view );
		},
	};
	show( threat, content, 'info', view );
}

/**
 * End a failed action and say what went wrong.
 *
 * @param threat   - The threat.
 * @param e        - The error, whose message follows the threat's name when it has one.
 * @param template - What to say otherwise, with `%s` for the threat's name.
 */
function fail( threat: ScanThreat, e: unknown, template: Template ) {
	setBusy( threat.id );
	const reason = ( e as { message?: string } )?.message;
	if ( reason ) {
		const content = sprintf(
			/* translators: 1: a threat, such as "Contact Form 7 (5.3.1)" or "index.php". 2: why the action failed. */
			__( 'Threat in %1$s: %2$s', 'jetpack-protect-pkg' ),
			describe( threat ),
			reason
		);
		show( threat, content, 'error' );
	} else {
		notify( threat, template, 'error' );
	}
}

const otherThan = ( threat: ScanThreat ) => ( item: ScanThreat ) =>
	String( item.id ) !== String( threat.id );

/**
 * Fetch the threats the site ignored, for the Ignored view.
 *
 * @return Resolves once the list is in the store; failures leave it unloaded.
 */
export function loadIgnored(): Promise< void > {
	const apply = startRead();
	return apiFetch< ScanThreat[] >( { path: `${ SCAN_PATH }/ignored` } )
		.then( ignored => apply( { ignored } ) )
		.catch( () => {} );
}

/**
 * Ignore or unignore a threat, moving it between the active and ignored lists, with Undo.
 *
 * @param threat - The threat.
 * @param ignore - True to ignore, false to unignore.
 * @param open   - Opens the threat in the inspector, from the notice while it runs.
 * @param batch  - Part of a bulk action, which marked the threat busy and reports for the batch.
 * @return Resolves to whether it worked, once done or once the error is shown.
 */
function setIgnored(
	threat: ScanThreat,
	ignore: boolean,
	open?: OpenThreat,
	batch = false
): Promise< boolean > {
	if ( batch ) {
		return throttled( () => request( threat, ignore ) ).then(
			() => true,
			() => {
				setBusy( threat.id );
				return false;
			}
		);
	}
	if ( isBusy( threat.id ) ) {
		return Promise.resolve( false );
	}
	setBusy( threat.id, ignore ? 'ignoring' : 'unignoring' );
	notifyStarted(
		threat,
		ignore
			? /* translators: %s is a threat, such as "Contact Form 7 (5.3.1)" or "index.php". */
				__( 'Ignoring the threat in %s…', 'jetpack-protect-pkg' )
			: /* translators: %s is a threat, such as "Contact Form 7 (5.3.1)" or "index.php". */
				__( 'Unignoring the threat in %s…', 'jetpack-protect-pkg' ),
		open
	);

	return request( threat, ignore )
		.then( () => {
			notify(
				threat,
				ignore
					? /* translators: %s is a threat, such as "Contact Form 7 (5.3.1)" or "index.php". */
						__( 'Ignored the threat in %s.', 'jetpack-protect-pkg' )
					: /* translators: %s is a threat, such as "Contact Form 7 (5.3.1)" or "index.php". */
						__( 'Unignored the threat in %s.', 'jetpack-protect-pkg' ),
				'success',
				{
					label: __( 'Undo', 'jetpack-protect-pkg' ),
					onClick: () => setIgnored( threat, ! ignore, open ),
				}
			);
			return true;
		} )
		.catch( e => {
			fail(
				threat,
				e,
				ignore
					? /* translators: %s is a threat, such as "Contact Form 7 (5.3.1)" or "index.php". */
						__( 'The threat in %s couldn’t be ignored.', 'jetpack-protect-pkg' )
					: /* translators: %s is a threat, such as "Contact Form 7 (5.3.1)" or "index.php". */
						__( 'The threat in %s couldn’t be unignored.', 'jetpack-protect-pkg' )
			);
			return false;
		} );
}

/**
 * Ignore or unignore a threat on WordPress.com, then move it between the active and ignored lists.
 *
 * @param threat - The threat, already marked busy.
 * @param ignore - True to ignore, false to unignore.
 * @return Resolves once moved and no longer busy; rejects with the request's error.
 */
function request( threat: ScanThreat, ignore: boolean ): Promise< void > {
	// The Scan page's names, so its dashboards count these too.
	recordEvent( ignore ? 'jetpack_scan_ignore_threat_click' : 'jetpack_scan_unignore_threat_click' );
	return apiFetch( {
		path: threatPath( threat.id, ignore ? 'ignore' : 'unignore' ),
		method: 'POST',
	} ).then(
		() => {
			const moved = { ...threat, status: ignore ? ( 'ignored' as const ) : ( 'current' as const ) };
			editScan( current => {
				const threats = ( current.threats ?? [] ).filter( otherThan( threat ) );
				const ignored = ( current.ignored ?? [] ).filter( otherThan( threat ) );
				return ignore
					? { ...current, threats, ignored: [ moved, ...ignored ] }
					: { ...current, threats: [ moved, ...threats ], ignored };
			} );
			setBusy( threat.id );
			recordEvent(
				ignore ? 'jetpack_scan_ignore_threat_success' : 'jetpack_scan_unignore_threat_success'
			);
		},
		e => {
			recordEvent(
				ignore ? 'jetpack_scan_ignore_threat_failed' : 'jetpack_scan_unignore_threat_failed'
			);
			throw e;
		}
	);
}

export const ignoreThreat = ( threat: ScanThreat, open?: OpenThreat ) =>
	setIgnored( threat, true, open );
export const unignoreThreat = ( threat: ScanThreat, open?: OpenThreat ) =>
	setIgnored( threat, false, open );

/**
 * Focus a threat's row when focus was lost, as when the button that started its action goes away.
 *
 * @param item - The threat.
 */
export function refocusRow( item: ScanThreat ) {
	const title = Array.from( document.querySelectorAll< HTMLElement >( '[data-threat-id]' ) ).find(
		element => element.dataset.threatId === String( item.id )
	);
	const { activeElement, body } = title?.ownerDocument ?? {};
	if ( title && ( ! activeElement || activeElement === body ) ) {
		title.focus();
	}
}

/** How a fix ended; `pending` while it may still be running, here or on WordPress.com. */
export type FixResult = 'fixed' | 'failed' | 'pending';

// A client error says the request itself is wrong, so checking again won't help; a timeout or rate limit might.
const isClientError = ( e: unknown ) => {
	const status = ( e as { data?: { status?: number } } )?.data?.status;
	return !! status && status >= 400 && status < 500 && status !== 408 && status !== 429;
};

/**
 * Whether Scan's fix for the threat deletes the plugin or theme it is in.
 *
 * @param threat - The threat.
 * @return True when the fix deletes the software.
 */
export function isDeleteFix( threat: ScanThreat ): boolean {
	return (
		threat.signature === 'Vulnerable.WP.Extension' &&
		!! threat.fixable &&
		threat.fixable.fixer === 'delete'
	);
}

/**
 * Ask Scan to fix a threat, then follow the fix until it finishes.
 *
 * @param threat - The threat.
 * @param open   - Opens the threat in the inspector, from the notice while it runs.
 * @return Resolves to how the fix ended; `pending` for a threat already being acted on.
 */
export const fixThreat = ( threat: ScanThreat, open?: OpenThreat ) => runFix( threat, open, false );

/**
 * Fix a threat on its own or as part of a bulk action.
 *
 * @param threat - The threat.
 * @param open   - Opens the threat in the inspector, from the notice while it runs.
 * @param batch  - Part of a bulk action, which marked the threat busy and reports for the batch.
 * @return Resolves to how the fix ended.
 */
async function runFix(
	threat: ScanThreat,
	open: OpenThreat | undefined,
	batch: boolean
): Promise< FixResult > {
	const { id } = threat;
	const end = ( result: FixResult, e: unknown, template: Template ): FixResult => {
		recordEvent( 'jetpack_scan_fix_threat_failed' );
		if ( batch ) {
			setBusy( id );
		} else {
			fail( threat, e, template );
		}
		return result;
	};
	const send = ( options: { path: string; method?: string } ) =>
		batch ? throttled( () => apiFetch< FixStatus >( options ) ) : apiFetch< FixStatus >( options );
	if ( ! batch ) {
		if ( isBusy( id ) ) {
			return 'pending';
		}
		setBusy( id, 'fixing' );
		/* translators: %s is a threat, such as "Contact Form 7 (5.3.1)" or "index.php". */
		notifyStarted( threat, __( 'Fixing the threat in %s…', 'jetpack-protect-pkg' ), open );
	}
	recordEvent( 'jetpack_scan_fix_threat_click' );
	/* translators: %s is a threat, such as "Contact Form 7 (5.3.1)" or "index.php". */
	const takingLonger = __(
		'The fix for the threat in %s is taking longer than expected. Check back in a few minutes.',
		'jetpack-protect-pkg'
	);

	try {
		let apply = startReportRead();
		let result = await send( { path: threatPath( id, 'fix' ), method: 'POST' } );
		let missed = 0;
		// A deadline, not a poll count, so polls queued behind a bulk action don't stretch it.
		const deadline = Date.now() + FIX_TIMEOUT;
		while ( result.status !== 'fixed' && result.status !== 'not_fixed' ) {
			if ( Date.now() >= deadline ) {
				return end( 'pending', null, takingLonger );
			}
			await new Promise( resolve => setTimeout( resolve, FIX_POLL_INTERVAL ) );
			apply = startReportRead();
			try {
				result = await send( { path: threatPath( id, 'fix' ) } );
				missed = 0;
			} catch ( e ) {
				if ( isClientError( e ) ) {
					throw e;
				}
				// The fix was started, so losing track of it doesn't mean it failed.
				if ( ++missed >= MAX_MISSED_POLLS ) {
					return end( 'pending', null, takingLonger );
				}
			}
		}

		if ( result.scan ) {
			apply( result.scan );
		}
		if ( result.status === 'fixed' ) {
			// A Scan read already in flight predates the fix, so record it like the reader's own edits.
			editScan( current => ( {
				...current,
				threats: current.threats?.filter( otherThan( threat ) ),
			} ) );
			setBusy( id );
			recordEvent( 'jetpack_scan_fix_threat_success' );
			if ( ! batch ) {
				/* translators: %s is a threat, such as "Contact Form 7 (5.3.1)" or "index.php". */
				notify( threat, __( 'Fixed the threat in %s.', 'jetpack-protect-pkg' ) );
			}
			return 'fixed';
		}
		return end(
			'failed',
			{ message: result.error },
			/* translators: %s is a threat, such as "Contact Form 7 (5.3.1)" or "index.php". */
			__(
				'Jetpack couldn’t fix the threat in %s. Contact Jetpack support for help.',
				'jetpack-protect-pkg'
			)
		);
	} catch ( e ) {
		return end(
			'failed',
			e,
			/* translators: %s is a threat, such as "Contact Form 7 (5.3.1)" or "index.php". */
			__( 'The fix for the threat in %s couldn’t be started.', 'jetpack-protect-pkg' )
		);
	}
}

// Each bulk action gets its own snackbar, so a second batch doesn't replace the first's result.
let bulkRuns = 0;

/**
 * Fix several threats at once, with one snackbar for the batch.
 *
 * @param threats - The threats.
 * @param open    - Opens a threat in the inspector, for a batch of one.
 * @return Resolves once every fix has finished, failed, or run past the time Jetpack waits.
 */
export async function fixThreats( threats: ScanThreat[], open?: OpenThreat ): Promise< void > {
	// A fix that deletes software needs its slug confirmed first, so a batch never starts one.
	const idle = threats.filter(
		threat =>
			! isBusy( threat.id ) &&
			! isDeleteFix( threat ) &&
			// Like Protect, which fixes these one at a time but never as part of fixing several.
			! ( threats.length > 1 && threat.fixable && threat.fixable.extras?.isBulkFixable === false )
	);
	if ( idle.length < 2 ) {
		await Promise.all( idle.map( threat => fixThreat( threat, open ) ) );
		return;
	}
	const id = `jetpack-protect-threat-action-bulk-${ ++bulkRuns }`;
	const total = idle.length;
	showNotice(
		id,
		sprintf(
			/* translators: %d is a number of threats, two or more. */
			_n( 'Fixing %d threat…', 'Fixing %d threats…', total, 'jetpack-protect-pkg' ),
			total
		),
		'info'
	);
	idle.forEach( threat => setBusy( threat.id, 'fixing' ) );
	const results = await Promise.all( idle.map( threat => runFix( threat, open, true ) ) );
	const count = ( result: FixResult ) => results.filter( item => item === result ).length;
	const [ fixed, pending, failed ] = [ count( 'fixed' ), count( 'pending' ), count( 'failed' ) ];
	if ( fixed === total ) {
		showNotice(
			id,
			sprintf(
				/* translators: %d is a number of threats, two or more. */
				_n( 'Fixed %d threat.', 'Fixed %d threats.', total, 'jetpack-protect-pkg' ),
				total
			),
			'success'
		);
		return;
	}
	const sentences = [];
	if ( fixed ) {
		sentences.push(
			sprintf(
				/* translators: 1: how many threats were fixed. 2: how many Jetpack tried to fix. */
				_n(
					'Fixed %1$d of %2$d threat.',
					'Fixed %1$d of %2$d threats.',
					total,
					'jetpack-protect-pkg'
				),
				fixed,
				total
			)
		);
	}
	if ( pending ) {
		sentences.push(
			sprintf(
				/* translators: %d is a number of fixes. */
				_n(
					'%d fix is taking longer than expected. Check back in a few minutes.',
					'%d fixes are taking longer than expected. Check back in a few minutes.',
					pending,
					'jetpack-protect-pkg'
				),
				pending
			)
		);
	}
	if ( failed ) {
		sentences.push(
			sprintf(
				/* translators: %d is a number of threats. */
				_n(
					'%d threat couldn’t be fixed. Fix it on its own to see why.',
					'%d threats couldn’t be fixed. Fix them one at a time to see why.',
					failed,
					'jetpack-protect-pkg'
				),
				failed
			)
		);
	}
	showNotice( id, sentences.join( ' ' ), failed ? 'error' : 'info' );
}

/**
 * Ignore or unignore several threats at once, with one snackbar for the batch and Undo.
 *
 * @param threats - The threats.
 * @param ignore  - True to ignore, false to unignore.
 * @param open    - Opens a threat in the inspector, for a batch of one.
 * @return Resolves once every request has finished.
 */
async function setManyIgnored(
	threats: ScanThreat[],
	ignore: boolean,
	open?: OpenThreat
): Promise< void > {
	const idle = threats.filter( threat => ! isBusy( threat.id ) );
	if ( idle.length < 2 ) {
		await Promise.all( idle.map( threat => setIgnored( threat, ignore, open ) ) );
		return;
	}
	const id = `jetpack-protect-threat-action-bulk-${ ++bulkRuns }`;
	const total = idle.length;
	const started = ignore
		? /* translators: %d is a number of threats, two or more. */
			_n( 'Ignoring %d threat…', 'Ignoring %d threats…', total, 'jetpack-protect-pkg' )
		: /* translators: %d is a number of threats, two or more. */
			_n( 'Unignoring %d threat…', 'Unignoring %d threats…', total, 'jetpack-protect-pkg' );
	showNotice( id, sprintf( started, total ), 'info' );
	idle.forEach( threat => setBusy( threat.id, ignore ? 'ignoring' : 'unignoring' ) );
	const results = await Promise.all(
		idle.map( threat => setIgnored( threat, ignore, open, true ) )
	);
	const done = idle.filter( ( _, index ) => results[ index ] );
	const undo: NoticeAction = {
		label: __( 'Undo', 'jetpack-protect-pkg' ),
		onClick: () => setManyIgnored( done, ! ignore, open ),
	};
	if ( done.length === total ) {
		const finished = ignore
			? /* translators: %d is a number of threats, two or more. */
				_n( 'Ignored %d threat.', 'Ignored %d threats.', total, 'jetpack-protect-pkg' )
			: /* translators: %d is a number of threats, two or more. */
				_n( 'Unignored %d threat.', 'Unignored %d threats.', total, 'jetpack-protect-pkg' );
		showNotice( id, sprintf( finished, total ), 'success', undo );
		return;
	}
	if ( ! done.length ) {
		const failed = ignore
			? /* translators: %d is a number of threats, two or more. */
				_n(
					'The %d threat couldn’t be ignored.',
					'The %d threats couldn’t be ignored.',
					total,
					'jetpack-protect-pkg'
				)
			: /* translators: %d is a number of threats, two or more. */
				_n(
					'The %d threat couldn’t be unignored.',
					'The %d threats couldn’t be unignored.',
					total,
					'jetpack-protect-pkg'
				);
		showNotice( id, sprintf( failed, total ), 'error' );
		return;
	}
	const partial = ignore
		? /* translators: 1: how many threats were ignored. 2: how many Jetpack tried to ignore. */
			_n(
				'Ignored %1$d of %2$d threat. Try the others again.',
				'Ignored %1$d of %2$d threats. Try the others again.',
				total,
				'jetpack-protect-pkg'
			)
		: /* translators: 1: how many threats were unignored. 2: how many Jetpack tried to unignore. */
			_n(
				'Unignored %1$d of %2$d threat. Try the others again.',
				'Unignored %1$d of %2$d threats. Try the others again.',
				total,
				'jetpack-protect-pkg'
			);
	showNotice( id, sprintf( partial, done.length, total ), 'error', undo );
}

export const ignoreThreats = ( threats: ScanThreat[], open?: OpenThreat ) =>
	setManyIgnored( threats, true, open );

/**
 * What is happening to a threat, re-rendering when it changes.
 *
 * @param id - The threat id.
 * @return The threat's action state.
 */
export function useThreatAction( id: string | number ): ThreatActionState {
	return useSyncExternalStore(
		actionStore.subscribe,
		() => actionStore.get()[ String( id ) ] ?? EMPTY
	);
}

/**
 * Looks up the action running on any threat, re-rendering when one starts or ends.
 *
 * @return Gets a threat's running action by id.
 */
export function useGetThreatBusy(): ( id: string | number ) => ThreatActionState[ 'busy' ] {
	const states = useSyncExternalStore( actionStore.subscribe, actionStore.get );
	return useCallback( id => states[ String( id ) ]?.busy, [ states ] );
}

/**
 * Delete the plugin or theme a threat is in, and drop every threat reported in it.
 *
 * @param threat - A threat in an inactive plugin or an unused theme.
 * @return Resolves to why the delete failed, or null once it's done.
 */
export function deleteSoftware( threat: ScanThreat ): Promise< string | null > {
	const { type, slug, name } = threat.extension ?? {};
	const isElsewhere = ( item: ScanThreat ) =>
		item.extension?.type !== type || item.extension?.slug !== slug;
	const scan = getScan();
	const ids = [ threat, ...( scan?.threats ?? [] ), ...( scan?.ignored ?? [] ) ]
		.filter( item => ! isElsewhere( item ) )
		.map( item => item.id );

	// A fix or ignore that ends after the delete would put the deleted threats back.
	if ( ids.some( isBusy ) ) {
		return Promise.resolve(
			sprintf(
				/* translators: %s is a plugin or theme, such as "Contact Form 7". */
				__(
					'%s can’t be deleted while one of its threats is being fixed or ignored. Try again once that finishes.',
					'jetpack-protect-pkg'
				),
				name || slug
			)
		);
	}
	ids.forEach( id => setBusy( id, 'deleting' ) );

	return apiFetch( {
		path: `${ SCAN_PATH }/software/delete`,
		method: 'POST',
		data: { type, slug },
	} )
		.then( () => {
			editScan( current => ( {
				...current,
				threats: ( current.threats ?? [] ).filter( isElsewhere ),
				ignored: current.ignored?.filter( isElsewhere ),
			} ) );
			const content = sprintf(
				/* translators: %s is a plugin or theme, such as "Contact Form 7". */
				__( 'Deleted %s.', 'jetpack-protect-pkg' ),
				name || slug
			);
			show( threat, content, 'success' );
			return null;
		} )
		.catch(
			( e: { message?: string } ) =>
				e?.message ||
				sprintf(
					/* translators: %s is a plugin or theme, such as "Contact Form 7". */
					__( '%s couldn’t be deleted.', 'jetpack-protect-pkg' ),
					name || slug
				)
		)
		.finally( () => ids.forEach( id => setBusy( id ) ) );
}

/** The database row a threat was found in, read from the site. */
export type ThreatRow = { columns: Record< string, unknown >; canDelete: boolean };

/**
 * Read the database row a current threat was found in.
 *
 * @param threat - A database threat.
 * @return The row.
 */
export const getThreatRow = ( threat: ScanThreat ): Promise< ThreatRow > =>
	apiFetch< ThreatRow >( { path: threatPath( threat.id, 'row' ) } );

/**
 * Delete the option a threat was found in; the site then lists the threat as fixed.
 *
 * @param threat - A database threat.
 * @return Resolves to an error message, or null once deleted.
 */
export function deleteThreatRow( threat: ScanThreat ): Promise< string | null > {
	if ( isBusy( threat.id ) ) {
		return Promise.resolve(
			__( 'This threat is busy. Try again once that finishes.', 'jetpack-protect-pkg' )
		);
	}
	setBusy( threat.id, 'deleting' );

	return apiFetch( { path: threatPath( threat.id, 'row' ), method: 'DELETE' } )
		.then( () => {
			editScan( current => ( {
				...current,
				threats: ( current.threats ?? [] ).filter( item => item.id !== threat.id ),
			} ) );
			show(
				threat,
				__( 'Deleted the option and marked the threat as fixed.', 'jetpack-protect-pkg' ),
				'success'
			);
			loadHistory( true );
			return null;
		} )
		.catch(
			( e: { message?: string } ) =>
				e?.message || __( 'The option couldn’t be deleted.', 'jetpack-protect-pkg' )
		)
		.finally( () => setBusy( threat.id ) );
}
