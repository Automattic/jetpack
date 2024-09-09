import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import API from '../../api';
import { QUERY_ONBOARDING_PROGRESS_KEY } from '../../constants';

/**
 * Use Onboarding Progress Query
 *
 * @return {UseQueryResult} - useQuery result.
 */
export default function useOnboardingProgressQuery(): UseQueryResult {
	return useQuery( {
		queryKey: [ QUERY_ONBOARDING_PROGRESS_KEY ],
		queryFn: API.getOnboardingProgress,
		initialData: window?.jetpackProtectInitialState?.onboardingProgress || [],
	} );
}
