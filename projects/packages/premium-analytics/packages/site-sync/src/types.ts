/**
 * Subset of Jetpack core's GET /jetpack/v4/sync/status response that this
 * package consumes. `progress` is keyed by sync-module name; each module
 * reports items `sent` of `total`.
 */
export type SyncStatusApiResponse = {
	started?: boolean;
	finished?: boolean | number;
	progress?: Record< string, { sent?: number; total?: number } >;
};

/**
 * Normalized, analytics-scoped sync status.
 */
export type SyncStatus = {
	isStarted: boolean;
	isRunning: boolean;
	/** Analytics-module progress, 0–100, computed client-side. */
	percentage: number;
	/** Page-load milestone: unix ts when the initial analytics sync first finished, else 0. */
	initialFullSyncFinished: number;
};

/**
 * Return type for the useSyncStatus hook.
 */
export type UseSyncStatusReturn = {
	data: SyncStatus | undefined;
	error: Error | null;
	isLoading: boolean;
	isComplete: boolean;
	isStalled: boolean;
	/**
	 * POST the full-sync trigger and resume polling. The returned promise always
	 * resolves; failures surface via `error` so callers can `void triggerSync()`
	 * from event handlers without an unhandled rejection.
	 */
	triggerSync: () => Promise< void >;
};
