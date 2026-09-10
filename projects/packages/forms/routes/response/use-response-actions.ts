/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useRegistry } from '@wordpress/data';
import { useCallback, useMemo, useRef, useState } from '@wordpress/element';
import { useNavigate } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { getActions } from '../responses/actions.tsx';
import { buildListLink } from './pinned-view.ts';
import getResponseQuery from './query.ts';
import repairResponseRecord from './repair-record.ts';
/**
 * Types
 */
import type { PinnedViewQuery } from './pinned-view.ts';
import type { Action, ReportingAction, Registry } from '../../src/dashboard/inbox/stage/types.tsx';
import type { FormResponse } from '../../src/types/index.ts';

/**
 * Which response statuses each action applies to.
 *
 * One table, read by both the menu (to decide what to render) and the action
 * handlers (to decide what to run), so the two cannot disagree about what is on
 * offer — the keyboard exposes every action unconditionally, and a shortcut that
 * silently does nothing is worse than one that isn't bound.
 *
 * `draft` is listed everywhere `publish` is: the inbox spans both
 * (`RESPONSE_STATUS_BY_VIEW.inbox` is `'draft,publish'`, and the counts query
 * sums `post_status IN ('publish','draft')`), so a draft response is an ordinary
 * inbox response that can be spammed or trashed like any other.
 */
export const ACTION_APPLIES_TO = {
	markAsSpam: [ 'publish', 'draft' ],
	markAsNotSpam: [ 'spam' ],
	moveToTrash: [ 'publish', 'draft', 'spam' ],
	restore: [ 'trash' ],
	deletePermanently: [ 'trash' ],
} as const satisfies Record< string, readonly FormResponse[ 'status' ][] >;

/**
 * Whether an action is offered for a response in a given status.
 *
 * @param action - The action name.
 * @param status - The response's current status.
 * @return Whether the action applies.
 */
export function canRunAction(
	action: keyof typeof ACTION_APPLIES_TO,
	status: FormResponse[ 'status' ] | undefined
): boolean {
	return ( ACTION_APPLIES_TO[ action ] as readonly string[] ).includes( status as string );
}

export type ResponseActions = {
	/** Whether a mutation on this response is in flight. */
	isPending: boolean;
	/** Move the response to spam. No-op unless the response is currently in the inbox. */
	markAsSpam: () => void;
	/** Take the response out of spam. No-op unless it is currently spam. */
	markAsNotSpam: () => void;
	/** Move the response to trash. No-op if it is already trashed. */
	moveToTrash: () => void;
	/** Restore a trashed response. No-op unless it is currently trashed. */
	restore: () => void;
	/** Permanently delete a trashed response, then leave the page. */
	deletePermanently: () => void;
	/** Flip the read/unread flag. */
	toggleRead: () => void;
	/** Open the form this response was submitted through. */
	editForm: () => void;
	/** Go back to the list this response was opened from. */
	goToList: () => void;
};

/**
 * The actions available on the standalone single response page.
 *
 * Shared by the three-dot menu and the page's keyboard shortcuts so the two cannot
 * drift apart — in particular so a shortcut can't skip the re-entry guard or the
 * store repair that every status change from this page depends on.
 *
 * Every action is refused unless the record on screen is the one the route names.
 * Navigating is faster than fetching, so for a moment after prev/next the page is
 * still showing the previous record while the URL already names the new one — an
 * action taken in that window would hit the wrong response. Guarding inside
 * `runAction` covers the menu and the keyboard alike, rather than each caller
 * having to remember.
 *
 * @param response - The response being viewed.
 * @param pinned   - The list query the response was opened from.
 * @param routedId - The response ID from the route, which `response` may still be
 *                 catching up to.
 * @return The action handlers and their in-flight state.
 */
export default function useResponseActions(
	response: FormResponse | null,
	pinned: PinnedViewQuery,
	routedId: number
): ResponseActions {
	const registry = useRegistry() as unknown as Registry;
	const navigate = useNavigate();

	const actions = useMemo( () => getActions( { navigate } ), [ navigate ] );

	// One action at a time *per response*. A second trigger on the same response (a
	// double-tapped Trash, a held-down key, or Trash then Restore) would otherwise
	// fire against a stale `response.status`, duplicating requests and double-applying
	// the optimistic count deltas in `processStatusChange`.
	//
	// Deliberately keyed by id rather than a single flag for the whole page: the user
	// can move to the next response while a status change is still in flight, and a
	// page-wide guard would silently swallow the action they take when they get there.
	// The ref blocks re-entry synchronously; the state only drives the busy toggle.
	const inFlightRef = useRef< Set< number > >( new Set() );
	const [ pendingIds, setPendingIds ] = useState< number[] >( [] );

	// Lets a completed action tell whether the user has since moved on, without
	// putting `response` in its dependencies and re-creating every handler per record.
	const currentIdRef = useRef< number | null >( null );
	currentIdRef.current = response?.id ?? null;

	const runAction = useCallback(
		async ( action: Action ) => {
			if ( ! response || response.id !== routedId || inFlightRef.current.has( response.id ) ) {
				return undefined;
			}

			const { id } = response;
			inFlightRef.current.add( id );
			setPendingIds( previous => [ ...previous, id ] );

			try {
				return await action.callback?.( [ response ], { registry } );
			} finally {
				inFlightRef.current.delete( id );
				setPendingIds( previous => previous.filter( pendingId => pendingId !== id ) );
			}
		},
		[ response, registry, routedId ]
	);

	// Only the response on screen drives the busy UI. Another response's change
	// finishing in the background is not this one's problem.
	const isPending = response ? pendingIds.includes( response.id ) : false;

	// Only act on a change the server accepted — otherwise a failed request would
	// leave the canonical record (and so the header badge and this menu) advertising
	// a status the response never got.
	//
	// Guarded on `ACTION_APPLIES_TO`, the same table the menu renders from, because
	// the keyboard exposes every change unconditionally.
	const changeStatus = useCallback(
		async (
			action: ReportingAction,
			nextStatus: FormResponse[ 'status' ],
			name: keyof typeof ACTION_APPLIES_TO
		) => {
			if ( ! response || ! canRunAction( name, response.status ) ) {
				return;
			}

			const result = await runAction( action );

			if ( result && result.numberOfErrors === 0 ) {
				repairResponseRecord(
					registry.dispatch( coreStore ).receiveEntityRecords,
					response,
					nextStatus,
					getResponseQuery( response.id )
				);
			}
		},
		[ runAction, registry, response ]
	);

	const goToList = useCallback( () => {
		// Router types aren't registered in this build; same cast as breadcrumbs.tsx.
		navigate( buildListLink( pinned ) as unknown as never );
	}, [ navigate, pinned ] );

	const deletePermanently = useCallback( async () => {
		if ( ! canRunAction( 'deletePermanently', response?.status ) ) {
			return;
		}

		const deletedId = response?.id ?? null;

		// `deleteAction` surfaces failures as a notice rather than throwing, so only
		// leave the page once the response is actually gone. Delete is offered only
		// on a trashed response, so that is where we return to.
		const result = await runAction( actions.deleteAction );

		// If the user moved on while the delete was in flight, leave them where they
		// are — yanking them to the trash list would be a navigation they never asked
		// for, triggered by a response no longer on screen.
		if ( result && result.numberOfErrors === 0 && currentIdRef.current === deletedId ) {
			navigate( { to: '/responses/trash' } );
		}
	}, [ runAction, actions.deleteAction, navigate, response ] );

	const markAsSpam = useCallback( () => {
		changeStatus( actions.markAsSpamAction, 'spam', 'markAsSpam' );
	}, [ changeStatus, actions.markAsSpamAction ] );

	const markAsNotSpam = useCallback( () => {
		changeStatus( actions.markAsNotSpamAction, 'publish', 'markAsNotSpam' );
	}, [ changeStatus, actions.markAsNotSpamAction ] );

	const moveToTrash = useCallback( () => {
		changeStatus( actions.moveToTrashAction, 'trash', 'moveToTrash' );
	}, [ changeStatus, actions.moveToTrashAction ] );

	const restore = useCallback( () => {
		changeStatus( actions.restoreAction, 'publish', 'restore' );
	}, [ changeStatus, actions.restoreAction ] );

	const toggleRead = useCallback( () => {
		if ( response ) {
			runAction( response.is_unread ? actions.markAsReadAction : actions.markAsUnreadAction );
		}
	}, [ response, runAction, actions.markAsReadAction, actions.markAsUnreadAction ] );

	const editForm = useCallback( () => {
		if ( response?.edit_form_url ) {
			actions.editFormAction.callback?.( [ response ], { registry } );
		}
	}, [ response, actions.editFormAction, registry ] );

	return {
		isPending,
		markAsSpam,
		markAsNotSpam,
		moveToTrash,
		restore,
		deletePermanently,
		toggleRead,
		editForm,
		goToList,
	};
}
