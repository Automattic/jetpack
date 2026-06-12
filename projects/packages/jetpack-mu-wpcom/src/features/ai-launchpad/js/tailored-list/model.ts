import type { TailoredInferred, TailoredOutput, FirstPostDraft } from '../lib/types.ts';

/**
 * The shape of a single enriched task in Stream B's `GET /ai-launchpad/`
 * response: AI subtitle merged with the catalog's title, completion state, and
 * deeplink path.
 */
export interface EnrichedTask {
	id: string;
	subtitle: string;
	title: string;
	completed: boolean;
	calypso_path: string | null;
}

/**
 * The relevant slice of Stream B's `GET /ai-launchpad/` response. Only the
 * fields the tailored list renders from are typed here.
 */
export interface LaunchpadData {
	tasks: EnrichedTask[];
	ai_output: {
		payload: TailoredOutput;
	} | null;
}

/** How a task's "Get started" CTA behaves when clicked. */
export type CtaKind = 'first_post' | 'pattern_page' | 'deeplink';

const FIRST_POST_TASK_IDS = [ 'first_post_published', 'first_post_published_newsletter' ];
const PATTERN_PAGE_TASK_IDS = [ 'add_about_page' ];

/**
 * Resolve how a task's "Get started" CTA behaves. First-creation tasks draft a
 * real post via Stream F's `createFirstPostDraft`; page-creating tasks build a
 * pattern page via `createPatternPage`; everything else deeplinks to the
 * catalog's `calypso_path`.
 *
 * @param taskId - The catalog task ID.
 * @return The CTA kind.
 */
export function ctaKind( taskId: string ): CtaKind {
	if ( FIRST_POST_TASK_IDS.includes( taskId ) ) {
		return 'first_post';
	}
	if ( PATTERN_PAGE_TASK_IDS.includes( taskId ) ) {
		return 'pattern_page';
	}
	return 'deeplink';
}

/**
 * The CTA side effects injected into {@link resolveCtaUrl}, so the routing can
 * be unit-tested without pulling `@wordpress/*` into the test runner. The
 * component wires these to the real Stream F / Stream G implementations.
 */
export interface CtaHandlers {
	trackTaskClicked: ( props: { task_id: string } ) => void;
	createFirstPostDraft: (
		draft: FirstPostDraft
	) => Promise< { post_id: number; edit_url: string } >;
	createPatternPage: (
		inferred: TailoredInferred
	) => Promise< { page_id: number; edit_url: string } >;
}

/**
 * Fire the Tracks event and resolve the destination URL for a "Get started"
 * click. First-creation tasks draft a post; page-creating tasks build a pattern
 * page; everything else uses the catalog deeplink. Returns the URL to navigate
 * to, or null when the task has no actionable destination.
 *
 * @param task     - The clicked task.
 * @param output   - The AI output (post draft + inferred details), or null.
 * @param handlers - The CTA side effects.
 * @return The destination URL, or null.
 */
export async function resolveCtaUrl(
	task: EnrichedTask,
	output: TailoredOutput | null,
	handlers: CtaHandlers
): Promise< string | null > {
	handlers.trackTaskClicked( { task_id: task.id } );

	const kind = ctaKind( task.id );
	if ( kind === 'first_post' && output ) {
		const { edit_url } = await handlers.createFirstPostDraft( output.first_post_draft );
		return edit_url;
	}
	if ( kind === 'pattern_page' && output ) {
		const { edit_url } = await handlers.createPatternPage( output.inferred );
		return edit_url;
	}
	return task.calypso_path;
}

/**
 * The index of the first incomplete task, or -1 when every task is complete.
 * Drives which card auto-expands on first render.
 *
 * @param tasks - The enriched tasks.
 * @return The index of the first incomplete task, or -1.
 */
export function firstIncompleteIndex( tasks: EnrichedTask[] ): number {
	return tasks.findIndex( task => ! task.completed );
}

/**
 * Derive the enriched task list from a dev fixture (the schema-shaped AI
 * output). Used only in dev mode, where there is no server to enrich the AI
 * output with catalog titles or completion state. Titles fall back to a
 * humanized task ID; everything renders as incomplete with no deeplink.
 *
 * @param output - The schema-valid AI output fixture.
 * @return The enriched tasks the component renders from.
 */
export function tasksFromFixture( output: TailoredOutput ): EnrichedTask[] {
	return output.tasks.map( task => ( {
		id: task.id,
		subtitle: task.subtitle,
		title: humanizeTaskId( task.id ),
		completed: false,
		calypso_path: null,
	} ) );
}

/**
 * Turn a snake_case catalog ID into a Title Case label, for dev-mode rendering
 * where the server-provided title is unavailable.
 *
 * @param id - The catalog task ID.
 * @return A humanized label.
 */
function humanizeTaskId( id: string ): string {
	return id
		.split( '_' )
		.map( word => word.charAt( 0 ).toUpperCase() + word.slice( 1 ) )
		.join( ' ' );
}
