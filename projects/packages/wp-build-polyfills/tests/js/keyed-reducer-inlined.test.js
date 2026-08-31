/**
 * Regression test for the `keyedReducer` runtime breakage introduced when
 * `@wordpress/notices` >= 5.45.0 began importing `keyedReducer` from
 * `@wordpress/data` (added upstream in `@wordpress/data` 10.45.0). Without
 * the inlining loader, the polyfill bundle would call
 * `window.wp.data.keyedReducer()` at load time and throw on older WordPress
 * Cores that ship `@wordpress/data` < 10.45.0.
 *
 * The test verifies the built `wp-notices` polyfill ships a working
 * `keyedReducer` that does NOT depend on a `keyedReducer` export from the
 * runtime `wp.data` global. We extract the reducer function from the bundle
 * with an isolated `wp.data` stub (and a stub for every other external
 * symbol the bundle touches) and execute it on a fixture state shape.
 *
 * The same assertions run against BOTH the development (non-minified) and
 * production (minified) outputs, because minifiers can rewrite the shape of
 * `window["wp"]["data"]["keyedReducer"]` references in ways the static
 * regex could otherwise miss (e.g. aliasing `wp.data` into a single
 * identifier and then doing `.keyedReducer` off of it).
 */

const { existsSync, readFileSync, rmSync } = require( 'fs' );
const assert = require( 'node:assert/strict' );
const { execFileSync } = require( 'node:child_process' );
const { describe, it, before } = require( 'node:test' );
const vm = require( 'node:vm' );
const path = require( 'path' );

const PACKAGE_ROOT = path.resolve( __dirname, '..', '..' );
const DEV_BUILD_PATH = path.join( PACKAGE_ROOT, 'build', 'scripts', 'notices', 'index.js' );

// We render production output into a sibling tree so the dev build at
// `build/` stays usable for other tests / inspection without interleaving.
const PROD_BUILD_ROOT = path.join( PACKAGE_ROOT, 'build-prod-test' );
const PROD_BUILD_PATH = path.join( PROD_BUILD_ROOT, 'scripts', 'notices', 'index.js' );

/**
 * Run the package's webpack build with the given NODE_ENV and output base.
 * We invoke webpack-cli directly (rather than the package's `build` script)
 * so we can redirect the output path without clobbering the dev build.
 *
 * @param {object} env        - Extra env vars for the child process.
 * @param {string} outputBase - Absolute path for `output.path`'s base.
 */
function buildWithEnv( env, outputBase ) {
	execFileSync(
		process.execPath,
		[
			require.resolve( 'webpack-cli/bin/cli.js' ),
			'--config',
			path.join( PACKAGE_ROOT, 'webpack.config.js' ),
		],
		{
			cwd: PACKAGE_ROOT,
			env: { ...process.env, ...env, WP_BUILD_POLYFILLS_OUTPUT_BASE: outputBase },
			stdio: 'pipe',
		}
	);
}

/**
 * Assertion shared by both build modes: the bundle must not statically
 * reference `wp.data.keyedReducer` (whatever shape the minifier picks).
 *
 * @param {string}  source - Raw bundle source.
 * @param {string}  label  - Human-readable build label for assertion msgs.
 * @param {boolean} isMin  - Whether this is a minified build.
 */
function assertNoWpDataKeyedReducer( source, label, isMin ) {
	// Strip block and line comments before matching so JSDoc text in
	// preserved source (e.g. the loader / shim) doesn't trip the check.
	const stripped = source
		.replace( /\/\*[\s\S]*?\*\//g, '' )
		.replace( /(^|[^:'"`])\/\/[^\n]*/g, '$1' );

	// `keyedReducer` should only appear as the local inlined export, not
	// dereferenced off the externalized `wp.data` module. Both the dev and
	// minified outputs route `@wordpress/data` through
	// `window.wp.data` / `window["wp"]["data"]`, so any property access
	// off that reference for `keyedReducer` would indicate the helper is
	// being read from the runtime instead of the local copy.
	const wpDataKeyedReducer =
		/(?:window\s*(?:\.\s*wp|\[\s*['"]wp['"]\s*\])\s*(?:\.\s*data|\[\s*['"]data['"]\s*\])\s*(?:\.\s*keyedReducer|\[\s*['"]keyedReducer['"]\s*\]))/;
	assert.ok(
		! wpDataKeyedReducer.test( stripped ),
		`${ label }: built bundle still reaches for \`wp.data.keyedReducer\`. Confirm the keyed-reducer loader is wired up for the affected reducer source paths.`
	);

	// Belt-and-braces: in a minified bundle the property may be quoted but
	// not chained directly off `wp.data` (e.g. `const d = wp.data; …
	// d["keyedReducer"]`). Asserting that the literal string `keyedReducer`
	// is absent from the bundle entirely catches that escape hatch. (The
	// helper function body in `src/internal/keyed-reducer.js` does not
	// itself mention `keyedReducer` — it's exported by that name but
	// referenced internally by parameter / closure variables only — so
	// this assertion is safe for the inlined-shim case.)
	if ( isMin ) {
		assert.ok(
			! /['"]keyedReducer['"]/.test( stripped ) && ! /\bkeyedReducer\b/.test( stripped ),
			`${ label }: built bundle contains the literal token \`keyedReducer\`, which suggests an unexpected externalized property access slipped past the static check above.`
		);
	}
}

/**
 * Runtime assertion: load the bundle in a vm with a stub `wp.data` that
 * deliberately omits `keyedReducer`, and exercise the registered notices
 * reducer end-to-end.
 *
 * @param {string} source - Raw bundle source.
 */
function assertReducerWorksWithoutWpDataKeyedReducer( source ) {
	const recordedStore = {};
	const sandbox = {
		window: {
			wp: {
				components: { SnackbarList: () => null, NoticeList: () => null },
				data: {
					// Intentionally omit `keyedReducer` — the polyfill must not need it.
					createReduxStore: ( name, options ) => {
						recordedStore.name = name;
						recordedStore.reducer = options.reducer;
						return { name };
					},
					register: () => {},
					useDispatch: () => ( {} ),
					useSelect: () => undefined,
				},
			},
			polyfill: true,
		},
		ReactJSXRuntime: { jsx: () => null, jsxs: () => null, Fragment: Symbol( 'Fragment' ) },
	};
	sandbox.window.window = sandbox.window;
	sandbox.globalThis = sandbox.window;
	sandbox.self = sandbox.window;

	vm.createContext( sandbox );
	vm.runInContext( source, sandbox );

	assert.equal(
		recordedStore.name,
		'core/notices',
		'expected the bundle to register the `core/notices` store'
	);
	assert.equal( typeof recordedStore.reducer, 'function', 'reducer must be a function' );

	// Empty state, create one notice in the `default` context.
	// Compare JSON so deepStrictEqual doesn't flag cross-realm object identity.
	const created = recordedStore.reducer( undefined, {
		type: 'CREATE_NOTICE',
		context: 'default',
		notice: { id: 'a', content: 'hi' },
	} );
	assert.equal(
		JSON.stringify( created ),
		JSON.stringify( { default: [ { id: 'a', content: 'hi' } ] } )
	);

	// Remove the only notice.
	const removed = recordedStore.reducer( created, {
		type: 'REMOVE_NOTICE',
		context: 'default',
		id: 'a',
	} );
	assert.equal( JSON.stringify( removed ), JSON.stringify( { default: [] } ) );
}

describe( 'wp-notices polyfill bundle (development build)', () => {
	it( 'must not be missing the build artifact', () => {
		assert.ok(
			existsSync( DEV_BUILD_PATH ),
			`Run \`pnpm run build\` first; missing ${ DEV_BUILD_PATH }`
		);
	} );

	it( 'must not reference `wp.data.keyedReducer` in the built bundle', () => {
		const raw = readFileSync( DEV_BUILD_PATH, 'utf8' );
		assertNoWpDataKeyedReducer( raw, 'dev build', false );
	} );

	it( 'must produce a notices reducer that works without `wp.data.keyedReducer`', () => {
		const source = readFileSync( DEV_BUILD_PATH, 'utf8' );
		assertReducerWorksWithoutWpDataKeyedReducer( source );
	} );
} );

describe( 'wp-notices polyfill bundle (production minified build)', () => {
	before( () => {
		// Tear down any prior run so we always assert against fresh output.
		rmSync( PROD_BUILD_ROOT, { recursive: true, force: true } );
		buildWithEnv( { NODE_ENV: 'production', BABEL_ENV: 'production' }, PROD_BUILD_ROOT );
	} );

	it( 'must produce a minified build artifact', () => {
		assert.ok(
			existsSync( PROD_BUILD_PATH ),
			`Production webpack build did not emit ${ PROD_BUILD_PATH }`
		);
		const stats = readFileSync( PROD_BUILD_PATH, 'utf8' );
		// Sanity-check minification actually happened — non-minified bundles
		// are tens of KB; minified should be a fraction of that.
		assert.ok(
			stats.length < 10000,
			`Expected minified bundle, got ${ stats.length } bytes — webpack may not have minified.`
		);
	} );

	it( 'must not reference `wp.data.keyedReducer` in the minified bundle', () => {
		const raw = readFileSync( PROD_BUILD_PATH, 'utf8' );
		assertNoWpDataKeyedReducer( raw, 'production build', true );
	} );

	it( 'must produce a notices reducer that works without `wp.data.keyedReducer`', () => {
		const source = readFileSync( PROD_BUILD_PATH, 'utf8' );
		assertReducerWorksWithoutWpDataKeyedReducer( source );
	} );
} );
