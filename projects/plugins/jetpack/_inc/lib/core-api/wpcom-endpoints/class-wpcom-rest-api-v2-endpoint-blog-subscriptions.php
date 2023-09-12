<?php
/**
 * REST API endpoint for the Jetpack Blogroll block.
 *
 * @package automattic/jetpack
 * @since 12.2
 */

/**
 * Class WPCOM_REST_API_V2_Endpoint_Blog_Subscriptions
 */
class WPCOM_REST_API_V2_Endpoint_Blog_Subscriptions extends WP_REST_Controller {
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
	public $rest_base = 'blog-subscriptions';

	/**
	 * Is the site a WordPress.com site.
	 *
	 * @var boolean
	 */
	public $is_wpcom = false;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->wpcom_is_wpcom_only_endpoint    = true;
		$this->wpcom_is_site_specific_endpoint = false;

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$this->is_wpcom = true;

			if ( ! class_exists( 'WPCOM_Notification_Blog_Subscription' ) ) {
				\require_lib( 'notification-blog-subscription/notification-blog-subscription' );
			}
		}

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/new',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'handle_new' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'blog_id' => array(
						'type'        => 'number',
						'description' => 'The blog ID to subscribe to.',
						'required'    => true,
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/delete',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'handle_delete' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'blog_id' => array(
						'type'        => 'number',
						'description' => 'The blog ID to unsubscribe from.',
						'required'    => true,
					),
				),
			)
		);
	}

	/**
	 * Create a new notification subscription
	 *
	 * @param  array $params URL params from route.
	 * @return object WP_Error | WP_REST_Response
	 */
	public function handle_new( $params ) {
		if ( $this->is_wpcom ) {
			$subscription = new WPCOM_Notification_Blog_Subscription();
			$result       = $subscription->subscribe( $params['blog_id'] );
			$success      = true;

			if ( is_wp_error( $result ) ) {
				if ( $result->get_error_code() !== 'already_subscribed' ) {
					return $result;
				}

				$success = false;
			}

			return new WP_REST_Response(
				array(
					'success'    => $success,
					'subscribed' => true,
				),
				200
			);
		} else {
			// This nees to be implemented for self-hosted sites using wpcom_json_api_request_as_user
			return 'Not yet implemented!';
		}
	}

	/**
	 * Delete a notification subscription
	 *
	 * @param  array $params URL params from route.
	 * @return object WP_Error | WP_REST_Response
	 */
	public function handle_delete( $params ) {
		if ( $this->is_wpcom ) {
			$subscription = new WPCOM_Notification_Blog_Subscription();
			$result       = $subscription->unsubscribe( $params['blog_id'] );

			if ( is_wp_error( $result ) ) {
				return $result;
			}

			return new WP_REST_Response(
				array(
					'success'    => (bool) $result,
					'subscribed' => false,
				),
				200
			);
		} else {
			// This nees to be implemented for self-hosted sites using wpcom_json_api_request_as_user
			return 'Not yet implemented!';
		}
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Blog_Subscriptions' );
