<?php
/**
 * Downtime monitoring, which WordPress.com runs for connected sites with the `monitor` module on.
 *
 * @package automattic/jetpack-monitor
 */

namespace Automattic\Jetpack\Monitor;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Jetpack_IXR_Client;
use Jetpack_Options;
use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Keeps the `monitor` module's per-user email alerts in step with WordPress.com.
 */
class Monitor {

	const PACKAGE_VERSION = '0.1.0';

	/**
	 * Module slug.
	 *
	 * @var string
	 */
	const MODULE = 'monitor';

	/**
	 * Prefix of the per-user option holding a local copy of that user's email choice.
	 *
	 * @var string
	 */
	const NOTIFICATIONS_OPTION_PREFIX = 'monitor_receive_notifications';

	/**
	 * Wire the hooks, and make the module available to plugins other than Jetpack. Safe to call more than once.
	 *
	 * @return void
	 */
	public static function init() {
		add_filter( 'jetpack_get_available_standalone_modules', array( __CLASS__, 'add_standalone_module' ) );
		add_action( 'jetpack_activate_module_monitor', array( __CLASS__, 'activate_module' ) );
		add_action( 'jetpack_unlinked_user', array( __CLASS__, 'delete_notifications_copy' ) );
		add_action( 'deleted_user', array( __CLASS__, 'delete_notifications_copy' ) );
		add_action( 'jetpack_site_before_disconnected', array( __CLASS__, 'delete_all_notifications_copies' ) );
	}

	/**
	 * Add `monitor` to the modules a standalone plugin can switch on.
	 *
	 * @param string[] $modules Module slugs.
	 * @return string[]
	 */
	public static function add_standalone_module( $modules ) {
		return array_unique( array_merge( (array) $modules, array( self::MODULE ) ) );
	}

	/**
	 * Subscribe the user turning Monitor on to its emails, when they have a WordPress.com account linked.
	 *
	 * @return void
	 */
	public static function activate_module() {
		if ( ( new Connection_Manager() )->is_user_connected() ) {
			// A failure doesn't block activation: dropping any stale copy makes the next settings read ask WordPress.com.
			if ( is_wp_error( self::set_notifications( true ) ) ) {
				self::delete_notifications_copy( get_current_user_id() );
			}
		}
	}

	/**
	 * Forget every linked user's saved email choice, while a site disconnect can still say who was linked.
	 *
	 * @return void
	 */
	public static function delete_all_notifications_copies() {
		$user_tokens = Jetpack_Options::get_option( 'user_tokens' );
		foreach ( array_keys( is_array( $user_tokens ) ? $user_tokens : array() ) as $user_id ) {
			self::delete_notifications_copy( $user_id );
		}
	}

	/**
	 * Forget a user's saved email choice, which belongs to the WordPress.com account they had linked.
	 *
	 * @param int $user_id User ID.
	 * @return void
	 */
	public static function delete_notifications_copy( $user_id ) {
		delete_option( self::notifications_copy_option_name( $user_id ) );
	}

	/**
	 * Name of the option holding a user's local copy of their email choice.
	 *
	 * @param int $user_id User ID.
	 * @return string
	 */
	public static function notifications_copy_option_name( $user_id ) {
		return self::NOTIFICATIONS_OPTION_PREFIX . (int) $user_id;
	}

	/**
	 * Save the current user's email choice locally.
	 *
	 * @param bool $enabled Whether the current user gets the emails.
	 * @return void
	 */
	public static function save_notifications_copy( $enabled ) {
		// An integer, because update_option() won't create an option whose value is `false`.
		update_option( self::notifications_copy_option_name( get_current_user_id() ), (int) (bool) $enabled );
	}

	/**
	 * Subscribe or unsubscribe the current user from the emails on WordPress.com, and save the choice locally.
	 *
	 * @param bool $enabled Whether to send the emails.
	 * @return true|WP_Error
	 */
	public static function set_notifications( $enabled ) {
		$xml = new Jetpack_IXR_Client( array( 'user_id' => get_current_user_id() ) );
		$xml->query( 'jetpack.monitor.setNotifications', (bool) $enabled );

		if ( $xml->isError() ) {
			return new WP_Error( $xml->getErrorCode(), $xml->getErrorMessage(), array( 'status' => 400 ) );
		}

		self::save_notifications_copy( $enabled );
		return true;
	}

	/**
	 * Ask WordPress.com whether the current user gets the emails.
	 *
	 * @return mixed|WP_Error WordPress.com's answer.
	 */
	public static function user_receives_notifications() {
		$xml = new Jetpack_IXR_Client( array( 'user_id' => get_current_user_id() ) );
		$xml->query( 'jetpack.monitor.isUserInNotifications' );

		if ( $xml->isError() ) {
			return new WP_Error( $xml->getErrorCode(), $xml->getErrorMessage(), array( 'status' => 400 ) );
		}
		return $xml->getResponse();
	}

	/**
	 * When the site last went down, also saved in the `monitor_last_downtime` transient for ten minutes.
	 *
	 * @return string|WP_Error Date in `Y-m-d H:i:s` format.
	 */
	public static function get_last_downtime() {
		$xml = new Jetpack_IXR_Client();
		$xml->query( 'jetpack.monitor.getLastDowntime' );

		if ( $xml->isError() ) {
			return new WP_Error( 'monitor-downtime', $xml->getErrorMessage() );
		}

		set_transient( 'monitor_last_downtime', $xml->getResponse(), 10 * MINUTE_IN_SECONDS );
		return $xml->getResponse();
	}
}
