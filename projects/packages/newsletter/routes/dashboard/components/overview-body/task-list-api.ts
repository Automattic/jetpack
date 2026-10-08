import { getSiteData } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';

export const ONBOARDING_TASK_IDS = [
	'start',
	'subscribe_form',
	'subscribers',
	'send_newsletter',
] as const;

export type OnboardingTaskId = ( typeof ONBOARDING_TASK_IDS )[ number ];

export type OnboardingTaskList = {
	id: string;
	// Whether onboarding is done, so the Overview shows Stats.
	complete?: boolean;
	tasks: Array< { id: OnboardingTaskId; complete: boolean } >;
};

const ONBOARDING_PATH = '/wpcom/v2/newsletter/task-lists/onboarding';

export const ONBOARDING_TASKS_QUERY_KEY = [ 'newsletter', 'task-lists', 'onboarding' ] as const;

const STORAGE_KEY_PREFIX = 'jetpack-newsletter-onboarding-complete-';

/**
 * localStorage key for this site's checklist, or null when the WP.com blog id is unknown.
 *
 * @return The storage key.
 */
function getStorageKey(): string | null {
	const blogId = getSiteData()?.wpcom?.blog_id;
	return blogId ? `${ STORAGE_KEY_PREFIX }${ blogId }` : null;
}

/**
 * Whether WP.com marks onboarding as done, which switches the Overview tab to Stats.
 *
 * @param taskList - Task list from WP.com.
 * @return Whether onboarding is done.
 */
export function isOnboardingDone( taskList: OnboardingTaskList ): boolean {
	return taskList.complete === true;
}

/**
 * Whether this browser has already seen onboarding done. Completion is final on WP.com, so a done
 * onboarding never needs asking about again.
 *
 * @return Whether onboarding is stored as done.
 */
export function isStoredOnboardingDone(): boolean {
	const key = getStorageKey();
	if ( ! key ) {
		return false;
	}
	try {
		return window.localStorage.getItem( key ) === '1';
	} catch {
		return false;
	}
}

/**
 * Remember onboarding once WP.com reports it done. Individual tasks are not stored, so an open
 * checklist always shows WP.com's current answer.
 *
 * @param taskList - Task list from WP.com.
 */
function storeIfOnboardingDone( taskList: OnboardingTaskList ): void {
	const key = getStorageKey();
	if ( ! key || ! isOnboardingDone( taskList ) ) {
		return;
	}
	try {
		window.localStorage.setItem( key, '1' );
	} catch {
		// No-op: the Overview still works from WP.com, it is just asked again next time.
	}
}

/**
 * Fetch the onboarding task list, remembering when onboarding is done. WP.com decides each task's
 * completion; on Jetpack sites the request is proxied there.
 *
 * @return The onboarding task list.
 */
export async function fetchOnboardingTasks(): Promise< OnboardingTaskList > {
	const taskList = await apiFetch< OnboardingTaskList >( { path: ONBOARDING_PATH } );
	storeIfOnboardingDone( taskList );
	return taskList;
}

/**
 * Mark an onboarding task complete by hand, remembering when onboarding is done. Completion is final.
 *
 * @param taskId - Task to complete.
 * @return The updated onboarding task list.
 */
export async function completeOnboardingTask(
	taskId: OnboardingTaskId
): Promise< OnboardingTaskList > {
	const taskList = await apiFetch< OnboardingTaskList >( {
		path: `${ ONBOARDING_PATH }/tasks/${ taskId }/complete`,
		method: 'POST',
	} );
	storeIfOnboardingDone( taskList );
	return taskList;
}

// Steps complete outside the dashboard, so every visit asks WP.com again despite a cached list.
export const onboardingTasksQueryOptions = {
	queryKey: ONBOARDING_TASKS_QUERY_KEY,
	queryFn: fetchOnboardingTasks,
	refetchOnMount: 'always',
} as const;
