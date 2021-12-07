<?php
namespace Automattic\Jetpack_Boost\Modules\Critical_CSS;

/**
 * Critical CSS Recommendation class
 */
class Critical_CSS_Recommendation {
	const DISMISSED_RECOMMENDATIONS_STORAGE_KEY = 'jb-critical-css-dismissed-recommendations';
	const DISMISS_CSS_RECOMMENDATIONS_NONCE     = 'dismiss_notice';

	public function __construct() {
		add_filter( 'jetpack_boost_js_constants', array( $this, 'always_add_critical_css_constants' ) );
	}

	public function on_initialize() {

		add_action( 'wp_ajax_dismiss_recommendations', array( $this, 'dismiss_recommendations' ) );
		add_action( 'wp_ajax_reset_dismissed_recommendations', array( $this, 'reset_dismissed_recommendations' ) );
		add_filter( 'jetpack_boost_js_constants', array( $this, 'add_critical_css_constants' ) );
	}

	/**
	 * Run on plugin uninstall
	 */
	public static function on_uninstall() {
		self::clear_dismissed_recommendations();
	}

	public function add_critical_css_constants( $constants ) {
		$constants['criticalCssDismissedRecommendations'] = \get_option( self::DISMISSED_RECOMMENDATIONS_STORAGE_KEY, array() );

		return $constants;
	}

	/**
	 * Add Critical CSS related constants to be passed to JavaScript whether or not the module is enabled.
	 *
	 * @param array $constants Constants to be passed to JavaScript.
	 *
	 * @return array
	 */
	public function always_add_critical_css_constants( $constants ) {
		$constants['criticalCssDismissRecommendationsNonce'] = wp_create_nonce( self::DISMISS_CSS_RECOMMENDATIONS_NONCE );

		return $constants;
	}

	/**
	 * Clear Critical CSS dismissed recommendations option.
	 */
	public static function clear_dismissed_recommendations() {
		\delete_option( self::DISMISSED_RECOMMENDATIONS_STORAGE_KEY );
	}

	/**
	 * Dismiss Critical CSS recommendations.
	 */
	public function dismiss_recommendations() {
		if ( check_ajax_referer( self::DISMISS_CSS_RECOMMENDATIONS_NONCE, 'nonce' ) && current_user_can( 'manage_options' ) ) {
			$response = array(
				'status' => 'ok',
			);
		} else {
			$error = new \WP_Error( 'authorization', __( 'You do not have permission to take this action.', 'jetpack-boost' ) );
			wp_send_json_error( $error, 403 );
		}

		$provider_key = $_POST['providerKey'] ? filter_var( $_POST['providerKey'], FILTER_SANITIZE_STRING ) : '';
		if ( empty( $provider_key ) ) {
			$response['status'] = 'error';
			echo wp_json_encode( $response );
			wp_die();
		}
		$dismissed_recommendations = \get_option( self::DISMISSED_RECOMMENDATIONS_STORAGE_KEY, array() );

		if ( ! in_array( $provider_key, $dismissed_recommendations, true ) ) {
			$dismissed_recommendations[] = $provider_key;
			\update_option( self::DISMISSED_RECOMMENDATIONS_STORAGE_KEY, $dismissed_recommendations );
		}

		echo wp_json_encode( $response );
		wp_die();
	}

	/**
	 * Reset dismissed Critical CSS recommendations.
	 */
	public function reset_dismissed_recommendations() {
		if ( check_ajax_referer( self::DISMISS_CSS_RECOMMENDATIONS_NONCE, 'nonce' ) && current_user_can( 'manage_options' ) ) {
			$response = array(
				'status' => 'ok',
			);
		} else {
			$error = new \WP_Error( 'authorization', __( 'You do not have permission to take this action.', 'jetpack-boost' ) );
			wp_send_json_error( $error, 403 );
		}

		self::clear_dismissed_recommendations();

		echo wp_json_encode( $response );
		wp_die();
	}
}
