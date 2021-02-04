/**
 * Normalize the argv used for the install command.
 *
 * @param {object} argv - The argvs for the install command.
 *
 * @returns {object} argv object with standard elements needed for the installer.
 */
export function normalizeInstallArgv( argv ) {
	return {
		// Defaults.
		project: '',
		root: false,
		all: false,
		v: false,
		// Override from `argv`.
		...argv,
	};
}
