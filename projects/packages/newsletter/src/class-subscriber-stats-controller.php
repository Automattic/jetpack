<?php
/**
 * Newsletter subscriber stats REST proxy.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\Status\Host;
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
	 * Transient prefix for successful WordPress.com Stats responses.
	 *
	 * @var string
	 */
	const CACHE_TRANSIENT_PREFIX = 'jetpack_newsletter_stats_';

	/**
	 * WordPress.com Stats JSON API rest_base this controller proxies to.
	 *
	 * The local route is `newsletter/stats`; the upstream JSON API is still `stats`.
	 *
	 * @var string
	 */
	const UPSTREAM_STATS_REST_BASE = 'stats';

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
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'newsletter/stats';
	}

	/**
	 * Register the Newsletter stats proxy routes.
	 *
	 * Evaluated on `rest_api_init` so filters that land after plugin load can
	 * still toggle the Overview flag. Skipped on Simple: public-api serves the
	 * mapped twin, and `Settings::init()` also runs there via mu-wpcom.
	 *
	 * @return void
	 */
	public function register_routes() {
		if ( ( new Host() )->is_wpcom_simple() || ! $this->overview_enabled() ) {
			return;
		}

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
						'enum'    => array( 'day', 'week', 'month' ),
						'default' => 'day',
					),
					'quantity'    => array(
						'type'    => 'integer',
						'minimum' => 1,
						'maximum' => 365,
						'default' => 30,
					),
					'date'        => array(
						'description'       => __( 'Most recent day to include in results (YYYY-MM-DD).', 'jetpack-newsletter' ),
						'type'              => 'string',
						'pattern'           => '^\d{4}-\d{2}-\d{2}$',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
						'validate_callback' => array( $this, 'is_valid_stats_date' ),
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
	 * @param WP_REST_Request $request        Local REST request.
	 * @param string          $endpoint       Relative Stats endpoint.
	 * @param string[]        $allowed_params Query keys forwarded to the host or WordPress.com.
	 * @return mixed
	 */
	private function request_stats( $request, $endpoint, $allowed_params ) {
		$query_args = array();
		foreach ( $allowed_params as $key ) {
			$value = $request->get_param( $key );
			if ( null !== $value ) {
				$query_args[ $key ] = $value;
			}
		}

		/**
		 * Allows a host to provide Newsletter Stats without calling WordPress.com directly.
		 *
		 * @since $$next-version$$
		 *
		 * @param mixed|null $response   Host response, or null to use the default proxy.
		 * @param string     $endpoint   Relative Stats endpoint.
		 * @param array      $query_args Allowlisted request query arguments.
		 */
		$response = apply_filters(
			'jetpack_newsletter_stats_pre_request',
			null,
			$endpoint,
			$query_args
		);

		return $response ?? $this->proxy_stats_to_wpcom( $endpoint, $query_args );
	}

	/**
	 * Reject dates that are not a real YYYY-MM-DD calendar day.
	 *
	 * @param mixed           $value   Raw date.
	 * @param WP_REST_Request $request Request.
	 * @param string          $param   Parameter name.
	 * @return true|WP_Error
	 */
	public function is_valid_stats_date( $value, $request, $param ) {
		$valid = rest_validate_request_arg( $value, $request, $param );
		if ( true !== $valid ) {
			return $valid;
		}

		$parsed = \DateTime::createFromFormat( 'Y-m-d', (string) $value );
		if ( ! $parsed || $value !== $parsed->format( 'Y-m-d' ) ) {
			return new WP_Error(
				'rest_invalid_param',
				sprintf(
					/* translators: %s: Parameter name. */
					__( '%s must be a real calendar day in YYYY-MM-DD format.', 'jetpack-newsletter' ),
					$param
				),
				array( 'status' => 400 )
			);
		}

		return true;
	}

	/**
	 * Call WordPress.com's Stats REST API, mirroring `WPCOM_Stats::fetch_remote_stats()`.
	 *
	 * Successful responses are cached for five minutes. Errors are not, so a reconnect
	 * is not stuck on a stale failure.
	 *
	 * @param string $endpoint   Relative Stats endpoint.
	 * @param array  $query_args Allowlisted query arguments.
	 * @return mixed|WP_Error
	 */
	private function proxy_stats_to_wpcom( $endpoint, $query_args ) {
		$path      = add_query_arg(
			$query_args,
			sprintf(
				'/sites/%d/%s/%s',
				(int) \Jetpack_Options::get_option( 'id' ),
				self::UPSTREAM_STATS_REST_BASE,
				ltrim( $endpoint, '/' )
			)
		);
		$cache_key = self::CACHE_TRANSIENT_PREFIX . md5( implode( '|', array( $path, self::STATS_API_VERSION ) ) );
		$cached    = get_transient( $cache_key );
		if ( false !== $cached ) {
			return json_decode( $cached, true );
		}

		$response = Client::wpcom_json_api_request_as_blog(
			$path,
			self::STATS_API_VERSION,
			array( 'timeout' => 20 )
		);

		if ( is_wp_error( $response ) ) {
			return $this->maybe_map_connection_error( $response );
		}

		$status     = wp_remote_retrieve_response_code( $response );
		$body       = json_decode( wp_remote_retrieve_body( $response ), true );
		$error_code = is_array( $body ) ? ( $body['error'] ?? $body['code'] ?? null ) : null;

		if ( in_array( $error_code, array( 'invalid_token', 'unknown_token', 'signature_mismatch' ), true ) ) {
			return $this->site_not_connected_error();
		}

		if ( $status >= 400 ) {
			$message = is_array( $body )
				? ( $body['message'] ?? __( 'An unknown error occurred.', 'jetpack-newsletter' ) )
				: __( 'An unknown error occurred.', 'jetpack-newsletter' );

			return new WP_Error(
				$error_code ?? 'unknown_error',
				$message,
				array( 'status' => $status )
			);
		}

		set_transient( $cache_key, wp_json_encode( $body, JSON_UNESCAPED_SLASHES ), 5 * MINUTE_IN_SECONDS );

		return $body;
	}

	/**
	 * Map local token failures to a REST 400 so they are not reported as server faults.
	 *
	 * @param WP_Error $error Connection client error.
	 * @return WP_Error
	 */
	private function maybe_map_connection_error( $error ) {
		if ( in_array( $error->get_error_code(), array( 'missing_token', 'no_possible_tokens', 'malformed_token' ), true ) ) {
			return $this->site_not_connected_error();
		}

		return $error;
	}

	/**
	 * Error for a site that cannot authenticate with WordPress.com.
	 *
	 * @return WP_Error
	 */
	private function site_not_connected_error() {
		return new WP_Error(
			'site_not_connected',
			__( 'This site is not connected to WordPress.com.', 'jetpack-newsletter' ),
			array( 'status' => 400 )
		);
	}

	/**
	 * Return subscriber time-series data from WordPress.com.
	 *
	 * @param WP_REST_Request $request Request to proxy.
	 * @return mixed
	 */
	public function get_subscribers( $request ) {
		return $this->request_stats( $request, 'subscribers', array( 'unit', 'quantity', 'date', 'stat_fields' ) );
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
		return $this->request_stats( $request, 'emails/summary', array( 'quantity', 'sort_field', 'sort_order' ) );
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

	/**
	 * Whether the shared Overview flag is on.
	 *
	 * @return bool
	 */
	private function overview_enabled() {
		if ( class_exists( Feature_Flags::class, false ) ) {
			return Feature_Flags::is_enabled( Settings::OVERVIEW_FEATURE_FLAG );
		}

		return (bool) apply_filters( 'jetpack_feature_flag_enabled_' . Settings::OVERVIEW_FEATURE_FLAG, false );
	}
}
