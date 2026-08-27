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
import { getViewStatus } from './pinned-view.ts';
import getResponseQuery from './query.ts';
import repairResponseRecord from './repair-record.ts';
/**
 * Types
 */
import type { PinnedViewQuery } from './pinned-view.ts';
import type { Action, ReportingAction, Registry } from '../../src/dashboard/inbox/stage/types.tsx';
import type { FormResponse } from '../../src/types/index.ts';

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
	/** The underlying action definitions, for callers that need labels or eligibility. */
	actions: ReturnType< typeof getActions >;
};

/**
 * The actions available on the standalone single response page.
 *
 * Shared by the three-dot menu and the page's keyboard shortcuts so the two cannot
 * drift apart — in particular so a shortcut can't skip the re-entry guard or the
 * store repair that every status change from this page depends on.
 *
 * Status changes (spam / not spam / trash / restore) keep the user on this page —
 * the header badge reflects the new status instead. Only a permanent delete
 * navigates away, since there is no longer a response to show.
 *
 * @param response - The response being viewed.
 * @param pinned   - The list query the response was opened from.
 * @return The action handlers and their in-flight state.
 */
export default function useResponseActions(
	response: FormResponse | null,
	pinned: PinnedViewQuery
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
			if ( ! response || inFlightRef.current.has( response.id ) ) {
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
		[ response, registry ]
	);

	// Only the response on screen drives the busy UI. Another response's change
	// finishing in the background is not this one's problem.
	const isPending = response ? pendingIds.includes( response.id ) : false;

	// Only act on a change the server accepted — otherwise a failed request would
	// leave the canonical record (and so the header badge and this menu) advertising
	// a status the response never got.
	const changeStatus = useCallback(
		async ( action: ReportingAction, nextStatus: FormResponse[ 'status' ] ) => {
			if ( ! response ) {
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
		navigate( { to: `/responses/${ getViewStatus( pinned ) }` } );
	}, [ navigate, pinned ] );

	const deletePermanently = useCallback( async () => {
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

	// Each status change is guarded on the status it applies to, because the
	// keyboard exposes them unconditionally — unlike the menu, which only renders
	// the ones that apply. Marking an already-trashed response as spam, say, would
	// otherwise fire a request the UI never offered.
	const markAsSpam = useCallback( () => {
		if ( response && response.status !== 'spam' && response.status !== 'trash' ) {
			changeStatus( actions.markAsSpamAction, 'spam' );
		}
	}, [ response, changeStatus, actions.markAsSpamAction ] );

	const markAsNotSpam = useCallback( () => {
		if ( response?.status === 'spam' ) {
			changeStatus( actions.markAsNotSpamAction, 'publish' );
		}
	}, [ response, changeStatus, actions.markAsNotSpamAction ] );

	const moveToTrash = useCallback( () => {
		if ( response && response.status !== 'trash' ) {
			changeStatus( actions.moveToTrashAction, 'trash' );
		}
	}, [ response, changeStatus, actions.moveToTrashAction ] );

	const restore = useCallback( () => {
		if ( response?.status === 'trash' ) {
			changeStatus( actions.restoreAction, 'publish' );
		}
	}, [ response, changeStatus, actions.restoreAction ] );

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
		actions,
	};
}
