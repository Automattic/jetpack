<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Module Name: Downtime Monitor
 * Module Description: Get instant alerts if your site goes down and know when it’s back online.
 * Sort Order: 28
 * Recommendation Order: 10
 * First Introduced: 2.6
 * Requires Connection: Yes
 * Requires User Connection: Yes
 * Auto Activate: No
 * Module Tags: Recommended
 * Feature: Security
 * Additional Search Queries: monitor, uptime, downtime, monitoring, maintenance, maintenance mode, offline, site is down, site down, down, repair, error
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Monitor\Monitor;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class Jetpack_Monitor
 *
 * Kept for backward compatibility; the logic lives in the automattic/jetpack-monitor package.
 *
 * @phan-constructor-used-for-side-effects
 */
class Jetpack_Monitor {

	/**
	 * Name of the module.
	 *
	 * @var string Name of module.
	 */
	public $module = 'monitor';

	/**
	 * Constructor.
	 */
	public function __construct() {
		Monitor::init();
		add_action( 'jetpack_modules_loaded', array( $this, 'jetpack_modules_loaded' ) );
	}

	/**
	 * Forgets every linked user's saved notification choice, while a site disconnect can still say who was linked.
	 *
	 * @since 16.4
	 *
	 * @return void
	 */
	public function delete_all_notifications_copies() {
		Monitor::delete_all_notifications_copies();
	}

	/**
	 * Forgets a user's saved notification choice, which belongs to the WordPress.com account they had linked.
	 *
	 * @since 16.4
	 *
	 * @param int $user_id User ID.
	 *
	 * @return void
	 */
	public function delete_notifications_copy( $user_id ) {
		Monitor::delete_notifications_copy( $user_id );
	}

	/**
	 * Name of the option holding a user's local copy of their notification choice.
	 *
	 * @since 16.4
	 *
	 * @param int $user_id User ID.
	 *
	 * @return string
	 */
	public static function notifications_copy_option_name( $user_id ) {
		return Monitor::notifications_copy_option_name( $user_id );
	}

	/**
	 * Saves the current user's notification choice where Jetpack_Core_Json_Api_Endpoints::get_remote_value reads it.
	 *
	 * @since 16.4
	 *
	 * @param bool $enabled Whether the current user receives notifications.
	 *
	 * @return void
	 */
	public static function save_notifications_copy( $enabled ) {
		Monitor::save_notifications_copy( $enabled );
	}

	/**
	 * Runs upon module activation.
	 *
	 * @return void
	 */
	public function activate_module() {
		Monitor::activate_module();
	}

	/**
	 * Runs on the jetpack_modules_loaded hook to enable configuation.
	 *
	 * @return void
	 */
	public function jetpack_modules_loaded() {
		Jetpack::enable_module_configurable( $this->module );
	}

	/**
	 * Whether to receive the notifications.
	 *
	 * @param bool $value `true` to enable notifications, `false` to disable them.
	 *
	 * @return bool
	 */
	public function update_option_receive_jetpack_monitor_notification( $value ) {
		$result = Monitor::set_notifications( $value );

		if ( is_wp_error( $result ) ) {
			wp_die( sprintf( '%s: %s', esc_html( $result->get_error_code() ), esc_html( $result->get_error_message() ) ) );
		}

		return true;
	}

	/**
	 * Checks the status of notifications for current Jetpack site user.
	 *
	 * @since 2.8
	 * @since 4.1.0 New parameter $die_on_error.
	 *
	 * @param bool $die_on_error Whether to issue a wp_die when an error occurs or return a WP_Error object.
	 *
	 * @return boolean|WP_Error
	 */
	public static function user_receives_notifications( $die_on_error = true ) {
		$result = Monitor::user_receives_notifications();

		if ( is_wp_error( $result ) && $die_on_error ) {
			wp_die( sprintf( '%s: %s', esc_html( $result->get_error_code() ), esc_html( $result->get_error_message() ) ), 400 );
		}
		return $result;
	}

	/**
	 * Returns date of the last downtime.
	 *
	 * @since 4.0.0
	 * @return string date in YYYY-MM-DD HH:mm:ss format
	 */
	public function monitor_get_last_downtime() {
		return Monitor::get_last_downtime();
	}
}

new Jetpack_Monitor();

// Register Jetpack Monitor abilities (WordPress Abilities API, WP 6.9+).
\Automattic\Jetpack\Plugin\Abilities\Monitor_Abilities::init();
