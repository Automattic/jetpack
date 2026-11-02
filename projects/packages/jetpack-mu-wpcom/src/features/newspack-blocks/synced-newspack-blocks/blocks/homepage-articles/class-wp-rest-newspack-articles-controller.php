<?php
/**
 * WP_REST_Newspack_Articles_Controller file.
 *
 * @package WordPress
 */

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedClassFound
/**
 * Class WP_REST_Newspack_Articles_Controller.
 */
class WP_REST_Newspack_Articles_Controller extends WP_REST_Controller {
// phpcs:enable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedClassFound

	/**
	 * Attribute schema.
	 *
	 * @var array
	 */
	public $attribute_schema;

	/**
	 * Constructs the controller.
	 *
	 * @access public
	 */
	public function __construct() {
		$this->namespace = 'newspack-blocks/v1';
	}

	/**
	 * Registers the necessary REST API routes.
	 *
	 * @access public
	 */
	public function register_routes() {
		// Endpoint to get articles on the front-end.
		register_rest_route(
			$this->namespace,
			'/articles',
			[
				[
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => [ $this, 'get_items' ],
					'args'                => $this->get_attribute_schema(),
					'permission_callback' => '__return_true',
				],
			]
		);

		// Endpoint to get articles in the editor, in regular/query mode.
		register_rest_route(
			$this->namespace,
			'/newspack-blocks-posts',
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ 'Newspack_Blocks_API', 'posts_endpoint' ],
				'args'                => array_merge(
					$this->get_attribute_schema(),
					[
						'exclude' => [ // phpcs:ignore WordPressVIPMinimum.Performance.WPQueryParams.PostNotIn_exclude
							'type'    => 'array',
							'items'   => array(
								'type' => 'integer',
							),
							'default' => array(),
						],
						'include' => [
							'type'    => 'array',
							'items'   => array(
								'type' => 'integer',
							),
							'default' => array(),
						],
					]
				),
				'permission_callback' => function() {
					return current_user_can( 'edit_posts' );
				},
			]
		);

		// Endpoint to get articles for every block on a page in one request, in document order.
		register_rest_route(
			$this->namespace,
			'/newspack-blocks-posts-batch',
			[
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => [ 'Newspack_Blocks_API', 'posts_batch_endpoint' ],
				'args'                => [
					'queries' => [
						'type'     => 'array',
						'required' => true,
						'maxItems' => Newspack_Blocks_API::POSTS_BATCH_MAX_QUERIES,
						// Core fills defaults for top-level args only, so the handler supplies its
						// own for these two rather than relying on the schema.
						'items'    => [
							'type'       => 'object',
							'properties' => [
								'clientId'    => [
									'type'     => 'string',
									'required' => true,
								],
								'postsQuery'  => [
									'type' => 'object',
								],
								'deduplicate' => [
									'type' => 'boolean',
								],
							],
						],
					],
					'exclude' => [ // phpcs:ignore WordPressVIPMinimum.Performance.WPQueryParams.PostNotIn_exclude
						'type'     => 'array',
						'items'    => [
							'type' => 'integer',
						],
						// Every deduplicating query carries this list plus everything the batch has
						// matched so far, so an unbounded list here is work every query pays for.
						'maxItems' => Newspack_Blocks_API::POSTS_BATCH_MAX_EXCLUDE,
						'default'  => [],
					],
				],
				'permission_callback' => function() {
					return current_user_can( 'edit_posts' );
				},
			]
		);

		// Endpoint to get articles in the editor, in specific posts mode.
		register_rest_route(
			$this->namespace,
			'/newspack-blocks-specific-posts',
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ 'Newspack_Blocks_API', 'specific_posts_endpoint' ],
				'args'                => [
					'search'      => [
						'sanitize_callback' => 'sanitize_text_field',
					],
					'postsToShow' => [
						'sanitize_callback' => 'absint',
					],
					'postType'    => [
						'type'    => 'array',
						'items'   => array(
							'type' => 'string',
						),
						'default' => array(),
					],
				],
				'permission_callback' => function() {
					return current_user_can( 'edit_posts' );
				},
			]
		);
	}

	/**
	 * Returns a list of rendered posts.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function get_items( $request ) {
		$page        = max( 1, (int) $request->get_param( 'page' ) );
		$exclude_ids = $request->get_param( 'exclude_ids' ) ?? [];
		$next_page   = $page + 1;
		$attributes  = wp_parse_args(
			$request->get_params() ?? [],
			wp_list_pluck( $this->get_attribute_schema(), 'default' )
		);

		$deduplicate = $request->get_param( 'deduplicate' ) ?? 1;
		if ( ! $deduplicate ) {
			$exclude_ids = [];
		}

		// This endpoint is public, so restrict it to publicly viewable post types — matching
		// what WordPress exposes on the front end. The editor endpoints are capability-gated.
		$attributes['postType'] = self::filter_viewable_post_types( $attributes['postType'] );
		if ( empty( $attributes['postType'] ) ) {
			// Every requested post type was non-viewable; return nothing rather than
			// substituting a different post type.
			return self::articles_response();
		}

		$article_query_args = Newspack_Blocks::build_articles_query( $attributes, apply_filters( 'newspack_blocks_block_name', 'newspack-blocks/homepage-articles' ) );

		// If using exclude_ids, don't worry about pagination. Just get the next postsToShow number of results without the excluded posts. Otherwise, use standard WP pagination.
		$query = ! empty( $exclude_ids ) ?
			array_merge(
				$article_query_args,
				[
					'post__not_in' => $exclude_ids, // phpcs:ignore WordPressVIPMinimum.Performance.WPQueryParams.PostNotIn_post__not_in
				]
			) :
			array_merge(
				$article_query_args,
				[
					'paged' => $page,
				]
			);

		// Run Query.
		$article_query = new WP_Query( $query );

		// Defaults.
		$items    = [];
		$ids      = [];
		$next_url = '';

		Newspack_Blocks::filter_excerpt( $attributes );

		// The Loop.
		while ( $article_query->have_posts() ) {
			$article_query->the_post();
			$html = Newspack_Blocks::template_inc(
				__DIR__ . '/templates/article.php',
				[
					'attributes' => $attributes,
				]
			);

			$items[]['html'] = $html;
			$ids[]           = get_the_ID();
		}

		Newspack_Blocks::remove_excerpt_filter();

		// Provide next URL if posts remain after this response. With exclude_ids the query holds only
		// unseen posts, so a second page means more remain; otherwise this response is page $page.
		$show_next_button = ! empty( $exclude_ids ) ? $article_query->max_num_pages > 1 : $article_query->max_num_pages > $page;
		if ( $show_next_button ) {
			$next_url = add_query_arg(
				array_merge(
					array_map(
						function( $attribute ) {
							return false === $attribute ? '0' : $attribute;
						},
						$attributes
					),
					[
						'exclude_ids' => false,
						'page'        => $next_page,
					]
				),
				rest_url( '/newspack-blocks/v1/articles' )
			);
		}

		return self::articles_response( $items, $ids, $next_url );
	}

	/**
	 * Build the articles endpoint response.
	 *
	 * @param array  $items Rendered article items.
	 * @param array  $ids   Post ids in the response.
	 * @param string $next  URL for the next page, or empty string when there is none.
	 * @return WP_REST_Response
	 */
	private static function articles_response( $items = [], $ids = [], $next = '' ) {
		return rest_ensure_response(
			[
				'items' => $items,
				'ids'   => $ids,
				'next'  => $next,
			]
		);
	}

	/**
	 * Restrict a list of post types to those the public articles endpoint may serve:
	 * publicly-viewable types, plus any explicitly allow-listed via the
	 * `newspack_blocks_articles_allowed_post_types` filter.
	 *
	 * Keeps the endpoint from exposing post types WordPress would not surface on the
	 * front end, while letting a plugin deliberately opt a specific non-viewable CPT
	 * in. Disallowed types are dropped; the returned list may be empty when none
	 * qualify (the caller then returns no results).
	 *
	 * @param array|string $post_types Requested post type(s).
	 * @return array Allowed post types (may be empty).
	 */
	private static function filter_viewable_post_types( $post_types ) {
		/**
		 * Post types the public articles endpoint may serve in addition to the
		 * publicly-viewable ones. Each entry is an explicit, per-CPT decision to
		 * expose that type's published posts to unauthenticated callers — do not
		 * add types whose published content should stay off the public REST surface.
		 *
		 * @param string[] $allowed Post type slugs to allow. Default empty.
		 */
		$allowed = (array) apply_filters( 'newspack_blocks_articles_allowed_post_types', [] );
		return array_values(
			array_filter(
				(array) $post_types,
				function ( $type ) use ( $allowed ) {
					return is_post_type_viewable( $type ) || in_array( $type, $allowed, true );
				}
			)
		);
	}

	/**
	 * Sets up and returns attribute schema.
	 *
	 * @return array
	 */
	public function get_attribute_schema() {
		if ( empty( $this->attribute_schema ) ) {
			$block_json = json_decode(
				file_get_contents( __DIR__ . '/block.json' ), // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
				true
			);

			$this->attribute_schema = array_merge(
				$block_json['attributes'],
				[
					'exclude_ids' => [
						'type'    => 'array',
						'default' => [],
						'items'   => [
							'type' => 'integer',
						],
					],
				]
			);
		}
		return $this->attribute_schema;
	}
}
