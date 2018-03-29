<?php
/**
 * Jetpack Search: Main Jetpack_Search class
 *
 * @package    Jetpack
 * @subpackage Jetpack Search
 * @since      5.0.0
 */

/**
 * The main class for the Jetpack Search module.
 *
 * @since 5.0.0
 */
class Jetpack_Search {

	/**
	 * The number of found posts.
	 *
	 * @since 5.0.0
	 *
	 * @var int
	 */
	protected $found_posts = 0;

	/**
	 * The search result, as returned by the WordPress.com REST API.
	 *
	 * @since 5.0.0
	 *
	 * @var array
	 */
	protected $search_result;

	/**
	 * This site's blog ID on WordPress.com.
	 *
	 * @since 5.0.0
	 *
	 * @var int
	 */
	protected $jetpack_blog_id;

	/**
	 * The Elasticsearch aggregations (filters).
	 *
	 * @since 5.0.0
	 *
	 * @var array
	 */
	protected $aggregations = array();

	/**
	 * The maximum number of aggregations allowed.
	 *
	 * @since 5.0.0
	 *
	 * @var int
	 */
	protected $max_aggregations_count = 100;

	/**
	 * Statistics about the last Elasticsearch query.
	 *
	 * @since 5.6.0
	 *
	 * @var array
	 */
	protected $last_query_info = array();

	/**
	 * Statistics about the last Elasticsearch query failure.
	 *
	 * @since 5.6.0
	 *
	 * @var array
	 */
	protected $last_query_failure_info = array();

	/**
	 * The singleton instance of this class.
	 *
	 * @since 5.0.0
	 *
	 * @var Jetpack_Search
	 */
	protected static $instance;

	/**
	 * Languages with custom analyzers. Other languages are supported, but are analyzed with the default analyzer.
	 *
	 * @since 5.0.0
	 *
	 * @var array
	 */
	public static $analyzed_langs = array( 'ar', 'bg', 'ca', 'cs', 'da', 'de', 'el', 'en', 'es', 'eu', 'fa', 'fi', 'fr', 'he', 'hi', 'hu', 'hy', 'id', 'it', 'ja', 'ko', 'nl', 'no', 'pt', 'ro', 'ru', 'sv', 'tr', 'zh' );

	/**
	 * Jetpack_Search constructor.
	 *
	 * @since 5.0.0
	 *
	 * Doesn't do anything. This class needs to be initialized via the instance() method instead.
	 */
	protected function __construct() {
	}

	/**
	 * Prevent __clone()'ing of this class.
	 *
	 * @since 5.0.0
	 */
	public function __clone() {
		wp_die( "Please don't __clone Jetpack_Search" );
	}

	/**
	 * Prevent __wakeup()'ing of this class.
	 *
	 * @since 5.0.0
	 */
	public function __wakeup() {
		wp_die( "Please don't __wakeup Jetpack_Search" );
	}

	/**
	 * Get singleton instance of Jetpack_Search.
	 *
	 * Instantiates and sets up a new instance if needed, or returns the singleton.
	 *
	 * @since 5.0.0
	 *
	 * @return Jetpack_Search The Jetpack_Search singleton.
	 */
	public static function instance() {
		if ( ! isset( self::$instance ) ) {
			self::$instance = new Jetpack_Search();

			self::$instance->setup();
		}

		return self::$instance;
	}

	/**
	 * Perform various setup tasks for the class.
	 *
	 * Checks various pre-requisites and adds hooks.
	 *
	 * @since 5.0.0
	 */
	public function setup() {
		if ( ! Jetpack::is_active() || ! Jetpack::active_plan_supports( 'search' ) ) {
			return;
		}

		$this->jetpack_blog_id = Jetpack::get_option( 'id' );

		if ( ! $this->jetpack_blog_id ) {
			return;
		}

		require_once dirname( __FILE__ ) . '/class.jetpack-search-helpers.php';
		require_once dirname( __FILE__ ) . '/class.jetpack-search-template-tags.php';
		require_once JETPACK__PLUGIN_DIR . 'modules/widgets/search.php';

		$this->init_hooks();
	}

	/**
	 * Setup the various hooks needed for the plugin to take over search duties.
	 *
	 * @since 5.0.0
	 */
	public function init_hooks() {
		if ( ! is_admin() ) {
			add_filter( 'posts_pre_query', array( $this, 'filter__posts_pre_query' ), 10, 2 );

			add_filter( 'jetpack_search_es_wp_query_args', array( $this, 'filter__add_date_filter_to_query' ), 10, 2 );

			add_action( 'did_jetpack_search_query', array( $this, 'store_last_query_info' ) );
			add_action( 'failed_jetpack_search_query', array( $this, 'store_query_failure' ) );

			add_action( 'init', array( $this, 'set_filters_from_widgets' ) );

			add_action( 'pre_get_posts', array( $this, 'maybe_add_post_type_as_var' ) );
		} else {
			add_action( 'update_option', array( $this, 'track_widget_updates' ), 10, 3 );
		}

		add_action( 'jetpack_deactivate_module_search', array( $this, 'move_search_widgets_to_inactive' ) );
	}

	/**
	 * When an Elasticsearch query fails, this stores it and enqueues some debug information in the footer.
	 *
	 * @since 5.6.0
	 *
	 * @param array $meta Information about the failure.
	 */
	public function store_query_failure( $meta ) {
		$this->last_query_failure_info = $meta;
		add_action( 'wp_footer', array( $this, 'print_query_failure' ) );
	}

	/**
	 * Outputs information about the last Elasticsearch failure.
	 *
	 * @since 5.6.0
	 */
	public function print_query_failure() {
		if ( $this->last_query_failure_info ) {
			printf(
				'<!-- Jetpack Search failed with code %s: %s - %s -->',
				esc_html( $this->last_query_failure_info['response_code'] ),
				esc_html( $this->last_query_failure_info['json']['error'] ),
				esc_html( $this->last_query_failure_info['json']['message'] )
			);
		}
	}

	/**
	 * Stores information about the last Elasticsearch query and enqueues some debug information in the footer.
	 *
	 * @since 5.6.0
	 *
	 * @param array $meta Information about the query.
	 */
	public function store_last_query_info( $meta ) {
		$this->last_query_info = $meta;
		add_action( 'wp_footer', array( $this, 'print_query_success' ) );
	}

	/**
	 * Outputs information about the last Elasticsearch search.
	 *
	 * @since 5.6.0
	 */
	public function print_query_success() {
		if ( $this->last_query_info ) {
			printf(
				'<!-- Jetpack Search took %s ms, ES time %s ms -->',
				intval( $this->last_query_info['elapsed_time'] ),
				esc_html( $this->last_query_info['es_time'] )
			);
		}
	}

	/**
	 * Returns the last query information, or false if no information was stored.
	 *
	 * @since 5.8.0
	 *
	 * @return bool|array
	 */
	public function get_last_query_info() {
		return empty( $this->last_query_info ) ? false : $this->last_query_info;
	}

	/**
	 * Returns the last query failure information, or false if no failure information was stored.
	 *
	 * @since 5.8.0
	 *
	 * @return bool|array
	 */
	public function get_last_query_failure_info() {
		return empty( $this->last_query_failure_info ) ? false : $this->last_query_failure_info;
	}

	/**
	 * Wraps a WordPress filter called "jetpack_search_disable_widget_filters" that allows
	 * developers to disable filters supplied by the search widget. Useful if filters are
	 * being defined at the code level.
	 *
	 * @since      5.7.0
	 * @deprecated 5.8.0 Use Jetpack_Search_Helpers::are_filters_by_widget_disabled() directly.
	 *
	 * @return bool
	 */
	public function are_filters_by_widget_disabled() {
		return Jetpack_Search_Helpers::are_filters_by_widget_disabled();
	}

	/**
	 * Retrieves a list of known Jetpack search filters widget IDs, gets the filters for each widget,
	 * and applies those filters to this Jetpack_Search object.
	 *
	 * @since 5.7.0
	 */
	public function set_filters_from_widgets() {
		if ( Jetpack_Search_Helpers::are_filters_by_widget_disabled() ) {
			return;
		}

		$filters = Jetpack_Search_Helpers::get_filters_from_widgets();

		if ( ! empty( $filters ) ) {
			$this->set_filters( $filters );
		}
	}

	/**
	 * Restricts search results to certain post types via a GET argument.
	 *
	 * @since 5.8.0
	 *
	 * @param WP_Query $query A WP_Query instance.
	 */
	public function maybe_add_post_type_as_var( WP_Query $query ) {
		if ( $query->is_main_query() && $query->is_search && ! empty( $_GET['post_type'] ) ) {
			$post_types = ( is_string( $_GET['post_type'] ) && false !== strpos( $_GET['post_type'], ',' ) )
				? $post_type = explode( ',', $_GET['post_type'] )
				: (array) $_GET['post_type'];
			$post_types = array_map( 'sanitize_key', $post_types );
			$query->set( 'post_type', $post_types );
		}
	}

	/*
	 * Run a search on the WordPress.com public API.
	 *
	 * @since 5.0.0
	 *
	 * @param array $es_args Args conforming to the WP.com /sites/<blog_id>/search endpoint.
	 *
	 * @return object|WP_Error The response from the public API, or a WP_Error.
	 */
	public function search( array $es_args ) {
		$endpoint    = sprintf( '/sites/%s/search', $this->jetpack_blog_id );
		$service_url = 'https://public-api.wordpress.com/rest/v1' . $endpoint;

		$do_authenticated_request = false;

		if ( class_exists( 'Jetpack_Client' ) &&
		     isset( $es_args['authenticated_request'] ) &&
		     true === $es_args['authenticated_request'] ) {
			$do_authenticated_request = true;
		}

		unset( $es_args['authenticated_request'] );

		$request_args = array(
			'headers'    => array(
				'Content-Type' => 'application/json',
			),
			'timeout'    => 10,
			'user-agent' => 'jetpack_search',
		);

		$request_body = wp_json_encode( $es_args );

		$start_time = microtime( true );

		if ( $do_authenticated_request ) {
			$request_args['method'] = 'POST';

			$request = Jetpack_Client::wpcom_json_api_request_as_blog( $endpoint, Jetpack_Client::WPCOM_JSON_API_VERSION, $request_args, $request_body );
		} else {
			$request_args = array_merge( $request_args, array(
				'body' => $request_body,
			) );

			$request = wp_remote_post( $service_url, $request_args );
		}

		$end_time = microtime( true );

		if ( is_wp_error( $request ) ) {
			return $request;
		}

		$response_code = wp_remote_retrieve_response_code( $request );
		$response      = json_decode( wp_remote_retrieve_body( $request ), true );

		$took = is_array( $response ) && ! empty( $response['took'] )
			? $response['took']
			: null;

		$query = array(
			'args'          => $es_args,
			'response'      => $response,
			'response_code' => $response_code,
			'elapsed_time'  => ( $end_time - $start_time ) * 1000, // Convert from float seconds to ms.
			'es_time'       => $took,
			'url'           => $service_url,
		);

		/**
		 * Fires after a search request has been performed.
		 *
		 * Includes the following info in the $query parameter:
		 *
		 * array args Array of Elasticsearch arguments for the search
		 * array response Raw API response, JSON decoded
		 * int response_code HTTP response code of the request
		 * float elapsed_time Roundtrip time of the search request, in milliseconds
		 * float es_time Amount of time Elasticsearch spent running the request, in milliseconds
		 * string url API url that was queried
		 *
		 * @module search
		 *
		 * @since  5.0.0
		 * @since  5.8.0 This action now fires on all queries instead of just successful queries.
		 *
		 * @param array $query Array of information about the query performed
		 */
		do_action( 'did_jetpack_search_query', $query );

		if ( ! $response_code || $response_code < 200 || $response_code >= 300 ) {
			/**
			 * Fires after a search query request has failed
			 *
			 * @module search
			 *
			 * @since  5.6.0
			 *
			 * @param array Array containing the response code and response from the failed search query
			 */
			do_action( 'failed_jetpack_search_query', array(
				'response_code' => $response_code,
				'json'          => $response,
			) );

			return new WP_Error( 'invalid_search_api_response', 'Invalid response from API - ' . $response_code );
		}

		return $response;
	}

	/**
	 * Bypass the normal Search query and offload it to Jetpack servers.
	 *
	 * This is the main hook of the plugin and is responsible for returning the posts that match the search query.
	 *
	 * @since 5.0.0
	 *
	 * @param array    $posts Current array of posts (still pre-query).
	 * @param WP_Query $query The WP_Query being filtered.
	 *
	 * @return array Array of matching posts.
	 */
	public function filter__posts_pre_query( $posts, $query ) {
		/**
		 * Determine whether a given WP_Query should be handled by ElasticSearch.
		 *
		 * @module search
		 *
		 * @since  5.6.0
		 *
		 * @param bool     $should_handle Should be handled by Jetpack Search.
		 * @param WP_Query $query         The WP_Query object.
		 */
		if ( ! apply_filters( 'jetpack_search_should_handle_query', ( $query->is_main_query() && $query->is_search() ), $query ) ) {
			return $posts;
		}

		$this->do_search( $query );

		if ( ! is_array( $this->search_result ) ) {
			return $posts;
		}

		// If no results, nothing to do
		if ( ! count( $this->search_result['results']['hits'] ) ) {
			return array();
		}

		$post_ids = array();

		foreach ( $this->search_result['results']['hits'] as $result ) {
			$post_ids[] = (int) $result['fields']['post_id'];
		}

		// Query all posts now
		$args = array(
			'post__in'            => $post_ids,
			'orderby'             => 'post__in',
			'perm'                => 'readable',
			'post_type'           => 'any',
			'ignore_sticky_posts' => true,
			'suppress_filters'    => true,
		);

		$posts_query = new WP_Query( $args );

		// WP Core doesn't call the set_found_posts and its filters when filtering posts_pre_query like we do, so need to do these manually.
		$query->found_posts   = $this->found_posts;
		$query->max_num_pages = ceil( $this->found_posts / $query->get( 'posts_per_page' ) );

		return $posts_query->posts;
	}

	/**
	 * Build up the search, then run it against the Jetpack servers.
	 *
	 * @since 5.0.0
	 *
	 * @param WP_Query $query The original WP_Query to use for the parameters of our search.
	 */
	public function do_search( WP_Query $query ) {
		$page = ( $query->get( 'paged' ) ) ? absint( $query->get( 'paged' ) ) : 1;

		// Get maximum allowed offset and posts per page values for the API.
		$max_offset         = Jetpack_Search_Helpers::get_max_offset();
		$max_posts_per_page = Jetpack_Search_Helpers::get_max_posts_per_page();

		$posts_per_page = $query->get( 'posts_per_page' );
		if ( $posts_per_page > $max_posts_per_page ) {
			$posts_per_page = $max_posts_per_page;
		}

		// Start building the WP-style search query args.
		// They'll be translated to ES format args later.
		$es_wp_query_args = array(
			'query'          => $query->get( 's' ),
			'posts_per_page' => $posts_per_page,
			'paged'          => $page,
			'orderby'        => $query->get( 'orderby' ),
			'order'          => $query->get( 'order' ),
		);

		if ( ! empty( $this->aggregations ) ) {
			$es_wp_query_args['aggregations'] = $this->aggregations;
		}

		// Did we query for authors?
		if ( $query->get( 'author_name' ) ) {
			$es_wp_query_args['author_name'] = $query->get( 'author_name' );
		}

		$es_wp_query_args['post_type'] = $this->get_es_wp_query_post_type_for_query( $query );
		$es_wp_query_args['terms']     = $this->get_es_wp_query_terms_for_query( $query );

		/**
		 * Modify the search query parameters, such as controlling the post_type.
		 *
		 * These arguments are in the format of WP_Query arguments
		 *
		 * @module search
		 *
		 * @since  5.0.0
		 *
		 * @param array    $es_wp_query_args The current query args, in WP_Query format.
		 * @param WP_Query $query            The original WP_Query object.
		 */
		$es_wp_query_args = apply_filters( 'jetpack_search_es_wp_query_args', $es_wp_query_args, $query );

		// If page * posts_per_page is greater than our max offset, send a 404. This is necessary because the offset is
		// capped at Jetpack_Search_Helpers::get_max_offset(), so a high page would always return the last page of results otherwise.
		if ( ( $es_wp_query_args['paged'] * $es_wp_query_args['posts_per_page'] ) > $max_offset ) {
			$query->set_404();

			return;
		}

		// If there were no post types returned, then 404 to avoid querying against non-public post types, which could
		// happen if we don't add the post type restriction to the ES query.
		if ( empty( $es_wp_query_args['post_type'] ) ) {
			$query->set_404();

			return;
		}

		// Convert the WP-style args into ES args.
		$es_query_args = $this->convert_wp_es_to_es_args( $es_wp_query_args );

		//Only trust ES to give us IDs, not the content since it is a mirror
		$es_query_args['fields'] = array(
			'post_id',
		);

		/**
		 * Modify the underlying ES query that is passed to the search endpoint. The returned args must represent a valid ES query
		 *
		 * This filter is harder to use if you're unfamiliar with ES, but allows complete control over the query
		 *
		 * @module search
		 *
		 * @since  5.0.0
		 *
		 * @param array    $es_query_args The raw Elasticsearch query args.
		 * @param WP_Query $query         The original WP_Query object.
		 */
		$es_query_args = apply_filters( 'jetpack_search_es_query_args', $es_query_args, $query );

		// Do the actual search query!
		$this->search_result = $this->search( $es_query_args );

		if ( is_wp_error( $this->search_result ) || ! is_array( $this->search_result ) || empty( $this->search_result['results'] ) || empty( $this->search_result['results']['hits'] ) ) {
			$this->found_posts = 0;

			return;
		}

		// If we have aggregations, fix the ordering to match the input order (ES doesn't guarantee the return order).
		if ( isset( $this->search_result['results']['aggregations'] ) && ! empty( $this->search_result['results']['aggregations'] ) ) {
			$this->search_result['results']['aggregations'] = $this->fix_aggregation_ordering( $this->search_result['results']['aggregations'], $this->aggregations );
		}

		// Total number of results for paging purposes. Capped at $max_offset + $posts_per_page, as deep paging gets quite expensive.
		$this->found_posts = min( $this->search_result['results']['total'], $max_offset + $posts_per_page );
	}

	/**
	 * If the query has already been run before filters have been updated, then we need to re-run the query
	 * to get the latest aggregations.
	 *
	 * This is especially useful for supporting widget management in the customizer.
	 *
	 * @since 5.8.0
	 *
	 * @return bool Whether the query was successful or not.
	 */
	public function update_search_results_aggregations() {
		if ( empty( $this->last_query_info ) || empty( $this->last_query_info['args'] ) ) {
			return false;
		}

		$es_args = $this->last_query_info['args'];
		$builder = new Jetpack_WPES_Query_Builder();
		$this->add_aggregations_to_es_query_builder( $this->aggregations, $builder );
		$es_args['aggregations'] = $builder->build_aggregation();

		$this->search_result = $this->search( $es_args );

		return ! is_wp_error( $this->search_result );
	}

	/**
	 * Given a WP_Query, convert its WP_Tax_Query (if present) into the WP-style Elasticsearch term arguments for the search.
	 *
	 * @since 5.0.0
	 *
	 * @param WP_Query $query The original WP_Query object for which to parse the taxonomy query.
	 *
	 * @return array The new WP-style Elasticsearch arguments (that will be converted into 'real' Elasticsearch arguments).
	 */
	public function get_es_wp_query_terms_for_query( WP_Query $query ) {
		$args = array();

		$the_tax_query = $query->tax_query;

		if ( ! $the_tax_query ) {
			return $args;
		}


		if ( ! $the_tax_query instanceof WP_Tax_Query || empty( $the_tax_query->queried_terms ) || ! is_array( $the_tax_query->queried_terms ) ) {
			return $args;
		}

		$args = array();

		foreach ( $the_tax_query->queries as $tax_query ) {
			// Right now we only support slugs...see note above
			if ( ! is_array( $tax_query ) || 'slug' !== $tax_query['field'] ) {
				continue;
			}

			$taxonomy = $tax_query['taxonomy'];

			if ( ! isset( $args[ $taxonomy ] ) || ! is_array( $args[ $taxonomy ] ) ) {
				$args[ $taxonomy ] = array();
			}

			$args[ $taxonomy ] = array_merge( $args[ $taxonomy ], $tax_query['terms'] );
		}

		return $args;
	}

	/**
	 * Parse out the post type from a WP_Query.
	 *
	 * Only allows post types that are not marked as 'exclude_from_search'.
	 *
	 * @since 5.0.0
	 *
	 * @param WP_Query $query Original WP_Query object.
	 *
	 * @return array Array of searchable post types corresponding to the original query.
	 */
	public function get_es_wp_query_post_type_for_query( WP_Query $query ) {
		$post_types = $query->get( 'post_type' );

		// If we're searching 'any', we want to only pass searchable post types to Elasticsearch.
		if ( 'any' === $post_types ) {
			$post_types = array_values( get_post_types( array(
				'exclude_from_search' => false,
			) ) );
		}

		if ( ! is_array( $post_types ) ) {
			$post_types = array( $post_types );
		}

		$post_types = array_unique( $post_types );

		$sanitized_post_types = array();

		// Make sure the post types are queryable.
		foreach ( $post_types as $post_type ) {
			if ( ! $post_type ) {
				continue;
			}

			$post_type_object = get_post_type_object( $post_type );
			if ( ! $post_type_object || $post_type_object->exclude_from_search ) {
				continue;
			}

			$sanitized_post_types[] = $post_type;
		}

		return $sanitized_post_types;
	}


	/**
	 * Get the Elasticsearch result.
	 *
	 * @since 5.0.0
	 *
	 * @param bool $raw If true, does not check for WP_Error or return the 'results' array - the JSON decoded HTTP response.
	 *
	 * @return array|bool The search results, or false if there was a failure.
	 */
	public function get_search_result( $raw = false ) {
		if ( $raw ) {
			return $this->search_result;
		}

		return ( ! empty( $this->search_result ) && ! is_wp_error( $this->search_result ) && is_array( $this->search_result ) && ! empty( $this->search_result['results'] ) ) ? $this->search_result['results'] : false;
	}

	/**
	 * Add the date portion of a WP_Query onto the query args.
	 *
	 * @since 5.0.0
	 *
	 * @param array    $es_wp_query_args The Elasticsearch query arguments in WordPress form.
	 * @param WP_Query $query            The original WP_Query.
	 *
	 * @return array The es wp query args, with date filters added (as needed).
	 */
	public function filter__add_date_filter_to_query( array $es_wp_query_args, WP_Query $query ) {
		if ( $query->get( 'year' ) ) {
			if ( $query->get( 'monthnum' ) ) {
				// Padding
				$date_monthnum = sprintf( '%02d', $query->get( 'monthnum' ) );

				if ( $query->get( 'day' ) ) {
					// Padding
					$date_day = sprintf( '%02d', $query->get( 'day' ) );

					$date_start = $query->get( 'year' ) . '-' . $date_monthnum . '-' . $date_day . ' 00:00:00';
					$date_end   = $query->get( 'year' ) . '-' . $date_monthnum . '-' . $date_day . ' 23:59:59';
				} else {
					$days_in_month = date( 't', mktime( 0, 0, 0, $query->get( 'monthnum' ), 14, $query->get( 'year' ) ) ); // 14 = middle of the month so no chance of DST issues

					$date_start = $query->get( 'year' ) . '-' . $date_monthnum . '-01 00:00:00';
					$date_end   = $query->get( 'year' ) . '-' . $date_monthnum . '-' . $days_in_month . ' 23:59:59';
				}
			} else {
				$date_start = $query->get( 'year' ) . '-01-01 00:00:00';
				$date_end   = $query->get( 'year' ) . '-12-31 23:59:59';
			}

			$es_wp_query_args['date_range'] = array(
				'field' => 'date',
				'gte'   => $date_start,
				'lte'   => $date_end,
			);
		}

		return $es_wp_query_args;
	}

	/**
	 * Converts WP_Query style args to Elasticsearch args.
	 *
	 * @since 5.0.0
	 *
	 * @param array $args Array of WP_Query style arguments.
	 *
	 * @return array Array of ES style query arguments.
	 */
	public function convert_wp_es_to_es_args( array $args ) {
		jetpack_require_lib( 'jetpack-wpes-query-builder/jetpack-wpes-query-parser' );

		$defaults = array(
			'blog_id'        => get_current_blog_id(),
			'query'          => null,    // Search phrase
			'query_fields'   => array(), //list of fields to search
			'post_type'      => null,    // string or an array
			'terms'          => array(), // ex: array( 'taxonomy-1' => array( 'slug' ), 'taxonomy-2' => array( 'slug-a', 'slug-b' ) )
			'author'         => null,    // id or an array of ids
			'author_name'    => array(), // string or an array
			'date_range'     => null,    // array( 'field' => 'date', 'gt' => 'YYYY-MM-dd', 'lte' => 'YYYY-MM-dd' ); date formats: 'YYYY-MM-dd' or 'YYYY-MM-dd HH:MM:SS'
			'orderby'        => null,    // Defaults to 'relevance' if query is set, otherwise 'date'. Pass an array for multiple orders.
			'order'          => 'DESC',
			'posts_per_page' => 10,
			'offset'         => null,
			'paged'          => null,
			/**
			 * Aggregations. Examples:
			 * array(
			 *     'Tag'       => array( 'type' => 'taxonomy', 'taxonomy' => 'post_tag', 'count' => 10 ) ),
			 *     'Post Type' => array( 'type' => 'post_type', 'count' => 10 ) ),
			 * );
			 */
			'aggregations'   => null,
		);

		$args = wp_parse_args( $args, $defaults );

		$parser = new Jetpack_WPES_Search_Query_Parser( $args['query'], array( get_locale() ) );

		if ( empty( $args['query_fields'] ) ) {
			if ( defined( 'JETPACK_SEARCH_VIP_INDEX' ) && JETPACK_SEARCH_VIP_INDEX ) {
				// VIP indices do not have per language fields
				$match_fields        = array(
					'title^0.1',
					'content^0.1',
					'excerpt^0.1',
					'tag.name^0.1',
					'category.name^0.1',
					'author_login^0.1',
					'author^0.1',
				);
				$boost_fields        = array(
					'title^2',
					'tag.name',
					'category.name',
					'author_login',
					'author',
				);
				$boost_phrase_fields = array(
					'title',
					'content',
					'excerpt',
					'tag.name',
					'category.name',
					'author',
				);
			} else {
				$match_fields = $parser->merge_ml_fields(
					array(
						'title'         => 0.1,
						'content'       => 0.1,
						'excerpt'       => 0.1,
						'tag.name'      => 0.1,
						'category.name' => 0.1,
					),
					array(
						'author_login^0.1',
						'author^0.1',
					)
				);

				$boost_fields = $parser->merge_ml_fields(
					array(
						'title'         => 2,
						'tag.name'      => 1,
						'category.name' => 1,
					),
					array(
						'author_login',
						'author',
					)
				);

				$boost_phrase_fields = $parser->merge_ml_fields(
					array(
						'title'         => 1,
						'content'       => 1,
						'excerpt'       => 1,
						'tag.name'      => 1,
						'category.name' => 1,
					),
					array(
						'author',
					)
				);
			}
		} else {
			// If code is overriding the fields, then use that. Important for backwards compatibility.
			$match_fields        = $args['query_fields'];
			$boost_phrase_fields = $match_fields;
			$boost_fields        = null;
		}

		$parser->phrase_filter( array(
			'must_query_fields'  => $match_fields,
			'boost_query_fields' => null,
		) );
		$parser->remaining_query( array(
			'must_query_fields'  => $match_fields,
			'boost_query_fields' => $boost_fields,
		) );

		// Boost on phrase matches
		$parser->remaining_query( array(
			'boost_query_fields' => $boost_phrase_fields,
			'boost_query_type'   => 'phrase',
		) );

		/**
		 * Modify the recency decay parameters for the search query.
		 *
		 * The recency decay lowers the search scores based on the age of a post relative to an origin date. Basic adjustments:
		 *  - origin: A date. Posts with this date will have the highest score and no decay applied. Default is today.
		 *  - offset: Number of days/months/years (eg 30d). All posts within this time range of the origin (before and after) will have no decay applied. Default is no offset.
		 *  - scale: The number of days/months/years from the origin+offset at which the decay will equal the decay param. Default 360d
		 *  - decay: The amount of decay applied at offset+scale. Default 0.9.
		 *
		 * The curve applied is a Gaussian. More details available at {@see https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-function-score-query.html#function-decay}
		 *
		 * @module search
		 *
		 * @since  5.8.0
		 *
		 * @param array $decay_params The decay parameters.
		 * @param array $args         The WP query parameters.
		 */
		$decay_params = apply_filters(
			'jetpack_search_recency_score_decay',
			array(
				'origin' => date( 'Y-m-d' ),
				'scale'  => '360d',
				'decay'  => 0.9,
			),
			$args
		);

		if ( ! empty( $decay_params ) ) {
			// Newer content gets weighted slightly higher
			$parser->add_decay( 'gauss', array(
				'date_gmt' => $decay_params
			) );
		}

		$es_query_args = array(
			'blog_id' => absint( $args['blog_id'] ),
			'size'    => absint( $args['posts_per_page'] ),
		);

		// ES "from" arg (offset)
		if ( $args['offset'] ) {
			$es_query_args['from'] = absint( $args['offset'] );
		} elseif ( $args['paged'] ) {
			$es_query_args['from'] = max( 0, ( absint( $args['paged'] ) - 1 ) * $es_query_args['size'] );
		}

		$es_query_args['from'] = min( $es_query_args['from'], Jetpack_Search_Helpers::get_max_offset() );

		if ( ! is_array( $args['author_name'] ) ) {
			$args['author_name'] = array( $args['author_name'] );
		}

		// ES stores usernames, not IDs, so transform
		if ( ! empty( $args['author'] ) ) {
			if ( ! is_array( $args['author'] ) ) {
				$args['author'] = array( $args['author'] );
			}

			foreach ( $args['author'] as $author ) {
				$user = get_user_by( 'id', $author );

				if ( $user && ! empty( $user->user_login ) ) {
					$args['author_name'][] = $user->user_login;
				}
			}
		}

		//////////////////////////////////////////////////
		// Build the filters from the query elements.
		// Filters rock because they are cached from one query to the next
		// but they are cached as individual filters, rather than all combined together.
		// May get performance boost by also caching the top level boolean filter too.

		if ( $args['post_type'] ) {
			if ( ! is_array( $args['post_type'] ) ) {
				$args['post_type'] = array( $args['post_type'] );
			}

			$parser->add_filter( array(
				'terms' => array(
					'post_type' => $args['post_type'],
				),
			) );
		}

		if ( $args['author_name'] ) {
			$parser->add_filter( array(
				'terms' => array(
					'author_login' => $args['author_name'],
				),
			) );
		}

		if ( ! empty( $args['date_range'] ) && isset( $args['date_range']['field'] ) ) {
			$field = $args['date_range']['field'];

			unset( $args['date_range']['field'] );

			$parser->add_filter( array(
				'range' => array(
					$field => $args['date_range'],
				),
			) );
		}

		if ( is_array( $args['terms'] ) ) {
			foreach ( $args['terms'] as $tax => $terms ) {
				$terms = (array) $terms;

				if ( count( $terms ) && mb_strlen( $tax ) ) {
					switch ( $tax ) {
						case 'post_tag':
							$tax_fld = 'tag.slug';

							break;

						case 'category':
							$tax_fld = 'category.slug';

							break;

						default:
							$tax_fld = 'taxonomy.' . $tax . '.slug';

							break;
					}

					foreach ( $terms as $term ) {
						$parser->add_filter( array(
							'term' => array(
								$tax_fld => $term,
							),
						) );
					}
				}
			}
		}

		if ( ! $args['orderby'] ) {
			if ( $args['query'] ) {
				$args['orderby'] = array( 'relevance' );
			} else {
				$args['orderby'] = array( 'date' );
			}
		}

		// Validate the "order" field
		switch ( strtolower( $args['order'] ) ) {
			case 'asc':
				$args['order'] = 'asc';
				break;

			case 'desc':
			default:
				$args['order'] = 'desc';
				break;
		}

		$es_query_args['sort'] = array();

		foreach ( (array) $args['orderby'] as $orderby ) {
			// Translate orderby from WP field to ES field
			switch ( $orderby ) {
				case 'relevance' :
					//never order by score ascending
					$es_query_args['sort'][] = array(
						'_score' => array(
							'order' => 'desc',
						),
					);

					break;

				case 'date' :
					$es_query_args['sort'][] = array(
						'date' => array(
							'order' => $args['order'],
						),
					);

					break;

				case 'ID' :
					$es_query_args['sort'][] = array(
						'id' => array(
							'order' => $args['order'],
						),
					);

					break;

				case 'author' :
					$es_query_args['sort'][] = array(
						'author.raw' => array(
							'order' => $args['order'],
						),
					);

					break;
			} // End switch().
		} // End foreach().

		if ( empty( $es_query_args['sort'] ) ) {
			unset( $es_query_args['sort'] );
		}

		if ( ! empty( $args['aggregations'] ) ) {
			$this->add_aggregations_to_es_query_builder( $args['aggregations'], $parser );
		}

		$es_query_args['filter']       = $parser->build_filter();
		$es_query_args['query']        = $parser->build_query();
		$es_query_args['aggregations'] = $parser->build_aggregation();

		return $es_query_args;
	}

	/**
	 * Given an array of aggregations, parse and add them onto the Jetpack_WPES_Query_Builder object for use in Elasticsearch.
	 *
	 * @since 5.0.0
	 *
	 * @param array                      $aggregations Array of aggregations (filters) to add to the Jetpack_WPES_Query_Builder.
	 * @param Jetpack_WPES_Query_Builder $builder      The builder instance that is creating the Elasticsearch query.
	 */
	public function add_aggregations_to_es_query_builder( array $aggregations, Jetpack_WPES_Query_Builder $builder ) {
		foreach ( $aggregations as $label => $aggregation ) {
			switch ( $aggregation['type'] ) {
				case 'taxonomy':
					$this->add_taxonomy_aggregation_to_es_query_builder( $aggregation, $label, $builder );

					break;

				case 'post_type':
					$this->add_post_type_aggregation_to_es_query_builder( $aggregation, $label, $builder );

					break;

				case 'date_histogram':
					$this->add_date_histogram_aggregation_to_es_query_builder( $aggregation, $label, $builder );

					break;
			}
		}
	}

	/**
	 * Given an individual taxonomy aggregation, add it to the Jetpack_WPES_Query_Builder object for use in Elasticsearch.
	 *
	 * @since 5.0.0
	 *
	 * @param array                      $aggregation The aggregation to add to the query builder.
	 * @param string                     $label       The 'label' (unique id) for this aggregation.
	 * @param Jetpack_WPES_Query_Builder $builder     The builder instance that is creating the Elasticsearch query.
	 */
	public function add_taxonomy_aggregation_to_es_query_builder( array $aggregation, $label, Jetpack_WPES_Query_Builder $builder ) {
		$field = null;

		switch ( $aggregation['taxonomy'] ) {
			case 'post_tag':
				$field = 'tag';
				break;

			case 'category':
				$field = 'category';
				break;

			default:
				$field = 'taxonomy.' . $aggregation['taxonomy'];
				break;
		}

		$builder->add_aggs( $label, array(
			'terms' => array(
				'field' => $field . '.slug',
				'size'  => min( (int) $aggregation['count'], $this->max_aggregations_count ),
			),
		) );
	}

	/**
	 * Given an individual post_type aggregation, add it to the Jetpack_WPES_Query_Builder object for use in Elasticsearch.
	 *
	 * @since 5.0.0
	 *
	 * @param array                      $aggregation The aggregation to add to the query builder.
	 * @param string                     $label       The 'label' (unique id) for this aggregation.
	 * @param Jetpack_WPES_Query_Builder $builder     The builder instance that is creating the Elasticsearch query.
	 */
	public function add_post_type_aggregation_to_es_query_builder( array $aggregation, $label, Jetpack_WPES_Query_Builder $builder ) {
		$builder->add_aggs( $label, array(
			'terms' => array(
				'field' => 'post_type',
				'size'  => min( (int) $aggregation['count'], $this->max_aggregations_count ),
			),
		) );
	}

	/**
	 * Given an individual date_histogram aggregation, add it to the Jetpack_WPES_Query_Builder object for use in Elasticsearch.
	 *
	 * @since 5.0.0
	 *
	 * @param array                      $aggregation The aggregation to add to the query builder.
	 * @param string                     $label       The 'label' (unique id) for this aggregation.
	 * @param Jetpack_WPES_Query_Builder $builder     The builder instance that is creating the Elasticsearch query.
	 */
	public function add_date_histogram_aggregation_to_es_query_builder( array $aggregation, $label, Jetpack_WPES_Query_Builder $builder ) {
		$args = array(
			'interval' => $aggregation['interval'],
			'field'    => ( ! empty( $aggregation['field'] ) && 'post_date_gmt' == $aggregation['field'] ) ? 'date_gmt' : 'date',
		);

		if ( isset( $aggregation['min_doc_count'] ) ) {
			$args['min_doc_count'] = intval( $aggregation['min_doc_count'] );
		} else {
			$args['min_doc_count'] = 1;
		}

		$builder->add_aggs( $label, array(
			'date_histogram' => $args,
		) );
	}

	/**
	 * And an existing filter object with a list of additional filters.
	 *
	 * Attempts to optimize the filters somewhat.
	 *
	 * @since 5.0.0
	 *
	 * @param array $curr_filter The existing filters to build upon.
	 * @param array $filters     The new filters to add.
	 *
	 * @return array The resulting merged filters.
	 */
	public static function and_es_filters( array $curr_filter, array $filters ) {
		if ( ! is_array( $curr_filter ) || isset( $curr_filter['match_all'] ) ) {
			if ( 1 === count( $filters ) ) {
				return $filters[0];
			}

			return array(
				'and' => $filters,
			);
		}

		return array(
			'and' => array_merge( array( $curr_filter ), $filters ),
		);
	}

	/**
	 * Set the available filters for the search.
	 *
	 * These get rendered via the Jetpack_Search_Widget() widget.
	 *
	 * Behind the scenes, these are implemented using Elasticsearch Aggregations.
	 *
	 * If you do not require counts of how many documents match each filter, please consider using regular WP Query
	 * arguments instead, such as via the jetpack_search_es_wp_query_args filter
	 *
	 * @see    https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations.html
	 *
	 * @since  5.0.0
	 *
	 * @param array $aggregations Array of filters (aggregations) to apply to the search
	 */
	public function set_filters( array $aggregations ) {
		foreach ( (array) $aggregations as $key => $agg ) {
			if ( empty( $agg['name'] ) ) {
				$aggregations[ $key ]['name'] = $key;
			}
		}
		$this->aggregations = $aggregations;
	}

	/**
	 * Set the search's facets (deprecated).
	 *
	 * @deprecated 5.0 Please use Jetpack_Search::set_filters() instead.
	 *
	 * @see        Jetpack_Search::set_filters()
	 *
	 * @param array $facets Array of facets to apply to the search.
	 */
	public function set_facets( array $facets ) {
		_deprecated_function( __METHOD__, 'jetpack-5.0', 'Jetpack_Search::set_filters()' );

		$this->set_filters( $facets );
	}

	/**
	 * Get the raw Aggregation results from the Elasticsearch response.
	 *
	 * @since  5.0.0
	 *
	 * @see    https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations.html
	 *
	 * @return array Array of Aggregations performed on the search.
	 */
	public function get_search_aggregations_results() {
		$aggregations = array();

		$search_result = $this->get_search_result();

		if ( ! empty( $search_result ) && ! empty( $search_result['aggregations'] ) ) {
			$aggregations = $search_result['aggregations'];
		}

		return $aggregations;
	}

	/**
	 * Get the raw Facet results from the Elasticsearch response.
	 *
	 * @deprecated 5.0 Please use Jetpack_Search::get_search_aggregations_results() instead.
	 *
	 * @see        Jetpack_Search::get_search_aggregations_results()
	 *
	 * @return array Array of Facets performed on the search.
	 */
	public function get_search_facets() {
		_deprecated_function( __METHOD__, 'jetpack-5.0', 'Jetpack_Search::get_search_aggregations_results()' );

		return $this->get_search_aggregations_results();
	}

	/**
	 * Get the results of the Filters performed, including the number of matching documents.
	 *
	 * Returns an array of Filters (keyed by $label, as passed to Jetpack_Search::set_filters()), containing the Filter and all resulting
	 * matching buckets, the url for applying/removing each bucket, etc.
	 *
	 * NOTE - if this is called before the search is performed, an empty array will be returned. Use the $aggregations class
	 * member if you need to access the raw filters set in Jetpack_Search::set_filters().
	 *
	 * @since 5.0.0
	 *
	 * @param WP_Query $query The optional original WP_Query to use for determining which filters are active. Defaults to the main query.
	 *
	 * @return array Array of filters applied and info about them.
	 */
	public function get_filters( WP_Query $query = null ) {
		if ( ! $query instanceof WP_Query ) {
			global $wp_query;

			$query = $wp_query;
		}

		$aggregation_data = $this->aggregations;

		if ( empty( $aggregation_data ) ) {
			return $aggregation_data;
		}

		$aggregation_results = $this->get_search_aggregations_results();

		if ( ! $aggregation_results ) {
			return $aggregation_data;
		}

		// NOTE - Looping over the _results_, not the original configured aggregations, so we get the 'real' data from ES
		foreach ( $aggregation_results as $label => $aggregation ) {
			if ( empty( $aggregation ) ) {
				continue;
			}

			$type = $this->aggregations[ $label ]['type'];

			$aggregation_data[ $label ]['buckets'] = array();

			$existing_term_slugs = array();

			$tax_query_var = null;

			// Figure out which terms are active in the query, for this taxonomy
			if ( 'taxonomy' === $this->aggregations[ $label ]['type'] ) {
				$tax_query_var = $this->get_taxonomy_query_var( $this->aggregations[ $label ]['taxonomy'] );

				if ( ! empty( $query->tax_query ) && ! empty( $query->tax_query->queries ) && is_array( $query->tax_query->queries ) ) {
					foreach ( $query->tax_query->queries as $tax_query ) {
						if ( is_array( $tax_query ) && $this->aggregations[ $label ]['taxonomy'] === $tax_query['taxonomy'] &&
						     'slug' === $tax_query['field'] &&
						     is_array( $tax_query['terms'] ) ) {
							$existing_term_slugs = array_merge( $existing_term_slugs, $tax_query['terms'] );
						}
					}
				}
			}

			// Now take the resulting found aggregation items and generate the additional info about them, such as activation/deactivation url, name, count, etc.
			$buckets = array();

			if ( ! empty( $aggregation['buckets'] ) ) {
				$buckets = (array) $aggregation['buckets'];
			}

			if ( 'date_histogram' == $type ) {
				//re-order newest to oldest
				$buckets = array_reverse( $buckets );
			}

			// Some aggregation types like date_histogram don't support the max results parameter
			if ( is_int( $this->aggregations[ $label ]['count'] ) && count( $buckets ) > $this->aggregations[ $label ]['count'] ) {
				$buckets = array_slice( $buckets, 0, $this->aggregations[ $label ]['count'] );
			}

			foreach ( $buckets as $item ) {
				$query_vars = array();
				$active     = false;
				$remove_url = null;
				$name       = '';

				// What type was the original aggregation?
				switch ( $type ) {
					case 'taxonomy':
						$taxonomy = $this->aggregations[ $label ]['taxonomy'];

						$term = get_term_by( 'slug', $item['key'], $taxonomy );

						if ( ! $term || ! $tax_query_var ) {
							continue 2; // switch() is considered a looping structure
						}

						$query_vars = array(
							$tax_query_var => implode( '+', array_merge( $existing_term_slugs, array( $term->slug ) ) ),
						);

						$name = $term->name;

						// Let's determine if this term is active or not

						if ( in_array( $item['key'], $existing_term_slugs, true ) ) {
							$active = true;

							$slug_count = count( $existing_term_slugs );

							if ( $slug_count > 1 ) {
								$remove_url = Jetpack_Search_Helpers::add_query_arg(
									$tax_query_var,
									rawurlencode( implode( '+', array_diff( $existing_term_slugs, array( $item['key'] ) ) ) )
								);
							} else {
								$remove_url = Jetpack_Search_Helpers::remove_query_arg( $tax_query_var );
							}
						}

						break;

					case 'post_type':
						$post_type = get_post_type_object( $item['key'] );

						if ( ! $post_type || $post_type->exclude_from_search ) {
							continue 2;  // switch() is considered a looping structure
						}

						$query_vars = array(
							'post_type' => $item['key'],
						);

						$name = $post_type->labels->singular_name;

						// Is this post type active on this search?
						$post_types = $query->get( 'post_type' );

						if ( ! is_array( $post_types ) ) {
							$post_types = array( $post_types );
						}

						if ( in_array( $item['key'], $post_types ) ) {
							$active = true;

							$post_type_count = count( $post_types );

							// For the right 'remove filter' url, we need to remove the post type from the array, or remove the param entirely if it's the only one
							if ( $post_type_count > 1 ) {
								$remove_url = Jetpack_Search_Helpers::add_query_arg(
									'post_type',
									rawurlencode( implode( ',', array_diff( $post_types, array( $item['key'] ) ) ) )
								);
							} else {
								$remove_url = Jetpack_Search_Helpers::remove_query_arg( 'post_type' );
							}
						}

						break;

					case 'date_histogram':
						$timestamp = $item['key'] / 1000;

						$current_year  = $query->get( 'year' );
						$current_month = $query->get( 'monthnum' );
						$current_day   = $query->get( 'day' );

						switch ( $this->aggregations[ $label ]['interval'] ) {
							case 'year':
								$year = (int) date( 'Y', $timestamp );

								$query_vars = array(
									'year'     => $year,
									'monthnum' => false,
									'day'      => false,
								);

								$name = $year;

								// Is this year currently selected?
								if ( ! empty( $current_year ) && (int) $current_year === $year ) {
									$active = true;

									$remove_url = Jetpack_Search_Helpers::remove_query_arg( array( 'year', 'monthnum', 'day' ) );
								}

								break;

							case 'month':
								$year  = (int) date( 'Y', $timestamp );
								$month = (int) date( 'n', $timestamp );

								$query_vars = array(
									'year'     => $year,
									'monthnum' => $month,
									'day'      => false,
								);

								$name = date( 'F Y', $timestamp );

								// Is this month currently selected?
								if ( ! empty( $current_year ) && (int) $current_year === $year &&
								     ! empty( $current_month ) && (int) $current_month === $month ) {
									$active = true;

									$remove_url = Jetpack_Search_Helpers::remove_query_arg( array( 'year', 'monthnum' ) );
								}

								break;

							case 'day':
								$year  = (int) date( 'Y', $timestamp );
								$month = (int) date( 'n', $timestamp );
								$day   = (int) date( 'j', $timestamp );

								$query_vars = array(
									'year'     => $year,
									'monthnum' => $month,
									'day'      => $day,
								);

								$name = date( 'F jS, Y', $timestamp );

								// Is this day currently selected?
								if ( ! empty( $current_year ) && (int) $current_year === $year &&
								     ! empty( $current_month ) && (int) $current_month === $month &&
								     ! empty( $current_day ) && (int) $current_day === $day ) {
									$active = true;

									$remove_url = Jetpack_Search_Helpers::remove_query_arg( array( 'day' ) );
								}

								break;

							default:
								continue 3; // switch() is considered a looping structure
						} // End switch().

						break;

					default:
						//continue 2; // switch() is considered a looping structure
				} // End switch().

				// Need to urlencode param values since add_query_arg doesn't
				$url_params = urlencode_deep( $query_vars );

				$aggregation_data[ $label ]['buckets'][] = array(
					'url'        => Jetpack_Search_Helpers::add_query_arg( $url_params ),
					'query_vars' => $query_vars,
					'name'       => $name,
					'count'      => $item['doc_count'],
					'active'     => $active,
					'remove_url' => $remove_url,
					'type'       => $type,
					'type_label' => $aggregation_data[ $label ]['name'],
					'widget_id'  => ! empty( $aggregation_data[ $label ]['widget_id'] ) ? $aggregation_data[ $label ]['widget_id'] : 0
				);
			} // End foreach().
		} // End foreach().

		return $aggregation_data;
	}

	/**
	 * Get the results of the facets performed.
	 *
	 * @deprecated 5.0 Please use Jetpack_Search::get_filters() instead.
	 *
	 * @see        Jetpack_Search::get_filters()
	 *
	 * @return array $facets Array of facets applied and info about them.
	 */
	public function get_search_facet_data() {
		_deprecated_function( __METHOD__, 'jetpack-5.0', 'Jetpack_Search::get_filters()' );

		return $this->get_filters();
	}

	/**
	 * Get the filters that are currently applied to this search.
	 *
	 * @since 5.0.0
	 *
	 * @return array Array of filters that were applied.
	 */
	public function get_active_filter_buckets() {
		$active_buckets = array();

		$filters = $this->get_filters();

		if ( ! is_array( $filters ) ) {
			return $active_buckets;
		}

		foreach ( $filters as $filter ) {
			if ( isset( $filter['buckets'] ) && is_array( $filter['buckets'] ) ) {
				foreach ( $filter['buckets'] as $item ) {
					if ( isset( $item['active'] ) && $item['active'] ) {
						$active_buckets[] = $item;
					}
				}
			}
		}

		return $active_buckets;
	}

	/**
	 * Get the filters that are currently applied to this search.
	 *
	 * @deprecated 5.0 Please use Jetpack_Search::get_active_filter_buckets() instead.
	 *
	 * @see        Jetpack_Search::get_active_filter_buckets()
	 *
	 * @return array Array of filters that were applied.
	 */
	public function get_current_filters() {
		_deprecated_function( __METHOD__, 'jetpack-5.0', 'Jetpack_Search::get_active_filter_buckets()' );

		return $this->get_active_filter_buckets();
	}

	/**
	 * Calculate the right query var to use for a given taxonomy.
	 *
	 * Allows custom code to modify the GET var that is used to represent a given taxonomy, via the jetpack_search_taxonomy_query_var filter.
	 *
	 * @since 5.0.0
	 *
	 * @param string $taxonomy_name The name of the taxonomy for which to get the query var.
	 *
	 * @return bool|string The query var to use for this taxonomy, or false if none found.
	 */
	public function get_taxonomy_query_var( $taxonomy_name ) {
		$taxonomy = get_taxonomy( $taxonomy_name );

		if ( ! $taxonomy || is_wp_error( $taxonomy ) ) {
			return false;
		}

		/**
		 * Modify the query var to use for a given taxonomy
		 *
		 * @module search
		 *
		 * @since  5.0.0
		 *
		 * @param string $query_var     The current query_var for the taxonomy
		 * @param string $taxonomy_name The taxonomy name
		 */
		return apply_filters( 'jetpack_search_taxonomy_query_var', $taxonomy->query_var, $taxonomy_name );
	}

	/**
	 * Takes an array of aggregation results, and ensures the array key ordering matches the key order in $desired
	 * which is the input order.
	 *
	 * Necessary because ES does not always return aggregations in the same order that you pass them in,
	 * and it should be possible to control the display order easily.
	 *
	 * @since 5.0.0
	 *
	 * @param array $aggregations Aggregation results to be reordered.
	 * @param array $desired      Array with keys representing the desired ordering.
	 *
	 * @return array A new array with reordered keys, matching those in $desired.
	 */
	public function fix_aggregation_ordering( array $aggregations, array $desired ) {
		if ( empty( $aggregations ) || empty( $desired ) ) {
			return $aggregations;
		}

		$reordered = array();

		foreach ( array_keys( $desired ) as $agg_name ) {
			if ( isset( $aggregations[ $agg_name ] ) ) {
				$reordered[ $agg_name ] = $aggregations[ $agg_name ];
			}
		}

		return $reordered;
	}

	/**
	 * Sends events to Tracks when a search filters widget is updated.
	 *
	 * @since 5.8.0
	 *
	 * @param string $option    The option name. Only "widget_jetpack-search-filters" is cared about.
	 * @param array  $old_value The old option value.
	 * @param array  $new_value The new option value.
	 */
	public function track_widget_updates( $option, $old_value, $new_value ) {
		if ( 'widget_jetpack-search-filters' !== $option ) {
			return;
		}

		$event = Jetpack_Search_Helpers::get_widget_tracks_value( $old_value, $new_value );
		if ( ! $event ) {
			return;
		}

		jetpack_tracks_record_event(
			wp_get_current_user(),
			sprintf( 'jetpack_search_widget_%s', $event['action'] ),
			$event['widget']
		);
	}

	/**
	 * Moves any active search widgets to the inactive category.
	 *
	 * @since 5.9.0
	 *
	 * @param string $module Unused. The Jetpack module being disabled.
	 */
	public function move_search_widgets_to_inactive( $module ) {
		if ( ! is_active_widget( false, false, Jetpack_Search_Helpers::FILTER_WIDGET_BASE, true ) ) {
			return;
		}

		$sidebars_widgets = wp_get_sidebars_widgets();

		if ( ! is_array( $sidebars_widgets ) ) {
			return;
		}

		$changed = false;

		foreach ( $sidebars_widgets as $sidebar => $widgets ) {
			if ( 'wp_inactive_widgets' === $sidebar || 'orphaned_widgets' === substr( $sidebar, 0, 16 ) ) {
				continue;
			}

			if ( is_array( $widgets ) ) {
				foreach ( $widgets as $key => $widget ) {
					if ( _get_widget_id_base( $widget ) == Jetpack_Search_Helpers::FILTER_WIDGET_BASE ) {
						$changed = true;

						array_unshift( $sidebars_widgets['wp_inactive_widgets'], $widget );
						unset( $sidebars_widgets[ $sidebar ][ $key ] );
					}
				}
			}
		}

		if ( $changed ) {
			wp_set_sidebars_widgets( $sidebars_widgets );
		}
	}
}
