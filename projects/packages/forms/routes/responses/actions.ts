/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Types
 */
import type { FormResponse } from '../../src/types/index.ts';
import type { Action } from '@wordpress/dataviews';

type GetItemId = ( item: FormResponse ) => string;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NavigateFunction = ( options: any ) => void;
type SearchParams = {
	[ key: string ]: string | string[] | undefined;
};
type ActionCallback = ( items: FormResponse[] ) => void | Promise< void >;

type ActionWithDestructive< T > = Action< T > & {
	isDestructive?: boolean;
};

type GetActionsParams = {
	navigate: NavigateFunction;
	searchParams: SearchParams;
	view: string | undefined;
	getItemId: GetItemId;
	handleMarkAsRead: ActionCallback;
	handleMarkAsUnread: ActionCallback;
	handleMarkAsSpam: ActionCallback;
	handleMarkAsNotSpam: ActionCallback;
	handleMoveToTrash: ActionCallback;
	handleRestore: ActionCallback;
	handleDelete: ActionCallback;
};

/**
 * Get actions configuration for form responses DataViews.
 *
 * @param {GetActionsParams} params - Parameters for generating actions.
 * @return {ActionWithDestructive<FormResponse>[]} Array of action configurations.
 */
export function getActions( {
	navigate,
	searchParams,
	view,
	getItemId,
	handleMarkAsRead,
	handleMarkAsUnread,
	handleMarkAsSpam,
	handleMarkAsNotSpam,
	handleMoveToTrash,
	handleRestore,
	handleDelete,
}: GetActionsParams ): ActionWithDestructive< FormResponse >[] {
	const baseActions: ActionWithDestructive< FormResponse >[] = [
		{
			id: 'view-details',
			label: __( 'View', 'jetpack-forms' ),
			isPrimary: true,
			callback: items => {
				const ids = items.map( item => getItemId( item ) );
				navigate( {
					search: {
						...searchParams,
						responseIds: ids,
					},
				} );
			},
		},
	];

	if ( view === 'inbox' || ! view ) {
		return [
			...baseActions,
			{
				id: 'mark-as-read',
				label: __( 'Mark as read', 'jetpack-forms' ),
				supportsBulk: true,
				isEligible: ( item: FormResponse ) => item.is_unread,
				callback: handleMarkAsRead,
			} as ActionWithDestructive< FormResponse >,
			{
				id: 'mark-as-spam',
				label: __( 'Spam', 'jetpack-forms' ),
				supportsBulk: true,
				isDestructive: true,
				isPrimary: true,
				callback: handleMarkAsSpam,
			} as ActionWithDestructive< FormResponse >,
			{
				id: 'move-to-trash',
				label: __( 'Trash', 'jetpack-forms' ),
				supportsBulk: true,
				isDestructive: true,
				isPrimary: true,
				callback: handleMoveToTrash,
			} as ActionWithDestructive< FormResponse >,
			{
				id: 'mark-as-unread',
				label: __( 'Mark as unread', 'jetpack-forms' ),
				supportsBulk: true,
				isEligible: ( item: FormResponse ) => ! item.is_unread,
				callback: handleMarkAsUnread,
			} as ActionWithDestructive< FormResponse >,
		];
	}

	if ( view === 'spam' ) {
		return [
			...baseActions,
			{
				id: 'not-spam',
				label: __( 'Not spam', 'jetpack-forms' ),
				supportsBulk: true,
				isPrimary: true,
				callback: handleMarkAsNotSpam,
			} as ActionWithDestructive< FormResponse >,
			{
				id: 'move-to-trash',
				label: __( 'Trash', 'jetpack-forms' ),
				supportsBulk: true,
				isDestructive: true,
				isPrimary: true,
				callback: handleMoveToTrash,
			} as ActionWithDestructive< FormResponse >,
		];
	}

	if ( view === 'trash' ) {
		return [
			...baseActions,
			{
				id: 'restore',
				label: __( 'Restore', 'jetpack-forms' ),
				supportsBulk: true,
				isPrimary: true,
				callback: handleRestore,
			} as ActionWithDestructive< FormResponse >,
			{
				id: 'delete-permanently',
				label: __( 'Delete', 'jetpack-forms' ),
				supportsBulk: true,
				isDestructive: true,
				isPrimary: true,
				callback: handleDelete,
			} as ActionWithDestructive< FormResponse >,
		];
	}

	return baseActions;
}
