<?php
/**
 * Blogging prompts endpoint for wpcom/v3.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Client;

/**
 * REST API endpoint wpcom/v3/sites/%s/blogging-prompts.
 */
class WPCOM_REST_API_V3_Endpoint_Blogging_Prompts extends WP_REST_Posts_Controller {
	const TEMPLATE_BLOG_ID = 205876834;

	/**
	 * Whether the endpoint is running on wpcom, or not.
	 *
	 * @var bool
	 */
	public $is_wpcom;

	/**
	 * Day of the year, from 1 to 366, and 0 representing no query.
	 *
	 * Used with yearless dates like `--12-20`, to get prompts by month and day, regardless of year.
	 *
	 * @var integer
	 */
	public $day_of_year_query = 0;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->post_type                       = 'post';
		$this->namespace                       = 'wpcom/v3';
		$this->rest_base                       = 'blogging-prompts';
		$this->wpcom_is_wpcom_only_endpoint    = true;
		$this->wpcom_is_site_specific_endpoint = true;
		$this->is_wpcom                        = defined( 'IS_WPCOM' ) && IS_WPCOM;

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Registers the routes for blogging prompts.
	 *
	 * @see register_rest_route()
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => $this->get_collection_params(),
				),
				'schema' => array( $this, 'get_item_schema' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)',
			array(
				'args'   => array(
					'id' => array(
						'description' => __( 'Unique identifier for the prompt.', 'jetpack' ),
						'type'        => 'integer',
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
				'schema' => array( $this, 'get_item_schema' ),
			)
		);
	}

	/**
	 * Retrieves a collection of blogging prompts.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		if ( ! $this->is_wpcom ) {
			return $this->proxy_request_to_wpcom( $request );
		}

		switch_to_blog( self::TEMPLATE_BLOG_ID );
		add_action( 'pre_get_posts', array( $this, 'modify_query' ) );
		add_filter( 'posts_clauses', array( $this, 'filter_sql' ) );
		$items = parent::get_items( $request );
		remove_filter( 'posts_clauses', array( $this, 'filter_sql' ) );
		remove_action( 'pre_get_posts', array( $this, 'modify_query' ) );
		restore_current_blog();

		return $items;
	}

	/**
	 * Retrieves a single blogging prompt.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) {
		if ( ! $this->is_wpcom ) {
			return $this->proxy_request_to_wpcom( $request, $request->get_param( 'id' ) );
		}

		switch_to_blog( self::TEMPLATE_BLOG_ID );
		$item = parent::get_item( $request );
		restore_current_blog();

		return $item;
	}

	/**
	 * Modify the posts query using the {@see 'pre_get_posts'} hook.
	 *
	 * @param WP_Query $wp_query The WP_Query instance (passed by reference).
	 */
	public function modify_query( &$wp_query ) {
		if ( is_array( $wp_query->query_vars['date_query'] ) ) {
			$wp_query->query_vars['date_query'] = array_map(
				array( $this, 'map_date_query' ),
				$wp_query->query_vars['date_query']
			);
		}
	}

	/**
	 * Modify date_query items when querying prompts.
	 *
	 * @link https://developer.wordpress.org/reference/classes/WP_Query/#date-parameters
	 *
	 * @param  array|string|null $date_query Date query.
	 * @return array|string|null             Modified date query.
	 */
	public function map_date_query( $date_query ) {
		if ( isset( $date_query['after'] ) ) {
			// `after` date queries should include posts on the specified date, so force `inclusive` queries.
			$date_query['inclusive'] = true;

			// If using a "year-less" date, e.g. `--03-16`, override the date_query, and prepare to modify sql manually.
			// `after` should be a date string when making API requests, rather than an array.
			if ( is_string( $date_query['after'] ) && 0 === strpos( $date_query['after'], '-' ) ) {
				$date = date_create_from_format( '--m-d', $date_query['after'] );

				if ( false !== $date ) {
					// PHP day of the year starts with 0; normalize to match SQL DAYOFTHEYEAR which starts with 1.
					$this->day_of_year_query = $date->format( 'z' ) + 1;

					// Unset the date query, since we'll by modifying the SQL manually.
					return null;
				}
			}
		}

		return $date_query;
	}

	/**
	 * Modify post sql for custom date ordering using the {@see 'posts_clauses'} hook.
	 *
	 * @param array $clauses SQL clauses for the current query.
	 * @return array         Modified SQL clauses.
	 */
	public function filter_sql( $clauses ) {
		global $wpdb;
		if ( $this->day_of_year_query > 0 ) {
			$day = $this->day_of_year_query;

			// Grab the current sort order, `ASC` or `DESC`, so we can reuse it.
			$order = end( explode( ' ', $clauses['orderby'] ) );

			// Order posts regardless of year: get a list of posts for each day,
			// starting with the query date through the end of the year, then from the start of the year through the day before.
			$orderby = $wpdb->prepare(
				'CASE ' .
					"WHEN DAYOFYEAR({$wpdb->posts}.post_date) < %d " .
					// Push posts from the beginning of the year until the day before to the end.
					"THEN DAYOFYEAR({$wpdb->posts}.post_date) + 366 " .
					// Otherwise order posts from the query date through the end of the year.
					"ELSE DAYOFYEAR({$wpdb->posts}.post_date) " .
				'END' .
				// Sort posts for the same day by year, in asc or desc order.
				// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- order string cannot be escaped.
				", YEAR({$wpdb->posts}.post_date) " . ( 'DESC' === $order ? 'DESC' : 'ASC' ),
				$day
			);

			$clauses['orderby'] = $orderby;
		}

		return $clauses;
	}

	/**
	 * Prepares a single blogging prompt output for response.
	 *
	 * @param WP_Post         $prompt  Post object.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response        Response object.
	 */
	public function prepare_item_for_response( $prompt, $request ) {
		require_once WP_CONTENT_DIR . '/lib/blogging-prompts/answers.php';
		require_once WP_CONTENT_DIR . '/lib/blogging-prompts/utils.php';

		$fields = $this->get_fields_for_response( $request );

		// Base fields for every post.
		$data = array();

		if ( rest_is_field_included( 'id', $fields ) ) {
			$data['id'] = $prompt->ID;
		}

		if ( rest_is_field_included( 'date', $fields ) ) {
			$data['date'] = $this->prepare_date_response( $prompt->post_date_gmt );
		}

		if ( rest_is_field_included( 'text', $fields ) ) {
			$text = \BloggingPrompts\prompt_without_blocks( $prompt->post_content );
			// Allow translating a variable, since this text is imported from bloggingpromptstemplates.wordpress.com for translation.
			$translated_text = __( $text, 'jetpack' ); // phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText
			$data['text']    = wp_kses( $translated_text, wp_kses_allowed_html( 'post' ) );
		}

		if ( rest_is_field_included( 'attribution', $fields ) ) {
			$data['attribution'] = esc_html( get_post_meta( $prompt->ID, 'blogging_prompts_attribution', true ) );
		}

		if ( rest_is_field_included( 'answered', $fields ) ) {
			$data['answered'] = (bool) \A8C\BloggingPrompts\Answers::is_answered_by_user( $prompt->ID, get_current_user_id() );
		}

		if ( rest_is_field_included( 'answered_users_count', $fields ) ) {
			$data['answered_users_count'] = (int) \A8C\BloggingPrompts\Answers::get_count( $prompt->ID );
		}

		if ( rest_is_field_included( 'answered_users_sample', $fields ) ) {
			$data['answered_users_sample'] = $this->build_answering_users_sample( $prompt->ID );
		}

		return $data;
	}

	/**
	 * Format a date for a blogging prompt, omiting the time.
	 *
	 * @param string $date_gmt Publish datetime of the prompt in GMT, i.e. 0000-00-00 00:00:00.
	 * @param string $date     Publish datetime of the prompt, i.e. 0000-00-00 00:00:00.
	 * @return string Publish date of the prompt in YYYY-MM-DD format.
	 */
	public function prepare_date_response( $date_gmt, $date = null ) {
		$post_date = $date ? $date : $date_gmt;
		$date_obj  = date_create( $post_date );

		return false !== $date_obj ? $date_obj->format( 'Y-m-d' ) : substr( $post_date, 0, 10 );
	}

	/**
	 * Retrieves the query params for blogging prompt collections.
	 *
	 * @return array Query parameters for the collection.
	 */
	public function get_collection_params() {
		$parent_args = parent::get_collection_params();

		$args = array(
			// Modify date args so that will except a YYYY-MM-DD without a time.
			'after'  => array(
				'description'       => __( 'Show prompts following a given date.', 'jetpack' ),
				'type'              => 'string',
				'validate_callback' => function ( $param ) {
					// Allow month and date without year, e.g. `--02-28`
					if ( strpos( $param, '-' ) === 0 ) {
						return false !== date_create_from_format( '--m-d', $param );
					}

					return false !== date_create( $param );
				},
			),
			'before' => array(
				'description'       => __( 'Show prompts before a given date.', 'jetpack' ),
				'type'              => 'string',
				'validate_callback' => function ( $param ) {
					return false !== date_create( $param );
				},
			),
		);

		$args['categories']         = $parent_args['categories'];
		$args['categories_exclude'] = $parent_args['categories_exclude'];
		$args['exclude']            = $parent_args['exclude'];
		$args['include']            = $parent_args['include'];
		$args['page']               = $parent_args['page'];
		$args['per_page']           = $parent_args['per_page'];
		$args['order']              = $parent_args['order'];
		$args['order']['default']   = 'asc';
		$args['orderby']            = $parent_args['orderby'];
		$args['search']             = $parent_args['search'];

		return $args;
	}

	/**
	 * Retrieves the blogging prompt's schema, conforming to JSON Schema.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'blogging-prompt',
			'type'       => 'object',
			'properties' => array(
				'id'                    => array(
					'description' => __( 'Unique identifier for the post.', 'jetpack' ),
					'type'        => 'integer',
				),
				'date'                  => array(
					'description' => __( "The date the post was published, in the site's timezone.", 'jetpack' ),
					'type'        => 'string',
				),
				'text'                  => array(
					'description' => __( 'The text of the prompt. May include html tags like <em>.', 'jetpack' ),
					'type'        => 'string',
				),
				'attribution'           => array(
					'description' => __( 'Source of the prompt, if known.', 'jetpack' ),
					'type'        => 'string',
				),
				'answered'              => array(
					'description' => __( 'Whether the user has answered the prompt.', 'jetpack' ),
					'type'        => 'boolean',
				),
				'answered_users_count'  => array(
					'description' => __( 'Number of users who have answered the prompt.', 'jetpack' ),
					'type'        => 'integer',
				),
				'answered_users_sample' => array(
					'description' => __( 'Sample of users who have answered the prompt.', 'jetpack' ),
					'type'        => 'array',
					'items'       => array(
						'type'       => 'object',
						'properties' => array(
							'avatar' => array(
								'description' => __( "Gravatar URL for the user's avatar image.", 'jetpack' ),
								'type'        => 'string',
								'format'      => 'uri',
							),
						),
					),
				),
			),
		);
	}

	/**
	 * Checks if a given request has access to read blogging prompts for a site.
	 *
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function permissions_check() {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error(
				'rest_cannot_read_prompts',
				__( 'Sorry, you are not allowed to access blogging prompts on this site.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Proxy request to wpcom servers for the site and user.
	 *
	 * @param  WP_Rest_Request $request Request to proxy.
	 * @param  string          $path    Path to append to the rest base.
	 * @return mixed|WP_Error           Response from wpcom servers or an error.
	 */
	public function proxy_request_to_wpcom( $request, $path = '' ) {
		$blog_id  = \Jetpack_Options::get_option( 'id' );
		$path     = '/sites/' . rawurldecode( $blog_id ) . '/' . rawurldecode( $this->rest_base ) . ( $path ? '/' . rawurldecode( $path ) : '' );
		$api_url  = add_query_arg( $request->get_query_params(), $path );
		$response = Client::wpcom_json_api_request_as_user( $api_url, '3' );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$response_status = wp_remote_retrieve_response_code( $response );
		$response_body   = json_decode( wp_remote_retrieve_body( $response ) );

		if ( $response_status >= 400 ) {
			$code    = isset( $response_body->code ) ? $response_body->code : 'unknown_error';
			$message = isset( $response_body->message ) ? $response_body->message : __( 'An unknown error occurred.', 'jetpack' );
			return new WP_Error( $code, $message, array( 'status' => $response_status ) );
		}

		return $response_body;
	}

	/**
	 * Creates a sample of users who have answered a blogging prompt.
	 *
	 * @param int $prompt_id Prompt ID.
	 * @return array List of users, including a gravatar url for each user.
	 */
	protected function build_answering_users_sample( $prompt_id ) {
		$results = A8C\BloggingPrompts\Answers::get_sample_users_by( $prompt_id );

		if ( ! $results ) {
			return array();
		}

		$users = array();

		foreach ( $results as $user ) {
			$url = wpcom_get_avatar_url( $user->user_id, 96, 'identicon', false );
			if ( has_gravatar( $user->user_id ) && ! empty( $url[0] ) && ! is_wp_error( $url[0] ) ) {
				$users[] = array(
					'avatar' => (string) esc_url_raw( htmlspecialchars_decode( $url[0], ENT_COMPAT ) ),
				);
			}
		}

		return array_slice( $users, 0, 3 );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V3_Endpoint_Blogging_Prompts' );
