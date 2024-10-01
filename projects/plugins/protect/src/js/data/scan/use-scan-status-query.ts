import { useConnection } from '@automattic/jetpack-connection';
import { useQuery, UseQueryResult, useQueryClient } from '@tanstack/react-query';
import camelize from 'camelize';
import API from '../../api';
import {
	SCAN_IN_PROGRESS_STATUSES,
	SCAN_STATUS_IDLE,
	SCAN_STATUS_UNAVAILABLE,
} from '../../constants';
import { ScanStatus } from '../../types/scans';
import { QUERY_SCAN_STATUS_KEY } from './../../constants';

export const isRequestedScanNotStarted = ( status: ScanStatus ) => {
	// If the scan status is not "idle", always return the fresh API data
	if ( status.status !== 'idle' ) {
		return false;
	}

	// Retrieve last scan timestamp from localStorage and convert to number
	const lastRequestedScanTimestamp = Number( localStorage.getItem( 'last_requested_scan' ) );

	// If there is no stored timestamp, return the API data
	if ( ! lastRequestedScanTimestamp ) {
		return false;
	}

	// Check if the last scan request is more than 5 minutes old
	if ( lastRequestedScanTimestamp < Date.now() - 5 * 60 * 1000 ) {
		return false;
	}

	// Convert the lastChecked date string to a Unix timestamp
	const lastCheckedTimestamp = new Date( status.lastChecked + ' UTC' ).getTime();

	// Check if the scan request is completed based on the last checked time
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
	const queryClient = useQueryClient();
	const { isRegistered } = useConnection( {
		autoTrigger: false,
		from: 'protect',
		redirectUri: null,
		skipUserConnection: true,
	} );

	return useQuery( {
		queryKey: [ QUERY_SCAN_STATUS_KEY ],
		queryFn: async () => {
			// Fetch scan status data from the API
			const data = await API.getScanStatus();

			// Return cached data if conditions are met
			if ( isRequestedScanNotStarted( data ) ) {
				// Get cached data for the query
				const cachedData = queryClient.getQueryData( [ QUERY_SCAN_STATUS_KEY ] );

				return cachedData;
			}

			// If cached data is not applicable or expired, return the fresh API data
			return data;
		},
		initialData: camelize( window?.jetpackProtectInitialState?.status ),
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
