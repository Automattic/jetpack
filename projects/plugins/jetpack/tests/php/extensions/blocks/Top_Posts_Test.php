<?php
/**
 * Top Posts block tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Extensions\Top_Posts;

require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/top-posts/render.php';

/**
 * Top Posts block render tests.
 */
class Top_Posts_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Activates Stats and stubs the posts the helper returns, so rendering stays offline.
	 */
	public function set_up() {
		parent::set_up();

		update_option( 'site_created_date', '2020-01-01 00:00:00' );
		WP_Block_Supports::$block_to_render = array(
			'blockName' => 'jetpack/top-posts',
			'attrs'     => array(),
		);

		add_filter(
			'jetpack_active_modules',
			function ( $modules ) {
				return array_merge( $modules, array( 'stats' ) );
			}
		);
		add_filter( 'jetpack_is_frontend', '__return_true' );
		add_filter(
			'pre_http_request',
			function () {
				return new WP_Error( 'offline', 'No HTTP requests in tests.' );
			}
		);
		add_filter(
			'jetpack_top_posts_block_posts',
			function () {
				return array(
					array(
						'id'        => 42,
						'author'    => 'Author',
						'context'   => array(),
						'href'      => 'https://example.org/top-post/',
						'date'      => 'January 1, 2026',
						'title'     => 'Top post',
						'type'      => 'post',
						'public'    => true,
						'views'     => 10,
						'thumbnail' => '',
					),
				);
			}
		);
	}

	/**
	 * Clean up the block being rendered.
	 */
	public function tear_down() {
		WP_Block_Supports::$block_to_render = null;

		parent::tear_down();
	}

	/**
	 * The render hooks must print inside the item, around its markup, and the permalink filter must apply.
	 */
	public function test_render_hooks_wrap_each_item() {
		add_action(
			'jetpack_top_posts_block_before_post',
			function ( $post_id ) {
				echo '<span class="before">' . (int) $post_id . '</span>';
			}
		);
		add_action(
			'jetpack_top_posts_block_after_post',
			function ( $post_id ) {
				echo '<span class="after">' . (int) $post_id . '</span>';
			}
		);
		add_filter(
			'jetpack_top_posts_block_permalink',
			function ( $permalink ) {
				return add_query_arg( 'ref', 'top-posts', $permalink );
			}
		);

		$output = Top_Posts\load_assets_implementation(
			array(
				'period'           => '7',
				'postsToShow'      => 3,
				'postTypes'        => array( 'post' => true ),
				'layout'           => 'grid',
				'displayThumbnail' => false,
				'displayDate'      => false,
				'displayAuthor'    => false,
				'displayContext'   => false,
			)
		);

		$this->assertStringContainsString(
			'<div class="jetpack-top-posts-item"><span class="before">42</span><span class="jetpack-top-posts-title"><a href="https://example.org/top-post/?ref=top-posts">Top post</a></span><span class="after">42</span></div>',
			$output
		);
	}
}
