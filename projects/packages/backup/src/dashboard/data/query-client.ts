import { QueryClient } from '@tanstack/react-query';
import type { ActivitySortOrder } from './api/activity-log';

const STALE_TIME_DEFAULT_MS = 30_000;
const GC_TIME_DEFAULT_MS = 5 * 60_000;

const CLIENT_KEY = '__jetpackBackupQueryClient' as const;

declare global {
	interface Window {
		[ CLIENT_KEY ]?: QueryClient;
	}
}

/**
 * The one QueryClient every route of the modernized Backup dashboard renders against.
 *
 * Parked on `window` because each wp-build route bundles its own copy of this module: a
 * module-scope client left every route with its own cache, cold on first arrival.
 *
 * @return The shared client, created on first use.
 */
function sharedClient(): QueryClient {
	if ( ! window[ CLIENT_KEY ] ) {
		window[ CLIENT_KEY ] = new QueryClient( {
			defaultOptions: {
				queries: {
					staleTime: STALE_TIME_DEFAULT_MS,
					gcTime: GC_TIME_DEFAULT_MS,
					retry: 1,
					refetchOnWindowFocus: false,
				},
			},
		} );
	}

	return window[ CLIENT_KEY ];
}

// Each route also bundles its own react-query, so sentinels compared by identity —
// `skipToken`, `isCancelledError` — never match against a client another route created.
export const queryClient = sharedClient();

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
	// The site's retention and storage policies. Separate from
	// `siteSize` because it is a separate route with a much flatter
	// change rate — but the storage meter needs both, so the two are
	// always read together.
	sitePolicies: () => [ 'backup', 'site-policies' ] as const,
	// The hour WordPress.com runs the site's daily backup. Its own key rather than a
	// slice of `siteSize`: a different route, and a far longer stale time.
	backupSchedule: () => [ 'backup', 'schedule' ] as const,
	// The Backup product being promoted, for the no-plan screen's price.
	// Not keyed on anything: WordPress.com picks the currency from the
	// site, so one site only ever sees one answer.
	promotedProduct: () => [ 'backup', 'promoted-product' ] as const,
	// The storage add-on being offered. Keyed on both byte figures because the route
	// derives its answer from both — the same pair that gates the query. Nulls appear
	// in the key only while it is disabled, so no request is made under one.
	storageAddonOffer: ( storageUsed: number | null, storageLimit: number | null ) =>
		[ 'backup', 'storage-addon-offer', storageUsed, storageLimit ] as const,
	// Family prefix for any rewindable-activity-log page. Use as a
	// query-filter root to scan all cached pages (e.g. when looking up
	// a row by id across pages).
	activityLogRoot: () => [ 'backup', 'activity-log' ] as const,
	// All three distinguish one fetch from another: page 1 ascending and page 1
	// descending are different rows.
	activityLogPage: ( page: number, pageSize: number, sortOrder: ActivitySortOrder ) =>
		[ 'backup', 'activity-log', { page, pageSize, sortOrder } ] as const,
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
	// The site's recent restores, not one restore's status. Read by four
	// consumers through `useRecentRestores`, which owns the list of them.
	recentRestores: () => [ 'backup', 'recent-restores' ] as const,
	// Whether one review prompt has been dismissed. Keyed on the reason
	// because the two prompts are dismissed independently — declining to
	// review after a restore must not also spend the backups prompt — and
	// the server stores them under separate options for the same reason.
	reviewDismissal: ( reason: string ) => [ 'backup', 'review-dismissal', reason ] as const,
};
