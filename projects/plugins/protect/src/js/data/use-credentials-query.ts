import { useConnection } from '@automattic/jetpack-connection';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import API from '../api';
import { QUERY_CREDENTIALS_KEY } from '../constants';

export const CREDENTIALS_QUERY = {
	queryKey: [ QUERY_CREDENTIALS_KEY ],
	queryFn: API.checkCredentials,
	initialData: window?.jetpackProtectInitialState?.credentials,
};

/**
 * Credentials Query Hook
 *
 * @return {UseQueryResult} useQuery result.
 */
export default function useCredentialsQuery(): UseQueryResult< [ Record< string, unknown > ] > {
	const { isRegistered } = useConnection();

	return useQuery( {
		...CREDENTIALS_QUERY,
		enabled: isRegistered,
	} );
}
