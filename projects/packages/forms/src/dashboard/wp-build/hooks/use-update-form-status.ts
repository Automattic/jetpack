/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
/**
 * Internal dependencies
 */
import { FORM_POST_TYPE } from '../../../blocks/shared/util/constants.js';
import { NON_TRASH_FORM_STATUSES } from '../../constants';
import { getFormsListQuery, getLastFormsListQuery } from '../../hooks/use-forms-data.ts';
/**
 * Types
 */
import type { FormListItem } from '../../hooks/use-forms-data.ts';

type CoreDispatch = {
	saveEntityRecord: (
		kind: string,
		name: string,
		record: Record< string, unknown >,
		options?: { throwOnError?: boolean }
	) => Promise< unknown >;
	invalidateResolution: ( selector: string, args: unknown[] ) => void;
};

type StatusChangeItem = Pick< FormListItem, 'id' >;

type UpdateFormStatusOptions = {
	/**
	 * List queries to invalidate (exact query objects used with `useEntityRecords`).
	 */
	invalidateQueries?: Array< Record< string, unknown > >;
	/**
	 * When true, also invalidates the most recent Forms list query tracked by `useFormsData`.
	 * Useful when changing status outside the list (e.g. single-form header).
	 */
	invalidateLastFormsListQuery?: boolean;
};

type UseUpdateFormStatusReturn = {
	isUpdating: boolean;
	updateStatus: (
		items: StatusChangeItem[],
		nextStatus: string,
		options?: UpdateFormStatusOptions
	) => Promise< { updatedCount: number; failedCount: number } >;
};

/**
 * Update the status of one or more managed forms.
 *
 * Handles saving via core-data, notices, and invalidating affected entity records/list queries.
 *
 * @return Hook state and update handler.
 */
export default function useUpdateFormStatus(): UseUpdateFormStatusReturn {
	const [ isUpdating, setIsUpdating ] = useState( false );
	const { saveEntityRecord, invalidateResolution } = useDispatch( 'core' ) as CoreDispatch;
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	const invalidateListQuery = useCallback(
		( query: Record< string, unknown > ) => {
			invalidateResolution( 'getEntityRecords', [ 'postType', FORM_POST_TYPE, query ] );
			invalidateResolution( 'getEntityRecords', [
				'postType',
				FORM_POST_TYPE,
				{ ...query, per_page: 1, _fields: 'id' },
			] );
		},
		[ invalidateResolution ]
	);

	const updateStatus = useCallback(
		async (
			items: StatusChangeItem[],
			nextStatus: string,
			options: UpdateFormStatusOptions = {}
		): Promise< { updatedCount: number; failedCount: number } > => {
			if ( isUpdating || ! items?.length || ! nextStatus ) {
				return { updatedCount: 0, failedCount: items?.length ?? 0 };
			}

			setIsUpdating( true );

			try {
				const promises = await Promise.allSettled(
					items.map( item =>
						saveEntityRecord(
							'postType',
							FORM_POST_TYPE,
							{ id: item.id, status: nextStatus },
							{ throwOnError: true }
						)
					)
				);

				const updatedCount = promises.filter( p => p.status === 'fulfilled' ).length;
				const failedCount = promises.length - updatedCount;

				if ( updatedCount ) {
					const successMessage =
						updatedCount === 1
							? __( 'Status updated.', 'jetpack-forms' )
							: sprintf(
									/* translators: %d: number of forms. */
									_n(
										'Status updated for %d form.',
										'Status updated for %d forms.',
										updatedCount,
										'jetpack-forms'
									),
									updatedCount
							  );
					createSuccessNotice( successMessage, { type: 'snackbar' } );
				}

				if ( failedCount ) {
					createErrorNotice(
						sprintf(
							/* translators: %d: number of forms. */
							_n(
								'Could not update status for %d form.',
								'Could not update status for %d forms.',
								failedCount,
								'jetpack-forms'
							),
							failedCount
						),
						{ type: 'snackbar' }
					);
				}

				// Always invalidate updated items.
				items.forEach( item => {
					invalidateResolution( 'getEntityRecord', [ 'postType', FORM_POST_TYPE, item.id ] );
				} );

				// Invalidate provided list queries (exact objects).
				( options.invalidateQueries || [] ).forEach( invalidateListQuery );

				if ( options.invalidateLastFormsListQuery ) {
					const lastQuery = getLastFormsListQuery();
					if ( lastQuery ) {
						invalidateListQuery( lastQuery );
					} else {
						invalidateListQuery(
							getFormsListQuery( 1, 20, '', NON_TRASH_FORM_STATUSES ) as Record< string, unknown >
						);
					}
				}

				return { updatedCount, failedCount };
			} finally {
				setIsUpdating( false );
			}
		},
		[
			createErrorNotice,
			createSuccessNotice,
			invalidateListQuery,
			invalidateResolution,
			isUpdating,
			saveEntityRecord,
		]
	);

	return { isUpdating, updateStatus };
}
