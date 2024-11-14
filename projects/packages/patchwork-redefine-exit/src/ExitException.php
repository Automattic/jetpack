<?php
/**
 * Exception class.
 *
 * @package automattic/patchwork-redefine-exit
 */

namespace Automattic\RedefineExit;

use RuntimeException;

/**
 * Exception to represent the calling of `exit()` or `die()`.
 */
class ExitException extends RuntimeException {

	/**
	 * Whether exit or die was called.
	 *
	 * @var string
	 */
	protected $func;

	/**
	 * Argument passed to exit/die.
	 *
	 * @var string|int|null
	 */
	protected $arg;

	/**
	 * Constructor.
	 *
	 * @param string          $func 'exit' or 'die'.
	 * @param string|int|null $arg Argument passed to `exit` or `die`.
	 */
	public function __construct( $func, $arg ) {
		$this->func = $func;
		$this->arg  = $arg;

		$code = 0;
		if ( is_int( $arg ) ) {
			$code    = $arg;
			$message = ucfirst( $func ) . " called with code $arg";
		} elseif ( $arg === '' ) {
			$message = ucfirst( $func ) . ' called with an empty string';
		} elseif ( is_string( $arg ) ) {
			$message = ucfirst( $func ) . " called: $arg";
		} elseif ( $arg === null ) {
			$message = ucfirst( $func ) . ' called with no argument';
		} else {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_var_export
			$message = ucfirst( $func ) . ' called with argument ' . var_export( $arg, true );
		}

		parent::__construct( $message, $code );
	}

	/**
	 * Whether `exit` or `die` was called.
	 *
	 * @return string 'exit' or 'die'.
	 */
	public function getFunction() {
		return $this->func;
	}

	/**
	 * Argument passed to `exit` or `die`.
	 *
	 * @return int|string|null
	 */
	public function getArg() {
		return $this->arg;
	}
}
