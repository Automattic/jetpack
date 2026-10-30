<?php
/**
 * Helper for sharing buttons that send readers to an address they enter, such as a Mastodon instance.
 *
 * @package automattic/jetpack
 */

declare( strict_types = 1 );

/**
 * Class Jetpack_Share_Destination_Helper
 */
class Jetpack_Share_Destination_Helper {
	/**
	 * Rewrite http:// addresses to https://.
	 *
	 * @var bool
	 */
	const UPGRADE_HTTP = true;

	/**
	 * Keep http:// addresses as entered.
	 *
	 * @var bool
	 */
	const KEEP_HTTP = false;

	/**
	 * Build an endpoint URL on the site at the address a reader entered.
	 *
	 * @param string $address      Address the reader entered, with or without a scheme.
	 * @param string $path         Path to append to the address, e.g. 'share'.
	 * @param bool   $upgrade_http self::UPGRADE_HTTP or self::KEEP_HTTP.
	 * @return string|null Endpoint URL without a query string, or null if the address is not usable.
	 */
	public static function get_endpoint( string $address, string $path, bool $upgrade_http ): ?string {
		$address = trim( $address );
		if ( ! preg_match( '#^[a-z][a-z0-9+.-]*://#i', $address ) ) {
			$address = 'https://' . $address;
		}

		$parts = wp_parse_url( $address );
		if ( ! is_array( $parts ) || empty( $parts['host'] ) || empty( $parts['scheme'] ) ) {
			return null;
		}

		$scheme = strtolower( $parts['scheme'] );
		if ( 'https' !== $scheme && 'http' !== $scheme ) {
			return null;
		}
		if ( $upgrade_http ) {
			$scheme = 'https';
		}

		// In https://example.com@example.org the host is example.org, not the name the reader sees first.
		if ( isset( $parts['user'] ) || isset( $parts['pass'] ) ) {
			return null;
		}

		if ( ! preg_match( '/^[\p{L}\p{M}\p{N}.-]+$/u', $parts['host'] ) ) {
			return null;
		}

		$url = $scheme . '://' . $parts['host'];
		if ( isset( $parts['port'] ) ) {
			$url .= ':' . $parts['port'];
		}
		$url .= rtrim( $parts['path'] ?? '', '/' ) . '/' . ltrim( $path, '/' );

		$url = esc_url_raw( $url, array( $scheme ) );

		return '' === $url ? null : $url;
	}

	/**
	 * URL of a service's address prompt for a post, where a reader can try another address.
	 *
	 * @param int    $post_id Post ID.
	 * @param string $service Sharing service short name, e.g. 'mastodon'.
	 * @return string
	 */
	public static function get_prompt_url( int $post_id, string $service ): string {
		return add_query_arg(
			array(
				'share' => $service,
				'nb'    => 1,
			),
			get_permalink( $post_id )
		);
	}
}
