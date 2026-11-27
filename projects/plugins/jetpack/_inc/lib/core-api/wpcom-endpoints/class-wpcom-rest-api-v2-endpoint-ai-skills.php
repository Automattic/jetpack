<?php
/**
 * REST API endpoint for one AI Hub skill's instructions, which the skill index leaves out.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Feature_Flags\Feature_Flags;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// On WordPress.com the endpoint files load from outside the plugin tree.
require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-jetpack-ai-feature-flags.php';
require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-jetpack-ai-skills-catalog.php';

/**
 * Class WPCOM_REST_API_V2_Endpoint_AI_Skills
 */
class WPCOM_REST_API_V2_Endpoint_AI_Skills extends WP_REST_Controller {
	/**
	 * Namespace prefix.
	 *
	 * @var string
	 */
	public $namespace = 'wpcom/v2';

	/**
	 * Endpoint base route.
	 *
	 * @var string
	 */
	public $rest_base = 'jetpack-ai/skills';

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			// Any slug the catalog has; get_body() refuses one that isn't in the index.
			'/' . $this->rest_base . '/(?P<slug>[^/]+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_skill' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => array(
						'slug' => array(
							'type'     => 'string',
							'required' => true,
						),
					),
				),
			)
		);
	}

	/**
	 * Check permissions.
	 *
	 * @return bool|WP_Error
	 */
	public function permissions_check() {
		// With the Skills tab off the route acts as if it isn't there, so nothing fetches the catalog.
		if ( ! Feature_Flags::is_enabled( Jetpack_AI_Feature_Flags::DISCOVER ) ) {
			return new WP_Error( 'rest_no_route', __( 'No route was found matching the URL and request method.', 'jetpack' ), array( 'status' => 404 ) );
		}
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'You do not have permission to view Jetpack AI skills.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}
		return true;
	}

	/**
	 * Return one skill's instructions.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_skill( $request ) {
		$slug = (string) $request['slug'];
		$body = Jetpack_AI_Skills_Catalog::get_body( $slug );
		if ( is_wp_error( $body ) ) {
			return $body;
		}

		return rest_ensure_response(
			array(
				'slug' => $slug,
				'body' => $body,
			)
		);
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_AI_Skills' );
