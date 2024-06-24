import child_process from 'child_process';
import chalk from 'chalk';
import enquirer from 'enquirer';
import { readComposerJson } from '../helpers/json.js';
import { allProjects } from '../helpers/projectHelpers.js';
import promptForProject from '../helpers/promptForProject.js';
import { chalkJetpackGreen } from '../helpers/styling.js';

/**
 * Command definition for the release subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 * @returns {object} Yargs with the build commands defined.
 */
export function releaseDefine( yargs ) {
	yargs.command(
		'release [project] [script]',
		'Runs a release script for a project.',
		yarg => {
			yarg
				.positional( 'project', {
					describe:
						'Project in the form of type/name, e.g. plugins/jetpack, or type, e.g. plugins.',
					type: 'string',
				} )
				.positional( 'script', {
					describe: 'The release script to run',
					type: 'string',
					choices: [ 'changelog', 'readme', 'release-branch', 'amend', 'version' ],
				} )
				.option( 'dev-release', {
					alias: 'a',
					describe: 'Is this a dev release?',
					type: 'boolean',
				} )
				.option( 'beta', {
					alias: 'b',
					describe: 'Is this a beta?',
					type: 'boolean',
				} )
				.option( 'stable', {
					alias: 's',
					describe: 'Is this a stable release?',
					type: 'boolean',
				} )
				.option( 'add-pr-num', {
					describe: 'Append the GH PR number to each entry',
					type: 'boolean',
				} )
				.option( 'init-next-cycle', {
					describe: 'For `version`, init the next release cycle',
					type: 'boolean',
				} );
		},
		async argv => {
			await releaseCli( argv );
			if ( argv.v ) {
				console.log( argv );
			}
		}
	);

	return yargs;
}

/**
 * Handles the release command.
 *
 * @param {object} argv - the arguments passed.
 */
export async function releaseCli( argv ) {
	// Verify we have a valid project.
	if ( argv.project ) {
		argv = await parseProj( argv );
	} else {
		argv = await promptForProject( argv );
	}

	// Verify we have a valid script.
	if ( ! argv.script || argv.script === '' ) {
		argv = await promptForScript( argv );
	}

	// Check if we're working with a beta/alpha version when necessary.
	if (
		! argv.devRelease &&
		typeof argv.beta === 'undefined' &&
		typeof argv.stable === 'undefined' &&
		( argv.script !== 'readme' || argv.script !== 'amend' )
	) {
		argv = await promptDevBeta( argv );
	}

	// Get the info we need for the script.
	await scriptRouter( argv );

	// Run the script.
	await runScript( argv );
}

/**
 * Run the script.
 *
 * @param {object} argv - the arguments passed
 */
export async function runScript( argv ) {
	console.log(
		chalkJetpackGreen(
			`Running ${ argv.script } ${ argv.scriptArgs.join( ' ' ) }! Just a moment...`
		)
	);

	const scriptProcess = child_process.spawnSync( argv.script, [ ...argv.scriptArgs ], {
		stdio: 'inherit',
		cwd: argv.workingDir ? argv.workingDir : './',
	} );

	if ( scriptProcess.status !== 0 ) {
		console.error( `Error running script! Exited with status code ${ scriptProcess.status }.` );
		process.exit( scriptProcess.status );
	}

	// Display the next step of the release process.
	console.log( argv.next );
}

/**
 * Set the argument variables depending on which script we're running.
 *
 * @param {object} argv - the arguments passed
 */
export async function scriptRouter( argv ) {
	switch ( argv.script ) {
		case 'changelog':
			argv.script = `tools/changelogger-release.sh`;
			argv.scriptArgs = [ argv.project ];
			if ( argv.devRelease ) {
				argv.scriptArgs.unshift( '-a' );
			} else if ( argv.beta ) {
				argv.scriptArgs.unshift( '-b' );
			}
			argv.addPrNum && argv.scriptArgs.unshift( '-p' );
			argv.next = `Finished! You may want to update the readme.txt by running 'jetpack release ${ argv.project } readme' \n`;
			break;
		case 'readme':
			argv.script = `tools/plugin-changelog-to-readme.sh`;
			argv.scriptArgs = [ argv.project ];
			argv.next = 'Finished updating readme!';
			break;
		case 'release-branch':
			argv.version = await getReleaseVersion( argv );
			argv = await promptForVersion( argv );
			argv.script = `tools/create-release-branch.sh`;
			argv.scriptArgs = [ argv.project, argv.version ];
			argv.next = 'Release branch pushed!';
			break;
		case 'amend':
			await checkBranchValid( argv );
			// @todo Stop assuming `composer install` has been done so vendor/bin/changelogger already exists.
			argv.script = `vendor/bin/changelogger`;
			argv.scriptArgs = [ `write`, `--amend` ];
			argv.addPrNum && argv.scriptArgs.push( '--add-pr-num' );
			argv.workingDir = `projects/${ argv.project }`;
			argv.next = `Finished! You will now likely want to update readme.txt again:
				    jetpack release ${ argv.project } readme \n`.replace( /^\t+/gm, '' );
			break;
		case 'version':
			argv.version = await getReleaseVersion( argv );
			argv = await promptForVersion( argv );
			argv.script = 'tools/project-version.sh';
			argv.scriptArgs = [ argv.initNextCycle ? '-Cu' : '-u', argv.version, argv.project ];
			argv.next =
				`Finished! Next, you will likely want to check the following project files to make sure versions were updated correctly:
				 - The main php file
				 - package.json
				 - composer.json (the autoloader-suffix filed)
				 - changelog.md and the changelog part of readme.txt \n`.replace( /^\t+/gm, '' );
			break;
		default:
			console.log( 'Not a valid release command!' );
			process.exit( 1 );
	}
}

/**
 * Checks and makes sure we're on a release branch before we run the `amend` script.
 *
 * @param {object} argv - the arguments passed.
 */
export async function checkBranchValid( argv ) {
	const currentBranch = child_process.execSync( 'git branch --show-current' ).toString().trim();
	let branchPrefix = await readComposerJson( argv.project ).extra[ 'release-branch-prefix' ];
	if ( ! branchPrefix ) {
		console.log(
			chalk.red(
				`No release branch prefix for ${ argv.project } specified in its composer.json file. Can't amend project changelog.`
			)
		);
		process.exit( 1 );
	}

	if ( ! Array.isArray( branchPrefix ) ) {
		branchPrefix = [ branchPrefix ];
	}

	if ( ! branchPrefix.some( prefix => currentBranch.startsWith( `${ prefix }/branch-` ) ) ) {
		console.log(
			chalk.red(
				`Doesn't look like you're on a release branch! Please check out the release branch before amending the changelog.`
			)
		);
		process.exit( 1 );
	}
}

/**
 * Checks the project we're releasing.
 *
 * @param {object} argv - the arguments passed
 * @returns {object} argv
 */
export async function parseProj( argv ) {
	// If we're passing a specific project
	const allProj = allProjects();
	for ( const proj of allProj ) {
		if ( argv.project === proj ) {
			return argv;
		}
	}

	console.log( chalk.red( 'Invalid project type, defaulting to interactive mode' ) );
	delete argv.project;
	argv = await promptForProject( argv );
	return argv;
}

/**
 * Get a potential version that we might need when creating a release branch or bumping versions.
 *
 * @param {object} argv - the arguments passed
 * @returns {object} argv
 */
export async function getReleaseVersion( argv ) {
	let potentialVersion = child_process
		.execSync( `tools/plugin-version.sh ${ argv.project }` )
		.toString()
		.trim();
	potentialVersion = potentialVersion.split( '-' ); // e.g., split 10.4-a.8 into [10.4, a.8]
	let stableVersion = potentialVersion[ 0 ];
	let devReleaseVersion = potentialVersion[ 1 ];

	if ( argv.stable || argv.s ) {
		return stableVersion;
	}

	// Append '-beta' if necessary.
	if ( argv.b || argv.beta ) {
		return `${ stableVersion }-beta`;
	}

	// Handle alpha/dev-release version if necessary.
	if ( argv.a || argv.devRelease ) {
		// Check if dev-releases is specified in project's composer.json
		const hasDevReleases = await readComposerJson( argv.project ).extra[ 'dev-releases' ];
		if ( hasDevReleases ) {
			if ( devReleaseVersion && devReleaseVersion.match( /^a\.\d+$/ ) ) {
				devReleaseVersion = await getVersionBump( devReleaseVersion, argv.project );
				potentialVersion = `${ stableVersion }-${ devReleaseVersion }`;
			} else {
				stableVersion = await getVersionBump( stableVersion, argv.project );
				potentialVersion = `${ stableVersion }-a.0`;
			}
		} else {
			stableVersion = await getVersionBump( stableVersion, argv.project );
			potentialVersion = `${ stableVersion }-alpha`;
		}
		return potentialVersion;
	}
}

/**
 * Bumps the correct number.
 *
 * @param {Array} version - the arguments passed
 * @param {string} project - the project we're working with.
 * @returns {Array} the bumped version.
 */
export async function getVersionBump( version, project ) {
	version = version.split( '.' );

	// If we we're bumping just a dev-release version, e.g. x.y-a.z
	if ( version[ 0 ] === 'a' ) {
		version[ 1 ] = parseInt( version[ 1 ] ) + 1;
		return version.join( '.' );
	}

	const changeloggerConfig = await readComposerJson( project ).extra.changelogger;

	// If WordPress versioning, i.e. x.(y+1) or (x+1).0
	if ( changeloggerConfig && changeloggerConfig.versioning === 'wordpress' ) {
		// If there was a point release, remove the last number before bumping.
		if ( version[ 2 ] ) {
			version.pop();
		}

		if ( version[ 1 ] === '9' ) {
			// e.g, if the current version is 10.9 and we want 11.0
			version[ 0 ] = parseInt( version[ 0 ] ) + 1;
			version[ 1 ] = '0';
		} else {
			// e.g, if the current version is 10.8 and we want 10.9
			version[ 1 ] = parseInt( version[ 1 ] ) + 1;
		}
		return version.join( '.' );
	}

	// Default semver, bumping a minor patch, i.e. x.y.(z+1)
	version[ 2 ] = parseInt( version[ 2 ] ) + 1;
	return version.join( '.' );
}

/**
 * Prompts for what version we're releasing
 *
 * @param {object} argv - the arguments passed.
 * @returns {string} version
 */
export async function promptForVersion( argv ) {
	const response = await enquirer.prompt( [
		{
			type: 'input',
			name: 'version',
			message: `What version are you releasing for ${ argv.project }?`,
			default: argv.version,
		},
	] );
	argv.version = response.version;
	return argv;
}

/**
 * Prompt if we're releasing a beta.
 *
 * @param {object} argv - the arguments passed
 * @returns {object} argv
 */
export async function promptDevBeta( argv ) {
	const response = await enquirer.prompt( [
		{
			type: 'select',
			name: 'version_type',
			message: `What kind of release is this?`,
			choices: [ 'alpha (including Atomic)', 'beta', 'stable' ],
		},
	] );

	switch ( response.version_type ) {
		case 'beta':
			argv.b = true;
			argv.beta = true;
			break;
		case 'alpha (including Atomic)':
			argv.devRelease = true;
			argv.a = true;
			break;
		default:
			argv.stable = true;
			argv.s = true;
	}
	return argv;
}

/**
 * Asks for what part of the release process we want to run.
 *
 * @param {object} argv - the arguments passed
 * @returns {object} argv
 */
export async function promptForScript( argv ) {
	const response = await enquirer.prompt( [
		{
			type: 'select',
			name: 'script',
			message: `What step of the release process are you looking to do for ${ argv.project }?`,
			choices: [
				{
					message: `Compile all changelog files into ${ argv.project }'s CHANGELOG.md `,
					value: 'changelog',
				},
				{
					message: `Update ${ argv.project }'s readme.txt file based on the updated changelog.`,
					value: 'readme',
				},
				{
					message: `Create a release branch for ${ argv.project }`,
					value: 'release-branch',
				},
				{
					message: `Updates changelog.md with any files cherry picked to release branch prior to release.`,
					value: 'amend',
				},
				{
					message: `Update version number for ${ argv.project }.`,
					value: 'version',
				},
			],
		},
	] );
	argv.script = response.script;
	return argv;
}
