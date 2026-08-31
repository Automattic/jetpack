<?php
/**
 * Shared helper for the podcast REST proxy endpoints: relays a
 * `Connection\Client` response back to the local REST client.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

use WP_Error;
use WP_REST_Response;

/**
 * Used by the wpcom/v2 proxy controllers (Podcast_Stats_Endpoint,
 * Podcast_Distribution_Endpoint, Posts_To_Podcast_Endpoint) to round-trip the
 * upstream wpcom response: preserves status code and decodes the JSON body so
 * `apiFetch` on the client surfaces 4xx/5xx errors with their `{code, message}`
 * payloads intact.
 */
trait Relay_Response {

	/**
	 * Relay an upstream Connection\Client response back to the local REST client.
	 * Preserves the upstream HTTP status code so 4xx/5xx mappings flow through.
	 *
	 * @param array|WP_Error $response The raw response from Connection\Client.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	private function relay_response( $response ) {
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$code    = (int) wp_remote_retrieve_response_code( $response );
		$body    = wp_remote_retrieve_body( $response );
		$decoded = json_decode( $body, true );

		$rest_response = rest_ensure_response( null === $decoded ? $body : $decoded );
		if ( $code >= 100 && $code < 600 ) {
			$rest_response->set_status( $code );
		}
		return $rest_response;
	}
}
