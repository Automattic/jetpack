import type { PatternVariant } from '../lib/pattern-page.ts';
import type { TailoredInferred, TailoredOutput, FirstPostDraft } from '../lib/types.ts';

/**
 * A single enriched task: AI subtitle merged with the catalog's title,
 * completion state, and deeplink path.
 */
export interface EnrichedTask {
	id: string;
	subtitle: string;
	title: string;
	completed: boolean;
	// True when a task is mid-way through its prerequisite. For a site-editor task that
	// means a saved-but-unpublished draft (drafts icon + "Continue" CTA, `calypso_path`
	// reopens it); for the synthetic `install_woocommerce` task it means the plugin is
	// installed but not yet active (the CTA activates it).
	in_progress: boolean;
	// True for a task shown as a locked preview of the roadmap (e.g. a sell site's
	// commerce tasks before WooCommerce is active): it renders muted, expands to its
	// subtitle, but offers no CTA or Skip until its prerequisite is met.
	disabled: boolean;
	// True when the user skipped the task (persisted server-side). A skipped task
	// arrives with `completed` already coerced to true; the flag is here so the UI
	// can distinguish skipped from genuinely done if it ever wants to.
	skipped?: boolean;
	calypso_path: string | null;
}

/** The site context the list needs (front-end URL for the launch CTA + preview). */
export interface SiteData {
	// Fields come from an un-validated REST response, so consumers must tolerate
	// them being absent (coalesce to null) rather than trust the type.
	url?: string;
	// The site name, used to label the preview card and pre-fill the wizard Name.
	title?: string;
	// The site tagline, used to pre-fill the wizard description.
	description?: string;
	// The appearance-editor URL (Site Editor on block themes, Customizer on classic).
	edit_url?: string | null;
}

/** The slice of the `GET /ai-launchpad/` response the tailored list renders from. */
export interface LaunchpadData {
	tasks: EnrichedTask[];
	ai_output: {
		payload: TailoredOutput;
	} | null;
	site?: SiteData;
}

/** How a task's "Get started" CTA behaves when clicked. */
export type CtaKind = 'first_post' | 'pattern_page' | 'launch' | 'deeplink';

const FIRST_POST_TASK_IDS = [ 'first_post_published', 'first_post_published_newsletter' ];
const PATTERN_PAGE_TASK_IDS = [ 'add_about_page', 'add_gallery_page' ];
// Launch tasks with no catalog deeplink: they open the wordpress.com launch flow.
const LAUNCH_TASK_IDS = [
	'site_launched',
	'blog_launched',
	'link_in_bio_launched',
	'videopress_launched',
];

/**
 * Resolve how a task's "Get started" CTA behaves: first-creation tasks draft a
 * post, page-creating tasks build a pattern page, launch tasks open the launch
 * flow, everything else deeplinks to the catalog's `calypso_path`.
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
	if ( LAUNCH_TASK_IDS.includes( taskId ) ) {
		return 'launch';
	}
	return 'deeplink';
}

/**
 * Tasks marked complete client-side on CTA click, because their real completion
 * signal is unreachable from wp-admin. Mirrors the same list in
 * class-ai-launchpad-rest.php.
 */
const COMPLETE_ON_CLICK_TASK_IDS = [
	'complete_profile',
	'manage_subscribers',
	'manage_paid_newsletter_plan',
	'earn_money',
	'start_building_your_audience',
	'site_monitoring_page',
	'setup_ssh',
	'share_site',
];

/**
 * Whether a task should be marked complete client-side when its CTA is clicked,
 * because it has no reachable completion signal on Atomic.
 *
 * @param taskId - The catalog task ID.
 * @return True for complete-on-click tasks.
 */
export function isCompleteOnClickTask( taskId: string ): boolean {
	return COMPLETE_ON_CLICK_TASK_IDS.includes( taskId );
}

/**
 * Build the wordpress.com launch-flow URL for a launch task, keyed by the site
 * slug (the host of the site's home URL).
 *
 * @param siteUrl - The site's front-end URL (from the composite read).
 * @return The launch-flow URL, or null if the site URL can't be parsed.
 */
export function launchSiteUrl( siteUrl: string ): string | null {
	let slug: string;
	try {
		slug = new URL( siteUrl ).host;
	} catch {
		// A malformed/relative home URL can't produce a launch slug; return null
		// so the CTA is hidden rather than throwing on click.
		return null;
	}
	return `https://wordpress.com/start/launch-site?siteSlug=${ encodeURIComponent(
		slug
	) }&ref=wp-admin`;
}

/**
 * The CTA side effects injected into {@link resolveCtaUrl}, so the routing can
 * be unit-tested without pulling `@wordpress/*` into the test runner.
 */
export interface CtaHandlers {
	trackTaskClicked: ( props: { task_id: string } ) => void;
	createFirstPostDraft: (
		draft: FirstPostDraft
	) => Promise< { post_id: number; edit_url: string } >;
	createPatternPage: (
		inferred: TailoredInferred,
		variant?: PatternVariant
	) => Promise< { page_id: number; edit_url: string } >;
}

/**
 * Make a resolved CTA destination safe to navigate to from wp-admin. Calypso
 * router paths are pinned to wordpress.com so they don't resolve against the site
 * host and 404; site-relative wp-admin paths and absolute URLs pass through.
 *
 * @param url - The resolved destination URL or path.
 * @return The navigable URL.
 */
export function toNavigableUrl( url: string ): string {
	// Site-relative wp-admin paths must resolve against the current site.
	if ( /^\/wp-admin(\/|\?|#|$)/.test( url ) ) {
		return url;
	}
	// Calypso router paths are relative to wordpress.com; absolute URLs don't
	// start with `/` and fall through unchanged.
	if ( url.startsWith( '/' ) ) {
		return new URL( url, 'https://wordpress.com' ).href;
	}
	return url;
}

/**
 * Fire the Tracks event and resolve the destination URL for a "Get started"
 * click, run through {@link toNavigableUrl}. Returns null when the task has no
 * actionable destination.
 *
 * @param task     - The clicked task.
 * @param output   - The AI output (post draft + inferred details), or null.
 * @param handlers - The CTA side effects.
 * @param siteUrl  - The site's front-end URL, used to build the launch CTA.
 * @return The destination URL, or null.
 */
export async function resolveCtaUrl(
	task: EnrichedTask,
	output: TailoredOutput | null,
	handlers: CtaHandlers,
	siteUrl: string | null = null
): Promise< string | null > {
	handlers.trackTaskClicked( { task_id: task.id } );

	const kind = ctaKind( task.id );
	let url: string | null;
	if ( task.in_progress && task.calypso_path ) {
		// The task already has an unpublished draft; reopen it rather than creating a duplicate.
		url = task.calypso_path;
	} else if ( kind === 'first_post' && output ) {
		url = ( await handlers.createFirstPostDraft( output.first_post_draft ) ).edit_url;
	} else if ( kind === 'pattern_page' && output ) {
		const variant: PatternVariant = task.id === 'add_gallery_page' ? 'gallery' : 'about';
		url = ( await handlers.createPatternPage( output.inferred, variant ) ).edit_url;
	} else if ( kind === 'launch' ) {
		url = siteUrl ? launchSiteUrl( siteUrl ) : null;
	} else {
		url = task.calypso_path;
	}

	return url === null ? null : toNavigableUrl( url );
}

/**
 * Whether a task's "Get started" CTA has a destination. Create-content tasks are
 * actionable when the AI output is present; every other task only when it has a
 * deeplink path. Used to hide the CTA for tasks that would be a silent no-op.
 *
 * @param task    - The task.
 * @param output  - The AI output, or null.
 * @param siteUrl - The site's front-end URL, used to build the launch CTA.
 * @return True when "Get started" would navigate somewhere.
 */
export function isTaskActionable(
	task: EnrichedTask,
	output: TailoredOutput | null,
	siteUrl: string | null = null
): boolean {
	// A disabled preview task has no reachable action until its prerequisite is met.
	if ( task.disabled ) {
		return false;
	}
	// An in-progress task reopens its existing draft via calypso_path, so it stays actionable.
	if ( task.in_progress && task.calypso_path ) {
		return true;
	}
	const kind = ctaKind( task.id );
	if ( ( kind === 'first_post' || kind === 'pattern_page' ) && output ) {
		return true;
	}
	if ( kind === 'launch' ) {
		// Only actionable when a launch URL can be built, in lockstep with resolveCtaUrl.
		return !! siteUrl && launchSiteUrl( siteUrl ) !== null;
	}
	return task.calypso_path !== null;
}

/**
 * The id of the next actionable task to auto-expand. With no `afterId`, the first
 * such task; with `afterId`, the first one after it, falling back to any remaining
 * one. Disabled preview tasks are never targets (they can't be acted on yet, though
 * they stay manually expandable). Returns null when nothing is left to act on.
 *
 * @param tasks   - The enriched tasks (skipped tasks already coerced to completed).
 * @param afterId - The id to advance past, or undefined to take the first.
 * @return The next actionable task id, or null.
 */
export function nextIncompleteId( tasks: EnrichedTask[], afterId?: string ): string | null {
	const incomplete = tasks.filter( task => ! task.completed && ! task.disabled );
	if ( incomplete.length === 0 ) {
		return null;
	}
	if ( afterId === undefined ) {
		return incomplete[ 0 ].id;
	}
	const fromIndex = tasks.findIndex( task => task.id === afterId );
	const next = incomplete.find( task => tasks.indexOf( task ) > fromIndex );
	return ( next ?? incomplete[ 0 ] ).id;
}

/**
 * Derive the enriched task list from a dev fixture. Titles fall back to a
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
		in_progress: false,
		disabled: false,
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
