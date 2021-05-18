/**
 * External dependencies
 */
 import chalk from 'chalk';
 import child_process from 'child_process';
 import fs from 'fs';
 import path from 'path';
 import inquirer from 'inquirer';
 import simpleGit from 'simple-git';

 /**
  * Internal dependencies
  */
 import promptForProject, { promptForType } from '../helpers/promptForProject';
 import { chalkJetpackGreen } from '../helpers/styling';
 import { normalizeCleanArgv } from '../helpers/normalizeArgv';
 import { allProjects, projectTypes } from '../helpers/projectHelpers';
 import { readComposerJson } from '../helpers/json';

/**
 * Command definition for the build subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 *
 * @returns {object} Yargs with the build commands defined.
 */
export function cleanDefine( yargs ) {
	yargs.command(
		'clean [project]',
		'Removes unversioned files and folder from a specific project.',
		yarg => {
			yarg
				.positional( 'project', {
					describe: 'Project in the form of type/name, e.g. plugins/jetpack',
					type: 'string',
				} )
				.option( 'ignored', {
					alias: 'i',
					type: 'boolean',
					description: 'Remove git ignored files',
				} )
                .option( 'all', {
					alias: 'a',
					type: 'boolean',
					description: 'Remove all unversioned files from the entire monorepo ',
				} );
		},
		async argv => {
			await cleanCli( argv );
			if ( argv.v ) {
				console.log( argv );
			}
		}
	);

	return yargs;
}

/**
 * Handle args for clean command.
 *
 * @param {argv}  argv - the arguments passed.
 */
export async function cleanCli( argv ) {
    argv = normalizeCleanArgv( argv );
    argv = await promptForScope( argv );
    switch ( argv.scope ) {
        case 'project':
            argv = await promptForProject( argv );
            break;
        case 'type':
            argv = await promptForType( argv );
            argv.project = 'projects/' + argv.type;
            break;
        case 'all':
            argv.project = '.';
            break;
    }

    await promptForClean( argv );
    await makeOptions( argv );
    console.log(argv);
    await gitClean( argv );
}

export async function makeOptions ( argv ) {
    const options = [];

    // If we're running in root, we need to flag we want to remove files in subdirectories.
    if ( argv.project === 'all' ) {
        options.push( '-d' );
    } else {
        options.push( argv.project );
    }

    // Add option to remove git ignored files.
    if ( argv.clean.toClean !== 'working' ) {
        options.push( argv.clean.toClean );
    }

    // Add any ignored 
    if ( ! argv.clean.ignoreInclude ) {
        argv.clean.ignoreInclude = [];
    }
    await addIgnored( argv.clean.ignoreInclude, options );
    argv.options = options;
    return argv;
}

async function addIgnored( ignoreInclude, options ) {
    const defaultIgnored = [ 'vendor', 'composer.lock', 'node_modules' ];
    for ( const toDelete of defaultIgnored ) {
        if ( ! ignoreInclude.includes( toDelete ) ) {
            if ( toDelete === 'composer.lock' ) {
                options.push( '-e "composer.lock"' );
            } else {
                options.push( `-e "/**/${toDelete}/"` );
            }
        }
    }
    return options;
}

export async function gitClean( argv ) {
    const git = await simpleGit();
    console.log( await git.clean( "n", argv.options ) );
    //todo: add console.log for git.clean.paths. Ask if okay, then run for real. Else, exit.
}
/**
 * Prompts for the scope of what we want to clean.
 *
 * @param {argv}  argv - the arguments passed.
 *
 * @returns {argv} argv
 */
export async function promptForScope ( argv ) {
    const response = await inquirer.prompt( [ {
		type: 'list',
		name: 'scope',
		message: 'What are you trying to clean?',
        choices: [
            {
                name: '[Project] - Specific project (plugins/jetpack, etc)',
                value: 'project',

            },
            {
                name: '[Type   ] - Everything in a project type (plugins, packages, etc)',
                value: 'type',
            },
            {
                name: '[All    ] - Everything in the monorepo',
                value: 'all'
            }
        ]
	} ] );
    argv.scope = response.scope;
    return argv;
}

/**
 * Prompts for what we're trying to clean (files, folder, gitignored, etc).
 *
 * @param {argv}  argv - the arguments passed.
 *
 * @returns {argv} argv
 */
export async function promptForClean( argv ) {
    const response = await inquirer.prompt( [
    {
        type: 'list',
        name: 'toClean',
        message: `What kind of untracked files and folders are you looking to delete for ${argv.project}`,
        choices: [
            {
                name: 'Only working files/folders.',
                value: 'working'

            },
            {
                name: 'Only git-ignored files/folders.',
                value: '-X',

            },
            {
                name: 'Both working files and git-ignored files/folders',
                value: '-x',
            },
        ]
    },
    {
		type: 'confirm',
		name: 'folders',
        value: '-d',
        default: true,
		message: `Do you wish to delete folders/files within root subdirectories as well?`,
        when: argv.type === 'all',
	},
    {
        type: 'checkbox',
        name: 'ignoreInclude',
        message: `Delete any of the following? (you will need to run 'jetpack install ${argv.project}' to reinstall them)`,
        choices: [
				{
					name: 'vendor',
					checked: false,
				},
				{
					name: 'node_modules',
					checked: false,
				},
                {
					name: 'composer.lock',
					checked: false,
				}
			],
        when: answers => answers.toClean !== 'working',
    },
    ] );
	argv.clean = { ...response };
	return argv;
}
// Remove for all projects
// Remove for all project types (ie, packages, plugins, etc)
// Remove for specific project, ie packages/plugin

/* then... */

// Remove only untracked files
// Remove untracked files and folders.
// Remove untracked files, folders, and gitignored files (including vendor and composer.lock) -e "/**/vendor/" -e "composer.lock"