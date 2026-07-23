/**
 * Tests for the shared `loadI18nCatalogs` init-module helper. The `.ts` source
 * is imported directly via Node's type stripping (the file is fully erasable
 * TypeScript; CI pins Node ≥ 23.6 where this is enabled by default).
 */

const assert = require( 'node:assert/strict' );
const { describe, it, afterEach } = require( 'node:test' );

const HELPER = '../../src/js/load-i18n-catalogs.ts';

afterEach( () => {
	delete globalThis.window;
} );

/**
 * Install a fake `window.wp.jpI18nLoader` recording downloadI18n calls.
 *
 * @param {Function} downloadI18n - Implementation to install.
 * @return {Array} The recorded calls array (appended to on each invocation).
 */
function installLoader( downloadI18n ) {
	const calls = [];
	globalThis.window = {
		wp: {
			jpI18nLoader: {
				downloadI18n: ( ...args ) => {
					calls.push( args );
					return downloadI18n( ...args );
				},
			},
		},
	};
	return calls;
}

describe( 'loadI18nCatalogs', () => {
	it( 'downloads one catalog per bundle, into the given domain, from the plugin location', async () => {
		const calls = installLoader( () => Promise.resolve() );
		const { loadI18nCatalogs } = await import( HELPER );

		await loadI18nCatalogs( 'jetpack-test', [
			'build/routes/a/content.js',
			'build/routes/b/content.js',
		] );

		assert.deepEqual( calls, [
			[ 'build/routes/a/content.js', 'jetpack-test', 'plugin' ],
			[ 'build/routes/b/content.js', 'jetpack-test', 'plugin' ],
		] );
	} );

	it( 'resolves even when a catalog download rejects (missing catalog falls back to English)', async () => {
		const calls = installLoader( path =>
			path.includes( '/a/' ) ? Promise.reject( new Error( '404' ) ) : Promise.resolve()
		);
		const { loadI18nCatalogs } = await import( HELPER );

		await assert.doesNotReject(
			loadI18nCatalogs( 'jetpack-test', [
				'build/routes/a/content.js',
				'build/routes/b/content.js',
			] )
		);
		assert.equal( calls.length, 2, 'the rejection does not short-circuit other downloads' );
	} );

	it( 'is a no-op when the loader script is not on the page', async () => {
		globalThis.window = {};
		const { loadI18nCatalogs } = await import( HELPER );
		await assert.doesNotReject( loadI18nCatalogs( 'jetpack-test', [ 'build/a.js' ] ) );
	} );

	it( 'is a no-op when wp.jpI18nLoader lacks a callable downloadI18n', async () => {
		globalThis.window = { wp: { jpI18nLoader: { downloadI18n: 'not-a-function' } } };
		const { loadI18nCatalogs } = await import( HELPER );
		await assert.doesNotReject( loadI18nCatalogs( 'jetpack-test', [ 'build/a.js' ] ) );
	} );
} );
