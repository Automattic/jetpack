import pluralize from 'pluralize';

/**
 * Normalize the argv used for the generate command.
 *
 * @param {object} argv - The argvs for the generate command.
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

/**
 * Normalize argv when passing an incomplete project as a parameter
 *
 * @param {object} argv - The argvs for the generate command.
 * @returns {object} argv object with standard elements needed to generate a new project.
 */
export function normalizeProject( argv ) {
	if ( argv.project && argv.project.indexOf( '/' ) < 0 ) {
		argv.type = pluralize( argv.project );
		argv.project = '';
	}
	return argv;
}

/**
 * Normalize the argv used for the clean command.
 *
 * @param {object} argv - The argvs for the clean command.
 * @returns {object} argv object with standard elements needed for clean.
 */
export function normalizeCleanArgv( argv ) {
	return {
		// Defaults.
		project: '',
		all: false,
		v: false,
		// Override from `argv`.
		...argv,
	};
}

/**
 * Check a concurrency value.
 *
 * Intended for use as a `coerce` in a yargs option definition.
 *
 * @param {number} v - Value to check.
 * @returns {number} Number.
 * @throws {Error} If the value is invalid.
 */
export function coerceConcurrency( v ) {
	if ( v === Infinity || ( Number.isSafeInteger( v ) && v > 0 ) ) {
		return v;
	}
	throw new Error( 'Concurrency value must be an integer greater than 0, or Infinity.' );
}
