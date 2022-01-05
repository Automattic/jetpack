/* global wpI18n */

describe( 'Tests', () => {
	let spy;

	beforeEach( () => {
		spy = jest.spyOn( global.console, 'error' ).mockImplementation( () => {} );
		wpI18n.resetLocaleData( {}, 'fetch-failures' );
	} );
	afterEach( () => {
		spy.mockRestore();
	} );

	const getBundle = () => {
		let a;
		jest.isolateModules( () => {
			a = require( './dist/a.js' );
		} );
		return a;
	};

	test( 'Control', async () => {
		const a = getBundle();
		fetch.expectUrl(
			'http://test.example.com/wp-content/languages/plugins/fetch-failures-en_piglatin-c7c3968298452ee95564fb9c05e2de50.json',
			require( './en_piglatin.json' )
		);
		expect( await a.hasI18n() ).toEqual( 'is-Thay is-way anslated-tray' );
		expect( spy ).not.toHaveBeenCalled();
	} );

	test( 'No fetch', async () => {
		const a = getBundle();
		const fetch = global.fetch;
		try {
			delete global.fetch;
			expect( await a.hasI18n() ).toEqual( 'This is translated' );
		} finally {
			global.fetch = fetch;
		}
		expect( spy ).toHaveBeenCalledTimes( 1 );
		expect( spy ).toHaveBeenCalledWith( 'Failed to fetch i18n data:', expect.any( Error ) );
		expect( spy.mock.calls[ 0 ][ 1 ].message ).toEqual( 'Fetch API is not available.' );
	} );

	test( 'An HTTP 404 error', async () => {
		const a = getBundle();
		fetch.expectUrl(
			'http://test.example.com/wp-content/languages/plugins/fetch-failures-en_piglatin-c7c3968298452ee95564fb9c05e2de50.json',
			'The specified document was not found.',
			{ status: 404, statusText: 'Not found' }
		);
		expect( await a.hasI18n() ).toEqual( 'This is translated' );
		expect( spy ).toHaveBeenCalledTimes( 1 );
		expect( spy ).toHaveBeenCalledWith( 'Failed to fetch i18n data:', expect.any( Error ) );
		expect( spy.mock.calls[ 0 ][ 1 ].message ).toEqual( 'HTTP request failed: 404 Not found' );
	} );

	test( 'A fetch error', async () => {
		const a = getBundle();
		const err = new Error( 'Test error' );
		fetch.expectError(
			'http://test.example.com/wp-content/languages/plugins/fetch-failures-en_piglatin-c7c3968298452ee95564fb9c05e2de50.json',
			err
		);
		expect( await a.hasI18n() ).toEqual( 'This is translated' );
		expect( spy ).toHaveBeenCalledTimes( 1 );
		expect( spy ).toHaveBeenCalledWith( 'Failed to fetch i18n data:', err );
	} );

	test( 'Invalid JSON data', async () => {
		const a = getBundle();
		fetch.expectUrl(
			'http://test.example.com/wp-content/languages/plugins/fetch-failures-en_piglatin-c7c3968298452ee95564fb9c05e2de50.json',
			'Invalid JSON'
		);
		expect( await a.hasI18n() ).toEqual( 'This is translated' );
		expect( spy ).toHaveBeenCalledTimes( 1 );
		expect( spy ).toHaveBeenCalledWith( 'Failed to fetch i18n data:', expect.any( Error ) );
		expect( spy.mock.calls[ 0 ][ 1 ].message ).toEqual(
			'Unexpected token I in JSON at position 0'
		);
	} );
} );
