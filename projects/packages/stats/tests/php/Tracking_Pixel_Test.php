<?php
/**
 * Tests Tracking Pixel class.
 *
 * @package jetpack-stats
 */

namespace Automattic\Jetpack\Stats;

use PHPUnit\Framework\Attributes\CoversClass;
use WP_Query;

/**
 * Class to test the Tracking_Pixel class.
 *
 * @covers \Automattic\Jetpack\Stats\Tracking_Pixel
 */
#[CoversClass( Tracking_Pixel::class )]
class Tracking_Pixel_Test extends StatsBaseTestCase {
	/**
	 * Set up
	 */
	protected function set_up() {
		parent::set_up();

		$_SERVER['REQUEST_URI'] = 'index.html?utm_source=a_source&utm_id=some_id';
		register_taxonomy( 'testtax', array( 'testterm' ) );
	}

	/**
	 * Clean up the testing environment.
	 */
	public function tear_down() {
		parent::tear_down();
		global $wp_the_query;
		$wp_the_query           = new WP_Query();
		$_SERVER['REQUEST_URI'] = '';
		unregister_taxonomy( 'testtax' );
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
	 * Test for Tracking_Pixel::build_view_data with home
	 */
	public function test_build_view_data_with_home() {
		global $wp_the_query;
		$wp_the_query->is_home = true;
		$view_data             = Tracking_Pixel::build_view_data();
		$expected_view_data    = array(
			'v'          => 'ext',
			'blog'       => 1234,
			'post'       => '0',
			'tz'         => false,
			'srv'        => 'example.org',
			'utm_id'     => 'some_id',
			'utm_source' => 'a_source',
			'arch_home'  => '1',
		);
		$this->assertSame( $expected_view_data, $view_data );
	}

	/**
	 * Test for Tracking_Pixel::build_view_data with archives
	 */
	public function test_build_view_data_with_archives() {
		// testing author archives
		global $wp_the_query;
		$wp_the_query->is_archive = true;
		$wp_the_query->is_author  = true;
		$wp_the_query->query      = array( 'author_name' => 'some_author' );
		$view_data                = Tracking_Pixel::build_view_data();
		$expected_view_data       = array(
			'v'            => 'ext',
			'blog'         => 1234,
			'post'         => '0',
			'tz'           => false,
			'srv'          => 'example.org',
			'utm_id'       => 'some_id',
			'utm_source'   => 'a_source',
			'arch_author'  => 'some_author',
			'arch_results' => 0,
		);
		$this->assertSame( $expected_view_data, $view_data );

		// testing date archives
		$wp_the_query->is_author = false;
		$wp_the_query->is_date   = true;
		$wp_the_query->parse_query( 'year=2019&monthnum=12&day=31' );
		$view_data          = Tracking_Pixel::build_view_data();
		$expected_view_data = array(
			'v'            => 'ext',
			'blog'         => 1234,
			'post'         => '0',
			'tz'           => false,
			'srv'          => 'example.org',
			'utm_id'       => 'some_id',
			'utm_source'   => 'a_source',
			'arch_date'    => '2019/12/31',
			'arch_results' => 0,
		);
		$this->assertSame( $expected_view_data, $view_data );

		// testing category archives
		$wp_the_query->is_date     = false;
		$wp_the_query->is_category = true;
		$wp_the_query->parse_query( 'cat=testcategory&category_name=testcategory' );
		$view_data          = Tracking_Pixel::build_view_data();
		$expected_view_data = array(
			'v'            => 'ext',
			'blog'         => 1234,
			'post'         => '0',
			'tz'           => false,
			'srv'          => 'example.org',
			'utm_id'       => 'some_id',
			'utm_source'   => 'a_source',
			'arch_cat'     => 'testcategory',
			'arch_results' => 0,
		);
		$this->assertSame( $expected_view_data, $view_data );

		// testing tag archives
		$wp_the_query->is_category = false;
		$wp_the_query->is_tag      = true;
		$wp_the_query->parse_query( 'tag=testtag' );
		$view_data          = Tracking_Pixel::build_view_data();
		$expected_view_data = array(
			'v'            => 'ext',
			'blog'         => 1234,
			'post'         => '0',
			'tz'           => false,
			'srv'          => 'example.org',
			'utm_id'       => 'some_id',
			'utm_source'   => 'a_source',
			'arch_tag'     => 'testtag',
			'arch_results' => 0,
		);
		$this->assertSame( $expected_view_data, $view_data );

		// testing taxonomy
		$wp_the_query->is_tag = false;
		$wp_the_query->parse_query( 'testtax=testterm' );
		$wp_the_query->posts      = array( 'post1', 'post2', 'post3' );
		$wp_the_query->post_count = count( $wp_the_query->posts );
		$view_data                = Tracking_Pixel::build_view_data();
		$expected_view_data       = array(
			'v'                => 'ext',
			'blog'             => 1234,
			'post'             => '0',
			'tz'               => false,
			'srv'              => 'example.org',
			'utm_id'           => 'some_id',
			'utm_source'       => 'a_source',
			'arch_tax_testtax' => 'testterm',
			'arch_results'     => 3,
		);
		$this->assertSame( $expected_view_data, $view_data );
	}

	/**
	 * Test for Tracking_Pixel::build_view_data with error
	 */
	public function test_build_view_data_with_error() {
		global $wp_the_query;
		$wp_the_query->is_404 = true;
		$view_data            = Tracking_Pixel::build_view_data();
		$expected_view_data   = array(
			'v'          => 'ext',
			'blog'       => 1234,
			'post'       => '0',
			'tz'         => false,
			'srv'        => 'example.org',
			'utm_id'     => 'some_id',
			'utm_source' => 'a_source',
			'arch_err'   => $_SERVER['REQUEST_URI'],
		);
		$this->assertSame( $expected_view_data, $view_data );
	}

	/**
	 * Test for Tracking_Pixel::build_view_data with an undefined type of page
	 */
	public function test_build_view_data_with_undefined_type() {
		$view_data          = Tracking_Pixel::build_view_data();
		$expected_view_data = array(
			'v'          => 'ext',
			'blog'       => 1234,
			'post'       => '0',
			'tz'         => false,
			'srv'        => 'example.org',
			'utm_id'     => 'some_id',
			'utm_source' => 'a_source',
			'arch_other' => $_SERVER['REQUEST_URI'],
		);
		$this->assertSame( $expected_view_data, $view_data );
	}

	/**
	 * Test for Tracking_Pixel::build_view_data with search
	 */
	public function test_build_view_data_with_search() {
		global $wp_the_query;
		$wp_the_query->is_search = true;
		$wp_the_query->parse_query( 's=term&posts_per_page=10&paged=2&orderby=date&order=ASC&author_name=author&testtax=testterm' );
		$wp_the_query->posts      = array( 'post1', 'post2' );
		$wp_the_query->post_count = count( $wp_the_query->posts );
		$view_data                = Tracking_Pixel::build_view_data();
		$expected_view_data       = array(
			'v'            => 'ext',
			'blog'         => 1234,
			'post'         => '0',
			'tz'           => false,
			'srv'          => 'example.org',
			'utm_id'       => 'some_id',
			'utm_source'   => 'a_source',
			'arch_search'  => 'term',
			'arch_filters' => 'posts_per_page=10&paged=2&orderby=date&order=ASC&author_name=author&terms=' . wp_json_encode( array( 'testtax' => array( 'testterm' ) ) ),
			'arch_results' => 2,
		);
		$this->assertSame( $expected_view_data, $view_data );

		// testing search with non-existing taxonomy
		$wp_the_query->parse_query( 's=term&posts_per_page=10&paged=2&orderby=date&order=ASC&no-testtax=testterm' );
		$wp_the_query->posts      = array( 'post1', 'post2', 'post3' );
		$wp_the_query->post_count = count( $wp_the_query->posts );
		$view_data                = Tracking_Pixel::build_view_data();
		$expected_view_data       = array(
			'v'            => 'ext',
			'blog'         => 1234,
			'post'         => '0',
			'tz'           => false,
			'srv'          => 'example.org',
			'utm_id'       => 'some_id',
			'utm_source'   => 'a_source',
			'arch_search'  => 'term',
			'arch_filters' => 'posts_per_page=10&paged=2&orderby=date&order=ASC',
			'arch_results' => 3,
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
			'v'          => 'ext',
			'blog'       => 1234,
			'post'       => '0',
			'tz'         => '5',
			'srv'        => 'example.org',
			'utm_id'     => 'some_id',
			'utm_source' => 'a_source',
			'arch_other' => $_SERVER['REQUEST_URI'],
		);
		$this->assertSame( $expected_view_data, $view_data );
	}

	/**
	 * Test for Tracking_Pixel::test_get_footer_to_add for an amp request
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
