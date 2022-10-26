<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Get subscriber count from Jetpack's Subscriptions module.
 *
 * @package automattic/jetpack
 */
use Automattic\Jetpack\Constants;

/**
 * Subscribers: Get subscriber count
 *
 * @since 6.9
 */
class WPCOM_REST_API_V2_Endpoint_Subscribers extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'subscribers';
		// This endpoint *does not* need to connect directly to Jetpack sites.
		$this->wpcom_is_wpcom_only_endpoint = true;
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register API routes.
	 */
	public function register_routes() {
		// GET /sites/<blog_id>/subscribers/count - Return number of subscribers for this site.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/count',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_subscriber_count' ),
					'permission_callback' => array( $this, 'readable_permission_check' ),
				),
			)
		);
	}

	/**
	 * Permission check. Only authors can access this endpoint.
	 */
	public function readable_permission_check() {
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
		$include_publicize_subscribers = isset( $request['include_publicize_subscribers'] ) ? rest_sanitize_boolean( $request['include_publicize_subscribers'] ) : true;
		$split_subs_and_followers      = isset( $request['split_subs_and_followers'] ) ? rest_sanitize_boolean( $request['split_subs_and_followers'] ) : false;
		$subscriber_info               = Jetpack_Subscriptions_Widget::fetch_subscriber_count( $include_publicize_subscribers, $split_subs_and_followers );
		$subscriber_count              = $subscriber_info['value'];

		return array(
			'count' => $subscriber_count,
		);
	}
}

if (
	Jetpack::is_module_active( 'subscriptions' ) ||
	( Constants::is_defined( 'TESTING_IN_JETPACK' ) && Constants::get_constant( 'TESTING_IN_JETPACK' ) )
) {
	wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Subscribers' );
}
