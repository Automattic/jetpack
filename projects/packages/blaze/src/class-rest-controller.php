<?php
/**
 * The Blaze Rest Controller class.
 * Registers the REST routes for Blaze Dashboard.
 *
 * @package automattic/jetpack-blaze
 */

namespace Automattic\Jetpack\Blaze;

use Automattic\Jetpack\Blaze;
use Automattic\Jetpack\Blaze\Landing_Page_CPT;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Rest_Authentication;
use Automattic\Jetpack\Status\Host;
use WP_Error;
use WP_REST_Request;
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

		// Landing pages — server-to-server only, signed by WPCOM as blog.
		register_rest_route(
			static::$namespace,
			'landing-pages',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'upsert_landing_page' ),
				'permission_callback' => array( $this, 'can_wpcom_manage_landing_pages' ),
				'args'                => self::landing_page_args(),
			)
		);
		register_rest_route(
			static::$namespace,
			'landing-pages/(?P<slug>[A-Za-z0-9\-_]+)',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'upsert_landing_page' ),
					'permission_callback' => array( $this, 'can_wpcom_manage_landing_pages' ),
					'args'                => self::landing_page_args(),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_landing_page' ),
					'permission_callback' => array( $this, 'can_wpcom_manage_landing_pages' ),
				),
			)
		);
	}

	/**
	 * Argument schema for the landing-page upsert endpoints.
	 *
	 * @return array
	 */
	private static function landing_page_args() {
		return array(
			'html'        => array(
				'type'     => 'string',
				'required' => true,
			),
			'title'       => array(
				'type' => 'string',
			),
			'mode'        => array(
				'type'     => 'string',
				'enum'     => array( 'woocommerce' ),
				'required' => true,
			),
			'product_id'  => array(
				'type'     => 'integer',
				'required' => true,
			),
			'campaign_id' => array(
				'type' => 'integer',
			),
		);
	}

	/**
	 * Permission check for landing-page mutations.
	 *
	 * The merchant site never grants UI access; only requests signed by
	 * WPCOM as the blog (via `wpcom_json_api_request_as_blog`) are allowed.
	 *
	 * @return true|WP_Error
	 */
	public function can_wpcom_manage_landing_pages() {
		if ( Rest_Authentication::is_signed_with_blog_token() ) {
			return true;
		}
		return $this->get_forbidden_error();
	}

	/**
	 * Create or update a landing page.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function upsert_landing_page( WP_REST_Request $request ) {
		$slug_from_url = $request->get_param( 'slug' );
		$args          = array(
			'html'        => (string) $request->get_param( 'html' ),
			'title'       => (string) $request->get_param( 'title' ),
			'mode'        => (string) $request->get_param( 'mode' ),
			'product_id'  => (int) $request->get_param( 'product_id' ),
			'campaign_id' => (int) $request->get_param( 'campaign_id' ),
		);
		if ( ! empty( $slug_from_url ) ) {
			$args['slug'] = (string) $slug_from_url;
		}

		$result = Landing_Page_CPT::upsert( $args );
		if ( is_wp_error( $result ) ) {
			return $result;
		}
		return rest_ensure_response( $result );
	}

	/**
	 * Delete a landing page by slug.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function delete_landing_page( WP_REST_Request $request ) {
		$slug    = (string) $request->get_param( 'slug' );
		$deleted = Landing_Page_CPT::delete_by_slug( $slug );
		if ( ! $deleted ) {
			return new WP_Error(
				'jetpack_blaze_landing_not_found',
				__( 'Landing page not found.', 'jetpack-blaze' ),
				array( 'status' => 404 )
			);
		}
		return rest_ensure_response( array( 'deleted' => true ) );
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
		return (bool) Blaze::is_dashboard_enabled();
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
