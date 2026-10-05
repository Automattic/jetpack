import apiFetch from '@wordpress/api-fetch';

export type OnboardingTaskId = 'start' | 'subscribe_form' | 'subscribers' | 'send_newsletter';

export type OnboardingTaskList = {
	id: string;
	tasks: Array< { id: OnboardingTaskId; complete: boolean } >;
};

const ONBOARDING_PATH = '/wpcom/v2/newsletter/task-lists/onboarding';

export const ONBOARDING_TASKS_QUERY_KEY = [ 'newsletter', 'task-lists', 'onboarding' ] as const;

/**
 * Fetch the onboarding task list. WP.com decides each task's completion; on Jetpack sites the
 * request is proxied there.
 *
 * @return The onboarding task list.
 */
export function fetchOnboardingTasks(): Promise< OnboardingTaskList > {
	return apiFetch< OnboardingTaskList >( { path: ONBOARDING_PATH } );
}

/**
 * Mark an onboarding task complete by hand. Completion is final.
 *
 * @param taskId - Task to complete.
 * @return The updated onboarding task list.
 */
export function completeOnboardingTask( taskId: OnboardingTaskId ): Promise< OnboardingTaskList > {
	return apiFetch< OnboardingTaskList >( {
		path: `${ ONBOARDING_PATH }/tasks/${ taskId }/complete`,
		method: 'POST',
	} );
}
