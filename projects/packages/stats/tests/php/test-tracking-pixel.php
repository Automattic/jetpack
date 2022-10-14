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
			'blog' => 1234,
			'post' => '0',
			'tz'   => '5',
			'srv'  => 'example.org',
		);
		$this->assertSame( $expected_view_data, $view_data );
	}

	/**
	 * Test for Tracking_Pixel::get_footer_to_add
	 */
	public function test_get_footer_to_add() {
		$data          = array(
			'v'    => 'ext',
			'blog' => 1234,
			'post' => 0,
			'tz'   => false,
			'srv'  => 'example.org',
		);
		$footer_to_add = Tracking_Pixel::get_footer_to_add( $data );
		// phpcs:disable WordPress.WP.EnqueuedResources.NonEnqueuedScript
		$script_url              = 'https://stats.wp.com/e-' . gmdate( 'YW' ) . '.js';
		$footer_to_add_should_be = <<<END
	<script src='{$script_url}' defer></script>
	<script>
		_stq = window._stq || [];
		_stq.push([ 'view', {v:'ext',blog:'1234',post:'0',tz:'',srv:'example.org'} ]);
		_stq.push([ 'clickTrackerInit', '1234', '0' ]);
	</script>
END;
		$this->assertSame( $footer_to_add_should_be, $footer_to_add );
	}

	/**
	 * Test for Tracking_Pixel::test_get_footer_to_add for an amp request
	 */
	public function test_get_footer_to_add_amp_request() {
		$_SERVER['HTTP_HOST'] = '127.0.0.1';
		$data                 = array(
			'v'    => 'ext',
			'blog' => 1234,
			'post' => 0,
			'tz'   => false,
			'srv'  => 'example.org',
		);
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		$footer_to_add = Tracking_Pixel::get_footer_to_add( $data );
		remove_filter( 'jetpack_is_amp_request', '__return_true' );
		$footer_to_add_should_be = '<amp-pixel src="https://pixel.wp.com/g.gif?v=ext&#038;blog=1234&#038;post=0&#038;tz&#038;srv=example.org&#038;host=127.0.0.1&#038;rand=RANDOM&#038;ref=DOCUMENT_REFERRER"></amp-pixel>';
		$this->assertSame( $footer_to_add_should_be, $footer_to_add );
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
	 */
	public function test_get_footer_to_add_applies_filter() {
		add_filter( 'stats_array', array( $this, 'stats_array_filter_replace_srv' ), 10, 2 );
		$data          = array(
			'v'    => 'ext',
			'blog' => 1234,
			'post' => 0,
			'tz'   => false,
			'srv'  => 'example.org',
		);
		$footer_to_add = Tracking_Pixel::get_footer_to_add( $data );
		// phpcs:disable WordPress.WP.EnqueuedResources.NonEnqueuedScript
		$script_url              = 'https://stats.wp.com/e-' . gmdate( 'YW' ) . '.js';
		$footer_to_add_should_be = <<<END
	<script src='{$script_url}' defer></script>
	<script>
		_stq = window._stq || [];
		_stq.push([ 'view', {v:'ext',blog:'1234',post:'0',tz:'',srv:'replaced.com'} ]);
		_stq.push([ 'clickTrackerInit', '1234', '0' ]);
	</script>
END;
		remove_filter( 'stats_array', array( $this, 'stats_array_filter_replace_srv' ) );
		$this->assertSame( $footer_to_add_should_be, $footer_to_add );
	}
}
