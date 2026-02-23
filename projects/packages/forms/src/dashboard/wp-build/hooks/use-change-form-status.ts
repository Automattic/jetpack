/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { getFormsListQuery } from '../../hooks/use-forms-data.ts';
import useUpdateFormStatus from './use-update-form-status';
/**
 * Types
 */
import type { FormListItem } from '../../hooks/use-forms-data.ts';
import type { View } from '@wordpress/dataviews/wp';

type StatusChangeItem = Pick< FormListItem, 'id' >;

type UseChangeFormStatusArgs = {
	view: View;
	setView: ( newView: View ) => void;
	recordsLength: number;
	statusQuery: string;
};

type UseChangeFormStatusReturn = {
	isChangingStatus: boolean;
	changeFormStatus: ( items: StatusChangeItem[], nextStatus: string ) => Promise< void >;
};

/**
 * Change one or more managed form post statuses from the Forms list.
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

	const { isUpdating, updateStatus } = useUpdateFormStatus();

	const page = view.page ?? 1;
	const perPage = view.perPage ?? 20;
	const search = view.search ?? '';

	const currentQuery = useMemo(
		() => getFormsListQuery( page, perPage, search, statusQuery ),
		[ page, perPage, search, statusQuery ]
	);

	const changeFormStatus = useCallback(
		async ( items: StatusChangeItem[], nextStatus: string ) => {
			if ( isUpdating || ! items?.length || ! nextStatus ) {
				return;
			}

			let shouldNavigateToPreviousPage = false;

			try {
				const invalidateQueries: Array< Record< string, unknown > > = [
					currentQuery as Record< string, unknown >,
				];
				if ( page > 1 ) {
					invalidateQueries.push(
						getFormsListQuery( page - 1, perPage, search, statusQuery ) as Record< string, unknown >
					);
				}

				const { updatedCount } = await updateStatus( items, nextStatus, { invalidateQueries } );

				const isSingleStatusView = typeof statusQuery === 'string' && ! statusQuery.includes( ',' );
				shouldNavigateToPreviousPage =
					isSingleStatusView &&
					page > 1 &&
					nextStatus !== statusQuery &&
					updatedCount >= recordsLength;

				if ( shouldNavigateToPreviousPage ) {
					setView( { ...view, page: page - 1 } );
				}
			} finally {
				// Notices and invalidation are handled in `useUpdateFormStatus`.
			}
		},
		[
			currentQuery,
			isUpdating,
			page,
			perPage,
			recordsLength,
			search,
			setView,
			statusQuery,
			updateStatus,
			view,
		]
	);

	return { isChangingStatus: isUpdating, changeFormStatus };
}
