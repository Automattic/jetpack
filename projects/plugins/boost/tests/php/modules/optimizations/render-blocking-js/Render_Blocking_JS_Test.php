<?php
/**
 * Tests for the Render_Blocking_JS module: is_opened_script() detection and the
 * inline-script handling that keeps position-dependent document.write() scripts
 * in place when Defer JS moves other scripts to the end of the document.
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
	 * Output-buffer nesting level captured before each test, used to clean up
	 * any buffers a test leaves open (e.g. when an assertion fails mid-test).
	 *
	 * @var int
	 */
	private $base_ob_level;

	/**
	 * Set up test environment.
	 */
	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		$this->base_ob_level = ob_get_level();

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
		// Close any output buffers a test left open so they cannot leak between tests.
		while ( ob_get_level() > $this->base_ob_level ) {
			ob_end_clean();
		}

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
	 * Like filter_output(), but split the page into two output-buffer chunks at
	 * the given offset, mirroring how Output_Filter feeds handle_output_stream()
	 * a (buffer_start, buffer_end) pair. Guards against a future refactor that
	 * scans a single chunk instead of the joint buffer.
	 *
	 * @param string $html  Page HTML.
	 * @param int    $split Byte offset to split the page at.
	 * @return string Filtered output.
	 */
	private function split_filter_output( $html, $split ) {
		list( $buffer_start, $buffer_end ) = $this->instance->handle_output_stream(
			substr( $html, 0, $split ),
			substr( $html, $split )
		);

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

	/**
	 * Test that an uppercase/mixed-case <SCRIPT> tag using document.write is
	 * pinned. The tag matcher is case-insensitive and add_ignore_attribute() uses
	 * str_ireplace(), so the opening tag is tagged (and normalized to lowercase,
	 * which is semantically identical) rather than left movable — the existing
	 * case-insensitivity test only varies the JS call casing, not the tag.
	 */
	public function test_uppercase_script_tag_with_document_write_is_pinned() {
		$html = '<html><body><p>Before</p>' .
			'<SCRIPT>document.write("upper");</SCRIPT>' .
			'<script>console.log("sibling");</script>' .
			'<p>After</p></body></html>';

		$output = $this->filter_output( $html );

		// Pinned in place and given the ignore attribute despite the uppercase tag.
		$this->assertStringContainsString( 'document.write("upper");', $output );
		$this->assertStringContainsString( 'data-jetpack-boost="ignore"', $output );
		$this->assertLessThan( strpos( $output, 'document.write' ), strpos( $output, '<p>Before</p>' ) );
		$this->assertLessThan( strpos( $output, '<p>After</p>' ), strpos( $output, 'document.write' ) );

		// Sibling movable script still relocated past the content.
		$this->assertLessThan( strpos( $output, 'console.log' ), strpos( $output, '<p>After</p>' ) );
	}

	/**
	 * Test that a document.write script split across two output-buffer chunks is
	 * still pinned. Output_Filter pins on the joint buffer, so the split must not
	 * matter; this guards against a refactor that scans a single chunk alone.
	 */
	public function test_document_write_script_pinned_across_buffer_split() {
		$html = '<html><body><p>Before</p>' .
			'<script>document.write("inline content");</script>' .
			'<script>console.log("sibling");</script>' .
			'<p>After</p></body></html>';

		// Split inside the document.write script body, so the opening tag lands in
		// buffer_start and the closing tag in buffer_end.
		$split  = strpos( $html, 'inline content' ) + 3;
		$output = $this->split_filter_output( $html, $split );

		$this->assertStringContainsString( 'document.write("inline content");', $output );
		$this->assertLessThan( strpos( $output, 'document.write' ), strpos( $output, '<p>Before</p>' ) );
		$this->assertLessThan( strpos( $output, '<p>After</p>' ), strpos( $output, 'document.write' ) );

		// Sibling movable script still relocated past the content.
		$this->assertLessThan( strpos( $output, 'console.log' ), strpos( $output, '<p>After</p>' ) );
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
			'percent-encoded space in request'        => array( '/foo%20bar/', array( 'foo bar' ), true ),
			'encoded non-ascii slug matches pattern'  => array( '/caf%C3%A9/', array( 'café' ), true ),
			'encoded pattern matches decoded request' => array( '/foo bar/', array( 'foo%20bar' ), true ),
			'encoded slash decodes to a separator'    => array( '/foo%2Fbar/', array( 'foo/bar' ), true ),
			'malformed URL does not match homepage'   => array( '/', array( 'http://[::1' ), false ),
			'malformed URL does not match a page'     => array( '/checkout/', array( 'http://[::1' ), false ),
			'other-host pathless URL is rejected'     => array( '/', array( 'http://other.example.net' ), false ),
			'same-site bare URL excludes homepage'    => array( '/', array( 'http://example.com' ), true ),
			'same-site bare URL only matches home'    => array( '/checkout/', array( 'http://example.com' ), false ),
			'literal parens are not regex groups'     => array( '/page1/', array( 'page(1)' ), false ),
			'literal parens match themselves'         => array( '/page(1)/', array( 'page(1)' ), true ),
			'bare wildcard matches every path'        => array( '/any/deep/path/', array( '(.*)' ), true ),
			'bare wildcard matches the homepage'      => array( '/', array( '*' ), true ),
			'consecutive wildcards collapse'          => array( '/gallery/holiday/', array( 'gallery/**' ), true ),
			'many wildcards do not blow up'           => array( '/a/b/c/', array( str_repeat( '*', 8192 ) ), true ),
			'multiple separated wildcards'            => array( '/a/x/b/y/', array( 'a/*/b/*' ), true ),
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

		// Output filtering opens an output buffer.
		$this->assertGreaterThan( $initial_ob_level, ob_get_level() );

		// Clean up any buffers this test opened so they cannot leak into others.
		while ( ob_get_level() > $initial_ob_level ) {
			ob_end_clean();
		}
	}

	/**
	 * Verifies is_current_request_excluded() bails out (returns false) when
	 * REQUEST_URI is not available, e.g. on CLI/cron requests.
	 */
	public function test_is_current_request_excluded_without_request_uri() {
		unset( $_SERVER['REQUEST_URI'] );
		$this->stub_url_functions();
		Functions\when( 'jetpack_boost_ds_get' )->justReturn( array( 'checkout' ) );

		$this->assertFalse( $this->invoke_is_current_request_excluded() );
	}

	/**
	 * Verifies is_current_request_excluded() bails out (returns false) when the
	 * stored patterns are empty or not a usable array, rather than warning or matching.
	 */
	public function test_is_current_request_excluded_with_unusable_patterns() {
		$_SERVER['REQUEST_URI'] = '/checkout/';
		$this->stub_url_functions();

		foreach ( array( array(), '', false, null, 'checkout' ) as $stored ) {
			Functions\when( 'jetpack_boost_ds_get' )->justReturn( $stored );
			$this->assertFalse(
				$this->invoke_is_current_request_excluded(),
				'Unusable stored value should never exclude: ' . var_export( $stored, true )
			);
		}
	}

	/**
	 * Verifies register_data_sync() registers the render_blocking_js_excludes entry.
	 *
	 * Data_Sync is a final class, so it cannot be mocked; use a real instance and
	 * assert the entry landed in its registry. Stub the two WordPress helpers the
	 * registry touches so this runs in the WordPress-free unit suite.
	 */
	public function test_register_data_sync_registers_excludes_entry() {
		Functions\when( 'sanitize_key' )->returnArg();
		Functions\when( 'add_action' )->justReturn( true );

		$data_sync = new \Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync( 'jetpack_boost_ds' );
		$this->instance->register_data_sync( $data_sync );

		$this->assertNotFalse(
			$data_sync->get_registry()->get_entry( 'render_blocking_js_excludes' ),
			'register_data_sync() should register the render_blocking_js_excludes entry.'
		);
	}

	/**
	 * Verifies get_change_output_action_names() returns the option hooks that
	 * bust the page cache when the exclusion list changes. Both add_option_ (first
	 * save, when the option is created) and update_option_ (every later save) are
	 * load-bearing: a typo or omission silently breaks cache invalidation.
	 */
	public function test_get_change_output_action_names() {
		if ( ! defined( 'JETPACK_BOOST_DATASYNC_NAMESPACE' ) ) {
			define( 'JETPACK_BOOST_DATASYNC_NAMESPACE', 'jetpack_boost_ds' );
		}

		$option = JETPACK_BOOST_DATASYNC_NAMESPACE . '_render_blocking_js_excludes';
		$this->assertSame(
			array(
				'add_option_' . $option,
				'update_option_' . $option,
			),
			Render_Blocking_JS::get_change_output_action_names()
		);
	}

	/**
	 * On a subdirectory install the request URI carries the subdirectory but
	 * user-entered patterns generally do not. Patterns must still match once both
	 * sides are normalized relative to the home directory.
	 */
	public function test_is_url_excluded_on_subdirectory_install() {
		Functions\when( 'home_url' )->alias(
			function ( $path = '' ) {
				return 'http://example.com/blog' . $path;
			}
		);
		Functions\when( 'wp_parse_url' )->alias(
			function ( $url, $component = -1 ) {
				return parse_url( $url, $component ); // phpcs:ignore WordPress.WP.AlternativeFunctions.parse_url_parse_url
			}
		);

		$cases = array(
			'bare pattern matches under subdir'      => array( '/blog/checkout/', array( 'checkout' ), true ),
			'pattern including subdir still matches' => array( '/blog/checkout/', array( '/blog/checkout' ), true ),
			'full URL pattern matches under subdir'  => array( '/blog/checkout/', array( 'http://example.com/blog/checkout' ), true ),
			'wildcard matches under subdir'          => array( '/blog/gallery/holiday/', array( 'gallery/(.*)' ), true ),
			'home root matches root pattern'         => array( '/blog/', array( '/' ), true ),
			'no false match on a different page'     => array( '/blog/about/', array( 'checkout' ), false ),
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
	 * When PCRE cannot fully evaluate a pattern (e.g. it exhausts the backtrack
	 * limit), preg_match() returns false. The exclusion must be honoured as a
	 * match rather than silently skipped. The backtrack limit is dropped to 1 to
	 * force that error deterministically; the possessive wildcard split is
	 * unaffected, so only the match itself errors.
	 */
	public function test_pattern_that_exceeds_backtrack_limit_is_treated_as_match() {
		$this->stub_url_functions();

		$original_limit = ini_get( 'pcre.backtrack_limit' );
		ini_set( 'pcre.backtrack_limit', '1' ); // phpcs:ignore WordPress.PHP.IniSet.Risky -- Restored below; forces a backtrack-limit error deterministically.

		try {
			$patterns = array( 'gallery/*' );
			$path     = '/gallery/' . str_repeat( 'a', 50 );

			$this->assertTrue(
				Render_Blocking_JS::is_url_excluded( $path, $patterns ),
				'A pattern that exhausts the PCRE backtrack limit should be treated as a match.'
			);
		} finally {
			ini_set( 'pcre.backtrack_limit', false === $original_limit ? '1000000' : $original_limit ); // phpcs:ignore WordPress.PHP.IniSet.Risky -- Restore original limit.
		}
	}

	/**
	 * Invoke the private is_current_request_excluded() method under test.
	 *
	 * @return bool
	 */
	private function invoke_is_current_request_excluded() {
		$method = new \ReflectionMethod( $this->instance, 'is_current_request_excluded' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		return $method->invoke( $this->instance );
	}
}
