<?php
/**
 * Test-only subclass of Reprint_Exporter that overrides the protected seams
 * (HMAC verification, export streaming, termination) so the request handler can
 * be exercised without the reprint-server vendor classes or a real export, and
 * so tests can observe which of them were reached.
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
	 * Exception thrown by serve_export(), if any.
	 *
	 * @var \InvalidArgumentException|null
	 */
	public $serve_error = null;

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
	 *
	 * @throws \InvalidArgumentException When configured to simulate invalid export parameters.
	 */
	protected function serve_export() {
		$this->served = true;

		if ( null !== $this->serve_error ) {
			throw $this->serve_error;
		}
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
	 * Records that the request terminated, then exits for real.
	 *
	 * The test bootstrap redefines exit() to throw instead of stopping PHP, so
	 * this only has to note that termination happened.
	 *
	 * @return never
	 * @throws ExitException Always, from the redefined exit().
	 */
	protected function terminate() {
		$this->terminated = true;
		parent::terminate();
	}
}
