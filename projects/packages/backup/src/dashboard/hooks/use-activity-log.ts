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

/**
 * The order the list starts in, and the only order in which "the first
 * backup row" means "the newest backup".
 *
 * `useDefaultBackupRewindId` and `useHasRestorePoints` are pinned to it
 * for that reason — see their docblocks.
 */
export const ACTIVITY_LOG_NEWEST_FIRST: ActivitySortOrder = 'desc';

/**
 * Shared `useQuery` for a single page of the rewindable activity log.
 *
 * `keepPreviousData` keeps the previous page visible while the next
 * page's request is in flight — DataViews' pagination feels smooth
 * instead of flashing a spinner over the list on every page change.
 *
 * `useDefaultBackupRewindId` mounts in the Overview screen's own body,
 * which React renders before `<Gates>` — so this query has to decide for
 * itself whether the bridge can answer, rather than relying on the gate
 * to not render it. Consumers inside the gated body get `enabled: true`
 * for free, since they only mount once the connection checks pass.
 *
 * The ordering is a query parameter, not a client-side sort: WPCOM
 * orders the whole result set and hands back one page of it. That is why
 * `sortOrder` is in the cache key and why the two "newest backup"
 * consumers below must not inherit the list's value.
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
 * @return Items, total items, total pages, loading, error, refetch.
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
		error,
		refetch: retry,
	};
}

/**
 * Look up a single activity item from the currently-loaded page of
 * rewindable activity, falling through to any other cached pages of
 * the same family if not found.
 *
 * Selection happens by clicking a row, so a clicked item is guaranteed
 * to be in the page that's currently rendered. Two cases are not
 * clicks, and both rely on the cache scan below. A bookmarked
 * `?selected=` URL may name a row on a page nothing has loaded, and
 * this hook returns null so the right pane shows "Item not found" until
 * the reader paginates to it. And the first-load default selection is
 * pinned to the newest backup whatever the list is sorted by, so on an
 * ascending list it names a row that is genuinely off-screen — there the
 * scan finds it in the pinned page-1 entry `useDefaultBackupRewindId`
 * populated, and the pane is right even though no row is highlighted.
 * See that hook for why that trade is the intended one.
 *
 * @param id        - Selection id: `rewindId` for backup items, `activity_id` otherwise.
 * @param page      - The page currently shown in the list.
 * @param pageSize  - The per-page setting currently shown in the list.
 * @param sortOrder - The sort direction currently shown in the list.
 * @return The matching item, or null when nothing in the cached page(s) matches.
 */
export function useActivityById(
	id: string | null,
	page: number,
	pageSize: number,
	sortOrder: ActivitySortOrder
): ActivityItem | null {
	// Subscribe to the same page query the list uses so this hook
	// re-renders the moment the list's data resolves. `sortOrder` is
	// part of the cache key, so it has to follow the list's — pinning it
	// would open a second query for rows already on screen.
	const query = useActivityPageQuery( page, pageSize, sortOrder );
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
 * Always reads page 1 with the default per-page size and newest-first
 * ordering, regardless of what the list is currently showing. When the
 * list is also on page 1 with the default size and default order,
 * TanStack dedupes — no extra fetch.
 *
 * The ordering is pinned, not inherited, and that is the whole
 * correctness of this hook: "the first backup row" only means "the
 * newest backup" while the server is sorting newest-first. Following the
 * list into ascending order would silently preselect the *oldest*
 * restore point the reader has — a wrong default with no error to
 * notice, on the one control in this dashboard that starts a
 * destructive operation.
 *
 * The accepted consequence: on an ascending list, the row this returns
 * is usually not one of the rows on screen. The reader sees the ten
 * oldest events with nothing highlighted, while the right pane shows the
 * newest backup's detail card. `useActivityById` resolves it through its
 * cross-page cache scan, so the pane is populated and correct — it is
 * simply describing a row the list is not currently showing.
 *
 * That is deliberate, and the better of two bad options. Preselecting
 * whatever happens to be at the top of the visible page would put the
 * oldest restore point behind a Restore button by default, which is the
 * failure this pinning exists to prevent. Please do not "fix" the
 * missing highlight by making this follow the list; if the mismatch is
 * ever worth closing, close it by clearing the selection when it falls
 * off the visible page, never by changing what "default" means.
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
 * Shares the page-1 newest-first query with `useDefaultBackupRewindId`,
 * so it costs no extra request — and is pinned to that ordering for a
 * second reason of its own. This answer gates the first-run takeover
 * panel, so it must be asked of a fixed window: reading whichever page
 * the list happens to be showing would let paginating away from page 1
 * report "no restore points" and replace the dashboard with the
 * first-backup screen on a site full of backups.
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
