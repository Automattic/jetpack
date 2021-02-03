/**
 * Normalize the argv used for the install command.
 *
 * @param {object} argv - The argvs for the install command.
 *
 * @returns {object} argv object with standard elements needed for the installer.
 */
export function normalizeInstallArgv( argv ) {
	return {
		...argv,
		project: argv.project || '',
		root: argv.root || false,
		all: argv.all || false,
		v: argv.v || false,
	};
}
