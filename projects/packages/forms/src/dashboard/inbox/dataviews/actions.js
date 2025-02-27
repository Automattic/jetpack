import { Icon } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { seen, trash, backup } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { notSpam, spam } from '../../icons';
import { STORE_NAME } from '../../store';
import InboxResponse from '../response';

export const BULK_ACTIONS = {
	markAsSpam: 'mark_as_spam',
	markAsNotSpam: 'mark_as_not_spam',
};

export const viewAction = {
	id: 'view-response',
	label: __( 'View response', 'jetpack-forms' ),
	isPrimary: true,
	icon: <Icon icon={ seen } />,
	RenderModal: ( { items } ) => {
		const [ item ] = items;
		return <InboxResponse isLoading={ false } response={ item } />;
	},
};

export const markAsSpamAction = {
	id: 'mark-as-spam',
	label: __( 'Mark as spam', 'jetpack-forms' ),
	isEligible: item => item.status !== 'spam',
	supportsBulk: true,
	icon: <Icon icon={ spam } />,
	async callback( items, { registry } ) {
		const itemIds = items.map( ( { id } ) => id );
		const { createSuccessNotice, createErrorNotice } = registry.dispatch( noticesStore );
		try {
			await registry.dispatch( STORE_NAME ).doBulkAction( itemIds, BULK_ACTIONS.markAsSpam );
			const numberOfItems = itemIds.length;
			const successMessage =
				numberOfItems === 1
					? sprintf(
							/* translators: The number of responses. */
							__( '%d response has been marked as spam.', 'jetpack-forms' ),
							numberOfItems
					  )
					: sprintf(
							/* translators: The number of responses. */
							__( '%d responses have been marked as spam.', 'jetpack-forms' ),
							numberOfItems
					  );
			createSuccessNotice( successMessage, { type: 'snackbar', id: 'mark-as-spam-action' } );
		} catch {
			createErrorNotice(
				__( 'An error occurred while marking responses as spam.', 'jetpack-forms' ),
				{ type: 'snackbar' }
			);
		}
	},
};

export const markAsNotSpamAction = {
	id: 'mark-as-not-spam',
	label: __( 'Not spam', 'jetpack-forms' ),
	isEligible: item => item.status === 'spam',
	supportsBulk: true,
	icon: <Icon icon={ notSpam } />,
	async callback( items, { registry } ) {
		const itemIds = items.map( ( { id } ) => id );
		const { createSuccessNotice, createErrorNotice } = registry.dispatch( noticesStore );
		try {
			await registry.dispatch( STORE_NAME ).doBulkAction( itemIds, BULK_ACTIONS.markAsNotSpam );
			const numberOfItems = itemIds.length;
			const successMessage =
				numberOfItems === 1
					? sprintf(
							/* translators: The number of responses. */
							__( '%d response has been marked as not spam.', 'jetpack-forms' ),
							numberOfItems
					  )
					: sprintf(
							/* translators: The number of responses. */
							__( '%d responses have been marked as not spam.', 'jetpack-forms' ),
							numberOfItems
					  );
			createSuccessNotice( successMessage, { type: 'snackbar', id: 'mark-as-not-spam-action' } );
		} catch {
			createErrorNotice(
				__( 'An error occurred while marking responses as not spam.', 'jetpack-forms' ),
				{ type: 'snackbar' }
			);
		}
	},
};

export const restoreAction = {
	id: 'restore',
	label: __( 'Restore', 'jetpack-forms' ),
	isEligible: item => item.status === 'trash',
	supportsBulk: true,
	icon: <Icon icon={ backup } />,
	async callback( items, { registry } ) {
		const { saveEntityRecord } = registry.dispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } = registry.dispatch( noticesStore );
		const promises = await Promise.allSettled(
			items.map( ( { id } ) =>
				saveEntityRecord( 'postType', 'feedback', { id, status: 'publish' } )
			)
		);
		if ( promises.every( ( { status } ) => status === 'fulfilled' ) ) {
			const numberOfItems = promises.length;
			const successMessage =
				numberOfItems === 1
					? /* translators: The number of responses. */
					  sprintf( __( '%d response has been restored.', 'jetpack-forms' ), numberOfItems )
					: sprintf(
							/* translators: The number of responses. */
							__( '%d responses have been restored.', 'jetpack-forms' ),
							numberOfItems
					  );
			createSuccessNotice( successMessage, { type: 'snackbar', id: 'restore-action' } );
			return;
		}
		// There is at least one failure.
		const numberOfErrors = promises.filter( ( { status } ) => status === 'rejected' ).length;
		// TODO: probably have better error messages..
		const errorMessage =
			numberOfErrors === 1
				? /* translators: The number of responses. */
				  sprintf( __( 'An error occurred for %d response.', 'jetpack-forms' ), numberOfErrors )
				: sprintf(
						/* translators: The number of responses. */
						__( 'An error occurred for %d responses.', 'jetpack-forms' ),
						numberOfErrors
				  );
		createErrorNotice( errorMessage, { type: 'snackbar' } );
	},
};

export const moveToTrashAction = {
	id: 'move-to-trash',
	label: __( 'Move to trash', 'jetpack-forms' ),
	isEligible: item => item.status !== 'trash',
	supportsBulk: true,
	icon: <Icon icon={ trash } />,
	async callback( items, { registry } ) {
		const { deleteEntityRecord } = registry.dispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } = registry.dispatch( noticesStore );
		const promises = await Promise.allSettled(
			items.map( ( { id } ) =>
				deleteEntityRecord( 'postType', 'feedback', id, {}, { throwOnError: true } )
			)
		);
		if ( promises.every( ( { status } ) => status === 'fulfilled' ) ) {
			const numberOfItems = promises.length;
			const successMessage =
				numberOfItems === 1
					? /* translators: The number of responses. */
					  sprintf( __( '%d response has been moved to trash.', 'jetpack-forms' ), numberOfItems )
					: sprintf(
							/* translators: The number of responses. */
							__( '%d responses have been moved to trash.', 'jetpack-forms' ),
							numberOfItems
					  );
			createSuccessNotice( successMessage, { type: 'snackbar', id: 'move-to-trash-action' } );
			return;
		}
		// There is at least one failure.
		const numberOfErrors = promises.filter( ( { status } ) => status === 'rejected' ).length;
		// TODO: probably have better error messages..
		const errorMessage =
			numberOfErrors === 1
				? /* translators: The number of responses. */
				  sprintf( __( 'An error occurred for %d response.', 'jetpack-forms' ), numberOfErrors )
				: sprintf(
						/* translators: The number of responses. */
						__( 'An error occurred for %d responses.', 'jetpack-forms' ),
						numberOfErrors
				  );
		createErrorNotice( errorMessage, { type: 'snackbar' } );
	},
};

export const deleteAction = {
	id: 'delete',
	label: __( 'Delete Permanently', 'jetpack-forms' ),
	isEligible: item => item.status === 'trash',
	supportsBulk: true,
	icon: <Icon icon={ trash } />,
	async callback( items, { registry } ) {
		const { deleteEntityRecord } = registry.dispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } = registry.dispatch( noticesStore );
		const promises = await Promise.allSettled(
			items.map( ( { id } ) =>
				deleteEntityRecord( 'postType', 'feedback', id, { force: true }, { throwOnError: true } )
			)
		);
		if ( promises.every( ( { status } ) => status === 'fulfilled' ) ) {
			const numberOfItems = promises.length;
			const successMessage =
				numberOfItems === 1
					? sprintf(
							/* translators: The number of responses. */
							__( '%d response has been deleted permanently.', 'jetpack-forms' ),
							numberOfItems
					  )
					: sprintf(
							/* translators: The number of responses. */
							__( '%d responses have been deleted permanently.', 'jetpack-forms' ),
							numberOfItems
					  );
			createSuccessNotice( successMessage, { type: 'snackbar', id: 'move-to-trash-action' } );
			return;
		}
		// There is at least one failure.
		const numberOfErrors = promises.filter( ( { status } ) => status === 'rejected' ).length;
		// TODO: probably have better error messages..
		const errorMessage =
			numberOfErrors === 1
				? /* translators: The number of responses. */
				  sprintf( __( 'An error occurred for %d response.', 'jetpack-forms' ), numberOfErrors )
				: sprintf(
						/* translators: The number of responses. */
						__( 'An error occurred for %d responses.', 'jetpack-forms' ),
						numberOfErrors
				  );
		createErrorNotice( errorMessage, { type: 'snackbar' } );
	},
};
