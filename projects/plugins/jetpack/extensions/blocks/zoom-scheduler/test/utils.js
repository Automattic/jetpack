import { getEmbedUrl, normalizeUrl } from '../utils';

describe( 'Zoom Scheduler utils', () => {
	test( 'normalizes bare scheduler URLs to https', () => {
		expect( normalizeUrl( 'scheduler.zoom.us/test-user/discovery-call' ) ).toBe(
			'https://scheduler.zoom.us/test-user/discovery-call'
		);
	} );

	test( 'normalizes protocol-relative URLs to https', () => {
		expect( normalizeUrl( '//scheduler.zoom.us/test-user/discovery-call' ) ).toBe(
			'https://scheduler.zoom.us/test-user/discovery-call'
		);
	} );

	test( 'upgrades http URLs to https', () => {
		expect( normalizeUrl( 'http://scheduler.zoom.us/test-user/discovery-call' ) ).toBe(
			'https://scheduler.zoom.us/test-user/discovery-call'
		);
	} );

	test( 'rejects the bare host with no booking path', () => {
		expect( normalizeUrl( 'https://scheduler.zoom.us/' ) ).toBeUndefined();
	} );

	test( 'rejects a root path even when a query string is present', () => {
		// Passes URL_REGEX (the query satisfies the trailing `.+`) so execution
		// reaches the url.pathname === '/' guard in normalizeUrl.
		expect( normalizeUrl( 'https://scheduler.zoom.us/?month=2026-07' ) ).toBeUndefined();
	} );

	test( 'returns undefined for empty input', () => {
		expect( normalizeUrl( '' ) ).toBeUndefined();
	} );

	test( 'preserves supported query parameters', () => {
		expect(
			normalizeUrl( 'https://scheduler.zoom.us/test-user/discovery-call?month=2026-07' )
		).toBe( 'https://scheduler.zoom.us/test-user/discovery-call?month=2026-07' );
	} );

	test( 'rejects iframe markup', () => {
		expect(
			normalizeUrl(
				'<iframe src="https://scheduler.zoom.us/test-user/discovery-call?embed=true"></iframe>'
			)
		).toBeUndefined();
	} );

	test( 'rejects non-Zoom Scheduler hosts', () => {
		expect( normalizeUrl( 'https://example.com/test-user/discovery-call' ) ).toBeUndefined();
	} );

	test( 'adds embed=true to preview and render URLs', () => {
		expect(
			getEmbedUrl( 'https://scheduler.zoom.us/test-user/discovery-call?month=2026-07' )
		).toBe( 'https://scheduler.zoom.us/test-user/discovery-call?month=2026-07&embed=true' );
	} );
} );
