<?php

class Jetpack_Search {

	protected $found_posts = 0;

	/**
	 * The maximum offset ('from' param), since deep pages get exponentially slower.
	 *
	 * @see https://www.elastic.co/guide/en/elasticsearch/guide/current/pagination.html
	 */
	protected $max_offset = 200;

	protected $search_result;

	protected $original_blog_id;
	protected $jetpack_blog_id;

	protected $aggregations = array();
	protected $max_aggregations_count = 100;

	// used to output query meta into page
	protected $last_query_info;
	protected $last_query_failure_info;

	protected static $instance;

	//Languages with custom analyzers, other languages are supported,
	// but are analyzed with the default analyzer.
	public static $analyzed_langs = array( 'ar', 'bg', 'ca', 'cs', 'da', 'de', 'el', 'en', 'es', 'eu', 'fa', 'fi', 'fr', 'he', 'hi', 'hu', 'hy', 'id', 'it', 'ja', 'ko', 'nl', 'no', 'pt', 'ro', 'ru', 'sv', 'tr', 'zh' );

	protected function __construct() {
		/* Don't do anything, needs to be initialized via instance() method */
	}

	public function __clone() {
		wp_die( "Please don't __clone Jetpack_Search" );
	}

	public function __wakeup() {
		wp_die( "Please don't __wakeup Jetpack_Search" );
	}

	/**
	 * Get singleton instance of Jetpack_Search
	 *
	 * Instantiates and sets up a new instance if needed, or returns the singleton
	 *
	 * @module search
	 *
	 * @return Jetpack_Search The Jetpack_Search singleton
	 */
	public static function instance() {
		if ( ! isset( self::$instance ) ) {
			self::$instance = new Jetpack_Search();

			self::$instance->setup();
		}

		return self::$instance;
	}

	/**
	 * Perform various setup tasks for the class
	 *
	 * Checks various pre-requisites and adds hooks
	 *
	 * @module search
	 */
	public function setup() {
		if ( ! Jetpack::is_active() || ! Jetpack::active_plan_supports( 'search' ) ) {
			return;
		}

		$this->jetpack_blog_id = Jetpack::get_option( 'id' );

		if ( ! $this->jetpack_blog_id ) {
			return;
		}

		$this->init_hooks();
	}

	/**
	 * Setup the various hooks needed for the plugin to take over Search duties
	 *
	 * @module search
	 */
	public function init_hooks() {
		add_action( 'widgets_init', array( $this, 'action__widgets_init' ) );

		if ( ! is_admin() ) {
			add_filter( 'posts_pre_query', array( $this, 'filter__posts_pre_query' ), 10, 2 );

			add_filter( 'jetpack_search_es_wp_query_args', array( $this, 'filter__add_date_filter_to_query' ),  10, 2 );

			add_action( 'did_jetpack_search_query', array( $this, 'store_query_success' ) );
			add_action( 'failed_jetpack_search_query', array( $this, 'store_query_failure' ) );
		}
	}

	/**
	 * Print query info as a HTML comment in the footer
	 */

	public function store_query_failure( $meta ) {
		$this->last_query_failure_info = $meta;
		add_action( 'wp_footer', array( $this, 'print_query_failure' ) );
	}

	public function print_query_failure() {
		if ( $this->last_query_failure_info ) {
			echo '<!-- Jetpack Search failed with code ' . $this->last_query_failure_info['response_code'] . ': ' . $this->last_query_failure_info['json']['error'] . ' - ' . $this->last_query_failure_info['json']['message'] . ' -->';
		}
	}

	public function store_query_success( $meta ) {
		$this->last_query_info = $meta;
		add_action( 'wp_footer', array( $this, 'print_query_success' ) );
	}

	public function print_query_success() {
		if ( $this->last_query_info ) {
			echo '<!-- Jetpack Search took ' . intval( $this->last_query_info['elapsed_time'] ) . ' ms, ES time ' . $this->last_query_info['es_time'] . ' ms -->';
		}
	}

	/*
	 * Run a search on the WP.com public API.
	 *
	 * @module search
	 *
	 * @param array $es_args Args conforming to the WP.com /sites/<blog_id>/search endpoint
	 *
	 * @return object|WP_Error The response from the public api, or a WP_Error
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
			'headers' => array(
				'Content-Type' => 'application/json',
			),
			'timeout'    => 10,
			'user-agent' => 'jetpack_search',
		);

		$request_body = json_encode( $es_args );

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
		$response = json_decode( wp_remote_retrieve_body( $request ), true );

		if ( ! $response_code || $response_code < 200 || $response_code >= 300 ) {
			/**
			 * Fires after a search query request has failed
			 *
			 * @module search
			 *
			 * @since 5.6.0
			 *
			 * @param array Array containing the response code and response from the failed search query
			 */
			do_action( 'failed_jetpack_search_query', array( 'response_code' => $response_code, 'json' => $response ) );
			return new WP_Error( 'invalid_search_api_response', 'Invalid response from API - ' . $response_code );
		}

		$took = is_array( $response ) && $response['took'] ? $response['took'] : null;

		$query = array(
			'args'          => $es_args,
			'response'      => $response,
			'response_code' => $response_code,
			'elapsed_time'   => ( $end_time - $start_time ) * 1000, // Convert from float seconds to ms
			'es_time'       => $took,
			'url'           => $service_url,
		);

		/**
		 * Fires after a search request has been performed
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
		 * @since 5.0.0
		 *
		 * @param array $query Array of information about the query performed
		 */
		do_action( 'did_jetpack_search_query', $query );

		return $response;
	}

	/**
	 * Bypass the normal Search query and offload it to Jetpack servers
	 *
	 * This is the main hook of the plugin and is responsible for returning the posts that match the search query
	 *
	 * @module search
	 *
	 * @param array $posts Current array of posts (still pre-query)
	 * @param WP_Query $query The WP_Query being filtered
	 *
	 * @return array Array of matching posts
	 */
	public function filter__posts_pre_query( $posts, $query ) {
		/**
		 * Determine whether a given WP_Query should be handled by ElasticSearch
		 *
		 * @module search
		 *
		 * @since 5.6.0
		 * @param bool $should_handle Should be handled by Jetpack Search
		 * @param WP_Query $query The wp_query object
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
			'post__in'  => $post_ids,
			'perm'      => 'readable',
			'post_type' => 'any',
		);

		$posts_query = new WP_Query( $args );

		// WP Core doesn't call the set_found_posts and its filters when filtering posts_pre_query like we do, so need to
		// do these manually
		$query->found_posts   = $this->found_posts;
		$query->max_num_pages = ceil( $this->found_posts / $query->get( 'posts_per_page' ) );

		return $posts_query->posts;
	}

	/**
	 * Build up the search, then run it against the Jetpack servers
	 *
	 * @param WP_Query $query The original WP_Query to use for the parameters of our search
	 */
	public function do_search( WP_Query $query ) {
		$page = ( $query->get( 'paged' ) ) ? absint( $query->get( 'paged' ) ) : 1;

		$posts_per_page = $query->get( 'posts_per_page' );

		// ES API does not allow more than 15 results at a time
		if ( $posts_per_page > 15 ) {
			$posts_per_page = 15;
		}

		// Start building the WP-style search query args
		// They'll be translated to ES format args later
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
		 * @since 5.0.0
		 *
		 * @param array $es_wp_query_args The current query args, in WP_Query format
		 * @param WP_Query $query The original query object
		 */
		$es_wp_query_args = apply_filters( 'jetpack_search_es_wp_query_args', $es_wp_query_args, $query );

		// If page * posts_per_page is greater than our max offset, send a 404. This is necessary because the offset is
		// capped at $this->max_offset, so a high page would always return the last page of results otherwise
		if ( ( $es_wp_query_args['paged'] * $es_wp_query_args['posts_per_page'] ) > $this->max_offset ) {
			$query->set_404();

			return;
		}

		// If there were no post types returned, then 404 to avoid querying against non-public post types, which could
		// happen if we don't add the post type restriction to the ES query
		if ( empty( $es_wp_query_args['post_type'] ) ) {
			$query->set_404();

			return;
		}

		// Convert the WP-style args into ES args
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
		 * @since 5.0.0
		 *
		 * @param array $es_query_args The raw ES query args
		 * @param WP_Query $query The original query object
		 */
		$es_query_args = apply_filters( 'jetpack_search_es_query_args', $es_query_args, $query );

		// Do the actual search query!
		$this->search_result = $this->search( $es_query_args );

		if ( is_wp_error( $this->search_result ) || ! is_array( $this->search_result ) || empty( $this->search_result['results'] ) || empty( $this->search_result['results']['hits'] ) ) {
			$this->found_posts = 0;

			return;
		}

		// If we have aggregations, fix the ordering to match the input order (ES doesn't
		// guarantee the return order)
		if ( isset( $this->search_result['results']['aggregations'] ) && ! empty( $this->search_result['results']['aggregations'] ) ) {
			$this->search_result['results']['aggregations'] = $this->fix_aggregation_ordering( $this->search_result['results']['aggregations'], $this->aggregations );
		}

		// Total number of results for paging purposes. Capped at $this->>max_offset + $posts_per_page, as deep paging
		// gets quite expensive
		$this->found_posts = min( $this->search_result['results']['total'], $this->max_offset + $posts_per_page );

		return;
	}

	/**
	 * Given a WP_Query, convert its WP_Tax_Query (if present) into the WP-style ES term arguments for the search
	 *
	 * @module search
	 *
	 * @param WP_Query $query The original WP_Query object for which to parse the taxonomy query
	 *
	 * @return array The new WP-style ES arguments (that will be converted into 'real' ES arguments)
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
	 * Parse out the post type from a WP_Query
	 *
	 * Only allows post types that are not marked as 'exclude_from_search'
	 *
	 * @module search
	 *
	 * @param WP_Query $query Original WP_Query object
	 *
	 * @return array Array of searchable post types corresponding to the original query
	 */
	public function get_es_wp_query_post_type_for_query( WP_Query $query ) {
		$post_types = $query->get( 'post_type' );

		// If we're searching 'any', we want to only pass searchable post types to ES
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

		// Make sure the post types are queryable
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
	 * Initialze widgets for the Search module
	 *
	 * @module search
	 */
	public function action__widgets_init() {
		require_once( dirname( __FILE__ ) . '/class.jetpack-search-widget-filters.php' );

		register_widget( 'Jetpack_Search_Widget_Filters' );
	}

	/**
	 * Get the Elasticsearch result
	 *
	 * @module search
	 *
	 * @param bool $raw If true, does not check for WP_Error or return the 'results' array - the JSON decoded HTTP response
	 *
	 * @return array|bool The search results, or false if there was a failure
	 */
	public function get_search_result( $raw = false ) {
		if ( $raw ) {
			return $this->search_result;
		}

		return ( ! empty( $this->search_result ) && ! is_wp_error( $this->search_result ) && is_array( $this->search_result ) && ! empty( $this->search_result['results'] ) ) ? $this->search_result['results'] : false;
	}

	/**
	 * Add the date portion of a WP_Query onto the query args
	 *
	 * @param array    $es_wp_query_args
	 * @param WP_Query $query The original WP_Query
	 *
	 * @return array The es wp query args, with date filters added (as needed)
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
	 * Converts WP_Query style args to ES args
	 *
	 * @module search
	 *
	 * @param array $args Array of WP_Query style arguments
	 *
	 * @return array Array of ES style query arguments
	 */
	function convert_wp_es_to_es_args( array $args ) {
		jetpack_require_lib( 'jetpack-wpes-query-builder' );

		$builder = new Jetpack_WPES_Query_Builder();

		$defaults = array(
			'blog_id'        => get_current_blog_id(),

			'query'          => null,    // Search phrase
			'query_fields'   => array( 'title', 'content', 'author', 'tag', 'category' ),

			'post_type'      => null,  // string or an array
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
			'aggregations'         => null,
		);

		$args = wp_parse_args( $args, $defaults );

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

		// Limit the offset to $this->max_offset posts, as deep pages get exponentially slower
		// See https://www.elastic.co/guide/en/elasticsearch/guide/current/pagination.html
		$es_query_args['from'] = min( $es_query_args['from'], $this->max_offset );

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
		$filters = array();

		if ( $args['post_type'] ) {
			if ( ! is_array( $args['post_type'] ) ) {
				$args['post_type'] = array( $args['post_type'] );
			}

			$filters[] = array(
				'terms' => array(
					'post_type' => $args['post_type'],
				),
			);
		}

		if ( $args['author_name'] ) {
			$filters[] = array(
				'terms' => array(
					'author_login' => $args['author_name'],
				),
			);
		}

		if ( ! empty( $args['date_range'] ) && isset( $args['date_range']['field'] ) ) {
			$field = $args['date_range']['field'];

			unset( $args['date_range']['field'] );

			$filters[] = array(
				'range' => array(
					$field => $args['date_range'],
				),
			);
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
						$filters[] = array(
							'term' => array(
								$tax_fld => $term,
							),
						);
					}
				}
			}
		}

		if ( $args['query'] ) {
			$query = array(
				'multi_match' => array(
					'query'    => $args['query'],
					'fields'   => $args['query_fields'],
					'operator' => 'and',
					'type'     => 'cross_fields',
				),
			);

			$builder->add_query( $query );

			Jetpack_Search::score_query_by_recency( $builder );

			if ( ! $args['orderby'] ) {
				$args['orderby'] = array( 'relevance' );
			}
		} else {
			if ( ! $args['orderby'] ) {
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

		if ( ! empty( $filters ) && is_array( $filters ) ) {
			foreach ( $filters as $filter ) {
				$builder->add_filter( $filter );
			}

			$es_query_args['filter'] = $builder->build_filter();
		}

		$es_query_args['query'] = $builder->build_query();

		// Aggregations
		if ( ! empty( $args['aggregations'] ) ) {
			$this->add_aggregations_to_es_query_builder( $args['aggregations'], $builder );

			$es_query_args['aggregations'] = $builder->build_aggregation();
		}

		return $es_query_args;
	}

	/**
	 * Given an array of aggregations, parse and add them onto the Jetpack_WPES_Query_Builder object for use in ES
	 *
	 * @module search
	 *
	 * @param array $aggregations Array of Aggregations (filters) to add to the Jetpack_WPES_Query_Builder
	 *
	 * @param Jetpack_WPES_Query_Builder $builder The builder instance that is creating the ES query
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
	 * Given an individual taxonomy aggregation, add it to the Jetpack_WPES_Query_Builder object for use in ES
	 *
	 * @module search
	 *
	 * @param array $aggregation The aggregation to add to the query builder
	 * @param string $label The 'label' (unique id) for this aggregation
	 * @param Jetpack_WPES_Query_Builder $builder The builder instance that is creating the ES query
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
				'size' => min( (int) $aggregation['count'], $this->max_aggregations_count ),
			),
		));
	}

	/**
	 * Given an individual post_type aggregation, add it to the Jetpack_WPES_Query_Builder object for use in ES
	 *
	 * @module search
	 *
	 * @param array $aggregation The aggregation to add to the query builder
	 * @param string $label The 'label' (unique id) for this aggregation
	 * @param Jetpack_WPES_Query_Builder $builder The builder instance that is creating the ES query
	 */
	public function add_post_type_aggregation_to_es_query_builder( array $aggregation, $label, Jetpack_WPES_Query_Builder $builder ) {
		$builder->add_aggs( $label, array(
			'terms' => array(
				'field' => 'post_type',
				'size' => min( (int) $aggregation['count'], $this->max_aggregations_count ),
			),
		));
	}

	/**
	 * Given an individual date_histogram aggregation, add it to the Jetpack_WPES_Query_Builder object for use in ES
	 *
	 * @module search
	 *
	 * @param array $aggregation The aggregation to add to the query builder
	 * @param string $label The 'label' (unique id) for this aggregation
	 * @param Jetpack_WPES_Query_Builder $builder The builder instance that is creating the ES query
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
		));
	}

	/**
	 * And an existing filter object with a list of additional filters.
	 *
	 * Attempts to optimize the filters somewhat.
	 *
	 * @module search
	 *
	 * @param array $curr_filter The existing filters to build upon
	 * @param array $filters The new filters to add
	 *
	 * @return array The resulting merged filters
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
	 * Add a recency score to a given Jetpack_WPES_Query_Builder object, for emphasizing newer posts in results
	 *
	 * Internally uses a gauss decay function
	 *
	 * @module search
	 *
	 * @param Jetpack_WPES_Query_Builder $builder The Jetpack_WPES_Query_Builder to add the recency score to
	 *
	 * @see https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-function-score-query.html#function-decay
	 */
	public static function score_query_by_recency( Jetpack_WPES_Query_Builder &$builder ) {
		//Newer content gets weighted slightly higher
		$date_scale  = '360d';
		$date_decay  = 0.9;
		$date_origin = date( 'Y-m-d' );

		$builder->add_decay( 'gauss', array(
			'date_gmt' => array(
				'origin' => $date_origin,
				'scale'  => $date_scale,
				'decay'  => $date_decay,
			),
		));
	}

	/**
	 * Set the available filters for the search
	 *
	 * These get rendered via the Jetpack_Search_Widget_Filters() widget
	 *
	 * Behind the scenes, these are implemented using Elasticsearch Aggregations.
	 *
	 * If you do not require counts of how many documents match each filter, please consider using regular WP Query
	 * arguments instead, such as via the jetpack_search_es_wp_query_args filter
	 *
	 * @module search
	 *
	 * @see https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations.html
	 *
	 * @param array $aggregations Array of filters (aggregations) to apply to the search
	 */
	public function set_filters( array $aggregations ) {
		$this->aggregations = $aggregations;
	}

	/**
	 * Set the search's facets (deprecated)
	 *
	 * @module search
	 *
	 * @deprecated 5.0 Please use Jetpack_Search::set_filters() instead
	 *
	 * @see Jetpack_Search::set_filters()
	 *
	 * @param array $facets Array of facets to apply to the search
	 */
	public function set_facets( array $facets ) {
		_deprecated_function( __METHOD__, 'jetpack-5.0', 'Jetpack_Search::set_filters()' );

		$this->set_filters( $facets );
	}

	/**
	 * Get the raw Aggregation results from the ES response
	 *
	 * @module search
	 *
	 * @see https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations.html
	 *
	 * @return array Array of Aggregations performed on the search
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
	 * Get the raw Facet results from the ES response
	 *
	 * @module search
	 *
	 * @deprecated 5.0 Please use Jetpack_Search::get_search_aggregations_results() instead
	 *
	 * @see Jetpack_Search::get_search_aggregations_results()
	 *
	 * @return array Array of Facets performed on the search
	 */
	public function get_search_facets() {
		_deprecated_function( __METHOD__, 'jetpack-5.0', 'Jetpack_Search::get_search_aggregations_results()' );

		return $this->get_search_aggregations_results();
	}

	/**
	 * Get the results of the Filters performed, including the number of matching documents
	 *
	 * Returns an array of Filters (keyed by $label, as passed to Jetpack_Search::set_filters()), containing the Filter and all resulting
	 * matching buckets, the url for applying/removing each bucket, etc.
	 *
	 * NOTE - if this is called before the search is performed, an empty array will be returned. Use the $aggregations class
	 * member if you need to access the raw filters set in Jetpack_Search::set_filters()
	 *
	 * @module search
	 *
	 * @param WP_Query $query The optional original WP_Query to use for determining which filters are active. Defaults to the main query
	 *
	 * @return array Array of Filters applied and info about them
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
				$tax_query_var = $this->get_taxonomy_query_var(  $this->aggregations[ $label ]['taxonomy'] );

				if ( ! empty( $query->tax_query ) && ! empty( $query->tax_query->queries ) && is_array( $query->tax_query->queries ) ) {
					foreach( $query->tax_query->queries as $tax_query ) {
						if ( is_array( $tax_query ) && $this->aggregations[ $label ]['taxonomy'] === $tax_query['taxonomy'] &&
						     'slug' === $tax_query['field'] &&
						     is_array( $tax_query['terms'] ) ) {
							$existing_term_slugs = array_merge( $existing_term_slugs, $tax_query['terms'] );
						}
					}
				}
			}

			// Now take the resulting found aggregation items and generate the additional info about them, such as
			// activation/deactivation url, name, count, etc
			$buckets = array();

			if ( ! empty( $aggregation['buckets'] ) ) {
				$buckets = (array) $aggregation['buckets'];
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
								$remove_url = add_query_arg( $tax_query_var, urlencode( implode( '+', array_diff( $existing_term_slugs, array( $item['key'] ) ) ) ) );
							} else {
								$remove_url = remove_query_arg( $tax_query_var );
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
								$remove_url = add_query_arg( 'post_type', urlencode_deep( array_diff( $post_types, array( $item['key'] ) ) ) );
							} else {
								$remove_url = remove_query_arg( 'post_type' );
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

									$remove_url = remove_query_arg( array( 'year', 'monthnum', 'day' ) );
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

									$remove_url = remove_query_arg( array( 'monthnum', 'day' ) );
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

									$remove_url = remove_query_arg( array( 'day' ) );
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
					'url'        => add_query_arg( $url_params ),
					'query_vars' => $query_vars,
					'name'       => $name,
					'count'      => $item['doc_count'],
					'active'     => $active,
					'remove_url' => $remove_url,
					'type'       => $type,
					'type_label' => $label,
				);
			} // End foreach().
		} // End foreach().

		return $aggregation_data;
	}

	/**
	 * Get the results of the Facets performed
	 *
	 * @module search
	 *
	 * @deprecated 5.0 Please use Jetpack_Search::get_filters() instead
	 *
	 * @see Jetpack_Search::get_filters()
	 *
	 * @return array $facets Array of Facets applied and info about them
	 */
	public function get_search_facet_data() {
		_deprecated_function( __METHOD__, 'jetpack-5.0', 'Jetpack_Search::get_filters()' );

		return $this->get_filters();
	}

	/**
	 * Get the Filters that are currently applied to this search
	 *
	 * @module search
	 *
	 * @return array Array if Filters that were applied
	 */
	public function get_active_filter_buckets() {
		$active_buckets = array();

		$filters = $this->get_filters();

		if ( ! is_array( $filters ) ) {
			return $active_buckets;
		}

		foreach( $filters as $filter ) {
			if ( isset( $filter['buckets'] ) && is_array( $filter['buckets'] ) ) {
				foreach( $filter['buckets'] as $item ) {
					if ( isset( $item['active'] ) && $item['active'] ) {
						$active_buckets[] = $item;
					}
				}
			}
		}

		return $active_buckets;
	}

	/**
	 * Get the Filters that are currently applied to this search
	 *
	 * @module search
	 *
	 * @return array Array if Filters that were applied
	 */
	public function get_current_filters() {
		_deprecated_function( __METHOD__, 'jetpack-5.0', 'Jetpack_Search::get_active_filter_buckets()' );

		return $this->get_active_filter_buckets();
	}

	/**
	 * Calculate the right query var to use for a given taxonomy
	 *
	 * Allows custom code to modify the GET var that is used to represent a given taxonomy, via the jetpack_search_taxonomy_query_var filter
	 *
	 * @module search
	 *
	 * @param string $taxonomy_name The name of the taxonomy for which to get the query var
	 *
	 * @return bool|string The query var to use for this taxonomy, or false if none found
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
		 * @since 5.0.0
		 *
		 * @param string $query_var The current query_var for the taxonomy
		 * @param string $taxonomy_name The taxonomy name
		 */
		return apply_filters( 'jetpack_search_taxonomy_query_var', $taxonomy->query_var, $taxonomy_name );
	}

	/**
	 * Takes an array of aggregation results, and ensures the array key ordering matches the key order in $desired
	 * which is the input order
	 *
	 * Necessary because ES does not always return Aggs in the same order that you pass them in, and it should be possible
	 * to control the display order easily
	 *
	 * @module search
	 *
	 * @param array $aggregations Agg results to be reordered
	 * @param array $desired Array with keys representing the desired ordering
	 *
	 * @return array A new array with reordered keys, matching those in $desired
	 */
	public function fix_aggregation_ordering( array $aggregations, array $desired ) {
		if ( empty( $aggregations ) || empty( $desired ) ) {
			return $aggregations;
		}

		$reordered = array();

		foreach( array_keys( $desired ) as $agg_name ) {
			if ( isset( $aggregations[ $agg_name ] ) ) {
				$reordered[ $agg_name ] = $aggregations[ $agg_name ];
			}
		}

		return $reordered;
	}
}
