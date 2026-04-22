/* eslint-disable jsdoc/require-param-description, jsdoc/require-returns */

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { activityLogQuery } from './query-options';
import { buildTimeRangeForActivityLog } from './site-activity-log';
import { useBackupState } from './use-backup-state';
import type { ActivityLogEntry } from './types';

export interface UseActivityLogOptions {
	dateRange?: { start: Date; end: Date };
	timezoneString?: string;
	gmtOffset?: number;
}

export interface UseActivityLogResult {
	activityLog: ActivityLogEntry[];
	isLoadingActivityLog: boolean;
}

/**
 * Fetch the rewindable activity log, scoped to a date range (in the site's
 * timezone) and poll while a backup we just kicked off hasn't yet shown up
 * as a successful entry.
 *
 * Ported from `client/dashboard/sites/backups/use-activity-log.ts`.
 * @param root0
 * @param root0.dateRange
 * @param root0.timezoneString
 * @param root0.gmtOffset
 */
export function useActivityLog( {
	dateRange,
	timezoneString,
	gmtOffset,
}: UseActivityLogOptions ): UseActivityLogResult {
	const { backup, hasRecentlyCompleted } = useBackupState();

	const { after, before } = useMemo( () => {
		if ( ! dateRange ) {
			return { after: undefined, before: undefined };
		}
		return buildTimeRangeForActivityLog(
			dateRange.start,
			dateRange.end,
			timezoneString,
			gmtOffset
		);
	}, [ dateRange, timezoneString, gmtOffset ] );

	const queryResult = useQuery( {
		...activityLogQuery( undefined, true, after, before ),
		refetchInterval: query => {
			if ( ! backup || ! hasRecentlyCompleted ) {
				return false;
			}
			const backupPeriod = parseInt( backup.period, 10 );
			if ( isNaN( backupPeriod ) ) {
				return false;
			}
			const successfulBackup = query.state.data?.current?.orderedItems?.some(
				entry => entry?.object?.backup_period === backupPeriod
			);
			return successfulBackup ? false : 3000;
		},
	} );

	return {
		activityLog: queryResult.data ?? [],
		isLoadingActivityLog: queryResult.isLoading,
	};
}
