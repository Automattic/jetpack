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
	 * otherwise at append it at the end.
	 *
	 * @param string $buffer String buffer.
	 *
	 * @return string
	 */
	public function append_script_tags( $buffer ) {
		$script_tags = implode( '', $this->buffered_script_tags );
		// Reset tags in case there's another buffer after this one.
		$this->buffered_script_tags = array();

		if ( str_contains( $buffer, '</body>' ) ) {
			$buffer = str_replace( '</body>', $script_tags . '</body>', $buffer );
		} else {
			$buffer .= $script_tags;
		}

		return $buffer;
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
