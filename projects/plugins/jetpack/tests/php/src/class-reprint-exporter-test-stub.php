<?php
/**
 * Test-only subclass of Reprint_Exporter that overrides the protected seams
 * (HMAC verification, export streaming, termination) so the request handler can
 * be exercised without the reprint-exporter vendor classes, a real export, or
 * actually terminating the PHPUnit process.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Reprint_Export\Reprint_Exporter;
use Automattic\RedefineExit\ExitException;

/**
 * Test-only subclass overriding Reprint_Exporter's protected seams.
 */
class Reprint_Exporter_Test_Stub extends Reprint_Exporter {

	/**
	 * Seeded HMAC result: null means "valid", a string is the auth error.
	 *
	 * @var string|null
	 */
	public $hmac_error = null;

	/**
	 * The secret passed to verify_hmac(), recorded for assertions.
	 *
	 * @var string|null
	 */
	public $verified_secret = null;

	/**
	 * Whether serve_export() was reached.
	 *
	 * @var bool
	 */
	public $served = false;

	/**
	 * Whether terminate() was reached.
	 *
	 * @var bool
	 */
	public $terminated = false;

	/**
	 * The HTTP status code passed to error(), or null if error() was not hit.
	 *
	 * @var int|null
	 */
	public $error_code = null;

	/**
	 * Records the secret and returns the seeded HMAC result.
	 *
	 * @param string $secret The per-site shared secret.
	 * @return string|null
	 */
	protected function verify_hmac( $secret ) {
		$this->verified_secret = $secret;
		return $this->hmac_error;
	}

	/**
	 * Records that the export would have been served, without exporting.
	 */
	protected function serve_export() {
		$this->served = true;
	}

	/**
	 * Records the error code, then falls through to the real error() which
	 * echoes the JSON body and calls terminate().
	 *
	 * @param int    $code    HTTP status code.
	 * @param string $message Error description.
	 */
	protected function error( $code, $message ) {
		$this->error_code = $code;
		parent::error( $code, $message );
	}

	/**
	 * Records termination and throws instead of exit()ing, mimicking how a
	 * real exit() would unwind the call stack.
	 *
	 * @return never
	 * @throws ExitException Always, to halt handler execution like exit().
	 */
	protected function terminate() {
		$this->terminated = true;
		// ExitException stands in for exit(); its constructor mirrors the
		// signature the patchwork exit-redefinition uses ( $func, $arg ).
		throw new ExitException( 'exit', null );
	}
}
