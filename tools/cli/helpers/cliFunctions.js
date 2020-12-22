/**
 * External imports.
 */
import args from 'args';

/**
 * This function loads the args library and sets global flags.
 *
 * @returns {Args}
 */
export function cliFunctions() {
	args
		.option( 'default', 'Assume default options.' )
		.option( 'verbose', 'Display verbose output.' );

	return args;
}
