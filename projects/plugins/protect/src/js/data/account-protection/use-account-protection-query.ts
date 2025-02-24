import { useConnection } from '@automattic/jetpack-connection';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import camelize from 'camelize';
import API from '../../api';
import { QUERY_ACCOUNT_PROTECTION_KEY } from '../../constants';
import { AccountProtectionStatus } from '../../types/account-protection';

export const ACCOUNT_PROTECTION_QUERY = {
	queryKey: [ QUERY_ACCOUNT_PROTECTION_KEY ],
	queryFn: API.getAccountProtection,
	initialData: camelize( window?.jetpackProtectInitialState?.accountProtection ),
};

/**
 * Account Protection Query Hook
 *
 * @return {UseQueryResult} useQuery result.
 */
export default function useAccountProtectionQuery(): UseQueryResult< AccountProtectionStatus > {
	const { isRegistered } = useConnection();

	return useQuery( {
		...ACCOUNT_PROTECTION_QUERY,
		enabled: isRegistered,
	} );
}
