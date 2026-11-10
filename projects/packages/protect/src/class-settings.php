<?php
/**
 * Protect dashboard: the settings its toggles read and save.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\SSO\Helpers as SSO_Helpers;
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
	 * Prefix of the per-user transient set while WordPress.com can't answer for that setting.
	 *
	 * @var string
	 */
	const MONITOR_NOTIFICATIONS_FAILED = 'jetpack_protect_monitor_notifications_failed_';

	/**
	 * SSO's options, saved locally as 0 or 1, each with the SSO helper that reads its value in effect.
	 *
	 * @var string[]
	 */
	const SSO_OPTIONS = array(
		'jetpack_sso_match_by_email'   => 'match_by_email',
		'jetpack_sso_require_two_step' => 'is_two_step_required',
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
			// The helpers apply the constant and filters that can force a value, which the dashboard then shows as locked.
			foreach ( self::SSO_OPTIONS as $option => $helper ) {
				$settings[ $option ] = (bool) call_user_func( array( SSO_Helpers::class, $helper ) );
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
		if ( $patch instanceof WP_Error ) {
			return $patch;
		}
		$modules = new Modules();

		foreach ( array_intersect( self::MODULES, array_keys( $patch ) ) as $module ) {
			if ( ! $modules->is_module( $module ) ) {
				return self::error( 'module_unavailable', $module );
			}
		}

		foreach ( $patch as $key => $value ) {
			if ( in_array( $key, self::MODULES, true ) ) {
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
				$result = Monitor::set_notifications( (bool) $value );
				if ( true !== $result ) {
					return self::error( 'monitor_notifications_failed', $key, is_wp_error( $result ) ? $result->get_error_message() : '' );
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
				return self::error( 'rest_invalid_param', $key, sprintf( __( '%s must be a string.', 'jetpack-protect-pkg' ), $key ) );
			}
			// The firewall reads the stored copy, so check the list as it will be stored.
			$patch[ $key ] = esc_textarea( $patch[ $key ] );
			if ( 'jetpack_waf_ip_block_list' === $key ) {
				$valid = Firewall::validate_ip_block_list( $patch[ $key ] );
				if ( is_wp_error( $valid ) ) {
					return self::error( 'rest_invalid_param', $key, $valid->get_error_message() );
				}
			}
		}
		return $patch;
	}

	/**
	 * Whether the current user gets downtime emails: the local copy, or else WordPress.com's answer, which is then saved.
	 *
	 * @return bool
	 */
	private static function get_monitor_notifications() {
		$user_id = get_current_user_id();
		$value   = get_option( Monitor::notifications_copy_option_name( $user_id ), 'does_not_exist' );
		if ( 'does_not_exist' !== $value ) {
			return (bool) $value;
		}

		$failed_key = self::MONITOR_NOTIFICATIONS_FAILED . $user_id;
		if ( ! ( new Connection_Manager() )->is_user_connected() || get_transient( $failed_key ) ) {
			return false;
		}

		$value = Monitor::user_receives_notifications();
		// Not saved, since the user may not be connected yet; the transient only stops a remote call on every load.
		if ( is_wp_error( $value ) ) {
			set_transient( $failed_key, 1, 5 * MINUTE_IN_SECONDS );
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
	 * A 400 error naming the key that could not be saved, with any reason also under `params`, where core's `rest_invalid_param` puts it.
	 *
	 * @param string $code   Error code.
	 * @param string $key    The setting.
	 * @param string $reason Why it was refused, if known.
	 * @return WP_Error
	 */
	private static function error( $code, $key, $reason = '' ) {
		/* translators: %s is a setting name. */
		$message = sprintf( __( 'The "%s" setting couldn’t be saved.', 'jetpack-protect-pkg' ), $key );
		$data    = array( 'status' => 400 );
		if ( '' !== $reason ) {
			$message       .= ' ' . $reason;
			$data['params'] = array( $key => $reason );
		}
		return new WP_Error( $code, $message, $data );
	}
}
