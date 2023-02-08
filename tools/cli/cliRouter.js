import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as buildCommand from './commands/build.js';
import { changelogDefine } from './commands/changelog.js';
import { cleanDefine } from './commands/clean.js';
import { cliDefine } from './commands/cli.js';
import * as dependenciesCommand from './commands/dependencies.js';
import { dockerDefine } from './commands/docker.js';
import { draftDefine } from './commands/draft.js';
import { generateDefine } from './commands/generate.js';
import * as installCommand from './commands/install.js';
import { releaseDefine } from './commands/release.js';
import { rsyncDefine } from './commands/rsync.js';
import { testDefine } from './commands/test.js';
import { watchDefine } from './commands/watch.js';

/**
 * The main CLI router function.
 *
 * This commands brings in the command definitions for the second level (e.g. jetpack SOMETHING)
 * thus routes the command correctly.
 */
export async function cli() {
	// Sets up the yargs instance.
	let argv = yargs( hideBin( process.argv ) );

	argv.scriptName( 'jetpack' );

	/*
	 * Adds the commands to the yargs instance. Help text will list commands in the order they are included here.
	 * Let's keep it alphabetical.
	 */
	argv.command( buildCommand );
	argv = changelogDefine( argv );
	argv = cleanDefine( argv );
	argv = cliDefine( argv );
	argv.completion( 'completion', 'Generate bash/zsh completions' ); // Placed here to keep things alphabetical.
	argv.command( dependenciesCommand );
	argv = dockerDefine( argv );
	argv = draftDefine( argv );
	argv = generateDefine( argv );
	argv.command( installCommand );
	argv = releaseDefine( argv );
	argv = rsyncDefine( argv );
	argv = testDefine( argv );
	argv = watchDefine( argv );

	// This adds usage information on failure and demands that a subcommand must be passed.
	argv
		.showHelpOnFail( true )
		.demandCommand()
		.recommendCommands()
		.version( false )
		.options( {
			v: {
				alias: 'verbose',
				default: false,
				description: 'Enable verbose output',
				type: 'boolean',
				global: true,
			},
		} );

	// Parse the args!
	argv.parse();

	// If verbose flag is set, output all of the argv info. Only applies if a command above doesn't execute.
	if ( argv.v ) {
		console.log( argv );
	}
}
