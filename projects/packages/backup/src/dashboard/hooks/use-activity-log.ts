import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from '@wordpress/element';
import {
	fetchActivityLog,
	type WpcomActivityEntry,
	type WpcomActivityLogResponse,
} from '../data/api/activity-log';
import { normalizeActivityLog } from '../data/normalize/activity-log';
import { keys } from '../data/query-client';
import { useCanQueryWpcom } from './use-connection';
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
 * @param page     - 1-indexed page number.
 * @param pageSize - Items per page.
 * @return The page query.
 */
function useActivityPageQuery( page: number, pageSize: number ) {
	const enabled = useCanQueryWpcom();
	return useQuery( {
		queryKey: keys.activityLogPage( page, pageSize ),
		queryFn: () => fetchActivityLog( { page, number: pageSize } ),
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
 * @param args          - Query args.
 * @param args.page     - 1-indexed page number.
 * @param args.pageSize - Items per page.
 * @return Items, total items, total pages, loading, error, refetch.
 */
export function useActivityLog( { page, pageSize }: Args ): Result {
	const query = useActivityPageQuery( page, pageSize );
	const { refetch } = query;

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
		error: query.error ?? null,
		refetch: retry,
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
 * Whether the newest page of rewindable activity holds any backup row,
 * and whether that is known yet.
 *
 * Shares the page-1 query with `useDefaultBackupRewindId`, so it costs
 * no extra request.
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
	const query = useActivityPageQuery( 1, ACTIVITY_LOG_DEFAULT_PER_PAGE );
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
