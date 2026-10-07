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
 * Whether this browser has already seen every task complete. Completion is final on WP.com, so a
 * complete list never needs asking about again.
 *
 * @return Whether the whole checklist is stored as complete.
 */
export function isStoredListComplete(): boolean {
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
 * Remember the checklist once WP.com reports every task complete. Individual tasks are not stored,
 * so open checklists always show WP.com's current answer.
 *
 * @param taskList - Task list from WP.com.
 */
function storeIfListComplete( taskList: OnboardingTaskList ): void {
	const key = getStorageKey();
	if ( ! key || ! taskList.tasks.every( task => task.complete ) ) {
		return;
	}
	try {
		window.localStorage.setItem( key, '1' );
	} catch {
		// No-op: the checklist still works from WP.com, it is just asked again next time.
	}
}

/**
 * Fetch the onboarding task list, remembering it once complete. WP.com decides each task's
 * completion; on Jetpack sites the request is proxied there.
 *
 * @return The onboarding task list.
 */
export async function fetchOnboardingTasks(): Promise< OnboardingTaskList > {
	const taskList = await apiFetch< OnboardingTaskList >( { path: ONBOARDING_PATH } );
	storeIfListComplete( taskList );
	return taskList;
}

/**
 * Mark an onboarding task complete by hand, remembering the list once complete. Completion is final.
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
	storeIfListComplete( taskList );
	return taskList;
}
