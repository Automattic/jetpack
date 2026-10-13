/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { store as dashboardStore } from '../store/index';
import getResponseFilterParams from './get-response-filter-params';
import useEmptyResponses, {
	type EmptyScope,
	type EmptyScopeMode,
	type UseEmptyResponsesReturn,
} from './use-empty-responses';
import useInboxData from './use-inbox-data';

export type EmptySpamScopeMode = EmptyScopeMode;
export type EmptySpamScope = EmptyScope;

type UseEmptySpamReturn = Omit< UseEmptyResponsesReturn, 'totalItems' > & {
	totalItemsSpam: number;
	scope: EmptySpamScope;
};

/**
 * Hook to manage empty spam functionality with scope awareness.
 *
 * The button can act on three different scopes, in priority order:
 * 1. `selection` — explicitly selected rows (`post_ids`).
 * 2. `filtered` — every spam response matching the current search/form/date/read/test filters.
 * 3. `all` — every spam response (legacy behavior when no selection or filter).
 *
 * @param props                - Optional props.
 * @param props.totalItemsSpam - The total number of spam items (optional, will use hook if not provided).
 * @return Object with empty spam state, scope, and handlers.
 */
export default function useEmptySpam( {
	totalItemsSpam: totalItemsSpamProp,
}: {
	totalItemsSpam?: number;
} = {} ): UseEmptySpamReturn {
	const hookData = useInboxData();
	const totalItemsSpam = totalItemsSpamProp ?? hookData.totalItemsSpam ?? 0;
	const { currentQuery } = hookData;
	// The list's own total, from the same WP_Query the delete runs; `/counts` matches search differently.
	const totalItemsListed = hookData.totalItems ?? 0;

	const selectedIds = useSelect(
		select =>
			(
				select( dashboardStore ) as unknown as {
					getSelectedResponsesFromCurrentDataset: () => Array< number | string >;
				}
			 ).getSelectedResponsesFromCurrentDataset(),
		[]
	);

	const scope = useMemo< EmptySpamScope >( () => {
		const normalizedIds = ( selectedIds || [] )
			.map( id => ( typeof id === 'string' ? parseInt( id, 10 ) : id ) )
			.filter( ( id ): id is number => Number.isFinite( id ) && id > 0 );

		if ( normalizedIds.length > 0 ) {
			return {
				mode: 'selection',
				count: normalizedIds.length,
				params: { post_ids: normalizedIds },
			};
		}

		const params = getResponseFilterParams( currentQuery );
		if ( Object.keys( params ).length > 0 ) {
			return { mode: 'filtered', count: totalItemsListed, params };
		}

		return { mode: 'all', count: totalItemsSpam, params };
	}, [ selectedIds, currentQuery, totalItemsSpam, totalItemsListed ] );

	const { totalItems, ...rest } = useEmptyResponses( {
		flow: 'spam',
		totalItemsProp: totalItemsSpamProp,
		scope,
	} );

	return { ...rest, totalItemsSpam: totalItems, scope };
}
