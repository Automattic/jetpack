<?php
/**
 * Scheduled Updates
 *
 * @package automattic/jetpack-scheduled-updates
 */

namespace Automattic\Jetpack;

/**
 * Scheduled Updates class.
 */
class Scheduled_Updates {

	/**
	 * The version of the package.
	 *
	 * @var string
	 */
	const PACKAGE_VERSION = '0.1.0-alpha';

	/**
	 * Initialize the class.
	 */
	public static function init() {
		if ( ! ( method_exists( 'Automattic\Jetpack\Current_Plan', 'supports' ) && Current_Plan::supports( 'scheduled-updates' ) ) ) {
			return;
		}

		static::load_rest_api_endpoints();

		add_action( 'jetpack_scheduled_update', array( __CLASS__, 'jetpack_run_scheduled_update' ) );
		add_filter( 'auto_update_plugin', array( __CLASS__, 'jetpack_allowlist_scheduled_plugins' ), 10, 2 );
	}

	/**
	 * Load the REST API endpoints.
	 */
	public static function load_rest_api_endpoints() {
		if ( ! function_exists( 'wpcom_rest_api_v2_load_plugin' ) ) {
			return;
		}

		require_once __DIR__ . '/wpcom-endpoints/class-wpcom-rest-api-v2-endpoint-update-schedules.php';
	}

	/**
	 * Run the scheduled update.
	 *
	 * @param array $plugins List of plugins to update.
	 */
	public static function jetpack_run_scheduled_update( $plugins = array() ) {
		$available_updates = get_site_transient( 'update_plugins' );
		$plugins_to_update = array();

		foreach ( $plugins as $plugin ) {
			if ( isset( $available_updates->response[ $plugin ] ) ) {
				$plugins_to_update[ $plugin ]              = $available_updates->response[ $plugin ];
				$plugins_to_update[ $plugin ]->old_version = $available_updates->checked[ $plugin ];
			}
		}

		if ( ! empty( $plugins_to_update ) ) {
			$endpoint_url = sprintf(
				'https://public-api.wordpress.com/wpcom/v2/sites/%d/hosting/scheduled-update',
				\Jetpack_Options::get_option( 'id' )
			);

			wp_remote_post(
				$endpoint_url,
				array(
					'body' => array(
						'plugins' => $plugins_to_update,
					),
				)
			);
		}
	}

	/**
	 * Allow plugins that are part of scheduled updates to be updated automatically.
	 *
	 * @param bool|null $update Whether to update. The value of null is internally used
	 *                          to detect whether nothing has hooked into this filter.
	 * @param object    $item   The update offer.
	 * @return bool
	 */
	public static function jetpack_allowlist_scheduled_plugins( $update, $item ) {
		// TODO: Check if we're in a scheduled update request from Jetpack_Autoupdates.
		$schedules = get_option( 'jetpack_update_schedules', array() );

		foreach ( $schedules as $plugins ) {
			if ( in_array( $item->slug, $plugins, true ) ) {
				return true;
			}
		}

		return $update;
	}
}
