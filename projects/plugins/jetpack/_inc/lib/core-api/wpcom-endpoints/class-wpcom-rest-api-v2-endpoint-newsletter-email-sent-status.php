<?php
/**
 * REST API endpoint for post-level newsletter email-sent state.
 *
 * On Jetpack sites, registers the route and proxies requests to WordPress.com.
 * On WordPress.com Simple sites (when required via jetpack-endpoints), handles
 * the request locally by reading WPCom-only post meta.
 *
 * GET /wpcom/v2/newsletter-email-sent-status?post_id=<id>
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Traits\WPCOM_REST_API_Proxy_Request;
use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class WPCOM_REST_API_V2_Endpoint_Newsletter_Email_Sent_Status
 */
class WPCOM_REST_API_V2_Endpoint_Newsletter_Email_Sent_Status extends WP_REST_Controller {
	use WPCOM_REST_API_Proxy_Request;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->wpcom_is_wpcom_only_endpoint    = true;
		$this->wpcom_is_site_specific_endpoint = true;
		$this->base_api_path                   = 'wpcom';
		$this->version                         = 'v2';
		$this->namespace                       = $this->base_api_path . '/' . $this->version;
		$this->rest_base                       = 'newsletter-email-sent-status';

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
				'show_in_index'       => true,
				'methods'             => 'GET',
				'callback'            => ( ( new Host() )->is_wpcom_simple() ) ? array( $this, 'get_email_sent_status' ) : array( $this, 'proxy_request_to_wpcom_as_user' ),
				'permission_callback' => array( $this, 'permission_check' ),
				'args'                => array(
					'post_id' => array(
						'required'          => true,
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
						'validate_callback' => function ( $param ) {
							return $param > 0;
						},
					),
				),
			)
		);
	}

	/**
	 * Get email-sent state for a post (WPCom-only meta).
	 *
	 * @param WP_REST_Request $request Request object with post_id.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_email_sent_status( $request ) {
		$post_id = $request->get_param( 'post_id' );

		$post = get_post( $post_id );
		if ( ! $post instanceof \WP_Post || 'post' !== $post->post_type ) {
			return new WP_Error(
				'post_not_found',
				__( 'Post not found.', 'jetpack' ),
				array( 'status' => 404 )
			);
		}

		$email_notification = get_post_meta( $post_id, 'email_notification', true );
		$email_sent_at      = null;
		if ( ! empty( $email_notification ) && is_numeric( $email_notification ) ) {
			$unix_ts       = (int) $email_notification;
			$email_sent_at = wp_date( get_option( 'date_format' ), $unix_ts );
		}

		$stats_meta    = get_post_meta( $post_id, '_wpcom_newsletter_stats_on_email_send', true );
		$stats_on_send = null;
		if ( ! empty( $stats_meta ) && is_array( $stats_meta ) && isset( $stats_meta[0] ) ) {
			$first = $stats_meta[0];
			$ts    = $first['timestamp'] ?? null;
			if ( ! empty( $ts ) ) {
				$unix_ts = strtotime( $ts );
				$ts      = ( false !== $unix_ts ) ? wp_date( get_option( 'date_format' ), $unix_ts ) : null;
			} else {
				$ts = null;
			}

			$access_level_raw = $first['access_level'] ?? null;
			$access_level     = $access_level_raw;
			$paid_tier        = null;
			if ( is_string( $access_level_raw ) && preg_match( '/^paid_subscribers:\s*(.+)$/', $access_level_raw, $m ) ) {
				$access_level = 'paid_subscribers';
				$paid_tier    = trim( $m[1] );
			}

			$stats_on_send = array(
				'access_level'              => $access_level,
				'paid_tier'                 => $paid_tier,
				'post_categories'           => isset( $first['post_categories'] ) && is_array( $first['post_categories'] ) ? $first['post_categories'] : array(),
				'has_newsletter_categories' => ! empty( $first['has_newsletter_categories'] ),
				'has_paywall_block'         => isset( $first['has_paywall_block'] ) ? (bool) $first['has_paywall_block'] : null,
				'timestamp'                 => $ts,
			);
		}

		return rest_ensure_response(
			array(
				'email_sent_at' => $email_sent_at,
				'stats_on_send' => $stats_on_send,
			)
		);
	}

	/**
	 * Permission check for the endpoint.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error
	 */
	public function permission_check( $request ) {
		if ( ! current_user_can( 'manage_options' ) && ! current_user_can( 'view_stats' ) && ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to access this endpoint.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		// post_id is validated as > 0 by the route definition; this check is defensive.
		$post_id = absint( $request->get_param( 'post_id' ) );
		if ( $post_id > 0 && ! current_user_can( 'manage_options' ) && ! current_user_can( 'edit_post', $post_id ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to access this endpoint.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Newsletter_Email_Sent_Status' );
