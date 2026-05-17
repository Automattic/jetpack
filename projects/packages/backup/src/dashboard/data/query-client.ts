import { QueryClient } from '@tanstack/react-query';

const STALE_TIME_DEFAULT_MS = 30_000;
const GC_TIME_DEFAULT_MS = 5 * 60_000;

/**
 * Module-scope QueryClient for the modernized Backup dashboard.
 *
 * Each wp-build route is its own JS bundle and ends up with its own
 * copy of this module, so the cache is per-route — it does NOT survive
 * Overview ↔ Restore ↔ Download navigation. The screens don't depend on
 * cross-route cache reuse today (each derives its rewindId from the
 * URL), so this is fine; revisit if a future screen needs to read cache
 * a sibling route populated.
 */
export const queryClient = new QueryClient( {
	defaultOptions: {
		queries: {
			staleTime: STALE_TIME_DEFAULT_MS,
			gcTime: GC_TIME_DEFAULT_MS,
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
} );

/**
 * Stable cache keys for each query the dashboard issues.
 *
 * Centralizing keys here means any consumer can invalidate or read
 * cached data without re-deriving the tuple shape ad hoc.
 */
export const keys = {
	capabilities: () => [ 'backup', 'capabilities' ] as const,
	// Single shared key: the hook always fetches one fixed window of
	// rewindable activity and filters/paginates client-side, so every
	// consumer (list, default-selection, by-id lookup) subscribes to
	// the same entry.
	activityLogWindow: () => [ 'backup', 'activity-log-window' ] as const,
	fileTree: ( rewindId: string, folderPath: string | null ) =>
		[ 'backup', 'file-tree', rewindId, folderPath ] as const,
	fileContents: ( rewindId: string, path: string ) =>
		[ 'backup', 'file-contents', rewindId, path ] as const,
	downloadStatus: ( rewindId: string, downloadId: number ) =>
		[ 'backup', 'download-status', rewindId, downloadId ] as const,
	restoreStatus: ( restoreId: number ) => [ 'backup', 'restore-status', restoreId ] as const,
};
