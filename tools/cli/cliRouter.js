import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as buildCommand from './commands/build.js';
import { changelogDefine } from './commands/changelog.js';
import { cleanDefine } from './commands/clean.js';
import { cliDefine } from './commands/cli.js';
import * as composerCommand from './commands/composer.js';
import * as dependenciesCommand from './commands/dependencies.js';
import { dockerDefine } from './commands/docker.js';
import { docsDefine } from './commands/docs.js';
import { draftDefine } from './commands/draft.js';
import { generateDefine } from './commands/generate.js';
import * as installCommand from './commands/install.js';
import * as noopCommand from './commands/noop.js';
import * as phanCommand from './commands/phan.js';
import * as playgroundCommand from './commands/playground.js';
import * as pnpmCommand from './commands/pnpm.js';
import { releaseDefine } from './commands/release.js';
import { rsyncDefine } from './commands/rsync.js';
import * as testCommand from './commands/test.js';
import { watchDefine } from './commands/watch.js';
import { completionHook } from './helpers/completion.js';

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
	// The hook completes positionals by name; a builder registers its own the same way.
	argv.completion( 'completion', 'Generate a shell completion script', completionHook( argv ) ); // Placed here to keep things alphabetical.
	argv.command( composerCommand );
	argv.command( dependenciesCommand );
	argv = dockerDefine( argv );
	argv = docsDefine( argv );
	argv = draftDefine( argv );
	argv = generateDefine( argv );
	argv.command( installCommand );
	argv.command( noopCommand );
	argv.command( phanCommand );
	argv.command( playgroundCommand );
	argv.command( pnpmCommand );
	argv = releaseDefine( argv );
	argv = rsyncDefine( argv );
	argv.command( testCommand );
	argv = watchDefine( argv );

	// This adds usage information on failure and demands that a subcommand must be passed.
	argv
		.strict()
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

	// A builder with `unknown-options-as-args` (composer, pnpm) never sees the completion request,
	// so stop the half-typed command before its handler runs.
	if ( process.argv.includes( '--get-yargs-completions' ) ) {
		argv.middleware( () => process.exit( 0 ), true );
	}

	// Parse the args!
	argv.parse();

	// If verbose flag is set, output all of the argv info. Only applies if a command above doesn't execute.
	if ( argv.v ) {
		console.log( argv );
	}
}
