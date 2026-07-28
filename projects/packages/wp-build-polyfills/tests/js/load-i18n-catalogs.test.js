/**
 * Tests for the shared `loadI18nCatalogs` init-module helper. The `.ts` source
 * is imported directly via Node's type stripping (the file is fully erasable
 * TypeScript; CI pins Node ≥ 23.6 where this is enabled by default).
 */

const assert = require( 'node:assert/strict' );
const { describe, it, beforeEach, afterEach } = require( 'node:test' );

const HELPER = '../../src/js/load-i18n-catalogs.ts';

const MODULE_URL =
	'https://example.org/wp-content/plugins/x/jetpack_vendor/automattic/jetpack-test/build/modules/init/index.min.js?ver=abc123';

const MANIFEST_URL =
	'https://example.org/wp-content/plugins/x/jetpack_vendor/automattic/jetpack-test/build/i18n-manifest.json?ver=abc123';

/* eslint-disable no-console -- capture the helper's console.warn diagnostics */
const realWarn = console.warn;
let warnings;

beforeEach( () => {
	warnings = [];
	console.warn = message => warnings.push( String( message ) );
} );

afterEach( () => {
	console.warn = realWarn;
	/* eslint-enable no-console */
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
 * Install a fake `fetch` serving the i18n manifest, recording requests.
 *
 * @param {object|Error} manifest - Manifest body to serve, or an Error to reject with.
 * @return {Array} The recorded requests, as `{ url, options }` objects.
 */
function installFetch( manifest ) {
	const requests = [];
	globalThis.fetch = ( url, options ) => {
		requests.push( { url: String( url ), options } );
		if ( manifest instanceof Error ) {
			return Promise.reject( manifest );
		}
		return Promise.resolve( { ok: true, json: () => Promise.resolve( manifest ) } );
	};
	return requests;
}

describe( 'loadI18nCatalogs', () => {
	it( 'fetches the manifest two levels up from the module URL, revalidating the cache', async () => {
		installLoader( () => Promise.resolve() );
		const requests = installFetch( { bundles: [] } );
		const { loadI18nCatalogs } = await import( HELPER );

		await loadI18nCatalogs( 'jetpack-test', MODULE_URL );

		assert.deepEqual( requests, [ { url: MANIFEST_URL, options: { cache: 'no-cache' } } ] );
	} );

	it( 'downloads one catalog per manifest bundle, into the given domain, from the plugin location', async () => {
		const calls = installLoader( () => Promise.resolve() );
		installFetch( {
			bundles: [ 'build/routes/a/content.js', 'build/scripts/components/index.js' ],
		} );
		const { loadI18nCatalogs } = await import( HELPER );

		await loadI18nCatalogs( 'jetpack-test', MODULE_URL );

		assert.deepEqual( calls, [
			[ 'build/routes/a/content.js', 'jetpack-test', 'plugin' ],
			[ 'build/scripts/components/index.js', 'jetpack-test', 'plugin' ],
		] );
	} );

	it( 'starts widget catalog downloads but does not block on them', async () => {
		const calls = installLoader( path =>
			// Widget catalog downloads never settle; route download resolves.
			path.includes( '/widgets/' ) ? new Promise( () => {} ) : Promise.resolve()
		);
		installFetch( {
			bundles: [ 'build/routes/a/content.js', 'build/widgets/latest-post/render.js' ],
		} );
		const { loadI18nCatalogs } = await import( HELPER );

		// Default (5s) timeout: only prompt resolution proves widgets aren't awaited.
		await loadI18nCatalogs( 'jetpack-test', MODULE_URL );

		assert.deepEqual(
			calls.map( ( [ path ] ) => path ),
			[ 'build/routes/a/content.js', 'build/widgets/latest-post/render.js' ],
			'the widget catalog download is still initiated'
		);
		assert.deepEqual( warnings, [], 'resolving via the widget split is not a timeout' );
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

	it( 'resolves and warns when the manifest request fails unexpectedly', async () => {
		const calls = installLoader( () => Promise.resolve() );
		installFetch( new Error( 'network down' ) );
		const { loadI18nCatalogs } = await import( HELPER );

		await assert.doesNotReject( loadI18nCatalogs( 'jetpack-test', MODULE_URL ) );
		assert.deepEqual( calls, [] );
		assert.equal( warnings.length, 1 );
		assert.match( warnings[ 0 ], /manifest.*network down/ );
	} );

	it( 'resolves silently when the manifest is missing (404 — expected for watch builds)', async () => {
		const calls = installLoader( () => Promise.resolve() );
		globalThis.fetch = () => Promise.resolve( { ok: false, status: 404, statusText: 'Not Found' } );
		const { loadI18nCatalogs } = await import( HELPER );

		await assert.doesNotReject( loadI18nCatalogs( 'jetpack-test', MODULE_URL ) );
		assert.deepEqual( calls, [] );
		assert.deepEqual( warnings, [], 'a missing manifest is the expected English fallback' );
	} );

	it( 'keeps a missing catalog silent but warns on unexpected catalog errors', async () => {
		const calls = installLoader( path =>
			path.includes( '/a/' )
				? Promise.reject( new Error( 'HTTP request failed: 404 Not Found' ) )
				: Promise.reject( new Error( 'wp.jpI18nLoader.state is not set' ) )
		);
		installFetch( { bundles: [ 'build/routes/a/content.js', 'build/routes/b/content.js' ] } );
		const { loadI18nCatalogs } = await import( HELPER );

		await assert.doesNotReject( loadI18nCatalogs( 'jetpack-test', MODULE_URL ) );
		assert.equal( calls.length, 2, 'the rejection does not short-circuit other downloads' );
		assert.equal( warnings.length, 1, 'only the unexpected error is surfaced' );
		assert.match( warnings[ 0 ], /build\/routes\/b\/content\.js.*state is not set/ );
	} );

	it( 'warns when the manifest request fails with a status other than 404', async () => {
		installLoader( () => Promise.resolve() );
		globalThis.fetch = () => Promise.resolve( { ok: false, status: 403, statusText: 'Forbidden' } );
		const { loadI18nCatalogs } = await import( HELPER );

		await assert.doesNotReject( loadI18nCatalogs( 'jetpack-test', MODULE_URL ) );
		assert.equal( warnings.length, 1, 'a 403 is not the expected missing-manifest case' );
		assert.match( warnings[ 0 ], /manifest.*403 Forbidden/ );
	} );

	it( 'warns when a catalog request fails with a status other than 404', async () => {
		installLoader( path =>
			Promise.reject(
				new Error(
					path.includes( '/a/' )
						? 'HTTP request failed: 404 Not Found'
						: 'HTTP request failed: 500 Internal Server Error'
				)
			)
		);
		installFetch( { bundles: [ 'build/routes/a/content.js', 'build/routes/b/content.js' ] } );
		const { loadI18nCatalogs } = await import( HELPER );

		await assert.doesNotReject( loadI18nCatalogs( 'jetpack-test', MODULE_URL ) );
		assert.equal( warnings.length, 1, 'only the 500 is surfaced' );
		assert.match( warnings[ 0 ], /build\/routes\/b\/content\.js.*500 Internal Server Error/ );
	} );

	it( 'skips the manifest fetch entirely for the en_US locale', async () => {
		const calls = installLoader( () => Promise.resolve(), { locale: 'en_US' } );
		const requests = installFetch( { bundles: [ 'build/a.js' ] } );
		const { loadI18nCatalogs } = await import( HELPER );

		await loadI18nCatalogs( 'jetpack-test', MODULE_URL );

		assert.deepEqual( requests, [], 'no manifest request for the default locale' );
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

	it( 'resolves after the bounded wait when a download stalls, and says so', async () => {
		installLoader( () => new Promise( () => {} ) ); // Never settles.
		installFetch( { bundles: [ 'build/routes/a/content.js' ] } );
		const { loadI18nCatalogs } = await import( HELPER );

		await assert.doesNotReject( loadI18nCatalogs( 'jetpack-test', MODULE_URL, 25 ) );
		assert.equal( warnings.length, 1 );
		assert.match( warnings[ 0 ], /still pending after 25ms/ );
	} );

	it( 'resolves after the bounded wait when the manifest fetch stalls', async () => {
		installLoader( () => Promise.resolve() );
		globalThis.fetch = () => new Promise( () => {} ); // Never settles.
		const { loadI18nCatalogs } = await import( HELPER );

		await assert.doesNotReject( loadI18nCatalogs( 'jetpack-test', MODULE_URL, 25 ) );
		assert.match( warnings[ 0 ], /still pending after 25ms/ );
	} );

	it( 'warns and bails when the loader script is not on the page', async () => {
		globalThis.window = {};
		const requests = installFetch( { bundles: [ 'build/a.js' ] } );
		const { loadI18nCatalogs } = await import( HELPER );

		await assert.doesNotReject( loadI18nCatalogs( 'jetpack-test', MODULE_URL ) );
		assert.deepEqual( requests, [], 'no manifest request without a loader' );
		assert.equal( warnings.length, 1 );
		assert.match( warnings[ 0 ], /jpI18nLoader unavailable/ );
	} );

	it( 'warns and bails when wp.jpI18nLoader lacks a callable downloadI18n', async () => {
		globalThis.window = { wp: { jpI18nLoader: { downloadI18n: 'not-a-function' } } };
		installFetch( { bundles: [ 'build/a.js' ] } );
		const { loadI18nCatalogs } = await import( HELPER );

		await assert.doesNotReject( loadI18nCatalogs( 'jetpack-test', MODULE_URL ) );
		assert.equal( warnings.length, 1 );
	} );
} );
