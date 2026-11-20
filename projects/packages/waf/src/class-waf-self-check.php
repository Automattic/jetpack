<?php
/**
 * A request the firewall blocks on sight, so site owners can see it working.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

/**
 * Blocks a request carrying a one-time token, whatever rules are enabled, unless the IP allow list lets it through.
 *
 * The token lives in a file, not an option, because in standalone mode the firewall runs before WordPress.
 *
 * @since 0.30.0
 */
class Waf_Self_Check {

	const QUERY_PARAM = 'jetpack_waf_test';
	const RULE_ID     = -2;
	const REASON      = 'firewall test';
	const TOKEN_TTL   = 60;
	const TOKEN_FILE  = '/self-check-token';

	/**
	 * Sent instead of blocking when the request's IP address is on the allow list.
	 */
	const ALLOWED_HEADER = 'X-JetpackWAF-Test-Allowed';

	/**
	 * Create a token that the next request carrying it gets blocked for, replacing any earlier one.
	 *
	 * @param int $ttl Seconds the token stays valid.
	 * @return string|false The token, or false when it could not be saved.
	 */
	public static function create_token( $ttl = self::TOKEN_TTL ) {
		// With the firewall off its constants aren't defined, and the test should still run.
		if ( defined( 'WP_CONTENT_DIR' ) ) {
			Waf_Constants::define_waf_directory();
		}

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
	 * @param mixed $token The token from the request, which can be an array.
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

		// Unreadable can mean `create_token()` is mid-write, so only an expired token is deleted.
		$stored = json_decode( (string) file_get_contents( $path ), true );
		if ( ! is_array( $stored ) || ! isset( $stored['hash'] ) || ! isset( $stored['expires'] ) ) {
			return false;
		}
		if ( $stored['expires'] < time() ) {
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
	 * Block the request when it carries a valid token, unless the IP allow list lets it through.
	 *
	 * @param Waf_Runtime $waf The firewall runtime.
	 * @return void
	 */
	public static function maybe_block( $waf ) {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- The token is the check.
		if ( ! isset( $_GET[ self::QUERY_PARAM ] ) || ! self::consume_token( $_GET[ self::QUERY_PARAM ] ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash -- Only hashed and compared.
			return;
		}

		if ( self::is_ip_allowed( $waf ) ) {
			if ( ! headers_sent() ) {
				header( self::ALLOWED_HEADER . ': ip allow list' );
			}
			return;
		}

		$waf->block( 'block', (string) self::RULE_ID, self::REASON );
	}

	/**
	 * Whether the firewall's rules would stop at the IP allow list for this request.
	 *
	 * @param Waf_Runtime $waf The firewall runtime, which the allow list file reads the request's IP from.
	 * @return bool
	 */
	private static function is_ip_allowed( $waf ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- The allow list file reads it.
		$dir = self::get_dir();
		if ( ! $dir || ! defined( 'JETPACK_WAF_ENTRYPOINT' ) ) {
			return false;
		}

		$allow_list = $dir . Waf_Rules_Manager::IP_ALLOW_RULES_FILE;
		$entrypoint = $dir . '/' . JETPACK_WAF_ENTRYPOINT;
		if ( ! is_file( $allow_list ) || ! is_file( $entrypoint ) ) {
			return false;
		}

		// The generated rules only require the allow list while it's turned on.
		if ( false === strpos( (string) file_get_contents( $entrypoint ), basename( $allow_list ) ) ) {
			return false;
		}

		return (bool) require $allow_list;
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
