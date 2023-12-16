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
 * @covers \Automattic\Jetpack\Stats\Tracking_Pixel
 */
class Test_Tracking_Pixel extends StatsBaseTestCase {
	/**
	 * Set up
	 */
	protected function set_up() {
		parent::set_up();

		$_SERVER['REQUEST_URI'] = 'index.html?utm_source=a_source&utm_id=some_id';
	}

	/**
	 * Clean up the testing environment.
	 *
	 * @after
	 */
	public function tear_down() {
		parent::tear_down();
		global $wp_the_query;
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$wp_the_query           = new WP_Query();
		$_SERVER['REQUEST_URI'] = '';
	}

	/**
	 * Test for Tracking_Pixel::build_view_data with post
	 *
	 * @covers \Automattic\Jetpack\Stats\Tracking_Pixel::build_view_data
	 */
	public function test_build_view_data_with_post() {
		global $wp_the_query;
		$wp_the_query->is_posts_page  = true;
		$wp_the_query->queried_object = self::post( 7 );
		$view_data                    = Tracking_Pixel::build_view_data();
		$expected_view_data           = array(
			'v'          => 'ext',
			'blog'       => 1234,
			'post'       => 7,
			'tz'         => false,
			'srv'        => 'example.org',
			'utm_id'     => 'some_id',
			'utm_source' => 'a_source',
		);
		$this->assertSame( $expected_view_data, $view_data );
	}

	/**
	 * Test for Tracking_Pixel::build_view_data with gmt offset
	 *
	 * @covers \Automattic\Jetpack\Stats\Tracking_Pixel::build_view_data
	 */
	public function test_build_view_data_with_gmt_offset() {
		add_option( 'gmt_offset', '5' );
		$view_data          = Tracking_Pixel::build_view_data();
		$expected_view_data = array(
			'v'          => 'ext',
			'blog'       => 1234,
			'post'       => '0',
			'tz'         => '5',
			'srv'        => 'example.org',
			'utm_id'     => 'some_id',
			'utm_source' => 'a_source',
		);
		$this->assertSame( $expected_view_data, $view_data );
	}

	/**
	 * Test for Tracking_Pixel::test_get_footer_to_add for an amp request
	 *
	 * @covers \Automattic\Jetpack\Stats\Tracking_Pixel::get_amp_footer
	 */
	public function test_get_amp_footer() {
		$_SERVER['HTTP_HOST'] = '127.0.0.1';
		$data                 = array(
			'v'    => 'ext',
			'blog' => 1234,
			'post' => 0,
			'tz'   => false,
			'srv'  => 'example.org',
		);
		add_filter( 'jetpack_is_amp_request', '__return_true' );

		$method = new \ReflectionMethod( Tracking_Pixel::class, 'get_amp_footer' );
		$method->setAccessible( true );

		$amp_footer_data = $method->invoke( new Tracking_Pixel(), $data );

		remove_filter( 'jetpack_is_amp_request', '__return_true' );

		$footer_to_add_should_be = '<amp-pixel src="https://pixel.wp.com/g.gif?v=ext&#038;blog=1234&#038;post=0&#038;tz&#038;srv=example.org&#038;host=127.0.0.1&#038;rand=RANDOM&#038;ref=DOCUMENT_REFERRER"></amp-pixel>';
		$this->assertSame( $footer_to_add_should_be, $amp_footer_data );
	}

	/**
	 * Mock filter function to test the use of stats_array filter.
	 *
	 * @param array $kvs The stats array in key values.
	 */
	public function stats_array_filter_replace_srv( $kvs ) {
		$kvs['srv'] = 'replaced.com';
		return $kvs;
	}

	/**
	 * Test for Tracking_Pixel::get_footer_to_add to check that stat_array filter is applied
	 *
	 * @covers \Automattic\Jetpack\Stats\Tracking_Pixel::build_stats_details
	 */
	public function test_get_footer_to_add_applies_filter() {
		add_filter( 'stats_array', array( $this, 'stats_array_filter_replace_srv' ), 10, 2 );
		$data = array(
			'v'    => 'ext',
			'blog' => 1234,
			'post' => 0,
			'tz'   => false,
			'srv'  => 'example.org',
		);

		$method = new \ReflectionMethod( Tracking_Pixel::class, 'build_stats_details' );
		$method->setAccessible( true );
		$pixel_details = $method->invoke( new Tracking_Pixel(), $data );

		$expected_pixel_details = '_stq = window._stq || [];
_stq.push([ "view", JSON.parse("{\"v\":\"ext\",\"blog\":\"1234\",\"post\":\"0\",\"tz\":\"\",\"srv\":\"replaced.com\"}") ]);
_stq.push([ "clickTrackerInit", "1234", "0" ]);';

		remove_filter( 'stats_array', array( $this, 'stats_array_filter_replace_srv' ) );
		$this->assertSame( $expected_pixel_details, $pixel_details );
	}
}
