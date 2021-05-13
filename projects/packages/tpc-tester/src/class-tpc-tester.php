<?php
/**
 * The 3rd Party Cookie Tester class
 *
 * @package automattic/tpc-tester
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Constants;

class Tpc_Tester {

	const COOKIE_NAME       = 'jetpack_tpc_tester';
	const SUPPORTED_VALUE   = 'supported';
	const UNSUPPORTED_VALUE = 'unsupported';

	private static $cookie_value;
	private static $tested;
	private static $initialized = false;

	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		session_start();
		self::$initialized  = true;
		self::$tested       = ! empty( $_COOKIE[ self::COOKIE_NAME ] );
		self::$cookie_value = isset( $_COOKIE[ self::COOKIE_NAME ] ) ? $_COOKIE[ self::COOKIE_NAME ] : '';
		error_log( 'Is cookie set? ' . json_encode( isset( $_COOKIE[ self::COOKIE_NAME ] ) ) );
		error_log( 'Cookie value: ' . self::$cookie_value );

		if ( ! self::$tested && is_user_logged_in() ) {
			add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_scripts' ) );
		}
	}

	public static function is_tested() {
		return self::$tested;
	}

	public static function supports() {
		return self::is_tested() && self::SUPPORTED_VALUE === self::$cookie_value;
	}

	public static function enqueue_scripts() {
		$api_base_url = Constants::get_constant( 'JETPACK__API_BASE' );
		wp_enqueue_script( 'jetpack_tpc_tester_client', plugin_dir_url( __DIR__ ) . '/src/jetpack_tpc_tester.js', array(), rand() );
		wp_enqueue_script( 'jetpack_tpc_tester_server', $api_base_url . 'test_3rdpc_set/' . Constants::get_constant( 'JETPACK__API_VERSION' ) . '/', array( 'jetpack_tpc_tester_client' ), rand() );

		wp_localize_script(
			'jetpack_tpc_tester_client',
			'jetpack_tpc_tester_client',
			array(
				'test_url'          => $api_base_url . 'test_3rdpc_get/' . Constants::get_constant( 'JETPACK__API_VERSION' ) . '/',
				'cookie_name'       => self::COOKIE_NAME,
				'supported_value'   => self::SUPPORTED_VALUE,
				'unsupported_value' => self::UNSUPPORTED_VALUE,
			)
		);
	}
}
