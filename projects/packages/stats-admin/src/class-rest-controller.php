<?php
/**
 * The Stats Rest Controller class.
 * Registers the REST routes for Odyssey Stats.
 *
 * @package automattic/jetpack-stats-admin
 */

namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Stats\WPCOM_Stats;
use Automattic\Jetpack\Status;
use Jetpack_Options;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Registers the REST routes for Stats.
 * It bascially forwards the requests to the WordPress.com REST API.
 */
class REST_Controller {
	const JETPACK_STATS_DASHBOARD_MODULES_CACHE_KEY         = 'jetpack_stats_dashboard_modules_cache_key';
	const JETPACK_STATS_DASHBOARD_MODULE_SETTINGS_CACHE_KEY = 'jetpack_stats_dashboard_module_settings_cache_key';

	/**
	 * Namespace for the REST API.
	 *
	 * @var string
	 */
	public static $namespace = 'jetpack/v4/stats-app';

	/**
	 * Hold an instance of WPCOM_Stats.
	 *
	 * @var WPCOM_Stats
	 */
	protected $wpcom_stats;

	/**
	 * Constructor
	 */
	public function __construct() {
		$this->wpcom_stats = new WPCOM_Stats();
	}

	/**
	 * Registers the REST routes on the `rest_api_init` hook.
	 *
	 * Instantiated here, rather than eagerly, so the controller class only loads
	 * on requests that reach `rest_api_init`. Static so the callback can be
	 * unregistered.
	 *
	 * @access public
	 */
	public static function register() {
		( new self() )->register_rest_routes();
	}

	/**
	 * The site's WPCOM blog ID, used to build every route in this class.
	 *
	 * A never-connected site has no blog ID -- it's only ever assigned during the
	 * WPCOM connection handshake, which Offline Mode sites can never complete. The
	 * Odyssey frontend independently reads the same `Jetpack_Options::get_option( 'id' )`
	 * value to build its request URLs, so if the routes below registered with an
	 * empty ID, the frontend and backend would disagree (`/sites/null/...` requested
	 * vs. `/sites/0/...` registered) and every Stats REST call would 404. Filling in
	 * a stable placeholder in Offline Mode keeps both sides consistent; the
	 * individual route handlers return sample data rather than proxying it onward.
	 *
	 * @return int
	 */
	protected static function get_blog_id() {
		$blog_id = Jetpack_Options::get_option( 'id' );
		if ( empty( $blog_id ) && ( new Status() )->is_offline_mode() ) {
			return 999999999;
		}
		return $blog_id;
	}

	/**
	 * Registers the REST routes for Odyssey Stats.
	 *
	 * Odyssey Stats is built from `wp-calypso`, which leverages the `public-api.wordpress.com` API.
	 * The current Site ID is added as part of the route, so that the front end doesn't have to handle the differences.
	 *
	 * @access public
	 * @static
	 */
	public function register_rest_routes() {
		// Stats for single resource type.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/stats/(?P<resource>[\-\w]+)/(?P<resource_id>[\d]+)', self::get_blog_id() ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_single_resource_stats' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
			)
		);

		// Stats for a resource type.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/stats/(?P<resource>[\-\w]+)', self::get_blog_id() ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_stats_resource' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
			)
		);

		// Single post info.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/posts/(?P<resource_id>[\d]+)', self::get_blog_id() ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_single_post' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
			)
		);

		// Single post likes.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/posts/(?P<resource_id>[\d]+)/likes', self::get_blog_id() ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_single_post_likes' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
			)
		);

		// General stats for the site.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/stats', self::get_blog_id() ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_site_stats' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
			)
		);

		// Whether site has never published post / page.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/site-has-never-published-post', self::get_blog_id() ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'site_has_never_published_post' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
			)
		);

		// List posts.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/posts', self::get_blog_id() ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_site_posts' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
			)
		);

		// Subscribers counts.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/subscribers/counts', self::get_blog_id() ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_site_subscribers_counts' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
			)
		);

		// Stats Plan Usage.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/jetpack-stats/usage', self::get_blog_id() ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_site_plan_usage' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
			)
		);

		// User feedback endpoint.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/jetpack-stats/user-feedback', self::get_blog_id() ),
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'post_user_feedback' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
			)
		);

		// WordAds Earnings.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/earnings', self::get_blog_id() ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_wordads_earnings' ),
				'permission_callback' => array( $this, 'can_user_view_wordads_stats_callback' ),
			)
		);

		// WordAds Stats.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/stats', self::get_blog_id() ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_wordads_stats' ),
				'permission_callback' => array( $this, 'can_user_view_wordads_stats_callback' ),
			)
		);

		// Legacy: Update Stats notices.
		// TODO: remove this in the next release.
		register_rest_route(
			static::$namespace,
			'/stats/notices',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'update_notice_status' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
				'args'                => array(
					'id'            => array(
						'required'    => true,
						'type'        => 'string',
						'description' => 'ID of the notice',
					),
					'status'        => array(
						'required'    => true,
						'type'        => 'string',
						'description' => 'Status of the notice',
					),
					'postponed_for' => array(
						'type'        => 'number',
						'default'     => null,
						'description' => 'Postponed for (in seconds)',
						'minimum'     => 0,
					),
				),
			)
		);

		// Update Stats notices.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/jetpack-stats-dashboard/notices', self::get_blog_id() ),
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'update_notice_status' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
				'args'                => array(
					'id'            => array(
						'required'    => true,
						'type'        => 'string',
						'description' => 'ID of the notice',
					),
					'status'        => array(
						'required'    => true,
						'type'        => 'string',
						'description' => 'Status of the notice',
					),
					'postponed_for' => array(
						'type'        => 'number',
						'default'     => null,
						'description' => 'Postponed for (in seconds)',
						'minimum'     => 0,
					),
				),
			)
		);

		// Get Stats notices.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/jetpack-stats-dashboard/notices', self::get_blog_id() ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_notice_status' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
			)
		);

		// Get referrer spam list.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/stats/referrers/spam', self::get_blog_id() ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_referrer_spam_list' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
			)
		);

		// Mark referrer spam.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/stats/referrers/spam/new', self::get_blog_id() ),
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'mark_referrer_spam' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
				'args'                => array(
					'domain' => array(
						'required'    => true,
						'type'        => 'string',
						'description' => 'Domain of the referrer',
					),
				),
			)
		);

		// Unmark referrer spam.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/stats/referrers/spam/delete', self::get_blog_id() ),
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'unmark_referrer_spam' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
				'args'                => array(
					'domain' => array(
						'required'    => true,
						'type'        => 'string',
						'description' => 'Domain of the referrer',
					),
				),
			)
		);

		// Update dashboard modules.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/jetpack-stats-dashboard/modules', self::get_blog_id() ),
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'update_dashboard_modules' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
			)
		);

		// Get dashboard modules.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/jetpack-stats-dashboard/modules', self::get_blog_id() ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dashboard_modules' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
			)
		);

		// Update dashboard module settings.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/jetpack-stats-dashboard/module-settings', self::get_blog_id() ),
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'update_dashboard_module_settings' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
			)
		);

		// Get dashboard module settings.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/jetpack-stats-dashboard/module-settings', self::get_blog_id() ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dashboard_module_settings' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
			)
		);

		// Get email stats as a list.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/stats/emails/(?P<resource>[\-\w\d]+)', self::get_blog_id() ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_email_stats_list' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
			)
		);

		// Get Email opens stats for a single post.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/stats/opens/emails/(?P<post_id>[\d]+)/(?P<resource>[\-\w]+)', self::get_blog_id() ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_email_opens_stats_single' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
			)
		);

		// Get Email clicks stats for a single post.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/stats/clicks/emails/(?P<post_id>[\d]+)/(?P<resource>[\-\w]+)', self::get_blog_id() ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_email_clicks_stats_single' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
			)
		);

		// Get Email stats time series.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/stats/(?P<resource>[\-\w]+)/emails/(?P<post_id>[\d]+)', self::get_blog_id() ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_email_stats_time_series' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
			)
		);

		// Get UTM stats time series.
		register_rest_route(
			static::$namespace,
			// /stats/utm/utm_campaign,utm_source,utm_medium
			sprintf( '/sites/%d/stats/utm/(?P<utm_params>[_,\-\w]+)', self::get_blog_id() ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_utm_stats_time_series' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
			)
		);

		// Get Devices stats time series.
		register_rest_route(
			static::$namespace,
			// /stats/devices/screensize
			sprintf( '/sites/%d/stats/devices/(?P<device_property>[\w]+)', self::get_blog_id() ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_devices_stats_time_series' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
			)
		);

		// Rerun commercial classificiation.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/commercial-classification', self::get_blog_id() ),
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'run_commercial_classification' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
			)
		);

		// Purchases endpoint.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/purchases', self::get_blog_id() ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_site_purchases' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
			)
		);

		// Get Location stats.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/stats/location-views/(?P<geo_mode>country|region|city)', self::get_blog_id() ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_location_stats' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
			)
		);
	}

	/**
	 * Only administrators or users with capability `view_stats` can access the API.
	 *
	 * @return bool|WP_Error True if a blog token was used to sign the request, WP_Error otherwise.
	 */
	public function can_user_view_general_stats_callback() {
		if ( current_user_can( 'manage_options' ) || current_user_can( 'view_stats' ) ) {
			return true;
		}

		return $this->get_forbidden_error();
	}

	/**
	 * Only administrators or users with capability `activate_wordads` can access the API.
	 */
	public function can_user_view_wordads_stats_callback() {
		// phpcs:ignore WordPress.WP.Capabilities.Unknown
		if ( current_user_can( 'manage_options' ) || current_user_can( 'activate_wordads' ) ) {
			return true;
		}

		return $this->get_forbidden_error();
	}

	/**
	 * Stats resource endpoint.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function get_stats_resource( $req ) {
		switch ( $req->get_param( 'resource' ) ) {
			case 'file-downloads':
				return $this->wpcom_stats->get_file_downloads( $req->get_params() );

			case 'video-plays':
				return $this->wpcom_stats->get_video_plays( $req->get_params() );

			case 'clicks':
				return $this->wpcom_stats->get_clicks( $req->get_params() );

			case 'search-terms':
				return $this->wpcom_stats->get_search_terms( $req->get_params() );

			case 'top-authors':
				return $this->wpcom_stats->get_top_authors( $req->get_params() );

			case 'country-views':
				return $this->wpcom_stats->get_views_by_country( $req->get_params() );

			case 'referrers':
				return $this->wpcom_stats->get_referrers( $req->get_params() );

			case 'top-posts':
				return $this->wpcom_stats->get_top_posts( $req->get_params() );

			case 'archives':
				return $this->wpcom_stats->get_archives( $req->get_params() );

			case 'publicize':
				return $this->wpcom_stats->get_publicize_followers( $req->get_params() );

			case 'followers':
				return $this->wpcom_stats->get_followers( $req->get_params() );

			case 'tags':
				return $this->wpcom_stats->get_tags( $req->get_params() );

			case 'visits':
				return $this->wpcom_stats->get_visits( $req->get_params() );

			case 'comments':
				return $this->wpcom_stats->get_top_comments( $req->get_params() );

			case 'comment-followers':
				return $this->wpcom_stats->get_comment_followers( $req->get_params() );

			case 'streak':
				return $this->wpcom_stats->get_streak( $req->get_params() );

			case 'insights':
				return $this->wpcom_stats->get_insights( $req->get_params() );

			case 'highlights':
				return $this->wpcom_stats->get_highlights( $req->get_params() );

			case 'subscribers':
				return WPCOM_Client::request_as_blog_cached(
					sprintf(
						'/sites/%d/stats/subscribers?%s',
						self::get_blog_id(),
						$this->filter_and_build_query_string(
							$req->get_query_params()
						)
					),
					'v1.1',
					array( 'timeout' => 5 )
				);

			default:
				return $this->get_forbidden_error();
		}
	}

	/**
	 * Return likes of a single post.
	 *
	 * @param WP_REST_Request $req The request object.
	 */
	public function get_single_post_likes( $req ) {
		$response = wp_remote_get(
			sprintf(
				'%s/rest/v1.2/sites/%d/posts/%d/likes?%s',
				Constants::get_constant( 'JETPACK__WPCOM_JSON_API_BASE' ),
				self::get_blog_id(),
				$req->get_param( 'resource_id' ),
				$this->filter_and_build_query_string(
					$req->get_params(),
					array( 'resource_id' )
				)
			),
			array( 'timeout' => 5 )
		);

		$response_code = wp_remote_retrieve_response_code( $response );
		$response_body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		if ( 200 !== $response_code ) {
			return new WP_Error(
				isset( $response_body['error'] ) ? 'remote-error-' . $response_body['error'] : 'remote-error',
				$response_body['message'] ?? 'unknown remote error',
				array( 'status' => $response_code )
			);
		}

		return $response_body;
	}

	/**
	 * Site Stats Resource endpoint.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function get_single_resource_stats( $req ) {
		switch ( $req->get_param( 'resource' ) ) {
			case 'post':
				return $this->wpcom_stats->get_post_views(
					intval( $req->get_param( 'resource_id' ) ),
					$req->get_params()
				);

			case 'video':
				return $this->wpcom_stats->get_video_details(
					intval( $req->get_param( 'resource_id' ) ),
					$req->get_params()
				);

			default:
				return $this->get_forbidden_error();
		}
	}

	/**
	 * Get brief information for a single post.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function get_single_post( $req ) {
		$post = get_post( intval( $req->get_param( 'resource_id' ) ), 'OBJECT', 'display' );
		if ( is_wp_error( $post ) || empty( $post ) ) {
			return $post;
		}

		// The endpoint should be as compatible as possible with `/sites/$site_id/posts/$post_id`.
		// The reason we are not forwarding the request is that `/sites/$site_id/posts/$post_id` might require user tokens for private posts/sites, which is not possible for users without a WordPress.com account.
		// 'like_count' is not included in the response because it's available through another endpoint `/sites/$site_id/posts/$post_id/likes`.
		return array(
			'ID'             => $post->ID,
			'site_ID'        => self::get_blog_id(),
			'title'          => $post->post_title,
			'URL'            => get_permalink( $post->ID ),
			'type'           => $post->post_type,
			'status'         => $post->post_status,
			'discussion'     => array( 'comment_count' => intval( $post->comment_count ) ),
			'date'           => $post->post_date,
			'post_thumbnail' => array( 'URL' => get_the_post_thumbnail_url( $post->ID ) ),
		);
	}

	/**
	 * Get site stats.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function get_site_stats( $req ) {
		return $this->wpcom_stats->get_stats( $req->get_params() );
	}

	/**
	 * List posts for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function get_site_posts( $req ) {
		// Force wpcom response.
		$params   = array_merge( array( 'force' => 'wpcom' ), $req->get_params() );
		$response = wp_remote_get(
			sprintf(
				'%s/rest/v1.1/sites/%d/posts?%s',
				Constants::get_constant( 'JETPACK__WPCOM_JSON_API_BASE' ),
				self::get_blog_id(),
				$req->get_param( 'resource_id' ),
				$this->filter_and_build_query_string( $params, array( 'resource_id' ) )
			),
			array( 'timeout' => 5 )
		);

		$response_code = wp_remote_retrieve_response_code( $response );
		$response_body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		if ( 200 !== $response_code ) {
			return new WP_Error(
				isset( $response_body['error'] ) ? 'remote-error-' . $response_body['error'] : 'remote-error',
				$response_body['message'] ?? 'unknown remote error',
				array( 'status' => $response_code )
			);
		}

		return $response_body;
	}

	/**
	 * Get site subscribers counts.
	 *
	 * @param WP_REST_Request $req The request object.
	 *
	 * @return array
	 */
	public function get_site_subscribers_counts( $req ) {
		if ( ( new Status() )->is_offline_mode() ) {
			return array(
				'value'               => 4,
				'value_paid'          => 0,
				'is_owner_subscribed' => false,
			);
		}

		return WPCOM_Client::request_as_blog_cached(
			sprintf(
				'/sites/%d/subscribers/counts?%s',
				self::get_blog_id(),
				$this->filter_and_build_query_string(
					$req->get_query_params()
				)
			),
			'v2',
			array( 'timeout' => 5 ),
			null,
			'wpcom'
		);
	}

	/**
	 * Get site plan usage.
	 *
	 * @param WP_REST_Request $req The request object.
	 *
	 * @return array
	 */
	public function get_site_plan_usage( $req ) {
		if ( ( new Status() )->is_offline_mode() ) {
			return array(
				'current_usage'          => array(
					'current_start' => gmdate( 'Y-m-01' ),
					'next_start'    => gmdate( 'Y-m-01', strtotime( '+1 month' ) ),
					'views_count'   => 151,
					'days_to_reset' => (int) gmdate( 't' ) - (int) gmdate( 'j' ),
				),
				'recent_usages'          => array(),
				'views_limit'            => 10000,
				'over_limit_months'      => 0,
				'current_tier'           => array(
					'maximum_price'                 => 0,
					'maximum_price_display'         => '$0',
					'maximum_price_monthly_display' => '$0',
					'maximum_units'                 => 10000,
					'minimum_price'                 => 0,
					'minimum_price_display'         => '$0',
					'minimum_price_monthly_display' => '$0',
					'minimum_units'                 => 0,
				),
				'is_internal'            => false,
				'billable_monthly_views' => 151,
				'should_show_paywall'    => false,
				'paywall_date_from'      => null,
				'upgrade_deadline_date'  => null,
			);
		}

		return WPCOM_Client::request_as_blog_cached(
			sprintf(
				'/sites/%d/jetpack-stats/usage?%s',
				self::get_blog_id(),
				$this->filter_and_build_query_string(
					$req->get_query_params()
				)
			),
			'v2',
			array( 'timeout' => 5 ),
			null,
			'wpcom',
			false
		);
	}

	/**
	 * Post user feedback for Jetpack Stats.
	 *
	 * @param WP_REST_Request $req The request object.
	 *
	 * @return array
	 */
	public function post_user_feedback( $req ) {
		$current_user  = wp_get_current_user();
		$body_from_req = json_decode( $req->get_body(), true );
		$body_data     = is_array( $body_from_req ) ? $body_from_req : array();
		$user_email    = $current_user->user_email;

		return WPCOM_Client::request_as_blog_cached(
			sprintf(
				'/sites/%d/jetpack-stats/user-feedback?%s',
				self::get_blog_id(),
				$this->filter_and_build_query_string(
					$req->get_query_params()
				)
			),
			'v2',
			array(
				'timeout' => 5,
				'method'  => 'POST',
				'headers' => array( 'Content-Type' => 'application/json' ),
			),
			wp_json_encode(
				array_merge(
					$body_data,
					array(
						'user_email' => $user_email,
					)
				),
				JSON_UNESCAPED_SLASHES
			),
			'wpcom'
		);
	}

	/**
	 * Whether site has never published post.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function site_has_never_published_post( $req ) {
		if ( ( new Status() )->is_offline_mode() ) {
			// The dashboard shows an empty/onboarding state when this is true; the
			// sample data below assumes a site with published content, so this must
			// stay false regardless of whether the Offline Mode site has real posts.
			return false;
		}

		return WPCOM_Client::request_as_blog_cached(
			sprintf(
				'/sites/%d/site-has-never-published-post?%s',
				self::get_blog_id(),
				$this->filter_and_build_query_string(
					$req->get_params()
				)
			),
			'v2',
			array( 'timeout' => 5 ),
			null,
			'wpcom'
		);
	}

	/**
	 * Get detailed WordAds earnings information for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function get_wordads_earnings( $req ) {
		return WPCOM_Client::request_as_blog_cached(
			sprintf(
				'/sites/%d/wordads/earnings?%s',
				self::get_blog_id(),
				$this->filter_and_build_query_string(
					$req->get_params()
				)
			),
			'v1.1',
			array( 'timeout' => 5 )
		);
	}

	/**
	 * Get WordAds stats for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function get_wordads_stats( $req ) {
		return WPCOM_Client::request_as_blog_cached(
			sprintf(
				'/sites/%d/wordads/stats?%s',
				self::get_blog_id(),
				$this->filter_and_build_query_string(
					$req->get_params()
				)
			),
			'v1.1',
			array( 'timeout' => 5 )
		);
	}

	/**
	 * Get Email stats as a list.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function get_email_stats_list( $req ) {
		switch ( $req->get_param( 'resource' ) ) {
			case 'summary':
				return WPCOM_Client::request_as_blog_cached(
					sprintf(
						'/sites/%d/stats/emails/%s?%s',
						self::get_blog_id(),
						$req->get_param( 'resource' ),
						$this->filter_and_build_query_string(
							$req->get_params()
						)
					),
					'v1.1',
					array( 'timeout' => 5 )
				);
			default:
				return $this->get_forbidden_error();
		}
	}

	/**
	 * Get Email opens stats for a single post.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function get_email_opens_stats_single( $req ) {
		switch ( $req->get_param( 'resource' ) ) {
			case 'client':
			case 'device':
			case 'country':
			case 'rate':
				return WPCOM_Client::request_as_blog_cached(
					sprintf(
						'/sites/%d/stats/opens/emails/%d/%s?%s',
						self::get_blog_id(),
						$req->get_param( 'post_id' ),
						$req->get_param( 'resource' ),
						$this->filter_and_build_query_string(
							$req->get_params()
						)
					),
					'v1.1',
					array( 'timeout' => 5 )
				);
			default:
				return $this->get_forbidden_error();
		}
	}

	/**
	 * Get Email clicks stats for a single post.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function get_email_clicks_stats_single( $req ) {
		switch ( $req->get_param( 'resource' ) ) {
			case 'client':
			case 'device':
			case 'country':
			case 'rate':
			case 'link':
			case 'user-content-link':
				return WPCOM_Client::request_as_blog_cached(
					sprintf(
						'/sites/%d/stats/clicks/emails/%d/%s?%s',
						self::get_blog_id(),
						$req->get_param( 'post_id' ),
						$req->get_param( 'resource' ),
						$this->filter_and_build_query_string(
							$req->get_params()
						)
					),
					'v1.1',
					array( 'timeout' => 5 )
				);
			default:
				return $this->get_forbidden_error();
		}
	}

	/**
	 * Get Email stats time series.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function get_email_stats_time_series( $req ) {
		switch ( $req->get_param( 'resource' ) ) {
			case 'opens':
			case 'clicks':
				return WPCOM_Client::request_as_blog_cached(
					sprintf(
						'/sites/%d/stats/%s/emails/%d?%s',
						self::get_blog_id(),
						$req->get_param( 'resource' ),
						$req->get_param( 'post_id' ),
						$this->filter_and_build_query_string(
							$req->get_params()
						)
					),
					'v1.1',
					array( 'timeout' => 5 )
				);
			default:
				return $this->get_forbidden_error();
		}
	}

	/**
	 * Get UTM stats time series.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function get_utm_stats_time_series( $req ) {
		return WPCOM_Client::request_as_blog_cached(
			sprintf(
				'/sites/%d/stats/utm/%s?%s',
				self::get_blog_id(),
				$req->get_param( 'utm_params' ),
				$this->filter_and_build_query_string(
					$req->get_params()
				)
			),
			'v1.1',
			array( 'timeout' => 10 )
		);
	}

	/**
	 * Get Devices stats time series.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function get_devices_stats_time_series( $req ) {
		return WPCOM_Client::request_as_blog_cached(
			sprintf(
				'/sites/%d/stats/devices/%s?%s',
				self::get_blog_id(),
				$req->get_param( 'device_property' ),
				$this->filter_and_build_query_string(
					$req->get_params()
				)
			),
			'v1.1',
			array( 'timeout' => 10 )
		);
	}

	/**
	 * Get Location stats.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function get_location_stats( $req ) {
		$params   = $req->get_params();
		$geo_mode = $params['geo_mode'];
		unset( $params['geo_mode'] );

		return $this->wpcom_stats->get_views_by_location( $geo_mode, $params );
	}

	/**
	 * Dismiss or delay stats notices.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function update_notice_status( $req ) {
		return ( new Notices() )->update_notice( $req->get_param( 'id' ), $req->get_param( 'status' ), $req->get_param( 'postponed_for' ) );
	}

	/**
	 * Get stats notices.
	 *
	 * @return array
	 */
	public function get_notice_status() {
		return ( new Notices() )->get_notices_to_show();
	}

	/**
	 * Get the list of spam referrers.
	 *
	 * @return array
	 */
	public function get_referrer_spam_list() {
		return WPCOM_Client::request_as_blog(
			sprintf(
				'/sites/%d/stats/referrers/spam',
				self::get_blog_id()
			),
			'v1.1',
			array(
				'timeout' => 5,
				'method'  => 'GET',
			)
		);
	}

	/**
	 * Mark a referrer as spam.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function mark_referrer_spam( $req ) {
		return WPCOM_Client::request_as_blog(
			sprintf(
				'/sites/%d/stats/referrers/spam/new?%s',
				self::get_blog_id(),
				$this->filter_and_build_query_string(
					$req->get_query_params()
				)
			),
			'v1.1',
			array(
				'timeout' => 5,
				'method'  => 'POST',
			)
		);
	}

	/**
	 * Unmark a referrer as spam.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function unmark_referrer_spam( $req ) {
		return WPCOM_Client::request_as_blog(
			sprintf(
				'/sites/%d/stats/referrers/spam/delete?%s',
				self::get_blog_id(),
				$this->filter_and_build_query_string(
					$req->get_query_params()
				)
			),
			'v1.1',
			array(
				'timeout' => 5,
				'method'  => 'POST',
			)
		);
	}

	/**
	 * Toggle modules on dashboard.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function update_dashboard_modules( $req ) {
		// Clear dashboard modules cache.
		delete_transient( static::JETPACK_STATS_DASHBOARD_MODULES_CACHE_KEY );
		return WPCOM_Client::request_as_blog(
			sprintf(
				'/sites/%d/jetpack-stats-dashboard/modules?%s',
				self::get_blog_id(),
				$this->filter_and_build_query_string(
					$req->get_query_params()
				)
			),
			'v2',
			array(
				'timeout' => 5,
				'method'  => 'POST',
				'headers' => array( 'Content-Type' => 'application/json' ),
			),
			$req->get_body(),
			'wpcom'
		);
	}

	/**
	 * Get modules on dashboard.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function get_dashboard_modules( $req ) {
		if ( ( new Status() )->is_offline_mode() ) {
			return array();
		}

		return WPCOM_Client::request_as_blog_cached(
			sprintf(
				'/sites/%d/jetpack-stats-dashboard/modules?%s',
				self::get_blog_id(),
				$this->filter_and_build_query_string(
					$req->get_query_params()
				)
			),
			'v2',
			array(
				'timeout' => 5,
			),
			null,
			'wpcom',
			true,
			static::JETPACK_STATS_DASHBOARD_MODULES_CACHE_KEY
		);
	}

	/**
	 * Update module settings on dashboard.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function update_dashboard_module_settings( $req ) {
		// Clear dashboard modules cache.
		delete_transient( static::JETPACK_STATS_DASHBOARD_MODULE_SETTINGS_CACHE_KEY );
		return WPCOM_Client::request_as_blog(
			sprintf(
				'/sites/%d/jetpack-stats-dashboard/module-settings?%s',
				self::get_blog_id(),
				$this->filter_and_build_query_string(
					$req->get_query_params()
				)
			),
			'v2',
			array(
				'timeout' => 5,
				'method'  => 'POST',
				'headers' => array( 'Content-Type' => 'application/json' ),
			),
			$req->get_body(),
			'wpcom'
		);
	}

	/**
	 * Get module settings on dashboard.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function get_dashboard_module_settings( $req ) {
		if ( ( new Status() )->is_offline_mode() ) {
			return array();
		}

		return WPCOM_Client::request_as_blog_cached(
			sprintf(
				'/sites/%d/jetpack-stats-dashboard/module-settings?%s',
				self::get_blog_id(),
				$this->filter_and_build_query_string(
					$req->get_query_params()
				)
			),
			'v2',
			array(
				'timeout' => 5,
			),
			null,
			'wpcom',
			true,
			static::JETPACK_STATS_DASHBOARD_MODULE_SETTINGS_CACHE_KEY
		);
	}

	/**
	 * Run commercial classification.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function run_commercial_classification( $req ) {
		return WPCOM_Client::request_as_blog(
			sprintf(
				'/sites/%d/commercial-classification?%s',
				self::get_blog_id(),
				$this->filter_and_build_query_string(
					$req->get_query_params()
				)
			),
			'v2',
			array(
				'timeout' => 5,
				'method'  => 'POST',
			),
			null,
			'wpcom'
		);
	}

	/**
	 * Get purchases array; I don't see anything sensetive in there, so didn't sentinizie it.
	 * Plus it is the same case as Jetpack.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function get_site_purchases( $req ) {
		if ( ( new Status() )->is_offline_mode() ) {
			return array();
		}

		return WPCOM_Client::request_as_blog_cached(
			sprintf(
				'/upgrades?site=%d&%s',
				self::get_blog_id(),
				$this->filter_and_build_query_string(
					$req->get_query_params()
				)
			),
			'v1.2',
			array( 'timeout' => 10 ),
			null,
			'rest',
			false
		);
	}

	/**
	 * Return a WP_Error object with a forbidden error.
	 */
	protected function get_forbidden_error() {
		$error_msg = esc_html__(
			'You are not allowed to perform this action.',
			'jetpack-stats-admin'
		);

		return new WP_Error( 'rest_forbidden', $error_msg, array( 'status' => rest_authorization_required_code() ) );
	}

	/**
	 * Filter and build query string from all the requested params.
	 *
	 * @param array $params The params to filter.
	 * @param array $keys_to_unset The keys to unset from the params array.
	 * @return string The filtered and built query string.
	 */
	protected function filter_and_build_query_string( $params, $keys_to_unset = array() ) {
		if ( isset( $params['rest_route'] ) ) {
			unset( $params['rest_route'] );
		}
		if ( ! empty( $keys_to_unset ) && is_array( $keys_to_unset ) ) {
			foreach ( $keys_to_unset as $key ) {
				if ( isset( $params[ $key ] ) ) {
					unset( $params[ $key ] );
				}
			}
		}
		return http_build_query( $params );
	}
}
