import type { TailoredOutput } from './types.ts';

/**
 * The slice of `GET /wpcom/v2/ai-launchpad` the host orchestration reads to
 * decide which view to show on load. Only the fields the decision depends on
 * are typed here; the tailored list types the rest of the response itself.
 */
export interface OrchestrationData {
	ai_output: {
		payload: TailoredOutput;
	} | null;
}

/** Which top-level view the host renders. */
export type View = 'wizard' | 'list';

/**
 * Decide the initial view from the composite read. A site that has never run
 * the wizard has no persisted AI output (`ai_output` is null) and is treated as
 * a new user who should see the wizard; a site with AI output already has a
 * tailored list to show, so the wizard is skipped.
 *
 * @param data - The relevant slice of the `GET /ai-launchpad` response.
 * @return The view to render on load.
 */
export function decideInitialView( data: OrchestrationData ): View {
	return data.ai_output ? 'list' : 'wizard';
}

/**
 * Whether the page was opened in the all-tasks testing mode (`?all_tasks=1` on
 * the admin page URL). In this mode the app skips the wizard and renders the
 * full task catalog (see the `all_tasks` param on `GET /ai-launchpad`), so every
 * task can be exercised from a single site.
 *
 * @param search - The page's `location.search` string.
 * @return True when the all-tasks param is enabled.
 */
export function isAllTasksMode( search: string ): boolean {
	return new URLSearchParams( search ).get( 'all_tasks' ) === '1';
}
