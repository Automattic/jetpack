import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';
import API from '../../api';
import { QUERY_ONBOARDING_PROGRESS_KEY } from '../../constants';

/**
 * Onboarding Progress Mutation Hook
 *
 * @return {UseMutationResult} - useMutation result.
 */
export default function useOnboardingProgressMutation(): UseMutationResult {
	const queryClient = useQueryClient();
	return useMutation( {
		mutationFn: API.completeOnboardingSteps,
		onMutate: ( stepIds: string[] ) => {
			// Optimistically update the query data.
			queryClient.setQueryData(
				[ QUERY_ONBOARDING_PROGRESS_KEY ],
				( currentProgress: string[] ) => [ ...currentProgress, ...stepIds ]
			);
		},
	} );
}
