import { useConnection } from '@automattic/jetpack-connection';
import { useQuery } from '@tanstack/react-query';
import camelize from 'camelize';
import API from '../../api';
import {
	SCAN_IN_PROGRESS_STATUSES,
	SCAN_STATUS_IDLE,
	SCAN_STATUS_UNAVAILABLE,
} from '../../constants';
import { QUERY_SCAN_STATUS_KEY } from './../../constants';

/**
 * Use Scan Status Query
 *
 * @param {object}  args            - Hook arguments
 * @param {boolean} args.usePolling - When enabled, the query will poll for updates when the scan is in progress.
 *
 * @return {object} useQuery object
 */
export default function useScanStatusQuery( { usePolling }: { usePolling?: boolean } = {} ) {
	const { isRegistered } = useConnection( {
		autoTrigger: false,
		from: 'protect',
		redirectUri: null,
		skipUserConnection: true,
	} );

	return useQuery( {
		queryKey: [ QUERY_SCAN_STATUS_KEY ],
		queryFn: API.getScanStatus,
		initialData: camelize( window?.jetpackProtectInitialState?.status ),
		enabled: isRegistered,
		refetchInterval( query ) {
			if ( ! usePolling ) {
				return false;
			}

			if ( ! query.state.data.status ) {
				return false;
			}

			// Refetch on a shorter interval, slow down if it is taking a while.
			const interval = query.state.dataUpdateCount < 5 ? 5_000 : 15_000;

			// If there has never been a scan, and the scan status is idle or not yet available, then we must still be getting set up.
			const scanIsInitializing =
				! query.state.data.lastChecked &&
				[ SCAN_STATUS_IDLE, SCAN_STATUS_UNAVAILABLE ].includes( query.state.data?.status );

			const scanIsInProgress = SCAN_IN_PROGRESS_STATUSES.indexOf( query.state.data?.status ) >= 0;

			// Refetch when scanning.
			if ( scanIsInitializing || scanIsInProgress ) {
				return interval;
			}

			return false;
		},
	} );
}
