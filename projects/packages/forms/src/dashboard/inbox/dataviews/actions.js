import { Icon } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { seen, trash, backup } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { notSpam, spam } from '../../icons';
import { store as dashboardStore } from '../../store';
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

// TODO: We should probably have better error messages in case of failure.
const getGenericErrorMessage = numberOfErrors => {
	return sprintf(
		/* translators: The number of responses. */
		_n(
			'An error occurred for %d response.',
			'An error occurred for %d responses.',
			numberOfErrors,
			'jetpack-forms'
		),
		numberOfErrors
	);
};

export const markAsSpamAction = {
	id: 'mark-as-spam',
	label: __( 'Mark as spam', 'jetpack-forms' ),
	isEligible: item => item.status !== 'spam',
	supportsBulk: true,
	icon: <Icon icon={ spam } />,
	async callback( items, { registry } ) {
		const { createSuccessNotice, createErrorNotice } = registry.dispatch( noticesStore );
		const { saveEntityRecord } = registry.dispatch( coreStore );
		const promises = await Promise.allSettled(
			items.map( ( { id } ) => saveEntityRecord( 'postType', 'feedback', { id, status: 'spam' } ) )
		);
		const itemsUpdated = promises.filter( ( { status } ) => status === 'fulfilled' );
		if ( itemsUpdated.length === items.length ) {
			// Every request was successful.
			const successMessage = sprintf(
				/* translators: The number of responses. */
				_n(
					'%d response has been marked as spam.',
					'%d responses have been marked as spam.',
					items.length,
					'jetpack-forms'
				),
				items.length
			);
			createSuccessNotice( successMessage, { type: 'snackbar', id: 'mark-as-spam-action' } );
		} else {
			// There is at least one failure.
			const numberOfErrors = promises.filter( ( { status } ) => status === 'rejected' ).length;
			const errorMessage = getGenericErrorMessage( numberOfErrors );
			createErrorNotice( errorMessage, { type: 'snackbar' } );
		}
		// Make the REST request which performs the `contact_form_akismet` `ham` action.
		if ( itemsUpdated.length ) {
			registry.dispatch( dashboardStore ).doBulkAction(
				itemsUpdated.map( ( { value } ) => value.id ),
				BULK_ACTIONS.markAsSpam
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
		const { createSuccessNotice, createErrorNotice } = registry.dispatch( noticesStore );
		const { saveEntityRecord } = registry.dispatch( coreStore );
		const promises = await Promise.allSettled(
			items.map( ( { id } ) =>
				saveEntityRecord( 'postType', 'feedback', { id, status: 'publish' } )
			)
		);
		const itemsUpdated = promises.filter( ( { status } ) => status === 'fulfilled' );
		if ( itemsUpdated.length === items.length ) {
			// Every request was successful.
			const successMessage = sprintf(
				/* translators: The number of responses. */
				_n(
					'%d response has been marked as not spam.',
					'%d responses have been marked as not spam.',
					items.length,
					'jetpack-forms'
				),
				items.length
			);
			createSuccessNotice( successMessage, { type: 'snackbar', id: 'mark-as-not-spam-action' } );
		} else {
			// There is at least one failure.
			const numberOfErrors = promises.filter( ( { status } ) => status === 'rejected' ).length;
			const errorMessage = getGenericErrorMessage( numberOfErrors );
			createErrorNotice( errorMessage, { type: 'snackbar' } );
		}
		// Make the REST request which performs the `contact_form_akismet` `ham` action.
		if ( itemsUpdated.length ) {
			registry.dispatch( dashboardStore ).doBulkAction(
				itemsUpdated.map( ( { value } ) => value.id ),
				BULK_ACTIONS.markAsNotSpam
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
			const successMessage = sprintf(
				/* translators: The number of responses. */
				_n(
					'%d response has been restored.',
					'%d responses have been restored.',
					items.length,
					'jetpack-forms'
				),
				items.length
			);
			createSuccessNotice( successMessage, { type: 'snackbar', id: 'restore-action' } );
			return;
		}
		// There is at least one failure.
		const numberOfErrors = promises.filter( ( { status } ) => status === 'rejected' ).length;
		const errorMessage = getGenericErrorMessage( numberOfErrors );
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
			const successMessage = sprintf(
				/* translators: The number of responses. */
				_n(
					'%d response has been moved to trash.',
					'%d responses have been moved to trash.',
					items.length,
					'jetpack-forms'
				),
				items.length
			);
			createSuccessNotice( successMessage, { type: 'snackbar', id: 'move-to-trash-action' } );
			return;
		}
		// There is at least one failure.
		const numberOfErrors = promises.filter( ( { status } ) => status === 'rejected' ).length;
		const errorMessage = getGenericErrorMessage( numberOfErrors );
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
		const { invalidateFilters } = registry.dispatch( dashboardStore );
		const { createSuccessNotice, createErrorNotice } = registry.dispatch( noticesStore );
		const promises = await Promise.allSettled(
			items.map( ( { id } ) =>
				deleteEntityRecord( 'postType', 'feedback', id, { force: true }, { throwOnError: true } )
			)
		);
		const itemsUpdated = promises.filter( ( { status } ) => status === 'fulfilled' );
		// If there is at least one succesful update, invalidate the cache for filters.
		if ( itemsUpdated.length ) {
			invalidateFilters();
		}
		if ( itemsUpdated.length === items.length ) {
			// Every request was successful.
			const successMessage = sprintf(
				/* translators: The number of responses. */
				_n(
					'%d response has been deleted permanently.',
					'%d responses have been deleted permanently.',
					items.length,
					'jetpack-forms'
				),
				items.length
			);
			createSuccessNotice( successMessage, { type: 'snackbar', id: 'move-to-trash-action' } );
			return;
		}
		// There is at least one failure.
		const numberOfErrors = promises.filter( ( { status } ) => status === 'rejected' ).length;
		const errorMessage = getGenericErrorMessage( numberOfErrors );
		createErrorNotice( errorMessage, { type: 'snackbar' } );
	},
};
