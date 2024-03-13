import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import chalk from 'chalk';
import { execa } from 'execa';
import Listr from 'listr';
import UpdateRenderer from 'listr-update-renderer';
import VerboseRenderer from 'listr-verbose-renderer';
import { getInstallArgs, projectDir } from '../helpers/install.js';
import { coerceConcurrency } from '../helpers/normalizeArgv.js';
import PrefixStream from '../helpers/prefix-stream.js';
import { allProjects } from '../helpers/projectHelpers.js';
import promptForProject from '../helpers/promptForProject.js';

export const command = 'phan [project...]';
export const describe = 'Run Phan on a monorepo project';

/**
 * Options definition for the phan subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 * @returns {object} Yargs with the phan commands defined.
 */
export function builder( yargs ) {
	return yargs
		.positional( 'project', {
			describe:
				'Project in the form of type/name, e.g. plugins/jetpack, or "monorepo" for code outside of the projects.',
			type: 'string',
		} )
		.option( 'all', {
			alias: 'a',
			type: 'boolean',
			description: 'Run phan on everything.',
		} )
		.option( 'no-baseline', {
			type: 'boolean',
			description: 'Do not use the baseline file.',
		} )
		.option( 'update-baseline', {
			type: 'boolean',
			description: 'Update the Phan baselines.',
		} )
		.option( 'no-use-uncommitted-composer-lock', {
			type: 'boolean',
			description: "Don't use uncommitted composer.lock files.",
		} )
		.option( 'concurrency', {
			type: 'number',
			description: 'Maximum number of phan tasks to run at once. Ignored with `--verbose`.',
			default: os.cpus().length,
			coerce: coerceConcurrency,
		} )
		.option( 'format', {
			type: 'string',
			description: 'Issue output format.',
			choices: [ 'text', 'emacs', 'github', 'json' ],
			default: 'text',
		} )
		.option( 'width', {
			type: 'number',
			description: 'Report width (for text format).',
			default: process.stdout.columns || process.stderr.columns || Infinity,
		} )
		.option( 'automatic-fix', {
			type: 'boolean',
			description: "Enable Phan's automatic fixing.",
		} )
		.option( 'allow-polyfill-parser', {
			type: 'boolean',
			description: "Allow Phan's polyfill parser. May cause false positives and false negatives.",
		} )
		.option( 'force-polyfill-parser', {
			type: 'boolean',
			description: "Force Phan's polyfill parser. May cause false positives and false negatives.",
		} )
		.option( 'debug', {
			type: 'boolean',
			description: 'Pass --debug to Phan.',
		} )
		.option( 'include-analysis-file-list', {
			type: 'string',
			description: 'Comma-separated list of files to analyze.',
		} )
		.check( argv => {
			if (
				argv.updateBaseline &&
				( argv[ 'allow-polyfill-parser' ] || argv[ 'force-polyfill-parser' ] )
			) {
				throw new Error(
					chalk.red(
						'Cannot use --update-baseline along with --allow-polyfill-parser or --force-polyfill-parser.\nThe polyfill parser has false negatives, which saved to the baseline would cause trouble in CI.'
					)
				);
			}
			return true;
		} );
}

/**
 * Entry point for the CLI.
 *
 * @param {object} argv - The argv for the command line.
 */
export async function handler( argv ) {
	if ( argv.project.length === 1 && argv.project[ 0 ] !== 'monorepo' ) {
		if ( argv.project[ 0 ].indexOf( '/' ) < 0 ) {
			argv.type = argv.project[ 0 ];
			argv.project = [];
		}
	}

	const checkFilesByProject = {};
	if ( argv[ 'include-analysis-file-list' ] ) {
		for ( const f of argv[ 'include-analysis-file-list' ]
			.split( ',' )
			.map( v => path.relative( process.cwd(), v ) ) ) {
			if ( ! f.startsWith( 'projects/' ) ) {
				argv.project.push( 'monorepo' );
				checkFilesByProject.monorepo ??= [];
				checkFilesByProject.monorepo.push( f );
				continue;
			}
			const m = f.match( /^projects\/([^/]+\/[^/]+)\/(.+)$/ );
			if ( m ) {
				checkFilesByProject[ m[ 1 ] ] ??= [];
				checkFilesByProject[ m[ 1 ] ].push( m[ 2 ] );
				continue;
			}
			console.error(
				chalk.red(
					`Ignoring --include-analysis-file-list file ${ f }, as it doesn't seem to belong to anything`
				)
			);
		}

		argv.all = false;
		if ( argv.project.length > 0 ) {
			for ( const p of argv.project.filter( v => ! checkFilesByProject[ v ] ) ) {
				console.error(
					chalk.red(
						`Ignoring project ${ p }, as no file in --include-analysis-file-list is included in it`
					)
				);
			}
			for ( const p of Object.keys( checkFilesByProject ).filter(
				v => argv.project.indexOf( v ) < 0
			) ) {
				for ( const f of checkFilesByProject[ p ] ) {
					console.error(
						chalk.red(
							`Ignoring --include-analysis-file-list file ${ f }, as its project ${ p } is not listed`
						)
					);
				}
				delete checkFilesByProject[ p ];
			}
		}
		argv.project = Object.keys( checkFilesByProject );
		if ( argv.project.length === 0 ) {
			console.error( chalk.red( `Everything was ignored` ) );
			return;
		}
	}

	if ( argv.all ) {
		argv.project = allProjects();
		argv.project.unshift( 'monorepo' );
	}

	if ( argv.project.length === 0 ) {
		argv.project = '';
		argv = await promptForProject( argv );
		argv.project = [ argv.project ];
	}

	argv.useUncommittedComposerLock = argv.useUncommittedComposerLock !== false;

	const composerStdio = argv.v
		? [ 'ignore', 'inherit', 'inherit' ]
		: [ 'ignore', 'ignore', 'ignore' ];
	const tasks = [];

	// Need to composer install in the monorepo root first.
	const rootInstall = execa( 'composer', await getInstallArgs( 'monorepo', 'composer', argv ), {
		cwd: process.cwd(),
		stdio: composerStdio,
	} );
	tasks.push( {
		title: `Installing composer dependencies in the monorepo root`,
		task: async () => rootInstall,
	} );

	// Abuse the skip function to have all other tasks wait on the root install.
	const skipFunction = async () => {
		await rootInstall;
		return false;
	};

	const phanPath = path.join( process.cwd(), 'vendor/bin/phan' );
	const phanArgs = [
		'--absolute-path-issue-messages',
		'--require-config-exists',
		'--analyze-twice',
		'--output-mode=json',
		'--disable-cache', // Only relevant for the polyfill parser.
	];
	if ( ! argv.v ) {
		phanArgs.push( '--progress-bar' );
	} else if ( new Set( argv.project ).size > 1 && argv.concurrency > 1 ) {
		phanArgs.push( '--long-progress-bar' );
	} else if ( ! process.stderr.isTTY ) {
		phanArgs.push( '--long-progress-bar' );
	} else {
		phanArgs.push( '--progress-bar' );
	}
	if ( argv.baseline !== false ) {
		phanArgs.push( '--load-baseline=.phan/baseline.php' );
	}
	if ( argv.updateBaseline ) {
		phanArgs.push( '--save-baseline=.phan/baseline.php' );
	}
	for ( const arg of [
		'automatic-fix',
		'allow-polyfill-parser',
		'force-polyfill-parser',
		'debug',
	] ) {
		if ( typeof argv[ arg ] === 'string' ) {
			phanArgs.push( '--' + arg, argv[ arg ] );
		} else if ( argv[ arg ] === true ) {
			phanArgs.push( '--' + arg );
		}
	}

	const issues = [];
	const projects = new Set( argv.project );

	// Avoid a node warning about too many event listeners.
	if ( argv.v ) {
		process.stdout.setMaxListeners( projects.size + 10 );
		process.stderr.setMaxListeners( projects.size + 10 );
	}

	for ( const project of projects ) {
		// Does the project even exist?
		if (
			( await fs.access( projectDir( project, 'composer.json' ) ).catch( () => false ) ) === false
		) {
			console.error( chalk.red( `Project ${ project } does not exist!` ) );
			continue;
		}

		// Does the project have a phan config?
		if ( ( await fs.access( projectDir( project, '.phan' ) ).catch( () => false ) ) === false ) {
			if ( ! argv.all ) {
				console.error( chalk.yellow( `Project ${ project } has no phan config, skipping` ) );
			}
			continue;
		}

		const projectPhanArgs = checkFilesByProject[ project ]
			? [ ...phanArgs, '--include-analysis-file-list', checkFilesByProject[ project ].join( ',' ) ]
			: phanArgs;

		let sstdout = process.stdout,
			sstderr = process.stderr;
		if ( argv.v && argv.concurrency > 1 && projects.size > 1 ) {
			const streamArgs = { prefix: project, time: true };
			sstdout = new PrefixStream( streamArgs );
			sstderr = new PrefixStream( streamArgs );
			sstdout.pipe( process.stdout, { end: false } );
			sstderr.pipe( process.stderr, { end: false } );
		}

		// Composer install.
		tasks.push( {
			title: `Checking ${ project }`,
			skip: skipFunction,
			task: async () => {
				const subtasks = [];

				if ( project !== 'monorepo' ) {
					subtasks.push( {
						title: 'Installing composer dependencies',
						task: async () => {
							const proc = execa( 'composer', await getInstallArgs( project, 'composer', argv ), {
								cwd: projectDir( project ),
								stdio: [ 'ignore', argv.v ? 'pipe' : 'ignore', argv.v ? 'pipe' : 'ignore' ],
							} );
							if ( argv.v ) {
								proc.stdout.pipe( sstdout, { end: false } );
								proc.stderr.pipe( sstderr, { end: false } );
							}
							await proc;
						},
					} );
				}

				try {
					await fs.access( projectDir( project, '.phan/pre-run' ), fs.constants.X_OK );
					subtasks.push( {
						title: 'Executing pre-run script',
						task: async () => {
							const proc = execa( projectDir( project, '.phan/pre-run' ), projectPhanArgs, {
								cwd: projectDir( project ),
								stdio: [ 'ignore', argv.v ? 'pipe' : 'ignore', argv.v ? 'pipe' : 'ignore' ],
							} );
							if ( argv.v ) {
								proc.stdout.pipe( sstdout, { end: false } );
								proc.stderr.pipe( sstderr, { end: false } );
							}
							await proc;
						},
					} );
				} catch ( e ) {
					if ( e.code !== 'ENOENT' ) {
						throw e;
					}
				}

				subtasks.push( {
					title: 'Running phan',
					task: async ( ctx, task ) => {
						let stdout = '';
						try {
							if ( argv.v ) {
								sstdout.write( `Executing ${ phanPath } ${ projectPhanArgs.join( ' ' ) }\n` );
							}
							const proc = execa( phanPath, projectPhanArgs, {
								cwd: projectDir( project ),
								buffer: false,
								stdio: [ 'ignore', 'pipe', 'pipe' ],
							} );
							proc.stdout.on( 'data', v => ( stdout += v ) );
							if ( argv.v ) {
								proc.stderr.pipe( sstderr, { end: false } );
							} else {
								let stderr = '';
								proc.stderr.on( 'data', v => {
									stderr += v;
									const idx = stderr.lastIndexOf( '\r', stderr.length - 2 );
									if ( idx >= 0 ) {
										stderr = stderr.substring( idx + 1 );
									}
									task.output = stderr;
								} );
							}
							await proc;
						} catch ( e ) {
							let json;
							try {
								json = JSON.parse( stdout );
								if ( ! Array.isArray( json ) ) {
									if ( argv.v ) {
										sstderr.write( 'Output is JSON but not an array\n' );
									}
									throw new Error( 'Output is JSON but not an array' );
								}
							} catch ( e2 ) {
								if ( argv.v ) {
									sstdout.write( stdout );
								}
								throw e;
							}
							issues.push( ...json );
							throw new Error(
								json.length === 1
									? 'Phan reported 1 issue'
									: `Phan reported ${ json.length } issues`
							);
						}
					},
				} );

				return new Listr( subtasks, {
					concurrent: false,
					renderer: argv.v ? VerboseRenderer : UpdateRenderer,
				} );
			},
		} );
	}

	const listr = new Listr( tasks, {
		concurrent: argv.concurrency,
		renderer: argv.v ? VerboseRenderer : UpdateRenderer,
		exitOnError: false,
	} );
	await listr.run().catch( e => {
		process.exitCode = e.exitCode || 1;
	} );

	issues.sort( ( a, b ) => {
		if ( a.location.path !== b.location.path ) {
			return a.location.path < b.location.path ? -1 : 1;
		}
		if ( a.location.lines.begin !== b.location.lines.begin ) {
			return a.location.lines.begin < b.location.lines.begin ? -1 : 1;
		}
		if ( a.location.lines.begin_column !== b.location.lines.begin_column ) {
			return a.location.lines.begin_column < b.location.lines.begin_column ? -1 : 1;
		}
		if ( a.location.description !== b.location.description ) {
			return a.location.description < b.location.description ? -1 : 1;
		}
		return 0;
	} );
	switch ( argv.format ) {
		case 'json':
			console.log( JSON.stringify( issues ) );
			break;
		case 'emacs':
			for ( const issue of issues ) {
				let msg =
					path.relative( process.cwd(), issue.location.path ) + ':' + issue.location.lines.begin;
				if ( issue.location.lines.begin_column !== undefined ) {
					msg += ':' + issue.location.lines.begin_column;
				}
				msg += ': ' + issue.description.replace( /\s+/g, ' ' );
				console.log( msg );
			}
			break;
		case 'github':
			for ( const issue of issues ) {
				let msg =
					path.relative( process.cwd(), issue.location.path ) + ':' + issue.location.lines.begin;
				if ( issue.location.lines.begin_column !== undefined ) {
					msg += ':' + issue.location.lines.begin_column;
				}
				console.log( msg );

				msg = '::error file=' + path.relative( process.cwd(), issue.location.path );
				msg += ',line=' + issue.location.lines.begin;
				if ( issue.location.lines.begin_column !== undefined ) {
					msg += ',col=' + issue.location.lines.begin_column;
				}
				msg += ',endLine=' + issue.location.lines.end;
				if ( issue.location.lines.end_column !== undefined ) {
					msg += ',endCol=' + issue.location.lines.end_column;
				}
				msg += '::' + issue.description.replace( /[%\r\n]/g, m => encodeURIComponent( m[ 0 ] ) );
				if ( issue.suggestion ) {
					msg +=
						'%0A%0ASuggestion: ' +
						issue.suggestion.replace( /[%\r\n]/g, m => encodeURIComponent( m[ 0 ] ) );
				}
				console.log( msg );
			}
			break;
		default:
			console.error(
				chalk.red( `Unrecognized --format=${ argv.format }, falling back to 'text'` )
			);
		// fall through
		case 'text':
			{
				const files = {};
				for ( const issue of issues ) {
					files[ issue.location.path ] ??= {
						issues: [],
						l: 0,
						c: -1,
					};
					files[ issue.location.path ].issues.push( issue );
					if ( issue.location.lines.begin > files[ issue.location.path ].l ) {
						files[ issue.location.path ].l = issue.location.lines.begin;
					}
					if (
						issue.location.lines.begin_column !== undefined &&
						issue.location.lines.begin_column > files[ issue.location.path ].c
					) {
						files[ issue.location.path ].c = issue.location.lines.begin_column;
					}
				}
				const sep = '-'.repeat( argv.width === Infinity ? 80 : argv.width );
				for ( const file of Object.keys( files ) ) {
					console.log( '' );
					console.log( `FILE: ${ path.relative( process.cwd(), file ) }` );
					console.log( sep );
					console.log(
						files[ file ].issues.length === 1
							? 'FOUND 1 ISSUE'
							: `FOUND ${ files[ file ].issues.length } ISSUES`
					);
					console.log( sep );
					const lw = String( files[ file ].l ).length;
					const cw = files[ file ].c < 0 ? -1 : String( files[ file ].c ).length;
					const ww = Math.max( argv.width - lw - cw - 3, 50 );
					for ( const issue of files[ file ].issues ) {
						let msg = String( issue.location.lines.begin ).padStart( lw );
						if ( cw > 0 ) {
							if ( issue.location.lines.begin_column !== undefined ) {
								msg += ':' + String( issue.location.lines.begin_column ).padEnd( cw );
							} else {
								msg += ' '.repeat( cw + 1 );
							}
						}
						msg += ' |';
						const nl = '\n' + ' '.repeat( msg.length - 1 ) + '|';
						let first = true;
						let l = 0;
						for ( const line of (
							issue.description.replace(
								/^([^ ]*) ([^ ]*)/,
								`${ chalk.yellow( '$1' ) } ${ chalk.yellow( '$2' ) }`
							) +
							( issue.suggestion ? `\n${ chalk.green( 'Suggestion:' ) } ` + issue.suggestion : '' )
						).split( /\n/ ) ) {
							if ( ! first ) {
								msg += nl;
								l = 0;
							}
							first = false;
							for ( const word of line.split( /\s+/ ) ) {
								// eslint-disable-next-line no-control-regex
								const wl = word.replace( /\x1b\[[0-9;]+m/g, '' ).length;
								if ( l + wl + 1 > ww ) {
									msg += nl;
									l = 0;
								}
								msg += ' ' + word;
								l += wl + 1;
							}
						}
						console.log( msg );
					}
					console.log( sep );
				}
				console.log( '' );
				console.log(
					issues.length === 1 ? 'FOUND 1 ISSUE TOTAL' : `FOUND ${ issues.length } ISSUES TOTAL`
				);
			}
			break;
	}
}
