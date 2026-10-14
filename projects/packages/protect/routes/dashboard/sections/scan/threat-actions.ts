import apiFetch from '@wordpress/api-fetch';
import { dispatch } from '@wordpress/data';
import { createElement, useSyncExternalStore } from '@wordpress/element';
import { __, sprintf, type TransformedText } from '@wordpress/i18n';
import { Icon, check } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { getThreatLabel } from './labels';
import { SCAN_PATH, createStore, getScan, mergeScan, setScan } from './store';
import type { ScanState, ScanThreat } from './types';

type FixStatus = { status: string; error?: string | null; scan?: ScanState };

/** The action running on a threat, if any. */
export type ThreatActionState = { busy?: 'fixing' | 'ignoring' | 'unignoring' | 'deleting' };

const threatPath = ( id: string | number, action: string ) =>
	`${ SCAN_PATH }/threats/${ id }/${ action }`;

// Like the Protect plugin: check a running fix every few seconds, for about five minutes.
const FIX_POLL_INTERVAL = 3000;
const MAX_FIX_POLLS = 100;

// One id per threat, so its snackbar replaces its last ("Ignoring…" with "ignored") but not another threat's.
const noticeId = ( threat: ScanThreat ) => `jetpack-protect-threat-action-${ threat.id }`;

const describe = ( threat: ScanThreat ) => getThreatLabel( threat ).subject || threat.title || '';

// The store types `icon` as a string, but the snackbar renders any node; currentColor keeps it white.
const SUCCESS_ICON = createElement( Icon, {
	icon: check,
	fill: 'currentColor',
} ) as unknown as string;

const EMPTY: ThreatActionState = {};
const actionStore = createStore< Record< string, ThreatActionState > >( () => ( {} ) );

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
	dispatch( noticesStore ).createNotice( status, content, {
		type: 'snackbar',
		id: noticeId( threat ),
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
	return apiFetch< ScanThreat[] >( { path: `${ SCAN_PATH }/ignored` } )
		.then( ignored => mergeScan( { ignored } ) )
		.catch( () => {} );
}

/**
 * Ignore or unignore a threat, moving it between the active and ignored lists, with Undo.
 *
 * @param threat - The threat.
 * @param ignore - True to ignore, false to unignore.
 * @param open   - Opens the threat in the inspector, from the notice while it runs.
 * @return Resolves once done, or once the error is shown.
 */
function setIgnored( threat: ScanThreat, ignore: boolean, open?: OpenThreat ): Promise< void > {
	if ( isBusy( threat.id ) ) {
		return Promise.resolve();
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
		} )
		.catch( e =>
			fail(
				threat,
				e,
				ignore
					? /* translators: %s is a threat, such as "Contact Form 7 (5.3.1)" or "index.php". */
						__( 'The threat in %s couldn’t be ignored.', 'jetpack-protect-pkg' )
					: /* translators: %s is a threat, such as "Contact Form 7 (5.3.1)" or "index.php". */
						__( 'The threat in %s couldn’t be unignored.', 'jetpack-protect-pkg' )
			)
		);
}

export const ignoreThreat = ( threat: ScanThreat, open?: OpenThreat ) =>
	setIgnored( threat, true, open );
export const unignoreThreat = ( threat: ScanThreat, open?: OpenThreat ) =>
	setIgnored( threat, false, open );

/**
 * Ask Scan to fix a threat, then follow the fix until it finishes.
 *
 * @param threat - The threat.
 * @param open   - Opens the threat in the inspector, from the notice while it runs.
 * @return Resolves once the fix has finished or failed.
 */
export async function fixThreat( threat: ScanThreat, open?: OpenThreat ): Promise< void > {
	const { id } = threat;
	if ( isBusy( id ) ) {
		return;
	}
	setBusy( id, 'fixing' );
	/* translators: %s is a threat, such as "Contact Form 7 (5.3.1)" or "index.php". */
	notifyStarted( threat, __( 'Fixing the threat in %s…', 'jetpack-protect-pkg' ), open );

	try {
		let result = await apiFetch< FixStatus >( { path: threatPath( id, 'fix' ), method: 'POST' } );
		for ( let polls = 0; result.status !== 'fixed' && result.status !== 'not_fixed'; polls++ ) {
			if ( polls >= MAX_FIX_POLLS ) {
				return fail(
					threat,
					null,
					/* translators: %s is a threat, such as "Contact Form 7 (5.3.1)" or "index.php". */
					__(
						'The fix for the threat in %s is taking longer than expected. Check back in a few minutes.',
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
			/* translators: %s is a threat, such as "Contact Form 7 (5.3.1)" or "index.php". */
			return notify( threat, __( 'Fixed the threat in %s.', 'jetpack-protect-pkg' ) );
		}
		fail(
			threat,
			{ message: result.error },
			/* translators: %s is a threat, such as "Contact Form 7 (5.3.1)" or "index.php". */
			__(
				'Jetpack couldn’t fix the threat in %s. Contact Jetpack support for help.',
				'jetpack-protect-pkg'
			)
		);
	} catch ( e ) {
		fail(
			threat,
			e,
			/* translators: %s is a threat, such as "Contact Form 7 (5.3.1)" or "index.php". */
			__( 'The fix for the threat in %s couldn’t be started.', 'jetpack-protect-pkg' )
		);
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
			setScan( current => ( {
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
