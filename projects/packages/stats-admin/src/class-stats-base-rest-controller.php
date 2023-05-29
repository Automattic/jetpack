<?php
/**
 * A class that holds common functions for stats controllers.
 *
 * @package automattic/jetpack-stats-admin
 */

namespace Automattic\Jetpack\Stats_Admin;

use WP_Error;

/**
 * Base class for Stats REST API controllers.
 *
 * @package Automattic\Jetpack\Stats_Admin
 */
class Stats_Base_REST_Controller {

	/**
	 * Only administrators or users with capability `view_stats` can access the API.
	 *
	 * @return bool|WP_Error True if a blog token was used to sign the request, WP_Error otherwise.
	 */
	public function can_user_view_general_stats_callback() {
		if ( current_user_can( 'manage_options' ) || current_user_can( 'view_stats' ) ) {
			return true;
		}

		return $this->get_forbidden_error();
	}

	/**
	 * Only administrators or users with capability `activate_wordads` can access the API.
	 */
	public function can_user_view_wordads_stats_callback() {
		// phpcs:ignore WordPress.WP.Capabilities.Unknown
		if ( current_user_can( 'manage_options' ) || current_user_can( 'activate_wordads' ) ) {
			return true;
		}

		return $this->get_forbidden_error();
	}

	/**
	 * Return a WP_Error object with a forbidden error.
	 */
	protected function get_forbidden_error() {
		$error_msg = esc_html__(
			'You are not allowed to perform this action.',
			'jetpack-stats-admin'
		);

		return new WP_Error( 'rest_forbidden', $error_msg, array( 'status' => rest_authorization_required_code() ) );
	}
}
