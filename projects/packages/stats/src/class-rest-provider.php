<?php
/**
 * The Stats REST Provider class.
 *
 * @package @automattic/jetpack-stats
 */

namespace Automattic\Jetpack\Stats;

use Automattic\Jetpack\Connection\Rest_Authentication;
use Automattic\Jetpack\Connection\REST_Connector;
use WP_Error;
use WP_REST_Server;

/**
 * The REST API provider class.
 *
 * @since 0.12.0
 */
class REST_Provider {
	/**
	 * Singleton instance.
	 *
	 * @var REST_Provider
	 **/
	private static $instance = null;

	/**
	 * Private constructor.
	 *
	 * Use the static::init() method to get an instance.
	 */
	private function __construct() {
		add_action( 'rest_api_init', array( $this, 'initialize_rest_api' ) );
	}

	/**
	 * Initialize class and get back a singleton instance.
	 *
	 * @param bool $new_instance Force create new instance.
	 *
	 * @return static
	 */
	public static function init( $new_instance = false ) {
		if ( null === self::$instance || $new_instance ) {
			self::$instance = new static();
		}

		return self::$instance;
	}

	/**
	 * Initialize the REST API.
	 *
	 * @return void
	 */
	public function initialize_rest_api() {
		register_rest_route(
			'jetpack/v4',
			'/stats/blog',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_blog' ),
				'permission_callback' => array( $this, 'get_blog_permission_check' ),
			)
		);
	}

	/**
	 * Get the stats blog data.
	 *
	 * @since 0.12.0
	 *
	 * @return array
	 */
	public function get_blog() {
		return XMLRPC_Provider::init()->get_blog();
	}

	/**
	 * Check permissions for the `/stats/blog` endpoint.
	 *
	 * @return WP_Error|true
	 */
	public function get_blog_permission_check() {
		return Rest_Authentication::is_signed_with_blog_token()
			? true
			: new WP_Error( 'invalid_permission_stats_get_blog', REST_Connector::get_user_permissions_error_msg(), array( 'status' => rest_authorization_required_code() ) );
	}
}
