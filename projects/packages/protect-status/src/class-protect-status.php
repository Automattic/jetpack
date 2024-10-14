<?php
/**
 * Class to handle the Protect Status of Jetpack Protect
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
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Sync\Functions as Sync_Functions;
use Jetpack_Options;
use WP_Error;

/**
 * Class that handles fetching and caching the Status of vulnerabilities check from the WPCOM servers
 */
class Protect_Status extends Status {

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
			$status = self::normalize_protect_report_data( $status );
		}

		self::$status = $status;
		return $status;
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
		self::update_status_option( $body );
		return $body;
	}

	/**
	 * Normalize data from the Protect Report data source.
	 *
	 * @param object $report_data Data from the Protect Report.
	 * @return Status_Model
	 */
	protected static function normalize_protect_report_data( $report_data ) {
		global $wp_version;

		$status              = new Status_Model();
		$status->data_source = 'protect_report';

		$status->status       = isset( $report_data->status ) ? $report_data->status : null;
		$status->last_checked = isset( $report_data->last_checked ) ? $report_data->last_checked : null;

		// Plugin Vulnerabilities
		$installed_plugins   = Plugins_Installer::get_plugins();
		$last_report_plugins = isset( $report_data->plugins ) ? $report_data->plugins : new \stdClass();
		foreach ( $installed_plugins as $installed_slug => $installed_plugin ) {
			// Skip vulnerabilities for plugins that are not installed
			if ( ! isset( $last_report_plugins->{ $installed_slug } ) ) {
				continue;
			}

			$report_plugin = $last_report_plugins->{ $installed_slug };

			// Skip vulnerabilities for plugins with a mismatched version
			if ( $report_plugin->version !== $installed_plugin['Version'] ) {
				continue;
			}

			foreach ( $report_plugin->vulnerabilities as $report_vulnerability ) {
				$status->threats[] = new Threat_Model(
					array(
						'id'          => $report_vulnerability->id,
						'title'       => $report_vulnerability->title,
						'fixed_in'    => $report_vulnerability->fixed_in,
						'description' => isset( $report_vulnerability->description ) ? $report_vulnerability->description : null,
						'source'      => isset( $report_vulnerability->id ) ? Redirect::get_url( 'jetpack-protect-vul-info', array( 'path' => $report_vulnerability->id ) ) : null,
						'extension'   => new Extension_Model(
							array(
								'slug'    => $installed_slug,
								'name'    => $installed_plugin['Name'],
								'version' => $installed_plugin['Version'],
								'type'    => 'plugin',
							)
						),
					)
				);
			}
		}

		// Theme Vulnerabilities
		$installed_themes   = Sync_Functions::get_themes();
		$last_report_themes = isset( $report_data->themes ) ? $report_data->themes : new \stdClass();
		foreach ( $installed_themes as $installed_slug => $installed_theme ) {
			// Skip vulnerabilities for themes that are not installed
			if ( ! isset( $last_report_themes->{ $installed_slug } ) ) {
				continue;
			}

			$report_theme = $last_report_themes->{ $installed_slug };

			// Skip vulnerabilities for themes with a mismatched version
			if ( $report_theme->version !== $installed_theme['Version'] ) {
				continue;
			}

			foreach ( $report_theme->vulnerabilities as $report_vulnerability ) {
				$status->threats[] = new Threat_Model(
					array(
						'id'          => $report_vulnerability->id,
						'title'       => $report_vulnerability->title,
						'fixed_in'    => $report_vulnerability->fixed_in,
						'description' => isset( $report_vulnerability->description ) ? $report_vulnerability->description : null,
						'source'      => isset( $report_vulnerability->id ) ? Redirect::get_url( 'jetpack-protect-vul-info', array( 'path' => $report_vulnerability->id ) ) : null,
						'extension'   => new Extension_Model(
							array(
								'slug'    => $installed_slug,
								'name'    => $installed_theme['Name'],
								'version' => $installed_theme['Version'],
								'type'    => 'theme',
							)
						),
					)
				);
			}
		}

		// WordPress Core Vulnerabilities
		$last_report_core = isset( $report_data->core ) ? $report_data->core : new \stdClass();
		if ( isset( $last_report_core->version ) && $last_report_core->version === $wp_version ) {
			if ( is_array( $last_report_core->vulnerabilities ) ) {
				$core_threats    =
					array_map(
						function ( $vulnerability ) use ( $last_report_core ) {
							$threat            = new Threat_Model( $vulnerability );
							$threat->source    = isset( $threat->id ) ? Redirect::get_url( 'jetpack-protect-vul-info', array( 'path' => $threat->id ) ) : null;
							$threat->extension = new Extension_Model(
								array(
									'slug'    => 'wordpress',
									'name'    => 'WordPress',
									'version' => $last_report_core->version,
									'type'    => 'core',
								)
							);
							return $threat;
						},
						$last_report_core->vulnerabilities
					);
				$status->threats = array_merge( $status->threats, $core_threats );
			}
		}

		return $status;
	}
}
