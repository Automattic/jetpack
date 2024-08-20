import { useQuery } from '@tanstack/react-query';
import API from '../../api';
import { QUERY_ONBOARDING_PROGRESS_KEY } from '../../constants';

/**
 * Use Onboarding Progress Query
 *
 * @return {object} - Query object
 */
export default function useOnboardingProgressQuery() {
	return useQuery( {
		queryKey: [ QUERY_ONBOARDING_PROGRESS_KEY ],
		queryFn: API.getOnboardingProgress,
		initialData: window?.jetpackProtectInitialState?.onboardingProgress || [],
	} );
}
