<?php
/**
 * Tests for the Render_Blocking_JS insertion behavior: the moved scripts must
 * be inserted at the document's real closing body tag — never at a literal
 * '</body>' inside script source, a textarea, a comment or an attribute value
 * (BOOST-585) — and appended at the end of the buffer when it holds no
 * trustworthy closing tag.
 *
 * Runs in the with-wordpress suite: the insertion point is located with
 * core's WP_HTML_Tag_Processor, which the WordPress-free unit suite does not
 * load. The is_opened_script() and URL-exclusion tests live in the unit
 * suite's Render_Blocking_JS_Test.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Modules\Optimizations\Render_Blocking_JS;

use Automattic\Jetpack_Boost\Lib\Output_Filter;
use Automattic\Jetpack_Boost\Modules\Optimizations\Render_Blocking_JS\Render_Blocking_JS;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Class Render_Blocking_JS_Insertion_Test
 */
class Render_Blocking_JS_Insertion_Test extends BaseTestCase {

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
	public function set_up() {
		parent::set_up();

		$this->base_ob_level = ob_get_level();

		$this->instance = new Render_Blocking_JS();

		// Set the private properties the ignore-attribute handling depends on.
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
	public function tear_down() {
		// Close any output buffers a test left open so they cannot leak between tests.
		while ( ob_get_level() > $this->base_ob_level ) {
			ob_end_clean();
		}

		parent::tear_down();
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
	 * The reported BOOST-585 shape: an ignored, position-pinned script whose
	 * document.write() payload holds a literal '</body>'. The shipped code
	 * spliced the moved bundle into that string — corrupting the script — and
	 * inserted a copy at every occurrence of the byte sequence.
	 */
	public function test_literal_body_close_in_ignored_script_is_not_an_insertion_point() {
		$decoy = '<script data-jetpack-boost="ignore">document.write("<div></body></div>");</script>';
		$html  = '<html><body><p>Before</p>' . $decoy .
			'<script>console.log("movable sibling");</script>' .
			'<p>After</p></body></html>';

		$output = $this->filter_output( $html );

		// The decoy survives byte-for-byte, the bundle exists exactly once, and
		// it sits at the document's own closing tag.
		$this->assertStringContainsString( $decoy, $output );
		$this->assertSame( 1, substr_count( $output, 'movable sibling' ) );
		$this->assertStringContainsString( 'console.log("movable sibling");</script></body></html>', $output );
	}

	/**
	 * A literal '</body>' in non-markup content is never the insertion point.
	 * Each decoy sits before the document's real closing tag, which must
	 * receive the moved bundle instead.
	 *
	 * @param string $decoy Markup holding a literal '</body>' as content.
	 * @dataProvider provide_content_decoys
	 */
	#[DataProvider( 'provide_content_decoys' )]
	public function test_literal_body_close_in_content_is_not_an_insertion_point( $decoy ) {
		$html = '<html><body><p>Before</p>' . $decoy .
			'<script>console.log("movable sibling");</script>' .
			'<p>After</p></body></html>';

		$output = $this->filter_output( $html );

		$this->assertStringContainsString( $decoy, $output );
		$this->assertSame( 1, substr_count( $output, 'movable sibling' ) );
		$this->assertStringContainsString( 'console.log("movable sibling");</script></body></html>', $output );
	}

	/**
	 * Places a literal '</body>' can sit without being markup. Raw text and
	 * RCDATA elements, both comment forms, attribute values, and containers
	 * whose content is never the rendered body (template, noscript, foreign
	 * content).
	 */
	public static function provide_content_decoys() {
		return array(
			'textarea'         => array( '<textarea>pasted </body> sample</textarea>' ),
			'title'            => array( '<title>a </body> b</title>' ),
			'style'            => array( '<style>/* </body> */</style>' ),
			'comment'          => array( '<!-- </body> -->' ),
			'end-bang comment' => array( '<!-- </body> --!>' ),
			'attribute value'  => array( '<div data-content="</body>">x</div>' ),
			'template content' => array( '<template></body></template>' ),
			'noscript content' => array( '<noscript></body></noscript>' ),
			'svg description'  => array( '<svg><desc></body></desc></svg>' ),
			'iframe fallback'  => array( '<iframe src="about:blank"></body></iframe>' ),
		);
	}

	/**
	 * A literal '</body>' in trailing output — after the document's own
	 * closing tags — must not draw the bundle past the document. The walk
	 * stops at the closing html tag once a candidate exists.
	 *
	 * @param string $trailing Trailing output holding a literal '</body>'.
	 * @dataProvider provide_trailing_decoys
	 */
	#[DataProvider( 'provide_trailing_decoys' )]
	public function test_literal_body_close_in_trailing_output_is_not_an_insertion_point( $trailing ) {
		$html = '<html><body><p>Before</p>' .
			'<script>console.log("movable sibling");</script>' .
			'<p>After</p></body></html>' . $trailing;

		$output = $this->filter_output( $html );

		$this->assertStringContainsString( $trailing, $output );
		$this->assertSame( 1, substr_count( $output, 'movable sibling' ) );
		$this->assertStringContainsString( 'console.log("movable sibling");</script></body></html>', $output );
	}

	/**
	 * Trailing output a host, cache or analytics plugin can emit after the
	 * document.
	 */
	public static function provide_trailing_decoys() {
		return array(
			'comment'        => array( '<!-- cache: </body> -->' ),
			'ignored script' => array( '<script data-jetpack-boost="ignore">var s = "</body>";</script>' ),
		);
	}

	/**
	 * The trailing slot between the closing body and html tags is part of the
	 * document; a decoy there must not draw the bundle either.
	 */
	public function test_literal_body_close_between_body_and_html_close_is_not_an_insertion_point() {
		$html = '<html><body><p>Before</p>' .
			'<script>console.log("movable sibling");</script>' .
			'<p>After</p></body><!-- </body> --></html>';

		$output = $this->filter_output( $html );

		$this->assertStringContainsString( '<!-- </body> -->', $output );
		$this->assertSame( 1, substr_count( $output, 'movable sibling' ) );
		$this->assertStringContainsString( 'console.log("movable sibling");</script></body><!-- </body> --></html>', $output );
	}

	/**
	 * Closing tags a browser accepts but a byte comparison does not:
	 * uppercase, whitespace before the '>', attributes on the closer. The
	 * shipped code appended after the document on these; the tokenizer finds
	 * them.
	 *
	 * @param string $close Closing body tag variant.
	 * @dataProvider provide_closing_tag_variants
	 */
	#[DataProvider( 'provide_closing_tag_variants' )]
	public function test_closing_tag_variants_are_found( $close ) {
		$html = '<html><body><p>Before</p>' .
			'<script>console.log("movable sibling");</script>' .
			'<p>After</p>' . $close . '</html>';

		$output = $this->filter_output( $html );

		$this->assertSame( 1, substr_count( $output, 'movable sibling' ) );
		$this->assertStringContainsString( 'console.log("movable sibling");</script>' . $close, $output );
	}

	/**
	 * Closing body tag spellings a browser accepts.
	 */
	public static function provide_closing_tag_variants() {
		return array(
			'uppercase'  => array( '</BODY>' ),
			'whitespace' => array( "</body\n>" ),
			'attribute'  => array( '</body data-x="y">' ),
		);
	}

	/**
	 * An unterminated raw-text region in trailing output runs to the end of
	 * the file in a browser; the bundle must not land inside it while the
	 * document's own closing tag is available before it.
	 */
	public function test_unterminated_trailing_region_is_not_an_insertion_point() {
		$html = '<html><body><p>Before</p>' .
			'<script>console.log("movable sibling");</script>' .
			'<p>After</p></body></html><textarea>pasted </body> sample';

		$output = $this->filter_output( $html );

		$this->assertSame( 1, substr_count( $output, 'movable sibling' ) );
		$this->assertStringContainsString( 'console.log("movable sibling");</script></body></html>', $output );
	}

	/**
	 * A buffer whose only '</body>' bytes sit inside an unterminated region
	 * has no trustworthy closing tag; the bundle is appended at the end
	 * rather than spliced into content.
	 */
	public function test_buffer_without_a_trustworthy_closing_tag_appends() {
		$html = '<p>Before</p>' .
			'<script>console.log("movable sibling");</script>' .
			'<textarea>pasted </body> sample';

		$output = $this->filter_output( $html );

		$this->assertSame( 1, substr_count( $output, 'movable sibling' ) );
		$this->assertStringEndsWith( 'console.log("movable sibling");</script>', $output );
	}

	/**
	 * Drive the BOOST-585 page through the real Output_Filter, so the window
	 * handed to append_script_tags() is produced by ob_start()'s chunking
	 * rather than by hand.
	 */
	public function test_boost_585_shape_through_the_real_output_filter() {
		$page = '<html><body><p>Before</p>' .
			'<script>document.write("<div></body></div>");</script>' .
			'<script>console.log("movable sibling");</script>' .
			str_repeat( '<p>filler paragraph</p>', 400 ) .
			'<p>After</p></body></html>';

		add_filter( 'jetpack_boost_output_filtering_last_buffer', array( $this->instance, 'append_script_tags' ) );

		$output = '';
		try {
			$output_filter = new Output_Filter();

			ob_start();
			$output_filter->add_callback( array( $this->instance, 'handle_output_stream' ) );
			foreach ( str_split( $page, 512 ) as $piece ) {
				echo $piece; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Test fixture markup.
			}
			ob_end_flush();
			$output = (string) ob_get_clean();
		} finally {
			remove_filter( 'jetpack_boost_output_filtering_last_buffer', array( $this->instance, 'append_script_tags' ) );
		}

		// The document.write script is pinned in place (auto-ignored) and intact.
		$this->assertStringContainsString( 'document.write("<div></body></div>");', $output );
		// The movable script exists exactly once, at the document's closing tag.
		$this->assertSame( 1, substr_count( $output, 'movable sibling' ) );
		$this->assertStringContainsString( 'console.log("movable sibling");</script></body></html>', $output );
	}
}
