import { QueryClient } from '@tanstack/react-query';

const STALE_TIME_DEFAULT_MS = 30_000;
const GC_TIME_DEFAULT_MS = 5 * 60_000;

/**
 * Module-scope QueryClient shared across the modernized Backup dashboard.
 *
 * Each wp-build route mounts its own `<QueryClientProvider>` (via
 * `<DashboardLayout>`), but the client itself is created once so the
 * cache survives the per-route bundle re-mount on navigation.
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
	activityLog: ( args: { page: number; pageSize: number; search: string } ) =>
		[ 'backup', 'activity-log', args ] as const,
	fileTree: ( rewindId: string, folderPath: string | null ) =>
		[ 'backup', 'file-tree', rewindId, folderPath ] as const,
	fileContents: ( rewindId: string, path: string ) =>
		[ 'backup', 'file-contents', rewindId, path ] as const,
	downloadStatus: ( rewindId: string, downloadId: number ) =>
		[ 'backup', 'download-status', rewindId, downloadId ] as const,
	restoreStatus: ( restoreId: number ) => [ 'backup', 'restore-status', restoreId ] as const,
};
