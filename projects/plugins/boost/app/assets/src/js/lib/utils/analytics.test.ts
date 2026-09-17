import { getPageViewEventName } from './analytics';

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
