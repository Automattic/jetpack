<?php
/**
 * Utility class.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack\Connection\Client;

/**
 * Class Utils
 */
class Utils {
	/**
	 * Standardize error format.
	 *
	 * @param mixed $error Error.
	 *
	 * @return array
	 */
	public static function standardize_error( $error ) {
		if ( is_wp_error( $error ) ) {
			return array(
				'name'    => $error->get_error_code(),
				'message' => $error->get_error_message(),
			);
		}

		if ( is_string( $error ) ) {
			return array(
				'name'    => 'Error',
				'message' => $error,
			);
		}

		if ( is_object( $error ) ) {
			return array(
				'name'    => 'Error',
				'message' => json_decode( wp_json_encode( $error ), true ),
			);
		}

		return $error;
	}

	/**
	 * Convert relative url to absolute.
	 *
	 * @param string $url The URL.
	 *
	 * @return string
	 */
	public static function force_url_to_absolute( $url ) {
		if ( substr( $url, 0, 1 ) === '/' ) {
			return get_site_url( null, $url );
		}

		return $url;
	}

	/**
	 * Given a post type, look up its label (if available). Returns
	 * raw post type string if not found.
	 *
	 * @param string $post_type Post type to look up.
	 *
	 * @return string
	 */
	public static function get_post_type_label( $post_type ) {
		$post_type_object = get_post_type_object( $post_type );
		if ( ! $post_type_object ) {
			return $post_type;
		}

		return $post_type_object->labels->name;
	}

	/**
	 * Given a taxonomy name, look up its label. Returns raw taxonomy name if
	 * not found.
	 *
	 * @param string $taxonomy_name Taxonomy to look up.
	 *
	 * @return string
	 */
	public static function get_taxonomy_label( $taxonomy_name ) {
		$taxonomy = get_taxonomy( $taxonomy_name );
		if ( ! $taxonomy ) {
			return $taxonomy_name;
		}

		return $taxonomy->label;
	}

	/**
	 * Make a Jetpack-authenticated request to the WPCOM servers
	 *
	 * @param string $method   Request method.
	 * @param string $endpoint Endpoint to contact.
	 * @param array  $args     Request args.
	 * @param array  $body     Request body.
	 *
	 * @return \WP_Error|object
	 */
	public static function send_wpcom_request( $method, $endpoint, $args = null, $body = null ) {
		$default_args = array(
			'method'  => $method,
			'headers' => array( 'Content-Type' => 'application/json; charset=utf-8' ),
		);

		$response = Client::wpcom_json_api_request_as_blog(
			$endpoint,
			'2',
			array_merge( $default_args, empty( $args ) ? array() : $args ),
			empty( $body ) ? null : wp_json_encode( $body ),
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$json = json_decode( wp_remote_retrieve_body( $response ) );

		// Check for HTTP errors.
		$code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $code ) {
			$default_message = sprintf(
				/* translators: %d is a numeric HTTP error code */
				__( 'HTTP %d while communicating with WordPress.com', 'jetpack-boost' ),
				$code
			);

			$err_code = empty( $json->code ) ? 'http_error' : $json->code;
			$message  = empty( $json->message ) ? $default_message : $json->message;

			return new \WP_Error( $err_code, $message );
		}

		return $json;
	}
}
