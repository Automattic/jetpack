<?php
/**
 * Test-only subclass of Reprint_Exporter that overrides the protected seams
 * (signature verification, export streaming, termination) so the request handler can
 * be exercised without a real export; `real_verification` runs the vendor
 * verification instead, and tests can observe which seams were reached.
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
	 * Seeded verification result: null means valid, else array( 'message', 'reason' ).
	 *
	 * @var array|null
	 */
	public $signature_error = null;

	/**
	 * Whether to run the real RequestAuthenticator instead of the seeded result.
	 *
	 * @var bool
	 */
	public $real_verification = false;

	/**
	 * The secret passed to verify_signature(), recorded for assertions.
	 *
	 * @var string|null
	 */
	public $verified_secret = null;

	/**
	 * The public keys passed to verify_signature(), or null if it was not reached.
	 *
	 * @var array|null
	 */
	public $verified_public_keys = null;

	/**
	 * The reason passed to error(), if any.
	 *
	 * @var string|null
	 */
	public $error_reason = null;

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
	 * Records the credentials and returns the seeded result, or the real one.
	 *
	 * @param string|null          $secret      The valid shared secret, or null.
	 * @param array<string,string> $public_keys Valid public keys by key id.
	 * @return array|null
	 */
	protected function verify_signature( $secret, array $public_keys ) {
		$this->verified_secret      = $secret;
		$this->verified_public_keys = $public_keys;
		return $this->real_verification ? parent::verify_signature( $secret, $public_keys ) : $this->signature_error;
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
	 * Records the error, then falls through to the real error().
	 *
	 * @param int         $code    HTTP status code.
	 * @param string      $message Error description.
	 * @param string|null $reason  Reason code, or null.
	 */
	protected function error( $code, $message, $reason = null ) {
		$this->error_code   = $code;
		$this->error_reason = $reason;
		parent::error( $code, $message, $reason );
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
