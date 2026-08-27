/**
 * WordPress dependencies
 */
import { DropdownMenu } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';
import * as React from 'react';
/**
 * Types
 */
import type { ResponseActions } from './use-response-actions.ts';
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
 * menu automatically on selection). The handlers themselves come from
 * `useResponseActions`, which the page owns so that the keyboard shortcuts run the
 * same code — this component only decides what to *offer*, based on the response's
 * current status.
 *
 * Status changes (spam / not spam / trash / restore) keep the user on this page —
 * the header badge reflects the new status instead. Only a permanent delete
 * navigates away, since there is no longer a response to show.
 *
 * @param props                 - Component props.
 * @param props.response        - The response being viewed.
 * @param props.responseActions - The page's shared action handlers.
 * @param props.isBlocked       - Whether another mutation on this response is in flight
 *                              (e.g. the spam confirmation dialog saving).
 * @param props.onShowShortcuts - Opens the keyboard shortcut reference.
 * @return The actions dropdown.
 */
export default function SingleResponseActions( {
	response,
	responseActions,
	isBlocked = false,
	onShowShortcuts,
}: {
	response: FormResponse;
	responseActions: ResponseActions;
	isBlocked?: boolean;
	onShowShortcuts?: () => void;
} ): React.JSX.Element {
	const {
		isPending,
		markAsSpam,
		markAsNotSpam,
		moveToTrash,
		restore,
		deletePermanently,
		toggleRead,
		editForm,
	} = responseActions;

	// Nested arrays render as separate menu groups.
	const controls = useMemo< Control[][] >( () => {
		const toggleReadControl: Control = {
			title: response.is_unread
				? __( 'Mark as read', 'jetpack-forms' )
				: __( 'Mark as unread', 'jetpack-forms' ),
			onClick: toggleRead,
		};

		// No request to serialize against, so it skips the shared busy guard.
		const printResponse: Control = {
			title: __( 'Print', 'jetpack-forms' ),
			onClick: () => window.print(),
		};

		let statusControls: Control[];
		if ( response.status === 'spam' ) {
			statusControls = [
				{ title: __( 'Not spam', 'jetpack-forms' ), onClick: markAsNotSpam },
				{ title: __( 'Trash', 'jetpack-forms' ), onClick: moveToTrash },
			];
		} else if ( response.status === 'trash' ) {
			statusControls = [
				{ title: __( 'Restore', 'jetpack-forms' ), onClick: restore },
				{
					title: __( 'Delete permanently', 'jetpack-forms' ),
					onClick: deletePermanently,
					isDestructive: true,
				},
			];
		} else {
			statusControls = [
				{ title: __( 'Mark as spam', 'jetpack-forms' ), onClick: markAsSpam },
				{ title: __( 'Trash', 'jetpack-forms' ), onClick: moveToTrash },
			];
		}

		const groups: Control[][] = [ [ toggleReadControl, printResponse ], statusControls ];

		if ( response.edit_form_url ) {
			groups.push( [ { title: __( 'Edit form', 'jetpack-forms' ), onClick: editForm } ] );
		}

		if ( onShowShortcuts ) {
			groups.push( [
				{ title: __( 'Keyboard shortcuts', 'jetpack-forms' ), onClick: onShowShortcuts },
			] );
		}

		return groups;
	}, [
		response,
		toggleRead,
		markAsSpam,
		markAsNotSpam,
		moveToTrash,
		restore,
		deletePermanently,
		editForm,
		onShowShortcuts,
	] );

	return (
		<DropdownMenu
			icon={ moreVertical }
			label={ __( 'Actions', 'jetpack-forms' ) }
			controls={ controls }
			toggleProps={ { disabled: isPending || isBlocked, isBusy: isPending } }
		/>
	);
}
