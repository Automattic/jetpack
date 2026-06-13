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
		// The external script sits BEFORE the closing paragraph so the position
		// assertions below can only pass if the pipeline actually moved it.
		$html = '<html><body><p>Before</p>' .
			'<script>document.write("inline content");</script>' .
			'<script src="https://example.com/external.js"></script>' . // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript -- test fixture markup.
			'<p>After</p>' .
			'</body></html>';

		$output = $this->filter_output( $html );

		// Assert the anchors and needle are present so the strpos() ordering checks
		// below can't pass vacuously (a missing string makes strpos() return
		// false === 0, which can satisfy a one-sided ordering assertion).
		$this->assertStringContainsString( '<p>Before</p>', $output );
		$this->assertStringContainsString( '<p>After</p>', $output );
		$this->assertStringContainsString( 'document.write("inline content");', $output );

		// The document.write script must remain between the two paragraphs.
		$this->assertLessThan( strpos( $output, 'document.write' ), strpos( $output, '<p>Before</p>' ) );
		$this->assertLessThan( strpos( $output, '<p>After</p>' ), strpos( $output, 'document.write' ) );

		// The external script must have been moved after the content, before </body>.
		$this->assertLessThan( strpos( $output, 'external.js' ), strpos( $output, '<p>After</p>' ) );
		$this->assertStringContainsString( 'external.js"></script></body>', $output );
	}

	/**
	 * Test that an inline script using document.writeln() also stays in place.
	 *
	 * The sibling movable script is required: with no movable script in the buffer,
	 * handle_output_stream() returns the original buffers unchanged, so the pinned
	 * script would stay in place even if pinning never ran. The sibling forces the
	 * move path so this test actually exercises pin_position_dependent_scripts().
	 */
	public function test_inline_document_writeln_script_stays_in_place() {
		$html = '<html><body><p>Before</p>' .
			'<script>document.writeln("inline content");</script>' .
			'<script>console.log("sibling");</script>' .
			'<p>After</p>' .
			'</body></html>';

		$output = $this->filter_output( $html );

		// The writeln script is pinned between the paragraphs; bracket on both sides
		// so a dropped script (strpos === false === 0) can't pass trivially.
		$this->assertStringContainsString( 'document.writeln("inline content");', $output );
		$this->assertLessThan( strpos( $output, 'document.writeln' ), strpos( $output, '<p>Before</p>' ) );
		$this->assertLessThan( strpos( $output, '<p>After</p>' ), strpos( $output, 'document.writeln' ) );

		// The sibling movable script was relocated past the content.
		$this->assertLessThan( strpos( $output, 'console.log' ), strpos( $output, '<p>After</p>' ) );
	}

	/**
	 * Test that a script already carrying the ignore attribute keeps working as
	 * before: it stays in place and its markup is not modified (no duplicate
	 * ignore attribute), even when it contains document.write.
	 */
	public function test_ignore_attribute_still_works_and_is_not_duplicated() {
		$script = '<script data-jetpack-boost="ignore">document.write("kept");</script>';
		// Sibling movable script forces the move path so this test is not vacuous.
		$html = '<html><body><p>Before</p>' . $script .
			'<script>console.log("sibling");</script>' .
			'<p>After</p></body></html>';

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
			'<script>console.log("sibling");</script>' .
			'<p>After</p>' .
			'</body></html>';

		$output = $this->filter_output( $html );

		// Pinned in place; bracket on both sides so a dropped script can't pass trivially.
		$this->assertStringContainsString( 'Document.Write("inline content");', $output );
		$this->assertLessThan( strpos( $output, 'Document.Write' ), strpos( $output, '<p>Before</p>' ) );
		$this->assertLessThan( strpos( $output, '<p>After</p>' ), strpos( $output, 'Document.Write' ) );

		// Sibling movable script relocated past the content.
		$this->assertLessThan( strpos( $output, 'console.log' ), strpos( $output, '<p>After</p>' ) );
	}

	/**
	 * Test that a script with a src attribute is still moved even if its
	 * (non-executing) body mentions document.write — only inline scripts are
	 * position-dependent.
	 */
	public function test_script_with_src_and_document_write_body_is_still_moved() {
		$html = '<html><body><p>Before</p>' .
			'<script src="https://example.com/external.js">document.write("never runs");</script>' . // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript -- test fixture markup.
			'<p>After</p>' .
			'</body></html>';

		$output = $this->filter_output( $html );

		// Moved after the content, before </body>.
		$this->assertLessThan( strpos( $output, 'external.js' ), strpos( $output, '<p>After</p>' ) );
	}

	/**
	 * Regression guard: an inline script that document.write()s its own <script>
	 * markup must never be corrupted. Such a script is NOT pinned (there is no safe
	 * in-place rewrite), but the key contract is that its body is left byte-for-byte
	 * intact. A naive global '<script' replace would inject
	 * data-jetpack-boost="ignore" into the written markup and, with a double-quoted
	 * outer string, the unescaped " would break the JS string literal.
	 *
	 * The sibling movable script forces the move path: with no movable script,
	 * handle_output_stream() returns the original buffers and any corruption from
	 * pinning would be discarded, hiding the regression.
	 */
	public function test_document_write_of_script_tag_is_not_corrupted() {
		// Double-quoted outer string is the dangerous case for a global '<script'
		// replace; the closing tag is escaped as <\/script> as real markup would be.
		$writer = '<script>document.write("<script src=\"https://example.com/widget.js\"><\/script>");</script>'; // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript -- test fixture markup.
		$html   = '<html><body><p>Before</p>' . $writer .
			'<script>console.log("sibling");</script>' .
			'<p>After</p></body></html>';

		$output = $this->filter_output( $html );

		// The document.write payload survives verbatim — no attribute was injected
		// into the markup the script writes, so the JS string is intact.
		$this->assertStringContainsString( 'document.write("<script src=\"https://example.com/widget.js\"><\/script>");', $output ); // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript -- test fixture assertion.
		$this->assertStringNotContainsString( 'data-jetpack-boost="ignore" src=', $output );
	}

	/**
	 * Test the documented conservative trade-off: a script that merely mentions
	 * "document.write" inside a string or comment (without calling it) is left in
	 * place. This is an accepted false positive — the substring check does not
	 * parse JS — and the safe outcome (a script not moved) is preferred over the
	 * risk of moving a genuinely position-dependent script.
	 */
	public function test_document_write_substring_in_string_literal_is_left_in_place() {
		$html = '<html><body><p>Before</p>' .
			'<script>var note = "call document.write here"; alert( note );</script>' .
			'<script>console.log("sibling");</script>' .
			'<p>After</p></body></html>';

		$output = $this->filter_output( $html );

		// Conservatively kept in place (between the paragraphs), not moved.
		$this->assertStringContainsString( 'var note = "call document.write here";', $output );
		$this->assertLessThan( strpos( $output, 'var note' ), strpos( $output, '<p>Before</p>' ) );
		$this->assertLessThan( strpos( $output, '<p>After</p>' ), strpos( $output, 'var note' ) );

		// Sibling movable script relocated past the content (forces the move path).
		$this->assertLessThan( strpos( $output, 'console.log' ), strpos( $output, '<p>After</p>' ) );
	}

	/**
	 * Test that two distinct document.write scripts each stay in their own
	 * position while a normal script between them is still moved to the end.
	 */
	public function test_multiple_document_write_scripts_each_stay_in_place() {
		$html = '<html><body>' .
			'<p>A</p><script>document.write("first");</script>' .
			'<p>B</p><script>console.log("movable");</script>' .
			'<p>C</p><script>document.write("second");</script>' .
			'<p>D</p>' .
			'</body></html>';

		$output = $this->filter_output( $html );

		// Both document.write scripts kept in their respective positions.
		$this->assertLessThan( strpos( $output, 'document.write("first")' ), strpos( $output, '<p>A</p>' ) );
		$this->assertLessThan( strpos( $output, '<p>B</p>' ), strpos( $output, 'document.write("first")' ) );
		$this->assertLessThan( strpos( $output, 'document.write("second")' ), strpos( $output, '<p>C</p>' ) );
		$this->assertLessThan( strpos( $output, '<p>D</p>' ), strpos( $output, 'document.write("second")' ) );

		// The plain script between them is still moved to the end, before </body>.
		$this->assertLessThan( strpos( $output, 'console.log' ), strpos( $output, '<p>D</p>' ) );
		$this->assertStringContainsString( 'console.log("movable");</script></body>', $output );
	}

	/**
	 * Test that a document.write script with no closing </body> is appended at the
	 * end of the buffer (the append_script_tags() fallback branch) without
	 * dropping the position-dependent script.
	 */
	public function test_document_write_script_in_place_without_body_tag() {
		$html = '<p>Before</p>' .
			'<script>document.write("inline content");</script>' .
			'<p>After</p>' .
			'<script>console.log("movable");</script>';

		$output = $this->filter_output( $html );

		// document.write stays before the trailing content.
		$this->assertLessThan( strpos( $output, '<p>After</p>' ), strpos( $output, 'document.write' ) );
		// The movable script is appended at the very end (no </body> present).
		$this->assertStringContainsString( 'console.log("movable");</script>', $output );
		$this->assertLessThan( strpos( $output, 'console.log' ), strpos( $output, '<p>After</p>' ) );
	}
}
