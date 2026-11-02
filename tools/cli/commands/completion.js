import { completionScript, shellFromEnv } from '../helpers/completion.js';

export const command = 'completion [shell]';
export const describe = 'Generate bash/zsh completions';

/**
 * Options definition for the completion subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 * @return {object} Yargs with the completion commands defined.
 */
export function builder( yargs ) {
	return yargs.positional( 'shell', {
		describe: 'Shell to generate the script for. Defaults to the login shell, from $SHELL.',
		type: 'string',
		choices: [ 'bash', 'zsh' ],
	} );
}

/**
 * Print the completion script.
 *
 * @param {object} argv - The argv for the command line.
 */
export function handler( argv ) {
	const shell = argv.shell ?? shellFromEnv();
	if ( ! shell ) {
		console.error(
			`Could not tell the shell from $SHELL. Run \`${ argv.$0 } completion zsh\` or \`${ argv.$0 } completion bash\`.`
		);
		process.exit( 1 );
	}
	process.stdout.write( completionScript( shell, argv.$0 ) );
}
