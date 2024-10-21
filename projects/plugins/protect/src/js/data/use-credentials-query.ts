import { useConnection } from '@automattic/jetpack-connection';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import API from '../api';
import { QUERY_CREDENTIALS_KEY } from '../constants';

/**
 * Credentials Query Hook
 *
 * @return {UseQueryResult} useQuery result.
 */
export default function useCredentialsQuery(): UseQueryResult< [ Record< string, unknown > ] > {
	const { isRegistered } = useConnection( {
		autoTrigger: false,
		from: 'protect',
		redirectUri: null,
		skipUserConnection: true,
	} );

	return useQuery( {
		queryKey: [ QUERY_CREDENTIALS_KEY ],
		queryFn: API.checkCredentials,
		initialData: window?.jetpackProtectInitialState?.credentials,
		enabled: isRegistered,
	} );
}
