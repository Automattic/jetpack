<?php
/**
 * Tests for Render_Blocking_JS::is_opened_script()
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Modules\Optimizations\Render_Blocking_JS;

use Automattic\Jetpack_Boost\Modules\Optimizations\Render_Blocking_JS\Render_Blocking_JS;
use Brain\Monkey;
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

		// Used by add_ignore_attribute() when scripts are marked as ignored.
		Functions\when( 'esc_html' )->returnArg();
		Functions\when( 'esc_attr' )->returnArg();
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

	/**
	 * Run a buffer through the same pipeline the module uses on a real page:
	 * handle_output_stream() strips the movable scripts, append_script_tags()
	 * re-appends them at the end (before </body> when present).
	 *
	 * @param string $html Page HTML.
	 * @return string Filtered output.
	 */
	private function filter_output( $html ) {
		list( $buffer_start, $buffer_end ) = $this->instance->handle_output_stream( $html, '' );

		return $this->instance->append_script_tags( $buffer_start . $buffer_end );
	}

	/**
	 * Test that an inline script using document.write() stays in its original
	 * position (its output is position-dependent) while a normal script is
	 * still moved to the end of the document.
	 */
	public function test_inline_document_write_script_stays_in_place_while_normal_script_is_moved() {
		$html = '<html><body><p>Before</p>' .
			'<script>document.write("inline content");</script>' .
			'<p>After</p>' .
			'<script src="https://example.com/external.js"></script>' .
			'</body></html>';

		$output = $this->filter_output( $html );

		// The document.write script must remain between the two paragraphs.
		$this->assertLessThan( strpos( $output, 'document.write' ), strpos( $output, '<p>Before</p>' ) );
		$this->assertLessThan( strpos( $output, '<p>After</p>' ), strpos( $output, 'document.write' ) );

		// The external script must have been moved after the content, before </body>.
		$this->assertLessThan( strpos( $output, 'external.js' ), strpos( $output, '<p>After</p>' ) );
		$this->assertStringContainsString( 'external.js"></script></body>', $output );
	}

	/**
	 * Test that an inline script using document.writeln() also stays in place.
	 */
	public function test_inline_document_writeln_script_stays_in_place() {
		$html = '<html><body><p>Before</p>' .
			'<script>document.writeln("inline content");</script>' .
			'<p>After</p>' .
			'</body></html>';

		$output = $this->filter_output( $html );

		$this->assertLessThan( strpos( $output, '<p>After</p>' ), strpos( $output, 'document.writeln' ) );
	}

	/**
	 * Test that a script already carrying the ignore attribute keeps working as
	 * before: it stays in place and its markup is not modified (no duplicate
	 * ignore attribute), even when it contains document.write.
	 */
	public function test_ignore_attribute_still_works_and_is_not_duplicated() {
		$script = '<script data-jetpack-boost="ignore">document.write("kept");</script>';
		$html   = '<html><body><p>Before</p>' . $script . '<p>After</p></body></html>';

		$output = $this->filter_output( $html );

		// Still in its original position.
		$this->assertLessThan( strpos( $output, '<p>After</p>' ), strpos( $output, 'document.write' ) );

		// Markup unchanged: exactly one ignore attribute, no duplicates added.
		$this->assertStringContainsString( $script, $output );
		$this->assertSame( 1, substr_count( $output, 'data-jetpack-boost' ) );
	}

	/**
	 * Test that a plain inline script without document.write is still moved to
	 * the end of the document (current behavior preserved).
	 */
	public function test_plain_inline_script_is_still_moved() {
		$html = '<html><body><p>Before</p>' .
			'<script>console.log("plain inline");</script>' .
			'<p>After</p>' .
			'</body></html>';

		$output = $this->filter_output( $html );

		// Moved after the content, before </body>.
		$this->assertLessThan( strpos( $output, 'console.log' ), strpos( $output, '<p>After</p>' ) );
		$this->assertStringContainsString( 'console.log("plain inline");</script></body>', $output );
	}

	/**
	 * Test that the document.write check is case-insensitive.
	 */
	public function test_inline_document_write_check_is_case_insensitive() {
		$html = '<html><body><p>Before</p>' .
			'<script>Document.Write("inline content");</script>' .
			'<p>After</p>' .
			'</body></html>';

		$output = $this->filter_output( $html );

		$this->assertLessThan( strpos( $output, '<p>After</p>' ), strpos( $output, 'Document.Write' ) );
	}

	/**
	 * Test that a script with a src attribute is still moved even if its
	 * (non-executing) body mentions document.write — only inline scripts are
	 * position-dependent.
	 */
	public function test_script_with_src_and_document_write_body_is_still_moved() {
		$html = '<html><body><p>Before</p>' .
			'<script src="https://example.com/external.js">document.write("never runs");</script>' .
			'<p>After</p>' .
			'</body></html>';

		$output = $this->filter_output( $html );

		// Moved after the content, before </body>.
		$this->assertLessThan( strpos( $output, 'external.js' ), strpos( $output, '<p>After</p>' ) );
	}
}
