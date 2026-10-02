<?php
/**
 * Expiry_Wpcom: what the expiry notices ask WordPress.com, and remember.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices;

use Automattic\Jetpack\Connection\Client;

/**
 * Every lookup here runs during a page load, so an answer is kept for hours
 * and a failure for minutes: long enough not to retry an outage on every
 * pageview, short enough not to hide a fact for half a day over one blip.
 */
class Expiry_Wpcom {

	const CACHE_TTL   = 12 * HOUR_IN_SECONDS;
	const FAILURE_TTL = 5 * MINUTE_IN_SECONDS;

	// Stored in place of an answer so a failed lookup is remembered too.
	const NONE = 'none';

	/**
	 * The remembered answer to a lookup, asking it once per cache period.
	 *
	 * @param string   $cache_key Transient name.
	 * @param callable $lookup    Returns the answer, or null when it could not be established.
	 * @return string|null
	 */
	public static function remember( string $cache_key, callable $lookup ): ?string {
		$cached = get_transient( $cache_key );
		if ( false !== $cached ) {
			return self::NONE === $cached ? null : (string) $cached;
		}

		$value = $lookup();
		set_transient( $cache_key, $value ?? self::NONE, null === $value ? self::FAILURE_TTL : self::CACHE_TTL );
		return $value;
	}

	/**
	 * GET a REST v1.2 path with the site's blog token, decoded, or null on any failure.
	 *
	 * @param string $path Path under the REST base; `%d` stands for the site's WordPress.com ID.
	 * @return mixed Decoded JSON body, or null.
	 */
	public static function get_as_blog( string $path ) {
		$site_id = \Jetpack_Options::get_option( 'id' );
		if ( ! $site_id ) {
			return null;
		}

		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( $path, (int) $site_id ),
			'1.2',
			array(
				'method'  => 'GET',
				// A slow answer must not become a slow page.
				'timeout' => 5,
			),
			null,
			'rest'
		);

		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return null;
		}

		return json_decode( wp_remote_retrieve_body( $response ) );
	}
}
