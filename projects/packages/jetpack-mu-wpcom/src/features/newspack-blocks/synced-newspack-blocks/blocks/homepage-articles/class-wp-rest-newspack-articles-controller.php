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

		// Endpoint to get styles in the editor.
		register_rest_route(
			$this->namespace,
			'/homepage-articles-css',
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ 'Newspack_Blocks_API', 'css_endpoint' ],
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
		$page        = (int) $request->get_param( 'page' ) ?? 1;
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

		// Provide next URL if there are more pages.
		$show_next_button = ! empty( $exclude_ids ) ? $article_query->max_num_pages > 1 : $article_query->max_num_pages > $next_page;
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

		return rest_ensure_response(
			[
				'items' => $items,
				'ids'   => $ids,
				'next'  => $next_url,
			]
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
