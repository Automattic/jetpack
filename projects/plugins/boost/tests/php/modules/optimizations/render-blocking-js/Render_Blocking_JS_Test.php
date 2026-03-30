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
	 * Test that a script with data-jetpack-boost="ignore" (double quotes) is excluded from count.
	 */
	public function test_ignored_script_double_quotes_excluded() {
		$buffer = '<script data-jetpack-boost="ignore" type="text/javascript">console.log("hello");';
		$this->assertFalse( $this->instance->is_opened_script( $buffer ) );
	}

	/**
	 * Test that a script with data-jetpack-boost='ignore' (single quotes) is excluded from count.
	 */
	public function test_ignored_script_single_quotes_excluded() {
		$buffer = "<script data-jetpack-boost='ignore' type=\"text/javascript\">console.log('hello');";
		$this->assertFalse( $this->instance->is_opened_script( $buffer ) );
	}

	/**
	 * Test that a script with data-jetpack-boost=ignore (no quotes) is excluded from count.
	 */
	public function test_ignored_script_no_quotes_excluded() {
		$buffer = '<script data-jetpack-boost=ignore type="text/javascript">console.log("hello");';
		$this->assertFalse( $this->instance->is_opened_script( $buffer ) );
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
	 * Test mix of ignored and non-ignored scripts, with more non-ignored
	 * opening tags than total closing tags, returns true.
	 *
	 * Note: The closing tag regex counts ALL </script> tags regardless of
	 * the ignore attribute, so a single unclosed non-ignored script next to
	 * a closed ignored script will balance out. We need the non-ignored
	 * opening count to exceed the total closing count.
	 */
	public function test_mixed_ignored_and_normal_unclosed_returns_true() {
		$buffer  = '<script data-jetpack-boost="ignore">ignored();</script>';
		$buffer .= '<script type="text/javascript">normal1();</script>';
		$buffer .= '<script type="text/javascript">normal2();';
		$buffer .= '<script type="text/javascript">normal3();';
		$this->assertTrue( $this->instance->is_opened_script( $buffer ) );
	}

	/**
	 * Test that an unclosed non-ignored script balanced by a closed ignored
	 * script returns false — the closing tag counter is not filtered.
	 */
	public function test_single_unclosed_normal_balanced_by_ignored_closed_returns_false() {
		$buffer  = '<script data-jetpack-boost="ignore">ignored();</script>';
		$buffer .= '<script type="text/javascript">normal();';
		// opening non-ignored: 1, closing total: 1 → 1 > 1 is false.
		$this->assertFalse( $this->instance->is_opened_script( $buffer ) );
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
}
