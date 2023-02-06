/* global I18nLoader, jpI18nLoader, wpI18n */

test( 'Options', async () => {
	global.optionLoader = new I18nLoader();
	optionLoader.doload = optionLoader.downloadI18n;
	delete optionLoader.downloadI18n;

	try {
		const main = require( './dist/main.js' );
		optionLoader.expectI18n( 'jetpack_vendor/automattic/jetpack-foobar/dist/hasI18n.js', require( './en_piglatin.json' ) );
		expect( await main.hasI18n() ).toEqual( 'is-Thay is-way anslated-tray' );
	} finally {
		delete global.optionLoader;
	}
} );

test( 'Loader is @wordpress/i18n', async () => {
	delete global.window.wp.jpI18nLoader;
	wpI18n.downloadI18n = jpI18nLoader.downloadI18n.bind( jpI18nLoader );
	try {
		const main2 = require( './dist/main2.js' );
		jpI18nLoader.expectI18n( 'dist/hasI18n.js', require( './en_piglatin.json' ) );
		expect( await main2.hasI18n() ).toEqual( 'is-Thay is-way anslated-tray' );
	} finally {
		global.window.wp.jpI18nLoader = global.jpI18nLoader;
		delete wpI18n.downloadI18n;
	}
} );
