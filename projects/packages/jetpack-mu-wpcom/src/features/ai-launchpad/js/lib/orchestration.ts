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

/** The `start` value that opens Site Setup on "Which AI do you use?", also sent as the `start` Tracks prop. */
export const AI_TOOL_START = 'ai-tool';

/**
 * Whether the wizard opens on "Which AI do you use?" (`?start=ai-tool`), only when the wizard would show anyway.
 *
 * @param search - The page's `location.search` string.
 * @param view   - The initial view.
 * @return True when the wizard opens on the AI tool view.
 */
export function startsOnAiTool( search: string, view: View ): boolean {
	return view === 'wizard' && asksForAiTool( search );
}

/**
 * Whether the URL carries `start=ai-tool`.
 *
 * @param search - The page's `location.search` string.
 * @return True when it does.
 */
export function asksForAiTool( search: string ): boolean {
	return new URLSearchParams( search ).get( 'start' ) === AI_TOOL_START;
}

/**
 * The `GET /wpcom/v2/ai-launchpad` path for this page, forwarding `all_tasks` and `start=ai-tool`.
 *
 * @param search - The page's `location.search` string.
 * @return The read path.
 */
export function readPath( search: string ): string {
	const query = new URLSearchParams();
	if ( isAllTasksMode( search ) ) {
		query.set( 'all_tasks', '1' );
	}
	if ( asksForAiTool( search ) ) {
		query.set( 'start', AI_TOOL_START );
	}
	const args = query.toString();
	return args ? `/wpcom/v2/ai-launchpad?${ args }` : '/wpcom/v2/ai-launchpad';
}
