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

/**
 * Normalize the argv used for the build command.
 *
 * @param {object} argv - The argvs for the install command.
 *
 * @returns {object} argv object with standard elements needed for the installer.
 */
export function normalizeBuildArgv( argv ) {
	return {
		project: '',
		production: false,
		...argv,
	};
}

/**
 * Normalize the argv used for the generate command.
 *
 * @param {object} argv - The argvs for the generate command.
 *
 * @returns {object} argv object with standard elements needed to generate a new project.
 */
export function normalizeGenerateArgv( argv ) {
	return {
		// Defaults.
		type: '',
		name: '',
		// Override from `argv`.
		...argv,
	};
}
