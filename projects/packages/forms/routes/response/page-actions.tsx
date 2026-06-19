/**
 * WordPress dependencies
 */
import { Button, DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { useRegistry } from '@wordpress/data';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';
import { useNavigate } from '@wordpress/route';
import { Stack } from '@wordpress/ui';
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

/**
 * Top-bar actions for the standalone single response page.
 *
 * Reuses the responses route action callbacks. Status-changing actions navigate
 * back to the relevant responses list afterwards, since the response leaves the
 * current view.
 *
 * @param props          - Component props.
 * @param props.response - The response being viewed.
 * @return The action buttons.
 */
export default function SingleResponseActions( {
	response,
}: {
	response: FormResponse;
} ): React.JSX.Element {
	const registry = useRegistry() as unknown as Registry;
	const navigate = useNavigate();
	const [ isBusy, setIsBusy ] = useState( false );

	const actions = useMemo( () => getActions( { navigate, searchParams: {} } ), [ navigate ] );
	const currentView = VIEW_BY_STATUS[ response.status ] || 'inbox';

	const runAction = useCallback(
		async ( action: Action, navigateAway: boolean ) => {
			setIsBusy( true );
			try {
				await action.callback?.( [ response ], { registry } );
			} finally {
				setIsBusy( false );
			}
			if ( navigateAway ) {
				navigate( { to: `/responses/${ currentView }` } );
			}
		},
		[ response, registry, navigate, currentView ]
	);

	const handleToggleRead = useCallback(
		() =>
			runAction(
				response.is_unread ? actions.markAsReadAction : actions.markAsUnreadAction,
				false
			),
		[ response.is_unread, actions, runAction ]
	);
	const handleSpam = useCallback(
		() => runAction( actions.markAsSpamAction, true ),
		[ actions, runAction ]
	);
	const handleNotSpam = useCallback(
		() => runAction( actions.markAsNotSpamAction, true ),
		[ actions, runAction ]
	);
	const handleTrash = useCallback(
		() => runAction( actions.moveToTrashAction, true ),
		[ actions, runAction ]
	);
	const handleRestore = useCallback(
		() => runAction( actions.restoreAction, true ),
		[ actions, runAction ]
	);
	const handleDelete = useCallback(
		() => runAction( actions.deleteAction, true ),
		[ actions, runAction ]
	);
	const handlePrint = useCallback( () => window.print(), [] );
	const handleEditForm = useCallback(
		() => actions.editFormAction.callback?.( [ response ], { registry } ),
		[ actions, response, registry ]
	);

	const renderStatusButtons = () => {
		if ( response.status === 'spam' ) {
			return (
				<>
					<Button isBusy={ isBusy } onClick={ handleNotSpam } size="compact">
						{ __( 'Not spam', 'jetpack-forms' ) }
					</Button>
					<Button isBusy={ isBusy } onClick={ handleTrash } size="compact">
						{ __( 'Trash', 'jetpack-forms' ) }
					</Button>
				</>
			);
		}
		if ( response.status === 'trash' ) {
			return (
				<>
					<Button isBusy={ isBusy } onClick={ handleRestore } size="compact">
						{ __( 'Restore', 'jetpack-forms' ) }
					</Button>
					<Button isBusy={ isBusy } onClick={ handleDelete } size="compact">
						{ __( 'Delete', 'jetpack-forms' ) }
					</Button>
				</>
			);
		}
		return (
			<>
				<Button isBusy={ isBusy } onClick={ handleSpam } size="compact">
					{ __( 'Spam', 'jetpack-forms' ) }
				</Button>
				<Button isBusy={ isBusy } onClick={ handleTrash } size="compact">
					{ __( 'Trash', 'jetpack-forms' ) }
				</Button>
			</>
		);
	};

	const renderMoreMenu = () => (
		<MenuGroup>
			<MenuItem onClick={ handleEditForm }>{ __( 'Edit form', 'jetpack-forms' ) }</MenuItem>
		</MenuGroup>
	);

	return (
		<Stack direction="row" gap="xs" justify="end" wrap="wrap">
			<Button isBusy={ isBusy } onClick={ handleToggleRead } size="compact">
				{ response.is_unread
					? __( 'Mark as read', 'jetpack-forms' )
					: __( 'Mark as unread', 'jetpack-forms' ) }
			</Button>
			{ renderStatusButtons() }
			<Button onClick={ handlePrint } size="compact">
				{ __( 'Print', 'jetpack-forms' ) }
			</Button>
			{ response.edit_form_url && (
				<DropdownMenu icon={ moreVertical } label={ __( 'More options', 'jetpack-forms' ) }>
					{ renderMoreMenu }
				</DropdownMenu>
			) }
		</Stack>
	);
}
