<?php
/**
 * Publicize: Social Image Generator Controller
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\REST_API;

use Automattic\Jetpack\Connection\Traits\WPCOM_REST_API_Proxy_Request;
use Automattic\Jetpack\Publicize\Publicize_Utils as Utils;
use Automattic\Jetpack\Publicize\Social_Image_Generator as SIG;
use Automattic\Jetpack\Publicize\Social_Image_Generator\Templates;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Publicize: Social Image Generator Controller class.
 *
 * @phan-constructor-used-for-side-effects
 */
class Social_Image_Generator_Controller extends Base_Controller {

	use WPCOM_REST_API_Proxy_Request;

	/**
	 * The constructor sets the route namespace, rest_base, and registers our API route and endpoint.
	 */
	public function __construct() {
		parent::__construct();

		$this->base_api_path = 'wpcom';
		$this->version       = 'v2';

		$this->namespace = "{$this->base_api_path}/{$this->version}";
		$this->rest_base = 'publicize/social-image-generator';

		$this->allow_requests_as_blog = true;

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/generate-token',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'generate_preview_token' ),
				'permission_callback' => array( $this, 'permissions_check' ),
				'args'                => array(
					'text'      => array(
						'description' => __( 'The text to be used to generate the image.', 'jetpack-publicize-pkg' ),
						'type'        => 'string',
						'required'    => true,
					),
					'image_url' => array(
						'description' => __( 'The URL of the background image to use when generating the social image.', 'jetpack-publicize-pkg' ),
						'oneOf'       => array(
							array(
								'type' => 'string',
							),
							array(
								'type' => 'null',
							),
						),
					),
					'template'  => array(
						'description' => __( 'The template slug.', 'jetpack-publicize-pkg' ),
						'type'        => 'string',
						'enum'        => Templates::TEMPLATES,
					),
				),
				'schema'              => array(
					'$schema' => 'http://json-schema.org/draft-04/schema#',
					'title'   => 'publicize-sig-generate-token',
					'type'    => 'string',
				),
			)
		);
	}

	/**
	 * Ensure the user has proper permissions.
	 *
	 * @return boolean|WP_Error True if the user has permissions, WP_Error otherwise.
	 */
	public function permissions_check() {
		$permissions = $this->publicize_permissions_check();

		if ( is_wp_error( $permissions ) ) {
			return $permissions;
		}

		// On WPCOM, need to check for the feature.
		if ( Utils::is_wpcom() ) {
			require_lib( 'publicize/util/social-image-generator' );

			return \Publicize\Social_Image_Generator\is_enabled();
		}

		return true;
	}

	/**
	 * Passes the request parameters to the WPCOM endpoint to generate a preview image token.
	 *
	 * @param WP_REST_Request $request The request object, which includes the parameters.
	 * @return WP_REST_Response The response.
	 */
	public function generate_preview_token( $request ) {
		return rest_ensure_response(
			SIG\fetch_token(
				$request->get_param( 'text' ),
				$request->get_param( 'image_url' ),
				$request->get_param( 'template' )
			)
		);
	}
}
