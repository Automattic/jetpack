<?php
/**
 * Provides site data sourced from WPCOM
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Client;
use WP_Error;

/**
 * Provides site data sourced from WPCOM
 */
class Site {

	/**
	 * Returns all the data provided by WPCOM for the site.
	 *
	 * @return int|WP_Error the total of plays for today, or WP_Error on failure.
	 */
	public static function get_site_info() {
		$error = new WP_Error(
			'videopress_site_error',
			__( 'Could not fetch site information from the service', 'jetpack-videopress-pkg' )
		);

		$request_path = sprintf( 'sites/%d?force=wpcom', Data::get_blog_id() );
		$response     = Client::wpcom_json_api_request_as_blog( $request_path, '1.1', array(), null, 'rest' );

		if ( is_wp_error( $response ) ) {
			return $error;
		}

		$response_code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $response_code ) {
			return $error;
		}

		$body = wp_remote_retrieve_body( $response );

		return json_decode( $body, true );
	}

	/**
	 * Fetches the current owner blog_id of a VideoPress video from WPCOM.
	 *
	 * A VideoPress GUID is globally single-owner: WPCOM's canonical `videos` record
	 * binds it to exactly one blog, and that binding can change over the video's
	 * lifetime ( most notably a move to another blog ). This asks WPCOM who owns the
	 * GUID right now so the caller can tell whether this site still does.
	 *
	 * @param string $guid The VideoPress GUID.
	 * @return int|WP_Error Owner blog_id ( > 0 ) on success; 0 when WPCOM denies this
	 *                      blog access to the video ( i.e. it is not the owner, e.g. a
	 *                      private video that was moved away ); WP_Error on a transient
	 *                      or unknown failure ( callers should fail open ).
	 */
	public static function get_video_owner_blog_id( $guid ) {
		if ( empty( $guid ) ) {
			return new WP_Error(
				'videopress_missing_guid',
				__( 'A VideoPress GUID is required.', 'jetpack-videopress-pkg' )
			);
		}

		$request_path = sprintf( 'videos/%s', rawurlencode( $guid ) );
		$response     = Client::wpcom_json_api_request_as_blog( $request_path, '1.1', array(), null, 'rest' );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$response_code = wp_remote_retrieve_response_code( $response );

		// A 401/403 for a GUID this site holds locally means the site is not the owner
		// ( most commonly a private video that has been moved to another blog ).
		if ( 401 === $response_code || 403 === $response_code ) {
			return 0;
		}

		if ( 200 !== $response_code ) {
			return new WP_Error(
				'videopress_owner_lookup_failed',
				__( 'Could not determine the video owner.', 'jetpack-videopress-pkg' )
			);
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! is_array( $body ) || ! isset( $body['blog_id'] ) ) {
			return new WP_Error(
				'videopress_owner_lookup_failed',
				__( 'Could not determine the video owner.', 'jetpack-videopress-pkg' )
			);
		}

		return (int) $body['blog_id'];
	}

	/**
	 * Returns all the purchases provided by WPCOM for the site.
	 *
	 * @return array the list of purchases, or an empty list on failure.
	 */
	public static function get_purchases() {
		$request_path = sprintf( 'sites/%1$d/purchases?locale=%2$s', Data::get_blog_id(), get_user_locale() );
		$response     = Client::wpcom_json_api_request_as_blog( $request_path, '1.1', array(), null, 'rest' );

		if ( is_wp_error( $response ) ) {
			return array();
		}

		$response_code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $response_code ) {
			return array();
		}

		$body = wp_remote_retrieve_body( $response );

		return json_decode( $body, true );
	}
}
