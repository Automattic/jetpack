<?php
/**
 * Class to handle the Scan Status of Jetpack Protect
 *
 * @package automattic/jetpack-protect-plugin
 */

namespace Automattic\Jetpack\Protect;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Protect_Models\Extension_Model;
use Automattic\Jetpack\Protect_Status\Plan;
use Jetpack_Options;
use WP_Error;

/**
 * Class that handles fetching of threats from the Scan API
 */
class Scan_History {
	/**
	 * Scan endpoint
	 *
	 * @var string
	 */
	const SCAN_HISTORY_API_BASE = '/sites/%d/scan/history';

	/**
	 * Name of the option where history is stored
	 *
	 * @var string
	 */
	const OPTION_NAME = 'jetpack_scan_history';

	/**
	 * Name of the option where the timestamp of the history is stored
	 *
	 * @var string
	 */
	const OPTION_TIMESTAMP_NAME = 'jetpack_scan_history_timestamp';

	/**
	 * Time in seconds that the cache should last
	 *
	 * @var int
	 */
	const OPTION_EXPIRES_AFTER = 300; // 5 minutes.

	/**
	 * Memoization for the current history
	 *
	 * @var null|History_Model
	 */
	public static $history = null;

	/**
	 * Checks if the current cached history is expired and should be renewed
	 *
	 * @return boolean
	 */
	public static function is_cache_expired() {
		$option_timestamp = get_option( static::OPTION_TIMESTAMP_NAME );

		if ( ! $option_timestamp ) {
			return true;
		}

		return time() > (int) $option_timestamp;
	}

	/**
	 * Checks if we should consider the stored cache or bypass it
	 *
	 * @return boolean
	 */
	public static function should_use_cache() {
		return ! ( ( defined( 'JETPACK_PROTECT_DEV__BYPASS_CACHE' ) && JETPACK_PROTECT_DEV__BYPASS_CACHE ) );
	}

	/**
	 * Gets the current cached history
	 *
	 * @return bool|array False if value is not found. Array with values if cache is found.
	 */
	public static function get_from_options() {
		return maybe_unserialize( get_option( static::OPTION_NAME ) );
	}

	/**
	 * Updated the cached history and its timestamp
	 *
	 * @param array $history The new history to be cached.
	 * @return void
	 */
	public static function update_history_option( $history ) {
		// TODO: Sanitize $history.
		update_option( static::OPTION_NAME, maybe_serialize( $history ) );
		update_option( static::OPTION_TIMESTAMP_NAME, time() + static::OPTION_EXPIRES_AFTER );
	}

	/**
	 * Delete the cached history and its timestamp
	 *
	 * @return bool Whether all related history options were successfully deleted.
	 */
	public static function delete_option() {
		$option_deleted           = delete_option( static::OPTION_NAME );
		$option_timestamp_deleted = delete_option( static::OPTION_TIMESTAMP_NAME );

		return $option_deleted && $option_timestamp_deleted;
	}

	/**
	 * Gets the current history of the Jetpack Protect checks
	 *
	 * @param bool  $refresh_from_wpcom Refresh the local plan and history cache from wpcom.
	 * @return History_Model|bool
	 */
	public static function get_scan_history( $refresh_from_wpcom = false ) {
		$has_required_plan = Plan::has_required_plan();
		if ( ! $has_required_plan ) {
			return false;
		}

		if ( self::$history !== null ) {
			return self::$history;
		}

		if ( $refresh_from_wpcom || ! self::should_use_cache() || self::is_cache_expired() ) {
			$history = self::fetch_from_api();
		} else {
			$history = self::get_from_options();
		}

		if ( is_wp_error( $history ) ) {
			$history = new History_Model(
				array(
					'error'         => true,
					'error_code'    => $history->get_error_code(),
					'error_message' => $history->get_error_message(),
				)
			);
		} else {
			$history = self::normalize_api_data( $history );
		}

		self::$history = $history;
		return $history;
	}

	/**
	 * Gets the Scan API endpoint
	 *
	 * @return WP_Error|string
	 */
	public static function get_api_url() {
		$blog_id      = Jetpack_Options::get_option( 'id' );
		$is_connected = ( new Connection_Manager() )->is_connected();

		if ( ! $blog_id || ! $is_connected ) {
			return new WP_Error( 'site_not_connected' );
		}

		$api_url = sprintf( self::SCAN_HISTORY_API_BASE, $blog_id );

		return $api_url;
	}

	/**
	 * Fetches the history data from the Scan API
	 *
	 * @return WP_Error|array
	 */
	public static function fetch_from_api() {
		$api_url = self::get_api_url();
		if ( is_wp_error( $api_url ) ) {
			return $api_url;
		}

		$response = Client::wpcom_json_api_request_as_blog(
			$api_url,
			'2',
			array( 'method' => 'GET' ),
			null,
			'wpcom'
		);

		$response_code = wp_remote_retrieve_response_code( $response );

		if ( is_wp_error( $response ) || 200 !== $response_code || empty( $response['body'] ) ) {
			return new WP_Error( 'failed_fetching_status', 'Failed to fetch Scan history from the server', array( 'status' => $response_code ) );
		}

		$body               = json_decode( wp_remote_retrieve_body( $response ) );
		$body->last_checked = ( new \DateTime() )->format( 'Y-m-d H:i:s' );
		self::update_history_option( $body );

		return $body;
	}

	/**
	 * Normalize API Data
	 * Formats the payload from the Scan API into an instance of History_Model.
	 *
	 * @param object $scan_data The data returned by the scan API.
	 * @return History_Model
	 */
	private static function normalize_api_data( $scan_data ) {
		$history = new History_Model();

		if ( empty( $scan_data->threats ) || ! is_array( $scan_data->threats ) ) {
			return $history;
		}

		foreach ( $scan_data->threats as $threat ) {
			$threat_model       = new Threat_Model( $threat );
			$history->threats[] = $threat_model;

			++$history->num_threats;
			switch ( $threat_model->status ) {
				case 'fixed':
					++$history->num_fixed_threats;
					break;
				case 'ignored':
					++$history->num_ignored_threats;
					break;
			}
		}

		return $history;
	}
}
