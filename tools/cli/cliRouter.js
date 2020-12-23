/**
 * External dependencies.
 */
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import {buildDefine} from "./commands/build";
import {dockerDefine} from "./commands/docker";

/**
 *
 */
export async function cli() {
	// Sets up the yargs instance.
	let argv = yargs( hideBin( process.argv ) );

	// Adds the commands to the yargs instance.
	argv = buildDefine( argv );
	argv = dockerDefine( argv );

	// Parse the args!
	argv.argv;

	// If verbose flag is set, output all of the argv info. Only applies if a command above doesn't execute.
	if ( argv.v ) {
		console.log( argv );
	}
}
