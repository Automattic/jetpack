#!/usr/bin/env node

/* eslint-env node */
/* eslint-disable no-console */

const fs = require( 'fs' );
const chalk = require( 'chalk' );
const { glob } = require( 'glob' );
const YAML = require( 'yaml' );

const isCI = !! process.env.CI;

// Chalk detects CI and disables itself. We don't want that.
if ( ! chalk.level && isCI ) {
	chalk.level = 1;
}

const runHint =
	'Use an environment variable in run steps instead, it\'s safer.\n\nEXAMPLE: Instead of\n\n\trun: echo "${{ context.foobar }}"\n\ndo it like\n\n\tenv:\n\t\tFOOBAR: ${{ context.foobar }}\n\trun: echo "${FOOBAR}"';
const hints = {};

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
const error = ( file, line, msg, hint ) => {
	process.exitCode = 1;
	if ( isCI ) {
		if ( hint ) {
			msg += ' ' + hint;
		}
		console.log( `::error file=${ file },line=${ line }::${ msg.replace( /\n/g, '%0A' ) }` );
	} else {
		console.error( chalk.white.bgRed( `${ file }:${ line }: ${ msg }` ) );
		if ( hint ) {
			hints[ hint ] = true;
		}
	}
};

/**
 * Get the line number of a node.
 *
 * @param {YAML.Node} node - Node being checked.
 * @param {string}         fileContents - Contents of the file.
 * @returns {number} Line number.
 */
function yamlLine( node, fileContents ) {
	return fileContents.slice( 0, node.range[ 0 ] ).split( /\n/ ).length;
}

/**
 * Check GitHub Action data for context substitution inside a run step.
 *
 * @param {string}         file - Filename being checked.
 * @param {string}         fileContents - Contents of the file.
 * @param {string}         path - Path to the node.
 * @param {YAML.Node} node - Node being checked.
 */
function checkRunStepsForExpressions( file, fileContents, path, node ) {
	if ( node instanceof YAML.YAMLMap ) {
		const run = node.get( 'run', true );
		if ( run && run.value.indexOf( '${{' ) >= 0 ) {
			const extra = node.get( 'name' ) ? ` (step "${ node.get( 'name' ) }")` : '';
			error(
				file,
				yamlLine( run, fileContents ),
				`Context expression substitution detected in run step at ${ path }.run${ extra }.`,
				runHint
			);
		}

		node.items.forEach( v =>
			checkRunStepsForExpressions( file, fileContents, `${ path }.${ v.key.value }`, v.value )
		);
	} else if ( node instanceof YAML.YAMLSeq ) {
		node.items.forEach( ( v, i ) =>
			checkRunStepsForExpressions( file, fileContents, `${ path }[${ i }]`, v )
		);
	}
}

/**
 * Check GitHub Action workflows for standard format concurrency groups.
 *
 * @param {string} file - Filename being checked.
 * @param {string} fileContents - Contents of the file.
 * @param {*}      node - Node being checked.
 */
function checkConcurrencyGroup( file, fileContents, node ) {
	const m = file.match( /^\.github\/workflows\/([^/]+)\.ya?ml$/ );
	if ( ! m ) {
		// Not a workflow, ignore.
		return;
	}
	const basename = m[ 1 ];

	let grouptext, groupline;

	const concurrency = node.get( 'concurrency', true );
	if ( ! concurrency ) {
		return;
	}
	if ( concurrency instanceof YAML.Scalar ) {
		groupline = yamlLine( concurrency, fileContents );
		grouptext = concurrency.value;
	} else if ( concurrency instanceof YAML.YAMLMap ) {
		const concurrencyGroup = concurrency.get( 'group', true );
		if ( ! concurrencyGroup ) {
			error(
				file,
				yamlLine( concurrency, fileContents ),
				'When `concurrency` is a map, it needs to contain a `group`.'
			);
			return;
		}
		if ( ! ( concurrencyGroup instanceof YAML.Scalar ) ) {
			error(
				file,
				yamlLine( concurrencyGroup, fileContents ),
				'Node `concurrency.group` is supposed to be a scalar.'
			);
			return;
		}
		groupline = yamlLine( concurrencyGroup, fileContents );
		grouptext = concurrencyGroup.value;
	} else {
		error(
			file,
			yamlLine( concurrency, fileContents ),
			'Node `concurrency` is supposed to be a map or a scalar.'
		);
		return;
	}

	if ( ! grouptext.startsWith( basename + '-' ) ) {
		error(
			file,
			groupline,
			`Workflow concurrency group needs to start with "${ basename }-" (matching the filename) to avoid unexpected collisions.`
		);
	}
	if (
		grouptext.match( /\$\{\{\s*github\.ref\s*\}\}/ ) &&
		node.hasIn( [ 'on', 'pull_request_target' ] )
	) {
		error(
			file,
			groupline,
			'Workflow concurrency group uses `${{ github.ref }}` and the workflow uses `on.pull_request_target`.\nThis is liable to break, see https://github.com/Automattic/jetpack/pull/21435.'
		);
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

	checkRunStepsForExpressions( file, fileContents, '', doc.contents );
	checkConcurrencyGroup( file, fileContents, doc.contents );
} );

if ( ! isCI && Object.keys( hints ).length ) {
	for ( const h of Object.keys( hints ) ) {
		console.log( chalk.green( `\n${ h }\n` ) );
	}
}
