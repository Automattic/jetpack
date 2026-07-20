<?php
/**
 * Short-lived authorization for a login attempt that Protect already approved.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf\Brute_Force_Protection;

/**
 * Manages a short-lived, single-use login attempt token.
 */
class Brute_Force_Protection_Login_Attempt_Token {
	/**
	 * Login form field name.
	 */
	const FIELD_NAME = 'jetpack_protect_login_attempt';

	/**
	 * Token lifetime in seconds.
	 */
	const EXPIRATION = 600;

	/**
	 * Transient prefix. The full name stays within WordPress's 45-character limit.
	 */
	const TRANSIENT_PREFIX = 'jpp_attempt_';

	/**
	 * Brute Force Protection instance.
	 *
	 * @var Brute_Force_Protection
	 */
	private $protection;

	/**
	 * Constructor.
	 *
	 * @param Brute_Force_Protection $protection Brute Force Protection instance.
	 */
	public function __construct( Brute_Force_Protection $protection ) {
		$this->protection = $protection;
	}

	/**
	 * Render a token for a login attempt that Protect already approved.
	 */
	public function render_field() {
		$token = str_replace( '-', '', wp_generate_uuid4() );

		if ( ! $this->protection->set_transient( $this->transient_name(), hash( 'sha256', $token ), self::EXPIRATION ) ) {
			return;
		}

		printf(
			'<input type="hidden" name="%1$s" value="%2$s" />',
			esc_attr( self::FIELD_NAME ),
			esc_attr( $token )
		);
	}

	/**
	 * Consume a submitted token.
	 *
	 * @return bool Whether a valid token was consumed.
	 */
	public function consume() {
		if ( ! isset( $_POST[ self::FIELD_NAME ] ) || ! is_string( $_POST[ self::FIELD_NAME ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing -- The random, single-use token authorizes this request.
			return false;
		}

		$token = sanitize_key( wp_unslash( $_POST[ self::FIELD_NAME ] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing -- The random, single-use token authorizes this request.
		if ( 1 !== preg_match( '/\A[a-f0-9]{32}\z/D', $token ) ) {
			return false;
		}

		$transient_name = $this->transient_name();
		$expected_hash  = $this->protection->get_transient( $transient_name );

		if ( ! is_string( $expected_hash ) || ! hash_equals( $expected_hash, hash( 'sha256', $token ) ) ) {
			return false;
		}

		return $this->protection->delete_transient( $transient_name );
	}

	/**
	 * Get the transient name for the current Protect client fingerprint.
	 *
	 * @return string
	 */
	private function transient_name() {
		return self::TRANSIENT_PREFIX . md5( $this->protection->get_transient_name() );
	}
}
