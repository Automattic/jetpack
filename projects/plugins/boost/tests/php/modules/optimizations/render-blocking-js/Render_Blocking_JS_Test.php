<?php
/**
 * Tests for Render_Blocking_JS::is_opened_script()
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Modules\Optimizations\Render_Blocking_JS;

use Automattic\Jetpack_Boost\Modules\Optimizations\Render_Blocking_JS\Render_Blocking_JS;
use Brain\Monkey;
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
		Monkey\tearDown();
		parent::tearDown();
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
}
