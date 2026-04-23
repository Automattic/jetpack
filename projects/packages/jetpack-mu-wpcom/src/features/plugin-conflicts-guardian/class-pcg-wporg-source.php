<?php
/**
 * WordPress.org plugin-metadata fetcher for the Plugin Conflicts Guardian.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Reads the `requires`, `requires_php`, `tested`, `version`, and `name`
 * fields from api.wordpress.org/plugins/info/1.0/{slug}.json. Responses
 * are cached in a 1-hour transient per slug; a stale cache is acceptable
 * here because the underlying metadata changes infrequently.
 *
 * Returns null for any non-200 response (unknown slug, network blip,
 * malformed body) — callers treat null as "no data, skip version checks".
 */
class PCG_Wporg_Source {

	const CACHE_TTL    = HOUR_IN_SECONDS;
	const ENDPOINT     = 'https://api.wordpress.org/plugins/info/1.0/%s.json';
	const HTTP_TIMEOUT = 5;

	/**
	 * Fetch metadata for a plugin slug.
	 *
	 * @param string $slug WP.org plugin slug (e.g. "elementor").
	 * @return array{name:string,version:string,requires:string,requires_php:string,tested:string}|null
	 */
	public function fetch( $slug ) {
		$slug = sanitize_key( $slug );
		if ( '' === $slug ) {
			return null;
		}

		$cache_key = 'pcg_wporg_' . md5( $slug );
		$cached    = get_transient( $cache_key );
		if ( false !== $cached ) {
			return is_array( $cached ) ? $cached : null;
		}

		$response = wp_remote_get(
			sprintf( self::ENDPOINT, rawurlencode( $slug ) ),
			array( 'timeout' => self::HTTP_TIMEOUT )
		);
		if ( is_wp_error( $response ) ) {
			return null;
		}
		if ( 200 !== (int) wp_remote_retrieve_response_code( $response ) ) {
			return null;
		}
		$body = json_decode( (string) wp_remote_retrieve_body( $response ), true );
		if ( ! is_array( $body ) || empty( $body['slug'] ) ) {
			return null;
		}

		$data = array(
			'name'         => (string) ( $body['name'] ?? '' ),
			'version'      => (string) ( $body['version'] ?? '' ),
			'requires'     => (string) ( $body['requires'] ?? '' ),
			'requires_php' => (string) ( $body['requires_php'] ?? '' ),
			'tested'       => (string) ( $body['tested'] ?? '' ),
		);

		set_transient( $cache_key, $data, self::CACHE_TTL );

		return $data;
	}
}
