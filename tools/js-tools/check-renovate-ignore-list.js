#!/usr/bin/env node

/* eslint-disable no-console, no-process-exit */
const chalk = require( 'chalk' );
const fs = require( 'fs' );
const glob = require( 'glob' );
const process = require( 'process' );
let exitCode = 0;

process.chdir( __dirname + '/../..' );

const line =
	fs
		.readFileSync( '.github/renovate.json', 'utf8' )
		.split( /\n/ )
		.indexOf( '\t\t\t"groupName": "Monorepo packages",' ) + 2;

/**
 * Output an error message.
 *
 * @param {string} msg - Error message.
 */
function error( msg ) {
	if ( process.env.CI ) {
		msg = `::error file=.github/renovate.json,line=${ line }::${ msg.replace( /\n/g, '%0A' ) }`;
	} else {
		msg = chalk.red( `.github/renovate.json:${ line }: ${ msg }` );
	}
	console.log( msg );
	exitCode = 1;
}

const packages = [];
packages.push(
	...glob
		.sync( 'projects/packages/*/composer.json' )
		.map( file => JSON.parse( fs.readFileSync( file, 'utf8' ) ).name )
);
packages.push(
	...glob
		.sync( 'projects/js-packages/*/package.json' )
		.map( file => JSON.parse( fs.readFileSync( file, 'utf8' ) ).name )
);
const list = JSON.parse( fs.readFileSync( '.github/renovate.json', 'utf8' ) ).packageRules.find(
	rule => rule.groupName === 'Monorepo packages'
).matchPackageNames;

const missing = packages.filter( v => ! list.includes( v ) );
if ( missing.length ) {
	error(
		`The following packages need to be added to renovate's "Monorepo packages" ignore list in .github/renovate.json: ${ missing.join(
			', '
		) }`
	);
}

const extra = list.filter( v => ! packages.includes( v ) );
if ( extra.length ) {
	error(
		`Renovate's "Monorepo packages" ignore list in .github/renovate.json contains extra packages: ${ extra.join(
			', '
		) }\nIf you want to ignore non-monorepo packages, do that in a separate group in .github/renovate.json.`
	);
}

const sorted = [ ...new Set( list ) ].sort();
if ( list.length !== sorted.length || ! list.every( ( v, k ) => v === sorted[ k ] ) ) {
	error(
		`Renovate's "Monorepo packages" ignore list in .github/renovate.json should be sorted alphabetically and should not contain duplicate package names.`
	);
}

process.exit( exitCode );
