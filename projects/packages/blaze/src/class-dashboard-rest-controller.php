<?php
/**
 * The Blaze Rest Controller class.
 * Registers the REST routes for Blaze Dashboard.
 *
 * @package automattic/jetpack-blaze
 */

namespace Automattic\Jetpack\Blaze;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\Sync\Health;
use WC_Product;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Registers the REST routes for Blaze Dashboard.
 * It basically forwards the requests to the WordPress.com REST API.
 */
class Dashboard_REST_Controller {
	/**
	 * Namespace for the REST API.
	 *
	 * @var string
	 */
	public static $namespace = 'jetpack/v4/blaze-app';

	/**
	 * Connection manager object.
	 *
	 * @var \Automattic\Jetpack\Connection\Manager
	 */
	private $connection;

	/**
	 * Creates the Dashboard_REST_Controller object.
	 *
	 * @param \Automattic\Jetpack\Connection\Manager $connection   The connection manager object.
	 */
	public function __construct( $connection = null ) {
		$this->connection = $connection ?? new Connection_Manager();
	}

	/**
	 * Registers the REST routes for Blaze Dashboard.
	 *
	 * Blaze Dashboard is built from `wp-calypso`, which leverages the `public-api.wordpress.com` API.
	 * The current Site ID is added as part of the route, so that the front end doesn't have to handle the differences.
	 *
	 * @access public
	 * @static
	 */
	public function register_rest_routes() {
		$site_id = $this->get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return;
		}

		// WPCOM API routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/blaze/posts(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_blaze_posts' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Posts routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%1$d/wordads/dsp/api/v1/wpcom/sites/%1$d/blaze/posts(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_blaze_posts' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Checkout route
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%1$d/wordads/dsp/api/v1/wpcom/checkout', $site_id ),
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'edit_wpcom_checkout' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Credits routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/credits(?P<sub_path>[a-zA-Z0-9-_\/]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_credits' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API media query routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%1$d/wordads/dsp/api/v1/wpcom/sites/%1$d/media(?P<sub_path>[a-zA-Z0-9-_\/]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_media' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API upload to WP Media Library routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%1$d/wordads/dsp/api/v1/wpcom/sites/%1$d/media', $site_id ),
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'upload_image_to_current_website' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API media openverse query routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%1$d/wordads/dsp/api/v1/wpcom/media(?P<sub_path>[a-zA-Z0-9-_\/]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_openverse' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Experiment route
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/experiments(?P<sub_path>[a-zA-Z0-9-_\/]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_experiments' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Campaigns routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/(?P<api_version>v[0-9]+\.?[0-9]*)/campaigns(?P<sub_path>[a-zA-Z0-9-_\/]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_campaigns' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1.1/campaigns', $site_id ),
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'create_dsp_campaigns' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/(?P<api_version>v[0-9]+\.?[0-9]*)/campaigns(?P<sub_path>[a-zA-Z0-9-_\/]*)', $site_id ),
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'edit_dsp_campaigns' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Site Campaigns routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%1$d/wordads/dsp/api/v1/sites/%1$d/campaigns(?P<sub_path>[a-zA-Z0-9-_\/]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_site_campaigns' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Site Stats routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/(?P<api_version>v[0-9]+\.?[0-9]*)/stats(?P<sub_path>[a-zA-Z0-9-_\/]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_stats' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/(?P<api_version>v[0-9]+\.?[0-9]*)/stats(?P<sub_path>[a-zA-Z0-9-_\/]*)', $site_id ),
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'edit_dsp_stats' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Search routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/search(?P<sub_path>[a-zA-Z0-9-_\/]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_search' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Users routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/user(?P<sub_path>[a-zA-Z0-9-_\/]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_user' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Templates routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/templates/article/(?P<urn>[a-zA-Z0-9-_:]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_templates_article' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/templates/advise/campaign/(?P<urn>[a-zA-Z0-9-_:]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_templates_advise_campaign' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/templates(?P<sub_path>[a-zA-Z0-9-_\/:]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_templates' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Advise routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/advise/campaign/(?P<urn>[a-zA-Z0-9-_:]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_advise_campaign' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/advise(?P<sub_path>[a-zA-Z0-9-_\/:]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_advise' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Subscriptions routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/subscriptions(?P<sub_path>[a-zA-Z0-9-_\/]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_subscriptions' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/subscriptions(?P<sub_path>[a-zA-Z0-9-_\/]*)', $site_id ),
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'edit_dsp_subscriptions' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Payments routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/(?P<api_version>v[0-9]+\.?[0-9]*)/payments(?P<sub_path>[a-zA-Z0-9-_\/]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_payments' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/(?P<api_version>v[0-9]+\.?[0-9]*)/payments(?P<sub_path>[a-zA-Z0-9-_\/]*)', $site_id ),
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'edit_dsp_payments' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Smart routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/smart(?P<sub_path>[a-zA-Z0-9-_\/]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_smart' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/smart(?P<sub_path>[a-zA-Z0-9-_\/]*)', $site_id ),
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'edit_dsp_smart' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Locations routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/locations(?P<sub_path>[a-zA-Z0-9-_\/]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_locations' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Woo routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/woo(?P<sub_path>[a-zA-Z0-9-_\/]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_woo' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Image routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/image(?P<sub_path>[a-zA-Z0-9-_\/]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_image' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Logs routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/logs', $site_id ),
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'edit_dsp_logs' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);
	}

	/**
	 * Only administrators can access the API.
	 *
	 * @return bool|WP_Error True if a blog token was used to sign the request, WP_Error otherwise.
	 */
	public function can_user_view_dsp_callback() {
		if (
			$this->is_user_connected()
			&& current_user_can( 'manage_options' )
		) {
			return true;
		}

		return $this->get_forbidden_error();
	}

	/**
	 * Get a list of posts that are eligible for Blaze campaigns.
	 *
	 * Routes to WPCOM API or local database based on Jetpack Sync status:
	 * - If sync is ready: Uses WPCOM API (has stats data like like_count, monthly_view_count).
	 * - If sync is not ready: Uses local database query (stats show as -1, stats-based
	 *   sorting falls back to date).
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_blaze_posts( $req ) {
		$site_id = $this->get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return array();
		}

		$sync_ready = $this->are_posts_ready();

		if ( $sync_ready ) {
			$response = $this->get_blaze_posts_from_wpcom( $req, $site_id );
		} else {
			$response = $this->get_blaze_posts_local( $req );
		}

		if ( is_wp_error( $response ) || $response instanceof \WP_REST_Response ) {
			return $response;
		}

		if ( is_array( $response ) ) {
			$response['sync_ready'] = $sync_ready;
		}

		return $response;
	}

	/**
	 * Get Blaze posts from the WPCOM API.
	 *
	 * Used when Jetpack Sync is ready and posts are available on WPCOM.
	 * Provides full functionality including stats data (like_count, monthly_view_count)
	 * and stats-based sorting.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @param int             $site_id The site ID.
	 * @return array|WP_Error
	 */
	private function get_blaze_posts_from_wpcom( $req, $site_id ) {
		// We don't use sub_path in the blaze posts, only query strings.
		if ( isset( $req['sub_path'] ) ) {
			unset( $req['sub_path'] );
		}

		$response = $this->request_as_user(
			sprintf( '/sites/%d/blaze/posts%s', $site_id, $this->build_subpath_with_query_strings( $req->get_params() ) ),
			'v2',
			array( 'method' => 'GET' )
		);

		// Bail if we get an error (WP_ERROR or an already formatted WP_REST_Response error).
		if ( is_wp_error( $response ) || $response instanceof \WP_REST_Response ) {
			return $response;
		}

		if ( isset( $response['posts'] ) && count( $response['posts'] ) > 0 ) {
			$response['posts'] = $this->add_prices_in_posts( $response['posts'] );
		}

		return $response;
	}

	/**
	 * Get Blaze posts from the local WordPress database.
	 *
	 * Used as fallback when Jetpack Sync is not ready. Stats fields (like_count,
	 * monthly_view_count) are returned as -1 since they are only available on WPCOM.
	 * If user requests sorting by stats fields, falls back to sorting by date.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	private function get_blaze_posts_local( $req ) {
		// Default and maximum posts per page for this function.
		$default_posts_per_page = 20;

		// Parse request parameters.
		$page           = absint( $req->get_param( 'page' ) ?? 1 );
		$posts_per_page = absint( $req->get_param( 'posts_per_page' ) ?? $default_posts_per_page );
		$order          = $req->get_param( 'order' ) ?? 'DESC';
		$order_by       = $req->get_param( 'order_by' ) ?? 'date';
		$post_types     = $req->get_param( 'filter_post_type' ) ?? implode( ',', $this->get_blazable_post_types() );
		$title          = strtolower( sanitize_text_field( $req->get_param( 'title' ) ?? '' ) );

		// Sanitize and validate post types.
		$post_type_list = $this->sanitize_post_type( $post_types );

		// Validate page parameter.
		if ( $page < 1 ) {
			$page = 1;
		}

		// Validate post per page parameter (use default value if invalid)
		if ( $posts_per_page <= 0 || $posts_per_page > $default_posts_per_page ) {
			$posts_per_page = $default_posts_per_page;
		}

		// Validate order.
		$order = in_array( strtoupper( $order ), array( 'ASC', 'DESC' ), true ) ? strtoupper( $order ) : 'DESC';

		// Validate order_by - stats-related fields fall back to date (handled by WPCOM).
		$valid_order_by = array( 'post_title', 'type', 'date', 'modified', 'comment_count' );
		if ( ! in_array( $order_by, $valid_order_by, true ) ) {
			$order_by = 'date';
		}

		$args = array(
			'post_type'           => $post_type_list,
			'post_status'         => 'publish',
			'post_password'       => '',
			'posts_per_page'      => $posts_per_page,
			'paged'               => $page,
			'ignore_sticky_posts' => 1,
			'orderby'             => $order_by,
			'order'               => $order,
		);

		// Add title search filter if provided.
		$title_filter = null;
		if ( ! empty( $title ) ) {
			$title_filter = function ( $where ) use ( $title ) {
				global $wpdb;
				$title_like = '%' . $wpdb->esc_like( $title ) . '%';
				$where     .= $wpdb->prepare( " AND {$wpdb->posts}.post_title LIKE %s", $title_like );
				return $where;
			};
			add_filter( 'posts_where', $title_filter );
		}

		$query       = new \WP_Query( $args );
		$posts       = $query->get_posts();
		$total_pages = $query->max_num_pages;

		// Remove the title filter after query.
		if ( $title_filter !== null ) {
			remove_filter( 'posts_where', $title_filter );
		}

		// Format posts for the response.
		$formatted_posts = array();
		if ( $page <= $total_pages ) {
			foreach ( $posts as $post ) {
				$formatted_posts[] = $this->format_post_for_blaze( $post );
			}
		}

		// Add prices for WooCommerce products.
		if ( count( $formatted_posts ) > 0 ) {
			$formatted_posts = $this->add_prices_in_posts( $formatted_posts );
		}

		return array(
			'posts'         => $formatted_posts,
			'total_items'   => $query->found_posts,
			'post_title'    => $title,
			'page'          => $page,
			'total_pages'   => $total_pages,
			'stats_enabled' => $this->is_jetpack_module_active( 'stats' ),
			'likes_enabled' => $this->is_jetpack_module_active( 'likes' ),
			'tsp_eligible'  => $this->count_tsp_eligible_posts(),
		);
	}

	/**
	 * Format a post object for the Blaze API response.
	 *
	 * @param \WP_Post $post The post object.
	 * @return array Formatted post data.
	 */
	protected function format_post_for_blaze( $post ) {
		$featured_image_data = $this->get_post_featured_image( $post->ID );
		$featured_image      = $featured_image_data['URL'] ?? null;

		// Get SKU for WooCommerce products.
		$sku = get_post_meta( $post->ID, '_sku', true );

		return array(
			'ID'                 => $post->ID,
			'title'              => $post->post_title,
			'type'               => $post->post_type,
			'date'               => gmdate( 'c', strtotime( $post->post_date_gmt ) ),
			'modified'           => gmdate( 'c', strtotime( $post->post_modified_gmt ) ),
			'comment_count'      => (int) $post->comment_count,
			'like_count'         => -1, // Stats not available locally.
			'featured_image'     => $featured_image,
			'author'             => $post->post_author,
			'sku'                => $sku,
			'post_url'           => get_permalink( $post->ID ),
			'monthly_view_count' => -1, // Stats not available locally.
		);
	}

	/**
	 * Get the post types that are eligible for Blaze campaigns.
	 *
	 * @return array List of post type slugs.
	 */
	private function get_blazable_post_types() {
		return array( 'post', 'page', 'product' );
	}

	/**
	 * Sanitize and validate post types for Blaze.
	 *
	 * @param string $post_types Comma-separated list of post types.
	 * @return array Valid post types, or all blazable types if none valid.
	 */
	private function sanitize_post_type( $post_types ) {
		$blazable_post_types = $this->get_blazable_post_types();
		if ( ! is_string( $post_types ) ) {
			return $blazable_post_types;
		}
		$post_types     = sanitize_text_field( $post_types );
		$post_type_list = explode( ',', $post_types );

		$allowed_types = array();

		foreach ( $post_type_list as $post_type ) {
			if ( in_array( $post_type, $blazable_post_types, true ) ) {
				$allowed_types[] = $post_type;
			}
		}

		return count( $allowed_types )
			? $allowed_types
			: $blazable_post_types;
	}

	/**
	 * Check if a Jetpack module is active.
	 * Uses jetpack-status Modules class which handles WPCOM and self-hosted sites.
	 *
	 * @param string $module_name The module name (e.g., 'stats', 'likes').
	 * @return bool Whether the module is active.
	 */
	private function is_jetpack_module_active( $module_name ) {
		// Default to true if Modules class is unavailable (matches WPCOM behavior).
		if ( ! class_exists( '\Automattic\Jetpack\Modules' ) ) {
			return true;
		}
		$modules = new \Automattic\Jetpack\Modules();
		return $modules->is_active( $module_name );
	}

	/**
	 * Count posts eligible for TSP (has Gutenberg blocks).
	 * Matches WPCOM's count_tsp_eligible_posts implementation.
	 *
	 * @return bool Whether there are TSP eligible posts.
	 */
	private function count_tsp_eligible_posts() {
		$query = array(
			'posts_per_page'      => 1,
			'order'               => 'DESC',
			'orderby'             => 'date',
			'post_type'           => 'post',
			'post_status'         => array( 'publish' ),
			's'                   => '<!-- wp:',
			'fields'              => 'ids',
			'ignore_sticky_posts' => 1,
			'offset'              => 0,
		);

		$wp_query = new \WP_Query( $query );

		return (int) $wp_query->found_posts > 0;
	}

	/**
	 * Builds the subpath including the query string to be used in the DSP call
	 *
	 * @param array $params The request object parameters.
	 * @return string
	 */
	private function build_subpath_with_query_strings( $params ) {
		$sub_path = '';
		if ( isset( $params['sub_path'] ) ) {
			$sub_path = $params['sub_path'];
			unset( $params['sub_path'] );
		}

		if ( isset( $params['rest_route'] ) ) {
			unset( $params['rest_route'] );
		}

		if ( ! empty( $params ) ) {
			$sub_path = $sub_path . '?' . http_build_query( stripslashes_deep( $params ) );
		}

		return $sub_path;
	}

	/**
	 * Get Blaze posts for DSP
	 *
	 * Maps DSP parameters to blaze/posts format and reuses get_blaze_posts
	 * for consistent local/WPCOM routing logic.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_blaze_posts( $req ) {
		// Map DSP params → blaze params.
		$param_map = array(
			'title'            => $req->get_param( 'search' ),
			'filter_post_type' => $req->get_param( 'post_type' ),
			'posts_per_page'   => $req->get_param( 'limit' ),
			'page'             => $req->get_param( 'page' ),
			'order'            => $req->get_param( 'order' ),
			'order_by'         => $req->get_param( 'order_by' ),
		);

		// Create new request with transformed params (only non-null values).
		$blaze_req = new \WP_REST_Request( 'GET' );
		foreach ( $param_map as $key => $value ) {
			if ( $value !== null ) {
				$blaze_req->set_param( $key, $value );
			}
		}

		// Reuse get_blaze_posts (handles local/WPCOM routing).
		$response = $this->get_blaze_posts( $blaze_req );

		// Bail if we get an error.
		if ( is_wp_error( $response ) || $response instanceof \WP_REST_Response ) {
			return $response;
		}

		// Transform response to DSP format.
		return array(
			'results'    => $response['posts'] ?? array(),
			'total'      => $response['total_items'] ?? 0,
			'sync_ready' => $response['sync_ready'] ?? false,
		);
	}

	/**
	 * Redirect GET requests to WordAds DSP Blaze media endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_media( $req ) {
		$site_id = $this->get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return array();
		}
		return $this->get_dsp_generic( sprintf( 'v1/wpcom/sites/%d/media', $site_id ), $req );
	}

	/**
	 * Redirect POST requests to WordAds DSP Blaze media endpoint for the site.
	 *
	 * @return array|WP_Error
	 */
	public function upload_image_to_current_website() {
		$site_id = $this->get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return array( 'error' => $site_id->get_error_message() );
		}

		if ( empty( $_FILES['image'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
			return array( 'error' => 'File is missed' );
		}
		$file      = $_FILES['image']; // phpcs:ignore WordPress.Security.NonceVerification.Missing,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$temp_name = $file['tmp_name'] ?? ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		if ( ! $temp_name || ! is_uploaded_file( $temp_name ) ) {
			return array( 'error' => 'Specified file was not uploaded' );
		}

		// Getting the original file name.
		$filename = sanitize_file_name( basename( $file['name'] ) );
		// Upload contents to the Upload folder locally.
		$upload = wp_upload_bits(
			$filename,
			null,
			file_get_contents( $temp_name ) // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		);

		if ( ! empty( $upload['error'] ) ) {
			return array( 'error' => $upload['error'] );
		}

		// Check the type of file. We'll use this as the 'post_mime_type'.
		$filetype = wp_check_filetype( $filename, null );

		// Prepare an array of post data for the attachment.
		$attachment = array(
			'guid'           => wp_upload_dir()['url'] . '/' . $filename,
			'post_mime_type' => $filetype['type'],
			'post_title'     => preg_replace( '/\.[^.]+$/', '', $filename ),
			'post_content'   => '',
			'post_status'    => 'inherit',
		);

		// Insert the attachment.
		$attach_id = wp_insert_attachment( $attachment, $upload['file'] );

		// Make sure wp_generate_attachment_metadata() has all requirement dependencies.
		require_once ABSPATH . 'wp-admin/includes/image.php';

		// Generate the metadata for the attachment, and update the database record.
		$attach_data = wp_generate_attachment_metadata( $attach_id, $upload['file'] );
		// Store metadata in the local DB.
		wp_update_attachment_metadata( $attach_id, $attach_data );

		return array( 'url' => $upload['url'] );
	}

	/**
	 * Redirect GET requests to WordAds DSP Blaze openverse endpoint.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_openverse( $req ) {
		return $this->get_dsp_generic( 'v1/wpcom/media', $req );
	}

	/**
	 * Redirect GET requests to WordAds DSP Credits endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_credits( $req ) {
		return $this->get_dsp_generic( 'v1/credits', $req );
	}

	/**
	 * Redirect GET requests to WordAds DSP Experiments endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_experiments( $req ) {
		return $this->get_dsp_generic( 'v1/experiments', $req );
	}

	/**
	 * Redirect GET requests to WordAds DSP Campaigns endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_campaigns( $req ) {
		$version = $req->get_param( 'api_version' ) ?? 'v1';
		return $this->get_dsp_generic( "{$version}/campaigns", $req );
	}

	/**
	 * Redirect GET requests to WordAds DSP Site Campaigns endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_site_campaigns( $req ) {
		$site_id = $this->get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return array();
		}

		return $this->get_dsp_generic( sprintf( 'v1/sites/%d/campaigns', $site_id ), $req );
	}

	/**
	 * Redirect GET requests to WordAds DSP Stats endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 *
	 * @return array|WP_Error
	 */
	public function get_dsp_stats( $req ) {
		$version = $req->get_param( 'api_version' ) ?? 'v1';
		return $this->get_dsp_generic( "{$version}/stats", $req );
	}

	/**
	 * Redirect POST requests to WordAds DSP Stats endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 *
	 * @return array|WP_Error
	 */
	public function edit_dsp_stats( $req ) {
		$version = $req->get_param( 'api_version' ) ?? 'v1';
		return $this->edit_dsp_generic( "{$version}/stats", $req );
	}

	/**
	 * Redirect GET requests to WordAds DSP Search endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_search( $req ) {
		return $this->get_dsp_generic( 'v1/search', $req );
	}

	/**
	 * Redirect GET requests to WordAds DSP User endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_user( $req ) {
		return $this->get_dsp_generic( 'v1/user', $req );
	}

	/**
	 * Redirect GET requests to the WordAds DSP Templates Article endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_templates_article( $req ) {
		$urn = $req->get_param( 'urn' ) ?? '';

		$sync_ready = $this->are_posts_ready();

		$response = $sync_ready ?
			$this->get_dsp_generic( 'v1/templates/article/' . $urn, $req ) :
			$this->get_dsp_templates_article_local( $urn, $req );

		if ( ! is_wp_error( $response ) && is_array( $response ) ) {
			$response['sync_ready'] = $sync_ready;
		}

		return $response;
	}

	/**
	 * Get the article information to be used in the Blaze create campaign flow.
	 *
	 * If Jetpack Sync is not yet complete and posts are not fully synced, this endpoint will read local DB data and provide additional information to the WPCOM endpoint.
	 *
	 * @param string          $urn The request urn.
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_templates_article_local( $urn, $req ) {
		$parsed_urn = $this->get_data_from_urn( $urn );
		$site_id    = $this->get_site_id();

		if ( is_wp_error( $site_id ) ) {
			return array();
		}

		if ( ! $parsed_urn['site_id'] || $parsed_urn['site_id'] !== $site_id ) {
			return $this->get_forbidden_error();
		}

		$post = get_post( $parsed_urn['post_id'] );
		if ( ! $post ) {
			return new WP_Error( 'post_not_found', esc_html__( 'Post not found', 'jetpack-blaze' ), array( 'status' => 404 ) );
		}

		// Generates the attachments object
		$post_attachments = get_attached_media( 'image', $post->ID );
		$attachments      = array();

		foreach ( $post_attachments as $attachment ) {
			$attachment_url = wp_get_attachment_url( $attachment->ID );
			$metadata       = wp_get_attachment_metadata( $attachment->ID );

			// Skip attachment if some of the required data is missing
			if ( ! $attachment_url || ! $metadata || ! isset( $metadata['width'] ) || ! isset( $metadata['height'] ) ) {
				continue;
			}

			$attachments[ $attachment->ID ] = array(
				'ID'        => $attachment->ID,
				'URL'       => $attachment_url,
				'mime_type' => $attachment->post_mime_type,
				'width'     => $metadata['width'],
				'height'    => $metadata['height'],
			);
		}

		$body = array(
			'widget_origin' => $req->get_param( 'widget_origin' ),
			'wp_post'       => array(
				'ID'             => $post->ID,
				'title'          => $post->post_title,
				'excerpt'        => $post->post_excerpt,
				'URL'            => get_permalink( $post ),
				'type'           => $post->post_type,
				'content'        => $post->post_content,
				'post_thumbnail' => $this->get_post_featured_image( $post->ID ),
				'attachments'    => (object) $attachments,
			),
		);

		return $this->request_as_user(
			sprintf( '/sites/%d/wordads/dsp/api/v1/templates/article/%s', $site_id, $urn ),
			'v2',
			array( 'method' => 'POST' ),
			$body
		);
	}

	/**
	 * Redirect GET requests to the WordAds DSP Templates Advise Campaign endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_templates_advise_campaign( $req ) {
		$urn = $req->get_param( 'urn' ) ?? '';

		$sync_ready = $this->are_posts_ready();

		$response = $sync_ready ?
			$this->get_dsp_generic( 'v1/templates/advise/campaign/' . $urn, $req ) :
			$this->get_dsp_advise_campaign_local( $urn );

		if ( ! is_wp_error( $response ) && is_array( $response ) ) {
			$response['sync_ready'] = $sync_ready;
		}

		return $response;
	}

	/**
	 * Get the advise campaign information to be used in the Blaze create campaign flow.
	 *
	 * If Jetpack Sync still is running, this endpoint will read local DB data and provide additional information to the WPCOM endpoint.
	 *
	 * @param string $urn The request urn.
	 * @return array|WP_Error
	 */
	public function get_dsp_advise_campaign_local( $urn ) {
		$parsed_urn = $this->get_data_from_urn( $urn );
		$site_id    = $this->get_site_id();

		if ( is_wp_error( $site_id ) ) {
			return array();
		}

		if ( ! $parsed_urn['site_id'] || $parsed_urn['site_id'] !== $site_id ) {
			return $this->get_forbidden_error();
		}

		$post = get_post( $parsed_urn['post_id'] );
		if ( ! $post ) {
			return new WP_Error( 'post_not_found', esc_html__( 'Post not found', 'jetpack-blaze' ), array( 'status' => 404 ) );
		}

		$rendered_content = apply_filters( 'the_content', $post->post_content );

		$body = array(
			'wp_post' => array(
				'ID'      => $post->ID,
				'title'   => $post->post_title,
				'URL'     => get_permalink( $post ),
				'type'    => $post->post_type,
				'content' => $rendered_content,
			),
		);

		return $this->request_as_user(
			sprintf( '/sites/%d/wordads/dsp/api/v1/advise/campaign/%s', $site_id, $urn ),
			'v2',
			array( 'method' => 'POST' ),
			$body
		);
	}

	/**
	 * Redirect GET requests to the WordAds DSP Templates endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_templates( $req ) {
		return $this->get_dsp_generic( 'v1/templates', $req );
	}

	/**
	 * Redirect GET requests to the WordAds DSP Advise Campaign endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_advise_campaign( $req ) {
		$urn = $req->get_param( 'urn' ) ?? '';

		$sync_ready = $this->are_posts_ready();

		$response = $sync_ready ?
			$this->get_dsp_generic( 'v1/advise/campaign/' . $urn, $req ) :
			$this->get_dsp_advise_campaign_local( $urn );

		if ( ! is_wp_error( $response ) && is_array( $response ) ) {
			$response['sync_ready'] = $sync_ready;
		}

		return $response;
	}

	/**
	 * Redirect GET requests to the WordAds DSP Advise endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_advise( $req ) {
		return $this->get_dsp_generic( 'v1/advise', $req );
	}

	/**
	 * Redirect GET requests to WordAds DSP Subscriptions endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_subscriptions( $req ) {
		return $this->get_dsp_generic( 'v1/subscriptions', $req );
	}

	/**
	 * Redirect GET requests to WordAds DSP Payments endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_payments( $req ) {
		$version = $req->get_param( 'api_version' ) ?? 'v1';
		return $this->get_dsp_generic( "{$version}/payments", $req );
	}

	/**
	 * Redirect GET requests to WordAds DSP Subscriptions endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_smart( $req ) {
		return $this->get_dsp_generic( 'v1/smart', $req );
	}

	/**
	 * Redirect GET requests to WordAds DSP Locations endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_locations( $req ) {
		return $this->get_dsp_generic( 'v1/locations', $req );
	}

	/**
	 * Redirect GET requests to WordAds DSP Woo endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_woo( $req ) {
		return $this->get_dsp_generic( 'v1/woo', $req );
	}

	/**
	 * Redirect GET requests to WordAds DSP Countries endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_image( $req ) {
		return $this->get_dsp_generic( 'v1/image', $req );
	}

	/**
	 * Redirect GET requests to WordAds DSP for the site.
	 *
	 * @param String          $path The Root API endpoint.
	 * @param WP_REST_Request $req The request object.
	 * @param array           $args Request arguments.
	 * @return array|WP_Error
	 */
	public function get_dsp_generic( $path, $req, $args = array() ) {
		$site_id = $this->get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return array();
		}

		return $this->request_as_user(
			sprintf( '/sites/%d/wordads/dsp/api/%s%s', $site_id, $path, $this->build_subpath_with_query_strings( $req->get_params() ) ),
			'v2',
			array_merge(
				$args,
				array( 'method' => 'GET' )
			)
		);
	}

	/**
	 * Redirect POST/PUT/PATCH requests to WordAds DSP WPCOM Checkout endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function edit_wpcom_checkout( $req ) {
		return $this->edit_dsp_generic( 'v1/wpcom/checkout', $req, array( 'timeout' => 60 ) );
	}

	/**
	 * Redirect POST request to WordAds DSP Create Campaign endpoint for the site.
	 *
	 * If Jetpack Sync is not yet complete and posts are not fully synced, this endpoint will read local DB data and provide additional information to the WPCOM endpoint.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function create_dsp_campaigns( $req ) {
		$sync_ready = $this->are_posts_ready();

		$response = $sync_ready ?
			$this->edit_dsp_generic( 'v1.1/campaigns', $req, array( 'timeout' => 60 ) ) :
			$this->create_dsp_campaigns_local( $req );

		if ( ! is_wp_error( $response ) && is_array( $response ) ) {
			$response['sync_ready'] = $sync_ready;
		}

		return $response;
	}

	/**
	 * Sends a create campaign request to the WordAds DSP Create Campaign endpoint.
	 * Includes additional Post information to the original request.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function create_dsp_campaigns_local( $req ) {
		$site_id = $this->get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return array();
		}

		$request_body = $req->get_json_params();
		if ( ! is_array( $request_body ) ) {
			return new WP_Error( 'invalid_json', esc_html__( 'Invalid JSON Body', 'jetpack-blaze' ), array( 'status' => 400 ) );
		}

		if ( ! isset( $request_body['target_urn'] ) ) {
			return new WP_Error( 'missing_target_urn', esc_html__( 'Missing target_urn in request body', 'jetpack-blaze' ), array( 'status' => 400 ) );
		}

		$urn        = $request_body['target_urn'];
		$parsed_urn = $this->get_data_from_urn( $urn );

		if ( ! $parsed_urn['site_id'] || $parsed_urn['site_id'] !== $site_id ) {
			return $this->get_forbidden_error();
		}

		$post = get_post( $parsed_urn['post_id'] );
		if ( ! $post ) {
			return new WP_Error( 'post_not_found', esc_html__( 'Post not found', 'jetpack-blaze' ), array( 'status' => 404 ) );
		}

		$featured_image = $this->get_post_featured_image( $post->ID );

		$body = array_merge(
			$request_body,
			array(
				'wp_post' => array(
					'ID'             => $post->ID,
					'title'          => $post->post_title,
					'URL'            => get_permalink( $post ),
					'type'           => $post->post_type,
					'content'        => $post->post_content,
					'featured_image' => $featured_image['URL'] ?? '',
					'modified'       => $post->post_modified,
				),
			)
		);

		return $this->request_as_user(
			sprintf( '/sites/%d/wordads/dsp/api/v1.1/campaigns', $site_id ),
			'v2',
			array(
				'method'  => 'POST',
				'timeout' => 60,
			),
			$body
		);
	}

	/**
	 * Redirect POST/PUT/PATCH requests to WordAds DSP Campaigns endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function edit_dsp_campaigns( $req ) {
		$version = $req->get_param( 'api_version' ) ?? 'v1';
		return $this->edit_dsp_generic( "{$version}/campaigns", $req, array( 'timeout' => 60 ) );
	}

	/**
	 * Redirect POST/PUT/PATCH requests to WordAds DSP Subscriptions endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function edit_dsp_subscriptions( $req ) {
		return $this->edit_dsp_generic( 'v1/subscriptions', $req, array( 'timeout' => 20 ) );
	}

	/**
	 * Redirect POST/PUT/PATCH requests to WordAds DSP Payments endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function edit_dsp_payments( $req ) {
		$version = $req->get_param( 'api_version' ) ?? 'v1';
		return $this->edit_dsp_generic( "{$version}/payments", $req, array( 'timeout' => 20 ) );
	}

	/**
	 * Redirect POST/PUT/PATCH requests to WordAds DSP Logs endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function edit_dsp_logs( $req ) {
		return $this->edit_dsp_generic( 'v1/logs', $req );
	}

	/**
	 * Redirect POST/PUT/PATCH requests to WordAds DSP Smart endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function edit_dsp_smart( $req ) {
		return $this->edit_dsp_generic( 'v1/smart', $req );
	}

	/**
	 * Redirect POST/PUT/PATCH requests to WordAds DSP for the site.
	 *
	 * @param String          $path The Root API endpoint.
	 * @param WP_REST_Request $req The request object.
	 * @param array           $args Request arguments.
	 * @return array|WP_Error
	 */
	public function edit_dsp_generic( $path, $req, $args = array() ) {
		$site_id = $this->get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return array();
		}

		return $this->request_as_user(
			sprintf( '/sites/%d/wordads/dsp/api/%s%s', $site_id, $path, $req->get_param( 'sub_path' ) ),
			'v2',
			array_merge(
				$args,
				array( 'method' => $req->get_method() )
			),
			$req->get_body()
		);
	}

	/**
	 * Will check the posts for prices and add them to the posts array
	 *
	 * @param array $posts The posts object.
	 * @return array The list posts with the price on them (if they are woo products).
	 */
	protected function add_prices_in_posts( $posts ) {

		if ( ! function_exists( 'wc_get_product' ) ||
			! function_exists( 'wc_get_price_decimal_separator' ) ||
			! function_exists( 'wc_get_price_thousand_separator' ) ||
			! function_exists( 'wc_get_price_decimals' ) ||
			! function_exists( 'get_woocommerce_price_format' ) ||
			! function_exists( 'get_woocommerce_currency_symbol' )
		) {
			return $posts;
		}

		foreach ( $posts as $key => $item ) {
			if ( ! isset( $item['ID'] ) ) {
				$posts[ $key ]['price'] = '';
				continue;
			}
			$product = wc_get_product( $item['ID'] );
			if ( ! $product || ! $product instanceof WC_Product ) {
				$posts[ $key ]['price'] = '';
			} else {
				$price              = $product->get_price();
				$decimal_separator  = wc_get_price_decimal_separator();
				$thousand_separator = wc_get_price_thousand_separator();
				$decimals           = wc_get_price_decimals();
				$price_format       = get_woocommerce_price_format();
				$currency_symbol    = get_woocommerce_currency_symbol();

				// Convert to float to avoid issues on PHP 8.
				$price           = (float) $price;
				$negative        = $price < 0;
				$price           = $negative ? $price * -1 : $price;
				$price           = number_format( $price, $decimals, $decimal_separator, $thousand_separator );
				$formatted_price = sprintf( $price_format, $currency_symbol, $price );

				$posts[ $key ]['price'] = html_entity_decode( $formatted_price, ENT_COMPAT );
			}
		}
		return $posts;
	}

	/**
	 * Queries the WordPress.com REST API with a user token.
	 *
	 * @param String            $path The API endpoint relative path.
	 * @param String            $version The API version.
	 * @param array             $args Request arguments.
	 * @param null|String|array $body Request body.
	 * @param String            $base_api_path (optional) the API base path override, defaults to 'rest'.
	 * @param bool              $use_cache (optional) default to true.
	 * @return array|string|WP_Error|\WP_REST_Response $response Data.
	 */
	protected function request_as_user( $path, $version = '2', $args = array(), $body = null, $base_api_path = 'wpcom', $use_cache = false ) {
		// Arrays are serialized without considering the order of objects, but it's okay atm.
		$cache_key = 'BLAZE_REST_RESP_' . md5( implode( '|', array( $path, $version, wp_json_encode( $args, JSON_UNESCAPED_SLASHES ), wp_json_encode( $body, JSON_UNESCAPED_SLASHES ), $base_api_path ) ) );

		if ( $use_cache ) {
			$response_body_content = get_transient( $cache_key );
			if ( false !== $response_body_content ) {
				return json_decode( $response_body_content, true );
			}
		}

		$response = Client::wpcom_json_api_request_as_user(
			$path,
			$version,
			$args,
			$body,
			$base_api_path
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$response_code         = wp_remote_retrieve_response_code( $response );
		$response_body_content = wp_remote_retrieve_body( $response );
		$content_type          = $response['headers']['content-type'] ?? '';

		if ( str_starts_with( $content_type, 'text/csv' ) ) {
			return $response_body_content;
		}

		$response_body = json_decode( $response_body_content, true );

		if ( 200 !== $response_code ) {
			return $this->get_blaze_error( $response_body, $response_code );
		}

		// Cache the successful JSON response for 5 minutes.
		set_transient( $cache_key, $response_body_content, 5 * MINUTE_IN_SECONDS );
		return $response_body;
	}

	/**
	 * Return a WP_Error object with a forbidden error.
	 */
	protected function get_forbidden_error() {
		$error_msg = esc_html__(
			'You are not allowed to perform this action.',
			'jetpack-blaze'
		);

		return new WP_Error( 'rest_forbidden', $error_msg, array( 'status' => rest_authorization_required_code() ) );
	}

	/**
	 * Build error object from remote response body and status code.
	 *
	 * @param array $response_body Remote response body.
	 * @param int   $response_code Http response code.
	 * @return \WP_REST_Response
	 */
	protected function get_blaze_error( $response_body, $response_code = 500 ) {
		if ( ! is_array( $response_body ) ) {
			$response_body = array(
				'errorMessage' => $response_body,
			);
		}

		$error_code = 'remote-error';
		foreach ( array( 'code', 'error' ) as $error_code_key ) {
			if ( isset( $response_body[ $error_code_key ] ) ) {
				$error_code = $response_body[ $error_code_key ];
				break;
			}
		}

		$response_body['code']         = $error_code;
		$response_body['status']       = $response_code;
		$response_body['errorMessage'] = $response_body['errorMessage'] ?? 'Unknown remote error';

		return new \WP_REST_Response( $response_body, $response_code );
	}

	/**
	 * Check if the current user is connected.
	 * On WordPress.com Simple, it is always connected.
	 *
	 * @return true
	 */
	private function is_user_connected() {
		if ( ( new Host() )->is_wpcom_simple() ) {
			return true;
		}

		return $this->connection->is_connected() && $this->connection->is_user_connected();
	}

	/**
	 * Get the site ID.
	 *
	 * @return int|WP_Error
	 */
	private function get_site_id() {
		return Connection_Manager::get_site_id();
	}

	/**
	 * Check if the Health status code is sync.
	 *
	 * @return bool True if is sync, false otherwise.
	 */
	private function are_posts_ready(): bool {
		// On WordPress.com Simple, Sync is not present, so we consider always ready.
		if ( ( new Host() )->is_wpcom_simple() ) {
			return true;
		}

		return Health::STATUS_IN_SYNC === Health::get_status();
	}

	/**
	 * Get the featured image data for a post.
	 *
	 * @param int $post_id The post ID.
	 *
	 * @return null|array {
	 *     Featured image data, or null if no featured image exists.
	 *
	 *     @type int    $ID        The attachment ID.
	 *     @type string $URL       The image URL.
	 *     @type int    $width     The image width in pixels.
	 *     @type int    $height    The image height in pixels.
	 *     @type string $mime_type The image mime type (e.g., 'image/jpeg').
	 * }
	 */
	private function get_post_featured_image( $post_id ) {
		$thumbnail_id = get_post_thumbnail_id( $post_id );
		if ( ! $thumbnail_id ) {
			return null;
		}

		$image_src = wp_get_attachment_image_src( $thumbnail_id, 'full' );
		if ( ! $image_src ) {
			return null;
		}

		return array(
			'ID'        => $thumbnail_id,
			'URL'       => $image_src[0],
			'width'     => $image_src[1],
			'height'    => $image_src[2],
			'mime_type' => get_post_mime_type( $thumbnail_id ),
		);
	}

	/**
	 * Extract site ID and post ID from a WordPress.com URN.
	 *
	 * Parses a URN in the format "urn:wpcom:post:SITE_ID:POST_ID" and returns
	 * an associative array containing the site ID and post ID components.
	 *
	 * @param string $urn The URN string to parse (e.g., "urn:wpcom:post:12345:67890").
	 * @return array {
	 *     Associative array containing the parsed URN components.
	 *
	 *     @type int $site_id The WordPress.com site ID.
	 *     @type int $post_id The post ID.
	 * }
	 */
	private function get_data_from_urn( $urn ) {
		$default = array(
			'site_id' => 0,
			'post_id' => 0,
		);

		if ( empty( $urn ) ) {
			return $default;
		}

		$urn_parts = explode( ':', $urn );

		if ( count( $urn_parts ) < 5 ) {
			return $default;
		}

		$site_id = (int) $urn_parts[3];
		$post_id = (int) $urn_parts[4];

		return array(
			'site_id' => $site_id,
			'post_id' => $post_id,
		);
	}
}
