export const command = 'noop';
export const describe = false;

/**
 * Options definition for the phan subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 * @returns {object} Yargs with the options defined.
 */
export async function builder( yargs ) {
	return yargs;
}

/**
 * Entry point for the CLI.
 */
export async function handler() {}
