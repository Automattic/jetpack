<?php
/**
 * Scheduled Updates
 *
 * @package automattic/scheduled-updates
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
	const PACKAGE_VERSION = '0.3.4';

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

		add_action( 'jetpack_scheduled_update', array( __CLASS__, 'run_scheduled_update' ), 10, 10 );
		add_action( 'rest_api_init', array( __CLASS__, 'add_is_managed_extension_field' ) );
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
		$plugins_to_update = $available_updates->response ?? array();
		$plugins_to_update = array_intersect_key( $plugins_to_update, array_flip( $plugins ) );

		if ( empty( $plugins_to_update ) ) {
			return;
		}

		( new Connection\Client() )->wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/hosting/scheduled-update', \Jetpack_Options::get_option( 'id' ) ),
			'2',
			array( 'method' => 'POST' ),
			array( 'plugins' => $plugins_to_update ),
			'wpcom'
		);
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
		if ( Constants::get_constant( 'SCHEDULED_AUTOUPDATE' ) ) {
			if ( ! function_exists( 'wp_get_scheduled_events' ) ) {
				require_once __DIR__ . '/pluggable.php';
			}

			$events = wp_get_scheduled_events( 'jetpack_scheduled_update' );
			foreach ( $events as $event ) {
				if ( isset( $item->plugin ) && in_array( $item->plugin, $event->args, true ) ) {
					return true;
				}
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
		if ( ! function_exists( 'wp_get_scheduled_events' ) ) {
			require_once __DIR__ . '/pluggable.php';
		}

		$events = wp_get_scheduled_events( 'jetpack_scheduled_update' );

		$schedules = array();
		foreach ( $events as $event ) {
			if ( in_array( $plugin_file, $event->args, true ) ) {
				$schedules[] = $event;
			}
		}

		// Plugin is not part of an update schedule.
		if ( empty( $schedules ) ) {
			return $html;
		}

		$text = array_map( array( __CLASS__, 'get_scheduled_update_text' ), $schedules );

		$html  = '<p style="margin: 0 0 8px">' . implode( '<br>', $text ) . '</p>';
		$html .= sprintf(
			'<a href="%1$s">%2$s</a>',
			esc_url( 'https://wordpress.com/plugins/scheduled-updates/' . ( new Status() )->get_site_suffix() ),
			esc_html__( 'Edit', 'jetpack-scheduled-updates' )
		);

		return $html;
	}

	/**
	 * Get the text for a scheduled update.
	 *
	 * @param object $schedule The scheduled update.
	 * @return string
	 */
	public static function get_scheduled_update_text( $schedule ) {
		if ( DAY_IN_SECONDS === $schedule->interval ) {
			$html = sprintf(
				/* translators: %s is the time of day. Daily at 10 am. */
				esc_html__( 'Daily at %s.', 'jetpack-scheduled-updates' ),
				get_date_from_gmt( gmdate( 'Y-m-d H:i:s', $schedule->timestamp ), get_option( 'time_format' ) )
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
				get_date_from_gmt( gmdate( 'Y-m-d H:i:s', $schedule->timestamp ), get_option( 'time_format' ) )
			);
		}

		return $html;
	}

	/**
	 * Registers the is_managed field for the plugin REST API.
	 */
	public static function add_is_managed_extension_field() {
		register_rest_field(
			'plugin',
			'is_managed',
			array(
				/**
				* Populates the is_managed field.
				*
				* Users could have their own plugins folder with symlinks pointing to it, so we need to check if the
				* link target is within the `/wordpress` directory to determine if the plugin is managed.
				*
				* @see p9o2xV-3Nx-p2#comment-8728
				*
				* @param array $data Prepared response array.
				* @return bool
				*/
				'get_callback' => function ( $data ) {
					$folder = WP_PLUGIN_DIR . '/' . strtok( $data['plugin'], '/' );
					$target = is_link( $folder ) ? realpath( $folder ) : false;

					return $target && 0 === strpos( $target, '/wordpress/' );
				},
				'schema'       => array(
					'description' => 'Whether the plugin is managed by the host.',
					'type'        => 'boolean',
				),
			)
		);
	}

	/**
	 * Return file and update modification capabilities for the site.
	 *
	 * @see Jetpack_JSON_API_Plugins_Endpoint::file_mod_capabilities
	 */
	public static function get_file_mod_capabilities() {
		$reasons_can_not_autoupdate   = array();
		$reasons_can_not_modify_files = array();

		$has_file_system_write_access = self::file_system_write_access();
		if ( ! $has_file_system_write_access ) {
			$reasons_can_not_modify_files['has_no_file_system_write_access'] = __( 'The file permissions on this host prevent editing files.', 'jetpack-scheduled-updates' );
		}

		$disallow_file_mods = \Automattic\Jetpack\Constants::get_constant( 'DISALLOW_FILE_MODS' );
		if ( $disallow_file_mods ) {
			$reasons_can_not_modify_files['disallow_file_mods'] = __( 'File modifications are explicitly disabled by a site administrator.', 'jetpack-scheduled-updates' );
		}

		$automatic_updater_disabled = \Automattic\Jetpack\Constants::get_constant( 'AUTOMATIC_UPDATER_DISABLED' );
		if ( $automatic_updater_disabled ) {
			$reasons_can_not_autoupdate['automatic_updater_disabled'] = __( 'Any autoupdates are explicitly disabled by a site administrator.', 'jetpack-scheduled-updates' );
		}

		if ( is_multisite() ) {
			// is it the main network ? is really is multi network
			if ( Jetpack::is_multi_network() ) {
				$reasons_can_not_modify_files['is_multi_network'] = __( 'Multi network install are not supported.', 'jetpack-scheduled-updates' );
			}
			// Is the site the main site here.
			if ( ! is_main_site() ) {
				$reasons_can_not_modify_files['is_sub_site'] = __( 'The site is not the main network site', 'jetpack-scheduled-updates' );
			}
		}

		$file_mod_capabilities = array(
			'modify_files'     => (bool) empty( $reasons_can_not_modify_files ), // install, remove, update
			'autoupdate_files' => (bool) empty( $reasons_can_not_modify_files ) && empty( $reasons_can_not_autoupdate ), // enable autoupdates
		);

		$errors = array();

		if ( ! empty( $reasons_can_not_modify_files ) ) {
			foreach ( $reasons_can_not_modify_files as $error_code => $error_message ) {
					$errors[] = array(
						'code'    => $error_code,
						'message' => $error_message,
					);
			}
		}

		if ( ! $file_mod_capabilities['autoupdate_files'] ) {
			foreach ( $reasons_can_not_autoupdate as $error_code => $error_message ) {
				$errors[] = array(
					'code'    => $error_code,
					'message' => $error_message,
				);
			}
		}

		$errors = array_unique( $errors );
		if ( ! empty( $errors ) ) {
			$file_mod_capabilities['errors'] = $errors;
		}

		return $file_mod_capabilities;
	}

	/**
	 * Returns if the file system is writeable.
	 * Used mostly for mocking during tests.
	 *
	 * @see Automattic\Jetpack\Sync\Functions::file_system_write_access
	 */
	private static function file_system_write_access() {
		if ( ! class_exists( 'Automattic\Jetpack\Sync\Functions' ) ) {
			return false;
		}

		return \Automattic\Jetpack\Sync\Functions::file_system_write_access();
	}
}
