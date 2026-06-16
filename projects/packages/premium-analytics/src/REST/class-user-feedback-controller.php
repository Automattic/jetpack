<?php
/**
 * REST controller for the Stats user-feedback submission.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\REST;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager;
use Jetpack_Options;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Accepts the Stats dashboard's "send feedback" POST, stamps the current user's email onto the
 * body, and forwards it to WordPress.com.
 *
 * This is deliberately separate from {@see Api_Proxy_Controller}: that controller is a transparent
 * WordPress.com pass-through, whereas this endpoint rewrites the request body before forwarding, so
 * it does not belong on the proxy. It is a single uncached POST, so it carries its own small forward
 * rather than the proxy's cache-aware transport.
 */
class User_Feedback_Controller extends WP_REST_Controller {

	/**
	 * Package slug, used as the connection plugin slug and the namespace root.
	 *
	 * @var string
	 */
	private const SLUG = 'jetpack-premium-analytics';

	/**
	 * Timeout for the outbound WordPress.com request, in seconds.
	 *
	 * @var int
	 */
	private const API_TIMEOUT = 20;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = self::SLUG . '/v1';
	}

	/**
	 * Hook the controller's routes onto rest_api_init.
	 *
	 * @return void
	 */
	public static function register(): void {
		$controller = new self();
		add_action( 'rest_api_init', array( $controller, 'register_routes' ) );
	}

	/**
	 * Register the user-feedback route.
	 *
	 * @return void
	 */
	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/jetpack-stats/user-feedback',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'submit_feedback' ),
				'permission_callback' => array( $this, 'check_permission' ),
			)
		);
	}

	/**
	 * Gate the endpoint to users who can view stats, with `manage_options` always accepted —
	 * matching the originating `stats-admin` permission check.
	 *
	 * @return bool
	 */
	public function check_permission(): bool {
		return current_user_can( 'manage_options' ) || current_user_can( 'view_stats' );
	}

	/**
	 * Inject the current user's email into the body and forward the submission to WordPress.com.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function submit_feedback( WP_REST_Request $request ) {
		if ( ! ( new Manager( self::SLUG ) )->is_connected() ) {
			return new WP_Error(
				'no_connection',
				__( 'Please connect Jetpack to load your data.', 'jetpack-premium-analytics' ),
				array( 'status' => 403 )
			);
		}

		try {
			$response = Client::wpcom_json_api_request_as_blog(
				sprintf( '/sites/%d/jetpack-stats/user-feedback', (int) Jetpack_Options::get_option( 'id' ) ),
				'2',
				array(
					'method'  => 'POST',
					'timeout' => self::API_TIMEOUT,
					'headers' => array( 'Content-Type' => 'application/json' ),
				),
				wp_json_encode( $this->augment_body( $request ), JSON_UNESCAPED_SLASHES ),
				'wpcom'
			);
		} catch ( \Exception $e ) {
			return new WP_Error(
				'api_error',
				__( 'Error processing the request.', 'jetpack-premium-analytics' ),
				array( 'status' => 500 )
			);
		}

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'api_error',
				__( 'Error communicating with the data service.', 'jetpack-premium-analytics' ),
				array( 'status' => 500 )
			);
		}

		return new WP_REST_Response(
			json_decode( wp_remote_retrieve_body( $response ), false ),
			(int) wp_remote_retrieve_response_code( $response )
		);
	}

	/**
	 * Merge the current user's email onto the submitted feedback body. The email is always set last,
	 * so a client-supplied `user_email` can never spoof it.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return array<string, mixed>
	 */
	private function augment_body( WP_REST_Request $request ): array {
		$body               = (array) json_decode( (string) $request->get_body(), true );
		$body['user_email'] = wp_get_current_user()->user_email;

		return $body;
	}
}
