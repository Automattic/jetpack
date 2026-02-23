/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
/**
 * Internal dependencies
 */
import { FORM_POST_TYPE } from '../../../blocks/shared/util/constants.js';
import { getFormsListQuery } from '../../hooks/use-forms-data.ts';
/**
 * Types
 */
import type { FormListItem } from '../../hooks/use-forms-data.ts';
import type { View } from '@wordpress/dataviews/wp';

type CoreDispatch = {
	saveEntityRecord: (
		kind: string,
		name: string,
		record: Record< string, unknown >,
		options?: { throwOnError?: boolean }
	) => Promise< unknown >;
	invalidateResolution: ( selector: string, args: unknown[] ) => void;
};

type UseChangeFormStatusArgs = {
	view: View;
	setView: ( newView: View ) => void;
	recordsLength: number;
	statusQuery: string;
};

type UseChangeFormStatusReturn = {
	isChangingStatus: boolean;
	changeFormStatus: ( items: FormListItem[], nextStatus: string ) => Promise< void >;
};

/**
 * Bulk-change form post statuses from the wp-build Forms list.
 *
 * Handles saving via core-data, notices, pagination edge cases, and invalidating list queries.
 *
 * @param args - Hook arguments.
 * @return Hook state and change handler.
 */
export default function useChangeFormStatus(
	args: UseChangeFormStatusArgs
): UseChangeFormStatusReturn {
	const { view, setView, recordsLength, statusQuery } = args;
	const [ isChangingStatus, setIsChangingStatus ] = useState( false );
	const { saveEntityRecord, invalidateResolution } = useDispatch( 'core' ) as CoreDispatch;
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	const page = view.page ?? 1;
	const perPage = view.perPage ?? 20;
	const search = view.search ?? '';

	const currentQuery = useMemo(
		() => getFormsListQuery( page, perPage, search, statusQuery ),
		[ page, perPage, search, statusQuery ]
	);

	const invalidateListQueries = useCallback(
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

	const changeFormStatus = useCallback(
		async ( items: FormListItem[], nextStatus: string ) => {
			if ( isChangingStatus || ! items?.length || ! nextStatus ) {
				return;
			}

			setIsChangingStatus( true );

			const currentQuerySnapshot = currentQuery as Record< string, unknown >;
			const isSingleStatusView = typeof statusQuery === 'string' && ! statusQuery.includes( ',' );
			let shouldNavigateToPreviousPage = false;

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
					shouldNavigateToPreviousPage =
						isSingleStatusView &&
						page > 1 &&
						nextStatus !== statusQuery &&
						updatedCount >= recordsLength;

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

					createSuccessNotice( successMessage, {
						type: 'snackbar',
						id: `change-form-status-${ Date.now() }`,
					} );

					if ( shouldNavigateToPreviousPage ) {
						setView( { ...view, page: page - 1 } );
					}
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
						{
							type: 'snackbar',
							id: `change-form-status-error-${ Date.now() }`,
						}
					);
				}
			} finally {
				setIsChangingStatus( false );

				// Invalidate the current list query so updated forms move in/out of filtered views and totals refresh.
				invalidateListQueries( currentQuerySnapshot );
				if ( shouldNavigateToPreviousPage ) {
					invalidateListQueries(
						getFormsListQuery( page - 1, perPage, search, statusQuery ) as Record< string, unknown >
					);
				}
			}
		},
		[
			currentQuery,
			createErrorNotice,
			createSuccessNotice,
			invalidateListQueries,
			isChangingStatus,
			page,
			perPage,
			recordsLength,
			saveEntityRecord,
			search,
			setView,
			statusQuery,
			view,
		]
	);

	return { isChangingStatus, changeFormStatus };
}
