/**
 * External dependencies
 */
import chalk from 'chalk';
import child_process from 'child_process';
import inquirer from 'inquirer';

/**
 * Internal dependencies
 */
import promptForProject from '../helpers/promptForProject';
import { chalkJetpackGreen } from '../helpers/styling';
import { allProjects } from '../helpers/projectHelpers';
import { readComposerJson } from '../helpers/json';

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
					alias: 's',
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
 * Set the argument variables depending on which script we're runnning.
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
			argv.next = `Finished! Next: \n	- Create a new branch off master, review the changes, make any necessary adjustments. \n	- Commit your changes. \n	- To continue with the release process, update the readme.txt by running:\n		jetpack release ${ argv.project } readme \n`;
			break;
		case 'readme':
			argv.script = `tools/plugin-changelog-to-readme.sh`;
			argv.scriptArgs = [ argv.project ];
			argv.next = `Finished! Next: 
				  - If this is a beta, ensure the stable tag in readme.txt is latest stable. 
				  - Create a PR and have your changes reviewed and merged.
				  - Wait and make sure changes are propagated to mirror repos for each updated package.
				  - After propagation, if you need to create a release branch, stand on master and then run:
				      jetpack release ${ argv.project } release-branch \n`.replace( /^\t+/gm, '' );
			break;
		case 'release-branch':
			argv.version = await getReleaseVersion( argv );
			argv = await promptForVersion( argv );
			argv.script = `tools/create-release-branch.sh`;
			argv.scriptArgs = [ argv.project, argv.version ];
			argv.next = `Finished! Next: 
				  - Once the branch is pushed, GitHub Actions will build and create a branch on your plugin's mirror repo.
				  - That mirror repo branch will be the branch that is tagged in GitHub and pushed to svn in WordPress.org.
				  - When changes are pushed to the release branch that was just created, GitHub Actions takes care of building/mirroring to the mirror repo.
				  - You will now likely want to start a new release cycle like so:
				      jetpack release ${ argv.project } new-cycle \n`.replace( /^\t+/gm, '' );
			break;
		case 'amend':
			await checkBranchValid( argv );
			argv.script = `vendor/bin/changelogger`;
			argv.scriptArgs = [ `write`, `--amend` ];
			argv.workingDir = `projects/${ argv.project }`;
			argv.next = `Finished! Next:  
				  - You will now likely want to update readme.txt again, then commit to the release branch:
				    jetpack release ${ argv.project } readme \n`.replace( /^\t+/gm, '' );
			break;
		case 'version':
			argv.version = await getReleaseVersion( argv );
			argv = await promptForVersion( argv );
			argv.script = 'tools/project-version.sh';
			argv.scriptArgs = [ '-u', argv.version, argv.project ];
			argv.next = `Finished! Next, you will likely want to check the following project files to make sure versions were updated correctly:  
				- The main php file
				- package.json
				- composer.json (the autoloader-suffix filed)
				- changelog.md and the changelog part of readme.txt`.replace( /^\t+/gm, '' );
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
	const branchPrefix = await readComposerJson( argv.project ).extra[ 'release-branch-prefix' ];
	if ( ! branchPrefix ) {
		console.log(
			chalk.red(
				`No release branch prefix for ${ argv.project } specified in its composer.json file. Can't amend project changelog.`
			)
		);
		process.exit( 1 );
	}

	if ( ! currentBranch.startsWith( `${ branchPrefix }/branch-` ) ) {
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
 * Prompts for and suggests a version number for the release branch.
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
	const stableVersion = potentialVersion[ 0 ];
	const alphaVersion = potentialVersion[ 1 ];

	// Append '-beta' if necessary.
	if ( argv.b || argv.beta ) {
		potentialVersion = stableVersion.split( '.' ).splice( 0, 2 ).join( '.' );
		potentialVersion += '-beta';
		return potentialVersion;
	}

	// Append '-alpha' if necessary.
	if ( argv.a || argv[ 'dev-version' ] ) {
		// Jetpack uses additional versioning for dev/atomic in the form of x.y-a.z
		if ( argv.project === 'plugins/jetpack' ) {
			// Next time - replace potentialVersion with alphaVersion. If there is no alpha version, we just bump stableVersion.
			const versionToBump = alphaVersion
				? potentialVersion[ 1 ].split( '.' )
				: potentialVersion[ 0 ].split( '.' ); // if first alpha after stable, potentialVersion[1] should be undefined.
			console.log( versionToBump );
			const potentialVersionBump = potentialVersion[ 1 ] ? parseInt( versionToBump[ 1 ] ) + 1 : '0';
			if ( potentialVersionBump === '0' ) {
				potentialVersion = await getVersionBump( versionToBump );
				potentialVersion = potentialVersion.join( '.' );
				console.log( potentialVersion );
			}
			potentialVersion = `${ potentialVersion }-a.${ potentialVersionBump }`;
		} else {
			const versionToBump = stableVersion.split( '.' ).splice( 0, 2 );
			potentialVersion = await getVersionBump( versionToBump );
			potentialVersion = potentialVersion.join( '.' );
			potentialVersion += '-alpha';
		}
		return potentialVersion;
	}

	if ( argv.stable ) {
		potentialVersion = stableVersion.split( '.' ).splice( 0, 2 ).join( '.' );
		return potentialVersion;
	}
}

/**
 * Bumps the correct number.
 *
 * @param {Array} version - the arguments passed
 * @returns {Array} the bumped version.
 */
export async function getVersionBump( version ) {
	if ( version[ 1 ] === '9' ) {
		// e.g, if the current version is 10.9 and we want 11.0
		version[ 0 ] = parseInt( version[ 0 ] ) + 1;
		version[ 1 ] = '0';
	} else {
		version[ 1 ] = parseInt( version[ 1 ] ) + 1;
	}

	return version; //maybe return version.join('.')?
}
/**
 * Prompts for what version we're releasing
 *
 * @param {object} argv - the arguments passed.
 * @returns {string} version
 */
export async function promptForVersion( argv ) {
	const response = await inquirer.prompt( [
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
	const response = await inquirer.prompt( [
		{
			type: 'list',
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
			argv[ 'dev-version' ] = true;
			argv.a = true;
			break;
		default:
			argv.stable = true;
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
	const response = await inquirer.prompt( [
		{
			type: 'list',
			name: 'script',
			message: `What step of the release process are you looking to do for ${ argv.project }?`,
			choices: [
				{
					name: `[Create Changelog.md  ] - Compile all changelog files into ${ argv.project }'s CHANGELOG.md `,
					value: 'changelog',
				},
				{
					name: `[Update Readme.txt    ] - Update ${ argv.project }'s readme.txt file based on the updated changelog.`,
					value: 'readme',
				},
				{
					name: `[Create Release Branch] - Create a release branch for  ${ argv.project }`,
					value: 'release-branch',
				},
				{
					name: `[Amend Changelog.md   ] - Updates changelog.md with any files cherry picked to release branch prior to release.`,
					value: 'amend',
				},
			],
		},
	] );
	argv.script = response.script;
	return argv;
}
