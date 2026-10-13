/**
 * Tests for the stamp-textdomains post-build tool. It runs
 * `@automattic/babel-plugin-replace-textdomain` over the esbuild output of a
 * wp-build dashboard so every gettext call in the built bundle carries the
 * package text domain — the domain that never survives esbuild's
 * externalization of `@wordpress/i18n`.
 *
 * Shapes exercised mirror real esbuild output: a `SequenceExpression`-wrapped
 * member call `(0, import_i18n.__)(…)` in the readable `.js` and the compact
 * `(0,e.__)(…)` in the `.min.js`.
 */

const crypto = require( 'crypto' );
const {
	chmodSync,
	mkdtempSync,
	mkdirSync,
	readdirSync,
	writeFileSync,
	readFileSync,
	rmSync,
} = require( 'fs' );
const assert = require( 'node:assert/strict' );
const os = require( 'node:os' );
const { describe, it } = require( 'node:test' );
const path = require( 'path' );
const {
	stampCode,
	stampDir,
	refreshAssetVersion,
	stampToolSources,
	toolFingerprint,
	writeI18nManifest,
	walk,
	I18N_MANIFEST,
} = require( '../../bin/stamp-textdomains-lib.js' );

const DOMAIN = 'jetpack-videopress-pkg';

/**
 * wp-build's content hash for an emitted bundle: sha256, first 20 hex chars.
 *
 * @param {string} file - Path to the emitted file.
 * @return {string} The expected `'version'` value.
 */
function contentHash( file ) {
	return crypto
		.createHash( 'sha256' )
		.update( readFileSync( file ) )
		.digest( 'hex' )
		.slice( 0, 20 );
}

describe( 'stamp-textdomains', () => {
	it( 'adds domain to a bare sequence-expression call (esbuild non-min shape)', () => {
		const input = 'x = (0, import_i18n3.__)("Loading");';
		assert.ok(
			stampCode( input, DOMAIN, false ).includes( '"Loading", "jetpack-videopress-pkg"' ),
			'domain should be appended to the bare __() call'
		);
	} );

	it( 'replaces a wrong domain', () => {
		const input = 'x = (0, import_i18n.__)("Err: %s", "jetpack-connection-js");';
		const out = stampCode( input, DOMAIN, false );
		assert.ok( out.includes( '"jetpack-videopress-pkg"' ), 'target domain present' );
		assert.ok( ! out.includes( 'jetpack-connection-js' ), 'wrong domain removed' );
	} );

	it( 'keeps an already-correct domain (idempotent)', () => {
		const input = 'x = (0, import_i18n.__)("Hi", "jetpack-videopress-pkg");';
		const once = stampCode( input, DOMAIN, false );
		assert.equal( stampCode( once, DOMAIN, false ), once, 'second pass is byte-identical' );
	} );

	it( 'handles the minified member-call shape and stays compact', () => {
		const input = 'var a=(0,e.__)("Jetpack Logo","jetpack-components"),b=(0,e._x)("Go","verb");';
		const out = stampCode( input, DOMAIN, true );
		assert.ok(
			out.includes( '"Jetpack Logo","jetpack-videopress-pkg"' ),
			'__ domain replaced compactly'
		);
		assert.ok(
			out.includes( '"Go","verb","jetpack-videopress-pkg"' ),
			'_x context kept, domain appended compactly'
		);
		assert.ok( ! /\n./.test( out ), 'output stays a single line' );
	} );

	it( 'appends the domain to _n at argument index 3', () => {
		const input = 'x = (0, i._n)("%d cat", "%d cats", n);';
		assert.ok(
			stampCode( input, DOMAIN, false ).includes( '"jetpack-videopress-pkg"' ),
			'_n gets a domain after the count argument'
		);
	} );

	it( 'leaves a gettext-shaped call on an unrelated object alone', () => {
		// What a bundled dependency's own cache/registry helper looks like once
		// esbuild has inlined it next to the real gettext calls.
		const input = 'var cache={__:k=>k};var v=cache.__("some-key");';
		assert.equal( stampCode( input, DOMAIN, true ), input, 'the call is untouched' );
	} );

	it( 'stamps a call whose callee traces back to @wordpress/i18n', () => {
		const input =
			'var require_i18n=__commonJS({"package-external:@wordpress/i18n"(exports,module){module.exports=window.wp.i18n;}});' +
			'var import_i18n=__toESM(require_i18n(),1);var v=(0,import_i18n.__)("Hi");';
		assert.ok(
			stampCode( input, DOMAIN, true ).includes( '"Hi","jetpack-videopress-pkg"' ),
			'the real gettext call is stamped'
		);
	} );

	it( 'stampDir walks routes, rewrites both .js and .min.js, and rehashes the paired .asset.php', () => {
		const tmp = mkdtempSync( path.join( os.tmpdir(), 'stamp-textdomains-' ) );
		try {
			const routeDir = path.join( tmp, 'build', 'routes', 'dashboard' );
			mkdirSync( routeDir, { recursive: true } );

			const jsFile = path.join( routeDir, 'content.js' );
			const minFile = path.join( routeDir, 'content.min.js' );
			// wp-build emits the asset file next to the minified bundle only.
			const assetFile = path.join( routeDir, 'content.min.asset.php' );

			writeFileSync( jsFile, 'x = (0, import_i18n.__)("Hello");\n' );
			writeFileSync( minFile, 'var a=(0,e.__)("Hello");' );
			writeFileSync(
				assetFile,
				"<?php return array('dependencies' => array('wp-i18n'), 'version' => 'abc');\n"
			);

			const { count } = stampDir( path.join( tmp, 'build' ), DOMAIN );
			assert.equal( count, 2, 'both .js and .min.js stamped' );

			assert.ok(
				readFileSync( jsFile, 'utf8' ).includes( '"jetpack-videopress-pkg"' ),
				'unminified bundle stamped'
			);
			assert.ok(
				readFileSync( minFile, 'utf8' ).includes( '"jetpack-videopress-pkg"' ),
				'minified bundle stamped'
			);

			const asset = readFileSync( assetFile, 'utf8' );
			assert.equal(
				asset,
				`<?php return array('dependencies' => array('wp-i18n'), 'version' => '${ contentHash(
					minFile
				) }');\n`,
				'only the version changed, and it matches the stamped bytes'
			);
		} finally {
			rmSync( tmp, { recursive: true, force: true } );
		}
	} );

	it( 'refreshAssetVersion leaves a bundle with no paired asset file alone', () => {
		const tmp = mkdtempSync( path.join( os.tmpdir(), 'stamp-textdomains-' ) );
		try {
			const routeDir = path.join( tmp, 'build', 'routes', 'dashboard' );
			mkdirSync( routeDir, { recursive: true } );

			const jsFile = path.join( routeDir, 'content.js' );
			const minAssetFile = path.join( routeDir, 'content.min.asset.php' );
			writeFileSync( jsFile, 'x = 1;\n' );
			const minAssetSource = "<?php return array('version' => 'abc');\n";
			writeFileSync( minAssetFile, minAssetSource );

			assert.equal( refreshAssetVersion( jsFile ), false, 'content.js pairs with no asset file' );
			assert.equal(
				readFileSync( minAssetFile, 'utf8' ),
				minAssetSource,
				"the minified bundle's asset file is not the unminified bundle's"
			);
		} finally {
			rmSync( tmp, { recursive: true, force: true } );
		}
	} );

	it( 'refreshAssetVersion leaves an asset file with no version entry alone', () => {
		const tmp = mkdtempSync( path.join( os.tmpdir(), 'stamp-textdomains-' ) );
		try {
			const file = path.join( tmp, 'index.min.js' );
			const assetFile = path.join( tmp, 'index.min.asset.php' );
			writeFileSync( file, 'var a=1;' );
			const assetSource = "<?php return array('dependencies' => array());\n";
			writeFileSync( assetFile, assetSource );

			assert.equal( refreshAssetVersion( file ), false );
			assert.equal( readFileSync( assetFile, 'utf8' ), assetSource );
		} finally {
			rmSync( tmp, { recursive: true, force: true } );
		}
	} );

	it( 'the manifest lists only string-bearing non-min bundles, sorted, across subdirs', () => {
		const tmp = mkdtempSync( path.join( os.tmpdir(), 'stamp-textdomains-' ) );
		try {
			const buildDir = path.join( tmp, 'build' );
			const routeDir = path.join( buildDir, 'routes', 'dashboard' );
			const widgetDir = path.join( buildDir, 'widgets', 'latest-post' );
			const moduleDir = path.join( buildDir, 'modules', 'init' );
			mkdirSync( routeDir, { recursive: true } );
			mkdirSync( widgetDir, { recursive: true } );
			mkdirSync( moduleDir, { recursive: true } );

			// String-bearing bundles in three subdirs; the min variant must not be listed.
			writeFileSync(
				path.join( widgetDir, 'render.js' ),
				'x = (0, import_i18n.__)("Published %s");\n'
			);
			writeFileSync( path.join( routeDir, 'content.js' ), 'x = (0, i.__)("Hello");\n' );
			writeFileSync( path.join( routeDir, 'content.min.js' ), 'var a=(0,e.__)("Hello");' );
			// String-less bundle and non-JS files must not be listed.
			writeFileSync( path.join( moduleDir, 'index.js' ), 'export const answer = 42;\n' );
			writeFileSync( path.join( routeDir, 'content.asset.php' ), '<?php return array();\n' );

			const bundles = writeI18nManifest( buildDir, stampDir( buildDir, DOMAIN ).stringBearing );

			const expected = [
				'build/routes/dashboard/content.js',
				'build/widgets/latest-post/render.js',
			];
			assert.deepEqual( bundles, expected, 'returns the sorted string-bearing bundle list' );
			assert.deepEqual(
				JSON.parse( readFileSync( path.join( buildDir, I18N_MANIFEST ), 'utf8' ) ),
				{ bundles: expected },
				'manifest file holds the same list'
			);
		} finally {
			rmSync( tmp, { recursive: true, force: true } );
		}
	} );

	it( 'writeI18nManifest keys entries off the build directory name', () => {
		const tmp = mkdtempSync( path.join( os.tmpdir(), 'stamp-textdomains-' ) );
		try {
			const buildDir = path.join( tmp, 'output' );
			const routeDir = path.join( buildDir, 'routes', 'a' );
			mkdirSync( routeDir, { recursive: true } );
			writeFileSync( path.join( routeDir, 'content.js' ), 'x = (0, i.__)("Hi");\n' );

			assert.deepEqual( writeI18nManifest( buildDir, stampDir( buildDir, DOMAIN ).stringBearing ), [
				'output/routes/a/content.js',
			] );
		} finally {
			rmSync( tmp, { recursive: true, force: true } );
		}
	} );
} );

describe( 'stamp-textdomains cache', () => {
	const MAP = JSON.stringify( {
		version: 3,
		sources: [ 'src/index.js' ],
		names: [],
		mappings: 'AAAA',
	} );

	/**
	 * Write an unstamped wp-build-shaped tree: a sourcemapped module, a route pair
	 * with an asset file, and a string-less widget.
	 *
	 * @param {string} buildDir - Directory to create.
	 */
	function writeBuild( buildDir ) {
		const moduleDir = path.join( buildDir, 'modules', 'data' );
		const routeDir = path.join( buildDir, 'routes', 'dashboard' );
		const widgetDir = path.join( buildDir, 'widgets', 'plain' );
		for ( const dir of [ moduleDir, routeDir, widgetDir ] ) {
			mkdirSync( dir, { recursive: true } );
		}
		writeFileSync( path.join( moduleDir, 'index.js' ), 'x = (0, import_i18n.__)("Data");\n' );
		writeFileSync( path.join( moduleDir, 'index.js.map' ), MAP );
		writeFileSync( path.join( routeDir, 'content.js' ), 'x = (0, import_i18n.__)("Hello");\n' );
		writeFileSync( path.join( routeDir, 'content.min.js' ), 'var a=(0,e.__)("Hello");' );
		writeFileSync(
			path.join( routeDir, 'content.min.asset.php' ),
			"<?php return array('version' => 'abc');\n"
		);
		writeFileSync( path.join( widgetDir, 'render.js' ), 'export const answer = 42;\n' );
	}

	/**
	 * Read every file under a directory into a relative-path → contents map.
	 *
	 * @param {string} dir - Directory to snapshot.
	 * @return {object} The snapshot.
	 */
	function snapshot( dir ) {
		const files = {};
		walk( dir, file => {
			files[ path.relative( dir, file ) ] = readFileSync( file, 'utf8' );
		} );
		return files;
	}

	/**
	 * Run a callback with a fresh temp dir, removing it afterwards.
	 *
	 * @param {(tmp: string) => void} fn - Test body.
	 */
	function withTmp( fn ) {
		const tmp = mkdtempSync( path.join( os.tmpdir(), 'stamp-textdomains-cache-' ) );
		try {
			fn( tmp );
		} finally {
			rmSync( tmp, { recursive: true, force: true } );
		}
	}

	it( 'reproduces the uncached output byte for byte, cold and warm', () => {
		withTmp( tmp => {
			const cacheDir = path.join( tmp, 'cache' );
			const [ uncached, cold, warm ] = [ 'uncached', 'cold', 'warm' ].map( name => {
				const buildDir = path.join( tmp, name, 'build' );
				writeBuild( buildDir );
				const result = stampDir( buildDir, DOMAIN, name === 'uncached' ? {} : { cacheDir } );
				writeI18nManifest( buildDir, result.stringBearing );
				return { result, files: snapshot( buildDir ) };
			} );

			assert.deepEqual( cold.files, uncached.files );
			assert.deepEqual( warm.files, uncached.files );
			assert.equal( cold.result.reused, 0 );
			assert.equal( warm.result.reused, warm.result.count, 'every bundle reused' );
		} );
	} );

	it( 'restamps a changed bundle or source map and prunes the entries they replaced', () => {
		withTmp( tmp => {
			const cacheDir = path.join( tmp, 'cache' );
			const buildDir = path.join( tmp, 'build' );
			writeBuild( buildDir );
			const first = stampDir( buildDir, DOMAIN, { cacheDir } );

			rmSync( buildDir, { recursive: true } );
			writeBuild( buildDir );
			const changed = path.join( buildDir, 'routes', 'dashboard', 'content.js' );
			writeFileSync( changed, 'x = (0, import_i18n.__)("Changed");\n' );
			// A comment-only source edit: same bundle bytes, new map.
			const mapFile = path.join( buildDir, 'modules', 'data', 'index.js.map' );
			writeFileSync( mapFile, MAP.replace( 'src/index.js', 'src/renamed.js' ) );
			const second = stampDir( buildDir, DOMAIN, { cacheDir } );

			assert.equal( second.reused, first.count - 2 );
			assert.ok(
				readFileSync( changed, 'utf8' ).includes( '"Changed", "jetpack-videopress-pkg"' )
			);
			assert.ok( readFileSync( mapFile, 'utf8' ).includes( 'src/renamed.js' ) );
			assert.equal( readdirSync( cacheDir ).length, second.count, 'one entry per bundle' );
		} );
	} );

	it( 'toolFingerprint changes with a tool source or a transitive Babel dependency', () => {
		withTmp( tmp => {
			const writePackage = ( name, version, dependencies = {} ) => {
				const dir = path.join( tmp, 'node_modules', name );
				mkdirSync( dir, { recursive: true } );
				writeFileSync(
					path.join( dir, 'package.json' ),
					JSON.stringify( { name, version, dependencies } )
				);
			};
			writePackage( '@babel/core', '7.0.0', { '@babel/generator': '^7.0.0' } );
			writePackage( '@babel/generator', '7.0.0', { jsesc: '^3.0.0' } );
			writePackage( 'jsesc', '3.0.0' );
			const source = path.join( tmp, 'plugin.js' );
			writeFileSync( source, 'v1' );
			const fingerprint = () =>
				toolFingerprint( DOMAIN, { sources: [ source ], resolveFrom: tmp } );

			const original = fingerprint();
			writePackage( 'jsesc', '3.0.1' );
			const afterBump = fingerprint();
			writeFileSync( source, 'v2' );

			assert.notEqual( afterBump, original, 'a transitive dependency bump' );
			assert.notEqual( fingerprint(), afterBump, 'a tool source edit' );
		} );
	} );

	it( 'stampToolSources includes plugin files in subdirectories', () => {
		withTmp( tmp => {
			const helper = path.join( tmp, 'utils', 'helper.cjs' );
			mkdirSync( path.dirname( helper ) );
			writeFileSync( helper, '' );
			writeFileSync( path.join( tmp, 'README.md' ), '' );

			const sources = stampToolSources( tmp );
			assert.ok( sources.includes( helper ) );
			assert.ok( ! sources.includes( path.join( tmp, 'README.md' ) ) );
		} );
	} );

	it( 'does not reuse entries stamped for another domain', () => {
		withTmp( tmp => {
			const cacheDir = path.join( tmp, 'cache' );
			const buildDir = path.join( tmp, 'build' );
			writeBuild( buildDir );
			stampDir( buildDir, 'jetpack-other', { cacheDir } );

			rmSync( buildDir, { recursive: true } );
			writeBuild( buildDir );
			const { reused } = stampDir( buildDir, DOMAIN, { cacheDir } );

			assert.equal( reused, 0 );
			const route = path.join( buildDir, 'routes', 'dashboard', 'content.js' );
			assert.ok( ! readFileSync( route, 'utf8' ).includes( 'jetpack-other' ) );
		} );
	} );

	it( 'treats an unreadable entry as a miss', () => {
		withTmp( tmp => {
			const cacheDir = path.join( tmp, 'cache' );
			const buildDir = path.join( tmp, 'build' );
			writeBuild( buildDir );
			stampDir( buildDir, DOMAIN, { cacheDir } );
			const expected = snapshot( buildDir );
			for ( const name of readdirSync( cacheDir ) ) {
				writeFileSync( path.join( cacheDir, name ), '{"code":' );
			}

			rmSync( buildDir, { recursive: true } );
			writeBuild( buildDir );
			const { reused } = stampDir( buildDir, DOMAIN, { cacheDir } );

			assert.equal( reused, 0 );
			assert.deepEqual( snapshot( buildDir ), expected );
		} );
	} );

	it( 'still stamps when the cache directory cannot be created or written', () => {
		withTmp( tmp => {
			const expectedDir = path.join( tmp, 'expected', 'build' );
			writeBuild( expectedDir );
			stampDir( expectedDir, DOMAIN );
			const expected = snapshot( expectedDir );

			// A stale entry to prune, in a cache that turns read-only.
			const writableCache = path.join( tmp, 'cache' );
			const buildDir = path.join( tmp, 'build' );
			writeBuild( buildDir );
			writeFileSync(
				path.join( buildDir, 'routes', 'dashboard', 'content.js' ),
				'x = (0, import_i18n.__)("Stale");\n'
			);
			stampDir( buildDir, DOMAIN, { cacheDir: writableCache } );
			const lockedParent = path.join( tmp, 'locked' );
			mkdirSync( lockedParent );
			chmodSync( writableCache, 0o555 );
			chmodSync( lockedParent, 0o555 );
			try {
				for ( const cacheDir of [ writableCache, path.join( lockedParent, 'cache' ) ] ) {
					rmSync( buildDir, { recursive: true } );
					writeBuild( buildDir );
					stampDir( buildDir, DOMAIN, { cacheDir } );
					assert.deepEqual( snapshot( buildDir ), expected, cacheDir );
				}
			} finally {
				chmodSync( writableCache, 0o755 );
				chmodSync( lockedParent, 0o755 );
			}
		} );
	} );
} );
