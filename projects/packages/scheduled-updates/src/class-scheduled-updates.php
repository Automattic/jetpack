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
	const PACKAGE_VERSION = '0.2.2-alpha';

	/**
	 * Initialize the class.
	 */
	public static function init() {
		/*
		 * We want to load the REST API endpoints in all environments.
		 * On WP.com they're needed for registering the routes with public-api and pass-through to self-hosted sites.
		 */
		add_action( 'plugins_loaded', array( __CLASS__, 'load_rest_api_endpoints' ), 20 );

		// Never load on Simple sites.
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return;
		}

		if ( ! ( method_exists( 'Automattic\Jetpack\Current_Plan', 'supports' ) && Current_Plan::supports( 'scheduled-updates' ) ) ) {
			return;
		}

		add_action( 'jetpack_scheduled_update', array( __CLASS__, 'run_scheduled_update' ) );
		add_filter( 'auto_update_plugin', array( __CLASS__, 'allowlist_scheduled_plugins' ), 10, 2 );
		add_filter( 'plugin_auto_update_setting_html', array( __CLASS__, 'show_scheduled_updates' ), 10, 2 );
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
	 * @param string ...$plugins List of plugins to update.
	 */
	public static function run_scheduled_update( ...$plugins ) {
		$available_updates = get_site_transient( 'update_plugins' );
		$plugins_to_update = array();

		foreach ( $plugins as $plugin ) {
			if ( isset( $available_updates->response[ $plugin ] ) ) {
				$plugins_to_update[ $plugin ]              = $available_updates->response[ $plugin ];
				$plugins_to_update[ $plugin ]->old_version = $available_updates->checked[ $plugin ];
			}
		}

		if ( ! empty( $plugins_to_update ) ) {
			( new Connection\Client() )->wpcom_json_api_request_as_user(
				sprintf( '/sites/%d/hosting/scheduled-update', \Jetpack_Options::get_option( 'id' ) ),
				'2',
				array( 'method' => 'POST' ),
				array( 'plugins' => $plugins_to_update )
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
	public static function allowlist_scheduled_plugins( $update, $item ) {
		// TODO: Check if we're in a scheduled update request from Jetpack_Autoupdates.
		$schedules = get_option( 'jetpack_update_schedules', array() );

		foreach ( $schedules as $plugins ) {
			if ( in_array( $item->slug, $plugins, true ) ) {
				return true;
			}
		}

		return $update;
	}

	/**
	 * Filters the HTML of the auto-updates setting for each plugin in the Plugins list table.
	 *
	 * @param string $html        The HTML of the plugin's auto-update column content,
	 *                            including toggle auto-update action links and
	 *                            time to next update.
	 * @param string $plugin_file Path to the plugin file relative to the plugin directory.
	 */
	public static function show_scheduled_updates( $html, $plugin_file ) {
		$schedules = get_option( 'jetpack_update_schedules', array() );

		$schedule = false;
		foreach ( $schedules as $plugins ) {
			if ( in_array( $plugin_file, $plugins, true ) ) {
				$schedule = wp_get_scheduled_event( 'jetpack_scheduled_update', $plugins );
				break;
			}
		}

		// Plugin is not part of an update schedule.
		if ( ! $schedule ) {
			return $html;
		}

		if ( DAY_IN_SECONDS === $schedule->interval ) {
			$html = sprintf(
				/* translators: %s is the time of day. Daily at 10 am. */
				esc_html__( 'Daily at %s.', 'jetpack-scheduled-updates' ),
				date_i18n( get_option( 'time_format' ), $schedule->timestamp )
			);
		} else {
			// Not getting smart about passing in weekdays makes it easier to translate.
			$weekdays = array(
				/* translators: %s is the time of day. Sundays at 10 am. */
				__( 'Sundays at %s.', 'jetpack-scheduled-updates' ),
				/* translators: %s is the time of day. Mondays at 10 am. */
				__( 'Mondays at %s.', 'jetpack-scheduled-updates' ),
				/* translators: %s is the time of day. Tuesdays at 10 am. */
				__( 'Tuesdays at %s.', 'jetpack-scheduled-updates' ),
				/* translators: %s is the time of day. Wednesdays at 10 am. */
				__( 'Wednesdays at %s.', 'jetpack-scheduled-updates' ),
				/* translators: %s is the time of day. Thursdays at 10 am. */
				__( 'Thursdays at %s.', 'jetpack-scheduled-updates' ),
				/* translators: %s is the time of day. Fridays at 10 am. */
				__( 'Fridays at %s.', 'jetpack-scheduled-updates' ),
				/* translators: %s is the time of day. Saturdays at 10 am. */
				__( 'Saturdays at %s.', 'jetpack-scheduled-updates' ),
			);

			$html = sprintf(
				$weekdays[ date_i18n( 'N', $schedule->timestamp ) ],
				date_i18n( get_option( 'time_format' ), $schedule->timestamp )
			);
		}

		$html  = '<p style="margin: 0 0 8px">' . $html . '</p>';
		$html .= '<a href="' . esc_url( admin_url( 'admin.php?page=jetpack#jetpack-autoupdates' ) ) . '">' . esc_html__( 'Edit', 'jetpack-scheduled-updates' ) . '</a>';

		return $html;
	}
}
