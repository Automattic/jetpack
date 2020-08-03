<?php
/**
 * Tweetstorm block and API helper.
 *
 * @package jetpack
 * @since 8.7.0
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Status;
/**
 * Class Jetpack_Tweetstorm_Helper
 *
 * @since 8.7.0
 */
class Jetpack_Tweetstorm_Helper {
	/**
	 * Gather the Tweetstorm.
	 *
	 * @param  string $url The tweet URL to gather from.
	 * @return mixed
	 */
	public static function gather( $url ) {
		if ( ( new Status() )->is_offline_mode() ) {
			return new WP_Error(
				'dev_mode',
				__( 'Tweet unrolling is not available in offline mode.', 'jetpack' )
			);
		}

		$site_id = self::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return $site_id;
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			if ( ! class_exists( 'WPCOM_Gather_Tweetstorm' ) ) {
				\jetpack_require_lib( 'gather-tweetstorm' );
			}

			return WPCOM_Gather_Tweetstorm::gather( $url );
		}

		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/tweetstorm/gather?url=%s', $site_id, rawurlencode( $url ) ),
			2,
			array( 'headers' => array( 'content-type' => 'application/json' ) ),
			null,
			'wpcom'
		);
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$data = json_decode( wp_remote_retrieve_body( $response ) );

		if ( wp_remote_retrieve_response_code( $response ) >= 400 ) {
			return new WP_Error( $data->code, $data->message, $data->data );
		}

		return $data;
	}

	/**
	 * Get the WPCOM or self-hosted site ID.
	 *
	 * @return mixed
	 */
	public static function get_site_id() {
		$is_wpcom = ( defined( 'IS_WPCOM' ) && IS_WPCOM );
		$site_id  = $is_wpcom ? get_current_blog_id() : Jetpack_Options::get_option( 'id' );
		if ( ! $site_id ) {
			return new WP_Error(
				'unavailable_site_id',
				__( 'Sorry, something is wrong with your Jetpack connection.', 'jetpack' ),
				403
			);
		}
		return (int) $site_id;
	}
}
