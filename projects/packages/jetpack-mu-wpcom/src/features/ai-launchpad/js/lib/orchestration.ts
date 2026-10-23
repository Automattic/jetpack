import type { InferredInput, TailoredOutput, WizardInput } from './types.ts';

/**
 * The slice of `GET /wpcom/v2/ai-launchpad` the host reads to decide which view
 * to show on load.
 */
export interface OrchestrationData {
	ai_output: {
		payload: TailoredOutput;
	} | null;
	inferred_input?: InferredInput | null;
	site?: { language?: string };
	user_language?: string;
}

/** Which top-level view the host renders. */
export type View = 'wizard' | 'list' | 'auto';

/**
 * Decide the initial view: sites with AI output see the list, AI-built sites without it
 * tailor automatically (`auto`), and everything else sees the wizard.
 *
 * @param data - The relevant slice of the `GET /ai-launchpad` response.
 * @return The view to render on load.
 */
export function decideInitialView( data: OrchestrationData ): View {
	if ( data.ai_output ) {
		return 'list';
	}
	return data.inferred_input ? 'auto' : 'wizard';
}

/**
 * Build the tailoring input an AI-built site skips the wizard with.
 *
 * @param data - The relevant slice of the `GET /ai-launchpad` response.
 * @return The input, or null when the server inferred none.
 */
export function buildAutoInput( data: OrchestrationData ): WizardInput | null {
	if ( ! data.inferred_input ) {
		return null;
	}
	const locale = data.site?.language || 'en';
	return { ...data.inferred_input, locale, ui_locale: data.user_language || locale };
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
