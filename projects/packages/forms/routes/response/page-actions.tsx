/**
 * WordPress dependencies
 */
import { DropdownMenu } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useRegistry } from '@wordpress/data';
import { useCallback, useMemo, useState } from '@wordpress/element';
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
 * navigates away, since there is no longer a response to show. Because the user
 * stays put, each accepted change is followed by a store repair (see `runAction`)
 * and the menu is disabled while a change is in flight.
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

	// One response, one action at a time. Every status change used to navigate away
	// immediately, which guarded this for free; keeping the user here means a second
	// click (double-clicked Trash, or Trash then Restore) would otherwise fire against
	// a stale `response.status`, duplicating requests and double-applying the
	// optimistic count deltas in `processStatusChange`.
	const [ isPending, setIsPending ] = useState( false );

	const runAction = useCallback(
		async ( action: Action, nextStatus?: FormResponse[ 'status' ] ) => {
			if ( isPending ) {
				return;
			}

			setIsPending( true );

			let result;
			try {
				result = await action.callback?.( [ response ], { registry } );
			} finally {
				setIsPending( false );
			}

			// Only repair the store for a change the server actually accepted —
			// otherwise a failed request would leave the canonical record (and so the
			// header badge and this menu) advertising a status the response never got.
			if ( ! nextStatus || ! result || result.numberOfErrors > 0 ) {
				return;
			}

			// Re-receive the pre-action record carrying the new status. This repairs
			// two things at once:
			//
			// - Trash goes through `deleteEntityRecord`, which drops the record from
			//   core-data entirely, so this page would fall through to "not found".
			// - The save-based changes (spam / not spam / restore) PUT without
			//   `fields_format`, and the endpoint defaults that to `label-value`
			//   (class-contact-form-endpoint.php). The response to that PUT is
			//   received into the store, replacing the collection-shaped `fields` this
			//   page renders from — so the body would visibly flatten into plain rows.
			//   `response` here is still the pre-action, collection-shaped record.
			//
			// Same repair as PR #49827, which fixed a query-less *fetch* clobbering the
			// collection record; these actions reopen the same door via the save.
			registry
				.dispatch( coreStore )
				.receiveEntityRecords(
					'postType',
					'feedback',
					[ { ...response, status: nextStatus } ],
					undefined,
					true
				);
		},
		[ isPending, response, registry ]
	);

	const deleteResponse = useCallback( async () => {
		if ( isPending ) {
			return;
		}

		setIsPending( true );

		let result;
		try {
			result = await actions.deleteAction.callback?.( [ response ], { registry } );
		} finally {
			setIsPending( false );
		}

		// `deleteAction` surfaces failures as a notice rather than throwing, so only
		// leave the page once the response is actually gone.
		if ( result && result.numberOfErrors === 0 ) {
			navigate( { to: `/responses/${ currentView }` } );
		}
	}, [ isPending, actions.deleteAction, response, registry, navigate, currentView ] );

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
			toggleProps={ { disabled: isPending, isBusy: isPending } }
		/>
	);
}
