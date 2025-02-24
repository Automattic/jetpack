import { useConnection } from '@automattic/jetpack-connection';
import { type ScanStatus } from '@automattic/jetpack-scan';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import camelize from 'camelize';
import API from '../../api';
import { QUERY_HISTORY_KEY } from '../../constants';

export const HISTORY_QUERY = {
	queryKey: [ QUERY_HISTORY_KEY ],
	queryFn: API.getScanHistory,
	initialData: camelize( window.jetpackProtectInitialState?.scanHistory ),
};

/**
 * Use History Query
 *
 * @return {UseQueryResult} useQuery result.
 */
export default function useHistoryQuery(): UseQueryResult< ScanStatus | false > {
	const { isRegistered } = useConnection();

	return useQuery( {
		...HISTORY_QUERY,
		enabled: isRegistered,
	} );
}
