import { useQuery } from '@tanstack/react-query';
import { useMemo } from '@wordpress/element';
import { fetchActivityLog } from '../data/api/activity-log';
import { normalizeActivityLog } from '../data/normalize/activity-log';
import { keys, queryClient } from '../data/query-client';
import type { ActivityItem } from '../types/activity';

type Args = {
	page: number;
	pageSize: number;
	search: string;
};

type Result = {
	items: ActivityItem[];
	totalItems: number;
	totalPages: number;
	isLoading: boolean;
	error: Error | null;
};

const MAX_FETCH_ITEMS = 100;

/**
 * Case-insensitive predicate: returns true when the activity item's title
 * or summary contains the search query. An empty query matches every item.
 *
 * WPCOM's `/sites/{id}/activity/rewindable` endpoint doesn't accept a
 * search parameter, so the hook fetches a single window of recent
 * activity (capped at `MAX_FETCH_ITEMS`) and filters client-side. This
 * matches what DataViews expects: server returns a fixed window, the
 * hook hands DataViews the filtered + paginated slice plus the totals
 * it needs for its pagination footer.
 *
 * @param item - Activity item to test.
 * @param q    - Search query (raw, untrimmed).
 * @return True when the item matches the query.
 */
function matchesSearch( item: ActivityItem, q: string ): boolean {
	if ( ! q ) {
		return true;
	}
	const haystack = `${ item.title } ${ item.summary ?? '' }`.toLowerCase();
	return haystack.includes( q.toLowerCase() );
}

/**
 * React Query hook returning a paginated, search-filtered slice of the
 * site's rewindable activity log.
 *
 * @param args          - Query args.
 * @param args.page     - 1-indexed page number.
 * @param args.pageSize - Items per page.
 * @param args.search   - Search query (title + summary, case-insensitive).
 * @return Items, total items, total pages, loading, error.
 */
export function useActivityLog( { page, pageSize, search }: Args ): Result {
	const query = useQuery( {
		queryKey: keys.activityLog( { page: 1, pageSize: MAX_FETCH_ITEMS, search: '' } ),
		queryFn: () => fetchActivityLog( { number: MAX_FETCH_ITEMS } ),
	} );

	const allItems = useMemo(
		() => normalizeActivityLog( query.data?.current?.orderedItems ),
		[ query.data ]
	);

	const { items, totalItems, totalPages } = useMemo( () => {
		const filtered = allItems.filter( item => matchesSearch( item, search ) );
		const total = Math.max( 1, Math.ceil( filtered.length / pageSize ) );
		const start = ( page - 1 ) * pageSize;
		return {
			items: filtered.slice( start, start + pageSize ),
			totalItems: filtered.length,
			totalPages: total,
		};
	}, [ allItems, page, pageSize, search ] );

	return {
		items,
		totalItems,
		totalPages,
		isLoading: query.isLoading,
		error: query.error ?? null,
	};
}

/**
 * Look up a single activity item from the React Query cache.
 *
 * Reads the same single window the hook fetches, so the right-pane
 * detail card on Overview can resolve its selected id without issuing
 * an extra request.
 *
 * @param id - Selection id: `rewindId` for backup items, `activity_id` otherwise.
 * @return The matching item, or null when the cache hasn't been populated yet or the id doesn't match anything in the cached page.
 */
export function getCachedActivityById( id: string ): ActivityItem | null {
	const data = queryClient.getQueryData< Awaited< ReturnType< typeof fetchActivityLog > > >(
		keys.activityLog( { page: 1, pageSize: MAX_FETCH_ITEMS, search: '' } )
	);
	const items = normalizeActivityLog( data?.current?.orderedItems );
	return (
		items.find( item => ( item.kind === 'backup' ? item.rewindId === id : item.id === id ) ) ?? null
	);
}

/**
 * Returns the newest backup row in the cached activity log, or null when
 * the cache isn't populated or holds no backup rows.
 *
 * Used by the Overview to preselect a default right-pane on first load.
 *
 * @return The newest backup item's rewindId, or null.
 */
export function getCachedDefaultBackupRewindId(): string | null {
	const data = queryClient.getQueryData< Awaited< ReturnType< typeof fetchActivityLog > > >(
		keys.activityLog( { page: 1, pageSize: MAX_FETCH_ITEMS, search: '' } )
	);
	const items = normalizeActivityLog( data?.current?.orderedItems );
	for ( const item of items ) {
		if ( item.kind === 'backup' ) {
			return item.rewindId;
		}
	}
	return null;
}
