/**
 * WordPress dependencies
 */
import { DropdownMenu } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useRegistry } from '@wordpress/data';
import { useCallback, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';
import { useNavigate } from '@wordpress/route';
import * as React from 'react';
/**
 * Internal dependencies
 */
import { getActions } from '../responses/actions.tsx';
import repairResponseRecord from './repair-record.ts';
/**
 * Types
 */
import type { Action, ReportingAction, Registry } from '../../src/dashboard/inbox/stage/types.tsx';
import type { FormResponse } from '../../src/types/index.ts';

type Control = {
	title: string;
	onClick: () => void;
	isDestructive?: boolean;
};

/**
 * Top-bar actions for the standalone single response page.
 *
 * All actions live in a single three-dot dropdown (the `controls` API closes the
 * menu automatically on selection). Reuses the responses route action callbacks.
 *
 * Status changes (spam / not spam / trash / restore) keep the user on this page —
 * the header badge reflects the new status instead. Only a permanent delete
 * navigates away, since there is no longer a response to show. Because the user
 * stays put, each accepted change is followed by a store repair (see
 * `changeStatus`) and the menu is disabled while a change is in flight.
 *
 * @param props          - Component props.
 * @param props.response - The response being viewed.
 * @return The actions dropdown.
 */
export default function SingleResponseActions( {
	response,
}: {
	response: FormResponse;
} ): React.JSX.Element {
	const registry = useRegistry() as unknown as Registry;
	const navigate = useNavigate();

	const actions = useMemo( () => getActions( { navigate } ), [ navigate ] );

	// One response, one action at a time. Every status change used to navigate away
	// immediately, which guarded this for free; keeping the user here means a second
	// click (double-clicked Trash, or Trash then Restore) would otherwise fire against
	// a stale `response.status`, duplicating requests and double-applying the
	// optimistic count deltas in `processStatusChange`. The ref blocks re-entry
	// synchronously; the state only drives the disabled/busy toggle.
	const isRunningRef = useRef( false );
	const [ isPending, setIsPending ] = useState( false );

	const runAction = useCallback(
		async ( action: Action ) => {
			if ( isRunningRef.current ) {
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
			const result = await runAction( action );

			if ( result && result.numberOfErrors === 0 ) {
				repairResponseRecord(
					registry.dispatch( coreStore ).receiveEntityRecords,
					response,
					nextStatus
				);
			}
		},
		[ runAction, registry, response ]
	);

	const deleteResponse = useCallback( async () => {
		const result = await runAction( actions.deleteAction );

		// `deleteAction` surfaces failures as a notice rather than throwing, so only
		// leave the page once the response is actually gone. Delete is offered only
		// on a trashed response, so that is where we return to.
		if ( result && result.numberOfErrors === 0 ) {
			navigate( { to: '/responses/trash' } );
		}
	}, [ runAction, actions.deleteAction, navigate ] );

	// Nested arrays render as separate menu groups. Handlers are inlined since they
	// are only used here.
	const controls = useMemo< Control[][] >( () => {
		const toggleRead: Control = {
			title: response.is_unread
				? __( 'Mark as read', 'jetpack-forms' )
				: __( 'Mark as unread', 'jetpack-forms' ),
			onClick: () =>
				runAction( response.is_unread ? actions.markAsReadAction : actions.markAsUnreadAction ),
		};

		let statusControls: Control[];
		if ( response.status === 'spam' ) {
			statusControls = [
				{
					title: __( 'Not spam', 'jetpack-forms' ),
					onClick: () => changeStatus( actions.markAsNotSpamAction, 'publish' ),
				},
				{
					title: __( 'Trash', 'jetpack-forms' ),
					onClick: () => changeStatus( actions.moveToTrashAction, 'trash' ),
				},
			];
		} else if ( response.status === 'trash' ) {
			statusControls = [
				{
					title: __( 'Restore', 'jetpack-forms' ),
					onClick: () => changeStatus( actions.restoreAction, 'publish' ),
				},
				{
					title: __( 'Delete permanently', 'jetpack-forms' ),
					onClick: deleteResponse,
					isDestructive: true,
				},
			];
		} else {
			statusControls = [
				{
					title: __( 'Mark as spam', 'jetpack-forms' ),
					onClick: () => changeStatus( actions.markAsSpamAction, 'spam' ),
				},
				{
					title: __( 'Trash', 'jetpack-forms' ),
					onClick: () => changeStatus( actions.moveToTrashAction, 'trash' ),
				},
			];
		}

		const groups: Control[][] = [ [ toggleRead ], statusControls ];

		if ( response.edit_form_url ) {
			groups.push( [
				{
					title: __( 'Edit form', 'jetpack-forms' ),
					onClick: () => actions.editFormAction.callback?.( [ response ], { registry } ),
				},
			] );
		}

		return groups;
	}, [ response, runAction, changeStatus, deleteResponse, actions, registry ] );

	return (
		<DropdownMenu
			icon={ moreVertical }
			label={ __( 'Actions', 'jetpack-forms' ) }
			controls={ controls }
			toggleProps={ { disabled: isPending, isBusy: isPending } }
		/>
	);
}
