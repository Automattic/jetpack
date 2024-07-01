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
 * Class WPCOM_REST_API_V2_Endpoint_Following
 */
class WPCOM_REST_API_V2_Endpoint_Newsletter_Categories_List extends WP_REST_Controller {
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
		$this->rest_base                       = '/newsletter-categories';
		$this->wpcom_is_wpcom_only_endpoint    = true;
		$this->wpcom_is_site_specific_endpoint = true;

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
				'get_newsletter_categories',
			) : array( $this, 'proxy_request_to_wpcom_as_user' ),
			'permission_callback' => function () {
				return current_user_can( 'manage_options' );
			},
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base,
			$options
		);
	}

	/**
	 * Gets the site's newsletter categories
	 *
	 * @return array|WP_Error list of newsletter categories
	 */
	public function get_newsletter_categories() {
		require_lib( 'newsletter-categories' );

		$newsletter_categories = \Newsletter_Categories\get_newsletter_categories();

		// Include subscription counts for each category if the user can manage categories.
		if ( $this->can_manage_categories() === true ) {
			$subscription_counts_per_category = \Newsletter_Categories\get_blog_subscription_counts_per_category();
			array_walk(
				$newsletter_categories,
				function ( &$category ) use ( $subscription_counts_per_category ) {
					$category['subscription_count'] = $subscription_counts_per_category[ $category['id'] ] ? $subscription_counts_per_category[ $category['id'] ] : 0;
				}
			);
		}

		return rest_ensure_response(
			array(
				'enabled'               => (bool) get_option( 'wpcom_newsletter_categories_enabled', false ),
				'newsletter_categories' => $newsletter_categories,
			)
		);
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Newsletter_Categories_List' );
