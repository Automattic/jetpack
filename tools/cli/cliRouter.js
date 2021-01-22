/**
 * External dependencies
 */
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

/**
 * Internal dependencies
 */
import { buildDefine } from './commands/build';
import { watchDefine } from './commands/watch';
import { installDefine } from './commands/install';

// import { dockerDefine } from "./commands/docker";

/**
 * The main CLI router function.
 *
 * This commands brings in the command definitions for the second level (e.g. jetpack SOMETHING)
 * thus routes the command correctly.
 */
export async function cli() {
	// Sets up the yargs instance.
	let argv = yargs( hideBin( process.argv ) );

	// Adds the commands to the yargs instance.
	argv = buildDefine( argv );
	argv = watchDefine( argv );
	argv = installDefine( argv );
	// argv = dockerDefine( argv );

	// This adds usage information on failure and demands that a subcommand must be passed.
	argv.showHelpOnFail( true ).demandCommand();

	// Parse the args!
	argv.argv;

	// If verbose flag is set, output all of the argv info. Only applies if a command above doesn't execute.
	if ( argv.v ) {
		console.log( argv );
	}
}
