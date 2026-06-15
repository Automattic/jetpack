/**
 * Internal dependencies
 */
import { ANALYTICS_SYNC_MODULE } from './constants';
import type { SyncStatus, SyncStatusApiResponse } from './types';

/**
 * Normalize Jetpack's raw sync status into the analytics-scoped shape.
 *
 * @param raw       - Raw GET /jetpack/v4/sync/status response.
 * @param milestone - Page-load milestone (unix ts, or 0 if never finished).
 * @return Analytics-scoped sync status.
 */
export function toSyncStatus( raw: SyncStatusApiResponse, milestone: number ): SyncStatus {
	const started = Boolean( raw.started );
	const finished = Boolean( raw.finished );
	const bucket = raw.progress?.[ ANALYTICS_SYNC_MODULE ];
	const total = bucket?.total ?? 0;
	const sent = bucket?.sent ?? 0;

	let percentage = 0;
	if ( total > 0 ) {
		percentage = Math.min( 100, Math.floor( ( sent / total ) * 100 ) );
	} else if ( milestone > 0 ) {
		// No analytics bucket this batch, but the milestone is set: initial sync done.
		percentage = 100;
	}

	return {
		isStarted: started,
		isRunning: started && ! finished,
		percentage,
		initialFullSyncFinished: milestone,
	};
}

/**
 * Determine whether sync is complete.
 * @param status - Normalized sync status.
 * @return Whether the analytics initial sync has finished.
 */
export function isSyncComplete( status: SyncStatus ): boolean {
	return status.percentage >= 100 && status.initialFullSyncFinished > 0;
}

/**
 * Stalled = the sync started but is no longer running and hasn't completed. A
 * sync that never started is NOT stalled — it just needs to be triggered.
 * @param status - Normalized sync status.
 * @return Whether the sync has stalled.
 */
export function isSyncStalled( status: SyncStatus ): boolean {
	return status.isStarted && ! status.isRunning && ! isSyncComplete( status );
}
