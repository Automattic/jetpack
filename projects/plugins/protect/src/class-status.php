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
	 * @var null|Status_Model
	 */
	public static $status = null;

	/**
	 * Gets the current status of the Jetpack Protect checks
	 *
	 * @return Status_Model
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
			$status = new Status_Model(
				array(
					'error'         => true,
					'error_code'    => $status->get_error_code(),
					'error_message' => $status->get_error_message(),
				)
			);
		} else {
			$status = self::load_data_from_protect_report( $status );
		}

		self::$status = $status;
		return $status;
	}

	/**
	 * Checks the current status to see if there are any threats found
	 *
	 * @return boolean
	 */
	public static function has_threats() {
		return 0 < self::get_total_threats();
	}

	/**
	 * Gets the total number of threats found
	 *
	 * @return integer
	 */
	public static function get_total_threats() {
		$status = self::get_status();
		return isset( $status->num_threats ) && is_int( $status->num_threats ) ? $status->num_threats : 0;
	}

	/**
	 * Get all threats combined
	 *
	 * @return array
	 */
	public static function get_all_threats() {
		return array_merge(
			self::get_wordpress_threats(),
			self::get_themes_threats(),
			self::get_plugins_threats()
		);
	}

	/**
	 * Get threats found for WordPress core
	 *
	 * @return array
	 */
	public static function get_wordpress_threats() {
		return self::get_threats( 'core' );
	}

	/**
	 * Get threats found for themes
	 *
	 * @return array
	 */
	public static function get_themes_threats() {
		return self::get_threats( 'themes' );
	}

	/**
	 * Get threats found for plugins
	 *
	 * @return array
	 */
	public static function get_plugins_threats() {
		return self::get_threats( 'plugins' );
	}

	/**
	 * Get the threats for one type of extension or core
	 *
	 * @param string $type What threats you want to get. Possible values are 'core', 'themes' and 'plugins'.
	 *
	 * @return array
	 */
	public static function get_threats( $type ) {
		$status = self::get_status();
		if ( 'core' === $type ) {
			return isset( $status->$type ) && ! empty( $status->$type->threats ) ? $status->$type->threats : array();
		}

		$threats = array();
		if ( isset( $status->$type ) ) {
			foreach ( (array) $status->$type as $item ) {
				if ( ! empty( $item->threats ) ) {
					$threats = array_merge( $threats, $item->threats );
				}
			}
		}
		return $threats;
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

		$body = json_decode( wp_remote_retrieve_body( $response ) );
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
	 * Normalize data from the Protect Report data source.
	 *
	 * @param object $report_data Data from the Protect Report.
	 * @return Status_Model
	 */
	private static function load_data_from_protect_report( $report_data ) {
		$status = new Status_Model();

		// map report data properties directly into the Status_Model
		$status->status              = isset( $report_data->status ) ? $report_data->status : null;
		$status->last_checked        = isset( $report_data->last_checked ) ? $report_data->last_checked : null;
		$status->num_threats         = isset( $report_data->num_vulnerabilities ) ? $report_data->num_vulnerabilities : null;
		$status->num_themes_threats  = isset( $report_data->num_themes_vulnerabilities ) ? $report_data->num_themes_vulnerabilities : null;
		$status->num_plugins_threats = isset( $report_data->num_plugins_vulnerabilities ) ? $report_data->num_plugins_vulnerabilities : null;

		// merge plugins from report with all installed plugins before mapping into the Status_Model
		$installed_plugins   = Plugins_Installer::get_plugins();
		$last_report_plugins = isset( $report_data->plugins ) ? $report_data->plugins : new \stdClass();
		$status->plugins     = self::merge_installed_and_checked_lists( $installed_plugins, $last_report_plugins, array( 'type' => 'plugins' ) );

		// merge themes from report with all installed plugins before mapping into the Status_Model
		$installed_themes   = Sync_Functions::get_themes();
		$last_report_themes = isset( $report_data->themes ) ? $report_data->themes : new \stdClass();
		$status->themes     = self::merge_installed_and_checked_lists( $installed_themes, $last_report_themes, array( 'type' => 'themes' ) );

		// normalize WordPress core report data and map into Status_Model
		$status->core = self::normalize_core_information( isset( $report_data->core ) ? $report_data->core : new \stdClass() );

		// check if any installed items (themes, plugins, or core) have not been checked in the report
		$all_items                   = array_merge( $status->plugins, $status->themes, array( $status->core ) );
		$unchecked_items             = array_filter(
			$all_items,
			function ( $item ) {
				return ! isset( $item->checked ) || ! $item->checked;
			}
		);
		$status->has_unchecked_items = ! empty( $unchecked_items );

		return $status;
	}

	/**
	 * Merges the list of installed extensions with the list of extensions that were checked for known vulnerabilities and return a normalized list to be used in the UI
	 *
	 * @param array  $installed The list of installed extensions, where each attribute key is the extension slug.
	 * @param object $checked   The list of checked extensions.
	 * @param array  $append    Additional data to append to each result in the list.
	 * @return array Normalized list of extensions.
	 */
	private static function merge_installed_and_checked_lists( $installed, $checked, $append ) {
		$new_list = array();
		foreach ( array_keys( $installed ) as $slug ) {

			$extension = new Extension_Model(
				array_merge(
					array(
						'name'    => $installed[ $slug ]['Name'],
						'version' => $installed[ $slug ]['Version'],
						'slug'    => $slug,
						'threats' => array(),
						'checked' => false,
					),
					$append
				)
			);

			if ( isset( $checked->{ $slug } ) && $checked->{ $slug }->version === $installed[ $slug ]['Version'] ) {
				$extension->version = $checked->{ $slug }->version;
				$extension->checked = true;
				if ( is_array( $checked->{ $slug }->vulnerabilities ) ) {
					foreach ( $checked->{ $slug }->vulnerabilities as $vulnerability ) {
						$extension->threats[] = new Threat_Model(
							array(
								'id'          => $vulnerability->id,
								'title'       => $vulnerability->title,
								'fixed_in'    => $vulnerability->fixed_in,
								'description' => isset( $vulnerability->description ) ? $vulnerability->description : null,
							)
						);
					}
				}
			}

			$new_list[] = $extension;

		}
		usort(
			$new_list,
			function ( $a, $b ) {
				// sort primarily based on the presence of threats
				if ( ! empty( $a->threats ) && empty( $b->threats ) ) {
					return -1;
				}
				if ( empty( $a->threats ) && ! empty( $b->threats ) ) {
					return 1;
				}
				// sort secondarily on whether the item has been checked
				if ( $a->checked && ! $b->checked ) {
					return 1;
				}
				if ( ! $a->checked && $b->checked ) {
					return -1;
				}

				return 0;
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

		$core = new Extension_Model(
			array(
				'type'    => 'core',
				'name'    => 'WordPress',
				'version' => $wp_version,
				'checked' => false,
			)
		);

		if ( isset( $core_check->version ) && $core_check->version === $wp_version ) {
			if ( is_array( $core_check->vulnerabilities ) ) {
				$core->checked = true;
				$core->set_threats( $core_check->vulnerabilities );
			}
		}

		return $core;
	}

}
