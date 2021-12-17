<?php
/**
 * Recommendations.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS;

use Automattic\Jetpack_Boost\Lib\Options;

/**
 * Class Critical CSS Recommendations.
 */
class Recommendations {
	const RECOMMENDATION_KEY   = 'jb-critical-css-dismissed-recommendations';
	const RECOMMENDATION_NONCE = 'dismiss_notice';

	protected $options;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->options = new Options( self::RECOMMENDATION_KEY );
	}

	/**
	 * On prepare.
	 */
	public function on_prepare() {
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
		add_filter( 'jetpack_boost_js_constants', array( $this, 'add_boost_js_constants' ) );
		add_action( 'jetpack_boost_uninstall', array( $this, 'delete_all' ) );
	}

	/**
	 * Delete all recommendations.
	 */
	public function delete_all() {
		$this->options->delete();
	}

	/**
	 * Register REST routes for recommendations.
	 */
	public function register_rest_routes() {
		register_rest_route(
			JETPACK_BOOST_REST_NAMESPACE,
			JETPACK_BOOST_REST_PREFIX . '/recommendations/dismiss',
			array(
				array(
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'dismiss_recommendations' ),
					'permission_callback' => array( $this, 'current_user_can_manage_notifications' ),
				),
			)
		);

		register_rest_route(
			JETPACK_BOOST_REST_NAMESPACE,
			JETPACK_BOOST_REST_PREFIX . '/recommendations/reset',
			array(
				array(
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'reset_recommendations' ),
					'permission_callback' => array( $this, 'current_user_can_manage_notifications' ),
				),
			)
		);
	}

	/**
	 * Add Critical CSS related constants to be passed to JavaScript whether or not the module is enabled.
	 *
	 * @param array $constants Constants to be passed to JavaScript.
	 *
	 * @return array
	 */
	public function add_boost_js_constants( $constants ) {
		$constants['criticalCssDismissedRecommendations'] = $this->options->get();
		$constants['criticalCssDismissRecommendationsNonce'] = wp_create_nonce( self::RECOMMENDATION_NONCE );

		return $constants;
	}

	/**
	 * Check if user can manage notifications.
	 *
	 * @param \WP_REST_Request $request The request object.
	 *
	 * @return bool
	 */
	public function current_user_can_manage_notifications( $request ) {
		return ( wp_verify_nonce( $request['nonce'], self::RECOMMENDATION_NONCE ) && current_user_can( 'manage_options' ) );
	}

	/**
	 * Dismiss recommendations.
	 *
	 * @param \WP_REST_Request $request The request object.
	 */
	public function dismiss_recommendations( $request ) {
		$provider_key = filter_var( $request['providerKey'], FILTER_SANITIZE_STRING );
		if ( empty( $provider_key ) ) {
			wp_send_json_error();
		}

		$this->options->append( $provider_key );
		wp_send_json_success();
	}

	/**
	 * Reset recommendations.
	 */
	public function reset_recommendations() {
		$this->delete_all();
		wp_send_json_success();
	}

}
