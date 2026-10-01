import analytics from '@automattic/jetpack-analytics';
import { detectMode } from '$lib/modern/mode';

export type TracksEventProperties = { [ key: string ]: string | number };

// Include Settings controls and their help/upgrade actions; exclude scores, history, and generation outcomes.
const settingsActions = new Set( [
	'cornerstone_pages_panel_toggle',
	'cornerstone_pages_save',
	'cornerstone_pages_load_default',
	'cornerstone_pages_prerender_toggle',
	'concatenate_js_panel_toggle',
	'concatenate_css_panel_toggle',
	'defer_js_excludes_panel_toggle',
	'concatenate_js_exceptions_save_clicked',
	'concatenate_css_exceptions_save_clicked',
	'minify_js_exceptions_load_default',
	'minify_css_exceptions_load_default',
	'defer_js_exceptions_save_clicked',
	'page_cache_exceptions_panel_toggle',
	'page_cache_clear_clicked',
	'page_cache_see_logs_clicked',
	'page_cache_toggle_logging',
	'page_cache_bypass_patterns',
	'page_cache_exceptions_save_clicked',
	'page_cache_see_example_clicked',
	'critical_css_regenerate_clicked',
	'critical_css_advanced_link_clicked',
	'critical_css_link_clicked',
	'image_cdn_panel_toggle',
	'image_cdn_liar_toggle',
	'lcp_optimize_clicked',
	'defer_js_link_clicked',
	'lcp_learn_more',
	'lcp_error_details_expanded',
	'switch_to_boost_cache',
	'prerender_warning_message_clicked',
	'cornerstone_pages_properties_failed',
	'clicked_cornerstone_pages_learn_more',
	'critical_css_learn_more_expanded',
	'critical_css_error_link_clicked',
	'critical_css_learn_more',
	'critical_css_retry',
	'critical_css_contact_support',
	'upsell_cta_from_settings_page_in_plugin',
	'module_toggle_clicked',
	'settings_view',
	'settings_group_view',
	'settings_group_toggle',
] );

/**
 * Derive a page-view event name from a route pathname.
 *
 * A bare `/` becomes `settings`, since that route has no path of its own.
 *
 * @param {string} pathname - Route pathname, e.g. `/cache-debug-log`.
 * @return {string} Event name, minus the `boost_` prefix.
 */
export function getPageViewEventName( pathname: string ): string {
	const path = pathname.replace( /[-/]/g, '_' );

	return `page_view${ path === '_' ? '_settings' : path }`;
}

/**
 * Send an event to Tracks.
 *
 * @param {string}                eventName Event name, minus the jetpack_boost_ prefix.
 * @param {TracksEventProperties} eventProp Object containing the event properties. Please note that keys must be in snake_case.
 */
export async function recordBoostEvent(
	eventName: string,
	eventProp: TracksEventProperties
): Promise< void > {
	eventProp = addBoostProps( eventName, eventProp );

	return new Promise( resolve => {
		if (
			typeof jpTracksAJAX !== 'undefined' &&
			typeof jpTracksAJAX.record_ajax_event === 'function'
		) {
			jpTracksAJAX
				.record_ajax_event( `boost_${ eventName }`, 'click', eventProp )
				.done( resolve )
				.fail( ( xhr: { responseText: string } ) => {
					// eslint-disable-next-line no-console
					console.log(
						`Recording event 'boost_${ eventName }' failed with error: ${ xhr.responseText }`
					);
					resolve();
				} );
		} else {
			// eslint-disable-next-line no-console
			console.log( 'Invalid jpTracksAJAX object.' );
			resolve();
		}
	} );
}

/**
 * Send an event via a Tracking Pixel.
 *
 * @param {string}                eventName Event name, minus the jetpack_boost_ prefix.
 * @param {TracksEventProperties} eventProp Object containing the event properties. Please note that keys must be in snake_case.
 */
export async function recordBoostPixelEvent( eventName: string, eventProp: TracksEventProperties ) {
	eventProp = addBoostProps( eventName, eventProp );

	analytics.tracks.recordEvent( `jetpack_boost_${ eventName }`, eventProp );
}

function addBoostProps( eventName: string, props: TracksEventProperties ): TracksEventProperties {
	const defaultProps: { [ key: string ]: string } = {};

	/**
	 * The config might not always be available, i.e. image-guide in the front-end.
	 *
	 * So we need to check if it exists before using it in case this function is called from the front end.
	 */
	if ( typeof Jetpack_Boost === 'object' ) {
		defaultProps.boost_version = Jetpack_Boost.version;
	}

	const mode = detectMode();
	const context: TracksEventProperties = {};
	// Tag every dashboard page view, including onboarding and purchase routes.
	if ( mode && ( settingsActions.has( eventName ) || eventName.startsWith( 'page_view_' ) ) ) {
		context.dashboard_variant = mode;
	}

	return { ...defaultProps, ...context, ...props };
}

export async function recordBoostEventAndRedirect(
	url: string,
	eventName: string,
	eventProp: TracksEventProperties = {}
) {
	await recordBoostEvent( eventName, eventProp );
	window.location.href = url;
}
