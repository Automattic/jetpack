/**
 * Tests for the shared `loadI18nCatalogs` init-module helper. The `.ts` source
 * is imported directly via Node's type stripping (the file is fully erasable
 * TypeScript; CI pins Node ≥ 23.6 where this is enabled by default).
 */

const assert = require( 'node:assert/strict' );
const { describe, it, beforeEach, afterEach, mock } = require( 'node:test' );

const HELPER = '../../src/js/load-i18n-catalogs.ts';

const MODULE_URL =
	'https://example.org/wp-content/plugins/x/jetpack_vendor/automattic/jetpack-test/build/modules/init/index.min.js?ver=abc123';

const MANIFEST_URL =
	'https://example.org/wp-content/plugins/x/jetpack_vendor/automattic/jetpack-test/build/i18n-manifest.json?ver=abc123';

const WIDGET_BUNDLE = 'build/widgets/latest-post/render.js';

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

	it( 'does not request widget catalogs at boot — they load on demand', async () => {
		const calls = installLoader( () => Promise.resolve() );
		installFetch( {
			bundles: [ 'build/routes/a/content.js', 'build/widgets/latest-post/render.js' ],
		} );
		const { loadI18nCatalogs } = await import( HELPER );

		await loadI18nCatalogs( 'jetpack-test', MODULE_URL );

		assert.deepEqual(
			calls.map( ( [ path ] ) => path ),
			[ 'build/routes/a/content.js' ],
			'only non-widget catalogs are requested at boot'
		);
		assert.deepEqual( warnings, [] );
	} );

	it( 'only defers the widget tree itself, not bundles that merely sit under a "widgets" name', async () => {
		const calls = installLoader( () => Promise.resolve() );
		installFetch( {
			bundles: [
				'build/routes/widgets/content.js',
				'build/scripts/widgets/index.js',
				WIDGET_BUNDLE,
			],
		} );
		const { loadI18nCatalogs } = await import( HELPER );

		await loadI18nCatalogs( 'jetpack-test', MODULE_URL );

		// Only `<build>/widgets/**` loads on demand. A route or script called
		// `widgets` has no on-demand caller to pick it up later — the widget
		// resolvers build `build/widgets/<name>/<file>.js` paths of their own —
		// so skipping it here would leave it untranslated for the whole page.
		assert.deepEqual(
			calls.map( ( [ path ] ) => path ),
			[ 'build/routes/widgets/content.js', 'build/scripts/widgets/index.js' ]
		);
	} );

	it( 'limits how many catalog downloads run concurrently', async () => {
		const resolvers = [];
		const calls = installLoader(
			() => new Promise( resolve => resolvers.push( resolve ) ) // Settles only when the test says so.
		);
		installFetch( {
			bundles: Array.from( { length: 10 }, ( _, i ) => `build/routes/r${ i }/content.js` ),
		} );
		const { loadI18nCatalogs } = await import( HELPER );

		const boot = loadI18nCatalogs( 'jetpack-test', MODULE_URL );
		await new Promise( resolve => setTimeout( resolve, 0 ) );

		assert.equal( calls.length, 6, 'only 6 of the 10 downloads start immediately' );

		resolvers.shift()();
		await new Promise( resolve => setTimeout( resolve, 0 ) );
		assert.equal( calls.length, 7, 'a finished download frees a slot for the next one' );

		while ( resolvers.length ) {
			resolvers.shift()();
			await new Promise( resolve => setTimeout( resolve, 0 ) );
		}
		await boot;
		assert.equal( calls.length, 10, 'every download eventually runs' );
		assert.deepEqual( warnings, [] );
	} );

	it( 'ignores non-string manifest entries', async () => {
		const calls = installLoader( () => Promise.resolve() );
		installFetch( { bundles: [ 'build/a.js', 42, null, { path: 'build/b.js' } ] } );
		const { loadI18nCatalogs } = await import( HELPER );

		await loadI18nCatalogs( 'jetpack-test', MODULE_URL );

		assert.deepEqual( calls, [ [ 'build/a.js', 'jetpack-test', 'plugin' ] ] );
	} );

	it( 'downloads nothing when the manifest has no bundles array', async () => {
		const calls = installLoader( () => Promise.resolve() );
		installFetch( { something: 'else' } );
		const { loadI18nCatalogs } = await import( HELPER );

		await loadI18nCatalogs( 'jetpack-test', MODULE_URL );

		assert.deepEqual( calls, [] );
	} );

	it( 'fetches the manifest once per domain, keeping a good bundle set on a repeat call', async () => {
		const calls = installLoader( () => Promise.resolve() );
		const requests = installFetch( { bundles: [ WIDGET_BUNDLE ] } );
		const api = await import( HELPER );
		await api.loadI18nCatalogs( 'jetpack-test', MODULE_URL );

		// A second boot whose manifest request fails must not replace the
		// cached bundle set with the empty one — every widget loading after
		// that would quietly skip its catalog.
		const repeatRequests = installFetch( new Error( 'network down' ) );
		await api.loadI18nCatalogs( 'jetpack-test', MODULE_URL );

		assert.equal( requests.length, 1, 'the first call fetched the manifest' );
		assert.deepEqual( repeatRequests, [], 'the repeat call reuses it, with no second request' );
		assert.deepEqual( warnings, [], 'and so has no manifest failure to report' );

		await api.loadBundleI18nCatalog( 'jetpack-test', WIDGET_BUNDLE );
		assert.deepEqual(
			calls,
			[ [ WIDGET_BUNDLE, 'jetpack-test', 'plugin' ] ],
			'the widget catalog is still known to the manifest'
		);
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

	// Keep this the only test that drives the unrecognized-shape path: the
	// fallback state it installs is module-level (one per copy of the helper,
	// by design — a page that hits this stays on it), and the helper module is
	// cached across tests in this file, so a second test here would inherit
	// this one's download map and see no warning.
	it( 'keeps working when another build parked a foreign shape on the window slot', async () => {
		const calls = installLoader( () => Promise.resolve() );
		// A hypothetical other version of this module: same global name, plain
		// objects where this copy expects Maps. Reading it blind would throw
		// out of `manifests.get()`, and boot awaits this helper uncaught.
		const foreign = { manifests: {}, downloads: {}, active: 0, queue: [] };
		window.__jetpackWpBuildI18nCatalogs = foreign;
		installFetch( { bundles: [ 'build/routes/a/content.js' ] } );
		const { loadI18nCatalogs } = await import( HELPER );

		await assert.doesNotReject( loadI18nCatalogs( 'jetpack-test', MODULE_URL ) );

		assert.deepEqual(
			calls,
			[ [ 'build/routes/a/content.js', 'jetpack-test', 'plugin' ] ],
			'catalogs still download, from state private to this copy'
		);
		assert.equal(
			window.__jetpackWpBuildI18nCatalogs,
			foreign,
			'the other copy keeps the state it is using'
		);
		assert.equal( warnings.length, 1 );
		assert.match( warnings[ 0 ], /unrecognized shape/ );
	} );
} );

describe( 'loadBundleI18nCatalog', () => {
	/**
	 * Run the boot helper so the manifest is cached for on-demand loads.
	 *
	 * @param {string[]} bundles - Manifest bundle list to serve.
	 * @return {Promise<{calls: Array, api: object}>} Recorded downloadI18n calls and the imported module.
	 */
	async function bootWithManifest( bundles ) {
		const calls = installLoader( () => Promise.resolve() );
		installFetch( { bundles } );
		const api = await import( HELPER );
		await api.loadI18nCatalogs( 'jetpack-test', MODULE_URL );
		return { calls, api };
	}

	it( 'downloads a manifest-listed widget catalog on demand', async () => {
		const { calls, api } = await bootWithManifest( [ 'build/routes/a/content.js', WIDGET_BUNDLE ] );
		calls.length = 0;

		await api.loadBundleI18nCatalog( 'jetpack-test', WIDGET_BUNDLE );

		assert.deepEqual( calls, [ [ WIDGET_BUNDLE, 'jetpack-test', 'plugin' ] ] );
		assert.deepEqual( warnings, [] );
	} );

	it( 'skips bundles the manifest does not list — they carry no strings', async () => {
		const { calls, api } = await bootWithManifest( [ 'build/routes/a/content.js' ] );
		calls.length = 0;

		await api.loadBundleI18nCatalog( 'jetpack-test', WIDGET_BUNDLE );

		assert.deepEqual( calls, [], 'no download for a bundle without gettext calls' );
	} );

	it( 'downloads each bundle once no matter how often it is requested', async () => {
		const { calls, api } = await bootWithManifest( [ WIDGET_BUNDLE ] );
		calls.length = 0;

		await Promise.all( [
			api.loadBundleI18nCatalog( 'jetpack-test', WIDGET_BUNDLE ),
			api.loadBundleI18nCatalog( 'jetpack-test', WIDGET_BUNDLE ),
		] );
		await api.loadBundleI18nCatalog( 'jetpack-test', WIDGET_BUNDLE );

		assert.equal( calls.length, 1, 'repeat requests reuse the first download' );
	} );

	it( 'resolves without downloading when the boot helper never ran', async () => {
		const calls = installLoader( () => Promise.resolve() );
		const requests = installFetch( { bundles: [ WIDGET_BUNDLE ] } );
		const { loadBundleI18nCatalog } = await import( HELPER );

		await assert.doesNotReject( loadBundleI18nCatalog( 'jetpack-test', WIDGET_BUNDLE ) );

		assert.deepEqual( calls, [], 'no manifest means the English fallback' );
		assert.deepEqual( requests, [], 'no stray manifest fetch either' );
	} );

	it( 'resolves without downloading for the en_US locale', async () => {
		const calls = installLoader( () => Promise.resolve(), { locale: 'en_US' } );
		installFetch( { bundles: [ WIDGET_BUNDLE ] } );
		const api = await import( HELPER );
		await api.loadI18nCatalogs( 'jetpack-test', MODULE_URL );
		calls.length = 0;

		await api.loadBundleI18nCatalog( 'jetpack-test', WIDGET_BUNDLE );

		assert.deepEqual( calls, [] );
	} );

	it( 'resolves after the bounded wait when the download stalls, and says so', async () => {
		const calls = installLoader( () => Promise.resolve() );
		installFetch( { bundles: [ WIDGET_BUNDLE ] } );
		const api = await import( HELPER );
		await api.loadI18nCatalogs( 'jetpack-test', MODULE_URL );
		calls.length = 0;
		window.wp.jpI18nLoader.downloadI18n = () => new Promise( () => {} ); // Never settles.

		await assert.doesNotReject( api.loadBundleI18nCatalog( 'jetpack-test', WIDGET_BUNDLE, 25 ) );

		assert.equal( warnings.length, 1 );
		assert.match( warnings[ 0 ], /still pending after 25ms/ );
	} );
} );

describe( 'download slot watchdog', () => {
	/**
	 * Let every already-queued microtask and immediate run. `setImmediate` is
	 * deliberately not among the mocked timer APIs, so it still flushes while
	 * `setTimeout` is under test control.
	 *
	 * @return {Promise} Resolves on the next immediate.
	 */
	function flush() {
		return new Promise( resolve => setImmediate( resolve ) );
	}

	/**
	 * The catalog state the helper parks on `window`.
	 *
	 * @return {object} The shared state.
	 */
	function parkedState() {
		return globalThis.window.__jetpackWpBuildI18nCatalogs;
	}

	it( "frees a stalled download's slot so queued downloads still run", async () => {
		mock.timers.enable( { apis: [ 'setTimeout' ] } );
		try {
			// Never settles: the stalled-origin case the watchdog exists for.
			const calls = installLoader( () => new Promise( () => {} ) );
			installFetch( {
				bundles: Array.from( { length: 7 }, ( _, i ) => `build/routes/r${ i }/content.js` ),
			} );
			const { loadI18nCatalogs } = await import( HELPER );

			loadI18nCatalogs( 'jetpack-test', MODULE_URL );
			await flush();

			assert.equal( calls.length, 6, 'the queue starts at the concurrency cap' );

			// Past the slot timeout: the six stalled downloads give their slots
			// back and the seventh starts.
			mock.timers.tick( 30000 );
			await flush();

			assert.equal( calls.length, 7, 'the queued download runs once a slot is freed' );
			assert.ok(
				warnings.some( message => message.includes( 'build/routes/r0/content.js' ) ),
				'the watchdog names the download that held its slot'
			);
		} finally {
			mock.timers.reset();
		}
	} );

	it( 'cancels the watchdog when a download settles normally', async () => {
		mock.timers.enable( { apis: [ 'setTimeout' ] } );
		try {
			installLoader( () => Promise.resolve() );
			installFetch( {
				bundles: Array.from( { length: 12 }, ( _, i ) => `build/routes/r${ i }/content.js` ),
			} );
			const { loadI18nCatalogs } = await import( HELPER );

			const boot = loadI18nCatalogs( 'jetpack-test', MODULE_URL );
			await flush();
			await boot;

			// `clearTimeout` is mocked alongside `setTimeout`, so this tick
			// proves the watchdogs were cancelled rather than merely silent:
			// an uncancelled one would warn about a download that finished.
			mock.timers.tick( 30000 );
			await flush();

			assert.equal( parkedState().active, 0, 'every slot is handed back' );
			assert.equal( parkedState().queue.length, 0, 'nothing is left queued' );
			assert.deepEqual( warnings, [], 'a normal download trips no warning' );
		} finally {
			mock.timers.reset();
		}
	} );

	it( 'ignores a stalled download that settles after its watchdog freed the slot', async () => {
		mock.timers.enable( { apis: [ 'setTimeout' ] } );
		try {
			const resolvers = [];
			const calls = installLoader( () => new Promise( resolve => resolvers.push( resolve ) ) );
			installFetch( {
				bundles: Array.from( { length: 7 }, ( _, i ) => `build/routes/r${ i }/content.js` ),
			} );
			const { loadI18nCatalogs } = await import( HELPER );

			loadI18nCatalogs( 'jetpack-test', MODULE_URL );
			await flush();
			assert.equal( calls.length, 6, 'the queue starts at the concurrency cap' );

			// The six watchdogs fire and hand their slots back; the seventh
			// download takes one of them.
			mock.timers.tick( 30000 );
			await flush();
			assert.equal( calls.length, 7, 'the queued download runs once a slot is freed' );
			assert.equal( parkedState().active, 1, 'only the seventh download still holds a slot' );

			// The stalled origin finally answers. Each of those six downloads
			// now runs its `finally` against a slot the watchdog already
			// released — releasing a second time would drive `active` negative
			// and let the next burst run over the concurrency cap.
			resolvers.slice( 0, 6 ).forEach( resolve => resolve() );
			await flush();

			assert.equal( parkedState().active, 1, 'a late settle does not release the slot twice' );
		} finally {
			mock.timers.reset();
		}
	} );
} );
