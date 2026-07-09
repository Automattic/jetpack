import type { TailoredOutput } from './types.ts';

/**
 * The slice of `GET /wpcom/v2/ai-launchpad` the host reads to decide which view
 * to show on load.
 */
export interface OrchestrationData {
	ai_output: {
		payload: TailoredOutput;
	} | null;
}

/** Which top-level view the host renders. */
export type View = 'wizard' | 'list';

/**
 * Decide the initial view: sites with no persisted AI output see the wizard,
 * sites with output see the list.
 *
 * @param data - The relevant slice of the `GET /ai-launchpad` response.
 * @return The view to render on load.
 */
export function decideInitialView( data: OrchestrationData ): View {
	return data.ai_output ? 'list' : 'wizard';
}

/**
 * Whether the page was opened in all-tasks testing mode (`?all_tasks=1`), which
 * skips the wizard and renders the full task catalog.
 *
 * @param search - The page's `location.search` string.
 * @return True when the all-tasks param is enabled.
 */
export function isAllTasksMode( search: string ): boolean {
	return new URLSearchParams( search ).get( 'all_tasks' ) === '1';
}
