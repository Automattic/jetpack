<?php
/**
 * Google Drive helper.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Forms\Service;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\External_Connections;
use Automattic\Jetpack\Status\Visitor;
use WP_Error;

/**
 * Class Google_Drive
 */
class Google_Drive {
	/**
	 * Checks if the user has a valid connection to Google Drive
	 *
	 * @return boolean Whether the connection is valid.
	 */
	public static function has_valid_connection() {
		return External_Connections::get_connection_data( 'google-drive' )['is_connected'];
	}

	/**
	 * Extracts a spreadsheet ID from a Google Sheets reference.
	 *
	 * Accepts a full document URL or a bare ID, since users paste both. Returns
	 * null when the input is neither, so callers can reject it with a message
	 * rather than sending nonsense to Google.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $reference A Google Sheets URL, or a bare spreadsheet ID.
	 * @return string|null The spreadsheet ID, or null when the input is not one.
	 */
	public static function extract_sheet_id( $reference ) {
		$reference = trim( (string) $reference );

		if ( '' === $reference ) {
			return null;
		}

		$matches = array();
		if ( preg_match( '#/spreadsheets/d/([a-zA-Z0-9_-]+)#', $reference, $matches ) ) {
			return $matches[1];
		}

		// A bare ID. Google uses a URL-safe alphabet and IDs are comfortably long,
		// so the length floor keeps stray words from being mistaken for one.
		if ( preg_match( '#^[a-zA-Z0-9_-]{10,}$#', $reference ) ) {
			return $reference;
		}

		return null;
	}

	/**
	 * Creates a Google Spreadsheet and returns some of its meta
	 *
	 * @param int    $user_id The user ID.
	 * @param string $title   The spreadsheet title.
	 * @param array  $rows    Array of arrays with values.
	 * @return array|WP_Error
	 */
	public static function create_sheet( $user_id, $title, $rows = array() ) {
		$site_id = Manager::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return false;
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			// check for gdrive helper class, call synchronously on .com
			require_lib( 'google-sheets-helper' );
			$helper = \WPCOM_Google_Sheets_helper::create_for_user( $user_id );

			if ( is_wp_error( $helper ) ) {
				return $helper;
			}

			$spreadsheet = $helper->create_spreadsheet( $title, $rows );

			if ( is_wp_error( $spreadsheet ) ) {
				return $spreadsheet;
			}

			return array(
				// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- as is on google client
				'sheet_link' => $spreadsheet->spreadsheetUrl,
				// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- as is on google client
				'sheet_id'   => $spreadsheet->spreadsheetId,
			);
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
				'title' => $title,
				'rows'  => $rows,
			)
		);
		$response_code = wp_remote_retrieve_response_code( $wpcom_request );
		if ( 200 !== $response_code ) {
			return new \WP_Error(
				'failed_to_fetch_data',
				esc_html__( 'Unable to fetch the requested data.', 'jetpack-forms' ),
				array( 'status' => $response_code )
			);
		}
		return json_decode( wp_remote_retrieve_body( $wpcom_request ), true );
	}

	/**
	 * Fetches a spreadsheet's metadata and its header row.
	 *
	 * Used when a form is pointed at a spreadsheet the user already owns, so we
	 * can confirm it exists and reconcile our columns against the headers that
	 * are already there.
	 *
	 * @since $$next-version$$
	 *
	 * @param int    $user_id  The user whose Google connection to use.
	 * @param string $sheet_id The spreadsheet ID.
	 * @return array|WP_Error Array with sheet_id, sheet_link, title and headers.
	 */
	public static function get_sheet( $user_id, $sheet_id ) {
		$site_id = Manager::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return $site_id;
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			// Check for gdrive helper class, call synchronously on .com.
			require_lib( 'google-sheets-helper' );
			$helper = \WPCOM_Google_Sheets_helper::create_for_user( $user_id );

			if ( is_wp_error( $helper ) ) {
				return $helper;
			}

			return $helper->get_spreadsheet_summary( $sheet_id );
		}

		$request_path  = sprintf( '/sites/%d/google-drive/sheets/%s', $site_id, rawurlencode( $sheet_id ) );
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
			return new \WP_Error(
				'failed_to_fetch_data',
				esc_html__( 'Unable to fetch the requested data.', 'jetpack-forms' ),
				array( 'status' => $response_code )
			);
		}

		return json_decode( wp_remote_retrieve_body( $wpcom_request ), true );
	}
}
