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

/** The site context the list needs (front-end URL for the launch CTA + preview). */
export interface SiteData {
	// Optional: the fields come from an un-validated REST response, so consumers
	// must tolerate them being absent (coalesce to null) rather than trust the type.
	url?: string;
	// The site name, used to label the preview card and pre-fill the wizard Name.
	title?: string;
	// The site tagline (blogdescription), used to pre-fill the wizard description.
	description?: string;
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
	site?: SiteData;
}

/** How a task's "Get started" CTA behaves when clicked. */
export type CtaKind = 'first_post' | 'pattern_page' | 'launch' | 'deeplink';

const FIRST_POST_TASK_IDS = [ 'first_post_published', 'first_post_published_newsletter' ];
const PATTERN_PAGE_TASK_IDS = [ 'add_about_page' ];
// Launch tasks that have no catalog deeplink: they send the user to the
// wordpress.com launch flow. woo_launch_site is excluded — it has its own
// wc-admin deeplink and is handled as a plain deeplink.
const LAUNCH_TASK_IDS = [
	'site_launched',
	'blog_launched',
	'link_in_bio_launched',
	'videopress_launched',
];

/**
 * Resolve how a task's "Get started" CTA behaves. First-creation tasks draft a
 * real post via Stream F's `createFirstPostDraft`; page-creating tasks build a
 * pattern page via `createPatternPage`; launch tasks open the wordpress.com
 * launch flow; everything else deeplinks to the catalog's `calypso_path`.
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
 * Build the wordpress.com launch-flow URL for a launch task. Launch tasks have
 * no catalog deeplink; the legacy launchpad widget routes them to
 * `/start/launch-site` keyed by the site slug (the host of the site's home URL).
 *
 * @param siteUrl - The site's front-end URL (from the composite read).
 * @return The launch-flow URL, or null if the site URL can't be parsed.
 */
export function launchSiteUrl( siteUrl: string ): string | null {
	let slug: string;
	try {
		slug = new URL( siteUrl ).host;
	} catch {
		// A malformed/relative home URL (e.g. a broken `home_url` filter) can't
		// produce a launch slug; return null so the CTA is hidden rather than
		// throwing on click.
		return null;
	}
	return `https://wordpress.com/start/launch-site?siteSlug=${ encodeURIComponent(
		slug
	) }&ref=wp-admin`;
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
 * Make a resolved CTA destination safe to navigate to from wp-admin.
 *
 * Catalog deeplinks arrive in three shapes: absolute URLs (`admin_url()`-based
 * wp-admin links, Stripe connect URLs, the synthesized launch URL), site-relative
 * wp-admin paths (e.g. the editor URL of a freshly created draft), and Calypso
 * router paths (e.g. `/me`, `/marketing/connections/{slug}`) that are relative
 * to wordpress.com. The launchpad runs in wp-admin, so a Calypso path navigated
 * via `window.location` would resolve against the *site* host and 404; only those
 * must be pinned to wordpress.com.
 *
 * This mirrors the legacy launchpad dashboard widget, which rebases relative task
 * links with `new URL( href, 'https://wordpress.com' )` (see
 * `wpcom-dashboard-widgets/wpcom-launchpad-widget`). The one difference: that
 * widget's task admin links are already absolute, whereas our created-content
 * CTAs return site-relative `/wp-admin/…` editor URLs, so those are excluded from
 * the rebase. Absolute URLs don't start with `/` and pass through unchanged.
 *
 * @param url - The resolved destination URL or path.
 * @return The navigable URL.
 */
export function toNavigableUrl( url: string ): string {
	// Site-relative wp-admin paths must resolve against the current site. Match the
	// root path too (`/wp-admin`, `/wp-admin?…`, `/wp-admin#…`), not just `/wp-admin/`.
	if ( /^\/wp-admin(\/|\?|#|$)/.test( url ) ) {
		return url;
	}
	// Calypso router paths are relative to wordpress.com; absolute URLs (Stripe,
	// admin_url(), the launch URL) don't start with `/` and fall through unchanged.
	if ( url.startsWith( '/' ) ) {
		return new URL( url, 'https://wordpress.com' ).href;
	}
	return url;
}

/**
 * Fire the Tracks event and resolve the destination URL for a "Get started"
 * click. First-creation tasks draft a post; page-creating tasks build a pattern
 * page; everything else uses the catalog deeplink. The resolved URL is run
 * through {@link toNavigableUrl} so Calypso paths point at wordpress.com rather
 * than the site host. Returns the URL to navigate to, or null when the task has
 * no actionable destination.
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
	if ( kind === 'first_post' && output ) {
		url = ( await handlers.createFirstPostDraft( output.first_post_draft ) ).edit_url;
	} else if ( kind === 'pattern_page' && output ) {
		url = ( await handlers.createPatternPage( output.inferred ) ).edit_url;
	} else if ( kind === 'launch' ) {
		url = siteUrl ? launchSiteUrl( siteUrl ) : null;
	} else {
		url = task.calypso_path;
	}

	return url === null ? null : toNavigableUrl( url );
}

/**
 * Whether a task's "Get started" CTA has a destination — i.e. whether
 * {@link resolveCtaUrl} would resolve to a non-null URL. Create-content tasks
 * (first post / pattern page) are actionable when the AI output is present;
 * every other task is actionable only when it has a deeplink path. Used to hide
 * the CTA for tasks that would otherwise be a silent no-op.
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
	const kind = ctaKind( task.id );
	if ( ( kind === 'first_post' || kind === 'pattern_page' ) && output ) {
		return true;
	}
	if ( kind === 'launch' ) {
		// Only actionable when a launch URL can actually be built — keeps this in
		// lockstep with resolveCtaUrl (no CTA shown for a missing/malformed URL).
		return !! siteUrl && launchSiteUrl( siteUrl ) !== null;
	}
	return task.calypso_path !== null;
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
