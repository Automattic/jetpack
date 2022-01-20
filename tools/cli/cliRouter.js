/**
 * External dependencies
 */
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

/**
 * Internal dependencies
 */
import { buildDefine } from './commands/build.js';
import { watchDefine } from './commands/watch.js';
import { installDefine } from './commands/install.js';
import { cleanDefine } from './commands/clean.js';
import { cliDefine } from './commands/cli.js';
import { generateDefine } from './commands/generate.js';
import { draftDefine } from './commands/draft.js';
import { changelogDefine } from './commands/changelog.js';
import { dockerDefine } from './commands/docker.js';
import { testDefine } from './commands/test.js';
import { releaseDefine } from './commands/release.js';

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
	argv = buildDefine( argv );
	argv = changelogDefine( argv );
	argv = cleanDefine( argv );
	argv = cliDefine( argv );
	argv.completion( 'completion', 'Generate bash/zsh completions' ); // Placed here to keep things alphabetical.
	argv = dockerDefine( argv );
	argv = draftDefine( argv );
	argv = generateDefine( argv );
	argv = installDefine( argv );
	argv = releaseDefine( argv );
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
