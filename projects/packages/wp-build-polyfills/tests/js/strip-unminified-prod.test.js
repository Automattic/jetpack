const { mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } = require( 'fs' );
const assert = require( 'node:assert/strict' );
const { describe, it, beforeEach, afterEach } = require( 'node:test' );
const os = require( 'os' );
const path = require( 'path' );
const {
	strip,
	patchPhpSource,
	hasUnpatchedFallback,
} = require( '../../bin/strip-unminified-prod-lib.js' );

// --- Fixtures for the four generated PHP loader shapes wp-build emits ---

const ROUTES_PHP = `<?php
$extension = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '.js' : '.min.js';
$src = $build_url . 'routes/' . $route['name'] . '/content' . $extension;
`;

const SCRIPTS_PHP = `<?php
$default_version = ! SCRIPT_DEBUG ? $build_constants['version'] : time();
$extension       = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '.js' : '.min.js';
`;

const MODULES_PHP = `<?php
$extension = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG && empty( $module['min_only'] ) )
	? '.js'
	: '.min.js';
`;

const STYLES_PHP = `<?php
$suffix = SCRIPT_DEBUG ? '' : '.min';
$src    = $build_url . 'styles/' . $style_data['path'] . $suffix . '.css';
`;

/**
 * Build a tiny fake `build/` tree under `root` so the strip pass has
 * something to operate on.
 *
 * @param {string} root - Absolute path of the directory that will hold `build/`.
 * @return {string} Absolute path to the `build/` directory inside `root`.
 */
function seedFixture( root ) {
	const build = path.join( root, 'build' );
	mkdirSync( path.join( build, 'routes', 'dashboard' ), { recursive: true } );
	mkdirSync( path.join( build, 'scripts' ), { recursive: true } );
	mkdirSync( path.join( build, 'modules', 'boot' ), { recursive: true } );
	mkdirSync( path.join( build, 'styles' ), { recursive: true } );

	// A paired route bundle — both .js and .js.map should be deleted.
	writeFileSync( path.join( build, 'routes', 'dashboard', 'content.min.js' ), 'min;' );
	writeFileSync( path.join( build, 'routes', 'dashboard', 'content.js' ), 'unminified;' );
	writeFileSync( path.join( build, 'routes', 'dashboard', 'content.js.map' ), '{"version":3}' );

	// An unpaired .js (no .min sibling) — must NOT be deleted.
	writeFileSync( path.join( build, 'routes', 'dashboard', 'loader.js' ), 'loader stays;' );

	// A paired stylesheet — both .css and .css siblings should be deleted.
	writeFileSync( path.join( build, 'styles', 'main.min.css' ), '.a{color:red}' );
	writeFileSync( path.join( build, 'styles', 'main.css' ), '.a { color: red; }' );

	// Files at the top of build/ are out of scope (not under one of the
	// target subdirs) — must NOT be deleted even though they look paired.
	writeFileSync( path.join( build, 'newsletter.js' ), 'webpack;' );
	writeFileSync( path.join( build, 'newsletter.min.js' ), 'webpack;' );

	// The four generated PHP loaders.
	writeFileSync( path.join( build, 'routes.php' ), ROUTES_PHP );
	writeFileSync( path.join( build, 'scripts.php' ), SCRIPTS_PHP );
	writeFileSync( path.join( build, 'modules.php' ), MODULES_PHP );
	writeFileSync( path.join( build, 'styles.php' ), STYLES_PHP );

	return build;
}

describe( 'strip-unminified-prod', () => {
	let tmpRoot;

	beforeEach( () => {
		tmpRoot = mkdtempSync( path.join( os.tmpdir(), 'strip-unminified-' ) );
	} );

	afterEach( () => {
		rmSync( tmpRoot, { recursive: true, force: true } );
	} );

	describe( 'strip()', () => {
		it( 'returns skipped:true when build/ is absent', () => {
			const result = strip( path.join( tmpRoot, 'no-such-dir' ) );
			assert.deepEqual( result, { deletedFiles: 0, patchedFiles: 0, skipped: true } );
		} );

		it( 'deletes paired unminified JS/CSS and their source maps', () => {
			const build = seedFixture( tmpRoot );
			const result = strip( build );

			// Deletions inside the target subdirs.
			assert.equal( existsSync( path.join( build, 'routes/dashboard/content.js' ) ), false );
			assert.equal( existsSync( path.join( build, 'routes/dashboard/content.js.map' ) ), false );
			assert.equal( existsSync( path.join( build, 'styles/main.css' ) ), false );

			// Minified siblings survive.
			assert.equal( existsSync( path.join( build, 'routes/dashboard/content.min.js' ) ), true );
			assert.equal( existsSync( path.join( build, 'styles/main.min.css' ) ), true );

			// Unpaired loader.js stays.
			assert.equal( existsSync( path.join( build, 'routes/dashboard/loader.js' ) ), true );

			// Files outside the target subdirs stay (this is the boundary
			// between wp-build output and webpack output).
			assert.equal( existsSync( path.join( build, 'newsletter.js' ) ), true );
			assert.equal( existsSync( path.join( build, 'newsletter.min.js' ) ), true );

			assert.equal( result.deletedFiles, 2 ); // content.js + main.css
			assert.equal( result.skipped, false );
		} );

		it( 'rewrites all four PHP loaders to use the minified asset', () => {
			const build = seedFixture( tmpRoot );
			const result = strip( build );

			const routes = readFileSync( path.join( build, 'routes.php' ), 'utf8' );
			const scripts = readFileSync( path.join( build, 'scripts.php' ), 'utf8' );
			const modules = readFileSync( path.join( build, 'modules.php' ), 'utf8' );
			const styles = readFileSync( path.join( build, 'styles.php' ), 'utf8' );

			// Each ternary should be collapsed.
			assert.match( routes, /\$extension = '\.min\.js';/ );
			assert.match( scripts, /\$extension {7}= '\.min\.js';/ );
			assert.match( modules, /\$extension = '\.min\.js';/ );
			assert.match( styles, /\$suffix = '\.min';/ );

			// No remaining `.js` / `''` fallback branches.
			for ( const src of [ routes, scripts, modules, styles ] ) {
				assert.equal( hasUnpatchedFallback( src ), false );
			}

			// The `! SCRIPT_DEBUG` for $default_version in scripts.php is
			// unrelated to asset paths and should be left alone.
			assert.match( scripts, /! SCRIPT_DEBUG/ );

			assert.equal( result.patchedFiles, 4 );
		} );

		it( 'is idempotent — a second run is a silent no-op', () => {
			const build = seedFixture( tmpRoot );
			strip( build );
			const result = strip( build );
			assert.equal( result.deletedFiles, 0 );
			assert.equal( result.patchedFiles, 0 );
			assert.equal( result.skipped, false );
		} );

		it( 'throws when a SCRIPT_DEBUG-driven `.js` fallback is unrecognised', () => {
			// Simulate a future wp-build template that uses a slightly
			// different ternary our regexes don't catch.
			const build = path.join( tmpRoot, 'build' );
			mkdirSync( build, { recursive: true } );
			writeFileSync(
				path.join( build, 'routes.php' ),
				`<?php\n$extension = SCRIPT_DEBUG === true ? '.js' : '.min.js';\n`
			);
			assert.throws( () => strip( build ), /template likely changed shape/ );
		} );

		it( 'throws when a SCRIPT_DEBUG-driven `.min` suffix fallback is unrecognised', () => {
			const build = path.join( tmpRoot, 'build' );
			mkdirSync( build, { recursive: true } );
			writeFileSync(
				path.join( build, 'styles.php' ),
				`<?php\n$suffix = wp_get_debug_mode() ? '' : '.min';\n`
			);
			assert.throws( () => strip( build ), /template likely changed shape/ );
		} );
	} );

	describe( 'patchPhpSource()', () => {
		it( 'returns null when no SCRIPT_DEBUG ternary is present', () => {
			assert.equal( patchPhpSource( '<?php // nothing to patch' ), null );
		} );

		it( 'patches all three ternary shapes when present together', () => {
			const mixed = ROUTES_PHP + '\n' + MODULES_PHP + '\n' + STYLES_PHP;
			const out = patchPhpSource( mixed );
			assert.notEqual( out, null );
			assert.equal( hasUnpatchedFallback( out ), false );
		} );
	} );
} );
