<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Use Patchwork to redefine `exit()` and `die()`.
 *
 * This should be loaded as early as possible, as it will only take effect
 * for files loaded after this one.
 *
 * @package automattic/jetpack
 */

/**
 * Exception to represent the calling of `exit()` or `die()`.
 */
class ExitException extends Exception {
}

require_once __DIR__ . '/../../vendor/antecedent/patchwork/Patchwork.php';

$exitfunc = function ( $arg = null ) {
	if ( is_int( $arg ) ) {
		throw new ExitException( "Exit called with code $arg", $arg );
	} elseif ( is_string( $arg ) ) {
		if ( '' === $arg ) {
			throw new ExitException( 'Exit called with an empty string' );
		}
		throw new ExitException( "Exit called: $arg" );
	} elseif ( null === $arg ) {
		throw new ExitException( 'Exit called (with no argument)' );
	}
	// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_var_export
	throw new ExitException( 'Exit called with argument ' . var_export( $arg, true ) );
};
\Patchwork\redefine( 'exit', $exitfunc );
\Patchwork\redefine( 'die', $exitfunc );
unset( $exitfunc );
