<?php
/**
 * Publicize: Companion Plugins Controller
 *
 * @package automattic/jetpack-publicize
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Publicize\REST_API;

use Automattic\Jetpack\Publicize\Companion_Plugins;
use WP_REST_Request;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Publicize: Companion Plugins Controller class.
 *
 * @phan-constructor-used-for-side-effects
 */
class Companion_Plugins_Controller extends Base_Controller {

	/**
	 * The constructor sets the route namespace, rest_base, and registers our API route and endpoint.
	 */
	public function __construct() {
		parent::__construct();

		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'publicize/companion-plugins';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<slug>[a-z0-9-]+)/dismiss',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'dismiss' ),
				'permission_callback' => array( $this, 'permissions_check' ),
				'args'                => array(
					'slug' => array(
						'type'     => 'string',
						'enum'     => array_keys( Companion_Plugins::PLUGINS ),
						'required' => true,
					),
				),
			)
		);
	}

	/**
	 * Permission check.
	 *
	 * @return true|\WP_Error
	 */
	public function permissions_check() {
		return $this->publicize_permissions_check();
	}

	/**
	 * Dismiss a plugin's notice for the current user.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return \WP_REST_Response
	 */
	public function dismiss( $request ) {
		Companion_Plugins::dismiss( (string) $request->get_param( 'slug' ) );

		return rest_ensure_response( array( 'dismissed' => Companion_Plugins::get_dismissed() ) );
	}
}
