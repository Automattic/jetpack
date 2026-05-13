<?php
/**
 * Publicize Message Templates Placeholders class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Publicize\REST_API\Proxy_Requests;
use WP_REST_Request;

/**
 * Fetches and caches the canonical message-template placeholder catalogue from WPCOM.
 *
 * The value transient holds the catalogue and is only overwritten on a
 * successful refetch — we never want to drop back to an empty list.
 * The validity transient acts as a soft TTL: its expiry triggers the next refetch.
 */
class Message_Templates_Placeholders {

	const VALUE_TRANSIENT    = 'jetpack_social_message_template_placeholders';
	const VALIDITY_TRANSIENT = 'jetpack_social_message_template_placeholders_validity';

	const VALIDITY_TTL      = 3 * DAY_IN_SECONDS;
	const FAILURE_RETRY_TTL = HOUR_IN_SECONDS;

	/**
	 * Get the placeholder catalogue.
	 *
	 * @return array<int, array{id: string, label: string}>
	 */
	public static function get_all() {
		if ( Publicize_Utils::is_wpcom() ) {
			return self::wpcom_get_placeholders();
		}

		$cached   = get_transient( self::VALUE_TRANSIENT );
		$is_valid = false !== get_transient( self::VALIDITY_TRANSIENT );

		if ( $is_valid ) {
			return is_array( $cached ) ? $cached : array();
		}

		return self::fetch_and_cache( $cached );
	}

	/**
	 * Fetch from WPCOM and update the cache.
	 *
	 * @param array|false $existing Existing cached value to fall back to on failure.
	 * @return array<int, array{id: string, label: string}>
	 */
	public static function fetch_and_cache( $existing = false ) {
		$placeholders = self::fetch_from_wpcom();

		if ( is_wp_error( $placeholders ) || empty( $placeholders ) ) {
			// Throttle retries so we don't hammer WPCOM while it's unreachable.
			set_transient( self::VALIDITY_TRANSIENT, 1, self::FAILURE_RETRY_TTL );

			return is_array( $existing ) ? $existing : array();
		}

		set_transient( self::VALUE_TRANSIENT, $placeholders, YEAR_IN_SECONDS );
		set_transient( self::VALIDITY_TRANSIENT, 1, self::VALIDITY_TTL );

		return $placeholders;
	}

	/**
	 * Proxy the request to WPCOM as blog.
	 *
	 * @return array|\WP_Error
	 */
	public static function fetch_from_wpcom() {
		$proxy   = new Proxy_Requests( 'publicize/message-templates/placeholders' );
		$request = new WP_REST_Request( 'GET' );

		return $proxy->proxy_request_to_wpcom_as_blog( $request );
	}

	/**
	 * Read and reshape the catalogue directly from WPCOM's helper. WPCOM Simple only.
	 *
	 * @return array<int, array{id: string, label: string}>
	 */
	public static function wpcom_get_placeholders() {
		Publicize_Utils::assert_is_wpcom( __METHOD__ );

		require_lib( 'publicize/util/message-templates' );

		$placeholders = array();
		foreach ( \Publicize\get_supported_placeholders() as $id => $entry ) {
			$placeholders[] = array(
				'id'    => $id,
				'label' => $entry['title'],
			);
		}

		return $placeholders;
	}
}
