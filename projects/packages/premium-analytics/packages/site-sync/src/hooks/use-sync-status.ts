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
import type { SyncStatus, UseSyncStatusOptions, UseSyncStatusReturn } from '../types';

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
 * Polls Jetpack's sync status; analytics-scoped progress. Auto-stops on
 * completion, stall, or `MAX_POLL_FAILURES` consecutive errors (a single
 * failure self-heals). `triggerSync` never rejects — failures surface via `error`.
 *
 * @param options           - Hook options.
 * @param options.enabled   - Whether to watch the sync at all.
 * @param options.autoStart - Whether to start a sync when none is running.
 * @return The current sync state plus a `triggerSync` action.
 */
export function useSyncStatus( {
	enabled = true,
	autoStart = false,
}: UseSyncStatusOptions = {} ): UseSyncStatusReturn {
	const milestoneRef = useRef< number >( readMilestone() );
	const [ data, setData ] = useState< SyncStatus >();
	const [ error, setError ] = useState< Error | null >( null );
	// A start that failed isn't disproven by mere polling success — only the
	// analytics module appearing in progress clears it. Held apart from the
	// poll's own errors so the retry banner survives until sync is under way.
	const startErrorRef = useRef< Error | null >( null );

	const intervalRef = useRef< ReturnType< typeof setInterval > | null >( null );
	// Consecutive fetch failures. Reset on every success and whenever polling
	// (re)starts; polling only gives up once this reaches `MAX_POLL_FAILURES`.
	const failureCountRef = useRef( 0 );
	// Hold the latest `poll` in a ref so the interval always calls the current
	// closure, keeping the interval stable across `poll` identity changes.
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
				// Refresh the milestone live: the backend exposes it on every poll,
				// so it can flip mid-session even though script-data was seeded once.
				const live = raw.initial_full_sync_finished ?? 0;
				if ( live > milestoneRef.current ) {
					milestoneRef.current = live;
				}

				const status = toSyncStatus( raw, milestoneRef.current );
				failureCountRef.current = 0;
				setData( status );

				if ( status.isStarted || isSyncComplete( status ) ) {
					startErrorRef.current = null;
				}
				setError( startErrorRef.current );

				if ( isSyncComplete( status ) ) {
					clearPolling();
					return;
				}

				if ( isSyncStalled( status ) ) {
					clearPolling();
					setError(
						new Error(
							__( 'Sync has stalled. Please try again.', 'jetpack-premium-analytics-pkg' )
						)
					);
				}
			} )
			.catch( ( e: unknown ) => {
				const message =
					e instanceof Error
						? e.message
						: __( 'Unable to get sync status.', 'jetpack-premium-analytics-pkg' );
				// Keep polling through transient blips; only give up once failures
				// pile up, so a momentary network/500 hiccup self-heals next tick.
				failureCountRef.current += 1;
				if ( failureCountRef.current >= MAX_POLL_FAILURES ) {
					clearPolling();
					setError( new Error( message ) );
				}
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
		startErrorRef.current = null;
		setError( null );

		try {
			await triggerFullSync();
			poll();
			startPolling();
		} catch ( e: unknown ) {
			const message =
				e instanceof Error
					? e.message
					: __( 'Unable to start sync.', 'jetpack-premium-analytics-pkg' );
			startErrorRef.current = new Error( message );
			setError( startErrorRef.current );
			// The request may still have reached the server despite the error. Resume
			// observation so the next status response can establish what happened.
			startPolling();
		}
	}, [ clearPolling, poll, startPolling ] );

	useEffect( () => {
		if ( ! enabled ) {
			return;
		}

		// Already finished before this page load — nothing is waiting, no polling
		// needed.
		if ( milestoneRef.current > 0 ) {
			setData( toSyncStatus( {}, milestoneRef.current ) );
			return;
		}

		poll();
		startPolling();
		return clearPolling;
	}, [ enabled, poll, startPolling, clearPolling ] );

	// Once per mount: a sync the user declined to retry must stay stopped.
	const didAutoStart = useRef( false );
	useEffect( () => {
		if ( ! enabled || ! autoStart || ! data || didAutoStart.current ) {
			return;
		}

		if ( isSyncComplete( data ) || data.isStarted || data.isRunning ) {
			return;
		}

		didAutoStart.current = true;
		void triggerSync();
	}, [ enabled, autoStart, data, triggerSync ] );

	const isComplete = data ? isSyncComplete( data ) : false;

	return { data, error, isComplete, triggerSync };
}
