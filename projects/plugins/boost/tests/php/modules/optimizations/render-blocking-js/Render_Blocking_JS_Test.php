<?php
/**
 * Tests for Render_Blocking_JS::is_opened_script()
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Modules\Optimizations\Render_Blocking_JS;

use Automattic\Jetpack_Boost\Modules\Optimizations\Render_Blocking_JS\Render_Blocking_JS;
use Brain\Monkey;
use Brain\Monkey\Filters;
use Brain\Monkey\Functions;
use Mockery\Adapter\Phpunit\MockeryTestCase;

/**
 * Class Render_Blocking_JS_Test
 */
class Render_Blocking_JS_Test extends MockeryTestCase {

	/**
	 * The instance under test.
	 *
	 * @var Render_Blocking_JS
	 */
	private $instance;

	/**
	 * Set up test environment.
	 */
	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		$this->instance = new Render_Blocking_JS();

		// Set the private properties that is_opened_script depends on.
		$reflection = new \ReflectionClass( $this->instance );

		$attr_prop = $reflection->getProperty( 'ignore_attribute' );
		if ( PHP_VERSION_ID < 80100 ) {
			$attr_prop->setAccessible( true );
		}
		$attr_prop->setValue( $this->instance, 'data-jetpack-boost' );

		$val_prop = $reflection->getProperty( 'ignore_value' );
		if ( PHP_VERSION_ID < 80100 ) {
			$val_prop->setAccessible( true );
		}
		$val_prop->setValue( $this->instance, 'ignore' );
	}

	/**
	 * Tear down test environment.
	 */
	protected function tearDown(): void {
		unset( $_SERVER['REQUEST_URI'] );
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Stub the WordPress URL helpers used by the exclusion matching.
	 */
	private function stub_url_functions() {
		Functions\when( 'home_url' )->alias(
			function ( $path = '' ) {
				return 'http://example.com' . $path;
			}
		);

		Functions\when( 'wp_parse_url' )->alias(
			function ( $url, $component = -1 ) {
				return parse_url( $url, $component ); // phpcs:ignore WordPress.WP.AlternativeFunctions.parse_url_parse_url
			}
		);
	}

	/**
	 * Stub the WordPress request-context functions used by start_output_filtering().
	 */
	private function stub_request_context() {
		$this->stub_url_functions();

		Functions\when( 'is_customize_preview' )->justReturn( false );
		Functions\when( 'is_feed' )->justReturn( false );
		Functions\when( 'wp_doing_ajax' )->justReturn( false );
		Functions\when( 'wp_doing_cron' )->justReturn( false );
		Functions\when( 'wp_is_xml_request' )->justReturn( false );
		Functions\when( 'get_query_var' )->justReturn( '' );
	}

	/**
	 * Test that an empty buffer returns false.
	 */
	public function test_empty_buffer_returns_false() {
		$this->assertFalse( $this->instance->is_opened_script( '' ) );
	}

	/**
	 * Test that matched opening and closing script tags return false.
	 */
	public function test_matched_opening_and_closing_tags_returns_false() {
		$buffer = '<script type="text/javascript">console.log("hello");</script>';
		$this->assertFalse( $this->instance->is_opened_script( $buffer ) );
	}

	/**
	 * Test that an unclosed script tag returns true.
	 */
	public function test_unclosed_script_tag_returns_true() {
		$buffer = '<script type="text/javascript">console.log("hello");';
		$this->assertTrue( $this->instance->is_opened_script( $buffer ) );
	}

	/**
	 * Test that an unclosed ignored script (double quotes) returns true — the
	 * buffer must hold content until the closing tag arrives.
	 */
	public function test_unclosed_ignored_script_double_quotes_returns_true() {
		$buffer = '<script data-jetpack-boost="ignore" type="text/javascript">console.log("hello");';
		$this->assertTrue( $this->instance->is_opened_script( $buffer ) );
	}

	/**
	 * Test that an unclosed ignored script (single quotes) returns true.
	 */
	public function test_unclosed_ignored_script_single_quotes_returns_true() {
		$buffer = "<script data-jetpack-boost='ignore' type=\"text/javascript\">console.log('hello');";
		$this->assertTrue( $this->instance->is_opened_script( $buffer ) );
	}

	/**
	 * Test that an unclosed ignored script (no quotes) returns true.
	 */
	public function test_unclosed_ignored_script_no_quotes_returns_true() {
		$buffer = '<script data-jetpack-boost=ignore type="text/javascript">console.log("hello");';
		$this->assertTrue( $this->instance->is_opened_script( $buffer ) );
	}

	/**
	 * Test mix of ignored and non-ignored scripts, all closed, returns false.
	 */
	public function test_mixed_ignored_and_normal_all_closed_returns_false() {
		$buffer  = '<script data-jetpack-boost="ignore">ignored();</script>';
		$buffer .= '<script type="text/javascript">normal();</script>';
		$this->assertFalse( $this->instance->is_opened_script( $buffer ) );
	}

	/**
	 * Test mix of ignored and non-ignored scripts, with unclosed non-ignored
	 * scripts, returns true.
	 */
	public function test_mixed_ignored_and_normal_unclosed_returns_true() {
		$buffer  = '<script data-jetpack-boost="ignore">ignored();</script>';
		$buffer .= '<script type="text/javascript">normal1();</script>';
		$buffer .= '<script type="text/javascript">normal2();';
		$buffer .= '<script type="text/javascript">normal3();';
		$this->assertTrue( $this->instance->is_opened_script( $buffer ) );
	}

	/**
	 * Test that an unclosed non-ignored script following a closed ignored
	 * script returns true. The closed ignored pair is stripped before counting,
	 * so the unclosed normal script is correctly detected.
	 */
	public function test_unclosed_normal_after_closed_ignored_returns_true() {
		$buffer  = '<script data-jetpack-boost="ignore">ignored();</script>';
		$buffer .= '<script type="text/javascript">normal();';
		$this->assertTrue( $this->instance->is_opened_script( $buffer ) );
	}

	/**
	 * Test that the ignore attribute with a wrong value is not excluded.
	 */
	public function test_ignored_attribute_with_wrong_value_is_not_excluded() {
		$buffer = '<script data-jetpack-boost="other-value" type="text/javascript">console.log("hello");';
		$this->assertTrue( $this->instance->is_opened_script( $buffer ) );
	}

	/**
	 * Test that a bare ignore attribute without a value is not excluded.
	 */
	public function test_bare_ignore_attribute_without_value_is_not_excluded() {
		$buffer = '<script data-jetpack-boost type="text/javascript">console.log("hello");';
		$this->assertTrue( $this->instance->is_opened_script( $buffer ) );
	}

	/**
	 * Test that a closed ignored script with double-quoted attribute returns false.
	 */
	public function test_closed_ignored_script_double_quotes_returns_false() {
		$buffer = '<script data-jetpack-boost="ignore">ignored();</script>';
		$this->assertFalse( $this->instance->is_opened_script( $buffer ) );
	}

	/**
	 * Test that a closed ignored script with single-quoted attribute returns false.
	 */
	public function test_closed_ignored_script_single_quotes_returns_false() {
		$buffer = "<script data-jetpack-boost='ignore'>ignored();</script>";
		$this->assertFalse( $this->instance->is_opened_script( $buffer ) );
	}

	/**
	 * Test that a closed ignored script with no-quote attribute returns false.
	 */
	public function test_closed_ignored_script_no_quotes_returns_false() {
		$buffer = '<script data-jetpack-boost=ignore>ignored();</script>';
		$this->assertFalse( $this->instance->is_opened_script( $buffer ) );
	}

	/**
	 * Test that a </script> inside an HTML comment does not mask a truly
	 * unclosed script tag.
	 */
	public function test_commented_out_closing_tag_does_not_mask_unclosed_script() {
		$buffer = '<script>unclosed();<!-- </script> -->';
		$this->assertTrue( $this->instance->is_opened_script( $buffer ) );
	}

	/**
	 * Known regex limitation: a literal "</script>" inside a JavaScript string
	 * inside an ignored pair prematurely terminates the lazy match, matching
	 * the existing behavior of get_script_tags(). Document the outcome so a
	 * future change here is an intentional decision.
	 */
	public function test_ignored_pair_with_literal_closing_in_string() {
		$buffer  = '<script data-jetpack-boost="ignore">var s = "</script>";</script>';
		$buffer .= '<script>unclosed();';
		// Lazy ignored-pair regex consumes up to the first </script> (inside the
		// string), leaving `";</script><script>unclosed();`. After counting,
		// opens=1, closes=1 → false. A genuinely unclosed normal script goes
		// unreported — same trade-off as get_script_tags().
		$this->assertFalse( $this->instance->is_opened_script( $buffer ) );
	}

	/**
	 * Test the URL exclusion pattern matching semantics.
	 */
	public function test_is_url_excluded_matching_semantics() {
		$this->stub_url_functions();

		$cases = array(
			'exact path match'                        => array( '/checkout/', array( 'checkout' ), true ),
			'trailing slash in pattern'               => array( '/checkout', array( 'checkout/' ), true ),
			'leading slash in pattern'                => array( '/checkout/', array( '/checkout' ), true ),
			'query string is ignored'                 => array( '/checkout/?step=2&cart=1', array( 'checkout' ), true ),
			'case-insensitive match'                  => array( '/Checkout/', array( 'checkout' ), true ),
			'full URL pattern (http home url)'        => array( '/checkout/', array( 'http://example.com/checkout' ), true ),
			'full URL pattern (https home url)'       => array( '/checkout/', array( 'https://example.com/checkout' ), true ),
			'wildcard (.*) matches sub-paths'         => array( '/gallery/holiday-2024/', array( 'gallery/(.*)' ), true ),
			'wildcard * matches sub-paths'            => array( '/gallery/holiday-2024/', array( 'gallery/*' ), true ),
			'wildcard .* matches sub-paths'           => array( '/gallery/holiday-2024/', array( 'gallery/.*' ), true ),
			'wildcard in the middle of a pattern'     => array( '/shop/blue-shirt/reviews/', array( 'shop/*/reviews' ), true ),
			'wildcard does not match the parent page' => array( '/gallery/', array( 'gallery/(.*)' ), false ),
			'no match on a different page'            => array( '/about-us/', array( 'checkout', 'gallery/(.*)' ), false ),
			'pattern is not a partial match'          => array( '/checkout-success/', array( 'checkout' ), false ),
			'root pattern matches the homepage'       => array( '/', array( '/' ), true ),
			'root pattern does not match sub-pages'   => array( '/about-us/', array( '/' ), false ),
			'regex characters are treated literally'  => array( '/pageXhtml/', array( 'page.html' ), false ),
			'literal dot matches itself'              => array( '/page.html', array( 'page.html' ), true ),
			'empty pattern list'                      => array( '/checkout/', array(), false ),
			'empty string patterns are ignored'       => array( '/checkout/', array( '', '   ' ), false ),
			'non-string patterns are ignored'         => array( '/checkout/', array( 42, null, array( 'checkout' ) ), false ),
			'second pattern in the list matches'      => array( '/checkout/', array( 'cart', 'checkout' ), true ),
		);

		foreach ( $cases as $description => $case ) {
			list( $request_uri, $patterns, $expected ) = $case;
			$this->assertSame(
				$expected,
				Render_Blocking_JS::is_url_excluded( $request_uri, $patterns ),
				'Failed case: ' . $description
			);
		}
	}

	/**
	 * When the current request matches an exclusion pattern, output filtering
	 * must not be set up and the shortcode filter must be removed, leaving the
	 * page output byte-identical to defer-disabled output.
	 */
	public function test_output_filtering_bails_on_excluded_url() {
		$_SERVER['REQUEST_URI'] = '/excluded-page/?foo=bar';
		$this->stub_request_context();
		Functions\when( 'jetpack_boost_ds_get' )->justReturn( array( 'excluded-page' ) );

		Filters\expectAdded( 'jetpack_boost_output_filtering_last_buffer' )->never();
		Filters\expectAdded( 'script_loader_tag' )->never();
		Filters\expectRemoved( 'do_shortcode_tag' )->once();

		$initial_ob_level = ob_get_level();

		$this->instance->setup();
		$this->instance->start_output_filtering();

		// No output buffer should have been opened.
		$this->assertSame( $initial_ob_level, ob_get_level() );
	}

	/**
	 * When the current request does not match any exclusion pattern, output
	 * filtering proceeds as usual.
	 */
	public function test_output_filtering_proceeds_on_non_excluded_url() {
		$_SERVER['REQUEST_URI'] = '/regular-page/';
		$this->stub_request_context();
		Functions\when( 'jetpack_boost_ds_get' )->justReturn( array( 'excluded-page' ) );

		Filters\expectAdded( 'jetpack_boost_output_filtering_last_buffer' )->once();
		Filters\expectAdded( 'script_loader_tag' )->once();

		$initial_ob_level = ob_get_level();

		$this->instance->setup();
		$this->instance->start_output_filtering();

		// Output filtering opens an output buffer; close it again.
		$this->assertSame( $initial_ob_level + 1, ob_get_level() );
		ob_end_clean();
	}
}
