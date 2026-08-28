/**
 * The `wp-private-apis` polyfill replaces Core's copy on the WordPress versions below its
 * force threshold, so every Core module that opts in on those versions must stay on its
 * allowlist. Upstream prunes a name once its own copy stops opting in (DataViews in 1.54.0),
 * which is invisible until Core's editor blanks on WP 7.0; the bundle has to be executed.
 */

const assert = require( 'node:assert/strict' );
const { existsSync, readFileSync } = require( 'node:fs' );
const { describe, it } = require( 'node:test' );
const vm = require( 'node:vm' );
const path = require( 'path' );
const WP_70_ALLOWLIST = require( './fixtures/wp-70-private-apis-allowlist.js' );

const PRIVATE_APIS_BUNDLE = path.join(
	__dirname,
	'..',
	'..',
	'build',
	'scripts',
	'private-apis',
	'index.js'
);

const CONSENT =
	'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.';

/**
 * Execute the private-apis polyfill bundle and return its `wp.privateApis`.
 *
 * @return {object} The exported `wp.privateApis`.
 */
function loadPrivateApis() {
	const sandbox = { wp: {}, console };
	sandbox.window = sandbox;
	sandbox.self = sandbox;
	sandbox.globalThis = sandbox;
	vm.runInContext( readFileSync( PRIVATE_APIS_BUNDLE, 'utf8' ), vm.createContext( sandbox ) );
	return sandbox.wp.privateApis;
}

const missingBuild = existsSync( PRIVATE_APIS_BUNDLE ) ? false : 'run `pnpm run build` first';

describe( 'wp-private-apis polyfill: Core allowlist contract', { skip: missingBuild }, () => {
	it( 'accepts every module on the WordPress 7.0 Core allowlist', () => {
		const privateApis = loadPrivateApis();
		const rejected = WP_70_ALLOWLIST.filter( name => {
			try {
				privateApis.__dangerousOptInToUnstableAPIsOnlyForCoreModules( CONSENT, name );
				return false;
			} catch {
				return true;
			}
		} );
		assert.deepEqual(
			rejected,
			[],
			'Core modules that opt in on WP 7.0 must not be rejected by the polyfill that replaces its private-apis there.'
		);
	} );

	it( 'still rejects modules that are not Core modules', () => {
		assert.throws(
			() =>
				loadPrivateApis().__dangerousOptInToUnstableAPIsOnlyForCoreModules(
					CONSENT,
					'@automattic/jetpack'
				),
			/opt-in to unstable APIs/
		);
	} );
} );
