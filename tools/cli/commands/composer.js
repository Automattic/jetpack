import { runPackageManager } from '../helpers/runPackageManager.js';

export const command = 'composer';
export const describe = 'Run Composer commands in the monorepo root or a specific project.';

/**
 * Options definition for the composer subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 * @return {object} Yargs with the composer commands defined.
 */
export function builder( yargs ) {
	return yargs
		.parserConfiguration( { 'unknown-options-as-args': true } )
		.strict( false )
		.help( false )
		.version( false )
		.usage(
			'$0 composer [args..]\n$0 composer <project> [args..]\n\n' +
				'Runs Composer at the monorepo root, or in a specific project directory.\n\n' +
				'Examples:\n' +
				'  $0 composer install --no-dev\n' +
				'  $0 composer phpcs:lint\n' +
				'  $0 composer plugins/jetpack phpunit\n' +
				'  $0 composer packages/connection install'
		);
}

/**
 * Entry point for the CLI.
 */
export async function handler() {
	await runPackageManager( { command: 'composer', requiredFile: 'composer.json' } );
}
