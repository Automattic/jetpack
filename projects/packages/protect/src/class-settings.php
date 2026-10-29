<?php
/**
 * Protect dashboard: the settings its toggles read and save.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Monitor\Monitor;
use Automattic\Jetpack\Protect\Sections\Firewall;
use Automattic\Jetpack\Waf\REST_Controller as Waf_REST_Controller;
use Automattic\Jetpack\Waf\Waf_Runner;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * A flat settings route covering only the dashboard's keys, so the page works without the Jetpack plugin's `jetpack/v4/settings`.
 *
 * @since $$next-version$$
 */
class Settings {

	/**
	 * Modules the dashboard can switch on and off.
	 *
	 * @var string[]
	 */
	const MODULES = array( 'waf', 'protect', 'account-protection', 'monitor', 'sso' );

	/**
	 * Monitor's per-user email setting, which lives on WordPress.com.
	 *
	 * @var string
	 */
	const MONITOR_NOTIFICATIONS = 'monitor_receive_notifications';

	/**
	 * SSO's options, stored locally as plain booleans, with the value SSO assumes while each is unset.
	 *
	 * @var bool[]
	 */
	const SSO_OPTIONS = array(
		'jetpack_sso_match_by_email'   => true,
		'jetpack_sso_require_two_step' => false,
	);

	/**
	 * Firewall options, saved through the WAF package's own handler.
	 *
	 * @var string[]
	 */
	const WAF_OPTIONS = array(
		'jetpack_waf_automatic_rules',
		'jetpack_waf_ip_allow_list',
		'jetpack_waf_ip_allow_list_enabled',
		'jetpack_waf_ip_block_list',
		'jetpack_waf_ip_block_list_enabled',
		'jetpack_waf_share_data',
		'jetpack_waf_share_debug_data',
	);

	/**
	 * Wire the hooks.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
	}

	/**
	 * Register the settings route.
	 *
	 * @return void
	 */
	public static function register_routes() {
		register_rest_route(
			'jetpack/v4',
			'/protect-dashboard/settings',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_settings' ),
					'permission_callback' => array( Dashboard::class, 'can_manage' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( __CLASS__, 'update_settings' ),
					'permission_callback' => array( Dashboard::class, 'can_manage' ),
				),
			)
		);
	}

	/**
	 * Every supported key and its current value; keys for features this site can't run are left out.
	 *
	 * @return array
	 */
	public static function get_settings() {
		$modules  = new Modules();
		$settings = array();

		foreach ( self::MODULES as $module ) {
			if ( $modules->is_module( $module ) ) {
				$settings[ $module ] = $modules->is_active( $module );
			}
		}

		if ( ! empty( $settings['monitor'] ) ) {
			$settings[ self::MONITOR_NOTIFICATIONS ] = self::get_monitor_notifications();
		}

		if ( isset( $settings['sso'] ) ) {
			foreach ( self::SSO_OPTIONS as $option => $default ) {
				$settings[ $option ] = (bool) get_option( $option, $default );
			}
		}

		$settings = array_merge( $settings, self::get_waf_keys() );

		return $settings;
	}

	/**
	 * Save the given keys, then return every setting.
	 *
	 * @param WP_REST_Request $request The request; its JSON body is the patch.
	 * @return array|WP_Error
	 */
	public static function update_settings( $request ) {
		$patch = self::sanitize_ip_lists( (array) $request->get_json_params() );
		if ( is_wp_error( $patch ) ) {
			return $patch;
		}
		$modules = new Modules();

		foreach ( $patch as $key => $value ) {
			if ( in_array( $key, self::MODULES, true ) ) {
				if ( ! $modules->is_module( $key ) ) {
					return self::error( 'module_unavailable', $key );
				}
				if ( $value ) {
					$modules->activate( $key, false, false );
				} else {
					$modules->deactivate( $key );
				}
				// deactivate() returns false when nothing changed, and a filter can force a module on, so check the outcome.
				if ( $modules->is_active( $key ) !== (bool) $value ) {
					return self::error( 'module_update_failed', $key );
				}
			} elseif ( isset( self::SSO_OPTIONS[ $key ] ) && $modules->is_module( 'sso' ) ) {
				// An integer, because update_option() won't create an option whose value is `false`.
				update_option( $key, (int) (bool) $value );
			} elseif ( self::MONITOR_NOTIFICATIONS === $key ) {
				if ( true !== Monitor::set_notifications( (bool) $value ) ) {
					return self::error( 'monitor_notifications_failed', $key );
				}
			}
		}

		$waf_patch = array_intersect_key( $patch, self::get_waf_keys() );
		if ( $waf_patch && class_exists( Waf_REST_Controller::class ) ) {
			$waf_request = new WP_REST_Request( 'POST' );
			$waf_request->set_body_params( $waf_patch );
			$result = Waf_REST_Controller::update_waf( $waf_request );
			if ( is_wp_error( $result ) ) {
				return $result;
			}
		}

		return self::get_settings();
	}

	/**
	 * Check the IP lists as `jetpack/v4/settings` did, before anything is saved, and return the patch with them escaped.
	 *
	 * @param array $patch The requested changes.
	 * @return array|WP_Error
	 */
	private static function sanitize_ip_lists( $patch ) {
		foreach ( array( 'jetpack_waf_ip_allow_list', 'jetpack_waf_ip_block_list' ) as $key ) {
			if ( ! array_key_exists( $key, $patch ) ) {
				continue;
			}
			if ( ! is_string( $patch[ $key ] ) ) {
				/* translators: %s is a setting name. */
				return self::invalid_param( $key, sprintf( __( '%s must be a string.', 'jetpack-protect-pkg' ), $key ) );
			}
			// The firewall reads the stored copy, so check the list as it will be stored.
			$patch[ $key ] = esc_textarea( $patch[ $key ] );
			if ( 'jetpack_waf_ip_block_list' === $key ) {
				$valid = Firewall::validate_ip_block_list( $patch[ $key ] );
				if ( is_wp_error( $valid ) ) {
					return self::invalid_param( $key, $valid->get_error_message() );
				}
			}
		}
		return $patch;
	}

	/**
	 * A 400 error shaped like core's, whose `params` the dashboard shows.
	 *
	 * @param string $key     The setting.
	 * @param string $message Why it was refused.
	 * @return WP_Error
	 */
	private static function invalid_param( $key, $message ) {
		return new WP_Error(
			'rest_invalid_param',
			/* translators: %s is a setting name. */
			sprintf( __( 'Invalid parameter(s): %s', 'jetpack-protect-pkg' ), $key ),
			array(
				'status' => 400,
				'params' => array( $key => $message ),
			)
		);
	}

	/**
	 * Whether the current user gets downtime emails: the local copy, or else WordPress.com's answer, which is then saved.
	 *
	 * @return bool
	 */
	private static function get_monitor_notifications() {
		$value = get_option( Monitor::notifications_copy_option_name( get_current_user_id() ), 'does_not_exist' );
		if ( 'does_not_exist' !== $value ) {
			return (bool) $value;
		}

		if ( ! ( new Connection_Manager() )->is_user_connected() ) {
			return false;
		}

		$value = Monitor::user_receives_notifications();
		// Not saved: the user may not be connected yet, and would be stuck with this answer.
		if ( is_wp_error( $value ) ) {
			return false;
		}

		Monitor::save_notifications_copy( $value );
		return (bool) $value;
	}

	/**
	 * The firewall settings the dashboard edits, with their values; get_config() also returns server paths.
	 *
	 * @return array
	 */
	private static function get_waf_keys() {
		if ( ! class_exists( Waf_Runner::class ) ) {
			return array();
		}
		return array_intersect_key( Waf_Runner::get_config(), array_flip( self::WAF_OPTIONS ) );
	}

	/**
	 * A 400 error naming the key that could not be saved.
	 *
	 * @param string $code Error code.
	 * @param string $key  The setting.
	 * @return WP_Error
	 */
	private static function error( $code, $key ) {
		/* translators: %s is a setting name. */
		$message = sprintf( __( 'The "%s" setting couldn’t be saved.', 'jetpack-protect-pkg' ), $key );
		return new WP_Error( $code, $message, array( 'status' => 400 ) );
	}
}
