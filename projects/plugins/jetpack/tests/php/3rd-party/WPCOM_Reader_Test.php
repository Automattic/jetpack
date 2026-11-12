<?php
/**
 * Tests for the WordPress.com Reader feed additions.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversFunction;

require_once JETPACK__PLUGIN_DIR . '3rd-party/wpcom-reader.php';

/**
 * Class WPCOM_Reader_Test
 *
 * @covers ::jetpack_wpcomreader_post_id
 * @covers ::jetpack_wpcomreader_set_up_post_id
 */
#[CoversFunction( 'jetpack_wpcomreader_post_id' )]
#[CoversFunction( 'jetpack_wpcomreader_set_up_post_id' )]
class WPCOM_Reader_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Clear the post ID left tracked by earlier loops in this process.
	 */
	public function set_up() {
		parent::set_up();
		jetpack_wpcomreader_set_up_post_id();
	}

	/**
	 * Build the post-id element the feed prints for a post.
	 *
	 * @param int $post_id Post ID.
	 * @return string
	 */
	private function post_id_tag( $post_id ) {
		return sprintf( '<post-id xmlns="com-wordpress:feed-additions:1">%d</post-id>', $post_id );
	}

	/**
	 * Test that a feed loop prints each item's own post ID.
	 */
	public function test_feed_loop_prints_each_post_id() {
		$post_ids = self::factory()->post->create_many( 2 );
		$query    = new WP_Query(
			array(
				'post__in' => $post_ids,
				'orderby'  => 'post__in',
			)
		);

		$output = '';
		while ( $query->have_posts() ) {
			$query->the_post();
			$output .= get_echo( 'do_action', array( 'rss2_item' ) );
		}
		wp_reset_postdata();

		$this->assertSame( $this->post_id_tag( $post_ids[0] ) . $this->post_id_tag( $post_ids[1] ), $output );
	}

	/**
	 * Test that items rendered off the global post, without a loop, print no post ID.
	 */
	public function test_items_without_set_up_post_print_no_post_id() {
		$GLOBALS['post'] = self::factory()->post->create_and_get();

		$output = get_echo( 'do_action', array( 'rss2_item' ) ) . get_echo( 'do_action', array( 'rss2_item' ) );

		$this->assertSame( '', $output );
	}

	/**
	 * Test that one post set up before several items only identifies the first of them.
	 */
	public function test_set_up_post_identifies_a_single_item() {
		$GLOBALS['post'] = self::factory()->post->create_and_get();
		$post_id         = $GLOBALS['post']->ID;
		setup_postdata( $GLOBALS['post'] );

		$output = get_echo( 'do_action', array( 'rss2_item' ) ) . get_echo( 'do_action', array( 'rss2_item' ) );
		wp_reset_postdata();

		$this->assertSame( $this->post_id_tag( $post_id ), $output );
	}
}
