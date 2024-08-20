import { useConnection } from '@automattic/jetpack-connection';
import { useQuery } from '@tanstack/react-query';
import API from '../api';
import { QUERY_HAS_PLAN_KEY } from '../constants';

/**
 * Credentials Query Hook
 *
 * @return {object} useQuery Hook
 */
export default function usePlanQuery() {
	const { isRegistered, isUserConnected } = useConnection( {
		autoTrigger: false,
		from: 'protect',
		redirectUri: null,
		skipUserConnection: true,
	} );

	return useQuery( {
		queryKey: [ QUERY_HAS_PLAN_KEY ],
		queryFn: API.checkPlan,
		initialData: !! window?.jetpackProtectInitialState?.hasPlan,
		enabled: isRegistered && isUserConnected,
	} );
}
