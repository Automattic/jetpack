/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useRef, useCallback } from 'react';
/**
 * Internal dependencies
 */
import { fetchSyncStatus } from '../api/fetch-sync-status';
import { triggerFullSync } from '../api/trigger-full-sync';
import { POLL_INTERVAL, MAX_POLL_FAILURES } from '../constants';
import { toSyncStatus, isSyncComplete, isSyncStalled } from '../status';
import type { SyncStatus, UseSyncStatusReturn } from '../types';

/**
 * Read the page-load milestone injected by the backend Sync_Status_Tracker.
 * Used as the initial seed at mount; thereafter the milestone is refreshed live
 * from each /sync/status poll (see `poll`), so it can flip mid-session.
 *
 * @return The initial full-sync milestone (unix ts), or 0 if never finished.
 */
function readMilestone(): number {
	return getScriptData()?.premium_analytics?.initial_full_sync_finished ?? 0;
}

/**
 * Whether the site has store data to sync (WooCommerce active). When false the
 * status is derived from Jetpack's generic initial full sync. Read once at mount;
 * WooCommerce activation only changes between page loads.
 *
 * Defaults to false when the flag is absent (an abnormal boot — the backend always
 * injects it). "Site data" is the neutral, never-wrong framing: every site has it,
 * only some have a store, so guessing a store is the riskier miss.
 *
 * @return Whether the site has store data.
 */
function hasStoreData(): boolean {
	return getScriptData()?.premium_analytics?.has_store_data ?? false;
}

/**
 * Polls Jetpack's sync status and returns analytics-scoped progress.
 *
 * Polling auto-stops when the sync completes or stalls, or after
 * `MAX_POLL_FAILURES` consecutive fetch errors; a single transient error is
 * retried on the next tick and self-heals on the next success. If the
 * page-load milestone is already set, the dashboard is gated open immediately
 * and no polling occurs. `triggerSync` POSTs the full-sync trigger and resumes
 * polling; it never rejects (failures surface via `error`).
 *
 * @return The current sync state plus a `triggerSync` action.
 */
export function useSyncStatus(): UseSyncStatusReturn {
	const milestoneRef = useRef< number >( readMilestone() );
	const hasStoreDataRef = useRef< boolean >( hasStoreData() );
	const [ data, setData ] = useState< SyncStatus >();
	const [ error, setError ] = useState< Error | null >( null );
	const [ isStalled, setIsStalled ] = useState( false );

	const intervalRef = useRef< ReturnType< typeof setInterval > | null >( null );
	// Consecutive fetch failures. Reset on every success and whenever polling
	// (re)starts; polling only gives up once this reaches `MAX_POLL_FAILURES`.
	const failureCountRef = useRef( 0 );
	// Hold the latest `poll` in a ref so the interval always calls the current
	// closure. Preserves the original package's pollRef pattern and keeps the
	// interval stable if `poll`'s identity ever changes.
	const pollRef = useRef< () => void >();

	const clearPolling = useCallback( () => {
		if ( intervalRef.current ) {
			clearInterval( intervalRef.current );
			intervalRef.current = null;
		}
	}, [] );

	const poll = useCallback( () => {
		fetchSyncStatus()
			.then( raw => {
				// Refresh the milestone live: the backend exposes the persisted
				// value on every /sync/status response, so it can flip mid-session
				// even though the script-data seed was captured once at mount.
				const live = raw.initial_full_sync_finished ?? 0;
				if ( live > milestoneRef.current ) {
					milestoneRef.current = live;
				}

				const status = toSyncStatus( raw, milestoneRef.current, hasStoreDataRef.current );
				failureCountRef.current = 0;
				setData( status );
				setError( null );
				setIsStalled( false );

				if ( isSyncComplete( status ) ) {
					clearPolling();
					return;
				}

				if ( isSyncStalled( status ) ) {
					clearPolling();
					setIsStalled( true );
					setError(
						new Error( __( 'Sync has stalled. Please try again.', 'jetpack-premium-analytics' ) )
					);
				}
			} )
			.catch( ( e: unknown ) => {
				const message =
					e instanceof Error
						? e.message
						: __( 'Unable to get sync status.', 'jetpack-premium-analytics' );
				// Keep polling through transient blips; only give up once failures
				// pile up, so a momentary network/500 hiccup self-heals next tick.
				failureCountRef.current += 1;
				if ( failureCountRef.current >= MAX_POLL_FAILURES ) {
					clearPolling();
				}
				setError( new Error( message ) );
			} );
	}, [ clearPolling ] );

	pollRef.current = poll;

	const startPolling = useCallback( () => {
		clearPolling();
		failureCountRef.current = 0;
		intervalRef.current = setInterval( () => {
			pollRef.current?.();
		}, POLL_INTERVAL );
	}, [ clearPolling ] );

	const triggerSync = useCallback( async () => {
		clearPolling();
		setError( null );
		setIsStalled( false );

		try {
			await triggerFullSync();
			poll();
			startPolling();
		} catch ( e: unknown ) {
			const message =
				e instanceof Error ? e.message : __( 'Unable to start sync.', 'jetpack-premium-analytics' );
			setError( new Error( message ) );
		}
	}, [ clearPolling, poll, startPolling ] );

	useEffect( () => {
		// Already finished before this page load — gate open, no polling needed.
		if ( milestoneRef.current > 0 ) {
			setData( toSyncStatus( {}, milestoneRef.current, hasStoreDataRef.current ) );
			return;
		}

		poll();
		startPolling();
		return clearPolling;
	}, [ poll, startPolling, clearPolling ] );

	const isComplete = data ? isSyncComplete( data ) : false;
	const isLoading = ! data && ! error;

	return { data, error, isLoading, isComplete, isStalled, triggerSync };
}
