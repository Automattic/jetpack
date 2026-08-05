/**
 * WordPress dependencies
 */
import { DropdownMenu } from '@wordpress/components';
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
 * menu automatically on selection). Reuses the responses route action callbacks;
 * status-changing actions navigate back to the relevant responses list
 * afterwards, since the response leaves the current view.
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

	const actions = useMemo( () => getActions( { navigate, searchParams: {} } ), [ navigate ] );
	const currentView = VIEW_BY_STATUS[ response.status ] || 'inbox';

	const runAction = useCallback(
		async ( action: Action, navigateAway: boolean ) => {
			await action.callback?.( [ response ], { registry } );
			if ( navigateAway ) {
				navigate( { to: `/responses/${ currentView }` } );
			}
		},
		[ response, registry, navigate, currentView ]
	);

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
				runAction(
					response.is_unread ? actions.markAsReadAction : actions.markAsUnreadAction,
					false
				),
		};

		let statusControls: Control[];
		if ( response.status === 'spam' ) {
			statusControls = [
				{
					title: __( 'Not spam', 'jetpack-forms' ),
					onClick: () => runAction( actions.markAsNotSpamAction, true ),
				},
				{
					title: __( 'Trash', 'jetpack-forms' ),
					onClick: () => runAction( actions.moveToTrashAction, true ),
				},
			];
		} else if ( response.status === 'trash' ) {
			statusControls = [
				{
					title: __( 'Restore', 'jetpack-forms' ),
					onClick: () => runAction( actions.restoreAction, true ),
				},
				{
					title: __( 'Delete permanently', 'jetpack-forms' ),
					onClick: () => runAction( actions.deleteAction, true ),
					isDestructive: true,
				},
			];
		} else {
			statusControls = [
				{
					title: __( 'Mark as spam', 'jetpack-forms' ),
					onClick: () => runAction( actions.markAsSpamAction, true ),
				},
				{
					title: __( 'Trash', 'jetpack-forms' ),
					onClick: () => runAction( actions.moveToTrashAction, true ),
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
	}, [ response, runAction, actions, registry ] );

	return (
		<DropdownMenu
			icon={ moreVertical }
			label={ __( 'Actions', 'jetpack-forms' ) }
			controls={ controls }
		/>
	);
}
