<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Get subscriber count from Jetpack's Subscriptions module.
 *
 * @package automattic/jetpack
 */
use Automattic\Jetpack\Connection\Traits\WPCOM_REST_API_Proxy_Request;
use Automattic\Jetpack\Constants;

/**
 * Subscribers: Get subscriber count
 *
 * @since 6.9
 */
class WPCOM_REST_API_V2_Endpoint_Subscribers extends WP_REST_Controller {
	use WPCOM_REST_API_Proxy_Request;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->rest_base = '/subscribers';

		$this->base_api_path                   = 'wpcom';
		$this->version                         = 'v2';
		$this->namespace                       = $this->base_api_path . '/' . $this->version;
		$this->wpcom_is_wpcom_only_endpoint    = true;
		$this->wpcom_is_site_specific_endpoint = true;
		// This endpoint *does not* need to connect directly to Jetpack sites.
		$this->wpcom_is_wpcom_only_endpoint = true;
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register API routes.
	 */
	public function register_routes() {

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'proxy_request_to_wpcom_as_blog' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
			)
		);
		// GET /sites/<blog_id>/subscribers/count - Return number of subscribers for this site.
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/count',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_subscriber_count' ),
					'permission_callback' => array( $this, 'readable_permission_check' ),
				),
			)
		);
		// GET /sites/<blog_id>/subscriber/counts - Return splitted number of subscribers for this site
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/counts',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_subscriber_counts' ),
					'permission_callback' => array( $this, 'readable_permission_check' ),
				),
			)
		);
	}

	/**
	 * Permission check. Only authors can access this endpoint.
	 */
	public function readable_permission_check() {
		// @phan-suppress-next-line PhanDeprecatedFunction -- @todo Switch to current_user_can_for_site when we drop support for WP 6.6.
		if ( ! current_user_can_for_blog( get_current_blog_id(), 'edit_posts' ) ) {
			return new WP_Error( 'authorization_required', 'Only users with the permission to edit posts can see the subscriber count.', array( 'status' => 401 ) );
		}

		return true;
	}

	/**
	 * Retrieves subscriber count
	 *
	 * @param WP_REST_Request $request incoming API request info.
	 * @return array data object containing subscriber count
	 */
	public function get_subscriber_count( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// Get the most up to date subscriber count when request is not a test.
		if ( ! Constants::is_defined( 'TESTING_IN_JETPACK' ) ) {
			delete_transient( 'wpcom_subscribers_total' );
			delete_transient( 'wpcom_subscribers_total_no_publicize' );
		}
		$subscriber_count = Jetpack_Subscriptions_Widget::fetch_subscriber_count();

		return array(
			'count' => $subscriber_count,
		);
	}

	/**
	 * Retrieves splitted subscriber counts
	 *
	 * @return array data object containing subscriber counts ['email_subscribers' => 0, 'social_followers' => 0]
	 */
	public function get_subscriber_counts() {
		if ( ! Constants::is_defined( 'TESTING_IN_JETPACK' ) ) {
			delete_transient( 'wpcom_subscribers_totals' );
		}

		$subscriber_info   = Automattic\Jetpack\Extensions\Subscriptions\fetch_subscriber_counts();
		$subscriber_counts = $subscriber_info['value'];

		return array( 'counts' => $subscriber_counts );
	}

	public function permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}
}

if (
	Jetpack::is_module_active( 'subscriptions' ) ||
	( Constants::is_defined( 'TESTING_IN_JETPACK' ) && Constants::get_constant( 'TESTING_IN_JETPACK' ) )
) {
	wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Subscribers' );
}
