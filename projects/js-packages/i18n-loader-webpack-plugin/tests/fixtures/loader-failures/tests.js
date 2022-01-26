/* global jpI18nLoader, wpI18n */

describe( 'Tests', () => {
	let spy;

	beforeEach( () => {
		spy = jest.spyOn( global.console, 'error' ).mockImplementation( () => {} );
		wpI18n.resetLocaleData( {}, 'loader-failures' );
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
		jpI18nLoader.expectI18n( 'dist/hasI18n.js', require( './en_piglatin.json' ) );
		expect( await a.hasI18n() ).toEqual( 'is-Thay is-way anslated-tray' );
		expect( spy ).not.toHaveBeenCalled();
	} );

	test( 'Missing loader object', async () => {
		delete window.wp.jpI18nLoader;
		try {
			const a = getBundle();
			expect( await a.hasI18n() ).toEqual( 'This is translated' );
			expect( spy ).toHaveBeenCalledTimes( 1 );
			expect( spy ).toHaveBeenCalledWith( 'Failed to fetch i18n data: ', expect.any( Error ) );
			expect( spy.mock.calls[ 0 ][ 1 ].message ).toEqual( 'I18n loader is not available. Check that WordPress is exporting wp.jpI18nLoader.' );
		} finally {
			window.wp.jpI18nLoader = global.jpI18nLoader;
		}
	} );

	test( 'Missing loader method', async () => {
		window.wp.jpI18nLoader = {};
		try {
			const a = getBundle();
			expect( await a.hasI18n() ).toEqual( 'This is translated' );
			expect( spy ).toHaveBeenCalledTimes( 1 );
			expect( spy ).toHaveBeenCalledWith( 'Failed to fetch i18n data: ', expect.any( Error ) );
			expect( spy.mock.calls[ 0 ][ 1 ].message ).toEqual( 'I18n loader is not available. Check that WordPress is exporting wp.jpI18nLoader.' );
		} finally {
			window.wp.jpI18nLoader = global.jpI18nLoader;
		}
	} );

	test( 'Failed download', async () => {
		const a = getBundle();
		jpI18nLoader.expectError(
			'dist/hasI18n.js',
			new Error( 'The specified document was not found.' )
		);
		expect( await a.hasI18n() ).toEqual( 'This is translated' );
		expect( spy ).toHaveBeenCalledTimes( 1 );
		expect( spy ).toHaveBeenCalledWith( 'Failed to fetch i18n data: ', expect.any( Error ) );
		expect( spy.mock.calls[ 0 ][ 1 ].message ).toEqual( 'The specified document was not found.' );
	} );

} );
