/**
 * WordPress dependencies
 */
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';
import * as React from 'react';
/**
 * Internal dependencies
 */
import { SHORTCUTS } from './use-keyboard-shortcuts.ts';
/**
 * Types
 */
import type { ResponseActions } from './use-response-actions.ts';
import type { FormResponse } from '../../src/types/index.ts';

/**
 * Top-bar actions for the standalone single response page.
 *
 * The handlers come from `useResponseActions`, which the page owns so that the
 * keyboard shortcuts run the same code — this component only decides which ones to
 * offer, based on the response's current status.
 *
 * Built from explicit `MenuItem` children rather than `DropdownMenu`'s `controls`
 * prop: `controls` renders a plain `Button` with a fixed set of props and has no
 * passthrough, so it cannot show the `shortcut` hints that make the keyboard
 * shortcuts discoverable. The trade-off is that children have to close the menu
 * themselves, which `controls` did automatically.
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
 * @return The actions dropdown.
 */
export default function SingleResponseActions( {
	response,
	responseActions,
	isBlocked = false,
}: {
	response: FormResponse;
	responseActions: ResponseActions;
	isBlocked?: boolean;
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
		goToList,
	} = responseActions;

	return (
		<DropdownMenu
			icon={ moreVertical }
			label={ __( 'Actions', 'jetpack-forms' ) }
			toggleProps={ { disabled: isPending || isBlocked, isBusy: isPending } }
		>
			{ ( { onClose }: { onClose: () => void } ) => {
				// Every item closes the menu first, so the page is not left with an open
				// dropdown over a response that has just changed underneath it.
				const run = ( action: () => void ) => () => {
					onClose();
					action();
				};

				return (
					<>
						<MenuGroup>
							<MenuItem onClick={ run( toggleRead ) }>
								{ response.is_unread
									? __( 'Mark as read', 'jetpack-forms' )
									: __( 'Mark as unread', 'jetpack-forms' ) }
							</MenuItem>
							<MenuItem onClick={ run( () => window.print() ) }>
								{ __( 'Print', 'jetpack-forms' ) }
							</MenuItem>
						</MenuGroup>

						<MenuGroup>
							{ response.status === 'spam' && (
								<>
									<MenuItem onClick={ run( markAsNotSpam ) }>
										{ __( 'Not spam', 'jetpack-forms' ) }
									</MenuItem>
									<MenuItem shortcut={ SHORTCUTS.moveToTrash } onClick={ run( moveToTrash ) }>
										{ __( 'Trash', 'jetpack-forms' ) }
									</MenuItem>
								</>
							) }

							{ response.status === 'trash' && (
								<>
									<MenuItem onClick={ run( restore ) }>
										{ __( 'Restore', 'jetpack-forms' ) }
									</MenuItem>
									<MenuItem isDestructive onClick={ run( deletePermanently ) }>
										{ __( 'Delete permanently', 'jetpack-forms' ) }
									</MenuItem>
								</>
							) }

							{ response.status !== 'spam' && response.status !== 'trash' && (
								<>
									<MenuItem shortcut={ SHORTCUTS.markAsSpam } onClick={ run( markAsSpam ) }>
										{ __( 'Mark as spam', 'jetpack-forms' ) }
									</MenuItem>
									<MenuItem shortcut={ SHORTCUTS.moveToTrash } onClick={ run( moveToTrash ) }>
										{ __( 'Trash', 'jetpack-forms' ) }
									</MenuItem>
								</>
							) }
						</MenuGroup>

						<MenuGroup>
							<MenuItem shortcut={ SHORTCUTS.goToList } onClick={ run( goToList ) }>
								{ __( 'Back to responses', 'jetpack-forms' ) }
							</MenuItem>
							{ response.edit_form_url && (
								<MenuItem onClick={ run( editForm ) }>
									{ __( 'Edit form', 'jetpack-forms' ) }
								</MenuItem>
							) }
						</MenuGroup>
					</>
				);
			} }
		</DropdownMenu>
	);
}
