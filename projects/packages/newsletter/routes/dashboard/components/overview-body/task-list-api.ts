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

const STORAGE_KEY_PREFIX = 'jetpack-newsletter-onboarding-completed-';

/**
 * localStorage key for this site's completed tasks, or null when the WP.com blog id is unknown.
 *
 * @return The storage key.
 */
function getStorageKey(): string | null {
	const blogId = getSiteData()?.wpcom?.blog_id;
	return blogId ? `${ STORAGE_KEY_PREFIX }${ blogId }` : null;
}

/**
 * Read the ids of the tasks this browser has already seen complete.
 *
 * Completion is final on WP.com, so this copy can only lag behind it, never contradict it: it is
 * safe to show these as complete before WP.com answers.
 *
 * @return Completed task ids.
 */
export function getStoredCompletedTasks(): OnboardingTaskId[] {
	const key = getStorageKey();
	if ( ! key ) {
		return [];
	}
	try {
		const stored: unknown = JSON.parse( window.localStorage.getItem( key ) ?? '[]' );
		return Array.isArray( stored )
			? ONBOARDING_TASK_IDS.filter( taskId => stored.includes( taskId ) )
			: [];
	} catch {
		return [];
	}
}

/**
 * Add a task list's completed tasks to the stored copy. Tasks are never removed from it.
 *
 * @param taskList - Task list from WP.com.
 */
function storeCompletedTasks( taskList: OnboardingTaskList ): void {
	const key = getStorageKey();
	if ( ! key ) {
		return;
	}
	const completed = new Set( getStoredCompletedTasks() );
	taskList.tasks.forEach( task => {
		if ( task.complete ) {
			completed.add( task.id );
		}
	} );
	try {
		window.localStorage.setItem(
			key,
			JSON.stringify( ONBOARDING_TASK_IDS.filter( taskId => completed.has( taskId ) ) )
		);
	} catch {
		// No-op: the checklist still works from WP.com, just without the fast path.
	}
}

/**
 * Fetch the onboarding task list and update the stored copy. WP.com decides each task's
 * completion; on Jetpack sites the request is proxied there.
 *
 * @return The onboarding task list.
 */
export async function fetchOnboardingTasks(): Promise< OnboardingTaskList > {
	const taskList = await apiFetch< OnboardingTaskList >( { path: ONBOARDING_PATH } );
	storeCompletedTasks( taskList );
	return taskList;
}

/**
 * Mark an onboarding task complete by hand and update the stored copy. Completion is final.
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
	storeCompletedTasks( taskList );
	return taskList;
}
