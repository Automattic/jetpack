<?php
/**
 * Class to handle the Scan Status of Jetpack Protect
 *
 * @package automattic/jetpack-protect-status
 */

namespace Automattic\Jetpack\Protect_Status;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Protect_Models\Extension_Model;
use Automattic\Jetpack\Protect_Models\Status_Model;
use Automattic\Jetpack\Protect_Models\Threat_Model;
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
		$status->has_unchecked_items = false;
		$status->current_progress    = isset( $scan_data->current->progress ) ? $scan_data->current->progress : null;

		if ( ! empty( $scan_data->most_recent->timestamp ) ) {
			$date = new \DateTime( $scan_data->most_recent->timestamp );
			if ( $date ) {
				$status->last_checked = $date->format( 'Y-m-d H:i:s' );
			}
		}

		if ( isset( $scan_data->threats ) && is_array( $scan_data->threats ) ) {
			foreach ( $scan_data->threats as $threat ) {
				if ( isset( $threat->fixable ) && $threat->fixable ) {
					$status->fixable_threat_ids[] = $threat->id;
				}

				// Plugin and Theme Threats
				if ( isset( $threat->extension->type ) ) {
					$status->threats[] = new Threat_Model(
						array(
							'id'                        => isset( $threat->id ) ? $threat->id : null,
							'signature'                 => isset( $threat->signature ) ? $threat->signature : null,
							'title'                     => isset( $threat->title ) ? $threat->title : null,
							'description'               => isset( $threat->description ) ? $threat->description : null,
							'vulnerability_description' => isset( $threat->vulnerability_description ) ? $threat->vulnerability_description : null,
							'fix_description'           => isset( $threat->fix_description ) ? $threat->fix_description : null,
							'payload_subtitle'          => isset( $threat->payload_subtitle ) ? $threat->payload_subtitle : null,
							'payload_description'       => isset( $threat->payload_description ) ? $threat->payload_description : null,
							'first_detected'            => isset( $threat->first_detected ) ? $threat->first_detected : null,
							'fixed_in'                  => isset( $threat->fixer->fixer ) && 'update' === $threat->fixer->fixer ? $threat->fixer->target : null,
							'severity'                  => isset( $threat->severity ) ? $threat->severity : null,
							'fixable'                   => isset( $threat->fixer ) ? $threat->fixer : null,
							'status'                    => isset( $threat->status ) ? $threat->status : null,
							'filename'                  => isset( $threat->filename ) ? $threat->filename : null,
							'context'                   => isset( $threat->context ) ? $threat->context : null,
							'source'                    => isset( $threat->source ) ? $threat->source : null,
							'extension'                 => new Extension_Model(
								array(
									'name'    => isset( $threat->extension->name ) ? $threat->extension->name : null,
									'slug'    => isset( $threat->extension->slug ) ? $threat->extension->slug : null,
									'version' => isset( $threat->extension->version ) ? $threat->extension->version : null,
									'type'    => $threat->extension->type,
								)
							),
						)
					);
					continue;
				}

				// WordPress Core Threats
				if ( isset( $threat->signature ) && 'Vulnerable.WP.Core' === $threat->signature ) {
					if ( $threat->version !== $wp_version ) {
						continue;
					}

					$status->threats[] = new Threat_Model(
						array(
							'id'             => $threat->id,
							'signature'      => $threat->signature,
							'title'          => $threat->title,
							'description'    => $threat->description,
							'first_detected' => $threat->first_detected,
							'severity'       => $threat->severity,
							'extension'      => new Extension_Model(
								array(
									'name'    => 'WordPress',
									'slug'    => 'wordpress',
									'version' => $wp_version,
									'type'    => 'core',
								)
							),
						)
					);

					continue;
				}

				// File Threats
				if ( ! empty( $threat->filename ) ) {
					$status->threats[] = new Threat_Model( $threat );
					continue;
				}

				// Database Threats
				if ( ! empty( $threat->table ) ) {
					$status->threats[] = new Threat_Model( $threat );
					continue;
				}
			}
		}

		return $status;
	}
}
