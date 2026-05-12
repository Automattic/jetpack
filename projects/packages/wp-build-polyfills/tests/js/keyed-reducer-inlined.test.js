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
 */

const { existsSync, readFileSync } = require( 'fs' );
const assert = require( 'node:assert/strict' );
const { describe, it } = require( 'node:test' );
const vm = require( 'node:vm' );
const path = require( 'path' );

const BUILD_PATH = path.resolve( __dirname, '..', '..', 'build', 'scripts', 'notices', 'index.js' );

describe( 'wp-notices polyfill bundle', () => {
	it( 'must not be missing the build artifact', () => {
		assert.ok( existsSync( BUILD_PATH ), `Run \`pnpm run build\` first; missing ${ BUILD_PATH }` );
	} );

	it( 'must not reference `wp.data.keyedReducer` in the built bundle', () => {
		const raw = readFileSync( BUILD_PATH, 'utf8' );
		// Strip block and line comments before matching so JSDoc text in
		// preserved source (e.g. the loader / shim) doesn't trip the check.
		const source = raw.replace( /\/\*[\s\S]*?\*\//g, '' ).replace( /(^|[^:'"`])\/\/[^\n]*/g, '$1' );

		// `keyedReducer` should only appear as the local inlined export, not
		// dereferenced off the externalized `wp.data` module. Both the dev and
		// minified outputs route `@wordpress/data` through
		// `window.wp.data` / `window["wp"]["data"]`, so any property access
		// off that reference for `keyedReducer` would indicate the helper is
		// being read from the runtime instead of the local copy.
		const wpDataKeyedReducer =
			/(?:window\s*(?:\.\s*wp|\[\s*['"]wp['"]\s*\])\s*(?:\.\s*data|\[\s*['"]data['"]\s*\])\s*(?:\.\s*keyedReducer|\[\s*['"]keyedReducer['"]\s*\]))/;
		assert.ok(
			! wpDataKeyedReducer.test( source ),
			'Built bundle still reaches for `wp.data.keyedReducer`. Confirm the keyed-reducer loader is wired up for the `@wordpress/notices` reducer source path.'
		);
	} );

	it( 'must produce a notices reducer that works without `wp.data.keyedReducer`', () => {
		const source = readFileSync( BUILD_PATH, 'utf8' );

		// The bundle is an IIFE that assigns `window.wp.notices = …`. Run it
		// inside a vm context where `window.wp.data` is stubbed with the
		// runtime surface used by the bundle (everything except
		// `keyedReducer`, which must be self-contained), then assert the
		// reducer's behaviour against a tiny fixture.
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
	} );
} );
