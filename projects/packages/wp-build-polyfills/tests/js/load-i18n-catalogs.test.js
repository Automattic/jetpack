/**
 * Tests for the shared `loadI18nCatalogs` init-module helper. The `.ts` source
 * is imported directly via Node's type stripping (the file is fully erasable
 * TypeScript; CI pins Node ≥ 23.6 where this is enabled by default).
 */

const assert = require( 'node:assert/strict' );
const { describe, it, afterEach } = require( 'node:test' );

const HELPER = '../../src/js/load-i18n-catalogs.ts';

const MODULE_URL =
	'https://example.org/wp-content/plugins/x/jetpack_vendor/automattic/jetpack-test/build/modules/init/index.min.js?ver=abc123';

const MANIFEST_URL =
	'https://example.org/wp-content/plugins/x/jetpack_vendor/automattic/jetpack-test/build/i18n-manifest.json?ver=abc123';

afterEach( () => {
	delete globalThis.window;
	delete globalThis.fetch;
} );

/**
 * Install a fake `window.wp.jpI18nLoader` recording downloadI18n calls.
 *
 * @param {Function} downloadI18n - Implementation to install.
 * @param {object}   [state]      - Loader state to expose (e.g. `{ locale: 'de_DE' }`).
 * @return {Array} The recorded calls array (appended to on each invocation).
 */
function installLoader( downloadI18n, state = { locale: 'de_DE' } ) {
	const calls = [];
	globalThis.window = {
		wp: {
			jpI18nLoader: {
				state,
				downloadI18n: ( ...args ) => {
					calls.push( args );
					return downloadI18n( ...args );
				},
			},
		},
	};
	return calls;
}

/**
 * Install a fake `fetch` serving the i18n manifest, recording requested URLs.
 *
 * @param {object|Error} manifest - Manifest body to serve, or an Error to reject with.
 * @return {Array} The recorded request URLs (as strings).
 */
function installFetch( manifest ) {
	const urls = [];
	globalThis.fetch = url => {
		urls.push( String( url ) );
		if ( manifest instanceof Error ) {
			return Promise.reject( manifest );
		}
		return Promise.resolve( { ok: true, json: () => Promise.resolve( manifest ) } );
	};
	return urls;
}

describe( 'loadI18nCatalogs', () => {
	it( 'fetches the manifest two levels up from the module URL, carrying its query over', async () => {
		installLoader( () => Promise.resolve() );
		const urls = installFetch( { bundles: [] } );
		const { loadI18nCatalogs } = await import( HELPER );

		await loadI18nCatalogs( 'jetpack-test', MODULE_URL );

		assert.deepEqual( urls, [ MANIFEST_URL ] );
	} );

	it( 'downloads one catalog per manifest bundle, into the given domain, from the plugin location', async () => {
		const calls = installLoader( () => Promise.resolve() );
		installFetch( {
			bundles: [ 'build/routes/a/content.js', 'build/widgets/latest-post/render.js' ],
		} );
		const { loadI18nCatalogs } = await import( HELPER );

		await loadI18nCatalogs( 'jetpack-test', MODULE_URL );

		assert.deepEqual( calls, [
			[ 'build/routes/a/content.js', 'jetpack-test', 'plugin' ],
			[ 'build/widgets/latest-post/render.js', 'jetpack-test', 'plugin' ],
		] );
	} );

	it( 'ignores non-string manifest entries and a malformed manifest shape', async () => {
		const calls = installLoader( () => Promise.resolve() );
		installFetch( { bundles: [ 'build/a.js', 42, null, { path: 'build/b.js' } ] } );
		const { loadI18nCatalogs } = await import( HELPER );

		await loadI18nCatalogs( 'jetpack-test', MODULE_URL );
		assert.deepEqual( calls, [ [ 'build/a.js', 'jetpack-test', 'plugin' ] ] );

		calls.length = 0;
		installFetch( { something: 'else' } );
		await loadI18nCatalogs( 'jetpack-test', MODULE_URL );
		assert.deepEqual( calls, [], 'no downloads when the manifest has no bundles array' );
	} );

	it( 'resolves with no downloads when the manifest request fails (falls back to English)', async () => {
		const calls = installLoader( () => Promise.resolve() );
		installFetch( new Error( 'network down' ) );
		const { loadI18nCatalogs } = await import( HELPER );

		await assert.doesNotReject( loadI18nCatalogs( 'jetpack-test', MODULE_URL ) );
		assert.deepEqual( calls, [] );
	} );

	it( 'resolves with no downloads when the manifest request returns non-OK', async () => {
		const calls = installLoader( () => Promise.resolve() );
		globalThis.fetch = () => Promise.resolve( { ok: false, status: 404, statusText: 'Not Found' } );
		const { loadI18nCatalogs } = await import( HELPER );

		await assert.doesNotReject( loadI18nCatalogs( 'jetpack-test', MODULE_URL ) );
		assert.deepEqual( calls, [] );
	} );

	it( 'resolves even when a catalog download rejects (missing catalog falls back to English)', async () => {
		const calls = installLoader( path =>
			path.includes( '/a/' ) ? Promise.reject( new Error( '404' ) ) : Promise.resolve()
		);
		installFetch( { bundles: [ 'build/routes/a/content.js', 'build/routes/b/content.js' ] } );
		const { loadI18nCatalogs } = await import( HELPER );

		await assert.doesNotReject( loadI18nCatalogs( 'jetpack-test', MODULE_URL ) );
		assert.equal( calls.length, 2, 'the rejection does not short-circuit other downloads' );
	} );

	it( 'skips the manifest fetch entirely for the en_US locale', async () => {
		const calls = installLoader( () => Promise.resolve(), { locale: 'en_US' } );
		const urls = installFetch( { bundles: [ 'build/a.js' ] } );
		const { loadI18nCatalogs } = await import( HELPER );

		await loadI18nCatalogs( 'jetpack-test', MODULE_URL );

		assert.deepEqual( urls, [], 'no manifest request for the default locale' );
		assert.deepEqual( calls, [], 'no catalog downloads for the default locale' );
	} );

	it( 'still works when the loader exposes no state (older jetpack-assets)', async () => {
		const calls = [];
		globalThis.window = {
			wp: {
				jpI18nLoader: {
					downloadI18n: ( ...args ) => {
						calls.push( args );
						return Promise.resolve();
					},
				},
			},
		};
		installFetch( { bundles: [ 'build/a.js' ] } );
		const { loadI18nCatalogs } = await import( HELPER );

		await loadI18nCatalogs( 'jetpack-test', MODULE_URL );
		assert.equal( calls.length, 1 );
	} );

	it( 'resolves after the bounded wait when a download stalls, instead of wedging render', async () => {
		installLoader( () => new Promise( () => {} ) ); // Never settles.
		installFetch( { bundles: [ 'build/routes/a/content.js' ] } );
		const { loadI18nCatalogs } = await import( HELPER );

		await assert.doesNotReject( loadI18nCatalogs( 'jetpack-test', MODULE_URL, 25 ) );
	} );

	it( 'resolves after the bounded wait when the manifest fetch stalls', async () => {
		installLoader( () => Promise.resolve() );
		globalThis.fetch = () => new Promise( () => {} ); // Never settles.
		const { loadI18nCatalogs } = await import( HELPER );

		await assert.doesNotReject( loadI18nCatalogs( 'jetpack-test', MODULE_URL, 25 ) );
	} );

	it( 'is a no-op when the loader script is not on the page', async () => {
		globalThis.window = {};
		const urls = installFetch( { bundles: [ 'build/a.js' ] } );
		const { loadI18nCatalogs } = await import( HELPER );

		await assert.doesNotReject( loadI18nCatalogs( 'jetpack-test', MODULE_URL ) );
		assert.deepEqual( urls, [], 'no manifest request without a loader' );
	} );

	it( 'is a no-op when wp.jpI18nLoader lacks a callable downloadI18n', async () => {
		globalThis.window = { wp: { jpI18nLoader: { downloadI18n: 'not-a-function' } } };
		installFetch( { bundles: [ 'build/a.js' ] } );
		const { loadI18nCatalogs } = await import( HELPER );

		await assert.doesNotReject( loadI18nCatalogs( 'jetpack-test', MODULE_URL ) );
	} );
} );
