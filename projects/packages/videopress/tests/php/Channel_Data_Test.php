<?php
/**
 * Tests for the VideoPress Channel data helpers.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\VideoPress\Channel_Data;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Test suite for Channel_Data.
 */
class Channel_Data_Test extends BaseTestCase {

	/**
	 * Serve a fixed video list and play counts.
	 */
	protected function set_up() {
		Channel_Data::reset();
		add_filter( 'videopress_channel_videos', array( $this, 'videos' ) );
		add_filter( 'videopress_channel_video_views', array( $this, 'views' ) );
	}

	/**
	 * Undo the filters.
	 */
	protected function tear_down() {
		remove_filter( 'videopress_channel_videos', array( $this, 'videos' ) );
		remove_filter( 'videopress_channel_video_views', array( $this, 'views' ) );
		delete_transient( Channel_Data::VIEWS_TRANSIENT );
		Channel_Data::reset();
	}

	/**
	 * Five videos, newest first: 5 min, 30 min, 50 min, unknown, 10 min.
	 *
	 * @return array[]
	 */
	public function videos() {
		$minutes = array( 5, 30, 50, 0, 10 );
		$videos  = array();
		foreach ( $minutes as $i => $min ) {
			$videos[] = array(
				'id'          => 100 + $i,
				'guid'        => 'video00' . $i,
				'durationMs'  => $min * 60000,
				'height'      => 1080,
				'publishedAt' => 1700000000 - $i * DAY_IN_SECONDS,
			);
		}
		return $videos;
	}

	/**
	 * Play counts: the third video is the most viewed, the first and fifth tie.
	 *
	 * @return array<int, int>
	 */
	public function views() {
		return array(
			100 => 10,
			102 => 500,
			104 => 10,
		);
	}

	/**
	 * Sorting, length filters, exclusion and pagination over the video list.
	 *
	 * @param array    $state    Browsing state.
	 * @param int      $per_page Page size.
	 * @param string[] $exclude  GUIDs to drop.
	 * @param string[] $expected GUIDs on the page.
	 * @param int      $total    Matching videos.
	 *
	 * @dataProvider browse_cases
	 */
	#[DataProvider( 'browse_cases' )]
	public function test_browse( $state, $per_page, $exclude, $expected, $total ) {
		$result = Channel_Data::browse( $state + Channel_Data::browse_request( false, false ), $per_page, $exclude );

		$this->assertSame( $expected, array_column( $result['entries'], 'guid' ) );
		$this->assertSame( $total, $result['total'] );
	}

	/**
	 * Browse cases.
	 *
	 * @return array
	 */
	public static function browse_cases() {
		return array(
			'newest, first page'          => array( array(), 2, array(), array( 'video000', 'video001' ), 5 ),
			'second page'                 => array( array( 'page' => 2 ), 2, array(), array( 'video002', 'video003' ), 5 ),
			'page past the end clamps'    => array( array( 'page' => 9 ), 2, array(), array( 'video004' ), 5 ),
			'oldest'                      => array( array( 'sort' => 'oldest' ), 2, array(), array( 'video004', 'video003' ), 5 ),
			'popular, ties keep newest'   => array( array( 'sort' => 'popular' ), 3, array(), array( 'video002', 'video000', 'video004' ), 5 ),
			'short skips unknown lengths' => array( array( 'length' => 'short' ), 9, array(), array( 'video000', 'video004' ), 2 ),
			'mid'                         => array( array( 'length' => 'mid' ), 9, array(), array( 'video001' ), 1 ),
			'long'                        => array( array( 'length' => 'long' ), 9, array(), array( 'video002' ), 1 ),
			'exclude the current video'   => array( array(), 2, array( 'video000' ), array( 'video001', 'video002' ), 4 ),
		);
	}

	/**
	 * Request arguments are read only when the block shows the controls, and invalid values fall back.
	 */
	public function test_browse_request() {
		$_GET = array(
			'videos-q'      => ' deadmines ',
			'videos-sort'   => 'latest',
			'videos-length' => 'forever',
			'videos-page'   => '3',
		);

		$this->assertSame(
			array(
				'search' => '',
				'sort'   => 'popular',
				'length' => 'any',
				'page'   => 1,
			),
			Channel_Data::browse_request( false, false, 'popular' )
		);
		$this->assertSame(
			array(
				'search' => 'deadmines',
				'sort'   => 'newest',
				'length' => 'any',
				'page'   => 3,
			),
			Channel_Data::browse_request( true, true, 'popular' )
		);
		$_GET = array();
	}

	/**
	 * Play counts come from the `stats/video-plays` shapes: the summarized total, or every day added up.
	 *
	 * @dataProvider provide_video_plays_responses
	 *
	 * @param array $response Endpoint response.
	 * @param array $expected Plays by attachment ID.
	 */
	#[DataProvider( 'provide_video_plays_responses' )]
	public function test_parse_video_plays( $response, $expected ) {
		$this->assertSame( $expected, Channel_Data::parse_video_plays( $response ) );
	}

	/**
	 * Responses as the endpoint returns them.
	 *
	 * @return array[]
	 */
	public static function provide_video_plays_responses() {
		$row = function ( $post_id, $plays ) {
			return array(
				'post_id' => $post_id,
				'url'     => 'https://example.com/wp-admin/media.php?action=edit&attachment_id=' . $post_id,
				'title'   => 'Video',
				'plays'   => $plays,
			);
		};
		return array(
			'summarize'      => array(
				array(
					'date'   => '2026-10-12',
					'period' => 'day',
					'days'   => array(
						'summary' => array(
							'plays'       => array( $row( 10, 70 ), $row( 11, 3 ) ),
							'other_plays' => 0,
							'total_plays' => 73,
						),
					),
				),
				array(
					10 => 70,
					11 => 3,
				),
			),
			'per day'        => array(
				array(
					'days' => array(
						'2026-10-11' => array( 'plays' => array( $row( 10, 3 ) ) ),
						'2026-10-12' => array( 'plays' => array( $row( '10', '4' ), $row( 11, 1 ) ) ),
					),
				),
				array(
					10 => 7,
					11 => 1,
				),
			),
			'complete stats' => array(
				array(
					'days' => array(
						'summary' => array(
							'data' => array(
								array(
									'post_id' => 454,
									'views'   => '106',
								),
							),
						),
					),
				),
				array( 454 => 106 ),
			),
			'no data'        => array( array( 'days' => array( 'summary' => array() ) ), array() ),
		);
	}

	/**
	 * The subscriber total adds social followers, like the Subscribe block's count.
	 */
	public function test_parse_subscriber_counts() {
		$response = function ( $code, $body ) {
			return array(
				'response' => array( 'code' => $code ),
				'body'     => wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
			);
		};
		$this->assertSame(
			51,
			Channel_Data::parse_subscriber_counts(
				$response(
					200,
					array(
						'counts' => array(
							'total_subscribers' => 42,
							'email_subscribers' => 31,
							'paid_subscribers'  => 5,
							'social_followers'  => 9,
						),
					)
				)
			)
		);
		$this->assertNull( Channel_Data::parse_subscriber_counts( $response( 200, array() ) ) );
		$this->assertNull( Channel_Data::parse_subscriber_counts( $response( 403, array( 'counts' => array( 'total_subscribers' => 1 ) ) ) ) );
		$this->assertNull( Channel_Data::parse_subscriber_counts( new \WP_Error( 'http' ) ) );
	}

	/**
	 * Compact counts and the views · age line.
	 */
	public function test_labels() {
		$this->assertSame( '950', Channel_Data::compact_number( 950 ) );
		$this->assertSame( '1.2K', Channel_Data::compact_number( 1234 ) );
		$this->assertSame( '48K', Channel_Data::compact_number( 48210 ) );
		$this->assertSame( '1.2M', Channel_Data::compact_number( 1234567 ) );
		$this->assertSame(
			'12,345 views · 2 days ago',
			Channel_Data::views_and_age(
				array(
					'views'       => 12345,
					'publishedAt' => time() - 2 * DAY_IN_SECONDS,
				),
				true
			)
		);
		$this->assertSame( '', Channel_Data::views_and_age( array() ) );
	}
}
