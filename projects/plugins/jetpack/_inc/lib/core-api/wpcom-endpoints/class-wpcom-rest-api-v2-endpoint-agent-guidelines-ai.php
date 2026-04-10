<?php
/**
 * REST API proxy endpoint for AI-powered content guidelines suggestions.
 *
 * Proxies requests to the wpcom endpoint that generates guidelines
 * using site content analysis.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Client;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class WPCOM_REST_API_V2_Endpoint_Agent_Guidelines_AI
 */
class WPCOM_REST_API_V2_Endpoint_Agent_Guidelines_AI extends WP_REST_Controller {
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
	public $rest_base = 'jetpack-ai/suggest-guidelines';

	/**
	 * Valid guideline sections.
	 */
	private const VALID_SECTIONS = array( 'site', 'copy', 'images', 'additional' );

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->is_wpcom                     = true;
		$this->wpcom_is_wpcom_only_endpoint = true;

		if ( ! class_exists( 'Jetpack_AI_Helper' ) ) {
			require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-jetpack-ai-helper.php';
		}

		if ( ! \Jetpack_AI_Helper::is_enabled() ) {
			return;
		}

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'suggest_guidelines' ),
					'permission_callback' => array( $this, 'permission_callback' ),
				),
				'args' => array(
					'sections'         => array(
						'type'     => 'array',
						'required' => true,
						'items'    => array(
							'type' => 'string',
							'enum' => self::VALID_SECTIONS,
						),
					),
					'existing_content' => array(
						'type'     => 'object',
						'required' => false,
						'default'  => array(),
					),
					'filters'          => array(
						'description' => __( 'Optional content filters to narrow the analyzed content.', 'jetpack' ),
						'type'        => 'object',
						'required'    => false,
						'default'     => array(),
						'properties'  => array(
							'authors'    => array(
								'description' => __( 'Limit to posts by these author IDs.', 'jetpack' ),
								'type'        => 'array',
								'items'       => array( 'type' => 'integer' ),
							),
							'categories' => array(
								'description' => __( 'Limit to posts in these category IDs.', 'jetpack' ),
								'type'        => 'array',
								'items'       => array( 'type' => 'integer' ),
							),
						),
					),
				),
			)
		);
	}

	/**
	 * Permission check — require manage_options.
	 *
	 * @return bool
	 */
	public function permission_callback() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Proxy the suggest-guidelines request to wpcom.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return mixed|WP_Error
	 */
	public function suggest_guidelines( $request ) {
		$blog_id = \Jetpack_Options::get_option( 'id' );

		$body = array(
			'sections' => $request->get_param( 'sections' ),
		);

		$existing_content = $request->get_param( 'existing_content' );
		if ( ! empty( $existing_content ) ) {
			$body['existing_content'] = $existing_content;
		}

		$filters = $request->get_param( 'filters' );
		if ( ! empty( $filters ) ) {
			$body['filters'] = $filters;
		}

		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/jetpack-ai/suggest-guidelines', $blog_id ) . '?force=wpcom',
			2,
			array(
				'method'  => 'POST',
				'headers' => array( 'content-type' => 'application/json' ),
				'timeout' => 90,
			),
			wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		$body_str    = wp_remote_retrieve_body( $response );
		$data        = json_decode( $body_str, true );

		if ( $status_code !== 200 ) {
			$message = isset( $data['message'] ) ? $data['message'] : __( 'Failed to generate guidelines.', 'jetpack' );
			$code    = isset( $data['code'] ) ? $data['code'] : 'upstream_error';
			return new WP_Error( $code, $message, array( 'status' => $status_code ) );
		}

		return $data;
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Agent_Guidelines_AI' );
