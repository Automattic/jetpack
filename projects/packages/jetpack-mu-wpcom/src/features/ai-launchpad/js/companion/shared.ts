/**
 * Shared model + DOM builders for the AI Launchpad companion prototypes (DSGCOM-760).
 *
 * Both bundles (admin chrome and editor) read the same `window.aiLaunchpadCompanion`
 * initial state, printed by AI_Launchpad_Companion::add_initial_state(). After a publish,
 * the editor bundle refetches the tailored list, updates that global in place, and fires
 * the update/published events the admin bundle re-renders from.
 */
import apiFetch from '@wordpress/api-fetch';
import { __, sprintf } from '@wordpress/i18n';

export interface CompanionTask {
	id: string;
	title: string;
	completed: boolean;
	inProgress: boolean;
	disabled: boolean;
}

export interface CompanionNextTask {
	id: string;
	title: string;
	subtitle: string;
	ctaLabel: string;
	ctaUrl: string;
}

export interface CompanionData {
	variant: number;
	active: boolean;
	heading: string;
	tasks: CompanionTask[];
	done: number;
	total: number;
	next: CompanionNextTask | null;
	urls: {
		launchpad: string;
		reset: string;
		// A printf-style template: '…&ai-launchpad-variant=%d'.
		variant: string;
	};
	showSwitcher: boolean;
}

declare global {
	interface Window {
		aiLaunchpadCompanion?: CompanionData;
	}
}

/** Fired on document after the shared data global has been refreshed. */
export const EVENT_UPDATE = 'ai-lpc:update';
/** Fired on document when a refresh found newly completed tasks (detail: { completedIds }). */
export const EVENT_PUBLISHED = 'ai-lpc:published';

/**
 * The shared initial state, or null outside a demo site.
 *
 * @return The companion data global.
 */
export function getData(): CompanionData | null {
	return window.aiLaunchpadCompanion ?? null;
}

/**
 * Escape text for interpolation into an HTML template string.
 *
 * @param text - The plain text.
 * @return The escaped text.
 */
export function esc( text: string ): string {
	return text
		.replace( /&/g, '&amp;' )
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' )
		.replace( /"/g, '&quot;' );
}

// The same @wordpress/icons glyphs the tailored list renders: `published` for a done
// task, `border` for a to-do task (also the Site Setup menu icon).
export const ICON_CHECK =
	'<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm-1.4 12.9-3.1-3.2 1-1 2.1 2.1 4.9-4.9 1 1-5.9 6z"></path></svg>';
export const ICON_CIRCLE =
	'<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="m6.6 15.6-1.2.8c.6.9 1.3 1.6 2.2 2.2l.8-1.2c-.7-.5-1.3-1.1-1.8-1.8zM5.5 12c0-.4 0-.9.1-1.3l-1.5-.3c0 .5-.1 1.1-.1 1.6s.1 1.1.2 1.6l1.5-.3c-.2-.4-.2-.9-.2-1.3zm11.9-3.6 1.2-.8c-.6-.9-1.3-1.6-2.2-2.2l-.8 1.2c.7.5 1.3 1.1 1.8 1.8zM5.3 7.6l1.2.8c.5-.7 1.1-1.3 1.8-1.8l-.7-1.3c-.9.6-1.7 1.4-2.3 2.3zm14.5 2.8-1.5.3c.1.4.1.8.1 1.3s0 .9-.1 1.3l1.5.3c.1-.5.2-1 .2-1.6s-.1-1.1-.2-1.6zM12 18.5c-.4 0-.9 0-1.3-.1l-.3 1.5c.5.1 1 .2 1.6.2s1.1-.1 1.6-.2l-.3-1.5c-.4.1-.9.1-1.3.1zm3.6-1.1.8 1.2c.9-.6 1.6-1.3 2.2-2.2l-1.2-.8c-.5.7-1.1 1.3-1.8 1.8zM10.4 4.2l.3 1.5c.4-.1.8-.1 1.3-.1s.9 0 1.3.1l.3-1.5c-.5-.1-1.1-.2-1.6-.2s-1.1.1-1.6.2z"></path></svg>';
export const ICON_CHEVRON_RIGHT =
	'<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M10.6 6 9.4 7l4.6 5-4.6 5 1.2 1 5.4-6z"></path></svg>';
export const ICON_CHEVRON_DOWN =
	'<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M17.5 11.6 12 16l-5.5-4.4.9-1.2L12 14l4.5-3.6 1 1.2z"></path></svg>';
export const ICON_CHEVRON_UP =
	'<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M6.5 12.4 12 8l5.5 4.4-.9 1.2L12 10l-4.5 3.6-1-1.2z"></path></svg>';

/**
 * The completion fraction as a CSS percentage string.
 *
 * @param data - The companion data.
 * @return E.g. '33%'.
 */
export function progressPct( data: CompanionData ): string {
	return data.total > 0 ? Math.round( ( data.done / data.total ) * 100 ) + '%' : '0%';
}

/**
 * "n of m completed", matching the tailored list's own progress line.
 *
 * @param data - The companion data.
 * @return The count line.
 */
export function countLine( data: CompanionData ): string {
	return sprintf(
		/* translators: 1: number of completed tasks, 2: total number of tasks. */
		__( '%1$d of %2$d completed', 'jetpack-mu-wpcom' ),
		data.done,
		data.total
	);
}

/**
 * The mini task list rows (read-only summary of the tailored list).
 *
 * @param data - The companion data.
 * @return The rows' HTML.
 */
export function miniTasksHtml( data: CompanionData ): string {
	const nextId = data.next?.id ?? null;

	return data.tasks
		.map( task => {
			const classes = [ 'ai-lpc-mini-task' ];
			if ( task.completed ) {
				classes.push( 'is-done' );
			} else if ( task.id === nextId ) {
				classes.push( 'is-next' );
			}
			const arrow =
				task.id === nextId
					? '<span class="ai-lpc-mini-spacer"></span><span class="ai-lpc-mini-go">' +
					  ICON_CHEVRON_RIGHT +
					  '</span>'
					: '';

			return (
				'<span class="' +
				classes.join( ' ' ) +
				'">' +
				'<span class="ai-lpc-mini-icon">' +
				( task.completed ? ICON_CHECK : ICON_CIRCLE ) +
				'</span>' +
				'<span class="ai-lpc-mini-label">' +
				esc( task.title ) +
				'</span>' +
				arrow +
				'</span>'
			);
		} )
		.join( '' );
}

/**
 * An SVG progress ring with the "n/m" count in the middle (variant 1).
 *
 * @param data - The companion data.
 * @param size - The ring diameter in px.
 * @return The ring HTML.
 */
export function ringHtml( data: CompanionData, size: number ): string {
	const stroke = size >= 40 ? 4 : 3;
	const radius = ( size - stroke * 2 ) / 2 - 1;
	const circumference = 2 * Math.PI * radius;
	const fraction = data.total > 0 ? data.done / data.total : 0;
	const offset = circumference * ( 1 - fraction );
	const center = size / 2;

	return (
		`<span class="ai-lpc-ring" style="width:${ size }px;height:${ size }px">` +
		`<svg viewBox="0 0 ${ size } ${ size }" aria-hidden="true">` +
		`<circle class="ai-lpc-ring-track" cx="${ center }" cy="${ center }" r="${ radius }" fill="none" stroke-width="${ stroke }"></circle>` +
		`<circle class="ai-lpc-ring-fill" cx="${ center }" cy="${ center }" r="${ radius }" fill="none" stroke-width="${ stroke }" stroke-linecap="round" stroke-dasharray="${ circumference }" stroke-dashoffset="${ offset }"></circle>` +
		'</svg>' +
		`<span class="ai-lpc-ring-count">${ data.done }/${ data.total }</span>` +
		'</span>'
	);
}

/** The slice of the tailored-list REST read the refresh consumes. */
interface LaunchpadResponse {
	tasks: Array< {
		id: string;
		title: string;
		subtitle: string;
		completed: boolean;
		in_progress: boolean;
		disabled: boolean;
		calypso_path: string | null;
	} >;
}

/**
 * The refresh-path CTA label, a light mirror of the PHP map (which itself mirrors
 * getCtaLabel() in task-card.tsx).
 *
 * @param taskId     - The catalog task id.
 * @param inProgress - Whether the task has a saved-but-unpublished draft.
 * @return The label.
 */
function ctaLabel( taskId: string, inProgress: boolean ): string {
	if ( inProgress ) {
		return __( 'Continue', 'jetpack-mu-wpcom' );
	}
	switch ( taskId ) {
		case 'first_post_published':
		case 'first_post_published_newsletter':
			return __( 'Write post', 'jetpack-mu-wpcom' );
		case 'site_theme_selected':
			return __( 'Browse themes', 'jetpack-mu-wpcom' );
		case 'connect_social_media':
			return __( 'Connect socials', 'jetpack-mu-wpcom' );
		case 'add_about_page':
		case 'add_gallery_page':
		case 'add_new_page':
			return __( 'Add page', 'jetpack-mu-wpcom' );
		case 'site_launched':
		case 'blog_launched':
		case 'link_in_bio_launched':
		case 'videopress_launched':
			return __( 'Launch site', 'jetpack-mu-wpcom' );
		default:
			return __( 'Get started', 'jetpack-mu-wpcom' );
	}
}

/**
 * Make a catalog CTA path navigable from wp-admin (mirror of toNavigableUrl in model.ts).
 *
 * @param path - The catalog calypso_path.
 * @return The navigable URL, or '' when there is none.
 */
function toNavigableUrl( path: string | null ): string {
	if ( ! path ) {
		return '';
	}
	if ( /^\/wp-admin(\/|\?|#|$)/.test( path ) ) {
		return path;
	}
	if ( path.startsWith( '/' ) ) {
		return 'https://wordpress.com' + path;
	}
	return path;
}

/**
 * Refetch the tailored list, update the shared global in place, and fire EVENT_UPDATE.
 * When tasks flipped to completed since the last state, also fire EVENT_PUBLISHED with
 * their ids so variants can celebrate (toast, pulse, snackbar).
 *
 * @return The refreshed data, or null when the read failed or there is no state.
 */
export async function refreshData(): Promise< CompanionData | null > {
	const data = getData();
	if ( ! data ) {
		return null;
	}

	let response: LaunchpadResponse;
	try {
		response = await apiFetch< LaunchpadResponse >( { path: '/wpcom/v2/ai-launchpad' } );
	} catch {
		return null;
	}

	const previouslyDone = new Set(
		data.tasks.filter( task => task.completed ).map( task => task.id )
	);

	data.tasks = response.tasks.map( task => ( {
		id: task.id,
		title: task.title,
		completed: !! task.completed,
		inProgress: !! task.in_progress,
		disabled: !! task.disabled,
	} ) );
	data.done = data.tasks.filter( task => task.completed ).length;
	data.total = data.tasks.length;

	const nextTask = response.tasks.find( task => ! task.completed && ! task.disabled ) ?? null;
	data.next = nextTask
		? {
				id: nextTask.id,
				title: nextTask.title,
				subtitle: nextTask.subtitle,
				ctaLabel: ctaLabel( nextTask.id, !! nextTask.in_progress ),
				ctaUrl: toNavigableUrl( nextTask.calypso_path ),
		  }
		: null;

	document.dispatchEvent( new CustomEvent( EVENT_UPDATE ) );

	const completedIds = data.tasks
		.filter( task => task.completed && ! previouslyDone.has( task.id ) )
		.map( task => task.id );
	if ( completedIds.length > 0 ) {
		document.dispatchEvent( new CustomEvent( EVENT_PUBLISHED, { detail: { completedIds } } ) );
	}

	return data;
}
