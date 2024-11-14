import { useConnection } from '@automattic/jetpack-connection';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import camelize from 'camelize';
import API from '../../api';
import { QUERY_HISTORY_KEY } from '../../constants';
import { ScanStatus } from '../../types/scans';

/**
 * Use History Query
 *
 * @return {UseQueryResult} useQuery result.
 */
export default function useHistoryQuery(): UseQueryResult< ScanStatus | false > {
	const { isRegistered } = useConnection( {
		autoTrigger: false,
		from: 'protect',
		redirectUri: null,
		skipUserConnection: true,
	} );

	return useQuery( {
		queryKey: [ QUERY_HISTORY_KEY ],
		queryFn: API.getScanHistory,
		initialData: camelize( window.jetpackProtectInitialState?.scanHistory ),
		enabled: isRegistered,
	} );
}
