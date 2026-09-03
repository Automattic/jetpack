import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from '@wordpress/element';
import {
	fetchActivityLog,
	type ActivitySortOrder,
	type WpcomActivityEntry,
	type WpcomActivityLogResponse,
} from '../data/api/activity-log';
import { normalizeActivityLog } from '../data/normalize/activity-log';
import { keys } from '../data/query-client';
import { useCanQueryWpcom } from './use-connection';
import { useStickyError } from './use-sticky-error';
import type { ActivityItem } from '../types/activity';

type Args = {
	page: number;
	pageSize: number;
	sortOrder: ActivitySortOrder;
};

type Result = {
	items: ActivityItem[];
	totalItems: number;
	totalPages: number;
	isLoading: boolean;
	/**
	 * True while a refetch is in flight. Distinct from `isLoading`, which
	 * React Query defines as `isPending && isFetching` — a query in the
	 * error state is never pending, so `isLoading` stays false for the
	 * whole duration of a retry.
	 */
	isFetching: boolean;
	/**
	 * True when React Query parked the request instead of sending it, which
	 * `networkMode: 'online'` does for an offline browser. Neither fetching nor
	 * errored — so callers that read an absence as an answer need this to tell
	 * "nothing there" from "never asked".
	 */
	isPaused: boolean;
	error: Error | null;
	refetch: () => void;
};

/**
 * Default per-page size for the rewindable activity list. Mirrors
 * `ActivityList`'s `DEFAULT_PER_PAGE` so the default-selection lookup
 * (`useDefaultBackupRewindId`) shares a cache entry with the list's
 * first fetch when the user hasn't changed the per-page setting.
 */
export const ACTIVITY_LOG_DEFAULT_PER_PAGE = 10;

/** The order the list starts in, and the only one where the first backup row is the newest. */
export const ACTIVITY_LOG_NEWEST_FIRST: ActivitySortOrder = 'desc';

/**
 * Shared `useQuery` for a single page of the rewindable activity log.
 *
 * `keepPreviousData` keeps the previous page visible while the next
 * page's request is in flight — DataViews' pagination feels smooth
 * instead of flashing a spinner over the list on every page change.
 *
 * Every consumer mounts inside `<Gates>`, so `enabled` is the backstop for a future
 * one that does not: without a user-level WPCOM connection the bridge only 403s.
 *
 * WPCOM sorts the whole result set server-side, so `sortOrder` is part of the
 * cache key rather than something applied to the page after it arrives.
 *
 * @param page      - 1-indexed page number.
 * @param pageSize  - Items per page.
 * @param sortOrder - Sort direction.
 * @return The page query.
 */
function useActivityPageQuery( page: number, pageSize: number, sortOrder: ActivitySortOrder ) {
	const enabled = useCanQueryWpcom();
	return useQuery( {
		queryKey: keys.activityLogPage( page, pageSize, sortOrder ),
		queryFn: () => fetchActivityLog( { page, number: pageSize, sort_order: sortOrder } ),
		placeholderData: keepPreviousData,
		enabled,
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
 * @param args           - Query args.
 * @param args.page      - 1-indexed page number.
 * @param args.pageSize  - Items per page.
 * @param args.sortOrder - Sort direction, from the list's Order control.
 * @return Items, total items, total pages, loading, paused, error, refetch.
 */
export function useActivityLog( { page, pageSize, sortOrder }: Args ): Result {
	const query = useActivityPageQuery( page, pageSize, sortOrder );
	const { refetch } = query;
	// Held across the retry: React Query rewinds this query to `pending`
	// when it refetches after a failure, so without this the reason
	// disappears the moment the reader clicks the retry button.
	const error = useStickyError( query.error, query.isFetching );

	const items = useMemo(
		() => normalizeActivityLog( query.data?.current?.orderedItems ),
		[ query.data ]
	);

	// Wrapped so callers can hand it straight to `onClick` without
	// returning a floating promise from the event handler.
	const retry = useCallback( () => {
		refetch();
	}, [ refetch ] );

	return {
		items,
		totalItems: query.data?.totalItems ?? items.length,
		totalPages: query.data?.totalPages ?? Math.max( 1, Math.ceil( items.length / pageSize ) ),
		isLoading: query.isLoading,
		isFetching: query.isFetching,
		isPaused: query.isPaused,
		error,
		refetch: retry,
	};
}

/**
 * Look up a single activity item from the currently-loaded page of
 * rewindable activity, falling through to any other cached pages of
 * the same family if not found.
 *
 * A clicked row is always in the rendered page; the cache scan covers the two
 * selections that are not clicks — a bookmarked `?selected=` on a page nothing
 * has loaded, and the newest-backup default pinned by the hook below.
 *
 * A null item never means "no such row": it is equally the answer while the page
 * query is in flight, after it failed, and while the row sits on a page nothing
 * has loaded — `hasAnswered` is the list's page verdict, not the whole log's.
 *
 * @param id        - Selection id: `rewindId` for backup items, `activity_id` otherwise.
 * @param page      - The page currently shown in the list.
 * @param pageSize  - The per-page setting currently shown in the list.
 * @param sortOrder - The sort direction currently shown in the list.
 * @return The matching item or null, whether the list's page query has answered, and its failure if it did.
 */
export function useActivityById(
	id: string | null,
	page: number,
	pageSize: number,
	sortOrder: ActivitySortOrder
): { item: ActivityItem | null; hasAnswered: boolean; error: Error | null } {
	// Follows the list's `sortOrder`: it is part of the cache key, so pinning it
	// here would open a second query for rows already on screen.
	const query = useActivityPageQuery( page, pageSize, sortOrder );
	const queryClient = useQueryClient();

	const item = useMemo( () => {
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

	return { item, hasAnswered: query.isSuccess, error: query.error };
}

/**
 * Returns the newest backup row in the first page of rewindable
 * activity, or null when the cache isn't populated or holds no backup
 * rows. Reactive: subscribes via `useQuery`, so Overview's first-load
 * default selection reconciles to the newest backup the moment the
 * page-1 fetch resolves.
 *
 * Always page 1, newest-first, whatever the list is showing: inheriting an
 * ascending sort would preselect the *oldest* restore point behind the Restore
 * button. The cost is that an ascending list highlights no row, since the
 * selection is off-screen; `useActivityById` still resolves it from the cache.
 *
 * @return The newest backup item's rewindId, or null.
 */
export function useDefaultBackupRewindId(): string | null {
	const query = useActivityPageQuery( 1, ACTIVITY_LOG_DEFAULT_PER_PAGE, ACTIVITY_LOG_NEWEST_FIRST );
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
 * Whether the newest page of rewindable activity holds any backup row,
 * and whether that is known yet.
 *
 * Shares the pinned page-1 query with `useDefaultBackupRewindId`, so it costs
 * no extra request. Pinned because it gates the first-run takeover: read off
 * the list's own page, paginating away would claim the site has no backups.
 *
 * This is a second, independent opinion on "does this site have a
 * restore point". `/jetpack/v4/backups` only reports VaultPress's most
 * recent handful of rows, and scan-only rows are filtered out of that
 * window — so it can say "nothing usable" for a site that still has
 * perfectly good restore points a little further back. The activity log
 * is paginated over the full retention window and does not have that
 * blind spot.
 *
 * `isError` is reported separately from `isLoading` because callers must
 * treat the two the same way and React Query does not. A failed query is
 * not loading and holds no rows, so `hasRestorePoints` comes back a
 * confident `false` for a question that was never actually answered —
 * which is indistinguishable, to a caller reading only the first two
 * values, from a site that genuinely has no restore points.
 *
 * @return Whether a restore point is visible, whether the answer has loaded, and whether asking failed.
 */
export function useHasRestorePoints(): {
	hasRestorePoints: boolean;
	isLoading: boolean;
	isError: boolean;
} {
	const query = useActivityPageQuery( 1, ACTIVITY_LOG_DEFAULT_PER_PAGE, ACTIVITY_LOG_NEWEST_FIRST );
	const hasRestorePoints = useMemo(
		() =>
			normalizeActivityLog( query.data?.current?.orderedItems ).some(
				item => item.kind === 'backup'
			),
		[ query.data ]
	);
	return { hasRestorePoints, isLoading: query.isLoading, isError: query.isError };
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
