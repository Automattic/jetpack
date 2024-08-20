import { useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../api';
import { QUERY_ONBOARDING_PROGRESS_KEY } from '../../constants';

/**
 * Use Onboarding Progress Mutation
 *
 * @return {object} - Mutation object
 */
export default function useOnboardingProgressMutation() {
	const queryClient = useQueryClient();
	return useMutation( {
		mutationFn: API.completeOnboardingSteps,
		onMutate: ( stepIds: string[] ) => {
			queryClient.setQueryData(
				[ QUERY_ONBOARDING_PROGRESS_KEY ],
				( currentProgress: string[] ) => [ ...currentProgress, ...stepIds ]
			);
		},
	} );
}
