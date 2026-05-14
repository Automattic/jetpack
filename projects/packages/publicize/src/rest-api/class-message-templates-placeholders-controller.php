<?php
/**
 * Publicize: Message Templates Placeholders Controller
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\REST_API;

use Automattic\Jetpack\Publicize\Message_Templates_Placeholders;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Publicize: Message Templates Placeholders Controller class.
 *
 * @phan-constructor-used-for-side-effects
 */
class Message_Templates_Placeholders_Controller extends Base_Controller {

	/**
	 * The constructor sets the route namespace, rest_base, and registers our API route and endpoint.
	 */
	public function __construct() {
		parent::__construct();

		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'publicize/message-templates/placeholders';

		$this->allow_requests_as_blog = true;

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				'methods'                        => WP_REST_Server::READABLE,
				'callback'                       => array( $this, 'get_placeholders' ),
				'permission_callback'            => array( $this, 'permissions_check' ),
				'private_site_security_settings' => array(
					'allow_blog_token_access' => true,
				),
				'schema'                         => array(
					'$schema' => 'http://json-schema.org/draft-04/schema#',
					'title'   => 'publicize-message-templates-placeholders',
					'type'    => 'array',
					'items'   => array(
						'type'       => 'object',
						'properties' => array(
							'id'    => array(
								'type'        => 'string',
								'description' => __( 'The placeholder token (e.g. {title}).', 'jetpack-publicize-pkg' ),
							),
							'label' => array(
								'type'        => 'string',
								'description' => __( 'Human-readable description of the placeholder.', 'jetpack-publicize-pkg' ),
							),
						),
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
	 * Return the placeholder catalogue.
	 *
	 * @return \WP_REST_Response
	 */
	public function get_placeholders() {
		return rest_ensure_response( Message_Templates_Placeholders::get_all() );
	}
}
