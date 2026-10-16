#!/usr/bin/env node

/* eslint-disable no-console -- Command-line script that reports progress. */

/**
 * Regenerates src/babel/wp-polyfill-modules.json: the core-js modules that the `wp-polyfill` script
 * of each supported WordPress release contains.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const VERSIONS_FILE = path.resolve( import.meta.dirname, '../../../../.github/versions.sh' );
const OUTPUT_FILE = path.resolve( import.meta.dirname, '../src/babel/wp-polyfill-modules.json' );

// How core-js modules install a polyfill. Every such call in a bundle must come from a matched module.
const INSTALL_CALLS =
	/\$\(\{ ?(?:global|target)[^\n]*|exportTypedArray(?:Static)?Method\('[^']+'|defineBuiltInAccessor\([^,()]+, '[^']+'/g;

const debug = process.argv.includes( '--debug' );

/**
 * Fetch a URL's body as text.
 *
 * @param {string} url - URL.
 * @return {Promise<string>} Body.
 */
async function fetchText( url ) {
	const response = await fetch( url );
	if ( ! response.ok ) {
		throw new Error( `${ url }: HTTP ${ response.status }` );
	}
	return response.text();
}

/**
 * Get the latest release of each WordPress branch the monorepo supports.
 *
 * @return {Promise<string[]>} Versions, e.g. `[ '7.0.7', '7.1.3' ]`.
 */
async function getSupportedReleases() {
	const min = fs.readFileSync( VERSIONS_FILE, 'utf8' ).match( /^MIN_WP_VERSION=([\d.]+)$/m )?.[ 1 ];
	if ( ! min ) {
		throw new Error( `No MIN_WP_VERSION in ${ VERSIONS_FILE }` );
	}
	const parse = version => version.split( '.' ).map( Number );
	const [ minMajor, minMinor ] = parse( min );

	const { offers } = JSON.parse(
		await fetchText( 'https://api.wordpress.org/core/version-check/1.7/' )
	);
	const latestByBranch = new Map();
	for ( const { current } of offers ) {
		const [ major, minor, patch = 0 ] = parse( current );
		const branch = `${ major }.${ minor }`;
		const latest = latestByBranch.get( branch );
		const isSupported = major > minMajor || ( major === minMajor && minor >= minMinor );
		if ( isSupported && ( ! latest || patch > parse( latest )[ 2 ] ) ) {
			latestByBranch.set( branch, current );
		}
	}
	return { min, releases: [ ...latestByBranch.values() ].sort() };
}

/**
 * Download and unpack a core-js release.
 *
 * @param {string} version - Version, e.g. `3.39.0`.
 * @param {string} tmpDir  - Directory to unpack it in.
 * @return {Promise<string>} Path of its `modules` directory.
 */
async function getCoreJsModules( version, tmpDir ) {
	const response = await fetch( `https://registry.npmjs.org/core-js/-/core-js-${ version }.tgz` );
	if ( ! response.ok ) {
		throw new Error( `core-js ${ version }: HTTP ${ response.status }` );
	}
	const dir = path.join( tmpDir, `core-js-${ version }` );
	fs.mkdirSync( dir );
	const tarball = path.join( dir, 'package.tgz' );
	fs.writeFileSync( tarball, Buffer.from( await response.arrayBuffer() ) );
	execFileSync( 'tar', [ '-xzf', tarball, '-C', dir ] );
	return path.join( dir, 'package', 'modules' );
}

/**
 * Normalize code so a core-js module's source can be found inside a bundle built from it.
 *
 * @param {string} code - Code.
 * @return {string} Normalized code.
 */
function normalize( code ) {
	// The bundle turns each `require( … )` into a `__webpack_require__( N )`.
	return code
		.replace(
			/__webpack_require__\(\s*(?:\/\*[^*]*\*\/\s*)?\d+\s*\)|require\('[^']+'\)/g,
			'REQUIRE'
		)
		.replace( /^'use strict';\n/m, '' )
		.replace( /\s+/g, ' ' )
		.trim();
}

/**
 * Find the core-js modules a `wp-polyfill` bundle contains.
 *
 * @param {string} bundle     - Bundle source.
 * @param {string} modulesDir - Path of the matching core-js release's `modules` directory.
 * @return {string[]} Module names.
 */
function findModules( bundle, modulesDir ) {
	const normalizedBundle = normalize( bundle );
	const found = fs
		.readdirSync( modulesDir )
		.filter( file => /^(es|web)\./.test( file ) )
		.filter( file =>
			normalizedBundle.includes(
				normalize( fs.readFileSync( path.join( modulesDir, file ), 'utf8' ) )
			)
		);

	// Look for any polyfills that didn't show up in our matching.
	const unaccounted = bundle.match( INSTALL_CALLS ) ?? [];
	for ( const file of found ) {
		const source = fs.readFileSync( path.join( modulesDir, file ), 'utf8' );
		for ( const call of source.match( INSTALL_CALLS ) ?? [] ) {
			unaccounted.splice( unaccounted.indexOf( call ), 1 );
		}
	}
	// Abort if we have anything unaccounted for, since that could mean accidentally
	// dropping polyfills we need.
	if ( unaccounted.length ) {
		throw new Error( `Polyfills not matched to a core-js module:\n${ unaccounted.join( '\n' ) }` );
	}
	return found.map( file => path.basename( file, '.js' ) ).sort();
}

const tmpDir = fs.mkdtempSync( path.join( os.tmpdir(), 'wp-polyfill-modules-' ) );
try {
	const { min, releases } = await getSupportedReleases();
	const coreJsByVersion = new Map();
	const modulesByRelease = {};
	for ( const release of releases ) {
		const bundle = await fetchText(
			`https://core.svn.wordpress.org/tags/${ release }/wp-includes/js/dist/vendor/wp-polyfill.js`
		);
		const coreJsVersion = bundle.match( /core-js (\d+\.\d+\.\d+)/ )?.[ 1 ];
		if ( ! coreJsVersion ) {
			throw new Error( `WordPress ${ release }: no core-js version in wp-polyfill.js` );
		}
		if ( ! coreJsByVersion.has( coreJsVersion ) ) {
			coreJsByVersion.set( coreJsVersion, await getCoreJsModules( coreJsVersion, tmpDir ) );
		}
		modulesByRelease[ release ] = findModules( bundle, coreJsByVersion.get( coreJsVersion ) );
		console.log(
			`WordPress ${ release } (core-js ${ coreJsVersion }): ${ modulesByRelease[ release ].length } modules`
		);
	}

	const modules = [ ...new Set( Object.values( modulesByRelease ).flat() ) ].sort();
	fs.writeFileSync(
		OUTPUT_FILE,
		JSON.stringify( { minWordPressVersion: min, modules }, null, '\t' ) + '\n'
	);
	console.log(
		`Wrote ${ modules.length } modules to ${ path.relative( process.cwd(), OUTPUT_FILE ) }`
	);

	if ( debug ) {
		console.log( '\nModules included per release:\n' );
		Object.entries( modulesByRelease ).forEach( ( [ rel, mod ] ) => {
			console.log( `${ rel }: ${ ( mod || [] ).join( ', ' ) }\n` );
		} );
	}
} finally {
	fs.rmSync( tmpDir, { recursive: true, force: true } );
}
