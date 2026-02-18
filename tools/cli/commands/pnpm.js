import { runPackageManager } from '../helpers/runPackageManager.js';

export const command = 'pnpm';
export const describe = 'Run pnpm commands in the monorepo root or a specific project.';

/**
 * Options definition for the pnpm subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 * @return {object} Yargs with the pnpm commands defined.
 */
export function builder( yargs ) {
	return yargs
		.parserConfiguration( { 'unknown-options-as-args': true } )
		.strict( false )
		.help( false )
		.version( false )
		.usage(
			'$0 pnpm [args..]\n$0 pnpm <project> [args..]\n\n' +
				'Runs pnpm at the monorepo root, or in a specific project directory.\n\n' +
				'Examples:\n' +
				'  $0 pnpm install\n' +
				'  $0 pnpm run build\n' +
				'  $0 pnpm plugins/jetpack run build\n' +
				'  $0 pnpm js-packages/components install'
		);
}

/**
 * Entry point for the CLI.
 */
export async function handler() {
	await runPackageManager( { command: 'pnpm', requiredFile: 'package.json' } );
}
