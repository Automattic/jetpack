#!/usr/bin/env node

/* eslint-disable no-console -- Command-line script that reports progress. */

/**
 * Regenerates src/babel/wp-polyfill-modules.json: the core-js modules that the `wp-polyfill` script
 * of each supported WordPress release contains, plus the nightly build.
 */

import fs from 'node:fs';
import path from 'node:path';

const VERSIONS_FILE = path.resolve( import.meta.dirname, '../../../../.github/versions.sh' );
const OUTPUT_FILE = path.resolve( import.meta.dirname, '../src/babel/wp-polyfill-modules.json' );
const KNOWN_RELEASES_FILE = path.resolve( import.meta.dirname, './known-releases.json' );

const knownReleases = JSON.parse( fs.readFileSync( KNOWN_RELEASES_FILE, 'utf8' ) );

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
 * Look up release polyfill info in `known-releases.json`.
 *
 * @param {string} version - WordPress version, e.g. `'7.0.7'`.
 * @return {{corejs: string, modules: string[]}|undefined} Release info, if known.
 */
function getKnownRelease( version ) {
	// Assume polyfills remain unchanged within each minor version.
	const [ major, minor ] = version.split( '.' );
	return knownReleases[ [ major, minor ].join( '.' ) ] ?? undefined;
}

/**
 * Parse the module list from the `modules:` comment in a core-js bundle's header.
 *
 * @param {string} bundle - Bundle source.
 * @return {string[]|undefined} Module names, e.g. `[ 'es.promise.try', 'web.url.parse' ]`, if listed.
 */
function parseModulesFromComment( bundle ) {
	const startMarker = '* modules:';
	const start = bundle.indexOf( startMarker );
	const end = bundle.indexOf( '*/', start );
	if ( start === -1 || end === -1 ) {
		return undefined;
	}
	return bundle
		.slice( start + startMarker.length, end )
		.split( '\n' )
		.map( line => line.trim() )
		.map( line => ( line.startsWith( '*' ) ? line.slice( 1 ).trim() : line ) )
		.filter( line => line !== '' );
}

/**
 * Parse the core-js version from the header comment of a core-js bundle.
 *
 * @param {string} bundle - Bundle source.
 * @return {string} Version, e.g. `'3.39.0'`.
 */
function parseCoreJsVersionFromComment( bundle ) {
	const startMarker = '* core-js ';
	const start = bundle.indexOf( startMarker );
	if ( start === -1 ) {
		throw new Error( 'No core-js version found in bundle' );
	}
	return bundle
		.slice( start + startMarker.length )
		.split( '\n' )[ 0 ]
		.trim();
}

/**
 * Get polyfill info from a WordPress build's `wp-polyfill.js` bundle.
 *
 * @param {string} svnPath - Path in the core SVN repo, e.g. `'tags/7.0.7'` or `'trunk'`.
 * @return {Promise<{corejs: string, modules: string[]|undefined}>} Bundle info.
 */
async function getBundleInfo( svnPath ) {
	const bundle = await fetchText(
		`https://core.svn.wordpress.org/${ svnPath }/wp-includes/js/dist/vendor/wp-polyfill.js`
	);

	return {
		corejs: parseCoreJsVersionFromComment( bundle ),
		modules: parseModulesFromComment( bundle ),
	};
}

const { min, releases } = await getSupportedReleases();
const modulesByRelease = {};
for ( const version of releases ) {
	let coreJsVersion;

	const knownRelease = getKnownRelease( version );
	if ( knownRelease ) {
		modulesByRelease[ version ] = knownRelease.modules;
		coreJsVersion = knownRelease.corejs;
	} else {
		const { corejs, modules } = await getBundleInfo( `tags/${ version }` );
		if ( ! modules ) {
			throw new Error( `WordPress ${ version }: no modules comment in wp-polyfill.js` );
		}
		modulesByRelease[ version ] = modules;
		coreJsVersion = corejs;
	}

	console.log(
		`WordPress ${ version } (core-js ${ coreJsVersion }): ${ modulesByRelease[ version ].length } modules`
	);
}

const nightly = await getBundleInfo( 'trunk' );
// At time of writing, Core nightly releases still don't include the module metadata.
// Instead of aborting the script, skip the nightly polyfill info, for now.
// Once Core nightly releases start including the metadata, this check can be removed.
if ( nightly.modules ) {
	modulesByRelease.nightly = nightly.modules;
	console.log(
		`WordPress nightly (core-js ${ nightly.corejs }): ${ nightly.modules.length } modules`
	);
} else {
	console.log( `WordPress nightly (core-js ${ nightly.corejs }): no module metadata, skipping` );
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
