import apiFetch from '@wordpress/api-fetch';
import { dispatch } from '@wordpress/data';
import { useSyncExternalStore } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { SCAN_PATH, createStore, mergeScan, setScan } from './store';
import type { ScanState, ScanThreat } from './types';

type FixStatus = { status: string; error?: string | null; scan?: ScanState };

/** The action running on a threat, if any. */
export type ThreatActionState = { busy?: 'fixing' | 'ignoring' | 'unignoring' };

const threatPath = ( id: string | number, action: string ) =>
	`${ SCAN_PATH }/threats/${ id }/${ action }`;

// Like the Protect plugin: check a running fix every few seconds, for about five minutes.
const FIX_POLL_INTERVAL = 3000;
const MAX_FIX_POLLS = 100;

// One id for every threat action, so each snackbar replaces the last ("Ignoring…" with "Threat ignored.").
const NOTICE_ID = 'jetpack-protect-threat-action';

const EMPTY: ThreatActionState = {};
const actionStore = createStore< Record< string, ThreatActionState > >( () => ( {} ) );

const setBusy = ( id: string | number, busy?: ThreatActionState[ 'busy' ] ) =>
	actionStore.set( states => ( { ...states, [ String( id ) ]: busy ? { busy } : EMPTY } ) );

/**
 * Show a snackbar in the page's notices area, optionally with an Undo action.
 *
 * @param content - The message.
 * @param undo    - Reverses what the message reports.
 * @param status  - The notice's kind.
 */
function notify(
	content: string,
	undo?: () => void,
	status: 'success' | 'info' | 'error' = 'success'
) {
	dispatch( noticesStore ).createNotice( status, content, {
		type: 'snackbar',
		id: NOTICE_ID,
		actions: undo ? [ { label: __( 'Undo', 'jetpack-protect-pkg' ), onClick: undo } ] : [],
	} );
}

/**
 * End a failed action and say what went wrong.
 *
 * @param id      - The threat id.
 * @param e       - The error, whose message is shown when it has one.
 * @param message - What to say otherwise.
 */
function fail( id: string | number, e: unknown, message: string ) {
	setBusy( id );
	notify( ( e as { message?: string } )?.message || message, undefined, 'error' );
}

const otherThan = ( threat: ScanThreat ) => ( item: ScanThreat ) =>
	String( item.id ) !== String( threat.id );

/**
 * Fetch the threats the site ignored, for the Ignored view.
 *
 * @return Resolves once the list is in the store; failures leave it unloaded.
 */
export function loadIgnored(): Promise< void > {
	return apiFetch< ScanThreat[] >( { path: `${ SCAN_PATH }/ignored` } )
		.then( ignored => mergeScan( { ignored } ) )
		.catch( () => {} );
}

/**
 * Ignore or unignore a threat, moving it between the active and ignored lists, with Undo.
 *
 * @param threat - The threat.
 * @param ignore - True to ignore, false to unignore.
 * @return Resolves once done, or once the error is shown.
 */
function setIgnored( threat: ScanThreat, ignore: boolean ): Promise< void > {
	setBusy( threat.id, ignore ? 'ignoring' : 'unignoring' );
	notify(
		ignore
			? __( 'Ignoring threat…', 'jetpack-protect-pkg' )
			: __( 'Unignoring threat…', 'jetpack-protect-pkg' ),
		undefined,
		'info'
	);

	return apiFetch( {
		path: threatPath( threat.id, ignore ? 'ignore' : 'unignore' ),
		method: 'POST',
	} )
		.then( () => {
			const moved = { ...threat, status: ignore ? ( 'ignored' as const ) : ( 'current' as const ) };
			setScan( current => {
				const threats = ( current.threats ?? [] ).filter( otherThan( threat ) );
				const ignored = ( current.ignored ?? [] ).filter( otherThan( threat ) );
				return ignore
					? { ...current, threats, ignored: [ moved, ...ignored ] }
					: { ...current, threats: [ moved, ...threats ], ignored };
			} );
			setBusy( threat.id );
			notify(
				ignore
					? __( 'Threat ignored.', 'jetpack-protect-pkg' )
					: __( 'Threat unignored.', 'jetpack-protect-pkg' ),
				() => setIgnored( threat, ! ignore )
			);
		} )
		.catch( e =>
			fail(
				threat.id,
				e,
				ignore
					? __( 'The threat couldn’t be ignored.', 'jetpack-protect-pkg' )
					: __( 'The threat couldn’t be unignored.', 'jetpack-protect-pkg' )
			)
		);
}

export const ignoreThreat = ( threat: ScanThreat ) => setIgnored( threat, true );
export const unignoreThreat = ( threat: ScanThreat ) => setIgnored( threat, false );

/**
 * Ask Scan to fix a threat, then follow the fix until it finishes.
 *
 * @param threat - The threat.
 * @return Resolves once the fix has finished or failed.
 */
export async function fixThreat( threat: ScanThreat ): Promise< void > {
	const { id } = threat;
	setBusy( id, 'fixing' );
	notify( __( 'Fixing threat…', 'jetpack-protect-pkg' ), undefined, 'info' );

	try {
		let result = await apiFetch< FixStatus >( { path: threatPath( id, 'fix' ), method: 'POST' } );
		for ( let polls = 0; result.status !== 'fixed' && result.status !== 'not_fixed'; polls++ ) {
			if ( polls >= MAX_FIX_POLLS ) {
				return fail(
					id,
					null,
					__(
						'The fix is taking longer than expected. Check back in a few minutes.',
						'jetpack-protect-pkg'
					)
				);
			}
			await new Promise( resolve => setTimeout( resolve, FIX_POLL_INTERVAL ) );
			result = await apiFetch< FixStatus >( { path: threatPath( id, 'fix' ) } );
		}

		mergeScan( result.scan );
		if ( result.status === 'fixed' ) {
			setBusy( id );
			return notify( __( 'Threat fixed.', 'jetpack-protect-pkg' ) );
		}
		fail(
			id,
			null,
			result.error ||
				__(
					'Jetpack couldn’t fix this threat. Contact Jetpack support for help.',
					'jetpack-protect-pkg'
				)
		);
	} catch ( e ) {
		fail( id, e, __( 'The fix couldn’t be started.', 'jetpack-protect-pkg' ) );
	}
}

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
