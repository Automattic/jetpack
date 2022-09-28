<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests Tracking Pixel class.
 *
 * @package jetpack-stats
 */

namespace Automattic\Jetpack\Stats;

use WP_Query;

/**
 * Class to test the Tracking_Pixel class.
 *
 * @covers Tracking_Pixel
 */
class Test_Tracking_Pixel extends StatsBaseTestCase {

	/**
	 * Clean up the testing environment.
	 *
	 * @after
	 */
	public function tear_down() {
		parent::tear_down();
		global $wp_the_query;
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$wp_the_query = new WP_Query();
	}

	/**
	 * Test for Tracking_Pixel::build_view_data with post
	 */
	public function test_build_view_data_with_post() {
		global $wp_the_query;
		$wp_the_query->is_posts_page  = true;
		$wp_the_query->queried_object = self::post( 7 );
		$view_data                    = Tracking_Pixel::build_view_data();
		$expected_view_data           = array(
			'v'    => 'ext',
			'j'    => '11.4:11.4',
			'blog' => 1234,
			'post' => 7,
			'tz'   => false,
			'srv'  => 'example.org',
		);
		$this->assertSame( $expected_view_data, $view_data );
	}

	/**
	 * Test for Tracking_Pixel::build_view_data with gmt offset
	 */
	public function test_build_view_data_with_gmt_offset() {
		add_option( 'gmt_offset', '5' );
		$view_data          = Tracking_Pixel::build_view_data();
		$expected_view_data = array(
			'v'    => 'ext',
			'j'    => '11.4:11.4',
			'blog' => 1234,
			'post' => '0',
			'tz'   => '5',
			'srv'  => 'example.org',
		);
		$this->assertSame( $expected_view_data, $view_data );
	}

	/**
	 * Data provider for test_stats_array.
	 *
	 * @return array
	 */
	public function statsArrayDataProvider() {
		return array(
			'No TZ'  => array(
				'data'               => array(
					'v'    => 'ext',
					'j'    => '11.4:11.4',
					'blog' => 1234,
					'post' => 7,
					'tz'   => false,
					'srv'  => 'example.org',
				),
				'stats_array_string' => "v:'ext',j:'11.4:11.4',blog:'1234',post:'7',tz:'',srv:'example.org'",
			),
			'TZ'     => array(
				'data'               => array(
					'v'    => 'ext',
					'j'    => '11.4:11.4',
					'blog' => 1234,
					'post' => 7,
					'tz'   => 5,
					'srv'  => 'example.org',
				),
				'stats_array_string' => "v:'ext',j:'11.4:11.4',blog:'1234',post:'7',tz:'5',srv:'example.org'",
			),
			'Post 0' => array(
				'data'               => array(
					'v'    => 'ext',
					'j'    => '11.4:11.4',
					'blog' => 1234,
					'post' => '0',
					'tz'   => 5,
					'srv'  => 'example.org',
				),
				'stats_array_string' => "v:'ext',j:'11.4:11.4',blog:'1234',post:'0',tz:'5',srv:'example.org'",
			),
		);
	}

	/**
	 * Test for Tracking_Pixel::stats_array
	 *
	 * @dataProvider statsArrayDataProvider
	 *
	 * @param  array  $data  The Stats data array to be converted to a string.
	 * @param  string $stats_array_string The expected string converted from stats array.
	 */
	public function test_stats_array( $data, $stats_array_string ) {
		$this->assertSame( $stats_array_string, Tracking_Pixel::stats_array( $data ) );
	}

	/**
	 * Mock filter function to test the use of stats_array filter.
	 *
	 * @param array $kvs The stats array in key values.
	 */
	public function stats_array_filter_replace_srv( $kvs ) {
		$kvs['srv'] = 'example.com';
		return $kvs;
	}

	/**
	 * Test for Tracking_Pixel::stats_array to check that stat_array filter is applied
	 */
	public function test_stats_array_applies_filter() {
		$data = array(
			'v'    => 'ext',
			'j'    => '11.4:11.4',
			'blog' => 1234,
			'post' => 0,
			'tz'   => false,
			'srv'  => 'example.org',
		);
		add_filter( 'stats_array', array( $this, 'stats_array_filter_replace_srv' ), 10, 2 );
		$stats_array           = Tracking_Pixel::stats_array( $data );
		$stats_array_should_be = "v:'ext',j:'11.4:11.4',blog:'1234',post:'0',tz:'',srv:'example.com'";
		remove_filter( 'stats_array', array( $this, 'stats_array_filter_replace_srv' ) );

		$this->assertSame( $stats_array_should_be, $stats_array );
	}
}
