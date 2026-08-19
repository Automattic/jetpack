/**
 * Internal dependencies
 */
import { ANALYTICS_SYNC_MODULE } from './constants';
import type { SyncStatus, SyncStatusApiResponse } from './types';

/**
 * Normalize Jetpack's raw sync status into the analytics-scoped shape.
 *
 * @param raw          - Raw GET /jetpack/v4/sync/status response.
 * @param milestone    - Page-load milestone (unix ts, or 0 if never finished).
 * @param hasStoreData - Whether the site has store data to sync (WooCommerce active).
 *                     Defaults to true to preserve the analytics-module behaviour.
 * @return Analytics-scoped sync status.
 */
export function toSyncStatus(
	raw: SyncStatusApiResponse,
	milestone: number,
	hasStoreData = true
): SyncStatus {
	const started = Boolean( raw.started );
	const finished = Boolean( raw.finished );

	if ( ! hasStoreData ) {
		// No store data (e.g. WooCommerce inactive): there is no
		// woocommerce_analytics bucket to gate on, so fall back to Jetpack's
		// generic initial full sync. `isStarted` tracks an in-flight sync (not the
		// raw `started` flag, which the connection-time initial_sync also sets and
		// would suppress the auto-trigger / show a false "Sync interrupted").
		const isRunning = started && ! finished;

		// Sum progress across every module so the bar still fills; the generic full
		// sync has no single analytics bucket.
		let sent = 0;
		let total = 0;
		for ( const moduleProgress of Object.values( raw.progress ?? {} ) ) {
			sent += moduleProgress?.sent ?? 0;
			total += moduleProgress?.total ?? 0;
		}

		// Completion is gated on the milestone alone, never on the raw `finished`
		// flag: the connection-time initial_sync reports finished (with its modules
		// already at 100%) before our gating sync runs, so trusting it — or the stale
		// 100% progress it leaves behind — would flash a full bar right before the
		// screen auto-triggers a fresh sync. Only count progress while in flight.
		let percentage = 0;
		if ( milestone > 0 ) {
			percentage = 100;
		} else if ( isRunning && total > 0 ) {
			percentage = Math.min( 100, Math.floor( ( sent / total ) * 100 ) );
		}

		// No persistent "started" signal exists storeless (isStarted mirrors
		// isRunning), so isSyncStalled() can never fire here. A sync that ends without
		// setting the milestone is recovered via the screen's auto-trigger, not the
		// stalled path.
		return {
			isStarted: isRunning,
			isRunning,
			percentage,
			initialFullSyncFinished: milestone,
			hasStoreData,
		};
	}

	const bucket = raw.progress?.[ ANALYTICS_SYNC_MODULE ];
	const total = bucket?.total ?? 0;
	const sent = bucket?.sent ?? 0;

	// "Started" means the analytics module is in the sync progress — not Jetpack's
	// generic `raw.started`, which its connection-time initial_sync also sets, making
	// the screen show "Sync interrupted" instead of auto-triggering the analytics sync.
	const analyticsStarted = bucket !== undefined;

	let percentage = 0;
	if ( total > 0 ) {
		percentage = Math.min( 100, Math.floor( ( sent / total ) * 100 ) );
	} else if ( analyticsStarted || milestone > 0 ) {
		// Either the analytics module ran with no rows to sync (empty store), or the
		// milestone is already set: nothing to count ⇒ done. Mirrors upstream, which
		// reports 100% when the analytics bucket's total is 0.
		percentage = 100;
	}

	return {
		isStarted: analyticsStarted,
		isRunning: started && ! finished,
		percentage,
		initialFullSyncFinished: milestone,
		hasStoreData,
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
