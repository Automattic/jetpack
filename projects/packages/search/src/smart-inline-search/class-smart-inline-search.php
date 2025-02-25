<?php
/**
 * Smart Inline Search: search without popup using v1.3 Instant Search API
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Smart Inline Search class
 */
class Smart_Inline_Search extends Classic_Search {
	/**
	 * The singleton instance of this class.
	 *
	 * @var Smart_Inline_Search
	 */
	private static $instance;

	/**
	 * Returns whether this class should be used instead of Classic_Search.
	 */
	public static function should_replace_classic_search(): bool {
		return (bool) apply_filters( 'jetpack_search_enable_smart_inline', false );
	}

	/**
	 * Returns a class singleton. Initializes with first-time setup.
	 *
	 * @param string $blog_id Blog id.
	 * @return Smart_Inline_Search The class singleton.
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
	 * Run a search on the WordPress.com v1.3 public API.
	 *
	 * @param array $es_args Args conforming to the WP.com v1.3 search endpoint.
	 *
	 * @return array|\WP_Error The response from the public API converted to Classic Search format, or a WP_Error.
	 */
	public function search( array $es_args ) {
		$response = $this->instant_api( $es_args );
		if ( is_wp_error( $response ) || ! is_array( $response ) ) {
			return $response;
		}

		return array(
			'results' => array(
				'total'        => $response['total'],
				'hits'         => array_map(
					function ( $hit ) {
						return array(
							'fields' => $hit['fields'],
						);
					},
					$response['results']
				),
				'aggregations' => $response['aggregations'] ?? array(),
			),
		);
	}

	/**
	 * Converts WP_Query style args to v1.3 search API args.
	 *
	 * @param array $args Array of WP_Query style arguments.
	 *
	 * @return array Array of Search API v1.3 style request arguments.
	 */
	public function convert_wp_es_to_es_args( array $args ) {
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

		return array(
			'blog_id'      => $this->jetpack_blog_id,
			'size'         => absint( $args['posts_per_page'] ),
			'from'         => min( $from, Helper::get_max_offset() ),
			'fields'       => array( 'blog_id', 'post_id' ),
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
}
