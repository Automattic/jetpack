import { useQuery, UseQueryResult } from '@tanstack/react-query';
import camelize from 'camelize';
import API from '../../api';
import { QUERY_SESSIONS_KEY } from '../../constants';

/**
 * Sessions Query Hook
 *
 * @return {UseQueryResult} useQuery result.
 */
export default function useSessionsQuery(): UseQueryResult {
	return useQuery( {
		queryKey: [ QUERY_SESSIONS_KEY ],
		queryFn: API.getSessions,
		initialData: camelize( window?.jetpackProtectInitialState?.sessions ),
	} );
}
