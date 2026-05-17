import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from '@wordpress/element';
import {
	fetchActivityLog,
	type WpcomActivityEntry,
	type WpcomActivityLogResponse,
} from '../data/api/activity-log';
import { normalizeActivityLog } from '../data/normalize/activity-log';
import { keys } from '../data/query-client';
import type { ActivityItem } from '../types/activity';

type Args = {
	page: number;
	pageSize: number;
};

type Result = {
	items: ActivityItem[];
	totalItems: number;
	totalPages: number;
	isLoading: boolean;
	error: Error | null;
};

/**
 * Default per-page size for the rewindable activity list. Mirrors
 * `ActivityList`'s `DEFAULT_PER_PAGE` so the default-selection lookup
 * (`useDefaultBackupRewindId`) shares a cache entry with the list's
 * first fetch when the user hasn't changed the per-page setting.
 */
export const ACTIVITY_LOG_DEFAULT_PER_PAGE = 10;

/**
 * Shared `useQuery` for a single page of the rewindable activity log.
 *
 * `keepPreviousData` keeps the previous page visible while the next
 * page's request is in flight — DataViews' pagination feels smooth
 * instead of flashing a spinner over the list on every page change.
 *
 * @param page     - 1-indexed page number.
 * @param pageSize - Items per page.
 * @return The page query.
 */
function useActivityPageQuery( page: number, pageSize: number ) {
	return useQuery( {
		queryKey: keys.activityLogPage( page, pageSize ),
		queryFn: () => fetchActivityLog( { page, number: pageSize } ),
		placeholderData: keepPreviousData,
	} );
}

/**
 * React Query hook returning a single server-paginated page of the
 * site's rewindable activity log.
 *
 * Mirrors the trunk `jetpack-activity-log` package's pattern: WPCOM
 * does the paging, `totalItems` / `totalPages` come back in the
 * envelope, and DataViews owns the footer.
 *
 * @param args          - Query args.
 * @param args.page     - 1-indexed page number.
 * @param args.pageSize - Items per page.
 * @return Items, total items, total pages, loading, error.
 */
export function useActivityLog( { page, pageSize }: Args ): Result {
	const query = useActivityPageQuery( page, pageSize );

	const items = useMemo(
		() => normalizeActivityLog( query.data?.current?.orderedItems ),
		[ query.data ]
	);

	return {
		items,
		totalItems: query.data?.totalItems ?? items.length,
		totalPages: query.data?.totalPages ?? Math.max( 1, Math.ceil( items.length / pageSize ) ),
		isLoading: query.isLoading,
		error: query.error ?? null,
	};
}

/**
 * Look up a single activity item from the currently-loaded page of
 * rewindable activity, falling through to any other cached pages of
 * the same family if not found.
 *
 * Selection happens by clicking a row, so the item is guaranteed to be
 * in the page that's currently rendered. When the user lands via a
 * bookmarked `?selected=` URL on a different page than the row, this
 * hook returns null and the right pane shows the "Item not found"
 * fallback until the user paginates to that page.
 *
 * @param id       - Selection id: `rewindId` for backup items, `activity_id` otherwise.
 * @param page     - The page currently shown in the list.
 * @param pageSize - The per-page setting currently shown in the list.
 * @return The matching item, or null when nothing in the cached page(s) matches.
 */
export function useActivityById(
	id: string | null,
	page: number,
	pageSize: number
): ActivityItem | null {
	// Subscribe to the same page query the list uses so this hook
	// re-renders the moment the list's data resolves.
	const query = useActivityPageQuery( page, pageSize );
	const queryClient = useQueryClient();

	return useMemo( () => {
		if ( ! id ) {
			return null;
		}
		const found = findById( query.data?.current?.orderedItems, id );
		if ( found ) {
			return found;
		}
		// Fall through: scan any other cached pages of the rewindable
		// family for the id (e.g. the user paginated away from the
		// page that originally loaded their selection).
		const cached = queryClient.getQueriesData< WpcomActivityLogResponse >( {
			queryKey: keys.activityLogRoot(),
		} );
		for ( const [ , data ] of cached ) {
			const hit = findById( data?.current?.orderedItems, id );
			if ( hit ) {
				return hit;
			}
		}
		return null;
		// `queryClient` is stable; the cache scan re-runs whenever the
		// active page query resolves (covered by `query.data`).
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ id, query.data ] );
}

/**
 * Returns the newest backup row in the first page of rewindable
 * activity, or null when the cache isn't populated or holds no backup
 * rows. Reactive: subscribes via `useQuery`, so Overview's first-load
 * default selection reconciles to the newest backup the moment the
 * page-1 fetch resolves.
 *
 * Always reads page 1 with the default per-page size, regardless of
 * which page the list is currently on. When the list is also on page 1
 * with the default size, TanStack dedupes — no extra fetch.
 *
 * @return The newest backup item's rewindId, or null.
 */
export function useDefaultBackupRewindId(): string | null {
	const query = useActivityPageQuery( 1, ACTIVITY_LOG_DEFAULT_PER_PAGE );
	return useMemo( () => {
		const items = normalizeActivityLog( query.data?.current?.orderedItems );
		for ( const item of items ) {
			if ( item.kind === 'backup' ) {
				return item.rewindId;
			}
		}
		return null;
	}, [ query.data ] );
}

/**
 * Scan a raw WPCOM `orderedItems` array for a row matching the given
 * selection id. Backup rows are addressed by `rewindId`, others by
 * `activity_id` — `normalizeActivityLog` is run on the matched slice
 * so the caller gets the same `ActivityItem` shape the rest of the
 * UI consumes.
 *
 * @param entries - Raw WPCOM entries to scan, or undefined.
 * @param id      - Selection id to match.
 * @return The matching activity item, or null.
 */
function findById( entries: WpcomActivityEntry[] | undefined, id: string ): ActivityItem | null {
	if ( ! entries ) {
		return null;
	}
	const normalized = normalizeActivityLog( entries );
	return (
		normalized.find( item => ( item.kind === 'backup' ? item.rewindId === id : item.id === id ) ) ??
		null
	);
}
