<?php
/**
 * Class to handle the Scan Status of Jetpack Protect
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
 * Class that handles fetching of threats from the Scan API
 */
class Scan_Status extends Status {

	/**
	 * Scan endpoint
	 *
	 * @var string
	 */
	const SCAN_API_BASE = '/sites/%d/scan';

	/**
	 * Name of the option where status is stored
	 *
	 * @var string
	 */
	const OPTION_NAME = 'jetpack_scan_status';

	/**
	 * Name of the option where the timestamp of the status is stored
	 *
	 * @var string
	 */
	const OPTION_TIMESTAMP_NAME = 'jetpack_scan_status_timestamp';

	/**
	 * Time in seconds that the cache should last
	 *
	 * @var int
	 */
	const OPTION_EXPIRES_AFTER = 300; // 5 minutes.

	/**
	 * Gets the current status of the Jetpack Protect checks
	 *
	 * @param bool $refresh_from_wpcom Refresh the local plan and status cache from wpcom.
	 * @return Status_Model
	 */
	public static function get_status( $refresh_from_wpcom = false ) {
		if ( self::$status !== null ) {
			return self::$status;
		}

		if ( $refresh_from_wpcom || ! self::should_use_cache() || self::is_cache_expired() ) {
			$status = self::fetch_from_api();
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
			$status = self::normalize_api_data( $status );
		}

		self::$status = $status;
		return $status;
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

		$api_url = sprintf( self::SCAN_API_BASE, $blog_id );

		return $api_url;
	}

	/**
	 * Fetches the status data from the Scan API
	 *
	 * @return WP_Error|array
	 */
	public static function fetch_from_api() {
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
			return new WP_Error( 'failed_fetching_status', 'Failed to fetch Scan data from the server', array( 'status' => $response_code ) );
		}

		$body = json_decode( wp_remote_retrieve_body( $response ) );
		self::update_status_option( $body );
		return $body;
	}

	/**
	 * Normalize API Data
	 * Formats the payload from the Scan API into an instance of Status_Model.
	 *
	 * @param object $scan_data The data returned by the scan API.
	 *
	 * @return Status_Model
	 */
	private static function normalize_api_data( $scan_data ) {
		global $wp_version;

		$status                      = new Status_Model();
		$status->data_source         = 'scan_api';
		$status->status              = isset( $scan_data->state ) ? $scan_data->state : null;
		$status->num_threats         = 0;
		$status->num_themes_threats  = 0;
		$status->num_plugins_threats = 0;
		$status->has_unchecked_items = false;
		$status->current_progress    = isset( $scan_data->current->progress ) ? $scan_data->current->progress : null;

		if ( ! empty( $scan_data->most_recent->timestamp ) ) {
			$date = new \DateTime( $scan_data->most_recent->timestamp );
			if ( $date ) {
				$status->last_checked = $date->format( 'Y-m-d H:i:s' );
			}
		}

		$status->core = new Extension_Model(
			array(
				'type'    => 'core',
				'name'    => 'WordPress',
				'version' => $wp_version,
				'checked' => true, // to do: default to false once Scan API has manifest
			)
		);

		if ( isset( $scan_data->threats ) && is_array( $scan_data->threats ) ) {
			foreach ( $scan_data->threats as $threat ) {
				if ( isset( $threat->extension->type ) ) {
					if ( 'plugin' === $threat->extension->type ) {
						// add the extension if it does not yet exist in the status
						if ( ! isset( $status->plugins[ $threat->extension->slug ] ) ) {
							$status->plugins[ $threat->extension->slug ] = new Extension_Model(
								array(
									'name'    => isset( $threat->extension->name ) ? $threat->extension->name : null,
									'slug'    => isset( $threat->extension->slug ) ? $threat->extension->slug : null,
									'version' => isset( $threat->extension->version ) ? $threat->extension->version : null,
									'type'    => 'plugin',
									'checked' => true,
									'threats' => array(),
								)
							);
						}

						$status->plugins[ $threat->extension->slug ]->threats[] = new Threat_Model(
							array(
								'id'                  => isset( $threat->id ) ? $threat->id : null,
								'signature'           => isset( $threat->signature ) ? $threat->signature : null,
								'title'               => isset( $threat->title ) ? $threat->title : null,
								'description'         => isset( $threat->description ) ? $threat->description : null,
								'vulnerability_description' => isset( $threat->vulnerability_description ) ? $threat->vulnerability_description : null,
								'fix_description'     => isset( $threat->fix_description ) ? $threat->fix_description : null,
								'payload_subtitle'    => isset( $threat->payload_subtitle ) ? $threat->payload_subtitle : null,
								'payload_description' => isset( $threat->payload_description ) ? $threat->payload_description : null,
								'first_detected'      => isset( $threat->first_detected ) ? $threat->first_detected : null,
								'fixed_in'            => isset( $threat->fixer->fixer ) && 'update' === $threat->fixer->fixer ? $threat->fixer->target : null,
								'severity'            => isset( $threat->severity ) ? $threat->severity : null,
								'fixable'             => isset( $threat->fixer ) ? $threat->fixer : null,
								'status'              => isset( $threat->status ) ? $threat->status : null,
								'filename'            => isset( $threat->filename ) ? $threat->filename : null,
								'context'             => isset( $threat->context ) ? $threat->context : null,
								'source'              => isset( $threat->source ) ? $threat->source : null,
							)
						);
						++$status->num_threats;
						++$status->num_plugins_threats;
						continue;
					}

					if ( 'theme' === $threat->extension->type ) {
						// add the extension if it does not yet exist in the status
						if ( ! isset( $status->themes[ $threat->extension->slug ] ) ) {
							$status->themes[ $threat->extension->slug ] = new Extension_Model(
								array(
									'name'    => isset( $threat->extension->name ) ? $threat->extension->name : null,
									'slug'    => isset( $threat->extension->slug ) ? $threat->extension->slug : null,
									'version' => isset( $threat->extension->version ) ? $threat->extension->version : null,
									'type'    => 'theme',
									'checked' => true,
									'threats' => array(),
								)
							);
						}

						$status->themes[ $threat->extension->slug ]->threats[] = new Threat_Model(
							array(
								'id'                  => isset( $threat->id ) ? $threat->id : null,
								'signature'           => isset( $threat->signature ) ? $threat->signature : null,
								'title'               => isset( $threat->title ) ? $threat->title : null,
								'description'         => isset( $threat->description ) ? $threat->description : null,
								'vulnerability_description' => isset( $threat->vulnerability_description ) ? $threat->vulnerability_description : null,
								'fix_description'     => isset( $threat->fix_description ) ? $threat->fix_description : null,
								'payload_subtitle'    => isset( $threat->payload_subtitle ) ? $threat->payload_subtitle : null,
								'payload_description' => isset( $threat->payload_description ) ? $threat->payload_description : null,
								'first_detected'      => isset( $threat->first_detected ) ? $threat->first_detected : null,
								'fixed_in'            => isset( $threat->fixer->fixer ) && 'update' === $threat->fixer->fixer ? $threat->fixer->target : null,
								'severity'            => isset( $threat->severity ) ? $threat->severity : null,
								'fixable'             => isset( $threat->fixer ) ? $threat->fixer : null,
								'status'              => isset( $threat->status ) ? $threat->status : null,
								'filename'            => isset( $threat->filename ) ? $threat->filename : null,
								'context'             => isset( $threat->context ) ? $threat->context : null,
								'source'              => isset( $threat->source ) ? $threat->source : null,
							)
						);
						++$status->num_threats;
						++$status->num_themes_threats;
						continue;
					}
				}

				if ( isset( $threat->signature ) && 'Vulnerable.WP.Core' === $threat->signature ) {
					if ( $threat->version !== $wp_version ) {
						continue;
					}

					$status->core->threats[] = new Threat_Model(
						array(
							'id'             => $threat->id,
							'signature'      => $threat->signature,
							'title'          => $threat->title,
							'description'    => $threat->description,
							'first_detected' => $threat->first_detected,
							'severity'       => $threat->severity,
						)
					);
					++$status->num_threats;

					continue;
				}

				if ( ! empty( $threat->filename ) ) {
					$status->files[] = new Threat_Model( $threat );
					++$status->num_threats;
					continue;
				}

				if ( ! empty( $threat->table ) ) {
					$status->database[] = new Threat_Model( $threat );
					++$status->num_threats;
					continue;
				}
			}
		}

		$installed_plugins = Plugins_Installer::get_plugins();
		$status->plugins   = self::merge_installed_and_checked_lists( $installed_plugins, $status->plugins, array( 'type' => 'plugins' ), true );

		$installed_themes = Sync_Functions::get_themes();
		$status->themes   = self::merge_installed_and_checked_lists( $installed_themes, $status->themes, array( 'type' => 'themes' ), true );

		foreach ( array_merge( $status->themes, $status->plugins ) as $extension ) {
			if ( ! $extension->checked ) {
				$status->has_unchecked_items = true;
				break;
			}
		}

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
	protected static function merge_installed_and_checked_lists( $installed, $checked, $append ) {
		$new_list = array();
		$checked  = (object) $checked;

		foreach ( array_keys( $installed ) as $slug ) {
			/**
			 * Extension Type Map
			 *
			 * @var array $extension_type_map Key value pairs of extension types and their corresponding
			 *                                 identifier used by the Scan API data source.
			 */
			$extension_type_map = array(
				'themes'  => 'r1',
				'plugins' => 'r2',
			);

			$version        = $installed[ $slug ]['Version'];
			$short_slug     = str_replace( '.php', '', explode( '/', $slug )[0] );
			$scanifest_slug = $extension_type_map[ $append['type'] ] . ":$short_slug@$version";

			$extension = new Extension_Model(
				array_merge(
					array(
						'name'    => $installed[ $slug ]['Name'],
						'version' => $version,
						'slug'    => $slug,
						'threats' => array(),
						'checked' => false,
					),
					$append
				)
			);

			if ( ! isset( $checked->extensions ) // no extension data available from Scan API
				|| is_array( $checked->extensions ) && in_array( $scanifest_slug, $checked->extensions, true ) // extension data matches Scan API
			) {
				$extension->checked = true;
				if ( isset( $checked->{ $short_slug }->threats ) ) {
					$extension->threats = $checked->{ $short_slug }->threats;
				}
			}

			$new_list[] = $extension;

		}

		$new_list = parent::sort_threats( $new_list );

		return $new_list;
	}

}
