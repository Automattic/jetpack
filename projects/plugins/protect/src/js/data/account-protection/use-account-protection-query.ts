import { useQuery, UseQueryResult } from '@tanstack/react-query';
import API from '../../api';
import { QUERY_ACCOUNT_PROTECTION_KEY } from '../../constants';

/**
 * Account Protection Query Hook
 *
 * @return {UseQueryResult} useQuery result.
 */
export default function useAccountProtectionQuery(): UseQueryResult {
	return useQuery( {
		queryKey: [ QUERY_ACCOUNT_PROTECTION_KEY ],
		queryFn: API.getAccountProtection,
		initialData: !! window?.jetpackProtectInitialState?.accountProtection,
	} );
}
