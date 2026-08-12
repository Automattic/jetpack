/**
 * Runtime tests for the `wp-rich-text` polyfill's private-APIs contract.
 *
 * The polyfill exists because Core's rich-text `privateApis` is unusable by
 * current dashboard dependencies: WP 6.9 exports none at all ("Cannot unlock
 * an undefined object"), and WP 7.0 exports one locked with only
 * `useRichText`, so the other keys destructure to `undefined`.
 *
 * Two things can silently break it, and static assertions on the bundle text
 * cannot catch either — both need the bundle actually executed:
 *
 * First, the bundle calls `__dangerousOptInToUnstableAPIsOnlyForCoreModules()`
 * at module scope for BOTH `@wordpress/rich-text` and `@wordpress/compose`
 * (compose is bundled in, because Core's compose lacks the
 * `subscribeDelegatedListener` private API rich-text unlocks). Those calls throw
 * unless the `wp-private-apis` implementation that actually loads allowlists
 * both names. Core's does not — WP 6.9 allowlists neither, and WP 7.0
 * allowlists rich-text but still not compose. Hence
 * `WP_Build_Polyfills::SCRIPT_DEPENDENCIES` forcing `wp-private-apis` alongside
 * `wp-rich-text`.
 *
 * Second, the set of keys locked into `wp.richText.privateApis` must cover
 * everything the dashboard packages unlock. A missing key is not a load error —
 * it surfaces later as `undefined is not a component`.
 */

const assert = require( 'node:assert/strict' );
const { existsSync, readFileSync } = require( 'node:fs' );
const { describe, it } = require( 'node:test' );
const vm = require( 'node:vm' );
const path = require( 'path' );

const PACKAGE_ROOT = path.resolve( __dirname, '..', '..' );
const scriptDir = name => path.join( PACKAGE_ROOT, 'build', 'scripts', name );

const RICH_TEXT_BUNDLE = path.join( scriptDir( 'rich-text' ), 'index.js' );
const RICH_TEXT_ASSET = path.join( scriptDir( 'rich-text' ), 'index.asset.php' );
const PRIVATE_APIS_BUNDLE = path.join( scriptDir( 'private-apis' ), 'index.js' );

const CONSENT =
	'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.';

// Every `privateApis` key the dashboard packages unlock from rich-text. Keep
// in sync with the consumers (@wordpress/block-editor, @wordpress/format-library,
// @wordpress/dataviews dataform controls) — a key dropped upstream must fail
// here rather than at runtime in a dashboard.
const REQUIRED_PRIVATE_APIS = [
	'useRichText',
	'KeyboardShortcutContext',
	'InputEventContext',
	'shortcutsListener',
	'inputEventsListener',
];

// The allowlist shipped in WordPress 7.0.1's `wp-includes/js/dist/private-apis.js`
// (`CORE_MODULES_USING_PRIVATE_APIS`). Verbatim fixture: it is the newest Core
// allowlist the polyfill has to coexist with, and the reason the rich-text
// polyfill cannot run against Core's `wp-private-apis`.
const WP_70_ALLOWLIST = [
	'@wordpress/block-directory',
	'@wordpress/block-editor',
	'@wordpress/block-library',
	'@wordpress/blocks',
	'@wordpress/boot',
	'@wordpress/commands',
	'@wordpress/components',
	'@wordpress/connectors',
	'@wordpress/core-commands',
	'@wordpress/core-data',
	'@wordpress/customize-widgets',
	'@wordpress/data',
	'@wordpress/dataviews',
	'@wordpress/editor',
	'@wordpress/edit-post',
	'@wordpress/edit-site',
	'@wordpress/edit-widgets',
	'@wordpress/fields',
	'@wordpress/font-list-route',
	'@wordpress/format-library',
	'@wordpress/global-styles-ui',
	'@wordpress/lazy-editor',
	'@wordpress/media-utils',
	'@wordpress/patterns',
	'@wordpress/preferences',
	'@wordpress/reusable-blocks',
	'@wordpress/rich-text',
	'@wordpress/route',
	'@wordpress/router',
	'@wordpress/routes',
	'@wordpress/sync',
	'@wordpress/upload-media',
	'@wordpress/workflows',
];

/**
 * Faithful stand-in for Core's `wp.privateApis`, parameterised by allowlist.
 *
 * Mirrors `@wordpress/private-apis`: the opt-in throws for any module name not
 * on the allowlist, and `unlock()` throws on an object that was never locked.
 * Only the allowlist gate is under test, so a small reimplementation is clearer
 * than shipping a minified Core file as a fixture.
 *
 * @param {string[]} allowlist - Module names permitted to opt in.
 * @return {object} A `wp.privateApis`-shaped object.
 */
function createPrivateApis( allowlist ) {
	const lockedData = new WeakMap();
	const KEY = Symbol( 'Private API ID' );

	return {
		__dangerousOptInToUnstableAPIsOnlyForCoreModules( consent, moduleName ) {
			if ( ! allowlist.includes( moduleName ) ) {
				throw new Error(
					`You tried to opt-in to unstable APIs as module "${ moduleName }". This feature is only for JavaScript modules shipped with WordPress core.`
				);
			}
			if ( consent !== CONSENT ) {
				throw new Error(
					'You tried to opt-in to unstable APIs without confirming you know the consequences.'
				);
			}
			return {
				lock( object, privateData ) {
					if ( ! object[ KEY ] ) {
						object[ KEY ] = {};
					}
					lockedData.set( object[ KEY ], privateData );
				},
				unlock( object ) {
					if ( ! object ) {
						throw new Error( 'Cannot unlock an undefined object.' );
					}
					if ( ! object[ KEY ] ) {
						throw new Error( 'Cannot unlock an object that was not locked before. ' );
					}
					return lockedData.get( object[ KEY ] );
				},
			};
		},
	};
}

/**
 * Build a sandbox that stands in for the browser globals the rich-text bundle
 * reads. The sandbox object IS the context global, so the bundles' top-level
 * `var wp` aliases `window.wp` exactly as it does in a browser.
 *
 * @return {object} A vm context object.
 */
function createSandbox() {
	const noop = () => {};
	// Recursive callable proxy: stands in for the externalised core packages
	// whose exact shape is irrelevant to the private-APIs contract. Each stub
	// gets its own target so sibling stubs cannot share state.
	const stub = ( overrides = {} ) =>
		new Proxy(
			Object.assign( () => {}, overrides ),
			{
				get: ( target, key ) => {
					if ( key === Symbol.toPrimitive || key === 'then' || key === 'prototype' ) {
						return undefined;
					}
					if ( ! ( key in target ) ) {
						target[ key ] = stub();
					}
					return target[ key ];
				},
				apply: () => undefined,
			}
		);

	const sandbox = {
		wp: {
			a11y: { speak: noop },
			data: stub(),
			deprecated: noop,
			dom: stub(),
			// rich-text builds contexts and components at module scope, so these
			// must return usable values rather than `undefined`.
			element: stub( {
				createContext: () => ( {} ),
				createElement: () => null,
				forwardRef: component => component,
				memo: component => component,
				Fragment: Symbol( 'Fragment' ),
				Platform: { OS: 'web' },
			} ),
			escapeHtml: stub(),
			i18n: { __: s => s, _x: s => s, _n: s => s, sprintf: s => s, isRTL: () => false },
			keycodes: stub(),
		},
		document: stub( { createElement: () => stub( { style: {} } ) } ),
		navigator: { userAgent: 'node' },
		console,
	};
	sandbox.window = sandbox;
	sandbox.self = sandbox;
	sandbox.globalThis = sandbox;

	return vm.createContext( sandbox );
}

/**
 * Execute the rich-text polyfill bundle against a given `wp.privateApis`.
 *
 * @param {object} privateApis - The `wp.privateApis` implementation to install.
 * @return {object} The populated sandbox.
 */
function runRichTextAgainst( privateApis ) {
	const sandbox = createSandbox();
	sandbox.wp.privateApis = privateApis;
	vm.runInContext( readFileSync( RICH_TEXT_BUNDLE, 'utf8' ), sandbox );
	return sandbox;
}

const missingBuild =
	! existsSync( RICH_TEXT_BUNDLE ) || ! existsSync( PRIVATE_APIS_BUNDLE )
		? 'run `pnpm run build` first'
		: false;

describe( 'wp-rich-text polyfill: private-APIs contract', { skip: missingBuild }, () => {
	it( 'loads against the wp-private-apis polyfill it ships with', () => {
		// The supported pairing: `WP_Build_Polyfills::SCRIPT_DEPENDENCIES`
		// guarantees the private-apis polyfill is registered alongside.
		const sandbox = createSandbox();
		vm.runInContext( readFileSync( PRIVATE_APIS_BUNDLE, 'utf8' ), sandbox );
		vm.runInContext( readFileSync( RICH_TEXT_BUNDLE, 'utf8' ), sandbox );

		assert.equal( typeof sandbox.wp.richText, 'object', 'bundle must export `wp.richText`' );
	} );

	it( 'locks every privateApis key the dashboard packages unlock', () => {
		const sandbox = createSandbox();
		vm.runInContext( readFileSync( PRIVATE_APIS_BUNDLE, 'utf8' ), sandbox );
		vm.runInContext( readFileSync( RICH_TEXT_BUNDLE, 'utf8' ), sandbox );

		// `@wordpress/block-editor` is a stand-in for any allowlisted consumer.
		const { unlock } = sandbox.wp.privateApis.__dangerousOptInToUnstableAPIsOnlyForCoreModules(
			CONSENT,
			'@wordpress/block-editor'
		);

		assert.ok( sandbox.wp.richText.privateApis, 'rich-text must export `privateApis`' );

		const unlocked = unlock( sandbox.wp.richText.privateApis );
		for ( const key of REQUIRED_PRIVATE_APIS ) {
			assert.notEqual(
				unlocked[ key ],
				undefined,
				`rich-text privateApis is missing \`${ key }\`, which dashboard packages unlock. A dashboard using it will render \`undefined\`.`
			);
		}
	} );

	it( 'still opts in for @wordpress/compose, so it cannot run on Core private-apis', () => {
		// Documents WHY `SCRIPT_DEPENDENCIES` forces `wp-private-apis`: even the
		// newest Core allowlist rejects the bundled compose opt-in. If Core ever
		// allowlists `@wordpress/compose`, this test fails — at which point the
		// PHP dependency can be revisited rather than silently kept forever.
		assert.throws(
			() => runRichTextAgainst( createPrivateApis( WP_70_ALLOWLIST ) ),
			/opt-in to unstable APIs as module "@wordpress\/compose"/,
			'Expected the WP 7.0 allowlist to reject the bundled compose opt-in.'
		);
	} );

	it( 'externalizes wp-private-apis and does not externalize compose', () => {
		// Cheap structural guard that pins the two facts the runtime tests above
		// depend on, so a regression reports the cause rather than a stack trace.
		const asset = readFileSync( RICH_TEXT_ASSET, 'utf8' );
		assert.match( asset, /'wp-private-apis'/ );
		assert.doesNotMatch( asset, /'wp-compose'/ );
	} );
} );
