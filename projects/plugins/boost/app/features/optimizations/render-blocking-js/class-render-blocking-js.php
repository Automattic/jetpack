<?php
/**
 * Implements the system to avoid render blocking JS execution.
 *
 * @link       https://automattic.com
 * @since      0.2
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Features\Optimizations\Render_Blocking_JS;

use Automattic\Jetpack_Boost\Contracts\Feature;
use Automattic\Jetpack_Boost\Lib\Output_Filter;

/**
 * Class Render_Blocking_JS
 */
class Render_Blocking_JS implements Feature {
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

		// Set up the ignore attribute value.
		$this->ignore_attribute = apply_filters( 'jetpack_boost_render_blocking_js_ignore_attribute', 'data-jetpack-boost' );

		add_action( 'template_redirect', array( $this, 'start_output_filtering' ), -999999 );
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

		// Give a chance to disable defer blocking js.
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
				false !== strpos( $_SERVER['REQUEST_URI'], '.xsl' ) ||
				false !== strpos( $_SERVER['REQUEST_URI'], 'sitemap-stylesheet=index' ) ||
				false !== strpos( $_SERVER['REQUEST_URI'], 'sitemap-stylesheet=sitemap' )
				// phpcs:enable WordPress.Security.ValidatedSanitizedInput
			) ) {
			return;
		}

		// Disable in all POST Requests.
		// phpcs:disable WordPress.Security.NonceVerification.Missing
		if ( ! empty( $_POST ) ) {
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
		$regex = sprintf( '~<script(?![^>]*%s=(?<q>["\']*)%s\k<q>)([^>]*)>[\s\S]*?<\/script>~si', preg_quote( $this->ignore_attribute, '~' ), preg_quote( $this->ignore_value, '~' ) );
		preg_match_all( $regex, $buffer, $script_tags, PREG_OFFSET_CAPTURE );

		// No script_tags in the joint buffer.
		if ( empty( $script_tags[0] ) ) {
			return array();
		}

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

			// Scripts with application/json type
			'~<script\s+[^\>]*type=(?<q>["\']*)application/json\k<q>.*?>.*?</script>~si',
		);

		return preg_replace_callback(
			$exclusions,
			function ( $script_match ) {
				return str_replace( '<script', sprintf( '<script %s="%s"', esc_html( $this->ignore_attribute ), esc_attr( $this->ignore_value ) ), $script_match[0] );
			},
			$buffer
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
		if ( false !== strpos( $buffer, '</body>' ) ) {
			return str_replace( '</body>', join( '', $this->buffered_script_tags ) . '</body>', $buffer );
		}

		return $buffer . join( '', $this->buffered_script_tags );
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
		$exclude_handles = apply_filters( 'jetpack_boost_render_blocking_js_exclude_handles', array() );

		if ( ! in_array( $handle, $exclude_handles, true ) ) {
			return $tag;
		}

		return str_replace( '<script', sprintf( '<script %s="%s"', esc_html( $this->ignore_attribute ), esc_attr( $this->ignore_value ) ), $tag );
	}

	/**
	 * Detects an unclosed script tag in a buffer.
	 *
	 * @param string $buffer Joint buffer.
	 *
	 * @return bool
	 */
	public function is_opened_script( $buffer ) {
		$opening_tags_count = preg_match_all( '~<\s*script(?![^>]*%s="%s")([^>]*)>~', $buffer );
		$closing_tags_count = preg_match_all( '~<\s*/script[^>]*>~', $buffer );

		/**
		 * This works, because the logic in `handle_output_stream` will never
		 * allow an unpaired closing </script> tag to appear in the buffer.
		 *
		 * Open script tags are always kept in the buffer until their closing
		 * tags eventually arrive as well. That means it's only possible to
		 * encounter an unpaired opening <script> in a buffer, which is why
		 * a simple comparison works.
		 *
		 * @todo What if there is a <!-- </script> --> comment?
		 * @todo What happens when script tags are unclosed?
		 */
		return $opening_tags_count > $closing_tags_count;
	}

	public static function get_slug() {
		return 'render-blocking-js';
	}

	public function setup_trigger() {
		return 'init';
	}

}
