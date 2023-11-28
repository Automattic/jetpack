<?php
/**
 * REST API endpoint for the Newsletter Categories
 *
 * @package automattic/jetpack
 * @since 12.6
 */

use Automattic\Jetpack\Status\Host;

require_once __DIR__ . '/trait-wpcom-rest-api-proxy-request-trait.php';

/**
 * Class WPCOM_REST_API_V2_Endpoint_Newsletter_Categories_Subscriptions_Count
 */
class WPCOM_REST_API_V2_Endpoint_Newsletter_Categories_Subscriptions_Count extends WP_REST_Controller {
	use WPCOM_REST_API_Proxy_Request_Trait;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->wpcom_is_wpcom_only_endpoint    = true;
		$this->wpcom_is_site_specific_endpoint = true;
		$this->base_api_path                   = 'wpcom';
		$this->version                         = 'v2';
		$this->namespace                       = $this->base_api_path . '/' . $this->version;
		$this->rest_base                       = '/newsletter-categories/count';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register routes.
	 */
	public function register_routes() {
		$options = array(
			'show_in_index'       => true,
			'methods'             => 'GET',
			// if this is not a wpcom site, we need to proxy the request to wpcom
			'callback'            => ( ( new Host() )->is_wpcom_simple() ) ? array(
				$this,
				'get_newsletter_categories_subscriptions_count',
			) : array( $this, 'proxy_request_to_wpcom_as_user' ),
			'permission_callback' => function () {
				return current_user_can( 'manage_options' );
			},
			'args'                => array(
				'term_ids' => array(
					'required'          => false,
					'validate_callback' => function ( $param ) {
						return empty( $param ) || ( is_string( $param ) && preg_match( '/^(\d+,)*\d+$/', $param ) );
					},
					'default'           => '',
				),
			),
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base,
			$options
		);
	}

	/**
	 * Get the subscriptions count for the given categories.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_newsletter_categories_subscriptions_count( WP_REST_Request $request ) {
		require_lib( 'newsletter-categories' );

		$blog_id  = get_current_blog_id();
		$term_ids = explode( ',', $request->get_param( 'term_ids' ) );

		$subscriptions_count = get_blog_subscriptions_aggregate_count( $blog_id, $term_ids );

		return rest_ensure_response(
			array(
				'subscriptions_count' => $subscriptions_count,
			)
		);
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Newsletter_Categories_Subscriptions_Count' );
