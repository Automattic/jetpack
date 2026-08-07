<?php
/**
 * Top Posts Helper unit tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Stats\WPCOM_Stats;
use PHPUnit\Framework\Attributes\CoversClass;

require_once JETPACK__PLUGIN_DIR . '/_inc/lib/class-jetpack-top-posts-helper.php';

/**
 * Class for testing the Jetpack_Top_Posts_Helper class.
 *
 * @covers \Jetpack_Top_Posts_Helper
 */
#[CoversClass( Jetpack_Top_Posts_Helper::class )]
class Jetpack_Top_Posts_Helper_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Number of posts get_top_posts() asks the Stats API for (its $posts_to_obtain_count).
	 */
	const REQUESTED_MAX = 30;

	/**
	 * Blog ID the stats cache key is built from.
	 */
	const BLOG_ID = 1234;

	/**
	 * Post IDs listed in the faked Stats response.
	 *
	 * @var int[]
	 */
	private $post_ids = array();

	/**
	 * Post IDs whose metadata was read during the call.
	 *
	 * @var array<int,bool>
	 */
	private $meta_reads = array();

	/**
	 * Number of get_attached_media() calls made during the call.
	 *
	 * @var int
	 */
	private $attached_media_calls = 0;

	/**
	 * Publishes posts and primes the Stats cache with a response listing them.
	 *
	 * IDs must be real and published; get_top_posts() drops anything else. Priming the
	 * transient keeps the test offline and matches the block's front-end path.
	 *
	 * @param array $spec Entry counts keyed by the stats `type`, in response order,
	 *                    e.g. array( 'page' => 40, 'post' => 3 ).
	 */
	private function fake_stats_response( array $spec ) {
		Jetpack_Options::update_option( 'id', self::BLOG_ID );
		update_option( 'site_created_date', '2020-01-01 00:00:00' ); // Read unconditionally by get_top_posts().

		$views     = array_sum( $spec ) * 10;
		$postviews = array();

		foreach ( $spec as $type => $count ) {
			foreach ( self::factory()->post->create_many( $count ) as $post_id ) {
				$this->post_ids[] = $post_id;
				$postviews[]      = array(
					'id'     => $post_id,
					'title'  => 'Top post ' . $post_id,
					'type'   => $type,
					'public' => true,
					'views'  => $views--,
				);
			}
		}

		$args = array(
			'max'       => self::REQUESTED_MAX,
			'summarize' => true,
			'num'       => '7',
			'period'    => 'day',
		);
		$key  = md5(
			implode(
				'|',
				array(
					sprintf( '/sites/%d/stats/top-posts', self::BLOG_ID ),
					WPCOM_Stats::STATS_REST_API_VERSION,
					wp_json_encode( $args, JSON_UNESCAPED_SLASHES ),
				)
			)
		);

		set_transient(
			WPCOM_Stats::STATS_CACHE_TRANSIENT_PREFIX . $key,
			array( time() => wp_json_encode( array( 'summary' => array( 'postviews' => $postviews ) ), JSON_UNESCAPED_SLASHES ) ),
			MINUTE_IN_SECONDS
		);

		// The key above is rebuilt by hand. If it ever stops matching, the helper falls
		// back to random posts rather than erroring, so fail loudly instead of silently
		// testing the fallback. This filter only runs on a cache miss.
		add_filter(
			'jetpack_fetch_stats_cache_expiration',
			function () {
				$this->fail( 'The primed Stats transient was missed; the cache key is stale.' );
			}
		);

		add_filter(
			'get_post_metadata',
			function ( $value, $object_id ) {
				$this->meta_reads[ $object_id ] = true;
				return $value;
			},
			10,
			2
		);
		add_filter(
			'get_attached_media_args',
			function ( $args_in ) {
				++$this->attached_media_calls;
				return $args_in;
			}
		);
	}

	/**
	 * How many of the faked posts had their metadata read.
	 *
	 * @return int
	 */
	private function processed_count() {
		return count( array_intersect( array_keys( $this->meta_reads ), $this->post_ids ) );
	}

	/**
	 * The Stats API can return more posts than the `max` we ask for; get_top_posts() must
	 * not do per-post work for any of the surplus.
	 */
	public function test_get_top_posts_caps_work_at_requested_max() {
		$this->fake_stats_response( array( 'post' => 100 ) );

		$top_posts = Jetpack_Top_Posts_Helper::get_top_posts( '7', 3, 'post' );

		$this->assertCount( 3, $top_posts );
		$this->assertSame( self::REQUESTED_MAX, $this->processed_count(), 'Processed the wrong number of posts.' );
		$this->assertSame( self::REQUESTED_MAX, $this->attached_media_calls, 'Ran the wrong number of attachment queries.' );
	}

	/**
	 * Capping the work must not change what the block renders.
	 */
	public function test_get_top_posts_returns_most_viewed_in_order() {
		$this->fake_stats_response( array( 'post' => 100 ) );

		$top_posts = Jetpack_Top_Posts_Helper::get_top_posts( '7', 5, 'post' );

		$this->assertSame( array_slice( $this->post_ids, 0, 5 ), array_column( $top_posts, 'id' ) );
	}

	/**
	 * A response smaller than the requested max must be left alone.
	 */
	public function test_get_top_posts_processes_short_response_in_full() {
		$this->fake_stats_response( array( 'post' => 10 ) );

		$top_posts = Jetpack_Top_Posts_Helper::get_top_posts( '7', 3, 'post' );

		$this->assertSame( array_slice( $this->post_ids, 0, 3 ), array_column( $top_posts, 'id' ) );
		$this->assertSame( 10, $this->processed_count() );
	}

	/**
	 * Capping must not starve the block's post type filter: entries it cannot render
	 * should not consume the cap.
	 */
	public function test_get_top_posts_looks_past_the_cap_for_renderable_entries() {
		$this->fake_stats_response( array( 'page' => 40, 'post' => 3 ) );

		$top_posts = Jetpack_Top_Posts_Helper::get_top_posts( '7', 3, 'post' );

		$this->assertSame( array_slice( $this->post_ids, -3 ), array_column( $top_posts, 'id' ) );
	}

	/**
	 * Looking past the cap must not do per-post work for the whole response when the
	 * type filter can never be satisfied.
	 */
	public function test_get_top_posts_bounds_work_when_nothing_is_renderable() {
		$this->fake_stats_response( array( 'page' => 100 ) );

		$this->assertSame( array(), Jetpack_Top_Posts_Helper::get_top_posts( '7', 3, 'post' ) );
		$this->assertSame( self::REQUESTED_MAX, $this->processed_count(), 'Did per-post work for the whole response.' );
	}
}
