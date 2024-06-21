<?php
/**
 * Class to handle the Scan Status of Jetpack Protect
 *
 * @package automattic/jetpack-protect-plugin
 */

namespace Automattic\Jetpack\Protect;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
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
		return defined( 'JETPACK_PROTECT_DEV__BYPASS_CACHE' ) && JETPACK_PROTECT_DEV__BYPASS_CACHE ? false : true;
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
	 * @param array $filter The filter to apply to the data.
	 * @return History_Model|bool
	 */
	public static function get_scan_history( $refresh_from_wpcom = false, $filter = null ) {
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
			$history = self::normalize_api_data( $history, $filter );
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
	 * @param array  $filter    The filter to apply to the data.
	 * @return History_Model
	 */
	private static function normalize_api_data( $scan_data, $filter ) {
		$history                      = new History_Model();
		$history->num_threats         = 0;
		$history->num_core_threats    = 0;
		$history->num_plugins_threats = 0;
		$history->num_themes_threats  = 0;

		if ( $filter ) {
			$history->filter = $filter;
		}

		$history->last_checked = $scan_data->last_checked;

		if ( isset( $scan_data->threats ) && is_array( $scan_data->threats ) ) {
			foreach ( $scan_data->threats as $threat ) {
				if ( isset( $threat->extension->type ) ) {
					if ( 'core' === $threat->extension->type && in_array( $threat->status, $history->filter, true ) ) {
						// Check if the core version does not exist in the array
						$found_index = null;
						foreach ( $history->core as $index => $core ) {
							if ( $core->version === $threat->extension->version ) {
								$found_index = $index;
								break;
							}
						}

						// Add the extension if it does not yet exist in the history
						if ( null === $found_index ) {
							$new_core        = new Extension_Model(
								array(
									'name'    => 'WordPress',
									'version' => $threat->extension->version,
									'type'    => 'core',
									'checked' => true,
									'threats' => array(),
								)
							);
							$history->core[] = $new_core;
							$found_index     = array_key_last( $history->core );
						}

						// Add the threat to the found core
						$history->core[ $found_index ]->threats[] = new Threat_Model(
							array(
								'id'             => $threat->id,
								'signature'      => $threat->signature,
								'title'          => $threat->title,
								'description'    => $threat->description,
								'first_detected' => $threat->first_detected,
								'fixed_on'       => $threat->fixed_on,
								'fixable'        => $threat->fixable,
								'severity'       => $threat->severity,
							)
						);

						++$history->num_threats;
						++$history->num_core_threats;
						continue;
					}

					if ( 'plugin' === $threat->extension->type && in_array( $threat->status, $history->filter, true ) ) {
						// Check if the plugin does not exist in the array
						$found_index = null;
						foreach ( $history->plugins as $index => $plugin ) {
							if ( $plugin->slug === $threat->extension->slug ) {
								$found_index = $index;
								break;
							}
						}

						// Add the extension if it does not yet exist in the history
						if ( null === $found_index ) {
							$new_plugin         = new Extension_Model(
								array(
									'name'    => $threat->extension->name ?? null,
									'slug'    => $threat->extension->slug ?? null,
									'version' => $threat->extension->version ?? null,
									'type'    => 'plugin',
									'checked' => true,
									'threats' => array(),
								)
							);
							$history->plugins[] = $new_plugin;
							$found_index        = array_key_last( $history->plugins );
						}

						// Add the threat to the found plugin
						$history->plugins[ $found_index ]->threats[] = new Threat_Model(
							array(
								'id'                  => $threat->id ?? null,
								'signature'           => $threat->signature ?? null,
								'title'               => $threat->title ?? null,
								'description'         => $threat->description ?? null,
								'vulnerability_description' => $threat->vulnerability_description ?? null,
								'fix_description'     => $threat->fix_description ?? null,
								'payload_subtitle'    => $threat->payload_subtitle ?? null,
								'payload_description' => $threat->payload_description ?? null,
								'first_detected'      => $threat->first_detected ?? null,
								'fixed_in'            => isset( $threat->fixer->fixer ) && 'update' === $threat->fixer->fixer ? $threat->fixer->target : null,
								'fixed_on'            => $threat->fixed_on ?? null,
								'severity'            => $threat->severity ?? null,
								'fixable'             => $threat->fixable ?? null,
								'filename'            => $threat->filename ?? null,
								'context'             => $threat->context ?? null,
								'source'              => $threat->source ?? null,
							)
						);

						++$history->num_threats;
						++$history->num_plugins_threats;
						continue;
					}

					if ( 'theme' === $threat->extension->type && in_array( $threat->status, $history->filter, true ) ) {
						// Check if the theme does not exist in the array
						$found_index = null;
						foreach ( $history->themes as $index => $theme ) {
							if ( $theme->slug === $threat->extension->slug ) {
								$found_index = $index;
								break;
							}
						}

						// Add the extension if it does not yet exist in the history
						if ( null === $found_index ) {
							$new_theme         = new Extension_Model(
								array(
									'name'    => $threat->extension->name ?? null,
									'slug'    => $threat->extension->slug ?? null,
									'version' => $threat->extension->version ?? null,
									'type'    => 'theme',
									'checked' => true,
									'threats' => array(),
								)
							);
							$history->themes[] = $new_theme;
							$found_index       = array_key_last( $history->themes );
						}

						// Add the threat to the found theme
						$history->themes[ $found_index ]->threats[] = new Threat_Model(
							array(
								'id'                  => $threat->id ?? null,
								'signature'           => $threat->signature ?? null,
								'title'               => $threat->title ?? null,
								'description'         => $threat->description ?? null,
								'vulnerability_description' => $threat->vulnerability_description ?? null,
								'fix_description'     => $threat->fix_description ?? null,
								'payload_subtitle'    => $threat->payload_subtitle ?? null,
								'payload_description' => $threat->payload_description ?? null,
								'first_detected'      => $threat->first_detected ?? null,
								'fixed_in'            => isset( $threat->fixer->fixer ) && 'update' === $threat->fixer->fixer ? $threat->fixer->target : null,
								'fixed_on'            => $threat->fixed_on ?? null,
								'severity'            => $threat->severity ?? null,
								'fixable'             => $threat->fixable ?? null,
								'filename'            => $threat->filename ?? null,
								'context'             => $threat->context ?? null,
								'source'              => $threat->source ?? null,
							)
						);

						++$history->num_threats;
						++$history->num_themes_threats;
						continue;
					}
				}

				if ( ! empty( $threat->filename ) ) {
					if ( in_array( $threat->status, $history->filter, true ) ) {
						$history->files[] = new Threat_Model( $threat );
						++$history->num_threats;
						continue;
					}
				}

				if ( ! empty( $threat->table ) ) {
					if ( in_array( $threat->status, $history->filter, true ) ) {
						$history->database[] = new Threat_Model( $threat );
						++$history->num_threats;
						continue;
					}
				}
			}
		}

		return $history;
	}
}
