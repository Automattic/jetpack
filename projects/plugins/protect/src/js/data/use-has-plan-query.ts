import { useConnection } from '@automattic/jetpack-connection';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import API from '../api';
import { QUERY_HAS_PLAN_KEY } from '../constants';

export const HAS_PLAN_QUERY = {
	queryKey: [ QUERY_HAS_PLAN_KEY ],
	queryFn: API.checkPlan,
	initialData: !! window?.jetpackProtectInitialState?.hasPlan,
};

/**
 * Plan Query Hook
 *
 * @return {UseQueryResult} useQuery result.
 */
export default function usePlanQuery(): UseQueryResult {
	const { isRegistered } = useConnection();

	return useQuery( {
		...HAS_PLAN_QUERY,
		enabled: isRegistered,
	} );
}
