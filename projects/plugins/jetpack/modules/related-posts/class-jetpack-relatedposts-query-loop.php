<?php
/**
 * Related Posts Query Loop block variation.
 *
 * Registers a variation of the core Query Loop block that displays
 * Jetpack Related Posts, so the results can be laid out and styled with
 * the full flexibility of the Query Loop block instead of the fixed
 * markup the Related Posts block renders.
 *
 * Originally developed by the Automattic Special Projects team as the
 * standalone "Jetpack Related Posts Query Loop" plugin.
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Adds a "Related Posts" variation to the core Query Loop block, feeding it
 * post IDs from the Related Posts module in place of the loop's normal query.
 */
class Jetpack_RelatedPosts_Query_Loop {

	/**
	 * The `namespace` attribute stamped on Query Loop blocks using this
	 * variation. Rendering only diverges from a plain Query Loop when a
	 * block carries this namespace.
	 *
	 * @var string
	 */
	const QUERY_NAMESPACE = 'jetpack/related-posts-query-loop';

	/**
	 * Hook the variation into block registration and rendering.
	 */
	public static function init() {
		add_filter( 'get_block_type_variations', array( __CLASS__, 'register_block_variation' ), 10, 2 );
		add_filter( 'pre_render_block', array( __CLASS__, 'pre_render_query_block' ), 10, 2 );
	}

	/**
	 * Register the Related Posts variation of the Query Loop block.
	 *
	 * @param array         $variations Registered variations for the block type.
	 * @param WP_Block_Type $block_type The full block type object.
	 *
	 * @return array
	 */
	public static function register_block_variation( $variations, $block_type ) {
		if ( 'core/query' !== $block_type->name ) {
			return $variations;
		}

		$variations[] = array(
			'icon'            => 'star-filled',
			'name'            => 'related-posts-query-loop',
			'title'           => __( 'Related Posts (Query Loop)', 'jetpack' ),
			'description'     => __( 'Display related posts in a customizable query loop. Note: the editor preview shows recent posts; related posts are calculated when the post is viewed.', 'jetpack' ),
			'keywords'        => array(
				/* translators: search keyword for the Related Posts Query Loop block variation */
				__( 'query', 'jetpack' ),
				/* translators: search keyword for the Related Posts Query Loop block variation */
				__( 'related', 'jetpack' ),
			),
			'attributes'      => array(
				'align'     => 'wide',
				'query'     => array(
					'perPage'  => 4,
					'inherit'  => false,
					'postType' => 'post',
				),
				'namespace' => self::QUERY_NAMESPACE,
			),
			'allowedControls' => array( 'postCount', 'postType' ),
			'isActive'        => array( 'namespace' ),
			'isDefault'       => false,
		);

		return $variations;
	}

	/**
	 * When a Query Loop block using this variation is about to render, hook in
	 * the query-vars filter that swaps the loop's query for related posts.
	 *
	 * The filter is added per matching block (and removes itself after running)
	 * so it never affects sibling Query Loop blocks on the same page.
	 *
	 * @param string|null $pre_render The pre-rendered content. Default null.
	 * @param array       $block      The block being rendered, as an associative array. See WP_Block_Parser_Block.
	 *
	 * @return string|null
	 */
	public static function pre_render_query_block( $pre_render, $block ) {
		if ( 'core/query' !== $block['blockName'] ) {
			return $pre_render;
		}

		if ( isset( $block['attrs']['namespace'] ) && self::QUERY_NAMESPACE === $block['attrs']['namespace'] ) {
			add_filter( 'query_loop_block_query_vars', array( __CLASS__, 'filter_query_loop_block_query_vars' ) );
		}

		return $pre_render;
	}

	/**
	 * Swap the Query Loop block's query vars for a related-posts query.
	 *
	 * Removes itself immediately so it only applies to the one block that
	 * registered it in {@see pre_render_query_block()}.
	 *
	 * @param array $query_args `WP_Query` arguments as parsed from the block context.
	 *
	 * @return array
	 */
	public static function filter_query_loop_block_query_vars( $query_args ) {
		remove_filter( 'query_loop_block_query_vars', array( __CLASS__, 'filter_query_loop_block_query_vars' ) );

		return self::get_related_posts_query_args( $query_args );
	}

	/**
	 * Build `WP_Query` arguments that pin the Query Loop to related posts.
	 *
	 * Asks the Related Posts module for posts related to the current post. If
	 * none are available (for example, the site has not finished syncing), it
	 * falls back to random recent posts so the block does not render empty.
	 *
	 * @param array $query_args `WP_Query` arguments as parsed from the block context.
	 *
	 * @return array
	 */
	public static function get_related_posts_query_args( $query_args ) {
		$post_id = get_the_ID();

		if ( false === $post_id ) {
			return $query_args;
		}

		$posts_per_page = isset( $query_args['posts_per_page'] ) ? (int) $query_args['posts_per_page'] : 4;
		$post_type      = $query_args['post_type'] ?? 'post';

		$related  = Jetpack_RelatedPosts::init_raw()
			->set_query_name( 'jetpack_related_posts_query_loop' )
			->get_for_post_id(
				$post_id,
				array(
					'size'      => $posts_per_page,
					'post_type' => $post_type,
				)
			);
		$post_ids = array_filter(
			wp_list_pluck( $related, 'id' ),
			function ( $related_post_id ) {
				return (int) $related_post_id > 0;
			}
		);

		if ( array() === $post_ids ) {
			/**
			 * Filter whether the Related Posts Query Loop variation falls back to
			 * random recent posts when no related posts are available.
			 *
			 * @module related-posts
			 *
			 * @since $$next-version$$
			 *
			 * @param bool $fallback_enabled Whether to fall back to random recent posts. Default true.
			 * @param int  $post_id          ID of the post the block is rendering on.
			 */
			if ( apply_filters( 'jetpack_relatedposts_query_loop_fallback', true, $post_id ) ) {
				$fallback = new WP_Query(
					array(
						'posts_per_page'      => $posts_per_page * 3,
						'fields'              => 'ids',
						'post_type'           => $post_type,
						'post__not_in'        => array( $post_id ),
						'ignore_sticky_posts' => true,
						'no_found_rows'       => true,
					)
				);

				$post_ids = array_map( 'intval', (array) $fallback->posts );
				shuffle( $post_ids );
			}
		}

		// Only query for the posts we need.
		$post_ids = array_slice( $post_ids, 0, $posts_per_page );

		$query_args['offset']   = 0;
		$query_args['post__in'] = $post_ids;
		$query_args['orderby']  = 'post__in';

		return $query_args;
	}
}
