<?php
/**
 * Inline Search: search without popup using v1.3 Instant Search API
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Inline Search class
 */
class Inline_Search extends Classic_Search {
	/**
	 * The singleton instance of this class.
	 *
	 * @var Inline_Search
	 */
	private static $instance;

	/**
	 * The Search Highlighter instance.
	 *
	 * @var Inline_Search_Highlighter|null
	 * @since 0.50.0
	 */
	private $highlighter;

	/**
	 * The search correction instance.
	 *
	 * @var Inline_Search_Correction|null
	 * @since 0.50.0
	 */
	private $correction;

	/**
	 * Stores the list of post IDs that are actual search results.
	 *
	 * @var array
	 */
	private $search_result_ids = array();

	/**
	 * Returns whether this class should be used instead of Classic_Search.
	 */
	public static function should_replace_classic_search(): bool {
		$option_value = get_option( Module_Control::SEARCH_MODULE_SWAP_CLASSIC_TO_INLINE_OPTION_KEY, false );
		return (bool) apply_filters( 'jetpack_search_replace_classic', $option_value );
	}

	/**
	 * Returns a class singleton. Initializes with first-time setup.
	 *
	 * @param string|int $blog_id Blog id.
	 *
	 * @return Inline_Search The class singleton.
	 */
	public static function instance( $blog_id = null ) {
		if ( ! isset( self::$instance ) ) {
			if ( null === $blog_id ) {
				$blog_id = Helper::get_wpcom_site_id();
			}
			self::$instance = new static();
			self::$instance->setup( $blog_id );

			// Initialize search correction handling
			self::$instance->correction = new Inline_Search_Correction();

			// Add hooks for displaying corrected query notice
			add_action( 'pre_get_posts', array( self::$instance->correction, 'setup_corrected_query_hooks' ) );
		}

		return self::$instance;
	}

	/**
	 * Returns a class singleton - either this class, or Classic_Search if we haven't enabled the new feature yet.
	 *
	 * @param string|int $blog_id Blog ID.
	 *
	 * @return Classic_Search|Inline_Search
	 */
	public static function get_instance_maybe_fallback_to_classic( $blog_id = null ) {
		if ( self::should_replace_classic_search() ) {
			return self::instance( $blog_id );
		} else {
			return Classic_Search::instance( $blog_id );
		}
	}

	/**
	 * Set up the highlighter.
	 *
	 * @param string $blog_id The blog ID to set up for.
	 */
	public function setup( $blog_id ) {
		parent::setup( $blog_id );
		// The highlighter will be initialized with data during search processing
		$this->highlighter = null;
	}

	/**
	 * Bypass WP search and offload it to 1.3 search API instead.
	 *
	 * This is the main hook of the plugin and is responsible for returning the posts that match the search query.
	 *
	 * @param array     $posts Current array of posts (still pre-query).
	 * @param \WP_Query $query The WP_Query being filtered.
	 *
	 * @return array Array of matching posts.
	 */
	public function filter__posts_pre_query( $posts, $query ) {
		if ( ! $this->should_handle_query( $query ) ) {
			return $posts;
		}

		$this->do_search( $query );

		if ( ! is_array( $this->search_result ) ) {
			do_action( 'jetpack_search_abort', 'no_search_results_array', $this->search_result );

			return $posts;
		}

		// If no results, nothing to do.
		if ( ! is_countable( $this->search_result['results'] ) ) {
			return array();
		}
		if ( ! count( $this->search_result['results'] ) ) {
			return array();
		}

		// Process the search results to extract post IDs and highlighted content.
		$this->process_search_results();

		// Create a WP_Query to fetch the actual posts.
		$posts_query = $this->create_posts_query( $query );

		// WP Core doesn't call the set_found_posts and its filters when filtering posts_pre_query like we do, so need to do these manually.
		$query->found_posts   = $this->found_posts;
		$query->max_num_pages = ceil( $this->found_posts / $query->get( 'posts_per_page' ) );

		return $posts_query->posts;
	}

	/**
	 * Execute 1.3 search API request.
	 *
	 * @param \WP_Query $query The original WP_Query to use for the parameters of our search.
	 */
	public function do_search( \WP_Query $query ) {
		if ( ! $this->should_handle_query( $query ) ) {
			do_action( 'jetpack_search_abort', 'search_attempted_non_search_query', $query );

			return;
		}

		$page = ( $query->get( 'paged' ) ) ? absint( $query->get( 'paged' ) ) : 1;

		// Get maximum allowed offset and posts per page values for the API.
		$max_offset         = Helper::get_max_offset();
		$max_posts_per_page = Helper::get_max_posts_per_page();

		$posts_per_page = $query->get( 'posts_per_page' );
		if ( $posts_per_page > $max_posts_per_page ) {
			$posts_per_page = $max_posts_per_page;
		}

		// Start building the WP-style search query args.
		// They'll be translated to API format args later.
		$wp_query_args = array(
			'query'          => $query->get( 's' ),
			'posts_per_page' => $posts_per_page,
			'paged'          => $page,
			'orderby'        => $query->get( 'orderby' ),
			'order'          => $query->get( 'order' ),
		);

		if ( ! empty( $this->aggregations ) ) {
			$wp_query_args['aggregations'] = $this->aggregations;
		}

		// Did we query for authors?
		if ( $query->get( 'author_name' ) ) {
			$wp_query_args['author_name'] = $query->get( 'author_name' );
		}

		$wp_query_args['post_type'] = $this->get_es_wp_query_post_type_for_query( $query );
		$wp_query_args['terms']     = $this->get_es_wp_query_terms_for_query( $query );

		/**
		 * Modify the search query parameters, such as controlling the post_type.
		 *
		 * These arguments are in the format of WP_Query arguments
		 *
		 * @module search
		 *
		 * @since  5.0.0
		 *
		 * @param array $wp_query_args The current query args, in WP_Query format.
		 * @param \WP_Query $query The original WP_Query object.
		 */
		$wp_query_args = apply_filters( 'jetpack_search_es_wp_query_args', $wp_query_args, $query );

		// If page * posts_per_page is greater than our max offset, send a 404. This is necessary because the offset is
		// capped at Helper::get_max_offset(), so a high page would always return the last page of results otherwise.
		if ( ( $wp_query_args['paged'] * $wp_query_args['posts_per_page'] ) > $max_offset ) {
			$query->set_404();

			return;
		}

		// If there were no post types returned, then 404 to avoid querying against non-public post types, which could
		// happen if we don't add the post type restriction to the ES query.
		if ( empty( $wp_query_args['post_type'] ) ) {
			$query->set_404();

			return;
		}

		// Convert the WP-style args into ES args.
		$api_query_args = $this->convert_wp_query_to_api_args( $wp_query_args );
		$api_query_args = $this->trigger_es_query_args_filter( $api_query_args, $query );
		$api_query_args = $this->trigger_instant_search_query_args_filter( $api_query_args );

		// Only trust ES to give us IDs, not the content since it is a mirror.
		$api_query_args['fields'] = array(
			'post_id',
		);

		// Do the actual search query!
		$this->search_result = $this->search( $api_query_args );

		if ( is_wp_error( $this->search_result ) || ! is_array( $this->search_result ) || empty( $this->search_result['results'] ) || ! is_array( $this->search_result['results'] ) ) {
			$this->found_posts = 0;

			return;
		}

		// If we have aggregations, fix the ordering to match the input order (ES doesn't guarantee the return order).
		if ( isset( $this->search_result['aggregations'] ) && ! empty( $this->search_result['aggregations'] ) ) {
			$this->search_result['aggregations'] = $this->fix_aggregation_ordering( $this->search_result['aggregations'], $this->aggregations );
		}

		// Total number of results for paging purposes. Capped at $max_offset + $posts_per_page, as deep paging gets quite expensive.
		$this->found_posts = min( $this->search_result['total'], $max_offset + $posts_per_page );
	}

	/**
	 * Run a search on the WordPress.com v1.3 public API.
	 *
	 * @param array $es_args Args conforming to the WP.com v1.3 search endpoint.
	 *
	 * @return array|\WP_Error The response from the public API converted to Classic Search format, or a WP_Error.
	 */
	public function search( array $es_args ) {
		return $this->instant_api( $es_args );
	}

	/**
	 * Converts WP_Query style args to v1.3 search API args.
	 *
	 * @param array $args Array of WP_Query style arguments.
	 *
	 * @return array Array of Search API v1.3 style request arguments.
	 */
	public function convert_wp_query_to_api_args( array $args ) {
		$from = 0;
		if ( ! empty( $args['offset'] ) ) {
			$from = absint( $args['offset'] );
		} elseif ( ! empty( $args['paged'] ) ) {
			$from = max( 0, ( absint( $args['paged'] ) - 1 ) * absint( $args['posts_per_page'] ) );
		}

		switch ( $args['orderby'] ?? 'relevance' ) {
			case 'date':
				$sort = ( strtolower( $args['order'] ?? '' ) === 'asc' ) ? 'date_asc' : 'date_desc';
				break;
			case 'relevance':
			default:
				$sort = 'score_recency';
				break;
		}
		$aggregations = array();
		foreach ( $args['aggregations'] ?? array() as $label => $aggregation ) {
			if ( empty( $aggregation['type'] ) ) {
				continue;
			}
			$size = min( (int) ( $aggregation['count'] ?? 10 ), $this->max_aggregations_count );
			switch ( $aggregation['type'] ) {
				case 'taxonomy':
					if ( $aggregation['taxonomy'] === 'post_tag' ) {
						$field = 'tag.slug_slash_name';
					} elseif ( $aggregation['taxonomy'] === 'category' ) {
						$field = 'category.slug_slash_name';
					} else {
						$field = "taxonomy.{$aggregation['taxonomy']}.slug_slash_name";
					}
					$aggregations[ $label ] = array(
						'terms' => array(
							'field' => $field,
							'size'  => $size,
						),
					);
					break;
				case 'post_type':
					$aggregations[ $label ] = array(
						'terms' => array(
							'field' => 'post_type',
							'size'  => $size,
						),
					);
					break;
				case 'author':
					$aggregations[ $label ] = array(
						'terms' => array(
							'field' => 'author_login_slash_name',
							'size'  => $size,
						),
					);
					break;
				case 'date_histogram':
					// remove post_ prefix from field name, e.g. replace post_date_gmt with date_gmt
					$aggregations[ $label ] = array(
						'date_histogram' => array(
							'field'             => str_replace( 'post_', '', $aggregation['field'] ?? '' ),
							'calendar_interval' => $aggregation['interval'],
							'min_doc_count'     => (int) ( $args['min_doc_count'] ?? 1 ),
						),
					);
					break;
				case 'product_attribute':
					if ( ! empty( $aggregation['attribute'] ) ) {
						$field                  = "taxonomy.{$aggregation['attribute']}.slug_slash_name";
						$aggregations[ $label ] = array(
							'terms' => array(
								'field' => $field,
								'size'  => $size,
							),
						);
					}
					break;
			}
		}

		$highlight_fields = array(
			'title',
			'content',
			'comments',
		);

		$fields = array(
			'blog_id',
			'post_id',
			'title',
			'content',
			'comments',
		);

		return array(
			'blog_id'          => $this->jetpack_blog_id,
			'size'             => (int) absint( $args['posts_per_page'] ),
			'from'             => (int) min( $from, Helper::get_max_offset() ),
			'fields'           => $fields,
			'highlight_fields' => $highlight_fields,
			'query'            => $args['query'] ?? '',
			'sort'             => $sort,
			'aggregations'     => empty( $aggregations ) ? null : $aggregations,
			'langs'            => $this->get_langs(),
			'filter'           => array(
				'bool' => array(
					'must' => $this->build_es_filters( $args ),
				),
			),
			'highlight'        => array(
				'fields' => $highlight_fields,
			),
		);
	}

	/**
	 * Trigger the jetpack_search_es_query_args filter for compatibility with Classic Search.
	 *
	 * The arguments can only be simulated, so this is not a 1:1 replacement.
	 * We support only some modifications, since not all of them are supported by Instant API.
	 * The goal is to support all common ones.
	 *
	 * @param array     $api_query_args Array of API query arguments.
	 * @param \WP_Query $query The original WP_Query object.
	 *
	 * @return array
	 */
	private function trigger_es_query_args_filter( array $api_query_args, \WP_Query $query ): array {
		$es_query_args = array(
			'blog_id'      => $api_query_args['blog_id'] ?? 1,
			'size'         => $api_query_args['size'] ?? 10,
			'from'         => $api_query_args['from'] ?? 0,
			'sort'         => array(
				array( '_score' => array( 'order' => 'desc' ) ),
			),
			'filter'       => $api_query_args['filter'] ?? array(),
			'query'        => array(
				'function_score' => array(
					'query'      => array(
						'bool' => array(
							'must' => array(
								array(
									'multi_match' => array(
										'fields'   => array( 'title.en' ),
										'query'    => $api_query_args['query'] ?? '',
										'operator' => 'and',
									),
								),
							),
						),
					),
					'functions'  => array( array( 'gauss' => array( 'date_gmt' => array( 'origin' => '2025-05-13' ) ) ) ),
					'max_boost'  => 2.0,
					'score_mode' => 'multiply',
					'boost_mode' => 'multiply',
				),
			),
			'aggregations' => $api_query_args['aggregations'] ?? array(),
			'fields'       => $api_query_args['fields'] ?? array(),
		);

		$es_query_args = apply_filters( 'jetpack_search_es_query_args', $es_query_args, $query );

		if ( ! empty( $es_query_args['aggregations'] ) && is_array( $es_query_args['aggregations'] ) ) {
			$api_query_args['aggregations'] = $es_query_args['aggregations'];
		}
		$api_query_args['filter'] = $es_query_args['filter'] ?? $api_query_args['filter'];
		$api_query_args['size']   = $es_query_args['size'] ?? $api_query_args['size'];
		$api_query_args['from']   = $es_query_args['from'] ?? $api_query_args['from'];
		if ( isset( $es_query_args['query']['bool']['must_not'] ) ) {
			$api_query_args['filter'] = array(
				'bool' => array(
					'must_not' => $es_query_args['query']['bool']['must_not'],
					'filter'   => array(
						$api_query_args['filter'],
					),
				),
			);
		}
		if ( isset( $es_query_args['query']['bool']['filter'] ) && is_array( $es_query_args['query']['bool']['filter'] ) ) {
			$new_filter = array(
				'bool' => array(
					'filter' => $es_query_args['query']['bool']['filter'],
				),
			);
			if ( ! empty( $api_query_args['filter'] ) ) {
				$new_filter['bool']['filter'][] = $api_query_args['filter'];
			}
			$api_query_args['filter'] = $new_filter;
		}

		return $api_query_args;
	}

	/**
	 * Trigger jetpack_instant_search_options for compatibility with Instant Search.
	 *
	 * @param array $api_query_args Array of API query arguments.
	 *
	 * @return array
	 */
	private function trigger_instant_search_query_args_filter( array $api_query_args ): array {
		// this will trigger jetpack_instant_search_options filter
		$options = Helper::generate_initial_javascript_state();

		if ( isset( $options['adminQueryFilter'] ) ) {
			$api_query_args['filter'] = array(
				'bool' => array(
					'filter' => $api_query_args['filter'],
					'must'   => $options['adminQueryFilter'],
				),
			);
		}

		return $api_query_args;
	}

	/**
	 * Return array of languages to search on after executing the dedicated filter.
	 *
	 * @return array
	 */
	private function get_langs(): array {
		/**
		 * Filter the languages used by Jetpack Search's Query Parser.
		 *
		 * @module search
		 *
		 * @since  7.9.0
		 *
		 * @param array $languages The array of languages. Default is value of get_locale().
		 */
		return (array) apply_filters( 'jetpack_search_query_languages', array( get_locale() ) );
	}

	/**
	 * Converts WP_Query style search args to ES filters.
	 *
	 * @param array $args WP_Query style search arguments.
	 *
	 * @return array ES filters.
	 */
	private function build_es_filters( array $args ): array {
		$filters = array();

		if ( ! empty( $args['author'] ) ) {
			// ES stores usernames, not IDs, so transform.
			foreach ( (array) $args['author'] as $author ) {
				$user = get_user_by( 'id', $author );

				if ( $user && ! empty( $user->user_login ) ) {
					$args['author_name'][] = $user->user_login;
				}
			}
		}
		if ( ! empty( $args['author_name'] ) ) {
			$filters[] = array( 'terms' => array( 'author_login' => (array) $args['author_name'] ) );
		}
		if ( ! empty( $args['post_type'] ) ) {
			$filters[] = array( 'terms' => array( 'post_type' => (array) $args['post_type'] ) );
		}

		if ( ! empty( $args['date_range'] ) && isset( $args['date_range']['field'] ) ) {
			$field = $args['date_range']['field'];
			unset( $args['date_range']['field'] );
			$filters[] = array( 'range' => array( $field => $args['date_range'] ) );
		}

		if ( ! empty( $args['terms'] ) && is_array( $args['terms'] ) ) {
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
						$filters[] = array( 'term' => array( $tax_fld => $term ) );
					}
				}
			}
		}

		return $filters;
	}

	/**
	 * Executes v1.3 search API request.
	 *
	 * @param array $es_args Array of Search API v1.3 style request arguments.
	 *
	 * @return array|\WP_Error API response body array or error.
	 */
	protected function instant_api( array $es_args ) {
		$instant_search                  = new Instant_Search();
		$instant_search->jetpack_blog_id = $this->jetpack_blog_id;

		return $instant_search->instant_api( $es_args );
	}

	/**
	 * Get the most recent API response.
	 *
	 * @param bool $raw Ignored.
	 *
	 * @return array|\WP_Error|null Search API response.
	 */
	public function get_search_result(
		$raw = false // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	) {
		return $this->search_result;
	}

	/**
	 * Process search results to extract post IDs and highlighted content.
	 */
	private function process_search_results() {
		$post_ids = array();

		foreach ( $this->search_result['results'] as $result ) {
			$post_id    = (int) ( $result['fields']['post_id'] ?? 0 );
			$post_ids[] = $post_id;
		}

		$this->search_result_ids = $post_ids;
		$this->highlighter       = new Inline_Search_Highlighter( $post_ids );

		// Hand the entire results array over; Inline_Search_Highlighter
		// will pull out `fields.post_id` and `highlight` for each one.
		$this->highlighter->process_results( $this->search_result['results'] );

		$this->highlighter->setup();
	}

	/**
	 * Create a WP_Query to fetch the posts for search results.
	 *
	 * @param \WP_Query $original_query The original WP_Query.
	 *
	 * @return \WP_Query The new query with posts matching the search results.
	 */
	private function create_posts_query( \WP_Query $original_query ): \WP_Query {
		$args = array(
			'post__in'            => $this->search_result_ids,
			'orderby'             => 'post__in',
			'perm'                => 'readable',
			'post_type'           => 'any',
			'ignore_sticky_posts' => true,
			'suppress_filters'    => true,
			'posts_per_page'      => $original_query->get( 'posts_per_page' ),
		);

		return new \WP_Query( $args );
	}
}
