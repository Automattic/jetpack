/**
 * WordPress dependencies
 */
import { DropdownMenu } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useRegistry } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';
import { useNavigate } from '@wordpress/route';
import * as React from 'react';
/**
 * Internal dependencies
 */
import { getActions } from '../responses/actions.tsx';
/**
 * Types
 */
import type { Action, Registry } from '../../src/dashboard/inbox/stage/types.tsx';
import type { FormResponse } from '../../src/types/index.ts';

const VIEW_BY_STATUS: Record< FormResponse[ 'status' ], string > = {
	publish: 'inbox',
	spam: 'spam',
	trash: 'trash',
};

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
 * navigates away, since there is no longer a response to show.
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
	const currentView = VIEW_BY_STATUS[ response.status ] || 'inbox';

	const runAction = useCallback(
		async ( action: Action, nextStatus?: FormResponse[ 'status' ] ) => {
			await action.callback?.( [ response ], { registry } );

			// Trashing goes through `deleteEntityRecord`, which removes the record
			// from core-data entirely — this page would then render its "not found"
			// state. Put it back (carrying the new status) so the user keeps looking
			// at the response they just actioned. The responses list does the same
			// after trashing, to keep its Undo working.
			if ( nextStatus === 'trash' ) {
				registry
					.dispatch( coreStore )
					.receiveEntityRecords(
						'postType',
						'feedback',
						[ { ...response, status: 'trash' } ],
						undefined,
						true
					);
			}
		},
		[ response, registry ]
	);

	const deleteResponse = useCallback( async () => {
		await actions.deleteAction.callback?.( [ response ], { registry } );
		navigate( { to: `/responses/${ currentView }` } );
	}, [ actions.deleteAction, response, registry, navigate, currentView ] );

	// Grouped controls — nested arrays render as separate menu groups, and the
	// `controls` API closes the dropdown automatically when an item is selected.
	// Handlers are inlined since they're only used here and all invalidate
	// together with `runAction` whenever the response changes.
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
					onClick: () => runAction( actions.markAsNotSpamAction, 'publish' ),
				},
				{
					title: __( 'Trash', 'jetpack-forms' ),
					onClick: () => runAction( actions.moveToTrashAction, 'trash' ),
				},
			];
		} else if ( response.status === 'trash' ) {
			statusControls = [
				{
					title: __( 'Restore', 'jetpack-forms' ),
					onClick: () => runAction( actions.restoreAction, 'publish' ),
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
					onClick: () => runAction( actions.markAsSpamAction, 'spam' ),
				},
				{
					title: __( 'Trash', 'jetpack-forms' ),
					onClick: () => runAction( actions.moveToTrashAction, 'trash' ),
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
	}, [ response, runAction, deleteResponse, actions, registry ] );

	return (
		<DropdownMenu
			icon={ moreVertical }
			label={ __( 'Actions', 'jetpack-forms' ) }
			controls={ controls }
		/>
	);
}
