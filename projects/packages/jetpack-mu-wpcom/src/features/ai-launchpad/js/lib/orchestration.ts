import type { InferredInput, TailoredOutput } from './types.ts';

/**
 * The slice of `GET /wpcom/v2/ai-launchpad` the host reads to decide which view
 * to show on load.
 */
export interface OrchestrationData {
	ai_output: {
		payload: TailoredOutput;
	} | null;
	inferred_input?: InferredInput | null;
	auto_tailoring?: boolean;
}

/** Which top-level view the host renders. */
export type View = 'wizard' | 'list' | 'auto' | 'waiting';

/**
 * Decide the initial view: sites with AI output see the list. Without it, AI-built sites
 * skip the wizard: `auto` when this load should tailor, `waiting` when another already is.
 * Everything else sees the wizard.
 *
 * @param data - The relevant slice of the `GET /ai-launchpad` response.
 * @return The view to render on load.
 */
export function decideInitialView( data: OrchestrationData ): View {
	if ( data.ai_output ) {
		return 'list';
	}
	if ( data.inferred_input ) {
		return 'auto';
	}
	return data.auto_tailoring ? 'waiting' : 'wizard';
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
