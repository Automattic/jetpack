<?php
/**
 * Google Drive helper.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Status\Visitor;

/**
 * Class Jetpack_Google_Drive_Helper
 */
class Jetpack_Google_Drive_Helper {
	/**
	 * Checks if the user has a valid connection to Google Drive
	 *
	 * @param int $user_id The user ID.
	 * @return array       Array with single 'valid' (bool) entry.
	 */
	public static function validate_connection( $user_id ) {
		$site_id = self::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return false;
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			// check for gdrive helper class, call synchronously on .com
			require_lib( 'google-sheets-helper' );
			return wp_json_encode( WPCOM_Google_Sheets_Helper::get_validate_connection_response( (int) $user_id ) );
		}

		$request_path  = sprintf( '/sites/%d/google-drive/connection', $site_id );
		$wpcom_request = Client::wpcom_json_api_request_as_user(
			$request_path,
			'2',
			array(
				'method'  => 'GET',
				'headers' => array(
					'content-type'    => 'application/json',
					'X-Forwarded-For' => ( new Visitor() )->get_ip( true ),
				),
			)
		);

		$response_code = wp_remote_retrieve_response_code( $wpcom_request );
		if ( 200 !== $response_code ) {
			return new WP_Error(
				'failed_to_fetch_data',
				esc_html__( 'Unable to fetch the requested data.', 'jetpack' ),
				array( 'status' => $response_code )
			);
		}
		return json_decode( wp_remote_retrieve_body( $wpcom_request ), true );
	}

	/**
	 * Creates a Google Spreadsheet and returns some of its meta
	 *
	 * @param int    $user_id The user ID.
	 * @param string $title   The spreadsheet title.
	 * @param array  $rows    Array of arrays with values.
	 * @return array
	 */
	public static function create_sheet( $user_id, $title, $rows = array() ) {
		$site_id = self::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return false;
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			// check for gdrive helper class, call synchronously on .com
			require_lib( 'google-sheets-helper' );
			return wp_json_encode( WPCOM_Google_Sheets_Helper::get_create_spreadsheet_response( $user_id, $title, $rows ) );
		}

		$request_path  = sprintf( '/sites/%d/google-drive/sheets', $site_id );
		$wpcom_request = Client::wpcom_json_api_request_as_user(
			$request_path,
			'2',
			array(
				'method'  => 'POST',
				'headers' => array(
					'content-type'    => 'application/json',
					'X-Forwarded-For' => ( new Visitor() )->get_ip( true ),
				),
			),
			array(
				'parent_post_slug' => $title,
				'rows'             => $rows,
			)
		);
		$response_code = wp_remote_retrieve_response_code( $wpcom_request );
		if ( 200 !== $response_code ) {
			return new WP_Error(
				'failed_to_fetch_data',
				esc_html__( 'Unable to fetch the requested data.', 'jetpack' ),
				array( 'status' => $response_code )
			);
		}
		return json_decode( wp_remote_retrieve_body( $wpcom_request ), true );
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
