<?php
/**
 * Class to handle the Scan Status of Jetpack Protect
 *
 * @phan-suppress PhanDeprecatedFunction -- Maintaining backwards compatibility.
 *
 * @package automattic/jetpack-protect-status
 */

namespace Automattic\Jetpack\Protect_Status;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Plugins_Installer;
use Automattic\Jetpack\Protect_Models\Extension_Model;
use Automattic\Jetpack\Protect_Models\Status_Model;
use Automattic\Jetpack\Protect_Models\Threat_Model;
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
			array(
				'method'  => 'GET',
				'timeout' => 30,
			),
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
	 *
	 * Formats the payload from the Scan API into an instance of Status_Model.
	 *
	 * @phan-suppress PhanDeprecatedProperty -- Maintaining backwards compatibility.
	 *
	 * @param object $scan_data The data returned by the scan API.
	 *
	 * @return Status_Model
	 */
	private static function normalize_api_data( $scan_data ) {
		global $wp_version;

		$installed_plugins = Plugins_Installer::get_plugins();
		$installed_themes  = Sync_Functions::get_themes();

		$plugins  = array();
		$themes   = array();
		$core     = new Extension_Model(
			array(
				'name'    => 'WordPress',
				'slug'    => 'wordpress',
				'version' => $wp_version,
				'type'    => 'core',
				'checked' => true, // to do: default to false once Scan API has manifest
			)
		);
		$files    = array();
		$database = array();

		$status = new Status_Model(
			array(
				'data_source'         => 'scan_api',
				'status'              => isset( $scan_data->state ) ? $scan_data->state : null,
				'num_threats'         => 0,
				'num_themes_threats'  => 0,
				'num_plugins_threats' => 0,
				'has_unchecked_items' => false,
				'current_progress'    => isset( $scan_data->current->progress ) ? $scan_data->current->progress : null,
			)
		);

		// Format the "last checked" timestamp.
		if ( ! empty( $scan_data->most_recent->timestamp ) ) {
			$date                 = new \DateTime( $scan_data->most_recent->timestamp );
			$status->last_checked = $date->format( 'Y-m-d H:i:s' );
		}

		// Ensure all installed plugins and themes are represented in the status.
		foreach ( $installed_plugins as $path => $installed_plugin ) {
			$slug   = str_replace( '.php', '', explode( '/', $path )[0] );
			$plugin = new Extension_Model(
				array(
					'name'    => $installed_plugin['Name'],
					'version' => $installed_plugin['Version'],
					'slug'    => $slug,
					'type'    => 'plugins',
					'checked' => true, // to do: default to false once Scan API has manifest
				)
			);

			$plugins[ $slug ] = $plugin;
		}
		foreach ( $installed_themes as $path => $installed_theme ) {
			$slug  = str_replace( '.php', '', explode( '/', $path )[0] );
			$theme = new Extension_Model(
				array(
					'name'    => $installed_theme['Name'],
					'version' => $installed_theme['Version'],
					'slug'    => $slug,
					'type'    => 'themes',
					'checked' => true, // to do: default to false once Scan API has manifest
				)
			);

			$themes[ $slug ] = $theme;
		}

		// Merge the threats into the status model.
		if ( isset( $scan_data->threats ) && is_array( $scan_data->threats ) ) {
			foreach ( $scan_data->threats as $scan_threat ) {
				if ( isset( $scan_threat->fixable ) && $scan_threat->fixable ) {
					$status->fixable_threat_ids[] = $scan_threat->id;
				}

				$db_details = null;
				if ( ! empty( $scan_threat->table ) ) {
					$db_details = (object) array_merge(
						array(
							'table'     => $scan_threat->table,
							'pk_column' => $scan_threat->pk_column ?? null,
							'pk_value'  => $scan_threat->value ?? null,
						),
						! empty( $scan_threat->details ) ? array( 'details' => $scan_threat->details ) : array()
					);
				}

				$threat = new Threat_Model(
					array(
						'id'                        => $scan_threat->id ?? null,
						'signature'                 => $scan_threat->signature ?? null,
						'title'                     => $scan_threat->title ?? null,
						'description'               => $scan_threat->description ?? null,
						'vulnerability_description' => $scan_threat->vulnerability_description ?? null,
						'extension'                 => $scan_threat->extension ?? null,
						'fix_description'           => $scan_threat->fix_description ?? null,
						'payload_subtitle'          => $scan_threat->payload_subtitle ?? null,
						'payload_description'       => $scan_threat->payload_description ?? null,
						'first_detected'            => $scan_threat->first_detected ?? null,
						'fixed_in'                  => isset( $scan_threat->fixer->fixer ) && 'update' === $scan_threat->fixer->fixer ? $scan_threat->fixer->target : null,
						'severity'                  => $scan_threat->severity ?? null,
						'fixable'                   => $scan_threat->fixer ?? null,
						'status'                    => $scan_threat->status ?? null,
						'filename'                  => $scan_threat->filename ?? null,
						'context'                   => $scan_threat->context ?? null,
						'source'                    => $scan_threat->source ?? null,
						'table'                     => $scan_threat->table ?? null,
						'details'                   => $db_details,
					)
				);

				// Theme and Plugin Threats
				if ( ! empty( $scan_threat->extension ) && in_array( $scan_threat->extension->type, array( 'plugin', 'theme' ), true ) ) {
					$installed_extension = 'plugin' === $scan_threat->extension->type ? ( $plugins[ $scan_threat->extension->slug ] ?? null ) : ( $themes[ $scan_threat->extension->slug ] ?? null );

					// If the extension is no longer installed, skip this threat.
					// todo: use version_compare()
					if ( ! $installed_extension ) {
						continue;
					}

					// Push the threat to the appropriate extension.
					switch ( $scan_threat->extension->type ) {
						case 'plugin':
							$plugins[ $scan_threat->extension->slug ]->threats[] = clone $threat;
							++$status->num_plugins_threats;
							break;
						case 'theme':
							$themes[ $scan_threat->extension->slug ]->threats[] = clone $threat;
							++$status->num_themes_threats;
							break;
						default:
							break;
					}

					$threat->extension = new Extension_Model(
						array(
							'name'    => isset( $scan_threat->extension->name ) ? $scan_threat->extension->name : null,
							'slug'    => isset( $scan_threat->extension->slug ) ? $scan_threat->extension->slug : null,
							'version' => isset( $scan_threat->extension->version ) ? $scan_threat->extension->version : null,
							'type'    => $scan_threat->extension->type . 's',
							'checked' => $installed_extension->version === $scan_threat->extension->version,
						)
					);
				} elseif ( isset( $threat->signature ) && 'Vulnerable.WP.Core' === $threat->signature ) {
					// Vulnerable WordPress Core Version Threats

					// If the core version has changed, skip this threat.
					// todo: use version_compare()
					if ( $scan_threat->version !== $wp_version ) {
						continue;
					}

					$core->threats[] = $threat;
				} elseif ( ! empty( $threat->filename ) ) {
					// File Threats
					$files[] = $threat;
				} elseif ( ! empty( $scan_threat->table ) ) {
					// Database Threats
					$database[] = $threat;
				}

				$status->threats[] = $threat;
				++$status->num_threats;
			}
		}

		$status->threats = static::sort_threats( $status->threats );

		// maintain deprecated properties for backwards compatibility
		$status->plugins  = array_values( $plugins );
		$status->themes   = array_values( $themes );
		$status->core     = $core;
		$status->files    = $files;
		$status->database = $database;

		return $status;
	}

	/**
	 * Sort By Threats
	 *
	 * @param array<Threat_Model> $threats Array of threats to sort.
	 *
	 * @return array<Threat_Model> The sorted $threats array.
	 */
	protected static function sort_threats( $threats ) {
		usort(
			$threats,
			function ( $a, $b ) {
				// Order by active status first...
				if ( $a->status !== $b->status ) {
					return 'active' === $a->status ? -1 : 1;
				}

				// ...then by severity...
				if ( $a->severity !== $b->severity ) {
					return $a->severity > $b->severity ? -1 : 1;
				}

				// ...then date added.
				if ( $a->first_detected !== $b->first_detected ) {
					return strtotime( $a->first_detected ) < strtotime( $b->first_detected ) ? -1 : 1;
				}

				return 0;
			}
		);

		return $threats;
	}
}
