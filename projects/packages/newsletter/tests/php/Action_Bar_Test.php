<?php
/**
 * Tests for the Action_Bar class.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter\Tests;

use Automattic\Jetpack\Newsletter\Action_Bar;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Test class for Action_Bar.
 *
 * @covers \Automattic\Jetpack\Newsletter\Action_Bar
 */
#[CoversClass( Action_Bar::class )]
class Action_Bar_Test extends BaseTestCase {
	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		wp_deregister_script( 'wpcom-actionbar-placeholder' );
		remove_all_actions( 'wp_footer' );
		remove_all_filters( 'wp_count_posts' );
		parent::tear_down();
	}

	/**
	 * The bar stays off until the site has published two posts.
	 *
	 * @dataProvider provide_post_counts
	 *
	 * @param int  $published Number of published posts.
	 * @param bool $expected  Whether the bar should load.
	 */
	#[DataProvider( 'provide_post_counts' )]
	public function test_enqueue_scripts_requires_two_published_posts( $published, $expected ) {
		// WorDBless cannot run core's count query, so supply the counts it would return.
		add_filter(
			'wp_count_posts',
			function ( $counts, $type ) use ( $published ) {
				return 'post' === $type ? (object) array(
					'publish' => $published,
					'draft'   => 3,
				) : $counts;
			},
			10,
			2
		);

		Action_Bar::enqueue_scripts();

		$this->assertSame( $expected, wp_script_is( 'wpcom-actionbar-placeholder', 'enqueued' ) );
		$this->assertSame( $expected, false !== has_action( 'wp_footer', array( Action_Bar::class, 'footer' ) ) );
	}

	/**
	 * Data provider for test_enqueue_scripts_requires_two_published_posts.
	 *
	 * @return array
	 */
	public static function provide_post_counts() {
		return array(
			'no posts'   => array( 0, false ),
			'one post'   => array( 1, false ),
			'two posts'  => array( 2, true ),
			'five posts' => array( 5, true ),
		);
	}
}
