<?php
/**
 * Short-lived authorization for a login attempt that Protect already approved.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf\Brute_Force_Protection;

use Automattic\Jetpack\IP\Utils as IP_Utils;

/**
 * Manages short-lived, single-use login attempt tokens.
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
	 * Outstanding tokens kept per IP, so shared IPs and extra tabs work while stockpiling stays bounded.
	 */
	const MAX_TOKENS_PER_IP = 5;

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
		} catch ( \Exception $error ) {
			return; // Fail closed by omitting the token.
		}

		$tokens                             = $this->outstanding_tokens( $transient_name );
		$tokens[ hash( 'sha256', $token ) ] = time();
		$tokens                             = array_slice( $tokens, -self::MAX_TOKENS_PER_IP, null, true );

		if ( ! $this->protection->set_transient( $transient_name, $tokens, self::EXPIRATION ) ) {
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

		$transient_name = $this->transient_name();
		if ( ! $transient_name ) {
			return false;
		}

		$token_hash = hash( 'sha256', wp_unslash( $_POST[ self::FIELD_NAME ] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Only hashed; altered input cannot match a stored hash.
		if ( ! isset( $this->outstanding_tokens( $transient_name )[ $token_hash ] ) ) {
			return false;
		}

		// The claim, not the token list, enforces single use, so concurrent renders never lose tokens.
		return $this->protection->add_login_attempt_claim(
			self::CLAIM_TRANSIENT_PREFIX . substr( $token_hash, 0, 32 ),
			self::EXPIRATION
		);
	}

	/**
	 * Get the slot for the current IP's outstanding tokens.
	 *
	 * @return string|false
	 */
	private function transient_name() {
		$ip = IP_Utils::get_ip();

		return $ip ? self::TRANSIENT_PREFIX . md5( $ip ) : false;
	}

	/**
	 * Get the unexpired token hashes for a slot.
	 *
	 * @param string $transient_name Slot name.
	 * @return int[] Issue times keyed by token hash.
	 */
	private function outstanding_tokens( $transient_name ) {
		$tokens = $this->protection->get_transient( $transient_name );
		if ( ! is_array( $tokens ) ) {
			return array();
		}

		// Each render refreshes the slot's expiry, so expire tokens individually.
		$oldest = time() - self::EXPIRATION;

		return array_filter(
			$tokens,
			static function ( $issued_at ) use ( $oldest ) {
				return $issued_at > $oldest;
			}
		);
	}
}
