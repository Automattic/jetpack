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
	 * Published post count returned by the wp_count_posts filter.
	 *
	 * @var int
	 */
	private $published = 0;

	/**
	 * How many times the post count was looked up.
	 *
	 * @var int
	 */
	private $count_lookups = 0;

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		// WorDBless cannot run core's count query, so supply the counts it would return.
		add_filter( 'wp_count_posts', array( $this, 'filter_post_counts' ), 10, 2 );
		delete_transient( Action_Bar::ENOUGH_POSTS_TRANSIENT );
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		remove_all_filters( 'wp_count_posts' );
		remove_all_filters( 'jetpack_stats_url' );
		remove_all_actions( 'transition_post_status' );
		delete_transient( Action_Bar::ENOUGH_POSTS_TRANSIENT );
		parent::tear_down();
	}

	/**
	 * Filter callback for wp_count_posts.
	 *
	 * @param object $counts Post counts.
	 * @param string $type   Post type.
	 * @return object
	 */
	public function filter_post_counts( $counts, $type ) {
		if ( 'post' !== $type ) {
			return $counts;
		}
		++$this->count_lookups;

		return (object) array(
			'publish' => $this->published,
			'draft'   => 3,
		);
	}

	/**
	 * Render the bar for a logged-out visitor.
	 *
	 * @return string
	 */
	private function render() {
		ob_start();
		Action_Bar::footer();
		return ob_get_clean();
	}

	/**
	 * The bar renders either way, but Subscribe waits for the second published post.
	 *
	 * @dataProvider provide_post_counts
	 *
	 * @param int  $published      Number of published posts.
	 * @param bool $show_subscribe Whether the Subscribe button should render.
	 */
	#[DataProvider( 'provide_post_counts' )]
	public function test_subscribe_requires_two_published_posts( $published, $show_subscribe ) {
		$this->published = $published;

		$html = $this->render();

		$this->assertStringContainsString( 'id="actionbar"', $html );
		$this->assertSame( $show_subscribe, str_contains( $html, 'actnbr-actn-follow' ) );
	}

	/**
	 * Data provider for test_subscribe_requires_two_published_posts.
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

	/**
	 * The answer is cached, and publishing or unpublishing a post clears it.
	 */
	public function test_published_post_count_is_cached_until_a_post_changes_status() {
		Action_Bar::load();
		$post = new \WP_Post( (object) array( 'post_type' => 'post' ) );

		$this->published = 1;
		$this->assertStringNotContainsString( 'actnbr-actn-follow', $this->render() );

		$this->published = 2;
		$this->assertStringNotContainsString( 'actnbr-actn-follow', $this->render(), 'The cached answer should be served.' );

		wp_transition_post_status( 'publish', 'draft', $post );
		$this->assertStringContainsString( 'actnbr-actn-follow', $this->render() );
	}

	/**
	 * Status changes that do not touch published posts keep the cached answer.
	 */
	public function test_unrelated_status_changes_keep_the_cached_answer() {
		Action_Bar::load();
		$post = new \WP_Post( (object) array( 'post_type' => 'post' ) );
		$page = new \WP_Post( (object) array( 'post_type' => 'page' ) );

		$this->published = 1;
		$this->render();
		$this->published = 2;

		wp_transition_post_status( 'pending', 'draft', $post );
		wp_transition_post_status( 'publish', 'publish', $post );
		wp_transition_post_status( 'publish', 'draft', $page );

		$this->assertStringNotContainsString( 'actnbr-actn-follow', $this->render() );
	}

	/**
	 * A cached "no" is served too, instead of recounting on every page view.
	 */
	public function test_negative_answer_is_cached() {
		$this->published = 1;
		$this->render();
		$this->assertSame( 1, $this->count_lookups );

		$this->render();
		$this->assertSame( 1, $this->count_lookups );
	}

	/**
	 * Anything other than a WP_Post is ignored.
	 */
	public function test_flush_ignores_a_missing_post_object() {
		$this->published = 1;
		$this->render();
		$this->published = 2;

		Action_Bar::flush_published_posts_count( 'publish', 'draft', null );
		Action_Bar::flush_published_posts_count( 'publish', 'draft', (object) array( 'post_type' => 'post' ) );

		$this->assertStringNotContainsString( 'actnbr-actn-follow', $this->render() );
	}

	public function test_post_stats_url_opens_stats_in_wp_admin_without_calypso_links() {
		$this->assertSame(
			admin_url( 'admin.php?page=stats#!/stats/post/12/345' ),
			Action_Bar::get_post_stats_url( 12, 345, 'example.org', false )
		);
	}

	public function test_post_stats_url_opens_calypso_with_calypso_links() {
		$this->assertSame(
			'https://wordpress.com/stats/post/12/example.org',
			Action_Bar::get_post_stats_url( 12, 345, 'example.org', true )
		);
	}

	public function test_post_stats_url_can_be_claimed_through_the_stats_url_filter() {
		$received = null;
		add_filter(
			'jetpack_stats_url',
			function ( $url, $args ) use ( &$received ) {
				$received = $args;
				return 'https://example.org/new-stats';
			},
			10,
			2
		);

		$this->assertSame( 'https://example.org/new-stats', Action_Bar::get_post_stats_url( 12, 345, 'example.org', true ) );
		$this->assertSame(
			array(
				'view' => 'post',
				'id'   => 12,
			),
			$received
		);
	}
}
