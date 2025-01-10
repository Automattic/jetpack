<?php
/**
 * Class to handle the Protect Status of Jetpack Protect
 *
 * @phan-suppress PhanDeprecatedProperty -- Maintaining backwards compatibility.
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
	 * @phan-suppress PhanDeprecatedProperty -- Maintaining backwards compatibility.
	 *
	 * @param object $report_data Data from the Protect Report.
	 * @return Status_Model
	 */
	protected static function normalize_protect_report_data( $report_data ) {
		$status              = new Status_Model();
		$status->data_source = 'protect_report';

		// map report data properties directly into the Status_Model
		$status->status              = isset( $report_data->status ) ? $report_data->status : null;
		$status->last_checked        = isset( $report_data->last_checked ) ? $report_data->last_checked : null;
		$status->num_threats         = isset( $report_data->num_vulnerabilities ) ? $report_data->num_vulnerabilities : null;
		$status->num_themes_threats  = isset( $report_data->num_themes_vulnerabilities ) ? $report_data->num_themes_vulnerabilities : null;
		$status->num_plugins_threats = isset( $report_data->num_plugins_vulnerabilities ) ? $report_data->num_plugins_vulnerabilities : null;
		$status->has_unchecked_items = false;

		// normalize extension information
		self::normalize_extension_data( $status, $report_data, 'themes' );
		self::normalize_extension_data( $status, $report_data, 'plugins' );
		self::normalize_core_data( $status, $report_data );

		// sort extensions by number of threats
		$status->themes  = self::sort_threats( $status->themes );
		$status->plugins = self::sort_threats( $status->plugins );

		return $status;
	}

	/**
	 * Normalize theme and plugin information from the Protect Report data source.
	 *
	 * @phan-suppress PhanDeprecatedProperty -- Maintaining backwards compatibility.
	 *
	 * @param object $status The status object to normalize.
	 * @param object $report_data Data from the Protect Report.
	 * @param string $extension_type The type of extension to normalize. Either 'themes' or 'plugins'.
	 *
	 * @return void
	 */
	protected static function normalize_extension_data( &$status, $report_data, $extension_type ) {
		if ( ! in_array( $extension_type, array( 'plugins', 'themes' ), true ) ) {
			return;
		}

		$installed_extensions = 'plugins' === $extension_type ? Plugins_Installer::get_plugins() : Sync_Functions::get_themes();
		$checked_extensions   = isset( $report_data->{ $extension_type } ) ? $report_data->{ $extension_type } : new \stdClass();

		/**
		 * Extension slug <=> threats data map.
		 *
		 * @var Extension_Model[] $extension_threats Array of Extension_Model objects indexed by slug.
		 */
		$extension_threats = array();

		// Initialize the extension threats map with all extensions currently installed on the site
		foreach ( $installed_extensions as $slug => $installed_extension ) {
			$extension_threats[ $slug ] = new Extension_Model(
				array(
					'slug'    => $slug,
					'name'    => $installed_extension['Name'],
					'version' => $installed_extension['Version'],
					'type'    => $extension_type,
					'checked' => isset( $checked_extensions->{ $slug } ),
				)
			);
		}

		foreach ( $checked_extensions as $slug => $checked_extension ) {
			$installed_extension = $installed_extensions[ $slug ] ?? null;

			// extension is no longer installed on the site
			if ( ! $installed_extension ) {
				continue;
			}

			$extension = new Extension_Model(
				array(
					'name'    => $installed_extension['Name'],
					'version' => $installed_extension['Version'],
					'slug'    => $slug,
					'checked' => false,
					'type'    => $extension_type,
				)
			);

			// extension version has changed since the report
			if ( $installed_extension['Version'] !== $checked_extension->version ) {
				// maintain $status->{ themes|plugins } for backwards compatibility.
				$extension_threats[ $slug ] = $extension;
				continue;
			}

			$extension->checked = true;

			foreach ( $checked_extension->vulnerabilities as $vulnerability ) {
				$threat         = new Threat_Model( $vulnerability );
				$threat->source = isset( $vulnerability->id ) ? Redirect::get_url( 'jetpack-protect-vul-info', array( 'path' => $vulnerability->id ) ) : null;

				$threat_extension            = clone $extension;
				$extension_threat            = clone $threat;
				$extension_threat->extension = null;

				$extension_threats[ $slug ]->threats[] = $extension_threat;

				$threat->extension = $threat_extension;
				$status->threats[] = $threat;

			}
		}

		$status->{ $extension_type } = array_values( $extension_threats );
	}

	/**
	 * Normalize the core information from the Protect Report data source.
	 *
	 * @phan-suppress PhanDeprecatedProperty -- Maintaining backwards compatibility.
	 *
	 * @param object $status The status object to normalize.
	 * @param object $report_data Data from the Protect Report.
	 *
	 * @return void
	 */
	protected static function normalize_core_data( &$status, $report_data ) {
		global $wp_version;

		// Ensure the report data has the core property.
		if ( ! $report_data->core || ! $report_data->core->version ) {
			$report_data->core = new \stdClass();
		}

		$core = new Extension_Model(
			array(
				'type'    => 'core',
				'name'    => 'WordPress',
				'slug'    => 'wordpress',
				'version' => $wp_version,
				'checked' => false,
			)
		);

		// Core version has changed since the report.
		if ( $report_data->core->version !== $wp_version ) {
			// Maintain $status->core for backwards compatibility.
			$status->core = $core;
			return;
		}

		// If we've made it this far, the core version has been checked.
		$core->checked = true;

		// Extract threat data from the report.
		if ( is_array( $report_data->core->vulnerabilities ) ) {
			foreach ( $report_data->core->vulnerabilities as $vulnerability ) {
				$threat = new Threat_Model(
					array(
						'id'          => $vulnerability->id,
						'title'       => $vulnerability->title,
						'fixed_in'    => $vulnerability->fixed_in,
						'description' => isset( $vulnerability->description ) ? $vulnerability->description : null,
						'source'      => isset( $vulnerability->id ) ? Redirect::get_url( 'jetpack-protect-vul-info', array( 'path' => $vulnerability->id ) ) : null,
					)
				);

				$threat_extension = clone $core;
				$extension_threat = clone $threat;

				$core->threats[]   = $extension_threat;
				$threat->extension = $threat_extension;

				$status->threats[] = $threat;
			}
		}

		$status->core = $core;
	}

	/**
	 * Sort By Threats
	 *
	 * @param array<Extension_Model> $threats Array of threats to sort.
	 *
	 * @return array<Extension_Model> The sorted $threats array.
	 */
	protected static function sort_threats( $threats ) {
		usort(
			$threats,
			function ( $a, $b ) {
				return count( $a->threats ) - count( $b->threats );
			}
		);

		return $threats;
	}
}
