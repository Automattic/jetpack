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
	// While Patchwork does have a way to exclude files from replacement,
	// it requires non-wildcarded paths in the patchwork.json. Easier to just
	// check here for calls from within PHPUnit itself.
	$bt   = debug_backtrace( DEBUG_BACKTRACE_IGNORE_ARGS );
	$func = \Patchwork\getFunction();
	foreach ( $bt as $i => $data ) {
		if ( $data['function'] === $func ) {
			if ( isset( $bt[ $i + 1 ]['class'] ) && substr( $bt[ $i + 1 ]['class'], 0, 7 ) === 'PHPUnit' ) {
				return \Patchwork\relay();
			}
			break;
		}
	}

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
	throw new ExitException( 'Exit called with argument ' . var_export( $arg, true ) );
};
\Patchwork\redefine( 'exit', $exitfunc );
\Patchwork\redefine( 'die', $exitfunc );
unset( $exitfunc );
