<?php
/**
 * Newsletter subscriber stats REST proxy.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter;

use Automattic\Jetpack\Connection\Client;
use WP_Error;
use WP_Query;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Proxies subscriber and email-summary requests to WordPress.com Stats.
 */
class Subscriber_Stats_Controller extends WP_REST_Controller {

	/**
	 * WordPress.com Stats REST API version proxied by this controller.
	 *
	 * @var string
	 */
	const STATS_API_VERSION = '1.1';

	/**
	 * Whether the route registration hook has been added.
	 *
	 * @var bool
	 */
	private static $registered = false;

	/**
	 * Register the controller once across the admin and REST boot paths.
	 *
	 * @return void
	 */
	public static function register() {
		if ( self::$registered ) {
			return;
		}

		self::$registered = true;
		add_action( 'rest_api_init', array( new self(), 'register_routes' ) );
	}

	/**
	 * Set up the local REST namespace.
	 */
	public function __construct() {
		$this->namespace = 'jetpack/v4/newsletter';
		$this->rest_base = 'stats';
	}

	/**
	 * Register the Newsletter stats proxy routes.
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/subscribers',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_subscribers' ),
				'permission_callback' => array( $this, 'can_view' ),
				'args'                => array(
					'unit'        => array(
						'type'    => 'string',
						'enum'    => array( 'day', 'week', 'month', 'year' ),
						'default' => 'day',
					),
					'quantity'    => array(
						'type'    => 'integer',
						'minimum' => 1,
						'maximum' => 365,
						'default' => 30,
					),
					'date'        => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'stat_fields' => array(
						'type'    => 'string',
						'enum'    => array( 'subscribers', 'subscribers,subscribers_paid' ),
						'default' => 'subscribers,subscribers_paid',
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/emails/summary',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_email_summary' ),
				'permission_callback' => array( $this, 'can_view' ),
				'args'                => array(
					'period'     => array(
						'type'    => 'string',
						'enum'    => array( 'alltime' ),
						'default' => 'alltime',
					),
					'quantity'   => array(
						'type'    => 'integer',
						'minimum' => 1,
						'maximum' => 30,
						'default' => 30,
					),
					'sort_field' => array(
						'type'    => 'string',
						'enum'    => array( 'opens', 'clicks', 'post_id', 'post_date' ),
						'default' => 'post_date',
					),
					'sort_order' => array(
						'type'    => 'string',
						'enum'    => array( 'asc', 'desc' ),
						'default' => 'desc',
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/recent-posts',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_recent_posts' ),
				'permission_callback' => array( $this, 'can_view' ),
			)
		);
	}

	/**
	 * Request Stats from a host override or WordPress.com's Stats REST API.
	 *
	 * @param WP_REST_Request $request  Local REST request.
	 * @param string          $endpoint Relative Stats endpoint.
	 * @return mixed
	 */
	private function request_stats( $request, $endpoint ) {
		/**
		 * Allows a host to provide Newsletter Stats without calling WordPress.com directly.
		 *
		 * Not required for WordPress.com Simple sites: `proxy_stats_to_wpcom()` already resolves
		 * there without a Jetpack connection. Kept as an optional override/testing seam.
		 *
		 * @since $$next-version$$
		 *
		 * @param mixed|null $response   Host response, or null to use the default proxy.
		 * @param string     $endpoint   Relative Stats endpoint.
		 * @param array      $query_args Validated request query arguments.
		 */
		$response = apply_filters(
			'jetpack_newsletter_stats_pre_request',
			null,
			$endpoint,
			$request->get_query_params()
		);

		return $response ?? $this->proxy_stats_to_wpcom( $request, $endpoint );
	}

	/**
	 * Call WordPress.com's Stats REST API directly, mirroring `WPCOM_Stats::fetch_remote_stats()`.
	 *
	 * `Client::wpcom_json_api_request_as_blog()` already resolves in-process on WordPress.com
	 * Simple sites (see its `IS_WPCOM` branch), so gating on `Manager::is_connected()` -- as the
	 * generic `WPCOM_REST_API_Proxy_Request` trait does -- would block a case that needs no block.
	 *
	 * @param WP_REST_Request $request  Local REST request.
	 * @param string          $endpoint Relative Stats endpoint.
	 * @return mixed|WP_Error
	 */
	private function proxy_stats_to_wpcom( $request, $endpoint ) {
		$query_params = $request->get_query_params();
		unset( $query_params['rest_route'] );

		$path = add_query_arg(
			$query_params,
			sprintf( '/sites/%d/%s/%s', (int) \Jetpack_Options::get_option( 'id' ), $this->rest_base, ltrim( $endpoint, '/' ) )
		);

		$response = Client::wpcom_json_api_request_as_blog( $path, self::STATS_API_VERSION );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status = wp_remote_retrieve_response_code( $response );
		$body   = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $status >= 400 ) {
			return new WP_Error(
				$body['code'] ?? 'unknown_error',
				$body['message'] ?? __( 'An unknown error occurred.', 'jetpack-newsletter' ),
				array( 'status' => $status )
			);
		}

		return $body;
	}

	/**
	 * Return subscriber time-series data from WordPress.com.
	 *
	 * @param WP_REST_Request $request Request to proxy.
	 * @return mixed
	 */
	public function get_subscribers( $request ) {
		return $this->request_stats( $request, 'subscribers' );
	}

	/**
	 * Return the latest 30 all-time email summaries from WordPress.com.
	 *
	 * The upstream endpoint caps the response at 30 emails, so aggregate rates only cover those rows.
	 *
	 * @param WP_REST_Request $request Request to proxy.
	 * @return mixed
	 */
	public function get_email_summary( $request ) {
		return $this->request_stats( $request, 'emails/summary' );
	}

	/**
	 * Return recent local posts enriched with email metrics.
	 *
	 * @return array
	 */
	public function get_recent_posts() {
		$query           = new WP_Query(
			array(
				'post_type'           => 'post',
				'post_status'         => array( 'publish', 'draft' ),
				'posts_per_page'      => 10,
				'orderby'             => 'date',
				'order'               => 'DESC',
				'ignore_sticky_posts' => true,
				'no_found_rows'       => true,
			)
		);
		$summary_request = new WP_REST_Request( 'GET' );
		$summary_request->set_query_params(
			array(
				'period'     => 'alltime',
				'quantity'   => 30,
				'sort_field' => 'post_date',
				'sort_order' => 'desc',
			)
		);
		$summary = $this->get_email_summary( $summary_request );
		if ( $summary instanceof WP_REST_Response ) {
			$summary = $summary->get_data();
		}

		$summary_available = ! is_wp_error( $summary ) && is_array( $summary );
		$summary_posts     = $summary_available && isset( $summary['posts'] ) && is_array( $summary['posts'] )
			? $summary['posts']
			: array();
		$summary_by_id     = array();
		$email_totals      = array(
			'sends'        => 0,
			'uniqueOpens'  => 0,
			'uniqueClicks' => 0,
		);

		foreach ( $summary_posts as $summary_post ) {
			if ( ! is_array( $summary_post ) || empty( $summary_post['id'] ) ) {
				continue;
			}

			$summary_by_id[ (int) $summary_post['id'] ] = $summary_post;
			$email_totals['sends']                     += is_numeric( $summary_post['total_sends'] ?? null ) ? (int) $summary_post['total_sends'] : 0;
			$email_totals['uniqueOpens']               += is_numeric( $summary_post['unique_opens'] ?? null ) ? (int) $summary_post['unique_opens'] : 0;
			$email_totals['uniqueClicks']              += is_numeric( $summary_post['unique_clicks'] ?? null ) ? (int) $summary_post['unique_clicks'] : 0;
		}

		$posts = array();
		foreach ( $query->posts as $post ) {
			$metrics = $summary_by_id[ $post->ID ] ?? null;
			$status  = 'draft' === $post->post_status ? 'draft' : 'publish';
			$title   = get_the_title( $post );
			$image   = get_the_post_thumbnail_url( $post, 'thumbnail' );

			$posts[] = array(
				'id'               => (int) $post->ID,
				'title'            => '' !== trim( $title ) ? $title : __( '(no title)', 'jetpack-newsletter' ),
				'status'           => $status,
				'date'             => get_post_time( DATE_W3C, true, $post ),
				'url'              => 'draft' === $status ? get_preview_post_link( $post ) : get_permalink( $post ),
				'image'            => false !== $image ? $image : null,
				'recipients'       => is_array( $metrics ) && is_numeric( $metrics['total_sends'] ?? null ) ? (int) $metrics['total_sends'] : null,
				'openRatePercent'  => is_array( $metrics ) && is_numeric( $metrics['opens_rate'] ?? null ) ? (float) $metrics['opens_rate'] : null,
				'clickRatePercent' => is_array( $metrics ) && is_numeric( $metrics['clicks_rate'] ?? null ) ? (float) $metrics['clicks_rate'] : null,
			);
		}

		return array(
			'posts'         => $posts,
			'emailTotals'   => $summary_available ? $email_totals : null,
			'viewAllUrl'    => admin_url( 'edit.php' ),
			'createPostUrl' => admin_url( 'post-new.php' ),
		);
	}

	/**
	 * Restrict subscriber stats to Newsletter administrators.
	 *
	 * @return bool
	 */
	public function can_view() {
		return current_user_can( 'manage_options' );
	}
}
