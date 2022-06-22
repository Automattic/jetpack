<?php
/**
 * Class to handle the Status of Jetpack Protect
 *
 * @package automattic/jetpack-protect-plugin
 */

namespace Automattic\Jetpack\Protect;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Plugins_Installer;
use Automattic\Jetpack\Sync\Functions as Sync_Functions;
use Jetpack_Options;
use WP_Error;

/**
 * Class that handles fetching and caching the Status of vulnerabilities check from the WPCOM servers
 */
class Status {

	/**
	 * WPCOM endpoint
	 *
	 * @var string
	 */
	const REST_API_BASE = '/sites/%d/jetpack-protect-status';

	/**
	 * Name of the option where status is stored
	 *
	 * @var string
	 */
	const OPTION_NAME = 'jetpack_protect_status';

	/**
	 * Name of the option where the timestamp of the status is stored
	 *
	 * @var string
	 */
	const OPTION_TIMESTAMP_NAME = 'jetpack_protect_status_time';

	/**
	 * Time in seconds that the cache should last
	 *
	 * @var int
	 */
	const OPTION_EXPIRES_AFTER = 3600; // 1 hour.

	/**
	 * Time in seconds that the cache for the initial empty response should last
	 *
	 * @var int
	 */
	const INITIAL_OPTION_EXPIRES_AFTER = 1 * MINUTE_IN_SECONDS;

	/**
	 * Memoization for the current status
	 *
	 * @var null|array
	 */
	public static $status = null;

	/**
	 * Gets the current status of the Jetpack Protect checks
	 *
	 * @return array
	 */
	public static function get_status() {
		if ( self::$status !== null ) {
			return self::$status;
		}

		if ( ! self::should_use_cache() || self::is_cache_expired() ) {
			$status = self::fetch_from_server();
		} else {
			$status = self::get_from_options();
		}

		if ( is_wp_error( $status ) ) {
			$status = array(
				'error'         => true,
				'error_code'    => $status->get_error_code(),
				'error_message' => $status->get_error_message(),
			);
		}
		self::$status = $status;
		return $status;
	}

	/**
	 * Checks the current status to see if there are any vulnerabilities found
	 *
	 * @return boolean
	 */
	public static function has_vulnerabilities() {
		return 0 < self::get_total_vulnerabilities();
	}

	/**
	 * Gets the total number of vulnerabilities found
	 *
	 * @return integer
	 */
	public static function get_total_vulnerabilities() {
		$status = self::get_status();
		return isset( $status->num_vulnerabilities ) && is_int( $status->num_vulnerabilities ) ? $status->num_vulnerabilities : 0;
	}

	/**
	 * Get all vulnerabilities combined
	 *
	 * @return array
	 */
	public static function get_all_vulnerabilities() {
		return array_merge(
			self::get_wordpress_vulnerabilities(),
			self::get_themes_vulnerabilities(),
			self::get_plugins_vulnerabilities()
		);
	}

	/**
	 * Get vulnerabilities found for WordPress core
	 *
	 * @return array
	 */
	public static function get_wordpress_vulnerabilities() {
		return self::get_vulnerabilities( 'core' );
	}

	/**
	 * Get vulnerabilities found for themes
	 *
	 * @return array
	 */
	public static function get_themes_vulnerabilities() {
		return self::get_vulnerabilities( 'themes' );
	}

	/**
	 * Get vulnerabilities found for plugins
	 *
	 * @return array
	 */
	public static function get_plugins_vulnerabilities() {
		return self::get_vulnerabilities( 'plugins' );
	}

	/**
	 * Get the vulnerabilities for one type of extension or core
	 *
	 * @param string $type What vulnerabilities you want to get. Possible values are 'core', 'themes' and 'plugins'.
	 *
	 * @return array
	 */
	public static function get_vulnerabilities( $type ) {
		$status = self::get_status();
		if ( 'core' === $type ) {
			return isset( $status->$type ) && ! empty( $status->$type->vulnerabilities ) ? $status->$type->vulnerabilities : array();
		}

		$vuls = array();
		if ( isset( $status->$type ) ) {
			foreach ( (array) $status->$type as $item ) {
				if ( ! empty( $item->vulnerabilities ) ) {
					$vuls = array_merge( $vuls, $item->vulnerabilities );
				}
			}
		}
		return $vuls;
	}

	/**
	 * Checks if the current cached status is expired and should be renewed
	 *
	 * @return boolean
	 */
	public static function is_cache_expired() {
		$option_timestamp = get_option( self::OPTION_TIMESTAMP_NAME );

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
		return defined( 'JETPACK_PROTECT_DEV__BYPASS_CACHE' ) && JETPACK_PROTECT_DEV__BYPASS_CACHE ? false : true;
	}

	/**
	 * Gets the WPCOM API endpoint
	 *
	 * @return WP_Error|string
	 */
	public static function get_api_url() {
		$blog_id      = Jetpack_Options::get_option( 'id' );
		$is_connected = ( new Connection_Manager() )->is_connected();

		if ( ! $blog_id || ! $is_connected ) {
			return new WP_Error( 'site_not_connected' );
		}

		$api_url = sprintf( self::REST_API_BASE, $blog_id );

		if ( defined( 'JETPACK_PROTECT_DEV__API_RESPONSE_TYPE' ) && is_string( JETPACK_PROTECT_DEV__API_RESPONSE_TYPE ) ) {
			$api_url = add_query_arg( array( 'response_type' => JETPACK_PROTECT_DEV__API_RESPONSE_TYPE ), $api_url );
		}
		if ( defined( 'JETPACK_PROTECT_DEV__API_CORE_VULS' ) && is_int( JETPACK_PROTECT_DEV__API_CORE_VULS ) ) {
			$api_url = add_query_arg( array( 'core_vuls' => JETPACK_PROTECT_DEV__API_CORE_VULS ), $api_url );
		}
		return $api_url;
	}

	/**
	 * Fetches the status from WPCOM servers
	 *
	 * @return WP_Error|array
	 */
	public static function fetch_from_server() {
		$api_url = self::get_api_url();
		if ( is_wp_error( $api_url ) ) {
			return $api_url;
		}

		$response = Client::wpcom_json_api_request_as_blog(
			self::get_api_url(),
			'2',
			array( 'method' => 'GET' ),
			null,
			'wpcom'
		);

		$response_code = wp_remote_retrieve_response_code( $response );

		if ( is_wp_error( $response ) || 200 !== $response_code || empty( $response['body'] ) ) {
			return new WP_Error( 'failed_fetching_status', 'Failed to fetch Protect Status data from server', array( 'status' => $response_code ) );
		}

		$body = self::normalize_report_data( wp_remote_retrieve_body( $response ) );
		self::update_option( $body );
		return $body;
	}

	/**
	 * Gets the current cached status
	 *
	 * @return bool|array False if value is not found. Array with values if cache is found.
	 */
	public static function get_from_options() {
		return get_option( self::OPTION_NAME );
	}

	/**
	 * Updated the cached status and its timestamp
	 *
	 * @param array $status The new status to be cached.
	 * @return void
	 */
	public static function update_option( $status ) {
		// TODO: Sanitize $status.
		update_option( self::OPTION_NAME, $status );
		$end_date = self::get_cache_end_date_by_status( $status );
		update_option( self::OPTION_TIMESTAMP_NAME, $end_date );
	}

	/**
	 * Returns the timestamp the cache should expire depending on the current status
	 *
	 * Initial empty status, which are returned before the first check was performed, should be cache for less time
	 *
	 * @param object $status The response from the server being cached.
	 * @return int The timestamp when the cache should expire.
	 */
	public static function get_cache_end_date_by_status( $status ) {
		if ( ! is_object( $status ) || empty( $status->last_checked ) ) {
			return time() + self::INITIAL_OPTION_EXPIRES_AFTER;
		}
		return time() + self::OPTION_EXPIRES_AFTER;
	}

	/**
	 * Delete the cached status and its timestamp
	 *
	 * @return void
	 */
	public static function delete_option() {
		delete_option( self::OPTION_NAME );
		delete_option( self::OPTION_TIMESTAMP_NAME );
	}

	/**
	 * Prepare the report data for the UI
	 *
	 * @param string $body The report status report response.
	 * @return object The normalized report data.
	 */
	private static function normalize_report_data( $body ) {
		$report_data = json_decode( $body );

		$installed_plugins    = Plugins_Installer::get_plugins();
		$report_data->plugins = self::merge_installed_and_checked_lists( $installed_plugins, $report_data->plugins, array( 'type' => 'plugin' ) );

		$installed_themes    = Sync_Functions::get_themes();
		$report_data->themes = self::merge_installed_and_checked_lists( $installed_themes, $report_data->themes, array( 'type' => 'theme' ) );

		$report_data->core = self::normalize_core_information( $report_data->core );

		return $report_data;
	}

	/**
	 * Merges the list of installed extensions with the list of extensions that were checked for known vulnerabilities and return a normalized list to be used in the UI
	 *
	 * @param object $installed The list of installed extensions, where each attribute key is the extension slug.
	 * @param object $checked   The list of checked extensions.
	 * @param array  $append    Additional data to append to each result in the list.
	 * @return array Normalized list of extensions.
	 */
	private static function merge_installed_and_checked_lists( $installed, $checked, $append ) {
		$new_list = array();
		foreach ( $installed as $slug => $item ) {
			if ( isset( $checked->{ $slug } ) && $checked->{ $slug }->version === $installed[ $slug ]['Version'] ) {
				array_push(
					$new_list,
					(object) array_merge(
						array(
							'name'            => $installed[ $slug ]['Name'],
							'version'         => $checked->{ $slug }->version,
							'vulnerabilities' => $checked->{ $slug }->vulnerabilities,
							'not_checked'     => false,
						),
						$append
					)
				);
			} else {
				array_push(
					$new_list,
					(object) array_merge(
						array(
							'name'            => $installed[ $slug ]['Name'],
							'version'         => $installed[ $slug ]['Version'],
							'vulnerabilities' => array(),
							'not_checked'     => true,
						),
						$append
					)
				);
			}
		}
		usort(
			$new_list,
			function ( $a, $b ) {
				$vuls_a    = count( $a->vulnerabilities ) > 0 ? 2 : 0;
				$vuls_b    = count( $b->vulnerabilities ) > 0 ? 2 : 0;
				$checked_a = $a->not_checked ? 1 : 0;
				$checked_b = $b->not_checked ? 1 : 0;
				return $vuls_b + $checked_b - ( $vuls_a + $checked_a );
			}
		);
		return $new_list;
	}

	/**
	 * Check if the WordPress version that was checked matches the current installed version.
	 *
	 * @param object $core_check The object returned by Protect wpcom endpoint.
	 * @return object The object representing the current status of core checks.
	 */
	private static function normalize_core_information( $core_check ) {
		global $wp_version;

		$core = new \stdClass();
		if ( $core_check && $core_check->version === $wp_version ) {
			$core       = $core_check;
			$core->name = 'WordPress';
			$core->type = 'core';
		} else {
			$core->version         = $wp_version;
			$core->vulnerabilities = array();
			$core->not_checked     = true;
			$core->name            = 'WordPress';
			$core->type            = 'core';
		}
		return $core;
	}

}
