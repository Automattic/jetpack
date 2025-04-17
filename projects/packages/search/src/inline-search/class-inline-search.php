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
	 * Stores highlighted content from search results.
	 *
	 * @var array
	 */
	private $highlighted_content = array();

	/**
	 * Stores the search term used in the query.
	 *
	 * @var string
	 */
	private $search_term;

	/**
	 * Stores the corrected search term if provided by the API.
	 *
	 * @var string
	 */
	private $corrected_search_term;

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
		return (bool) apply_filters( 'jetpack_search_replace_classic', false );
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
	 * Set up the WordPress filters.
	 *
	 * @param string $blog_id The blog ID to set up for.
	 */
	public function setup( $blog_id ) {
		parent::setup( $blog_id );

		// Add filters to display highlighted content
		add_filter( 'the_title', array( $this, 'filter_highlighted_title' ), 10, 2 );
		add_filter( 'the_content', array( $this, 'filter_highlighted_content' ), 10, 1 );
		add_filter( 'get_the_excerpt', array( $this, 'filter_highlighted_excerpt' ), 10, 2 );
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
		$this->process_search_results( $query );

		// Create a WP_Query to fetch the actual posts.
		$posts_query = $this->create_posts_query( $query );

		// WP Core doesn't call the set_found_posts and its filters when filtering posts_pre_query like we do, so need to do these manually.
		$query->found_posts   = $this->found_posts;
		$query->max_num_pages = ceil( $this->found_posts / $query->get( 'posts_per_page' ) );

		return $posts_query->posts;
	}

	/**
	 * Filter the post title to show highlighted version.
	 *
	 * @param string $title The post title.
	 * @param int    $post_id The post ID.
	 * @return string The filtered title.
	 */
	public function filter_highlighted_title( $title, $post_id ) {
		// Only process if this is one of our search results
		if ( ! $this->is_search_result( $post_id ) ) {
			return $title;
		}

		// Check if we have a highlighted title from the API
		if ( ! empty( $this->highlighted_content[ $post_id ]['title'] ) ) {
			// Return the highlighted content
			return $this->highlighted_content[ $post_id ]['title'];
		}

		// If no pre-highlighted title, manually highlight the search term
		if ( ! empty( $this->search_term ) ) {
			return $this->apply_highlight_patterns( $title, $this->search_term );
		}

		return $title;
	}

	/**
	 * Filter the post content to show highlighted version.
	 *
	 * @param string $content The post content.
	 * @return string The filtered content.
	 */
	public function filter_highlighted_content( $content ) {
		// Get current post ID
		$post_id = get_the_ID();

		// Only process if this is one of our search results
		if ( ! $this->is_search_result( $post_id ) ) {
			return $content;
		}

		if ( ! empty( $this->highlighted_content[ $post_id ]['content'] ) ) {
			return $this->highlighted_content[ $post_id ]['content'];
		}

		// If we don't have highlighted content, manually highlight the search term
		if ( ! empty( $this->search_term ) ) {
			return $this->apply_highlight_patterns( $content, $this->search_term );
		}

		return $content;
	}

	/**
	 * Filter the post excerpt to show highlighted version.
	 *
	 * @param string $excerpt The post excerpt.
	 * @param int    $post_id The post ID.
	 * @return string The filtered excerpt.
	 */
	public function filter_highlighted_excerpt( $excerpt, $post_id = 0 ) {
		if ( 0 === $post_id ) {
			$post_id = get_the_ID();
		}

		// Only process if this is one of our search results
		if ( ! $this->is_search_result( $post_id ) ) {
			return $excerpt;
		}

		if ( ! empty( $this->highlighted_content[ $post_id ]['excerpt'] ) ) {
			return $this->highlighted_content[ $post_id ]['excerpt'];
		}

		// If we don't have highlighted excerpt, manually highlight the search term
		if ( ! empty( $this->search_term ) ) {
			return $this->apply_highlight_patterns( $excerpt, $this->search_term );
		}

		return $excerpt;
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
		 * @param array     $wp_query_args The current query args, in WP_Query format.
		 * @param \WP_Query $query            The original WP_Query object.
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
		$es_query_args = $this->convert_wp_query_to_api_args( $wp_query_args );

		// Only trust ES to give us IDs, not the content since it is a mirror.
		$es_query_args['fields'] = array(
			'post_id',
		);

		// Do the actual search query!
		$this->search_result = $this->search( $es_query_args );

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
						$field = 'tag.slug';
					} elseif ( $aggregation['taxonomy'] === 'category' ) {
						$field = 'category.slug';
					} else {
						$field = "taxonomy.{$aggregation['taxonomy']}.slug";
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
			}
		}

		$highlight_options = array(
			'pre_tags'  => array( '<mark>' ),
			'post_tags' => array( '</mark>' ),
			'fields'    => array(
				'title'   => array( 'number_of_fragments' => 0 ),
				'content' => array( 'number_of_fragments' => 0 ),
				'excerpt' => array( 'number_of_fragments' => 0 ),
			),
		);

		return array(
			'blog_id'      => $this->jetpack_blog_id,
			'size'         => absint( $args['posts_per_page'] ),
			'from'         => min( $from, Helper::get_max_offset() ),
			'fields'       => array( 'blog_id', 'post_id', 'title', 'content', 'excerpt' ),
			'highlight'    => $highlight_options,
			'query'        => $args['query'] ?? '',
			'sort'         => $sort,
			'aggregations' => empty( $aggregations ) ? null : $aggregations,
			'langs'        => $this->get_langs(),
			'filter'       => array(
				'bool' => array(
					'must' => $this->build_es_filters( $args ),
				),
			),
		);
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

	// PRIVATE HELPER METHODS

	/**
	 * Process search results to extract post IDs and highlighted content.
	 *
	 * @param \WP_Query $query The original WP_Query.
	 */
	private function process_search_results( $query ) {
		$post_ids                  = array();
		$this->highlighted_content = array();
		$this->search_term         = $query->get( 's' );

		// Store corrected query if available
		if ( ! empty( $this->search_result['corrected_query'] ) ) {
			$this->corrected_search_term = $this->search_result['corrected_query'];
		} else {
			$this->corrected_search_term = '';
		}

		foreach ( $this->search_result['results'] as $result ) {
			$post_id    = (int) ( $result['fields']['post_id'] ?? 0 );
			$post_ids[] = $post_id;

			$this->process_result_highlighting( $result, $post_id );
		}

		$this->search_result_ids = $post_ids;
	}

	/**
	 * Process highlighting data for a single search result.
	 *
	 * @param array $result  The search result data from the API.
	 * @param int   $post_id The post ID for this result.
	 */
	private function process_result_highlighting( $result, $post_id ) {
		if ( empty( $result['highlight'] ) ) {
			return;
		}

		// Check for data in various highlight field formats.
		$title   = $this->extract_highlight_field( $result, 'title' );
		$content = $this->extract_highlight_field( $result, 'content' );
		$excerpt = $this->extract_highlight_field( $result, 'excerpt' );

		$this->highlighted_content[ $post_id ] = array(
			'title'   => $title,
			'content' => $content,
			'excerpt' => $excerpt,
		);

		// If we don't have highlighted content, create some by highlighting the search term.
		if ( empty( $title ) && ! empty( $result['fields']['title'] ) ) {
			// First use the original search term
			if ( ! empty( $this->search_term ) ) {
				$title_with_highlights = $this->apply_highlight_patterns(
					$result['fields']['title'],
					$this->search_term,
					false // Don't use corrected term yet
				);

				// Then apply the corrected term if available
				if ( ! empty( $this->corrected_search_term ) && $this->corrected_search_term !== $this->search_term ) {
					$title_with_highlights = $this->apply_highlight_patterns(
						$title_with_highlights,
						$this->corrected_search_term,
						false // Don't recursively apply correction
					);
				}

				$this->highlighted_content[ $post_id ]['title'] = $title_with_highlights;
			}
		}

		if ( empty( $content ) && ! empty( $result['fields']['content'] ) ) {
			// First use the original search term
			if ( ! empty( $this->search_term ) ) {
				$content_with_highlights = $this->apply_highlight_patterns(
					$result['fields']['content'],
					$this->search_term,
					false // Don't use corrected term yet
				);

				// Then apply the corrected term if available
				if ( ! empty( $this->corrected_search_term ) && $this->corrected_search_term !== $this->search_term ) {
					$content_with_highlights = $this->apply_highlight_patterns(
						$content_with_highlights,
						$this->corrected_search_term,
						false // Don't recursively apply correction
					);
				}

				$this->highlighted_content[ $post_id ]['content'] = $content_with_highlights;
			}
		}
	}

	/**
	 * Extract a highlight field from the search result, handling different field formats.
	 *
	 * @param array  $result The search result data from the API.
	 * @param string $field  The field name to extract.
	 * @return string The extracted highlighted field.
	 */
	private function extract_highlight_field( $result, $field ) {
		if ( ! empty( $result['highlight'][ $field ] ) && is_array( $result['highlight'][ $field ] ) ) {
			return $result['highlight'][ $field ][0];
		} elseif ( ! empty( $result['highlight'][ $field . '.default' ] ) && is_array( $result['highlight'][ $field . '.default' ] ) ) {
			return $result['highlight'][ $field . '.default' ][0];
		}
		return '';
	}

	/**
	 * Create a WP_Query to fetch the posts for search results.
	 *
	 * @param \WP_Query $original_query The original WP_Query.
	 * @return \WP_Query The new query with posts matching the search results.
	 */
	private function create_posts_query( $original_query ) {
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

	/**
	 * Prepare search pattern for highlighting
	 *
	 * @param string $search_term The search term to highlight.
	 * @return array Array of patterns to use for highlighting.
	 */
	private function prepare_highlight_patterns( $search_term ) {
		// Split search term into words
		$terms    = preg_split( '/\s+/', trim( $search_term ) );
		$patterns = array();

		// Add patterns for each individual word
		foreach ( $terms as $term ) {
			if ( strlen( $term ) < 3 ) {
				// Use exact matching for very short terms
				$patterns[] = '/\b(' . preg_quote( $term, '/' ) . ')\b/i';
			} else {
				// Word boundary for normal words
				$patterns[] = '/\b(' . preg_quote( $term, '/' ) . ')\b/i';
				// Also try without word boundary
				$patterns[] = '/(' . preg_quote( $term, '/' ) . ')/i';
			}
		}

		// Also try the full phrase
		if ( count( $terms ) > 1 ) {
			$patterns[] = '/(' . preg_quote( $search_term, '/' ) . ')/i';
		}

		return $patterns;
	}

	/**
	 * Apply highlight patterns to content
	 *
	 * @param string $content The content to highlight.
	 * @param string $search_term The search term to highlight.
	 * @param bool   $use_corrected Whether to also use the corrected search term.
	 * @return string The highlighted content.
	 */
	private function apply_highlight_patterns( $content, $search_term, $use_corrected = true ) {
		$patterns    = $this->prepare_highlight_patterns( $search_term );
		$highlighted = $content;

		// Apply original search term patterns
		foreach ( $patterns as $pattern ) {
			$highlighted = preg_replace( $pattern, '<mark>$1</mark>', $highlighted );
		}

		// Also apply corrected search term patterns if available and requested
		if ( $use_corrected && ! empty( $this->corrected_search_term ) && $this->corrected_search_term !== $search_term ) {
			$corrected_patterns = $this->prepare_highlight_patterns( $this->corrected_search_term );
			foreach ( $corrected_patterns as $pattern ) {
				$highlighted = preg_replace( $pattern, '<mark>$1</mark>', $highlighted );
			}
		}

		return $highlighted;
	}

	/**
	 * Check if the current post is a search result from our API
	 *
	 * @param int $post_id The post ID to check.
	 * @return bool Whether the post is a search result.
	 */
	private function is_search_result( $post_id ) {
		return is_search() && in_the_loop() && ! empty( $this->search_result_ids ) && in_array( $post_id, $this->search_result_ids, true );
	}
}
