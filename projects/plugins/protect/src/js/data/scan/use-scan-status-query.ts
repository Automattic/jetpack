import { useConnection } from '@automattic/jetpack-connection';
import { type ScanStatus } from '@automattic/jetpack-scan';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import camelize from 'camelize';
import API from '../../api';
import {
	SCAN_IN_PROGRESS_STATUSES,
	SCAN_STATUS_IDLE,
	SCAN_STATUS_UNAVAILABLE,
	QUERY_SCAN_STATUS_KEY,
} from '../../constants';

export const SCAN_STATUS_QUERY = {
	queryKey: [ QUERY_SCAN_STATUS_KEY ],
	queryFn: API.getScanStatus,
	initialData: camelize( window?.jetpackProtectInitialState?.status ),
};

export const isRequestedScanNotStarted = ( status: ScanStatus ) => {
	if ( status.status !== 'idle' ) {
		return false;
	}

	const lastRequestedScanTimestamp = Number( localStorage.getItem( 'last_requested_scan' ) );

	if ( ! lastRequestedScanTimestamp ) {
		return false;
	}

	if ( lastRequestedScanTimestamp < Date.now() - 5 * 60 * 1000 ) {
		return false;
	}

	const lastCheckedTimestamp = new Date( status.lastChecked + ' UTC' ).getTime();

	const isScanCompleted = lastCheckedTimestamp > lastRequestedScanTimestamp;
	if ( isScanCompleted ) {
		return false;
	}

	return true;
};

export const isScanInProgress = ( status: ScanStatus ) => {
	// If there has never been a scan, and the scan status is idle or unavailable, then we must still be getting set up.
	const scanIsInitializing =
		! status?.lastChecked &&
		[ SCAN_STATUS_IDLE, SCAN_STATUS_UNAVAILABLE ].includes( status?.status );

	const scanIsInProgress = SCAN_IN_PROGRESS_STATUSES.indexOf( status?.status ) >= 0;

	return scanIsInitializing || scanIsInProgress;
};

/**
 * Use Scan Status Query
 *
 * @param {object}  args            - Hook arguments.
 * @param {boolean} args.usePolling - When enabled, the query will poll for updates when the scan is in progress.
 *
 * @return {UseQueryResult} useQuery result.
 */
export default function useScanStatusQuery( {
	usePolling,
}: { usePolling?: boolean } = {} ): UseQueryResult< ScanStatus > {
	const { isRegistered } = useConnection();

	return useQuery( {
		...SCAN_STATUS_QUERY,
		enabled: isRegistered,
		refetchInterval( query ) {
			if ( ! usePolling ) {
				return false;
			}

			// Refetch on a shorter interval for the first few updates.
			const interval = query.state.dataUpdateCount < 5 ? 5_000 : 15_000;

			// Refetch when scanning.
			if ( isScanInProgress( query.state.data ) ) {
				return interval;
			}

			return false;
		},
	} );
}
