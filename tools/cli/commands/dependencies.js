/**
 * Internal dependencies
 */
import { getDependencies, filterDeps, getBuildOrder } from '../helpers/dependencyAnalysis.js';

export const command = 'dependencies <subcommand> [projects...]';
export const describe = 'Report monorepo project dependencies';

/**
 * Options definition for the dependencies subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 * @returns {object} Yargs with the build commands defined.
 */
export function builder( yargs ) {
	return yargs
		.positional( 'subcommand', {
			describe:
				'Whether to print `json` dependency data, a `list` of projects, or print a `build-order`.',
			type: 'string',
			choices: [ 'json', 'list', 'build-order' ],
		} )
		.positional( 'projects', {
			describe: 'Only include dependencies relevant to these projects.',
			type: 'string',
		} )
		.option( 'add-dependencies', {
			describe: 'Include the dependencies of the named projects.',
			type: 'boolean',
		} )
		.option( 'add-dependents', {
			describe: 'Include the dependents of the named projects.',
			type: 'boolean',
		} )
		.option( 'extra', {
			describe: 'Extra dependencies to consider.',
			type: 'string',
			choices: [ 'build', 'test' ],
		} )
		.option( 'ignore-root', {
			describe: 'Ignore the monorepo root.',
			type: 'boolean',
		} )
		.option( 'pretty', {
			describe: 'Pretty-print JSON or build-order output.',
			type: 'boolean',
		} );
}

/**
 * Handles the dependencies command.
 *
 * @param {object} argv - the arguments passed.
 */
export async function handler( argv ) {
	let deps = await getDependencies( process.cwd(), argv.extra );

	if ( argv.ignoreRoot ) {
		deps.delete( 'monorepo' );
	}

	if ( argv.projects.length ) {
		deps = filterDeps( deps, argv.projects, {
			dependencies: argv.addDependencies,
			dependents: argv.addDependents,
		} );
	}

	if ( argv.subcommand === 'json' ) {
		console.log(
			JSON.stringify(
				deps,
				( k, v ) => {
					if ( v instanceof Map ) {
						return Object.fromEntries( v.entries() );
					}
					if ( v instanceof Set ) {
						return [ ...v ];
					}
					return v;
				},
				argv.pretty ? '\t' : null
			)
		);
		return;
	}

	if ( argv.subcommand === 'list' ) {
		console.log( Array.from( deps.keys() ).join( '\n' ) );
		return;
	}

	if ( argv.subcommand === 'build-order' ) {
		const order = getBuildOrder( deps );
		for ( const group of order ) {
			console.log( Array.from( group ).join( argv.pretty ? '\n' : ' ' ) );
		}
		return;
	}
}
