<?php

require_once __DIR__ . '/../../../../modules/related-posts.php';

/**
 * Tests for the Related Posts Query Loop block variation.
 */
class Jetpack_RelatedPosts_Query_Loop_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		Jetpack_RelatedPosts_Module::instance()->action_on_load();

		// Never hit the WordPress.com API during the tests.
		add_filter(
			'pre_http_request',
			static function () {
				return new WP_Error( 'no_http_in_tests', 'HTTP disabled in tests' );
			}
		);
	}

	/**
	 * The variation must be added to the core Query Loop block only.
	 */
	public function test_variation_is_registered_for_query_block_only() {
		$query_variations = Jetpack_RelatedPosts_Query_Loop::register_block_variation(
			array(),
			new WP_Block_Type( 'core/query' )
		);
		$this->assertCount( 1, $query_variations );
		$this->assertSame(
			Jetpack_RelatedPosts_Query_Loop::QUERY_NAMESPACE,
			$query_variations[0]['attributes']['namespace']
		);

		$this->assertSame(
			array(),
			Jetpack_RelatedPosts_Query_Loop::register_block_variation(
				array(),
				new WP_Block_Type( 'core/paragraph' )
			),
			'Other block types must not receive the variation.'
		);
	}

	/**
	 * The query-vars filter must only be hooked for Query Loop blocks that
	 * carry the variation's namespace, so plain Query Loop blocks on the same
	 * page render their normal query.
	 */
	public function test_query_vars_filter_only_hooked_for_variation_blocks() {
		$callback = array( Jetpack_RelatedPosts_Query_Loop::class, 'filter_query_loop_block_query_vars' );

		Jetpack_RelatedPosts_Query_Loop::pre_render_query_block(
			null,
			array(
				'blockName' => 'core/query',
				'attrs'     => array(),
			)
		);
		$this->assertFalse(
			has_filter( 'query_loop_block_query_vars', $callback ),
			'A plain Query Loop block must not hook the filter.'
		);

		Jetpack_RelatedPosts_Query_Loop::pre_render_query_block(
			null,
			array(
				'blockName' => 'core/query',
				'attrs'     => array( 'namespace' => Jetpack_RelatedPosts_Query_Loop::QUERY_NAMESPACE ),
			)
		);
		$this->assertNotFalse(
			has_filter( 'query_loop_block_query_vars', $callback ),
			'A variation block must hook the filter.'
		);

		// The filter removes itself after one run so it cannot leak into
		// sibling Query Loop blocks rendered later on the same page.
		Jetpack_RelatedPosts_Query_Loop::filter_query_loop_block_query_vars( array() );
		$this->assertFalse( has_filter( 'query_loop_block_query_vars', $callback ) );
	}

	/**
	 * When the module returns related posts, the query is pinned to exactly
	 * those IDs in order.
	 */
	public function test_query_args_use_related_posts_when_available() {
		$post_ids   = self::factory()->post->create_many( 3 );
		$current_id = self::factory()->post->create();

		$GLOBALS['post'] = get_post( $current_id );

		add_filter(
			'jetpack_relatedposts_returned_results',
			static function () use ( $post_ids ) {
				return array_map(
					static function ( $id ) {
						return array( 'id' => $id );
					},
					$post_ids
				);
			}
		);

		$query_args = Jetpack_RelatedPosts_Query_Loop::get_related_posts_query_args(
			array( 'posts_per_page' => 2 )
		);

		$this->assertSame( array_slice( $post_ids, 0, 2 ), $query_args['post__in'] );
		$this->assertSame( 'post__in', $query_args['orderby'] );
		$this->assertSame( 0, $query_args['offset'] );
	}

	/**
	 * When no related posts are available, the block falls back to random
	 * recent posts, never including the post being viewed.
	 */
	public function test_query_args_fall_back_to_recent_posts() {
		$post_ids   = self::factory()->post->create_many( 3 );
		$current_id = self::factory()->post->create();

		$GLOBALS['post'] = get_post( $current_id );

		$query_args = Jetpack_RelatedPosts_Query_Loop::get_related_posts_query_args(
			array( 'posts_per_page' => 2 )
		);

		$this->assertCount( 2, $query_args['post__in'] );
		$this->assertNotContains( $current_id, $query_args['post__in'] );
		$this->assertEmpty( array_diff( $query_args['post__in'], $post_ids ) );
	}

	/**
	 * The jetpack_relatedposts_query_loop_fallback filter disables the
	 * random-posts fallback, leaving the query pinned to no posts.
	 */
	public function test_fallback_can_be_disabled_via_filter() {
		self::factory()->post->create_many( 3 );
		$current_id = self::factory()->post->create();

		$GLOBALS['post'] = get_post( $current_id );

		add_filter( 'jetpack_relatedposts_query_loop_fallback', '__return_false' );

		$query_args = Jetpack_RelatedPosts_Query_Loop::get_related_posts_query_args(
			array( 'posts_per_page' => 2 )
		);

		$this->assertSame( array(), $query_args['post__in'] );
	}

	/**
	 * Outside any post context the query args must pass through untouched.
	 */
	public function test_query_args_unchanged_without_a_post() {
		unset( $GLOBALS['post'] );

		$query_args = array( 'posts_per_page' => 2 );

		$this->assertSame(
			$query_args,
			Jetpack_RelatedPosts_Query_Loop::get_related_posts_query_args( $query_args )
		);
	}
}
