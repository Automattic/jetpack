<?php
/**
 * Tests Tracking Pixel class.
 *
 * @package jetpack-stats
 */

namespace Automattic\Jetpack\Stats;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
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

		// Reset the Options cache so the next test starts fresh.
		$reflection = new \ReflectionClass( Options::class );
		$property   = $reflection->getProperty( 'options' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, array() );
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
	 * Sample view data for the AMP pixel tests.
	 *
	 * @return array
	 */
	private function amp_pixel_data() {
		return array(
			'v'    => 'ext',
			'blog' => 1234,
			'post' => 0,
			'tz'   => false,
			'srv'  => 'example.org',
		);
	}

	/**
	 * Test for Tracking_Pixel::get_amp_pixel_url.
	 */
	public function test_get_amp_pixel_url() {
		$_SERVER['HTTP_HOST'] = '127.0.0.1';

		$method = new \ReflectionMethod( Tracking_Pixel::class, 'get_amp_pixel_url' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		$pixel_url = $method->invoke( new Tracking_Pixel(), $this->amp_pixel_data() );

		$expected_url = 'https://pixel.wp.com/g.gif?v=ext&blog=1234&post=0&tz&srv=example.org&host=127.0.0.1&rand=RANDOM&ref=DOCUMENT_REFERRER';
		$this->assertSame( $expected_url, $pixel_url );
	}

	/**
	 * Test for Tracking_Pixel::render_amp_footer. The Jetpack plugin calls this from its AMP
	 * support layer, so the emitted markup is a contract: the ampersands stay encoded as &#038;
	 * and the AMP placeholders RANDOM and DOCUMENT_REFERRER survive as query values.
	 */
	public function test_render_amp_footer_prints_the_pixel() {
		$_SERVER['HTTP_HOST'] = '127.0.0.1';

		ob_start();
		Tracking_Pixel::render_amp_footer( $this->amp_pixel_data() );
		$output = (string) ob_get_clean();

		$expected = '<amp-pixel src="https://pixel.wp.com/g.gif?v=ext&#038;blog=1234&#038;post=0&#038;tz&#038;srv=example.org&#038;host=127.0.0.1&#038;rand=RANDOM&#038;ref=DOCUMENT_REFERRER"></amp-pixel>';
		$this->assertSame( $expected, $output );
	}

	/**
	 * Test for Tracking_Pixel::add_amp_pixel on an AMP request.
	 */
	public function test_add_amp_pixel_prints_the_pixel_on_an_amp_request() {
		global $wp_the_query;
		$wp_the_query->is_home = true;
		$_SERVER['HTTP_HOST']  = '127.0.0.1';

		$output = '';
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		try {
			ob_start();
			Tracking_Pixel::add_amp_pixel();
			$output = (string) ob_get_clean();
		} finally {
			remove_filter( 'jetpack_is_amp_request', '__return_true' );
		}

		$expected = '<amp-pixel src="https://pixel.wp.com/g.gif?v=ext&#038;blog=1234&#038;post=0&#038;tz&#038;srv=example.org&#038;utm_id=some_id&#038;utm_source=a_source&#038;arch_home=1&#038;host=127.0.0.1&#038;rand=RANDOM&#038;ref=DOCUMENT_REFERRER"></amp-pixel>';
		$this->assertSame( $expected, $output );
	}

	/**
	 * Test for Tracking_Pixel::add_amp_pixel on a request that is not AMP.
	 */
	public function test_add_amp_pixel_prints_nothing_on_a_non_amp_request() {
		global $wp_the_query;
		$wp_the_query->is_home = true;

		$output = '';
		add_filter( 'jetpack_is_amp_request', '__return_false' );
		try {
			ob_start();
			Tracking_Pixel::add_amp_pixel();
			$output = (string) ob_get_clean();
		} finally {
			remove_filter( 'jetpack_is_amp_request', '__return_false' );
		}

		$this->assertSame( '', $output );
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

	/**
	 * Invoke the private build_stats_details() with a fixed data payload.
	 *
	 * @param array $data View data for the tracker.
	 * @return string The emitted inline script.
	 */
	private function invoke_build_stats_details( $data ) {
		$method = new \ReflectionMethod( Tracking_Pixel::class, 'build_stats_details' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		return $method->invoke( new Tracking_Pixel(), $data );
	}

	/**
	 * Sample view data used by the gate tests.
	 *
	 * @return array
	 */
	private function consent_gate_data() {
		return array(
			'v'    => 'ext',
			'blog' => 1234,
			'post' => 0,
			'tz'   => false,
			'srv'  => 'example.org',
		);
	}

	/**
	 * @return string
	 */
	private function invoke_build_consent_gate() {
		$method = new \ReflectionMethod( Tracking_Pixel::class, 'build_consent_gate' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		$pushes = '_stq.push([ "view", {"v":"ext","blog":"1234","post":"0"} ]);' . "\n" . '_stq.push([ "clickTrackerInit", "1234", "0" ]);';
		return $method->invoke( new Tracking_Pixel(), $pushes );
	}

	/**
	 * What the gate does in a browser, as views counted, console warnings and an escaping error.
	 *
	 * @return array
	 */
	public static function consent_gate_scenarios() {
		return array(
			'allowed before the page is ready'             => array( 'allowed before the page is ready', 1, 0, null ),
			'denied, then allowed in the banner'           => array( 'denied, then allowed in the banner', 1, 0, null ),
			'declined in the banner'                       => array( 'declined in the banner', 0, 0, null ),
			'gate that loads after the page is ready'      => array( 'gate that loads after the page is ready', 1, 0, null ),
			'consent type defined after the page is ready' => array( 'consent type defined after the page is ready', 1, 0, null ),
			'banner that sets an opt-in consent type later' => array( 'banner that sets an opt-in consent type later', 0, 0, null ),
			'denied in a banner that sets no consent type' => array( 'denied in a banner that sets no consent type', 0, 0, null ),
			'consent API that loads only by the load event' => array( 'consent API that loads only by the load event', 1, 0, null ),
			'consent API that never loads'                 => array( 'consent API that never loads', 0, 1, null ),
			'consent API that throws'                      => array( 'consent API that throws', 0, 1, null ),
			'stats sender that throws'                     => array( 'stats sender that throws', 0, 0, 'stats sender' ),
		);
	}

	/**
	 * Runs the gate under Node: its behavior lives in the JavaScript, not the PHP that prints it.
	 *
	 * @dataProvider consent_gate_scenarios
	 * @param string      $scenario A scenario in consent-gate-harness.js.
	 * @param int         $views    Views the gate should send.
	 * @param int         $warnings Console warnings it should log.
	 * @param string|null $error    The error that should escape it.
	 */
	#[DataProvider( 'consent_gate_scenarios' )]
	public function test_consent_gate_in_a_browser( $scenario, $views, $warnings, $error ) {
		if ( ! shell_exec( 'command -v node 2>/dev/null' ) ) {
			$this->markTestSkipped( 'Node is unavailable.' );
		}
		$gate_file = tempnam( sys_get_temp_dir(), 'jp-stats-gate' );
		file_put_contents( $gate_file, $this->invoke_build_consent_gate() ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents

		$output = shell_exec( 'node ' . escapeshellarg( __DIR__ . '/consent-gate-harness.js' ) . ' ' . escapeshellarg( $gate_file ) . ' ' . escapeshellarg( $scenario ) . ' 2>&1' );
		unlink( $gate_file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink

		$this->assertSame(
			array(
				'views'    => $views,
				'warnings' => $warnings,
				'error'    => $error,
			),
			json_decode( (string) $output, true ),
			(string) $output
		);
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_build_stats_details_gates_with_consent_api() {
		require_once __DIR__ . '/mocks/wp-consent-api-mock.php';

		$pixel_details = $this->invoke_build_stats_details( $this->consent_gate_data() );

		$this->assertStringContainsString( 'function _jpStatsFire()', $pixel_details );
	}

	public function test_build_stats_details_unchanged_without_consent_api() {
		$this->assertFalse( function_exists( 'wp_has_consent' ), 'Test env must not define wp_has_consent.' );

		$pixel_details = $this->invoke_build_stats_details( $this->consent_gate_data() );

		$expected = "_stq = window._stq || [];\n"
			. '_stq.push([ "view", {"v":"ext","blog":"1234","post":"0","tz":"","srv":"example.org"} ]);' . "\n"
			. '_stq.push([ "clickTrackerInit", "1234", "0" ]);';

		$this->assertSame( $expected, $pixel_details );
	}
}
