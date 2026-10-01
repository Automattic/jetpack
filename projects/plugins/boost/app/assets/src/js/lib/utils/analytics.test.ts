import { getPageViewEventName, recordBoostEvent } from './analytics';

describe( 'getPageViewEventName', () => {
	it( 'names the settings root, which has no path of its own', () => {
		expect( getPageViewEventName( '/' ) ).toBe( 'page_view_settings' );
	} );

	it.each( [
		[ '/cache-debug-log', 'page_view_cache_debug_log' ],
		[ '/critical-css-advanced', 'page_view_critical_css_advanced' ],
		[ '/getting-started', 'page_view_getting_started' ],
		[ '/purchase-successful', 'page_view_purchase_successful' ],
	] )( 'names %s', ( pathname, expected ) => {
		expect( getPageViewEventName( pathname ) ).toBe( expected );
	} );
} );

const mockRecordAjaxEvent = jest.fn();
jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: jest.fn() } },
} ) );

import { LEGACY_ROOT_ID, MODERN_ROOT_ID } from '$lib/modern/mode';

const settingsEvents = [
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
	'settings_view',
	'settings_group_view',
	'settings_group_toggle',
	'page_view_settings',
	'page_view_overview',
	'page_view_cache_debug_log',
	'page_view_critical_css_advanced',
];

describe( 'Settings event context', () => {
	beforeEach( () => {
		mockRecordAjaxEvent.mockReset().mockImplementation( () => ( {
			done: ( resolve: () => void ) => {
				resolve();
				return { fail: jest.fn() };
			},
		} ) );
		Object.assign( globalThis, {
			Jetpack_Boost: { version: '4.8.1' },
			jpTracksAJAX: { record_ajax_event: mockRecordAjaxEvent },
		} );
	} );

	afterEach( () => {
		document.body.replaceChildren();
	} );

	it.each( [
		[ LEGACY_ROOT_ID, 'legacy' ],
		[ MODERN_ROOT_ID, 'modern' ],
	] )( 'uses the rendered %s for every Settings action and page view', async ( root, mode ) => {
		const element = document.createElement( 'div' );
		element.id = root;
		document.body.append( element );
		for ( const event of settingsEvents ) {
			await recordBoostEvent( event, { count: 2 } );
			expect( mockRecordAjaxEvent ).toHaveBeenLastCalledWith( `boost_${ event }`, 'click', {
				count: 2,
				boost_version: '4.8.1',
				dashboard_variant: mode,
			} );
		}
	} );

	it.each( [
		[ LEGACY_ROOT_ID, 'legacy', 'all_options', 'section' ],
		[ MODERN_ROOT_ID, 'modern', 'exceptions', 'editor' ],
	] )(
		'annotates the two panel meanings in %s',
		async ( root, mode, cacheScope, cornerstoneScope ) => {
			const element = document.createElement( 'div' );
			element.id = root;
			document.body.append( element );
			for ( const [ event, scope ] of [
				[ 'page_cache_exceptions_panel_toggle', cacheScope ],
				[ 'cornerstone_pages_panel_toggle', cornerstoneScope ],
			] ) {
				await recordBoostEvent( event, { status: 'open' } );
				expect( mockRecordAjaxEvent ).toHaveBeenLastCalledWith( `boost_${ event }`, 'click', {
					status: 'open',
					panel_scope: scope,
					boost_version: '4.8.1',
					dashboard_variant: mode,
				} );
			}
			expect( mockRecordAjaxEvent ).toHaveBeenCalledTimes( 2 );
		}
	);

	it( 'does not invent UI context without a dashboard root or for server status events', async () => {
		await recordBoostEvent( 'settings_view', {} );
		expect( mockRecordAjaxEvent ).toHaveBeenLastCalledWith( 'boost_settings_view', 'click', {
			boost_version: '4.8.1',
		} );
		const element = document.createElement( 'div' );
		element.id = MODERN_ROOT_ID;
		document.body.append( element );
		await recordBoostEvent( 'set_module_status', { module: 'page_cache' } );
		expect( mockRecordAjaxEvent ).toHaveBeenLastCalledWith( 'boost_set_module_status', 'click', {
			module: 'page_cache',
			boost_version: '4.8.1',
		} );
	} );
} );
