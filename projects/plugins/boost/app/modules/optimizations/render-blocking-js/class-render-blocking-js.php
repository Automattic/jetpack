<?php
/**
 * Implements the system to avoid render blocking JS execution.
 *
 * @link       https://automattic.com
 * @since      0.2
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Render_Blocking_JS;

use Automattic\Jetpack\Schema\Schema;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Changes_Output_After_Activation;
use Automattic\Jetpack_Boost\Contracts\Changes_Output_On_Activation;
use Automattic\Jetpack_Boost\Contracts\Feature;
use Automattic\Jetpack_Boost\Contracts\Has_Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Optimization;
use Automattic\Jetpack_Boost\Data_Sync\Minify_Excludes_State_Entry;
use Automattic\Jetpack_Boost\Lib\Output_Filter;

/**
 * Class Render_Blocking_JS
 */
class Render_Blocking_JS implements Feature, Changes_Output_On_Activation, Changes_Output_After_Activation, Optimization, Has_Data_Sync {
	/**
	 * Substring that marks an inline script as producing position-dependent
	 * output (document.write()/document.writeln()). Such scripts must stay where
	 * they are rather than being moved to the end of the document. The fast-path
	 * guard and the per-script check must use the same needle to stay in lockstep.
	 *
	 * @var string
	 */
	private const POSITION_DEPENDENT_OUTPUT_NEEDLE = 'document.write';

	/**
	 * How many unclosed raw-text opening tags a buffer may hold before the search
	 * for the closing body tag is abandoned.
	 *
	 * Every one of them makes the mask scan to the end of the buffer, so the work
	 * grows with their count times its length. A document has legitimate use for
	 * at most the one an already-flushed chunk can strand; the rest of this budget
	 * is slack, not an expectation.
	 *
	 * @var int
	 */
	private const MAX_UNCLOSED_RAW_TEXT_OPENERS = 8;

	/**
	 * Holds the script tags removed from the output buffer.
	 *
	 * @var array
	 */
	protected $buffered_script_tags = array();

	/**
	 * HTML attribute name to be added to <script> tag to make it
	 * ignored by this class.
	 *
	 * @var string|null
	 */
	private $ignore_attribute;

	/**
	 * HTML attribute value to be added to <script> tag to make it
	 * ignored by this class.
	 *
	 * @var string
	 */
	private $ignore_value = 'ignore';

	/**
	 * Utility class that supports output filtering.
	 *
	 * @var Output_Filter
	 */
	private $output_filter = null;

	/**
	 * Flag indicating an opened <script> tag in output.
	 *
	 * @var string
	 */
	private $is_opened_script = false;

	public function setup() {
		$this->output_filter = new Output_Filter();

		/**
		 * Filters the ignore attribute
		 *
		 * @param $string $ignore_attribute The string used to ignore elements of the page.
		 *
		 * @since   1.0.0
		 */
		$this->ignore_attribute = apply_filters( 'jetpack_boost_render_blocking_js_ignore_attribute', 'data-jetpack-boost' );

		add_action( 'template_redirect', array( $this, 'start_output_filtering' ), -999999 );

		/**
		 * Shortcodes can sometimes output script to embed widget. It's safer to ignore them.
		 */
		add_filter( 'do_shortcode_tag', array( $this, 'add_ignore_attribute' ) );
	}

	public static function is_available() {
		return true;
	}

	/**
	 * Register the data sync entry holding the list of URL patterns
	 * excluded from JS deferring.
	 *
	 * @param Data_Sync $instance The data sync instance.
	 */
	public function register_data_sync( Data_Sync $instance ) {
		$instance->register(
			'render_blocking_js_excludes',
			Schema::as_array( Schema::as_string() )->fallback( array() ),
			new Minify_Excludes_State_Entry( 'render_blocking_js_excludes' )
		);
	}

	/**
	 * Cached pages need to be invalidated when the exclusion list changes.
	 *
	 * @return string[] Action names fired when the exclusion list is updated.
	 */
	public static function get_change_output_action_names() {
		$option = JETPACK_BOOST_DATASYNC_NAMESPACE . '_render_blocking_js_excludes';

		// `add_option_*` covers the very first save, when the option is created
		// rather than updated, so the cache is invalidated on that write too.
		return array(
			'add_option_' . $option,
			'update_option_' . $option,
		);
	}

	/**
	 * Set up an output filtering callback.
	 *
	 * @return void
	 */
	public function start_output_filtering() {
		/**
		 * We're doing heavy output filtering in this module
		 * by using output buffering.
		 *
		 * Here are a few scenarios when we shouldn't do it:
		 */

		/**
		 * Filter to disable defer blocking JS
		 *
		 * @param bool $defer return false to disable defer blocking
		 *
		 * @since   1.0.0
		 */
		if ( false === apply_filters( 'jetpack_boost_should_defer_js', '__return_true' ) ) {
			return;
		}

		// Disable in robots.txt.
		if ( isset( $_SERVER['REQUEST_URI'] ) && strpos( home_url( wp_unslash( $_SERVER['REQUEST_URI'] ) ), 'robots.txt' ) !== false ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.
			return;
		}

		// Disable in other possible AJAX requests setting cors related header.
		if ( isset( $_SERVER['HTTP_SEC_FETCH_MODE'] ) && 'cors' === strtolower( $_SERVER['HTTP_SEC_FETCH_MODE'] ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- This is validating.
			return;
		}

		// Disable in other possible AJAX requests setting XHR related header.
		if ( isset( $_SERVER['HTTP_X_REQUESTED_WITH'] ) && 'xmlhttprequest' === strtolower( $_SERVER['HTTP_X_REQUESTED_WITH'] ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- This is validating.
			return;
		}

		// Disable in all XLS (see the WP_Sitemaps_Renderer class which is responsible for rendering Sitemaps data to XML
		// in accordance with sitemap protocol).
		if ( isset( $_SERVER['REQUEST_URI'] ) &&
			(
				// phpcs:disable WordPress.Security.ValidatedSanitizedInput -- This is validating.
				str_contains( $_SERVER['REQUEST_URI'], '.xsl' ) ||
				str_contains( $_SERVER['REQUEST_URI'], 'sitemap-stylesheet=index' ) ||
				str_contains( $_SERVER['REQUEST_URI'], 'sitemap-stylesheet=sitemap' )
				// phpcs:enable WordPress.Security.ValidatedSanitizedInput
			) ) {
			return;
		}

		// Disable in all POST Requests.
		// phpcs:disable WordPress.Security.NonceVerification.Missing
		if ( ! empty( $_POST ) ) {
			return;
		}

		// Disable in customizer previews
		if ( is_customize_preview() ) {
			return;
		}

		// Disable in feeds, AJAX, Cron, XML.
		if ( is_feed() || wp_doing_ajax() || wp_doing_cron() || wp_is_xml_request() ) {
			return;
		}

		// Disable in sitemaps.
		if ( ! empty( get_query_var( 'sitemap' ) ) ) {
			return;
		}

		// Disable in AMP pages.
		if ( function_exists( 'amp_is_request' ) && amp_is_request() ) {
			return;
		}

		// Disable on URLs excluded by the user.
		if ( $this->is_current_request_excluded() ) {
			// Leave the page output completely untouched, as if the module was off.
			remove_filter( 'do_shortcode_tag', array( $this, 'add_ignore_attribute' ) );
			return;
		}

		// Print the filtered script tags to the very end of the page.
		add_filter( 'jetpack_boost_output_filtering_last_buffer', array( $this, 'append_script_tags' ), 10, 1 );

		// Handle exclusions.
		add_filter( 'script_loader_tag', array( $this, 'handle_exclusions' ), 10, 2 );

		$this->output_filter->add_callback( array( $this, 'handle_output_stream' ) );
	}

	/**
	 * Remove all inline and external <script> tags from the default output.
	 *
	 * @param string $buffer_start First part of the buffer.
	 * @param string $buffer_end   Second part of the buffer.
	 *
	 * For explanation on why there are two parts of a buffer here, see
	 * the comments and examples in the Output_Filter class.
	 *
	 * @return array Parts of the buffer.
	 */
	public function handle_output_stream( $buffer_start, $buffer_end ) {
		$joint_buffer = $this->ignore_exclusion_scripts( $buffer_start . $buffer_end );
		$script_tags  = $this->get_script_tags( $joint_buffer );

		if ( ! $script_tags ) {
			if ( $this->is_opened_script ) {
				// We have an opened script tag, move everything to the second buffer to avoid printing it to the page.
				// We will do this until the </script> closing tag is encountered.
				return array( '', $joint_buffer );
			}

			// No script tags detected, return both chunks unaltered.
			return array( $buffer_start, $buffer_end );
		}

		// Makes sure all whole <script>...</script> tags are in $buffer_start.
		list( $buffer_start, $buffer_end ) = $this->recalculate_buffer_split( $joint_buffer, $script_tags );

		foreach ( $script_tags as $script_tag ) {
			$this->buffered_script_tags[] = $script_tag[0];
			$buffer_start                 = str_replace( $script_tag[0], '', $buffer_start );
		}

		// Detect a lingering opened script.
		$this->is_opened_script = $this->is_opened_script( $buffer_start . $buffer_end );

		return array( $buffer_start, $buffer_end );
	}

	/**
	 * Matches <script> tags with their content in a string buffer.
	 *
	 * @param string $buffer Captured piece of output buffer.
	 *
	 * @return array
	 */
	protected function get_script_tags( $buffer ) {
		$regex = '~<script' . $this->ignore_attribute_lookahead() . '([^>]*)>[\s\S]*?<\/script>~si';
		preg_match_all( $regex, $buffer, $script_tags, PREG_OFFSET_CAPTURE );

		// No script_tags in the joint buffer.
		if ( empty( $script_tags[0] ) ) {
			return array();
		}

		/**
		 * Filter to remove any scripts that should not be moved to the end of the document.
		 *
		 * @param array $script_tags array of script tags. Remove any scripts that should not be moved to the end of the documents.
		 *
		 * @since   1.0.0
		 */
		return apply_filters( 'jetpack_boost_render_blocking_js_exclude_scripts', $script_tags[0] );
	}

	/**
	 * Adds the ignore attribute to scripts in the exclusion list.
	 *
	 * @param string $buffer Captured piece of output buffer.
	 *
	 * @return string
	 */
	protected function ignore_exclusion_scripts( $buffer ) {
		$exclusions = array(
			// Scripts inside HTML comments.
			'~<!--.*?-->~si',

			// Scripts with types that do not execute complex code. Moving them down can be dangerous
			// and does not benefit performance. Includes types: application/json, application/ld+json and importmap.
			'~<script\s+[^\>]*type=(?<q>["\']*)(application\/(ld\+)?json|importmap)\k<q>.*?>.*?<\/script>~si',
		);

		$excluded = preg_replace_callback(
			$exclusions,
			function ( $script_match ) {
				return $this->add_ignore_attribute( $script_match[0] );
			},
			$buffer
		);
		// preg_replace_callback() returns null on PCRE failure; keep the original
		// buffer in that case rather than propagating null downstream.
		if ( null !== $excluded ) {
			$buffer = $excluded;
		}

		return $this->pin_position_dependent_scripts( $buffer );
	}

	/**
	 * Keep inline scripts whose output is position-dependent in their original place.
	 *
	 * Scripts using document.write()/document.writeln() insert markup at the script's
	 * location, so moving such a script to the end of the document renders its output
	 * after the footer instead of inside the content (e.g. a Custom HTML block).
	 * Marking the script with the ignore attribute keeps the rest of the pipeline
	 * from moving it. Scripts that already carry the ignore attribute are skipped so
	 * their behavior and markup are unchanged.
	 *
	 * Best-effort and deliberately conservative: it pins the common case (an inline
	 * script that calls document.write) and otherwise leaves the script to the
	 * default move behavior. It does not pin scripts that write their own
	 * '<script ...>' markup (no safe in-place edit exists), nor exotic call forms a
	 * substring check cannot see. A miss never corrupts the page — worst case is a
	 * script that still moves, exactly as it does without this method.
	 *
	 * @param string $buffer Captured piece of output buffer.
	 *
	 * @return string
	 */
	private function pin_position_dependent_scripts( $buffer ) {
		// Fast path: skip the inline-script scan entirely when the buffer cannot
		// contain a position-dependent script.
		if ( false === stripos( $buffer, self::POSITION_DEPENDENT_OUTPUT_NEEDLE ) ) {
			return $buffer;
		}

		// Match inline scripts only (no src attribute) that do not already carry
		// the ignore attribute. This runs on the buffer Output_Filter hands us
		// (a bounded window), not a whole page; the lazy [\s\S]*? would be
		// superlinear on a multi-megabyte single buffer, so keep it window-scoped.
		$inline_script_regex = '~<script\b(?![^>]*\ssrc\s*=)' . $this->ignore_attribute_lookahead() . '[^>]*>[\s\S]*?</script>~i';

		$result = preg_replace_callback(
			$inline_script_regex,
			function ( $script_match ) {
				// Intentionally conservative: a simple case-insensitive substring check
				// for "document.write" (which also covers "document.writeln"). It does
				// not parse JS, so exotic call forms it cannot see — document['write'](),
				// "document . write()", or an uppercase <SCRIPT> tag that
				// add_ignore_attribute()'s lowercase replace won't touch — simply fall
				// back to the default behavior (the script is moved, as it is today).
				// That is the safe direction: a miss never corrupts the page.
				if ( false === stripos( $script_match[0], self::POSITION_DEPENDENT_OUTPUT_NEEDLE ) ) {
					return $script_match[0];
				}

				// Do not touch a script that writes its own '<script ...>' markup. There
				// is no safe in-place edit for it: add_ignore_attribute() does a global
				// str_replace() on '<script', which rewrites the inner literal and can
				// break the quoting of the string the script writes; tagging only the
				// outer tag would instead let get_script_tags() match and move that inner
				// literal. Such scripts keep the default behavior rather than risk
				// corrupting the page.
				if ( substr_count( strtolower( $script_match[0] ), '<script' ) > 1 ) {
					return $script_match[0];
				}

				return $this->add_ignore_attribute( $script_match[0] );
			},
			$buffer
		);

		// preg_replace_callback() returns null on PCRE failure (e.g. backtrack limit
		// on a pathological buffer); fall back to the unmodified buffer so the page is
		// never blanked. Mirrors the guard in is_opened_script().
		return null === $result ? $buffer : $result;
	}

	/**
	 * Negative lookahead asserting a <script> tag does not already carry the
	 * ignore attribute. Shared by the regexes that select movable scripts so the
	 * attribute-matching rule lives in one place.
	 *
	 * @return string Regex fragment (uses named group "q"; safe to use once per pattern).
	 */
	private function ignore_attribute_lookahead() {
		return sprintf(
			'(?![^>]*%s=(?<q>["\']*)%s\k<q>)',
			preg_quote( $this->ignore_attribute, '~' ),
			preg_quote( $this->ignore_value, '~' )
		);
	}

	/**
	 * Splits the buffer into two parts.
	 *
	 * First part contains all whole <script> tags, the second part
	 * contains the rest of the buffer.
	 *
	 * @param string $buffer      Captured piece of output buffer.
	 * @param array  $script_tags Matched <script> tags.
	 *
	 * @return array
	 */
	protected function recalculate_buffer_split( $buffer, $script_tags ) {
		$last_script_tag_index        = count( $script_tags ) - 1;
		$last_script_tag_end_position = strrpos( $buffer, $script_tags[ $last_script_tag_index ][0] ) + strlen( $script_tags[ $last_script_tag_index ][0] );

		// Bundle all script tags into the first buffer.
		$buffer_start = substr( $buffer, 0, $last_script_tag_end_position );

		// Leave the rest of the data in the second buffer.
		$buffer_end = substr( $buffer, $last_script_tag_end_position );

		return array( $buffer_start, $buffer_end );
	}

	/**
	 * Insert the buffered script tags just before the body tag if possible in the last buffer
	 * otherwise append it at the end.
	 *
	 * @param string $buffer String buffer.
	 *
	 * @return string
	 */
	public function append_script_tags( $buffer ) {
		$script_tags = implode( '', $this->buffered_script_tags );
		// Reset tags in case there's another buffer after this one.
		$this->buffered_script_tags = array();

		// Nothing to insert: both branches below are identity operations, so skip
		// the buffer scan entirely. Any other feature registering an Output_Filter
		// on the same global hook — Lcp does — calls this a second time per request.
		if ( '' === $script_tags ) {
			return $buffer;
		}

		$position = $this->find_body_close_position( $buffer );
		if ( null === $position ) {
			return $buffer . $script_tags;
		}

		return substr_replace( $buffer, $script_tags, $position, 0 );
	}

	/**
	 * Locate the document's real closing </body> tag in the buffer.
	 *
	 * A literal '</body>' can legitimately appear in places that are not markup:
	 * inside a script's source (e.g. an HTML string a document.write() call later
	 * emits), inside a <textarea> (RCDATA), inside <style> or <title>, inside an
	 * HTML comment, or inside a quoted attribute value. Inserting the moved
	 * <script> tags at such an occurrence corrupts the page — the injected
	 * '</script>' closes the surrounding script early and the remaining
	 * JavaScript renders as visible text.
	 *
	 * Those regions are therefore blanked out before the search. The mask replaces
	 * each region with the same number of spaces so offsets remain valid for the
	 * original buffer. The search is then bounded to the document itself (anything
	 * a host or plugin emits after '</html>' can never be the closing tag) and
	 * takes the last remaining occurrence.
	 *
	 * Best-effort: this is a mask over a bounded output-buffer window, not an HTML
	 * parser, and it does not model every context in which a literal '</body>' is
	 * not markup. Where it cannot resolve a buffer it returns null, which makes
	 * append_script_tags() append after the buffer instead of rewriting existing
	 * markup. Null is the intended outcome for anything unresolved, but it is not
	 * a proof of correctness on either side. A shape the mask models wrongly can
	 * still yield an offset that is not the document's closing tag — see
	 * unmasked_regions() for the backstop covering the known such shapes — and
	 * appending is only an executable fallback for a document whose tokenizer
	 * state at the end of the buffer accepts markup. It is not one after an
	 * unterminated <plaintext>, whose state runs to end of file by definition.
	 *
	 * @param string $buffer String buffer.
	 *
	 * @return int|null Byte offset of the closing tag, or null when the buffer has none.
	 */
	private function find_body_close_position( $buffer ) {
		// mbstring.func_overload (PHP 7.x only, removed in 8.0) rebinds strlen(),
		// strpos() and substr() to their multibyte counterparts. Everything below
		// is byte arithmetic — same-length filler, and an offset handed to
		// substr_replace() — so on such a host no position can be trusted.
		// phpcs:ignore PHPCompatibility.IniDirectives.RemovedIniDirectives.mbstring_func_overloadDeprecated,PHPCompatibility.IniDirectives.RemovedIniDirectives.mbstring_func_overloadDeprecatedRemoved -- Read, not set: the directive being deprecated and then removed on the supported range is exactly why this check exists.
		if ( 2 & (int) ini_get( 'mbstring.func_overload' ) ) {
			return null;
		}

		// Fast path: no closing tag to find, so skip masking a whole buffer copy.
		if ( false === strpos( $buffer, '</body>' ) ) {
			return null;
		}

		// Each raw-text arm of the mask below is lazy and unanchored, so an opening
		// tag with no closing tag costs a scan to the end of the buffer, and the
		// engine retries that at every such opener. A document has no reason to hold
		// more than the one the sliding window can strand, but page content is
		// author-controlled and some of it (a post title, say) reaches the front end
		// through KSES, so the count is capped rather than trusted.
		if ( $this->unclosed_raw_text_openers( $buffer ) > self::MAX_UNCLOSED_RAW_TEXT_OPENERS ) {
			return null;
		}

		// One pass over the buffer. The arms are, in order: the element types whose
		// contents are raw text or RCDATA rather than markup; the spec's comment
		// forms, including the empty comments ('<!-->', '<!--->') and the end-bang
		// close ('--!>') — without those a comment would be masked as running to the
		// next '-->' further down the document; and, last, any opening tag, which
		// covers the quoted attribute values that are the remaining place a literal
		// '</body>' can sit inside otherwise ordinary markup.
		//
		// The opening-tag arm is deliberately last and deliberately anchored to a
		// tag: an earlier arm wins at the same offset, so a raw-text element's own
		// opening tag never shadows its body, and an unbalanced quote in ordinary
		// prose cannot start an attribute-value match that runs to the next quote
		// anywhere else in the buffer.
		$masked = preg_replace_callback(
			$this->non_markup_mask(),
			static function ( $region_match ) {
				// The opening-tag arm keeps its '<' and element name and blanks only
				// what follows, so is_inside_unmasked_region() below can still tell
				// which elements the surviving markup opened. Every other arm blanks
				// wholesale, which is what keeps an element name inside a script, a
				// comment or an attribute value from being read as markup.
				if ( isset( $region_match[1] ) && '' !== $region_match[1] ) {
					return $region_match[1] . str_repeat( ' ', strlen( $region_match[0] ) - strlen( $region_match[1] ) );
				}

				return str_repeat( ' ', strlen( $region_match[0] ) );
			},
			$buffer
		);

		// preg_replace_callback() returns null on PCRE failure (e.g. backtrack limit
		// on a pathological buffer). Fail closed: without the mask there is no way to
		// tell a real closing tag from a literal inside a script, so report no
		// position and let the caller append after the buffer instead.
		if ( null === $masked ) {
			return null;
		}

		// Resolve a region whose opening tag was flushed in an earlier chunk. Its
		// end is a floor for everything below: nothing before it is markup, and the
		// bound has to start its search there too, because such a region's contents
		// can hold a literal '</html>' that would otherwise truncate the document.
		$floor = $this->leading_region_end( $masked );
		if ( null === $floor ) {
			return null;
		}

		// Markup emitted after the document is not part of it. Bounding the search
		// here keeps a literal '</body>' in trailing host or plugin output — in a
		// plain text node, or in one of the raw-text elements the mask does not
		// list — from winning the search below. Matched with the same tolerance the
		// mask's arms use: neither a single '</HTML>' nor a '</html >' may silently
		// drop the bound.
		$bound = preg_match( '~</html' . $this->close_tag_tail() . '~i', $masked, $match, PREG_OFFSET_CAPTURE, $floor );
		if ( false === $bound ) {
			return null;
		}
		if ( 1 === $bound ) {
			$masked = substr( $masked, 0, $match[0][1] );
		}

		// Spans of the element contents the mask cannot blank, collected once so the
		// walk below can reject a candidate without rescanning the buffer per try.
		$regions = $this->unmasked_regions( $masked );
		if ( null === $regions ) {
			return null;
		}

		// Take the last occurrence, then keep walking left past any that falls
		// inside one of those spans. Rejecting one candidate says nothing about the
		// one before it, and on trailing output holding a decoy — a closed <iframe>
		// or <template> after the document's own closing tag — the next candidate
		// left is the document's own. A retry can only move the answer towards the
		// start of the buffer, and every candidate it reaches is checked the same
		// way, so this cannot turn an append into a wrong offset.
		$position = strrpos( $masked, '</body>' );
		while ( false !== $position ) {
			if ( ! $this->offset_in_regions( $regions, $position ) ) {
				return $position;
			}

			if ( 0 === $position ) {
				break;
			}

			$position = strrpos( $masked, '</body>', $position - 1 - strlen( $masked ) );
		}

		return null;
	}

	/**
	 * Count the raw-text opening tags in a buffer that have no closing tag.
	 *
	 * Both scans are literal alternations with no quantifier, so this is linear in
	 * the buffer regardless of how the tags pair up. A window whose region opened
	 * in an already-flushed chunk can report a negative count; only the positive
	 * direction is of interest here.
	 *
	 * @param string $buffer String buffer.
	 *
	 * @return int Number of opening tags left over, zero or more.
	 */
	private function unclosed_raw_text_openers( $buffer ) {
		$elements = implode( '|', $this->raw_text_elements() );

		$openers = preg_match_all( '~<(?:' . $elements . ')(?![\w-])~i', $buffer );
		$closers = preg_match_all( '~</(?:' . $elements . ')~i', $buffer );

		// Fail closed on PCRE failure by reporting a count over the cap.
		if ( false === $openers || false === $closers ) {
			return self::MAX_UNCLOSED_RAW_TEXT_OPENERS + 1;
		}

		return max( 0, $openers - $closers );
	}

	/**
	 * Element types whose contents the mask treats as raw text or RCDATA.
	 *
	 * Named in one place because both the mask and the leading-region scan need the
	 * same list, and they have drifted apart once already.
	 *
	 * @return string[]
	 */
	private function raw_text_elements() {
		return array( 'script', 'textarea', 'style', 'title' );
	}

	/**
	 * Regex fragment matching the tail of a closing tag, from the element name on.
	 *
	 * A browser ends a raw-text element on '</name' followed by whitespace, '/' or
	 * '>', so '</script foo>' and '</script/>' both close a script and the mask has
	 * to agree with that or it masks the wrong span.
	 *
	 * The whitespace bytes are spelled out rather than written '\s'. PCRE counts a
	 * vertical tab as whitespace and HTML does not, and reading '</iframe\x0b>' as
	 * a closing tag would end a region the browser is still inside.
	 *
	 * @return string
	 */
	private function close_tag_tail() {
		return '(?:[\x09\x0A\x0C\x0D\x20/][^>]*)?>';
	}

	/**
	 * Build the pattern that blanks every region a literal '</body>' can sit in.
	 *
	 * @return string
	 */
	private function non_markup_mask() {
		$arms = array();

		foreach ( $this->raw_text_elements() as $element ) {
			$arms[] = '<' . $element . '(?![\w-])[^>]*>[\s\S]*?</' . $element . $this->close_tag_tail();
		}

		$arms[] = '<!--(?:>|->|[\s\S]*?--!?>)';

		// Any opening tag, quoted attribute values included. The element name is
		// captured so the callback can preserve it. The alternatives inside the
		// repetition start with distinct characters, so there is no ambiguity for
		// the engine to backtrack through.
		$arms[] = '(<[a-zA-Z][^\s/>]*+)(?:"[^"]*"|\'[^\']*\'|[^>"\'])*>';

		return '~' . implode( '|', $arms ) . '~i';
	}

	/**
	 * Locate the end of a region whose opening tag was flushed before this buffer.
	 *
	 * Output_Filter hands this class a sliding window, so any of the regions the
	 * mask above pairs can begin in a chunk that was already flushed. Its opening
	 * tag is then absent and the mask cannot pair it, leaving the region's contents
	 * — and any literal '</body>' in them — looking like markup.
	 *
	 * A closing token left over after that mask is exactly that situation: a paired
	 * region would have been blanked wholesale, so what survives has no opening tag
	 * in this buffer. Everything up to and including that token is therefore region
	 * content and cannot hold the document's closing tag.
	 *
	 * Which region opened cannot be answered from the window alone, so the type of
	 * the leftover tokens is all there is to go on. Tokens of a single type resolve
	 * it: a region cannot contain its own closing token, so the first one ends it.
	 * Tokens of more than one type do not — a '</script>' pasted into a <textarea>
	 * is ordinary RCDATA, not the end of the region — and that case fails closed.
	 *
	 * Note that this reads a prefix of a window whose start is already unknown, so
	 * it can also fire on a literal token in an ordinary text node ('-->' in prose,
	 * say, or an unpaired closing tag in a cache footer). Discarding the prefix is
	 * only free while it holds no '</body>' of its own: a prefix that does hold one
	 * is either region content or a document this scan has misread, and nothing in
	 * the window distinguishes the two, so that case fails closed as well.
	 *
	 * @param string $masked Buffer with the paired regions already masked.
	 *
	 * @return int|null Offset just past the leading region, zero when there is no
	 *                  such region, or null when the scan failed or was inconclusive.
	 */
	private function leading_region_end( $masked ) {
		$pattern = '~</(?:' . implode( '|', $this->raw_text_elements() ) . ')' . $this->close_tag_tail() . '|--!?>~i';
		$found   = preg_match_all( $pattern, $masked, $matches, PREG_OFFSET_CAPTURE );

		// preg_match_all() returns false on PCRE failure and 0 when there is simply
		// no leftover closing token. Fail closed on the former, like the mask above:
		// an unresolved buffer must not be searched as though it were all markup.
		if ( false === $found ) {
			return null;
		}

		if ( 0 === $found ) {
			return 0;
		}

		// Read the type off the matched text rather than off a capture group: how
		// PCRE reports a group that did not take part differs by PHP version.
		$types = array();
		foreach ( $matches[0] as $token ) {
			$types[ $this->closing_token_type( $token[0] ) ] = true;
		}

		if ( count( $types ) > 1 ) {
			return null;
		}

		$region_end = $matches[0][0][1] + strlen( $matches[0][0][0] );

		$body_close = strpos( $masked, '</body>' );
		if ( false !== $body_close && $body_close < $region_end ) {
			return null;
		}

		return $region_end;
	}

	/**
	 * Name the region a leftover closing token would end.
	 *
	 * @param string $token Matched closing token.
	 *
	 * @return string Element name, or 'comment' for a comment close.
	 */
	private function closing_token_type( $token ) {
		$token = strtolower( $token );

		foreach ( $this->raw_text_elements() as $element ) {
			if ( 0 === strpos( $token, '</' . $element ) ) {
				return $element;
			}
		}

		return 'comment';
	}

	/**
	 * Element types whose contents a browser reads as raw text rather than markup,
	 * and which the mask therefore cannot pair.
	 *
	 * These are left out of the mask because pairing them from a window is
	 * unreliable, but their spans are still worth knowing: an offset landing inside
	 * one has to be discarded, since scripts inserted there would never run and the
	 * element's contents would be corrupted. <plaintext> is deliberately absent —
	 * it has no closing tag at any depth and is handled on its own below.
	 *
	 * @return string[]
	 */
	private function unmasked_raw_text_elements() {
		return array( 'xmp', 'noembed', 'noframes', 'noscript', 'iframe' );
	}

	/**
	 * Collect the spans of element contents the mask cannot blank.
	 *
	 * One ordered pass over every opening and closing token of interest, walked
	 * with the tokenizer's own rules rather than by pairing each opener with the
	 * next closer that matches it:
	 *
	 * - Inside a raw-text element nothing is markup, so only that element's own
	 *   closing tag ends it and any tag nested in it is text.
	 * - <template> is ordinary markup and does nest, so it is tracked by depth and
	 *   the span runs from the outermost opener to the matching close.
	 * - A region still open when the buffer ends runs to the end of it, which is
	 *   also what the '</html>' bound leaves behind when it cuts one short. This
	 *   is how <plaintext> is handled: no closing token for it is collected at
	 *   all, because the tokenizer state it opens has no exit before end of file.
	 *
	 * The previous shape of this check searched for a closing tag once per opener,
	 * which both cost a scan per opener and answered the nesting cases wrongly.
	 *
	 * @param string $masked Masked buffer, already bounded at '</html>'.
	 *
	 * @return array[]|null List of array( start, end ) offsets, or null on failure.
	 */
	private function unmasked_regions( $masked ) {
		$raw = implode( '|', $this->unmasked_raw_text_elements() );

		$found = preg_match_all(
			'~<(?:' . $raw . '|template|plaintext)(?![\w-])'
			. '|</(?:' . $raw . '|template)' . $this->close_tag_tail()
			. '|<!\[CDATA\[|\]\]>~i',
			$masked,
			$matches,
			PREG_OFFSET_CAPTURE
		);

		// Fail closed on PCRE failure, as everywhere else in this locator.
		if ( false === $found ) {
			return null;
		}

		$regions = array();
		$length  = strlen( $masked );
		$open    = null;
		$start   = 0;
		$depth   = 0;
		$nested  = 0;

		foreach ( $matches[0] as $token ) {
			$text   = strtolower( $token[0] );
			$offset = $token[1];

			// Inside a raw-text element or a CDATA section, only its own closing
			// token means anything; everything else is character data.
			if ( null !== $open ) {
				if ( 0 === strpos( $text, 'cdata' === $open ? ']]>' : '</' . $open ) ) {
					$regions[] = array( $start, $offset );
					$open      = null;
				}
				continue;
			}

			if ( ']]>' === $text ) {
				continue;
			}

			if ( '<![cdata[' === $text ) {
				$open  = 'cdata';
				$start = $offset;
				continue;
			}

			if ( '/' === $text[1] ) {
				if ( $depth > 0 ) {
					--$depth;
					if ( 0 === $depth ) {
						$regions[] = array( $nested, $offset );
					}
				}
				continue;
			}

			$name = substr( $text, 1 );

			if ( 'template' === $name ) {
				if ( 0 === $depth ) {
					$nested = $offset;
				}
				++$depth;
				continue;
			}

			$open  = $name;
			$start = $offset;
		}

		if ( null !== $open ) {
			$regions[] = array( $start, $length );
		}

		if ( $depth > 0 ) {
			$regions[] = array( $nested, $length );
		}

		return $regions;
	}

	/**
	 * Report whether an offset falls inside one of the collected spans.
	 *
	 * @param array[] $regions  Spans from unmasked_regions().
	 * @param int     $position Candidate offset.
	 *
	 * @return bool
	 */
	private function offset_in_regions( $regions, $position ) {
		foreach ( $regions as $region ) {
			if ( $position > $region[0] && $position <= $region[1] ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Exclude certain scripts from being processed by this class.
	 *
	 * @param string $tag    <script> opening tag.
	 * @param string $handle Script handle from register_ or enqueue_ methods.
	 *
	 * @return string
	 */
	public function handle_exclusions( $tag, $handle ) {
		/**
		 * Filter to provide an array of registered script handles that should not be moved to the end of the document.
		 *
		 * @param array $script_handles array of script handles. Remove any scripts that should not be moved to the end of the documents.
		 *
		 * @since   1.0.0
		 */
		$exclude_handles = apply_filters( 'jetpack_boost_render_blocking_js_exclude_handles', array() );

		if ( ! in_array( $handle, $exclude_handles, true ) ) {
			return $tag;
		}

		return $this->add_ignore_attribute( $tag );
	}

	/**
	 * Add the ignore attribute to the script tags.
	 *
	 * Case-insensitive so uppercase/mixed-case tags (`<SCRIPT>`, valid HTML and
	 * common in hand-written Custom HTML / legacy embeds) are handled too; a
	 * case-sensitive match would silently no-op on them and leave them movable.
	 *
	 * @param string $html HTML code possibly containing a <script> opening tag.
	 *
	 * @return string
	 */
	public function add_ignore_attribute( $html ) {
		return str_ireplace( '<script', sprintf( '<script %s="%s"', esc_html( $this->ignore_attribute ), esc_attr( $this->ignore_value ) ), $html );
	}

	/**
	 * Detects an unclosed script tag in a buffer.
	 *
	 * @param string $buffer Joint buffer.
	 *
	 * @return bool
	 */
	public function is_opened_script( $buffer ) {
		// Strip fully-paired ignored <script>...</script> blocks so the counts below are symmetric.
		$ignored_pair_regex = sprintf(
			'~<script[^>]*%s=(?<q>["\']*)%s\k<q>[^>]*>[\s\S]*?</script>~si',
			preg_quote( $this->ignore_attribute, '~' ),
			preg_quote( $this->ignore_value, '~' )
		);
		$stripped           = preg_replace( $ignored_pair_regex, '', $buffer );
		if ( null === $stripped ) {
			$stripped = $buffer;
		}

		// Strip HTML comments so a commented-out </script> doesn't skew the count.
		$stripped = preg_replace( '~<!--[\s\S]*?-->~', '', $stripped ) ?? $stripped;

		$opening_tags_count = preg_match_all( '~<\s*script(\s[^>]*)?>~i', $stripped );
		$closing_tags_count = preg_match_all( '~<\s*/\s*script\s*>~i', $stripped );

		return $opening_tags_count > $closing_tags_count;
	}

	/**
	 * Checks if the current request URL matches one of the exclusion patterns
	 * configured by the user.
	 *
	 * Runs at template_redirect time, when REQUEST_URI is available.
	 *
	 * @return bool
	 */
	private function is_current_request_excluded() {
		if ( ! isset( $_SERVER['REQUEST_URI'] ) ) {
			return false;
		}

		$patterns = function_exists( 'jetpack_boost_ds_get' ) ? jetpack_boost_ds_get( 'render_blocking_js_excludes' ) : array();
		if ( empty( $patterns ) || ! is_array( $patterns ) ) {
			return false;
		}

		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Only used for comparison.
		return self::is_url_excluded( wp_unslash( $_SERVER['REQUEST_URI'] ), $patterns );
	}

	/**
	 * Checks whether a request URI matches any of the given exclusion patterns.
	 *
	 * Patterns follow the semantics documented for Page Cache bypass patterns:
	 * they are compared against the URL path (query strings are ignored),
	 * a `(.*)` or `*` wildcard matches any part of the path, trailing slashes
	 * are optional and the comparison is case-insensitive.
	 *
	 * Two things differ from Page Cache, so keep them in mind before unifying the
	 * two implementations: every character outside the wildcard tokens is escaped
	 * via preg_quote() and matched literally (a pattern like `page.html` never
	 * acts as a regular expression), and the path is percent-decoded so a pattern
	 * typed as it appears in the address bar matches an encoded request path.
	 *
	 * @param string $request_uri The request URI to check.
	 * @param array  $patterns    List of URL patterns.
	 *
	 * @return bool
	 */
	public static function is_url_excluded( $request_uri, $patterns ) {
		$path = self::normalize_url_path( $request_uri );

		foreach ( $patterns as $pattern ) {
			$regex = self::get_exclusion_regex( $pattern );
			if ( null === $regex ) {
				continue;
			}

			$matched = preg_match( $regex, $path );

			/*
			 * preg_match() returns false when PCRE cannot evaluate the pattern —
			 * e.g. a pathological pattern with several literal-separated wildcards
			 * hits the backtrack limit on a long URL. Treat that as a match so a
			 * deliberate exclusion is honoured (defer stays off on the page)
			 * rather than silently ignored.
			 */
			if ( 1 === $matched || false === $matched ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Extracts a normalized path from a URL or request URI.
	 *
	 * Drops the query string, ensures a leading slash and removes trailing
	 * slashes (except for the root path).
	 *
	 * @param string $url URL or request URI.
	 *
	 * @return string
	 */
	private static function normalize_url_path( $url ) {
		$path = (string) wp_parse_url( $url, PHP_URL_PATH );

		// Decode percent-encoding so a pattern typed as it appears in the address
		// bar (e.g. `foo bar`, or a non-ASCII slug) matches the encoded request
		// path (`/foo%20bar`). Both the pattern and the request pass through here,
		// so the two sides stay symmetric.
		$path = rawurldecode( $path );

		$path = '/' . ltrim( $path, '/' );

		if ( '/' !== $path ) {
			$path = rtrim( $path, '/' );
		}

		return self::strip_home_path( $path );
	}

	/**
	 * Removes the site's home directory prefix from a path.
	 *
	 * On a subdirectory install (e.g. a site at `/blog/`) the request URI
	 * includes the subdirectory but user-entered patterns generally do not.
	 * Stripping the home directory from both sides makes the comparison relative
	 * to the home root, so a `checkout` pattern matches `/blog/checkout`.
	 *
	 * @param string $path A normalized URL path (leading slash, no query/trailing slash).
	 *
	 * @return string
	 */
	private static function strip_home_path( $path ) {
		$home_path = rtrim( (string) wp_parse_url( home_url( '/' ), PHP_URL_PATH ), '/' );

		if ( '' === $home_path ) {
			return $path;
		}

		if ( 0 === strcasecmp( $path, $home_path ) ) {
			return '/';
		}

		if ( 0 === strncasecmp( $path, $home_path . '/', strlen( $home_path ) + 1 ) ) {
			return substr( $path, strlen( $home_path ) );
		}

		return $path;
	}

	/**
	 * Turns a single exclusion pattern into an anchored regular expression.
	 *
	 * @param mixed $pattern A user-provided URL pattern.
	 *
	 * @return string|null The regular expression, or null if the pattern is empty.
	 */
	private static function get_exclusion_regex( $pattern ) {
		if ( ! is_string( $pattern ) ) {
			return null;
		}

		$pattern = trim( $pattern );
		if ( '' === $pattern ) {
			return null;
		}

		/*
		 * Reject malformed URL patterns. A full URL with a scheme but no path
		 * (e.g. a typo'd `http://[::1`) would otherwise collapse to `/` and
		 * silently exclude only the homepage. A pathless URL that points at this
		 * site (e.g. the home URL pasted as `https://example.com`) is allowed
		 * through, since it legitimately means the homepage.
		 */
		$parsed = wp_parse_url( $pattern );
		if ( false === $parsed ) {
			return null;
		}
		if ( isset( $parsed['scheme'] ) && empty( $parsed['path'] ) ) {
			$home_host = wp_parse_url( home_url( '/' ), PHP_URL_HOST );
			if ( empty( $parsed['host'] ) || 0 !== strcasecmp( $parsed['host'], (string) $home_host ) ) {
				return null;
			}
		}

		// Allow full URLs by stripping the home URL prefix (both secure and non-secure).
		$home_url = home_url( '/' );
		$pattern  = str_ireplace(
			array(
				$home_url,
				str_replace( 'http:', 'https:', $home_url ),
			),
			'/',
			$pattern
		);

		$pattern = self::normalize_url_path( $pattern );

		/*
		 * Split on wildcard tokens, treating any run of adjacent wildcards as a
		 * single split point. The possessive `++` is important: without coalescing,
		 * a pattern such as `****` would expand to one `.*` group per character, and
		 * thousands of wildcards would compile to thousands of groups and exhaust
		 * memory when matched against every front-end request. Possessive (rather
		 * than greedy `+`) keeps the split itself linear, so a pathological run of
		 * thousands of adjacent wildcards cannot exhaust the PCRE backtrack/JIT
		 * stack and make preg_split() return false.
		 */
		$tokens = preg_split( '/(?:\(\.\*\)|\(\*\)|\.\*|\*)++/', $pattern );
		if ( false === $tokens ) {
			return null;
		}

		// Everything between wildcards is matched literally; only the wildcards
		// become a (non-capturing) `.*` group.
		$quoted = array_map(
			function ( $token ) {
				return preg_quote( $token, '~' );
			},
			$tokens
		);

		return '~^' . implode( '(?:.*)', $quoted ) . '/?$~i';
	}

	public static function get_slug() {
		return 'render_blocking_js';
	}
}
