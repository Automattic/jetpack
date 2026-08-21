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
	// The site's recent backup attempts, from the unconditionally
	// registered `/jetpack/v4/backups`. Polled while a backup runs, so it
	// deliberately does not share the activity-log family's key.
	backups: () => [ 'backup', 'backups' ] as const,
	siteSize: () => [ 'backup', 'site-size' ] as const,
	// Family prefix for any rewindable-activity-log page. Use as a
	// query-filter root to scan all cached pages (e.g. when looking up
	// a row by id across pages).
	activityLogRoot: () => [ 'backup', 'activity-log' ] as const,
	// Per-page key. `(page, pageSize)` is the only thing that
	// distinguishes one fetch from another, so both must be in the key.
	activityLogPage: ( page: number, pageSize: number ) =>
		[ 'backup', 'activity-log', { page, pageSize } ] as const,
	fileTree: ( rewindId: string, folderPath: string | null ) =>
		[ 'backup', 'file-tree', rewindId, folderPath ] as const,
	fileContents: ( rewindId: string, path: string ) =>
		[ 'backup', 'file-contents', rewindId, path ] as const,
	// Keyed on the file's own period, not the parent backup's rewindId:
	// upstream records one row per file version and matches the period
	// exactly, so two backups sharing a file share this entry.
	pathInfo: ( filePeriod: string, manifestPath: string ) =>
		[ 'backup', 'path-info', filePeriod, manifestPath ] as const,
	downloadStatus: ( rewindId: string, downloadId: number ) =>
		[ 'backup', 'download-status', rewindId, downloadId ] as const,
	restoreStatus: ( restoreId: number ) => [ 'backup', 'restore-status', restoreId ] as const,
	// The site's recent restores, not one restore's status: read to
	// recover an id WordPress.com accepted but did not return.
	recentRestores: () => [ 'backup', 'recent-restores' ] as const,
};
