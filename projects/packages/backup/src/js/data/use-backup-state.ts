/* eslint-disable jsdoc/require-returns */

import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { backupsQuery } from './query-options';
import { BackupEntryErrorStatuses, BackupEntryStatuses, type BackupEntry } from './types';

export type BackupStateType = 'idle' | 'enqueued' | 'running' | 'success' | 'error';

export interface BackupState {
	status: BackupStateType;
	backup: BackupEntry | null;
	hasRecentlyCompleted: boolean;
	setEnqueued: ( isEnqueued: boolean ) => void;
}

/**
 * Track a single backup through the enqueue → running → finished/error
 * lifecycle. We identify it by its `period` so that concurrent state
 * updates don't swap the tracked entry under us.
 *
 * Ported from `client/dashboard/sites/backups/use-backup-state.ts`.
 */
export function useBackupState(): BackupState {
	const trackedBackupRef = useRef< BackupEntry[ 'period' ] | null >( null );
	const [ isEnqueued, setIsEnqueued ] = useState( false );

	const setEnqueued = useCallback( ( enqueued: boolean ) => {
		setIsEnqueued( enqueued );
	}, [] );

	const { data: backups = [] } = useQuery( {
		...backupsQuery(),
		// Poll every 5s when there's an active lifecycle to observe, so
		// banners transition from "enqueued" to "running" to "success"
		// without a manual refresh. When idle the default staleTime keeps
		// us quiet.
		refetchInterval: query => {
			const latest = query.state.data?.[ 0 ];
			if ( isEnqueued ) {
				return 5000;
			}
			if ( latest?.status === BackupEntryStatuses.STARTED ) {
				return 5000;
			}
			return false;
		},
	} );

	const latestBackup = backups[ 0 ];
	const isRunning = latestBackup?.status === BackupEntryStatuses.STARTED;

	useEffect( () => {
		if ( isRunning ) {
			setIsEnqueued( false );
		}
	}, [ isRunning ] );

	if ( isEnqueued ) {
		return {
			status: 'enqueued',
			backup: null,
			hasRecentlyCompleted: false,
			setEnqueued,
		};
	}

	if ( trackedBackupRef.current ) {
		const tracked = backups.find( b => b.period === trackedBackupRef.current );

		if ( tracked ) {
			if ( tracked.status === BackupEntryStatuses.STARTED ) {
				return { status: 'running', backup: tracked, hasRecentlyCompleted: false, setEnqueued };
			}
			if ( tracked.status === BackupEntryStatuses.FINISHED ) {
				return { status: 'success', backup: tracked, hasRecentlyCompleted: true, setEnqueued };
			}
			if ( ( Object.values( BackupEntryErrorStatuses ) as string[] ).includes( tracked.status ) ) {
				return { status: 'error', backup: tracked, hasRecentlyCompleted: false, setEnqueued };
			}
		}
	}

	if ( latestBackup?.status === BackupEntryStatuses.STARTED ) {
		if ( ! trackedBackupRef.current || trackedBackupRef.current !== latestBackup.period ) {
			trackedBackupRef.current = latestBackup.period;
		}
		return { status: 'running', backup: latestBackup, hasRecentlyCompleted: false, setEnqueued };
	}

	return { status: 'idle', backup: null, hasRecentlyCompleted: false, setEnqueued };
}
