#!/usr/bin/env node
/* global __dirname, process */

/**
 * Copy the boot module asset file into the consumer's build directory.
 *
 * When wp-build generates page templates, they reference a boot module asset
 * file at build/modules/boot/index.min.asset.php. This script copies the
 * built asset file from this package to that expected location.
 *
 * Run this from the consuming package's root directory after wp-build.
 */

const { cpSync, existsSync, mkdirSync } = require( 'fs' );
const path = require( 'path' );

const assetSource = path.join( __dirname, '..', 'build', 'modules', 'boot', 'index.asset.php' );
const targetDir = path.join( process.cwd(), 'build', 'modules', 'boot' );
const targetFile = path.join( targetDir, 'index.min.asset.php' );

if ( ! existsSync( assetSource ) ) {
	throw new Error(
		`Boot module asset file not found at ${ assetSource }. Ensure wp-build-polyfills has been built first.`
	);
}

mkdirSync( targetDir, { recursive: true } );
cpSync( assetSource, targetFile );
