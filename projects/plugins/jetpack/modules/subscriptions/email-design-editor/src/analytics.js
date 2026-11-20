/**
 * Tracks instrumentation for the newsletter email design screen.
 *
 * Every door into the screen records a click and the screen itself recorded nothing, so we knew how
 * many creators opened it and nothing about what they did inside. See NL-1088.
 *
 * `@woocommerce/email-editor` already emits its own events and re-emits each one as a WordPress
 * action, so most of what happens in the editor chrome is forwarded rather than written here. What
 * the package cannot see -- the save outcome, the reset, the test send this screen re-routes -- is
 * recorded by the entry point through `recordDesignEvent()`.
 */

import analytics from '@automattic/jetpack-analytics';
import { getSiteType } from '@automattic/jetpack-script-data';
import { addAction, addFilter } from '@wordpress/hooks';

// Joins the events the screen's two entry points already record, which are
// `jetpack_newsletter_email_design_click` and `jetpack_newsletter_preview_modal_email_design_click`.
const EVENT_PREFIX = 'jetpack_newsletter_email_design_';

const HOOK_NAMESPACE = 'jetpack/email-design-analytics';

// The package prefixes every event name it emits, and spreads the event's own properties flat
// alongside that `name`.
const UPSTREAM_PREFIX = 'email_editor_events_';

// Four events that differ only in which panel opened, so they arrive as one event with a property
// rather than four series a dashboard has to add up.
const STYLES_SCREENS = [ 'colors', 'background', 'typography', 'layout' ];

/**
 * The package's events this screen keeps, and which of their properties travel.
 *
 * An allowlist in both directions, because neither the names nor the properties are safe to take
 * wholesale. The package emits around 32 events, several of which cannot happen here at all -- the
 * inserter and List View are hidden (NL-1086), and personalization tags and template selection are
 * never registered -- while `styles_sidebar_screen_colors_styles_updated` and its background
 * counterpart fire on every change the panel makes, undebounced, so a single drag of a colour
 * picker would record a burst. `sent_preview_email` carries the recipient's address.
 *
 * `pick` names properties to copy across as they are, so a camelCase one would need renaming here.
 */
const FORWARDED = {
	editor_layout_loaded: { event: 'editor_ready' },
	header_close_button_clicked: { event: 'close_click' },

	// Navigating to a panel, rather than the sidebar opening: `openStylesSidebarOnLoad()` asserts
	// the sidebar itself, so only this is the creator's own doing. The measurement NL-948 lacks.
	styles_sidebar_navigation_click: { event: 'styles_navigate', pick: [ 'path' ] },

	send_preview_email_modal_opened: { event: 'test_email_modal_open' },

	...Object.fromEntries(
		STYLES_SCREENS.map( screen => [
			`styles_sidebar_screen_${ screen }_opened`,
			{ event: 'styles_screen_open', props: { screen } },
		] )
	),
};

// Whether this page can send at all, which is the site's answer rather than ours: the screen only
// enqueues the Tracks sender when the terms of service have been agreed to.
let isRecording = false;

/**
 * Prepare to record, if this page may.
 *
 * @param {object|undefined} tracks          - The `tracks` half of `window.JetpackEmailDesignEditor`.
 * @param {boolean}          tracks.canSend  - Whether the screen enqueued the Tracks sender.
 * @param {object|null}      tracks.userData - The connected user's Tracks identity, where there is one.
 * @param {number|null}      tracks.blogId   - The WordPress.com blog id.
 * @return {boolean} Whether events recorded from here will be sent.
 */
export function initializeTracks( tracks ) {
	if ( ! tracks?.canSend ) {
		return false;
	}

	// A site may send with the terms agreed to and no connected user, which records anonymously.
	if ( tracks.userData?.userid && tracks.userData?.username ) {
		analytics.initialize( tracks.userData.userid, tracks.userData.username );
	}

	// After `initialize()`, which sets the super properties by replacing them. Without a blog id
	// nothing downstream can attribute the event to a site.
	if ( tracks.blogId ) {
		analytics.assignSuperProps( { blog_id: tracks.blogId } );
	}

	isRecording = true;

	return true;
}

/**
 * Record one of this screen's events.
 *
 * A no-op until `initializeTracks()` has said the page may send, so nothing queues up against a
 * sender that was deliberately not enqueued.
 *
 * @param {string} name  - The event name, without the shared prefix.
 * @param {object} props - Event properties.
 * @return {void}
 */
export function recordDesignEvent( name, props = {} ) {
	if ( ! isRecording ) {
		return;
	}

	analytics.tracks.recordEvent( EVENT_PREFIX + name, {
		site_type: getSiteType(),
		...props,
	} );
}

/**
 * Turn the package's own event system on, and forward what {@see FORWARDED} keeps.
 *
 * Must run before the editor mounts rather than merely before the first event: the package's three
 * collectors read the enabling filter once, in its `onInit()`, and return permanently when it is
 * false. Registering later leaves a live `recordEvent` with nothing listening to it.
 *
 * @return {void}
 */
export function forwardEditorEvents() {
	// Nothing to collect if nothing can be sent, and this would otherwise add the package's
	// document-wide click listener for no reason.
	if ( ! isRecording ) {
		return;
	}

	addFilter( 'woocommerce_email_editor_events_tracking_enabled', HOOK_NAMESPACE, () => true );

	addAction( 'woocommerce_email_editor_events', HOOK_NAMESPACE, event => {
		const name = typeof event?.name === 'string' ? event.name : '';

		if ( ! name.startsWith( UPSTREAM_PREFIX ) ) {
			return;
		}

		const forwarded = FORWARDED[ name.slice( UPSTREAM_PREFIX.length ) ];

		if ( ! forwarded ) {
			return;
		}

		const props = { ...forwarded.props };

		for ( const key of forwarded.pick ?? [] ) {
			if ( undefined !== event[ key ] ) {
				props[ key ] = event[ key ];
			}
		}

		recordDesignEvent( forwarded.event, props );
	} );
}

/**
 * The halves of a design a save submitted, as one property.
 *
 * Top-level keys only: they say what the creator changed -- colour, typography -- without carrying
 * the design itself. Paired with the save's `discarded` they also say which half a sanitising drop
 * took, which the route's answer does not. See NL-939.
 *
 * @param {object|undefined} value - One half of a submitted design.
 * @return {string} The keys, sorted and comma-separated.
 */
export function designKeys( value ) {
	return Object.keys( value ?? {} )
		.sort()
		.join( ',' );
}
