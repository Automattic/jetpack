#!/usr/bin/env node

/* eslint-env node */
/* eslint-disable no-console */

const chalk = require( 'chalk' );
const fs = require( 'fs' );
const glob = require( 'glob' );
const YAML = require( 'yaml' );
const { YAMLMap, YAMLSeq } = require( 'yaml/types' );

const isCI = !! process.env.CI;

// Chalk detects CI and disables itself. We don't want that.
if ( ! chalk.level && isCI ) {
	chalk.level = 1;
}

const hint =
	'Use an environment variable instead, it\'s safer.\n\nEXAMPLE: Instead of\n\n\trun: echo "${{ context.foobar }}"\n\ndo it like\n\n\tenv:\n\t\tFOOBAR: ${{ context.foobar }}\n\trun: echo "${FOOBAR}"';

let verbose = false;
const files = [];
process.argv.slice( 2 ).forEach( arg => {
	if ( arg === '-v' ) {
		verbose = true;
	} else {
		files.push( ...glob.sync( arg ) );
	}
} );

const debug = msg => {
	if ( verbose ) {
		// Grey doesn't work well in GitHub's output
		console.log( chalk[ isCI ? 'blue' : 'gray' ]( msg ) );
	}
};
const error = ( file, line, msg ) => {
	process.exitCode = 1;
	if ( isCI ) {
		msg += ' ' + hint;
		console.log( `::error file=${ file },line=${ line }::${ msg.replace( /\n/g, '%0A' ) }` );
	} else {
		console.error( chalk.white.bgRed( `${ file }:${ line }: ${ msg }` ) );
	}
};

/**
 * Check GitHub Action data for context substitution inside a run step.
 *
 * @param {string} file - Filename being checked.
 * @param {string} fileContents - Contents of the file.
 * @param {string} path - Path to the node.
 * @param {*}      node - Node being checked.
 */
function checkAction( file, fileContents, path, node ) {
	if ( node instanceof YAMLMap ) {
		const run = node.get( 'run', true );
		if ( run && run.value.indexOf( '${{' ) >= 0 ) {
			const extra = node.get( 'name' ) ? ` (step "${ node.get( 'name' ) }")` : '';
			const line = fileContents.substr( 0, run.range[ 0 ] ).split( /\n/ ).length;
			error(
				file,
				line,
				`Context expression substitution detected in run step at ${ path }.run${ extra }.`
			);
		}

		node.items.forEach( v =>
			checkAction( file, fileContents, `${ path }.${ v.key.value }`, v.value )
		);
	} else if ( node instanceof YAMLSeq ) {
		node.items.forEach( ( v, i ) => checkAction( file, fileContents, `${ path }[${ i }]`, v ) );
	}
}

files.forEach( file => {
	debug( `Checking ${ file }` );
	const fileContents = fs.readFileSync( file, 'utf8' );
	const doc = YAML.parseDocument( fileContents );

	if ( doc.errors.length ) {
		doc.errors.forEach( e => {
			const line = fileContents.substr( 0, e.source.range.start ).split( /\n/ ).length;
			error( file, line, `${ e.name }: ${ e.message }` );
		} );
	}

	checkAction( file, fileContents, '', doc.contents );
} );

if ( ! isCI && process.exitCode ) {
	console.log( chalk.green( `\n${ hint }\n` ) );
}
