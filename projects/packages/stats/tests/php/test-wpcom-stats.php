<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests WPCOM_Stats class.
 *
 * @package jetpack-stats
 */

namespace Automattic\Jetpack\Stats;

use WP_Error;

/**
 * Class to test the WPCOM_Stats class.
 *
 * @covers Automattic\Jetpack\Stats\WPCOM_Stats
 */
class Test_WPCOM_Stats extends StatsBaseTestCase {
	/**
	 * Mocked WPCOM_Stats.
	 *
	 * @var Mock_WPCOM_Stats
	 */
	protected $wpcom_stats;

	/**
	 * Set up before each test
	 *
	 * @before
	 */
	protected function set_up() {
		parent::set_up();

		$this->wpcom_stats = $this->getMockBuilder( 'Automattic\Jetpack\Stats\WPCOM_Stats' )
			->setMethods( array( 'fetch_remote_stats' ) )
			->getMock();
	}

	/**
	 * Test get_stats.
	 */
	public function test_get_stats() {
		$expected_stats = array(
			'date'   => '2022-09-29',
			'stats'  => array(),
			'visits' => array(),
		);

		$this->wpcom_stats
			->expects( $this->once() )
			->method( 'fetch_remote_stats' )
			->with(
				$this->equalTo( '/sites/1234/stats/' ),
				$this->equalTo( array() )
			)
			->willReturn( $expected_stats );

		$stats = $this->wpcom_stats->get_stats();
		$this->assertSame( $expected_stats, $stats );
		$this->assertSame( wp_json_encode( $expected_stats ), self::get_stats_transient( '/sites/1234/stats/' ) );
	}

	/**
	 * Test get_stats_summary.
	 */
	public function test_get_stats_summary() {
		$expected_stats = array(
			'date'      => '2022-09-29',
			'period'    => 'day',
			'views'     => 0,
			'visitors'  => 0,
			'likes'     => 0,
			'reblogs'   => 0,
			'comments'  => 0,
			'followers' => 1,
		);

		$this->wpcom_stats
			->expects( $this->once() )
			->method( 'fetch_remote_stats' )
			->with(
				$this->equalTo( '/sites/1234/stats/summary' ),
				$this->equalTo( array() )
			)
			->willReturn( $expected_stats );

		$stats = $this->wpcom_stats->get_stats_summary();
		$this->assertSame( $expected_stats, $stats );
		$this->assertSame( wp_json_encode( $expected_stats ), self::get_stats_transient( '/sites/1234/stats/summary' ) );
	}

	/**
	 * Test get_top_posts.
	 */
	public function test_get_top_posts() {
		$expected_stats = array(
			'date'   => '2022-09-29',
			'days'   => array(
				'2022-09-29' => array(
					'postviews'   => array(),
					'total_views' => 0,
				),
			),
			'period' => 'day',
		);

		$this->wpcom_stats
			->expects( $this->once() )
			->method( 'fetch_remote_stats' )
			->with(
				$this->equalTo( '/sites/1234/stats/top-posts' ),
				$this->equalTo( array() )
			)
			->willReturn( $expected_stats );

		$stats = $this->wpcom_stats->get_top_posts();
		$this->assertSame( $expected_stats, $stats );
		$this->assertSame( wp_json_encode( $expected_stats ), self::get_stats_transient( '/sites/1234/stats/top-posts' ) );
	}

	/**
	 * Test get_video_details.
	 */
	public function test_get_video_details() {
		$video_id       = 1234;
		$expected_stats = array(
			'fields' => array( 'period', 'plays' ),
			'data'   => array(
				array(
					'date' => '9-29',
					'p'    => 0,
				),
			),
			'pages'  => array(),
			'post'   => false,
		);

		$this->wpcom_stats
			->expects( $this->once() )
			->method( 'fetch_remote_stats' )
			->with(
				$this->equalTo( '/sites/1234/stats/video/' . $video_id ),
				$this->equalTo( array() )
			)
			->willReturn( $expected_stats );

		$stats = $this->wpcom_stats->get_video_details( $video_id );
		$this->assertSame( $expected_stats, $stats );
		$this->assertSame( wp_json_encode( $expected_stats ), self::get_stats_transient( '/sites/1234/stats/video/' . $video_id ) );
	}

	/**
	 * Test get_referrers.
	 */
	public function test_get_referrers() {
		$expected_stats = array(
			'date'   => '2022-09-29',
			'days'   => array(
				'2022-09-29' => array(
					'groups'      => array(),
					'other_views' => 0,
					'total_views' => 0,
				),
			),
			'period' => 'day',
		);

		$this->wpcom_stats
			->expects( $this->once() )
			->method( 'fetch_remote_stats' )
			->with(
				$this->equalTo( '/sites/1234/stats/referrers' ),
				$this->equalTo( array() )
			)
			->willReturn( $expected_stats );

		$stats = $this->wpcom_stats->get_referrers();
		$this->assertSame( $expected_stats, $stats );
		$this->assertSame( wp_json_encode( $expected_stats ), self::get_stats_transient( '/sites/1234/stats/referrers' ) );
	}

	/**
	 * Test get_clicks.
	 */
	public function test_get_clicks() {
		$expected_stats = array(
			'date'   => '2022-09-29',
			'days'   => array(
				'2022-09-29' => array(
					'clicks'       => array(),
					'other_clicks' => 0,
					'total_clicks' => 0,
				),
			),
			'period' => 'day',
		);

		$this->wpcom_stats
			->expects( $this->once() )
			->method( 'fetch_remote_stats' )
			->with(
				$this->equalTo( '/sites/1234/stats/clicks' ),
				$this->equalTo( array() )
			)
			->willReturn( $expected_stats );

		$stats = $this->wpcom_stats->get_clicks();
		$this->assertSame( $expected_stats, $stats );
		$this->assertSame( wp_json_encode( $expected_stats ), self::get_stats_transient( '/sites/1234/stats/clicks' ) );
	}

	/**
	 * Test get_tags.
	 */
	public function test_get_tags() {
		$expected_stats = array(
			'date' => '2022-09-29',
			'tags' => array(),
		);

		$this->wpcom_stats
			->expects( $this->once() )
			->method( 'fetch_remote_stats' )
			->with(
				$this->equalTo( '/sites/1234/stats/tags' ),
				$this->equalTo( array() )
			)
			->willReturn( $expected_stats );

		$stats = $this->wpcom_stats->get_tags();
		$this->assertSame( $expected_stats, $stats );
		$this->assertSame( wp_json_encode( $expected_stats ), self::get_stats_transient( '/sites/1234/stats/tags' ) );
	}

	/**
	 * Test get_top_authors.
	 */
	public function test_get_top_authors() {
		$expected_stats = array(
			'date'   => '2022-09-29',
			'days'   => array(
				'2022-09-29' => array(
					'authors' => array(),
				),
			),
			'period' => 'day',
		);

		$this->wpcom_stats
			->expects( $this->once() )
			->method( 'fetch_remote_stats' )
			->with(
				$this->equalTo( '/sites/1234/stats/top-authors' ),
				$this->equalTo( array() )
			)
			->willReturn( $expected_stats );

		$stats = $this->wpcom_stats->get_top_authors();
		$this->assertSame( $expected_stats, $stats );
		$this->assertSame( wp_json_encode( $expected_stats ), self::get_stats_transient( '/sites/1234/stats/top-authors' ) );
	}

	/**
	 * Test get_top_comments.
	 */
	public function test_get_top_comments() {
		$expected_stats = array(
			'date'    => '2022-09-29',
			'authors' => array(),
			'posts'   => array(),
		);

		$this->wpcom_stats
			->expects( $this->once() )
			->method( 'fetch_remote_stats' )
			->with(
				$this->equalTo( '/sites/1234/stats/comments' ),
				$this->equalTo( array() )
			)
			->willReturn( $expected_stats );

		$stats = $this->wpcom_stats->get_top_comments();
		$this->assertSame( $expected_stats, $stats );
		$this->assertSame( wp_json_encode( $expected_stats ), self::get_stats_transient( '/sites/1234/stats/comments' ) );
	}

	/**
	 * Test get_video_plays.
	 */
	public function test_get_video_plays() {
		$expected_stats = array(
			'date'   => '2022-09-29',
			'days'   => array(
				'2022-09-29' => array(
					'plays'       => array(),
					'other_plays' => 0,
					'total_plays' => 0,
				),
			),
			'period' => 'day',
		);

		$this->wpcom_stats
			->expects( $this->once() )
			->method( 'fetch_remote_stats' )
			->with(
				$this->equalTo( '/sites/1234/stats/video-plays' ),
				$this->equalTo( array() )
			)
			->willReturn( $expected_stats );

		$stats = $this->wpcom_stats->get_video_plays();
		$this->assertSame( $expected_stats, $stats );
		$this->assertSame( wp_json_encode( $expected_stats ), self::get_stats_transient( '/sites/1234/stats/video-plays' ) );
	}

	/**
	 * Test get_file_downloads.
	 */
	public function test_get_file_downloads() {
		$expected_stats = array(
			'date'   => '2022-09-29',
			'days'   => array(
				'2022-09-29' => array(
					'files'           => array(),
					'other_downloads' => 0,
					'total_downloads' => 0,
				),
			),
			'period' => 'day',
		);

		$this->wpcom_stats
			->expects( $this->once() )
			->method( 'fetch_remote_stats' )
			->with(
				$this->equalTo( '/sites/1234/stats/file-downloads' ),
				$this->equalTo( array() )
			)
			->willReturn( $expected_stats );

		$stats = $this->wpcom_stats->get_file_downloads();
		$this->assertSame( $expected_stats, $stats );
		$this->assertSame( wp_json_encode( $expected_stats ), self::get_stats_transient( '/sites/1234/stats/file-downloads' ) );
	}

	/**
	 * Test get_post_views.
	 */
	public function test_get_post_views() {
		$post_id        = 1234;
		$expected_stats = array(
			'date'  => '2022-09-29',
			'views' => 0,
			'years' => array(),
		);

		$this->wpcom_stats
			->expects( $this->once() )
			->method( 'fetch_remote_stats' )
			->with(
				$this->equalTo( '/sites/1234/stats/post/' . $post_id ),
				$this->equalTo( array() )
			)
			->willReturn( $expected_stats );

		$stats = $this->wpcom_stats->get_post_views( $post_id );
		$this->assertSame( $expected_stats, $stats );
		$this->assertSame( wp_json_encode( $expected_stats ), self::get_stats_transient( '/sites/1234/stats/post/' . $post_id ) );
	}

	/**
	 * Test get_views_by_country.
	 */
	public function test_get_views_by_country() {
		$expected_stats = array(
			'date'         => '2022-09-29',
			'days'         => array(
				'2022-09-29' => array(
					'views'       => array(),
					'other_views' => 0,
					'total_views' => 0,
				),
			),
			'country-info' => array(),
		);

		$this->wpcom_stats
			->expects( $this->once() )
			->method( 'fetch_remote_stats' )
			->with(
				$this->equalTo( '/sites/1234/stats/country-views' ),
				$this->equalTo( array() )
			)
			->willReturn( $expected_stats );

		$stats = $this->wpcom_stats->get_views_by_country();
		$this->assertSame( $expected_stats, $stats );
		$this->assertSame( wp_json_encode( $expected_stats ), self::get_stats_transient( '/sites/1234/stats/country-views' ) );
	}

	/**
	 * Test get_followers.
	 */
	public function test_get_followers() {
		$expected_stats = array(
			'page'        => 0,
			'pages'       => 0,
			'total'       => 0,
			'total_email' => 0,
			'total_wpcom' => 0,
			'subscribers' => array(),
		);

		$this->wpcom_stats
			->expects( $this->once() )
			->method( 'fetch_remote_stats' )
			->with(
				$this->equalTo( '/sites/1234/stats/followers' ),
				$this->equalTo( array() )
			)
			->willReturn( $expected_stats );

		$stats = $this->wpcom_stats->get_followers();
		$this->assertSame( $expected_stats, $stats );
		$this->assertSame( wp_json_encode( $expected_stats ), self::get_stats_transient( '/sites/1234/stats/followers' ) );
	}

	/**
	 * Test get_comment_followers.
	 */
	public function test_get_comment_followers() {
		$expected_stats = array(
			'page'  => 0,
			'pages' => 0,
			'total' => 0,
			'posts' => array(),
		);

		$this->wpcom_stats
			->expects( $this->once() )
			->method( 'fetch_remote_stats' )
			->with(
				$this->equalTo( '/sites/1234/stats/comment-followers' ),
				$this->equalTo( array() )
			)
			->willReturn( $expected_stats );

		$stats = $this->wpcom_stats->get_comment_followers();
		$this->assertSame( $expected_stats, $stats );
		$this->assertSame( wp_json_encode( $expected_stats ), self::get_stats_transient( '/sites/1234/stats/comment-followers' ) );
	}

	/**
	 * Test get_publicize_followers.
	 */
	public function test_get_publicize_followers() {
		$expected_stats = array(
			'services' => array(),
		);

		$this->wpcom_stats
			->expects( $this->once() )
			->method( 'fetch_remote_stats' )
			->with(
				$this->equalTo( '/sites/1234/stats/publicize' ),
				$this->equalTo( array() )
			)
			->willReturn( $expected_stats );

		$stats = $this->wpcom_stats->get_publicize_followers();
		$this->assertSame( $expected_stats, $stats );
		$this->assertSame( wp_json_encode( $expected_stats ), self::get_stats_transient( '/sites/1234/stats/publicize' ) );
	}

	/**
	 * Test get_search_terms.
	 */
	public function test_get_search_terms() {
		$expected_stats = array(
			'date'   => '2022-09-29',
			'days'   => array(
				'2022-09-29' => array(
					'search_terms'           => array(),
					'encrypted_search_terms' => 0,
					'other_search_terms'     => 0,
					'total_search_terms'     => 0,
				),
			),
			'period' => 'day',
		);

		$this->wpcom_stats
			->expects( $this->once() )
			->method( 'fetch_remote_stats' )
			->with(
				$this->equalTo( '/sites/1234/stats/search-terms' ),
				$this->equalTo( array() )
			)
			->willReturn( $expected_stats );

		$stats = $this->wpcom_stats->get_search_terms();
		$this->assertSame( $expected_stats, $stats );
		$this->assertSame( wp_json_encode( $expected_stats ), self::get_stats_transient( '/sites/1234/stats/search-terms' ) );
	}

	/**
	 * Test get_total_post_views.
	 */
	public function test_get_total_post_views() {
		$expected_stats = array(
			'date'  => '2022-09-29',
			'posts' => array(
				'2022-09-29' => array(
					'search_terms'           => array(),
					'encrypted_search_terms' => 0,
					'other_search_terms'     => 0,
					'total_search_terms'     => 0,
				),
			),
		);

		$this->wpcom_stats
			->expects( $this->once() )
			->method( 'fetch_remote_stats' )
			->with(
				$this->equalTo( '/sites/1234/stats/views/posts' ),
				$this->equalTo( array() )
			)
			->willReturn( $expected_stats );

		$stats = $this->wpcom_stats->get_total_post_views();
		$this->assertSame( $expected_stats, $stats );
		$this->assertSame( wp_json_encode( $expected_stats ), self::get_stats_transient( '/sites/1234/stats/views/posts' ) );
	}

	/**
	 * Test get_stats with cached result.
	 */
	public function test_get_stats_with_cached_result() {
		$cached_stats = array(
			'dummy' => 'test',
		);

		$this->wpcom_stats
			->expects( $this->once() )
			->method( 'fetch_remote_stats' )
			->willReturn( $cached_stats );

		$this->wpcom_stats->get_stats();

		$this->wpcom_stats
			->expects( $this->never() )
			->method( 'fetch_remote_stats' );

		$stats = $this->wpcom_stats->get_stats();

		$this->assertArrayHasKey( 'dummy', $stats );
		$this->assertArrayHasKey( 'cached_at', $stats );
	}

	/**
	 * Test get_stats with error.
	 */
	public function test_get_stats_with_error() {
		$expected_error = new WP_Error( 'dummy' );

		$this->wpcom_stats
			->expects( $this->once() )
			->method( 'fetch_remote_stats' )
			->willReturn( $expected_error );

		$stats = $this->wpcom_stats->get_stats();
		$this->assertSame( $expected_error, $stats );
		$this->assertFalse( self::get_stats_transient( '/sites/1234/stats/' ) );
	}

	/**
	 * Test get_stats with arguments.
	 */
	public function test_get_stats_with_arguments() {
		$expected_stats = array(
			'date'   => '2022-09-29',
			'visits' => array(),
		);

		$args = array(
			'fields' => 'date,visits',
		);

		$this->wpcom_stats
			->expects( $this->once() )
			->method( 'fetch_remote_stats' )
			->with(
				$this->equalTo( '/sites/1234/stats/' ),
				$this->equalTo( $args )
			)
			->willReturn( $expected_stats );

		$stats = $this->wpcom_stats->get_stats( $args );
		$this->assertSame( $expected_stats, $stats );
		$this->assertSame( wp_json_encode( $expected_stats ), self::get_stats_transient( '/sites/1234/stats/', $args ) );
	}

	/**
	 * Helper for fetching the stats transient.
	 *
	 * @param  string $endpoint The WPCOM REST API endpoint.
	 * @param  array  $args     Optional query args.
	 * @return string|false The transient value if set, otherwise false
	 */
	private static function get_stats_transient( $endpoint, $args = array() ) {
		$cache_key      = md5( implode( '|', array( $endpoint, WPCOM_Stats::STATS_REST_API_VERSION, wp_json_encode( $args ) ) ) );
		$transient_name = WPCOM_Stats::STATS_CACHE_TRANSIENT_PREFIX . $cache_key;
		$stats_cache    = get_transient( $transient_name );

		if ( empty( $stats_cache ) ) {
			return false;
		}

		return reset( $stats_cache );
	}
}
