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

		// Unconditionally drop the filters that enqueue_stats_script() registers so a
		// mid-test assertion failure can't leak them into sibling tests. remove_filter()
		// is a no-op when the filter isn't registered, so this is always safe.
		remove_filter( 'wp_script_attributes', array( Tracking_Pixel::class, 'add_low_fetchpriority' ) );
		remove_filter( 'wp_resource_hints', array( Tracking_Pixel::class, 'remove_stats_dns_prefetch' ), 100 );
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
			'arch_filters' => 'posts_per_page=10&paged=2&orderby=date&order=ASC&author_name=author&terms=' . wp_json_encode( array( 'testtax' => array( 'testterm' ) ), JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ),
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
	 * Test that the wp_script_attributes filter adds fetchpriority="low" to the jetpack-stats script.
	 */
	public function test_add_fetchpriority_low_via_script_attributes() {
		$attributes = array(
			'id'  => 'jetpack-stats-js',
			'src' => 'https://stats.wp.com/e-202620.js',
		);
		$result     = Tracking_Pixel::add_low_fetchpriority( $attributes );
		$this->assertSame( 'low', $result['fetchpriority'] );
	}

	/**
	 * Test that the wp_script_attributes filter does not modify other scripts.
	 */
	public function test_add_fetchpriority_low_ignores_other_scripts() {
		$attributes = array(
			'id'  => 'other-script-js',
			'src' => 'https://example.com/script.js',
		);
		$result     = Tracking_Pixel::add_low_fetchpriority( $attributes );
		$this->assertArrayNotHasKey( 'fetchpriority', $result );
	}

	/**
	 * Test that the wp_resource_hints filter removes dns-prefetch for stats.wp.com.
	 */
	public function test_remove_stats_dns_prefetch() {
		$urls   = array( '//stats.wp.com', '//example.com', '//other.com' );
		$result = Tracking_Pixel::remove_stats_dns_prefetch( $urls, 'dns-prefetch' );
		$this->assertNotContains( '//stats.wp.com', $result );
		$this->assertContains( '//example.com', $result );
		$this->assertContains( '//other.com', $result );
	}

	/**
	 * Test that the wp_resource_hints filter removes the bare-host form that WordPress core
	 * actually emits for dns-prefetch (wp_dependencies_unique_hosts() returns bare hosts).
	 */
	public function test_remove_stats_dns_prefetch_removes_bare_host() {
		$urls   = array( 'stats.wp.com', 'example.com', 'mystats.wp.com' );
		$result = Tracking_Pixel::remove_stats_dns_prefetch( $urls, 'dns-prefetch' );
		$this->assertNotContains( 'stats.wp.com', $result );
		$this->assertContains( 'example.com', $result );
		$this->assertContains( 'mystats.wp.com', $result );
	}

	/**
	 * Test that the wp_resource_hints filter removes array-form hints pointing at stats.wp.com
	 * while leaving array-form hints for other hosts intact.
	 */
	public function test_remove_stats_dns_prefetch_removes_array_form() {
		$stats_hint = array( 'href' => '//stats.wp.com' );
		$other_hint = array( 'href' => '//fonts.example.com' );
		$urls       = array( $stats_hint, $other_hint );
		$result     = Tracking_Pixel::remove_stats_dns_prefetch( $urls, 'dns-prefetch' );
		$this->assertNotContains( $stats_hint, $result );
		$this->assertContains( $other_hint, $result );
	}

	/**
	 * Test that the wp_resource_hints filter does not affect non-dns-prefetch hints.
	 */
	public function test_remove_stats_dns_prefetch_ignores_other_relations() {
		$urls   = array( '//stats.wp.com', '//example.com' );
		$result = Tracking_Pixel::remove_stats_dns_prefetch( $urls, 'preconnect' );
		$this->assertContains( '//stats.wp.com', $result );
	}

	/**
	 * Test that the wp_resource_hints filter matches the stats host exactly and leaves
	 * look-alike hosts and non-string entries (e.g. array-form hints) untouched.
	 */
	public function test_remove_stats_dns_prefetch_matches_host_exactly() {
		$array_hint = array( 'href' => '//fonts.example.com' );
		$urls       = array(
			'//stats.wp.com',
			'https://stats.wp.com/e-202620.js',
			'//mystats.wp.com',
			'//stats.wp.com.evil.tld',
			$array_hint,
		);
		$result     = Tracking_Pixel::remove_stats_dns_prefetch( $urls, 'dns-prefetch' );

		$this->assertNotContains( '//stats.wp.com', $result );
		$this->assertNotContains( 'https://stats.wp.com/e-202620.js', $result );
		$this->assertContains( '//mystats.wp.com', $result );
		$this->assertContains( '//stats.wp.com.evil.tld', $result );
		$this->assertContains( $array_hint, $result );
	}

	/**
	 * Test that enqueue_stats_script registers the script-attribute and resource-hint
	 * filters and that they behave as expected when applied.
	 */
	public function test_enqueue_stats_script_registers_filters() {
		// Registered filters are cleaned up unconditionally in tear_down().
		Tracking_Pixel::enqueue_stats_script();

		// Assert the exact priorities the implementation relies on: default 10 for the
		// script attribute, and 100 for resource hints so it runs after WP adds its own.
		$this->assertSame(
			10,
			has_filter( 'wp_script_attributes', array( Tracking_Pixel::class, 'add_low_fetchpriority' ) )
		);
		$this->assertSame(
			100,
			has_filter( 'wp_resource_hints', array( Tracking_Pixel::class, 'remove_stats_dns_prefetch' ) )
		);

		$script_attributes = apply_filters(
			'wp_script_attributes',
			array(
				'id'  => 'jetpack-stats-js',
				'src' => 'https://stats.wp.com/e-202445.js',
			)
		);
		$this->assertSame( 'low', $script_attributes['fetchpriority'] );

		$resource_hints = apply_filters(
			'wp_resource_hints',
			array( '//stats.wp.com', '//example.com' ),
			'dns-prefetch'
		);
		$this->assertNotContains( '//stats.wp.com', $resource_hints );
		$this->assertContains( '//example.com', $resource_hints );
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
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

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
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		$pixel_details = $method->invoke( new Tracking_Pixel(), $data );

		$expected_pixel_details = '_stq = window._stq || [];
_stq.push([ "view", {"v":"ext","blog":"1234","post":"0","tz":"","srv":"replaced.com"} ]);
_stq.push([ "clickTrackerInit", "1234", "0" ]);';

		remove_filter( 'stats_array', array( $this, 'stats_array_filter_replace_srv' ) );
		$this->assertSame( $expected_pixel_details, $pixel_details );
	}
}
