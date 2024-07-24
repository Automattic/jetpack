<?php
/**
 * Scheduled Updates
 *
 * @package automattic/scheduled-updates
 */

namespace Automattic\Jetpack;

// Load dependencies.
require_once __DIR__ . '/pluggable.php';

/**
 * Scheduled Updates class.
 */
class Scheduled_Updates {

	/**
	 * The version of the package.
	 *
	 * @var string
	 */
	const PACKAGE_VERSION = '0.13.0';

	/**
	 * The cron event hook for the scheduled plugins update.
	 *
	 * @var string
	 */
	const PLUGIN_CRON_HOOK = 'jetpack_scheduled_plugins_update';

	/**
	 * The cron event filter for the scheduled plugins update.
	 *
	 * @var string
	 */
	const PLUGIN_CRON_SYNC_HOOK = 'jetpack_scheduled_plugins_update_sync';

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

		add_action( self::PLUGIN_CRON_HOOK, array( __CLASS__, 'run_scheduled_update' ), 10, 10 );
		add_filter( 'auto_update_plugin', array( __CLASS__, 'allowlist_scheduled_plugins' ), 10, 2 );
		add_action( 'deleted_plugin', array( __CLASS__, 'deleted_plugin' ), 10, 2 );

		add_action( 'rest_api_init', array( __CLASS__, 'add_is_managed_extension_field' ) );
		add_action( 'rest_api_init', array( Scheduled_Updates_Logs::class, 'add_log_fields' ) );
		add_action( 'rest_api_init', array( Scheduled_Updates_Active::class, 'add_active_field' ) );
		add_action( 'rest_api_init', array( Scheduled_Updates_Health_Paths::class, 'add_health_check_paths_field' ) );

		add_filter( 'plugins_list', array( Scheduled_Updates_Admin::class, 'add_scheduled_updates_context' ) );
		add_filter( 'views_plugins', array( Scheduled_Updates_Admin::class, 'add_scheduled_updates_view' ) );
		add_filter( 'plugin_auto_update_setting_html', array( Scheduled_Updates_Admin::class, 'show_scheduled_updates' ), 10, 2 );

		add_action( 'jetpack_scheduled_update_created', array( __CLASS__, 'maybe_disable_autoupdates' ), 10, 3 );

		add_action( 'jetpack_scheduled_update_updated', array( Scheduled_Updates_Logs::class, 'replace_logs_schedule_id' ), 10, 2 );

		add_action( 'jetpack_scheduled_update_deleted', array( __CLASS__, 'enable_autoupdates' ), 10, 2 );
		add_action( 'jetpack_scheduled_update_deleted', array( Scheduled_Updates_Active::class, 'clear' ) );
		add_action( 'jetpack_scheduled_update_deleted', array( Scheduled_Updates_Health_Paths::class, 'clear' ) );
		add_action( 'jetpack_scheduled_update_deleted', array( Scheduled_Updates_Logs::class, 'delete_logs_schedule_id' ), 10, 3 );

		// Update cron sync option after options update.
		$callback = array( __CLASS__, 'update_option_cron' );

		// Main cron saving.
		add_action( 'add_option_cron', $callback );
		add_action( 'update_option_cron', $callback );

		// Logs saving.
		add_action( 'add_option_' . Scheduled_Updates_Logs::OPTION_NAME, $callback );
		add_action( 'update_option_' . Scheduled_Updates_Logs::OPTION_NAME, $callback );

		// Active flag saving.
		add_action( 'add_option_' . Scheduled_Updates_Active::OPTION_NAME, $callback );
		add_action( 'update_option_' . Scheduled_Updates_Active::OPTION_NAME, $callback );

		add_filter( 'pre_schedule_event', array( __CLASS__, 'clear_cron_cache_pre' ), 10, 2 );
	}

	/**
	 * Load the REST API endpoints.
	 *
	 * @suppress PhanUndeclaredFunction
	 */
	public static function load_rest_api_endpoints() {
		if ( ! function_exists( 'wpcom_rest_api_v2_load_plugin' ) ) {
			return;
		}

		$endpoints = glob( __DIR__ . '/wpcom-endpoints/*.php' );
		foreach ( array_filter( (array) $endpoints, 'is_file' ) as $endpoint ) {
			require_once $endpoint;
		}

		wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Update_Schedules' );
		wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Update_Schedules_Capabilities' );
		wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Update_Schedules_Logs' );
		wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Update_Schedules_Active' );
	}

	/**
	 * Run the scheduled update.
	 *
	 * @param string ...$plugins List of plugins to update.
	 */
	public static function run_scheduled_update( ...$plugins ) {
		$schedule_id = self::generate_schedule_id( $plugins );

		if ( ! Scheduled_Updates_Active::get( $schedule_id ) ) {
			// The schedule is not active, return.
			return false;
		}

		$available_updates = get_site_transient( 'update_plugins' );
		$plugins_to_update = $available_updates->response ?? array();
		$plugins_to_update = array_intersect_key( $plugins_to_update, array_flip( $plugins ) );

		if ( empty( $plugins_to_update ) ) {

			// Log a start and success.
			Scheduled_Updates_Logs::log(
				$schedule_id,
				Scheduled_Updates_Logs::PLUGIN_UPDATES_START,
				'no_plugins_to_update'
			);
			Scheduled_Updates_Logs::log(
				$schedule_id,
				Scheduled_Updates_Logs::PLUGIN_UPDATES_SUCCESS,
				'no_plugins_to_update'
			);

			return false;
		}

		$response = ( new Connection\Client() )->wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/hosting/scheduled-update', \Jetpack_Options::get_option( 'id' ) ),
			'2',
			array( 'method' => 'POST' ),
			array(
				'health_check_paths' => Scheduled_Updates_Health_Paths::get( $schedule_id ),
				'plugins'            => $plugins_to_update,
				'schedule_id'        => $schedule_id,
			),
			'wpcom'
		);

		return is_array( $response );
	}

	/**
	 * Save the schedules for sync after cron option saving.
	 */
	public static function update_option_cron() {
		// Do not update the option if the filter returns false.
		if ( ! apply_filters( self::PLUGIN_CRON_SYNC_HOOK, true ) ) {
			return;
		}

		Scheduled_Updates_Logs::add_log_fields();
		Scheduled_Updates_Active::add_active_field();
		Scheduled_Updates_Health_Paths::add_health_check_paths_field();

		$endpoint   = new \WPCOM_REST_API_V2_Endpoint_Update_Schedules();
		$events     = $endpoint->get_items( new \WP_REST_Request() );
		$updated_at = time();

		if ( ! is_wp_error( $events ) ) {
			$option = array_map(
				function ( $event ) use ( $updated_at ) {
					$ret = (object) $event;
					// Add updated_at field to ensure the option is always on sync.
					$ret->updated_at = $updated_at;

					return $ret;
				},
				$events->get_data()
			);
			update_option( self::PLUGIN_CRON_HOOK, $option );
		}
	}

	/**
	 * Clear the cron cache.
	 */
	public static function clear_cron_cache() {
		wp_cache_delete( 'cron', 'options' );
		wp_load_alloptions( true );
	}

	/**
	 * Reload the cron cache in pre_schedule_event hook. Returns null to prevent short-circuit.
	 *
	 * @param null|bool|\WP_Error $result The value to return instead. Default null to continue adding the event.
	 * @param object              $event  The event object.
	 */
	public static function clear_cron_cache_pre( $result, $event ) {
		// If the transient is set and an external event is about to run, it means that the cron cache must be refreshed.
		if ( self::PLUGIN_CRON_HOOK !== $event->hook && get_transient( 'pre_schedule_event_clear_cron_cache' ) ) {
			self::clear_cron_cache();
		}

		return $result;
	}

	/**
	 * Updates last status of a scheduled update.
	 *
	 * @param string      $schedule_id Request ID.
	 * @param int|null    $timestamp   Timestamp of the last run.
	 * @param string|null $status      Status of the last run.
	 * @return false|array Updated statuses or false if not found.
	 */
	public static function set_scheduled_update_status( $schedule_id, $timestamp, $status ) {
		$events = wp_get_scheduled_events( self::PLUGIN_CRON_HOOK );

		if ( empty( $events[ $schedule_id ] ) ) {
			// Scheduled update not found.
			return false;
		}

		$statuses = get_option( 'jetpack_scheduled_update_statuses', array() );
		$option   = array();

		// Reset the last statuses for the schedule.
		foreach ( array_keys( $events ) as $status_id ) {
			if ( ! empty( $statuses[ $status_id ] ) ) {
				$option[ $status_id ] = $statuses[ $status_id ];
			} else {
				$option[ $status_id ] = null;
			}
		}

		// Update the last status for the schedule.
		$option[ $schedule_id ] = array(
			'last_run_timestamp' => $timestamp,
			'last_run_status'    => $status,
		);

		update_option( 'jetpack_scheduled_update_statuses', $option );

		return $option;
	}

	/**
	 * Get the last status of a scheduled update.
	 *
	 * @param string $schedule_id Request ID.
	 * @return array|false Last status of the scheduled update or false if not found.
	 */
	public static function get_scheduled_update_status( $schedule_id ) {
		return Scheduled_Updates_Logs::infer_status_from_logs( $schedule_id );
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

			$events = wp_get_scheduled_events( self::PLUGIN_CRON_HOOK );
			foreach ( $events as $event ) {
				if ( isset( $item->plugin ) && in_array( $item->plugin, $event->args, true ) ) {
					return true;
				}
			}
		}

		return $update;
	}

	/**
	 * Maybe disable autoupdates.
	 *
	 * @param string           $id      The ID of the schedule.
	 * @param object           $event   The event object.
	 * @param \WP_REST_Request $request The request object.
	 */
	public static function maybe_disable_autoupdates( $id, $event, $request ) {
		require_once ABSPATH . 'wp-admin/includes/update.php';

		if ( wp_is_auto_update_enabled_for_type( 'plugin' ) ) {
			// Remove the plugins that are now updated on a schedule from the auto-update list.
			$auto_update_plugins = get_option( 'auto_update_plugins', array() );
			$auto_update_plugins = array_diff( $auto_update_plugins, $request['plugins'] );
			update_option( 'auto_update_plugins', $auto_update_plugins );
		}
	}

	/**
	 * Enable autoupdates.
	 *
	 * @param string $id    The ID of the schedule.
	 * @param object $event The deleted event object.
	 */
	public static function enable_autoupdates( $id, $event ) {
		require_once ABSPATH . 'wp-admin/includes/update.php';

		if ( ! wp_is_auto_update_enabled_for_type( 'plugin' ) ) {
			return;
		}

		$events = wp_get_scheduled_events( static::PLUGIN_CRON_HOOK );
		unset( $events[ $id ] );

		// Find the plugins that are not part of any other schedule.
		$plugins = $event->args;
		foreach ( wp_list_pluck( $events, 'args' ) as $args ) {
			$plugins = array_diff( $plugins, $args );
		}

		// Add the plugins that are no longer updated on a schedule to the auto-update list.
		$auto_update_plugins = get_option( 'auto_update_plugins', array() );
		$auto_update_plugins = array_unique( array_merge( $auto_update_plugins, $plugins ) );
		usort( $auto_update_plugins, 'strnatcasecmp' );
		update_option( 'auto_update_plugins', $auto_update_plugins );
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
				* @param array $data Prepared response array.
				* @return bool
				*/
				'get_callback' => function ( $data ) {
					return self::is_managed_plugin( $data['plugin'] );
				},
				'schema'       => array(
					'description' => 'Whether the plugin is managed by the host.',
					'type'        => 'boolean',
				),
			)
		);
	}

	/**
	 * Hook run when a plugin is deleted.
	 *
	 * @param string $plugin_file Path to the plugin file relative to the plugins directory.
	 * @param bool   $deleted     Whether the plugin deletion was successful.
	 */
	public static function deleted_plugin( $plugin_file, $deleted ) {
		if ( ! $deleted ) {
			return;
		}

		$events = wp_get_scheduled_events( self::PLUGIN_CRON_HOOK );

		if ( ! count( $events ) ) {
			return;
		}

		foreach ( $events as $id => $event ) {
			// Continue if the plugin is not part of the schedule.
			if ( ! in_array( $plugin_file, $event->args, true ) ) {
				continue;
			}

			// Remove the schedule.
			$result = wp_unschedule_event( $event->timestamp, self::PLUGIN_CRON_HOOK, $event->args, true );

			if ( is_wp_error( $result ) || false === $result ) {
				continue;
			}

			$plugins = array_values( array_diff( $event->args, array( $plugin_file ) ) );

			if ( ! count( $plugins ) ) {
				continue;
			}

			// There are still plugins to update. Schedule a new event.
			$event = wp_schedule_event( $event->timestamp, $event->schedule, self::PLUGIN_CRON_HOOK, $plugins, true );

			if ( is_wp_error( $event ) || false === $event ) {
				continue;
			}

			$schedule_id = self::generate_schedule_id( $plugins );
			$status      = self::get_scheduled_update_status( $id );

			// Inherit the status from the previous schedule.
			if ( $status ) {
				Scheduled_Updates_Logs::replace_logs_schedule_id( $id, $schedule_id );
			}
		}
	}

	/**
	 * Generates a unique schedule ID.
	 *
	 * @see wp_schedule_event()
	 *
	 * @param array $args Schedule arguments.
	 * @return string
	 */
	public static function generate_schedule_id( $args ) {
		return md5( serialize( $args ) ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.serialize_serialize
	}

	/**
	 * Check if a plugin is managed by the host.
	 *
	 * Users could have their own plugins folder with symlinks pointing to it, so we need to check if the
	 * link target is within the `/wordpress` directory to determine if the plugin is managed.
	 *
	 * @see p9o2xV-3Nx-p2#comment-8728
	 *
	 * @param string $plugin The plugin to check.
	 * @return bool
	 */
	public static function is_managed_plugin( $plugin ) {
		$folder = WP_PLUGIN_DIR . '/' . strtok( $plugin, '/' );
		$target = is_link( $folder ) ? realpath( $folder ) : false;

		return $target && 0 === strpos( $target, '/wordpress/' );
	}
}
