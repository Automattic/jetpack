/**
 * Tests for the shared `loadI18nCatalogs` init-module helper. The `.ts` source
 * is imported directly via Node's type stripping (the file is fully erasable
 * TypeScript; CI pins Node ≥ 23.6 where this is enabled by default).
 */

/* eslint-disable no-console -- these tests stub console.warn to assert on it. */

const assert = require( 'node:assert/strict' );
const { describe, it, afterEach } = require( 'node:test' );

const HELPER = '../../src/js/load-i18n-catalogs.ts';

const originalWarn = console.warn;

/**
 * Capture `console.warn` output for the duration of a test.
 *
 * @return {string[]} Array appended to with each warning's first argument.
 */
function captureWarnings() {
	const warnings = [];
	console.warn = msg => warnings.push( msg );
	return warnings;
}

afterEach( () => {
	delete globalThis.window;
	console.warn = originalWarn;
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
		const warnings = captureWarnings();
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
		assert.deepEqual( warnings, [], 'the happy path is silent' );
	} );

	it( 'stays silent when a catalog is missing (HTTP failure → expected English fallback)', async () => {
		const warnings = captureWarnings();
		const calls = installLoader( path =>
			path.includes( '/a/' )
				? Promise.reject( new Error( 'HTTP request failed: 404 Not Found' ) )
				: Promise.resolve()
		);
		const { loadI18nCatalogs } = await import( HELPER );

		await assert.doesNotReject(
			loadI18nCatalogs( 'jetpack-test', [
				'build/routes/a/content.js',
				'build/routes/b/content.js',
			] )
		);
		assert.equal( calls.length, 2, 'the rejection does not short-circuit other downloads' );
		assert.deepEqual( warnings, [], 'a missing catalog is not a misconfiguration' );
	} );

	it( 'warns (but still resolves) when a download fails for a non-HTTP reason', async () => {
		const warnings = captureWarnings();
		installLoader( () => Promise.reject( new Error( 'wp.jpI18nLoader.state is not set' ) ) );
		const { loadI18nCatalogs } = await import( HELPER );

		await assert.doesNotReject( loadI18nCatalogs( 'jetpack-test', [ 'build/a.js' ] ) );
		assert.equal( warnings.length, 1 );
		assert.match( warnings[ 0 ], /jetpack-test.*build\/a\.js.*state is not set/ );
	} );

	it( 'warns when the loader script is not on the page', async () => {
		const warnings = captureWarnings();
		globalThis.window = {};
		const { loadI18nCatalogs } = await import( HELPER );

		await assert.doesNotReject( loadI18nCatalogs( 'jetpack-test', [ 'build/a.js' ] ) );
		assert.equal( warnings.length, 1 );
		assert.match( warnings[ 0 ], /jpI18nLoader unavailable/ );
	} );

	it( 'warns when wp.jpI18nLoader lacks a callable downloadI18n', async () => {
		const warnings = captureWarnings();
		globalThis.window = { wp: { jpI18nLoader: { downloadI18n: 'not-a-function' } } };
		const { loadI18nCatalogs } = await import( HELPER );

		await assert.doesNotReject( loadI18nCatalogs( 'jetpack-test', [ 'build/a.js' ] ) );
		assert.equal( warnings.length, 1 );
		assert.match( warnings[ 0 ], /jpI18nLoader unavailable/ );
	} );
} );
