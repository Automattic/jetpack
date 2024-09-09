import { useConnection } from '@automattic/jetpack-connection';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import API from '../api';
import { QUERY_HAS_PLAN_KEY } from '../constants';

/**
 * Plan Query Hook
 *
 * @return {UseQueryResult} useQuery result.
 */
export default function usePlanQuery(): UseQueryResult {
	const { isRegistered } = useConnection( {
		autoTrigger: false,
		from: 'protect',
		redirectUri: null,
		skipUserConnection: true,
	} );

	return useQuery( {
		queryKey: [ QUERY_HAS_PLAN_KEY ],
		queryFn: API.checkPlan,
		initialData: !! window?.jetpackProtectInitialState?.hasPlan,
		enabled: isRegistered,
	} );
}
