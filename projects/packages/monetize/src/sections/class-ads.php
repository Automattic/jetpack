<?php
/**
 * The Ads section of the Monetize dashboard.
 *
 * @package automattic/jetpack-monetize
 */

namespace Automattic\Jetpack\Monetize\Sections;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Monetize\Ads_Wpcom_Settings;
use Automattic\Jetpack\Monetize\Dashboard;
use Automattic\Jetpack\Monetize\Dashboard_Section;
use Automattic\Jetpack\Monetize\WPCOM_Proxy;
use WP_Error;
use WP_REST_Request;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Payout details on WordPress.com, and keeping its copy of the site's Ads settings caught up.
 *
 * @since $$next-version$$
 */
class Ads implements Dashboard_Section {

	/**
	 * The section's key.
	 *
	 * @return string
	 */
	public function get_key() {
		return 'ads';
	}

	/**
	 * Whether WordPress.com is behind the site's Ads settings.
	 *
	 * @return array
	 */
	public function get_state() {
		return array( 'wpcomOutOfDate' => Ads_Wpcom_Settings::is_out_of_date() );
	}

	/**
	 * Register the payout and sync routes.
	 *
	 * @return void
	 */
	public function register_routes() {
		$base = '/' . WPCOM_Proxy::REST_BASE . '/ads';

		register_rest_route(
			WPCOM_Proxy::REST_NAMESPACE,
			$base . '/payout',
			array(
				array(
					'methods'             => 'GET',
					'callback'            => array( __CLASS__, 'get_payout' ),
					'permission_callback' => array( __CLASS__, 'can_write_to_wpcom' ),
				),
				array(
					'methods'             => 'POST',
					'callback'            => array( __CLASS__, 'save_payout' ),
					'permission_callback' => array( __CLASS__, 'can_write_to_wpcom' ),
					'args'                => array(
						'paypal' => array(
							'type'              => 'string',
							'required'          => true,
							'sanitize_callback' => 'sanitize_email',
							'validate_callback' => static function ( $value ) {
								return is_email( $value ) ? true : new WP_Error( 'invalid_paypal', __( 'Enter a valid PayPal email address.', 'jetpack-monetize' ), array( 'status' => 400 ) );
							},
						),
						'tos'    => array(
							'type'    => 'boolean',
							'default' => false,
						),
					),
				),
			)
		);

		register_rest_route(
			WPCOM_Proxy::REST_NAMESPACE,
			$base . '/sync',
			array(
				'methods'             => 'POST',
				'callback'            => array( __CLASS__, 'sync' ),
				'permission_callback' => array( __CLASS__, 'can_write_to_wpcom' ),
			)
		);
	}

	/**
	 * Admins whose own WordPress.com account is connected, since every request goes out with their token.
	 *
	 * @return true|WP_Error
	 */
	public static function can_write_to_wpcom() {
		if ( ! Dashboard::can_manage() ) {
			return new WP_Error( 'rest_forbidden', __( 'Sorry, you are not allowed to do that.', 'jetpack-monetize' ), array( 'status' => rest_authorization_required_code() ) );
		}

		if ( ! ( new Connection_Manager() )->is_user_connected() ) {
			return new WP_Error( 'rest_unauthorized', __( 'Connect your WordPress.com account first.', 'jetpack-monetize' ), array( 'status' => 403 ) );
		}

		return true;
	}

	/**
	 * GET the payout details.
	 *
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function get_payout() {
		return rest_ensure_response( Ads_Wpcom_Settings::get_payout() );
	}

	/**
	 * POST the payout details.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function save_payout( WP_REST_Request $request ) {
		return rest_ensure_response( Ads_Wpcom_Settings::save_payout( $request['paypal'], (bool) $request['tos'] ) );
	}

	/**
	 * POST to catch WordPress.com up with the site's Ads settings.
	 *
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function sync() {
		$synced = Ads_Wpcom_Settings::sync();
		return is_wp_error( $synced ) ? $synced : rest_ensure_response( array( 'synced' => $synced ) );
	}
}
