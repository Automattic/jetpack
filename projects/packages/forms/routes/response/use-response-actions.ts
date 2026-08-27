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

	// One response, one action at a time. Every status change used to navigate away
	// immediately, which guarded this for free; keeping the user here means a second
	// trigger (double-clicked Trash, or Trash then Restore) would otherwise fire
	// against a stale `response.status`, duplicating requests and double-applying the
	// optimistic count deltas in `processStatusChange`. The ref blocks re-entry
	// synchronously; the state only drives the disabled/busy toggle.
	//
	// This matters more now that the same actions are reachable from the keyboard,
	// where a held-down key repeats.
	const isRunningRef = useRef( false );
	const [ isPending, setIsPending ] = useState( false );

	const runAction = useCallback(
		async ( action: Action ) => {
			if ( isRunningRef.current || ! response ) {
				return undefined;
			}

			isRunningRef.current = true;
			setIsPending( true );

			try {
				return await action.callback?.( [ response ], { registry } );
			} finally {
				isRunningRef.current = false;
				setIsPending( false );
			}
		},
		[ response, registry ]
	);

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
		// `deleteAction` surfaces failures as a notice rather than throwing, so only
		// leave the page once the response is actually gone. Delete is offered only
		// on a trashed response, so that is where we return to.
		const result = await runAction( actions.deleteAction );

		if ( result && result.numberOfErrors === 0 ) {
			navigate( { to: '/responses/trash' } );
		}
	}, [ runAction, actions.deleteAction, navigate ] );

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
