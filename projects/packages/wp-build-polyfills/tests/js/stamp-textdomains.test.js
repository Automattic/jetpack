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

const { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } = require( 'fs' );
const assert = require( 'node:assert/strict' );
const os = require( 'node:os' );
const { describe, it } = require( 'node:test' );
const path = require( 'path' );
const { stampCode, stampDir } = require( '../../bin/stamp-textdomains-lib.js' );

const DOMAIN = 'jetpack-videopress-pkg';

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

	it( 'stampDir walks routes and rewrites both .js and .min.js, leaving .asset.php alone', () => {
		const tmp = mkdtempSync( path.join( os.tmpdir(), 'stamp-textdomains-' ) );
		try {
			const routeDir = path.join( tmp, 'build', 'routes', 'dashboard' );
			mkdirSync( routeDir, { recursive: true } );

			const jsFile = path.join( routeDir, 'content.js' );
			const minFile = path.join( routeDir, 'content.min.js' );
			const assetFile = path.join( routeDir, 'content.asset.php' );

			writeFileSync( jsFile, 'x = (0, import_i18n.__)("Hello");\n' );
			writeFileSync( minFile, 'var a=(0,e.__)("Hello");' );
			const assetSource =
				"<?php return array('dependencies' => array('wp-i18n'), 'version' => 'abc');\n";
			writeFileSync( assetFile, assetSource );

			const count = stampDir( path.join( tmp, 'build' ), DOMAIN );
			assert.equal( count, 2, 'both .js and .min.js stamped' );

			assert.ok(
				readFileSync( jsFile, 'utf8' ).includes( '"jetpack-videopress-pkg"' ),
				'unminified bundle stamped'
			);
			assert.ok(
				readFileSync( minFile, 'utf8' ).includes( '"jetpack-videopress-pkg"' ),
				'minified bundle stamped'
			);
			assert.equal( readFileSync( assetFile, 'utf8' ), assetSource, '.asset.php left untouched' );
		} finally {
			rmSync( tmp, { recursive: true, force: true } );
		}
	} );
} );
