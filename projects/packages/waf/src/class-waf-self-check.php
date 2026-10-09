<?php
/**
 * A request the firewall always blocks, so site owners can see it working.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

/**
 * Blocks a request carrying a one-time token, whatever rules are enabled.
 *
 * The token lives in a file, not an option, because in standalone mode the firewall runs before WordPress.
 *
 * @since $$next-version$$
 */
class Waf_Self_Check {

	const QUERY_PARAM = 'jetpack_waf_test';
	const RULE_ID     = -2;
	const REASON      = 'firewall test';
	const TOKEN_TTL   = 60;
	const TOKEN_FILE  = '/self-check-token';

	/**
	 * Create a token that the next request carrying it gets blocked for, replacing any earlier one.
	 *
	 * @param int $ttl Seconds the token stays valid.
	 * @return string|false The token, or false when it could not be saved.
	 */
	public static function create_token( $ttl = self::TOKEN_TTL ) {
		$dir = self::get_dir();
		if ( ! $dir || ( ! is_dir( $dir ) && ! mkdir( $dir, 0755, true ) ) ) {
			return false;
		}

		$token = bin2hex( random_bytes( 16 ) );
		$saved = file_put_contents(
			$dir . self::TOKEN_FILE,
			json_encode(
				array(
					'hash'    => hash( 'sha256', $token ),
					'expires' => time() + $ttl,
				),
				JSON_UNESCAPED_SLASHES
			),
			LOCK_EX
		);

		return $saved ? $token : false;
	}

	/**
	 * Whether the token is the current, unexpired one. A matching token can't be used again.
	 *
	 * @param string $token The token from the request.
	 * @return bool
	 */
	public static function consume_token( $token ) {
		$dir = self::get_dir();
		if ( ! $dir || ! is_string( $token ) || '' === $token ) {
			return false;
		}

		$path = $dir . self::TOKEN_FILE;
		if ( ! is_file( $path ) ) {
			return false;
		}

		$stored = json_decode( (string) file_get_contents( $path ), true );
		if ( ! is_array( $stored ) || ! isset( $stored['hash'] ) || ! isset( $stored['expires'] ) || $stored['expires'] < time() ) {
			unlink( $path );
			return false;
		}

		if ( ! hash_equals( $stored['hash'], hash( 'sha256', $token ) ) ) {
			return false;
		}

		unlink( $path );
		return true;
	}

	/**
	 * Block the request when it carries a valid token.
	 *
	 * @param Waf_Runtime $waf The firewall runtime.
	 * @return void
	 */
	public static function maybe_block( $waf ) {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- The token is the check.
		if ( ! isset( $_GET[ self::QUERY_PARAM ] ) || ! self::consume_token( $_GET[ self::QUERY_PARAM ] ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash -- Only hashed and compared.
			return;
		}

		$waf->block( 'block', self::RULE_ID, self::REASON );
	}

	/**
	 * The firewall's data directory, or null before its constants are set.
	 *
	 * @return string|null
	 */
	private static function get_dir() {
		return defined( 'JETPACK_WAF_DIR' ) ? JETPACK_WAF_DIR : null;
	}
}
