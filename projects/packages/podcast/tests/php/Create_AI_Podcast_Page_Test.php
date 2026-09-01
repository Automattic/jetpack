<?php
/**
 * Tests for the post-publish Posts to Podcast promo.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Podcast\Create_AI_Podcast_Page;
use Automattic\Jetpack\Stats\WPCOM_Stats;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/mocks/class-wpcom-stats.php';
require_once __DIR__ . '/mocks/functions-stats.php';

/**
 * @covers \Automattic\Jetpack\Podcast\Create_AI_Podcast_Page
 */
#[CoversClass( Create_AI_Podcast_Page::class )]
class Create_AI_Podcast_Page_Test extends BaseTestCase {

	/**
	 * Mock post query count.
	 *
	 * @var int
	 */
	private $recent_post_count = 0;

	/**
	 * Whether the post query included the last-month date query.
	 *
	 * @var bool
	 */
	private $saw_last_month_date_query = false;

	/**
	 * Current test user ID.
	 *
	 * @var int
	 */
	private $user_id = 0;

	/**
	 * Clean up filters and globals that influence eligibility.
	 */
	public function tear_down() {
		parent::tear_down();

		remove_all_filters( 'jetpack_posts_to_podcast_post_publish_promo_min_published_posts' );
		remove_all_filters( 'jetpack_posts_to_podcast_post_publish_promo_min_visitors' );
		remove_filter( 'posts_pre_query', array( $this, 'mock_recent_posts_query' ), 10 );

		WPCOM_Stats::$visits    = array();
		WPCOM_Stats::$last_args = array();
		$GLOBALS['post']        = null;
		unset( $GLOBALS['podcast_promo_stats_get_visitors'], $GLOBALS['podcast_promo_stats_get_visitors_args'] );
		Constants::clear_constants();

		if ( $this->user_id ) {
			delete_user_option( $this->user_id, Create_AI_Podcast_Page::POST_PUBLISH_PROMO_DISMISSED_OPTION );
		}
		wp_set_current_user( 0 );
	}

	/**
	 * Eligible sites need enough recent posts and weekly visitors.
	 */
	public function test_is_site_eligible_with_enough_recent_posts_and_weekly_visitors() {
		$this->mock_recent_posts( 5 );
		$this->mock_weekly_visitors( array( 10, 10, 10, 10, 10 ) );

		$this->assertTrue( Create_AI_Podcast_Page::is_post_publish_promo_site_eligible() );
		$this->assertTrue( $this->saw_last_month_date_query );
		$this->assertSame(
			array(
				'unit'        => 'day',
				'quantity'    => 7,
				'stat_fields' => 'visitors',
			),
			WPCOM_Stats::$last_args
		);
	}

	/**
	 * Sites without enough weekly visitors are not eligible.
	 */
	public function test_is_site_not_eligible_without_enough_weekly_visitors() {
		$this->mock_recent_posts( 5 );
		$this->mock_weekly_visitors( array( 10, 10, 10, 10, 9 ) );

		$this->assertFalse( Create_AI_Podcast_Page::is_post_publish_promo_site_eligible() );
	}

	/**
	 * WordPress.com Simple sites use the local stats helper for weekly visitors.
	 */
	public function test_is_site_eligible_on_wpcom_simple_with_enough_weekly_visitors() {
		Constants::set_constant( 'IS_WPCOM', true );
		$this->mock_recent_posts( 5 );
		$GLOBALS['podcast_promo_stats_get_visitors'] = array( 10, 10, 10, 10, 10 );

		$this->assertTrue( Create_AI_Podcast_Page::is_post_publish_promo_site_eligible() );
		$this->assertSame(
			array( get_current_blog_id(), gmdate( 'Y-m-d' ), 7, 1 ),
			$GLOBALS['podcast_promo_stats_get_visitors_args']
		);
		$this->assertSame( array(), WPCOM_Stats::$last_args );
	}

	/**
	 * The draft being published counts toward the threshold.
	 */
	public function test_current_draft_counts_toward_published_post_threshold() {
		$this->mock_recent_posts( 4 );
		$this->mock_weekly_visitors( array( 50 ) );

		$GLOBALS['post'] = get_post(
			wp_insert_post(
				array(
					'post_title'  => 'Draft post',
					'post_type'   => 'post',
					'post_status' => 'draft',
				)
			)
		);

		$this->assertTrue( Create_AI_Podcast_Page::is_post_publish_promo_site_eligible() );
	}

	/**
	 * Already-published posts should not load the post-publish promo assets again.
	 */
	public function test_current_published_post_blocks_post_publish_promo_assets() {
		$GLOBALS['post'] = get_post(
			wp_insert_post(
				array(
					'post_title'  => 'Published post',
					'post_type'   => 'post',
					'post_status' => 'publish',
				)
			)
		);

		$method = new \ReflectionMethod( Create_AI_Podcast_Page::class, 'is_current_post_published_for_post_publish_promo' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$this->assertTrue( $method->invoke( null ) );
	}

	/**
	 * A user who has dismissed the promo is not eligible.
	 */
	public function test_is_site_not_eligible_after_user_dismisses_promo() {
		$this->mock_recent_posts( 5 );
		$this->mock_weekly_visitors( array( 50 ) );
		$this->set_current_test_user();

		$endpoint = new \Automattic\Jetpack\Podcast\Posts_To_Podcast_Endpoint();
		$endpoint->dismiss_post_publish_promo();

		$this->assertFalse( Create_AI_Podcast_Page::is_post_publish_promo_site_eligible() );
	}

	/**
	 * Mock the recent post query.
	 *
	 * @param int $count Number of posts to return.
	 */
	private function mock_recent_posts( $count ) {
		$this->recent_post_count         = $count;
		$this->saw_last_month_date_query = false;
		add_filter( 'posts_pre_query', array( $this, 'mock_recent_posts_query' ), 10, 2 );
	}

	/**
	 * Short-circuit the recent posts query.
	 *
	 * @param array|null $posts Query results.
	 * @param \WP_Query  $query Query object.
	 * @return array
	 */
	public function mock_recent_posts_query( $posts, $query ) {
		unset( $posts );

		$date_query                      = $query->query_vars['date_query'] ?? array();
		$this->saw_last_month_date_query = isset( $date_query[0]['after'] )
			&& '1 month ago' === $date_query[0]['after']
			&& ! empty( $date_query[0]['inclusive'] );

		return array_fill( 0, $this->recent_post_count, 1 );
	}

	/**
	 * Mock weekly visitors.
	 *
	 * @param int[] $visitors Visitor counts.
	 */
	private function mock_weekly_visitors( array $visitors ) {
		WPCOM_Stats::$visits = array(
			'fields' => array( 'period', 'visitors' ),
			'data'   => array_map(
				function ( $count ) {
					return array( '2026-05-18', $count );
				},
				$visitors
			),
		);
	}

	/**
	 * Set a current test user.
	 */
	private function set_current_test_user() {
		$this->user_id = wp_insert_user(
			array(
				'user_login' => 'podcast-promo-test-user',
				'user_pass'  => 'password',
				'user_email' => 'podcast-promo-test-user@example.com',
			)
		);

		wp_set_current_user( $this->user_id );
	}
}
