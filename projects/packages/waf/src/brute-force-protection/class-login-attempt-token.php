<?php
/**
 * Short-lived authorization for a login attempt that Protect already approved.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf\Brute_Force_Protection;

use Automattic\Jetpack\IP\Utils as IP_Utils;

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
	 * Prefix for the atomic, per-token claim.
	 */
	const CLAIM_TRANSIENT_PREFIX = 'jpp_claim_';

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
		$transient_name = $this->transient_name();
		if ( ! $transient_name ) {
			return;
		}

		try {
			$token = bin2hex( random_bytes( 16 ) );
		} catch ( \Exception $error ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch -- Fail closed by omitting the token.
			return;
		}

		$token_data = array(
			'token_hash'       => hash( 'sha256', $token ),
			'fingerprint_hash' => $this->fingerprint_hash(),
		);

		if ( ! $this->protection->set_transient( $transient_name, $token_data, self::EXPIRATION ) ) {
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

		$token = wp_unslash( $_POST[ self::FIELD_NAME ] ); // phpcs:ignore WordPress.Security.NonceVerification.Missing,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Exact validation below rejects altered input.
		if ( 1 !== preg_match( '/\A[a-f0-9]{32}\z/D', $token ) ) {
			return false;
		}

		$transient_name = $this->transient_name();
		if ( ! $transient_name ) {
			return false;
		}

		$token_data = $this->protection->get_transient( $transient_name );

		if ( ! $this->token_data_matches( $token_data, $token ) ) {
			return false;
		}

		if (
			! $this->protection->add_login_attempt_claim(
				self::CLAIM_TRANSIENT_PREFIX . substr( hash( 'sha256', $token ), 0, 32 ),
				self::EXPIRATION
			)
		) {
			return false;
		}

		return $this->token_data_matches( $this->protection->get_transient( $transient_name ), $token );
	}

	/**
	 * Get the IP-keyed slot for the current outstanding login token.
	 *
	 * @return string|false
	 */
	private function transient_name() {
		$ip = IP_Utils::get_ip();

		return $ip ? self::TRANSIENT_PREFIX . md5( $ip ) : false;
	}

	/**
	 * Hash the complete Protect fingerprint for validation inside the IP-keyed slot.
	 *
	 * @return string
	 */
	private function fingerprint_hash() {
		return hash( 'sha256', $this->protection->get_transient_name() );
	}

	/**
	 * Check token data against the submitted token and current Protect fingerprint.
	 *
	 * @param mixed  $token_data Stored token data.
	 * @param string $token Submitted token.
	 * @return bool
	 */
	private function token_data_matches( $token_data, $token ) {
		return is_array( $token_data )
			&& isset( $token_data['token_hash'] )
			&& isset( $token_data['fingerprint_hash'] )
			&& is_string( $token_data['token_hash'] )
			&& is_string( $token_data['fingerprint_hash'] )
			&& hash_equals( $token_data['token_hash'], hash( 'sha256', $token ) )
			&& hash_equals( $token_data['fingerprint_hash'], $this->fingerprint_hash() );
	}
}
