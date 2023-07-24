<?php
/**
 * The Blaze Rest Controller class.
 * Registers the REST routes for Blaze Dashboard.
 *
 * @package automattic/jetpack-blaze
 */

namespace Automattic\Jetpack\Blaze;

use Automattic\Jetpack\Blaze;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status\Host;
use WP_Error;
use WP_REST_Server;

/**
 * Registers general REST routes for Blaze.
 */
class REST_Controller {
	/**
	 * Namespace for the REST API.
	 *
	 * @var string
	 */
	public static $namespace = 'jetpack/v4/blaze';

	/**
	 * Registers the REST routes.
	 *
	 * @access public
	 * @static
	 */
	public function register_rest_routes() {
		$site_id = $this->get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return;
		}

		register_rest_route(
			static::$namespace,
			'eligibility',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'blaze_eligibility' ),
				'permission_callback' => array( $this, 'can_user_view_blaze_settings' ),
			)
		);

		register_rest_route(
			static::$namespace,
			'dashboard',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'is_dashboard_enabled' ),
				'permission_callback' => array( $this, 'can_user_view_blaze_settings' ),
			)
		);
	}

	/**
	 * Only administrators can access the API.
	 *
	 * @return bool|WP_Error True if a blog token was used to sign the request, WP_Error otherwise.
	 */
	public function can_user_view_blaze_settings() {
		if (
			$this->is_user_connected()
			&& current_user_can( 'manage_options' )
		) {
			return true;
		}

		return $this->get_forbidden_error();
	}

	/**
	 * Get the eligibility for Blaze.
	 *
	 * @return bool
	 */
	public function blaze_eligibility() {
		$site_id = $this->get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return false;
		}

		return (bool) Blaze::site_supports_blaze( $site_id );
	}

	/**
	 * Check if the dashboard is enabled.
	 *
	 * @return bool
	 */
	public function is_dashboard_enabled() {
		$site_id = $this->get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return false;
		}

		return (bool) Blaze::is_dashboard_enabled( $site_id );
	}

	/**
	 * Check if the current user is connected.
	 * On WordPress.com Simple, it is always connected.
	 *
	 * @return true
	 */
	private function is_user_connected() {
		if ( ( new Host() )->is_wpcom_simple() ) {
			return true;
		}

		$connection = new Connection_Manager();
		return $connection->is_connected() && $connection->is_user_connected();
	}

	/**
	 * Return a WP_Error object with a forbidden error.
	 */
	protected function get_forbidden_error() {
		$error_msg = esc_html__(
			'You are not allowed to perform this action.',
			'jetpack-blaze'
		);

		return new WP_Error( 'rest_forbidden', $error_msg, array( 'status' => rest_authorization_required_code() ) );
	}

	/**
	 * Get the site ID.
	 *
	 * @return int|WP_Error
	 */
	private function get_site_id() {
		return Connection_Manager::get_site_id();
	}
}
