import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import chalk from 'chalk';
import { execa } from 'execa';
import Listr from 'listr';
import UpdateRenderer from 'listr-update-renderer';
import VerboseRenderer from 'listr-verbose-renderer';
import { getInstallArgs, getComposerInstallArgsForDir, projectDir } from '../helpers/install.js';
import { coerceConcurrency } from '../helpers/normalizeArgv.js';
import PrefixStream from '../helpers/prefix-stream.js';
import { allProjects } from '../helpers/projectHelpers.js';
import promptForProject from '../helpers/promptForProject.js';

export const command = 'phan [project...]';
export const describe = 'Run Phan on a monorepo project';

/**
 * Load list of monorepo pseudo-projects.
 *
 * @returns {object} Map of key to dir.
 */
async function monorepoPseudoProjects() {
	const contents = await fs.readFile(
		new URL( '../../../.phan/monorepo-pseudo-projects.jsonc', import.meta.url ),
		{ encoding: 'utf8' }
	);
	return JSON.parse( contents.replace( /^\s*\/\/.*/gm, '' ) );
}

/**
 * Options definition for the phan subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 * @returns {object} Yargs with the phan commands defined.
 */
export async function builder( yargs ) {
	return yargs
		.positional( 'project', {
			describe:
				// prettier-ignore
				`Project in the form of type/name, e.g. plugins/jetpack. The following pseudo-projects are also available: "monorepo", "${ Object.keys( await monorepoPseudoProjects() ).join( '", "' ) }".`,
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
		.option( 'force-update-baseline', {
			type: 'boolean',
			description:
				'Update the Phan baselines, even if no baseline currently exists. But please try not to use this, fix the issues instead.',
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
		.option( 'filter-issues', {
			type: 'string',
			description:
				'Comma-separated list of issue codes to filter for. Only these issues will be reported.',
		} )
		.option( 'report-file', {
			type: 'string',
			description: 'Write the report to this file instead of to standard output.',
		} )
		.check( argv => {
			if ( argv.forceUpdateBaseline ) {
				argv.updateBaseline = true;
			}
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
	if ( ! argv[ 'allow-polyfill-parser' ] && ! argv[ 'force-polyfill-parser' ] ) {
		try {
			await execa( 'php', [ '-r', 'exit( extension_loaded( "ast" ) ? 42 : 41 );' ], {
				stdio: 'ignore',
			} );
		} catch ( e ) {
			if ( e.exitCode === 41 ) {
				console.error(
					chalk.red(
						'PHP ast extension is not loaded! You should install it; see the Static analysis section in docs/monorepo.md for details'
					)
				);
				console.error(
					chalk.yellow(
						'You might run with --allow-polyfill-parser or --force-polyfill-parser in the mean time, but note that may report false positives.'
					)
				);
				process.exit( 1 );
			} else if ( e.exitCode !== 42 ) {
				throw e;
			}
		}
	}

	if (
		argv.project.length === 1 &&
		argv.project[ 0 ] !== 'monorepo' &&
		! argv.project[ 0 ].startsWith( 'monorepo/' )
	) {
		if ( argv.project[ 0 ].indexOf( '/' ) < 0 ) {
			argv.type = argv.project[ 0 ];
			argv.project = [];
		}
	}

	const pseudoProjects = await monorepoPseudoProjects();

	const checkFilesByProject = {};
	if ( argv[ 'include-analysis-file-list' ] ) {
		for ( const f of argv[ 'include-analysis-file-list' ]
			.split( ',' )
			.map( v => path.relative( process.cwd(), v ) ) ) {
			if ( ! f.startsWith( 'projects/' ) ) {
				let prj = 'monorepo';
				for ( const [ k, pth ] of Object.entries( pseudoProjects ) ) {
					if (
						! path.relative( pth, f ).startsWith( '../' ) &&
						( prj === 'monorepo' || pth.length > pseudoProjects[ prj ].length )
					) {
						prj = k;
					}
				}
				argv.project.push( prj );
				checkFilesByProject[ prj ] ??= [];
				checkFilesByProject[ prj ].push( f );
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
		argv.project.unshift( 'monorepo', ...Object.keys( pseudoProjects ) );
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

	const filterIssues = argv.filterIssues ? new Set( argv.filterIssues.split( ',' ) ) : null;

	// Avoid a node warning about too many event listeners.
	if ( argv.v ) {
		process.stdout.setMaxListeners( projects.size + 10 );
		process.stderr.setMaxListeners( projects.size + 10 );
	}

	for ( const project of projects ) {
		const cwd = pseudoProjects[ project ]
			? path.resolve( pseudoProjects[ project ] )
			: projectDir( project );

		// Does the project even exist?
		if ( ( await fs.access( path.join( cwd, 'composer.json' ) ).catch( () => false ) ) === false ) {
			console.error( chalk.red( `Project ${ project } does not exist!` ) );
			continue;
		}

		// Does the project have a phan config?
		if ( ( await fs.access( path.join( cwd, '.phan' ) ).catch( () => false ) ) === false ) {
			if ( ! argv.all ) {
				console.error( chalk.yellow( `Project ${ project } has no phan config, skipping` ) );
			}
			continue;
		}

		const projectPhanArgs = checkFilesByProject[ project ]
			? [ ...phanArgs, '--include-analysis-file-list', checkFilesByProject[ project ].join( ',' ) ]
			: [ ...phanArgs ];

		// Baseline handling depends on whether the baseline exists.
		const hasBaseline =
			( await fs.access( path.join( cwd, '.phan/baseline.php' ) ).catch( () => false ) ) !== false;
		if ( hasBaseline && argv.baseline !== false ) {
			projectPhanArgs.push( '--load-baseline=.phan/baseline.php' );
		}
		if ( ( hasBaseline && argv.updateBaseline ) || argv.forceUpdateBaseline ) {
			projectPhanArgs.push( '--save-baseline=.phan/baseline.php' );
		}

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
					const args = pseudoProjects[ project ]
						? await getComposerInstallArgsForDir( cwd, argv )
						: await getInstallArgs( project, 'composer', argv );
					subtasks.push( {
						title: 'Installing composer dependencies',
						task: async () => {
							const proc = execa( 'composer', args, {
								cwd,
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
					await fs.access( path.join( cwd, '.phan/pre-run' ), fs.constants.X_OK );
					subtasks.push( {
						title: 'Executing pre-run script',
						task: async () => {
							const proc = execa( path.join( cwd, '.phan/pre-run' ), projectPhanArgs, {
								cwd,
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
								cwd,
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

							// Don't re-create unneeded baselines with --force-update-baseline.
							if ( ! hasBaseline && argv.forceUpdateBaseline ) {
								if ( argv.v ) {
									sstderr.write(
										'Removing that baseline, no issues were reported so it should be empty.\n'
									);
								}
								try {
									await fs.unlink( path.join( cwd, '.phan/baseline.php' ) );
								} catch ( e ) {
									if ( argv.v ) {
										sstderr.write(
											// prettier-ignore
											`Failed to unlink ${ path.join( cwd, '.phan/baseline.php' ) }: ${ e.message }\n`
										);
									}
								}
							}
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
							if ( filterIssues ) {
								json = json.filter( i => filterIssues.has( i.check_name ) );
							}
							if ( json.length ) {
								issues.push( ...json );
								throw new Error(
									json.length === 1
										? 'Phan reported 1 issue'
										: `Phan reported ${ json.length } issues`
								);
							}
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

	const reportStream = argv.reportFile
		? ( await fs.open( argv.reportFile, 'w' ) ).createWriteStream()
		: process.stdout;
	const writeln = async v => {
		if ( v !== '' && ! reportStream.write( v ) ) {
			await new Promise( r => reportStream.once( 'drain', r ) );
		}
		if ( ! reportStream.write( '\n' ) ) {
			await new Promise( r => reportStream.once( 'drain', r ) );
		}
	};

	switch ( argv.format ) {
		case 'json':
			await writeln( JSON.stringify( issues ) );
			break;
		case 'emacs':
			for ( const issue of issues ) {
				let msg =
					path.relative( process.cwd(), issue.location.path ) + ':' + issue.location.lines.begin;
				if ( issue.location.lines.begin_column !== undefined ) {
					msg += ':' + issue.location.lines.begin_column;
				}
				msg += ': ' + issue.description.replace( /\s+/g, ' ' );
				await writeln( msg );
			}
			break;
		case 'github':
			for ( const issue of issues ) {
				let msg =
					path.relative( process.cwd(), issue.location.path ) + ':' + issue.location.lines.begin;
				if ( issue.location.lines.begin_column !== undefined ) {
					msg += ':' + issue.location.lines.begin_column;
				}
				await writeln( msg );

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
				await writeln( msg );
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
				const suggestionPrefix = argv.reportFile
					? '\nSuggestion: '
					: `\n${ chalk.green( 'Suggestion:' ) } `;
				const colorizeIssue = argv.reportFile
					? v => v
					: v =>
							v.replace(
								/^([^ ]*) ([^ ]*)/,
								`${ chalk.yellow( '$1' ) } ${ chalk.yellow( '$2' ) }`
							);
				for ( const file of Object.keys( files ) ) {
					await writeln( '' );
					await writeln( `FILE: ${ path.relative( process.cwd(), file ) }` );
					await writeln( sep );
					await writeln(
						files[ file ].issues.length === 1
							? 'FOUND 1 ISSUE'
							: `FOUND ${ files[ file ].issues.length } ISSUES`
					);
					await writeln( sep );
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
							colorizeIssue( issue.description ) +
							( issue.suggestion ? suggestionPrefix + issue.suggestion : '' )
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
						await writeln( msg );
					}
					await writeln( sep );
				}
				await writeln( '' );
				await writeln(
					issues.length === 1 ? 'FOUND 1 ISSUE TOTAL' : `FOUND ${ issues.length } ISSUES TOTAL`
				);
			}
			break;
	}
	if ( argv.reportFile ) {
		reportStream.end();
		console.log( `Report written to ${ argv.reportFile }` );
	}
}
