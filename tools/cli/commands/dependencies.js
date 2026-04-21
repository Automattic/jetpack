import { spawn } from 'child_process';
import { chalkStderr } from 'chalk';
import ignore from 'ignore';
import {
	getDependencies,
	filterDeps,
	getBuildOrder,
	getDependencyDepths,
} from '../helpers/dependencyAnalysis.js';

// Files that mean --git-changed should report all projects as changed.
const infrastructureFileSets = {};
infrastructureFileSets.base = new Set( [
	'tools/cli/commands/dependencies.js',
	'tools/cli/helpers/dependencyAnalysis.js',
	'.github/actions/tool-setup/action.yml',
	'.github/actions/tool-setup/composer-plugin/composer.json',
	'.github/actions/tool-setup/composer-plugin/src/Plugin.php',
	'.github/actions/tool-setup/packagist-proxy.mjs',
	'.github/files/list-changed-projects.sh',
	'.github/versions.sh',
	// If pnpm stuff changed, we should build/test everything since we can't know what the change will affect.
	'pnpm-lock.yaml',
	'pnpm-workspace.yaml',
] );
infrastructureFileSets.test = new Set( [
	...infrastructureFileSets.base,
	'.github/files/generate-ci-matrix.php',
	'.github/files/coverage-munger/composer.json',
	'.github/files/coverage-munger/package.json',
	'.github/files/coverage-munger/extract-php-summary-data.php',
	'.github/files/coverage-munger/process-coverage.sh',
	'.github/files/coverage-munger/upload-coverage.sh',
	'.github/files/setup-wordpress-env.sh',
	'.github/workflows/tests.yml',
] );
infrastructureFileSets.build = new Set( [
	...infrastructureFileSets.base,
	'tools/cli/commands/build.js',
	'tools/cli/helpers/install.js',
	'tools/cli/helpers/projectHelpers.js',
	'.github/workflows/build.yml',
] );
infrastructureFileSets.e2e = {
	has( f ) {
		return (
			infrastructureFileSets.base.has( f ) ||
			f.startsWith( 'tools/e2e-commons/' ) ||
			f.startsWith( 'tools/docker/' )
		);
	},
};

// Files to ignore for --git-changed.
const ignoreFiles = [ '**/*.md', '**/*.txt' ];

// Patterns that, in certain conditions, should add extra projects to the dependency set.
const extraFileSets = {};
extraFileSets.base = {};
extraFileSets.e2e = {
	'^projects/plugins/jetpack/tests/e2e/specs/sync/': [ 'packages/sync' ],
};

export const command = 'dependencies <subcommand> [projects...]';
export const describe = 'Report monorepo project dependencies';

/**
 * Options definition for the dependencies subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 * @return {object} Yargs with the build commands defined.
 */
export function builder( yargs ) {
	return yargs
		.positional( 'subcommand', {
			describe:
				'Whether to print `json` dependency data, a `list` of projects, print a `build-order`, or calculate `depths`.',
			type: 'string',
			choices: [ 'json', 'list', 'build-order', 'depths' ],
		} )
		.positional( 'projects', {
			describe: 'Only include dependencies relevant to these projects.',
			type: 'string',
		} )
		.option( 'git-changed', {
			describe: 'Include projects changed in git. Value is as appropriate for `git diff`.',
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
			choices: [ 'build', 'test', 'e2e' ],
		} )
		.option( 'targets', {
			describe: 'Targets for `depth`, comma-separated.',
			type: 'string',
		} )
		.option( 'ignore-root', {
			describe: 'Ignore the monorepo root.',
			type: 'boolean',
		} )
		.option( 'dev', { type: 'boolean', hidden: true } )
		.option( 'no-dev', {
			describe: 'Do not consider dev dependencies.',
			type: 'boolean',
		} )
		.option( 'pretty', {
			describe: 'Pretty-print JSON, build-order, or depths output.',
			type: 'boolean',
		} );
}

/**
 * Handles the dependencies command.
 *
 * @param {object} argv - the arguments passed.
 */
export async function handler( argv ) {
	let deps = await getDependencies( process.cwd(), argv.extra, argv.dev === false );

	if ( argv.ignoreRoot ) {
		deps.delete( 'monorepo' );
	}

	if ( argv.gitChanged ) {
		const stdout = await new Promise( ( resolve, reject ) => {
			// eslint-disable-next-line no-shadow
			let stdout = '';
			const p = spawn(
				'git',
				[
					'-c',
					'core.quotepath=off',
					'diff',
					'--no-renames',
					'--name-only',
					argv.gitChanged,
					'--',
				],
				{
					cwd: process.cwd(),
					stdio: [ 'ignore', 'pipe', 'inherit' ],
				}
			);
			p.stdout.on( 'data', data => {
				stdout += data;
			} );
			p.on( 'error', reject );
			p.on( 'close', code =>
				code === 0 ? resolve( stdout ) : reject( new Error( `Git exited with code ${ code }` ) )
			);
		} );

		const infrastructureFiles = infrastructureFileSets[ argv.extra ] || infrastructureFileSets.base;
		const extraFiles = Object.entries( extraFileSets[ argv.extra ] || extraFileSets.base ).map(
			( [ k, v ] ) => [ new RegExp( k ), v ]
		);
		const projset = new Set( argv.projects );
		const ig = ignore().add( ignoreFiles );
		const debug = argv.v ? m => console.error( chalkStderr.blue( m ) ) : () => {};
		for ( const file of stdout.split( '\n' ).filter( v => v.length ) ) {
			if ( infrastructureFiles.has( file ) ) {
				debug( `Diff touches infrastructure file ${ file }, considering all projects as changed.` );
				Array.from( deps.keys() ).forEach( k => projset.add( k ) );
				break;
			}
			const slug = file.match( /^projects\/([^/]+\/[^/]+)\// )?.[ 1 ] || 'monorepo';
			if ( ! projset.has( slug ) ) {
				if ( ig.ignores( file ) ) {
					debug( `Diff touches ${ file }, which is on the ignore list.` );
				} else {
					debug( `Diff touches ${ file }, marking ${ slug } as changed.` );
					projset.add( slug );
				}
			}
			for ( const [ re, extraprojs ] of extraFiles ) {
				if ( file.match( re ) ) {
					for ( const extraproj of extraprojs ) {
						if ( ! projset.has( extraproj ) ) {
							debug( `Diff touches ${ file }, marking ${ extraproj } as changed.` );
							projset.add( extraproj );
						}
					}
				}
			}
		}
		argv.projects = [ ...projset ];

		// If the diff touched nothing, we output nothing.
		if ( projset.size === 0 ) {
			deps.clear();
		}
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
	} else if ( argv.subcommand === 'list' ) {
		if ( deps.size ) {
			console.log( Array.from( deps.keys() ).join( '\n' ) );
		}
	} else if ( argv.subcommand === 'build-order' ) {
		const order = getBuildOrder( deps );
		for ( const group of order ) {
			console.log( Array.from( group ).join( argv.pretty ? '\n' : ' ' ) );
		}
	} else if ( argv.subcommand === 'depths' ) {
		const depths = getDependencyDepths(
			deps,
			String( argv.targets ?? '' )
				.split( ',' )
				.map( v => v.trim() )
		);
		if ( argv.pretty ) {
			const tiers = new Map();
			for ( const [ p, d ] of depths.entries() ) {
				if ( ! tiers.has( d ) ) {
					tiers.set( d, [] );
				}
				tiers.get( d ).push( p );
			}
			const keys = tiers
				.keys()
				.toArray()
				.sort( ( a, b ) => Math.sign( b - a ) || 0 );
			for ( const d of keys ) {
				console.log( d, tiers.get( d ).sort().join( ' ' ) );
			}
		} else {
			const entries = depths
				.entries()
				.toArray()
				.sort( ( [ p1, d1 ], [ p2, d2 ] ) => Math.sign( d2 - d1 ) || p1.localeCompare( p2 ) );
			for ( const [ p, d ] of entries ) {
				console.log( p, d );
			}
		}
	}
}
