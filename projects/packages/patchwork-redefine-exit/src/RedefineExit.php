<?php
/**
 * Main package entry point.
 *
 * @package automattic/patchwork-redefine-exit
 */

namespace Automattic;

use Automattic\RedefineExit\ExitException;

/**
 * Main package entry point.
 */
class RedefineExit {

	/**
	 * Function this instance is handling.
	 *
	 * @var string
	 */
	private $which;

	/**
	 * Set up the redefinitions.
	 */
	public static function setup() {
		foreach ( array( 'exit', 'die' ) as $func ) {
			$instance        = new static();
			$instance->which = $func;

			$handle = \Patchwork\redefine( $func, array( $instance, 'exitHandler' ) );
			$handle->addExpirationHandler( array( $instance, 'expirationHandler' ) );
			$handle->unsilence();
		}
	}

	/**
	 * Set up the redefinitions, without registering the expiration handlers.
	 */
	public static function setupDangerously() {
		foreach ( array( 'exit', 'die' ) as $func ) {
			$instance        = new static();
			$instance->which = $func;
			\Patchwork\redefine( $func, array( $instance, 'exitHandler' ) );
		}
	}

	/**
	 * Restore all Patchwork redefines except ours.
	 */
	public static function restoreAll() {
		\Patchwork\restoreAll();
		static::setup();
	}

	/**
	 * Handle Patchwork removing the redefinition.
	 *
	 * @private
	 */
	public function expirationHandler() {
		// Allow removing the handler when called from Patchwork's own __destruct or our restoreAll function.
		// Otherwise complain and exit.
		$bt = $this->getBacktrace();
		foreach ( $bt as $data ) {
			if ( isset( $data['class'] ) && $data['class'] === \Patchwork\CallRerouting\Handle::class && $data['function'] === '__destruct' ) {
				return;
			}
			if ( isset( $data['class'] ) && $data['class'] === static::class && $data['function'] === 'restoreAll' ) {
				return;
			}
		}

		fprintf( STDERR, "The Patchwork handler for %s was removed. This breaks tests, don't do it.\nStack trace:\n%s\n", $this->which, ( new \Exception() )->getTraceAsString() );
		exit( 1 );
	}

	/**
	 * Handle a call to `exit` or `die`.
	 *
	 * @private
	 * @param string|int|null $arg Argument.
	 * @throws ExitException Whenever `$this->ignoreExitCall()` doesn't return true.
	 */
	public function exitHandler( $arg = null ) {
		// While Patchwork does have a way to exclude files from replacement,
		// it requires non-wildcarded paths in the patchwork.json. Easier to just
		// check here for calls from within PHPUnit itself.
		$bt   = $this->getBacktrace();
		$func = \Patchwork\getFunction();
		foreach ( $bt as $i => $data ) {
			if ( $data['function'] === $func ) {
				$stack                = array_slice( $bt, $i );
				$stack[0]['function'] = $this->which;
				if ( $this->ignoreExitCall( $stack ) ) {
					return \Patchwork\relay();
				}
				break;
			}
		}

		throw new ExitException( $this->which, $arg );
	}

	/**
	 * Call debug_backtrace().
	 *
	 * @return array[]
	 */
	protected function getBacktrace() {
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_debug_backtrace
		return debug_backtrace( DEBUG_BACKTRACE_IGNORE_ARGS );
	}

	/**
	 * Determine if a call should be ignored.
	 *
	 * @param array[] $stack Call stack to check, as from `debug_backtrace( DEBUG_BACKTRACE_IGNORE_ARGS )`.
	 *   The top stack frame is the `exit`/`die` call itself.
	 * @return bool True if the `exit`/`die` called via this stack frame should be ignored.
	 */
	protected function ignoreExitCall( $stack ) {
		return isset( $stack[1]['class'] ) && substr( $stack[1]['class'], 0, 8 ) === 'PHPUnit\\';
	}
}
