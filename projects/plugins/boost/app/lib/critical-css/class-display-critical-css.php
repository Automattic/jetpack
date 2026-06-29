<?php
/**
 * Class that's responsible for rendering
 * Critical CSS on the site front-end.
 */

namespace Automattic\Jetpack_Boost\Lib\Critical_CSS;

class Display_Critical_CSS {

	/**
	 * @var string The Critical CSS to display.
	 */
	protected $css;

	/**
	 * @param string $css
	 */
	public function __construct( $css ) {
		$this->css = $css;
	}

	/**
	 * Converts existing screen CSS to be asynchronously loaded.
	 *
	 * @param string $html   The link tag for the enqueued style.
	 * @param string $handle The style's registered handle.
	 * @param string $href   The stylesheet's source URL.
	 * @param string $media  The stylesheet's media attribute.
	 *
	 * @return string
	 * @see style_loader_tag
	 */
	public function asynchronize_stylesheets(
		$html,
		$handle,
		$href,
		$media
	) {
		// If there is no critical CSS, do not alter the stylesheet loading.
		if ( ! $this->css ) {
			return $html;
		}

		$supported_loading_methods = array( 'async', 'deferred' );

		/**
		 * Loading method for stylesheets.
		 *
		 * Filter the loading method for each stylesheet for the screen with following values:
		 *     async    - Stylesheets are loaded asynchronously.
		 *                Styles are applied once the stylesheet is loaded completely without render blocking.
		 *     deferred - Loading of stylesheets are deferred until the window load event.
		 *                Styles from all the stylesheets are applied at once after the page load.
		 *
		 * Stylesheet loading behaviour is not altered for any other value such as false or 'default'.
		 * Stylesheet loading is instant and the process blocks the page rendering.
		 *     Eg: add_filter( 'jetpack_boost_async_style', '__return_false' );
		 *
		 * @param string $handle The style's registered handle.
		 * @param string $media  The stylesheet's media attribute.
		 *
		 * @see   onload_flip_stylesheets for how stylesheets loading is deferred.
		 *
		 * @todo  Retrieve settings from database, either via auto-configuration or UI option.
		 */
		$method = apply_filters( 'jetpack_boost_async_style', 'async', $handle, $media );

		// If the loading method is not supported, do not alter the stylesheet loading.
		if ( ! in_array( $method, $supported_loading_methods, true ) ) {
			return $html;
		}

		// Update the stylesheet markup for supported loading methods using WordPress HTML API.
		$processor = new \WP_HTML_Tag_Processor( $html );
		if ( ! $processor->next_tag( 'link' ) ) {
			return $html;
		}

		// Only process if this is a stylesheet link tag.
		if ( 'stylesheet' !== $processor->get_attribute( 'rel' ) ) {
			return $html;
		}

		// Set the new attributes based on the selected method.
		$processor->set_attribute( 'media', 'not all' );
		$processor->set_attribute( 'data-media', $media );
		if ( 'async' === $method ) {
			$processor->set_attribute( 'onload', "this.media=this.dataset.media; delete this.dataset.media; this.removeAttribute( 'onload' );" );
		}

		// Prepend the original HTML stylesheet tag within the noscript tag
		// to support the rendering of the stylesheet when JavaScript is disabled.
		return '<noscript>' . $html . '</noscript>' . $processor->get_updated_html();
	}

	/**
	 * Prints the critical CSS to the page.
	 */
	public function display_critical_css() {
		$critical_css = $this->css;

		if ( ! $critical_css ) {
			return false;
		}

		echo '<style id="jetpack-boost-critical-css">';

		// Ensure the CSS cannot terminate the style element early.
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo self::neutralize_style_closing_tags( $critical_css );

		echo '</style>';
	}

	/**
	 * Neutralize any closing </style tag so CSS can be printed inside a <style>
	 * element without breaking out of it.
	 *
	 * This is NOT a general-purpose CSS sanitizer: it does exactly one thing,
	 * which is to stop the CSS from terminating the surrounding <style> element.
	 * It deliberately avoids wp_strip_all_tags(), which corrupts valid CSS values
	 * that contain markup - e.g. `background-image: url("data:image/svg+xml,<svg ...></svg>")`.
	 *
	 * Per the HTML rawtext tokenizer, a <style> element can only be terminated by
	 * the literal sequence `</style` (case-insensitive). Escaping its forward slash
	 * to `<\/style` defeats the tokenizer - `</` must be immediately followed by the
	 * tag name, and `<\` is treated as literal text - so the markup stays inert. The
	 * replacement string contains no `</style` substring, so a single left-to-right
	 * pass cannot reconstruct the sequence (including from nested input like
	 * `<</style/style`), and the transform is idempotent.
	 *
	 * Inside CSS strings and url() tokens `\/` is a valid escape for `/`, so
	 * legitimate quoted values keep their meaning. (A literal `</style` outside a
	 * quoted string does not occur in well-formed CSS; the security guarantee takes
	 * priority there regardless.)
	 *
	 * @param string $css CSS to neutralize.
	 * @return string CSS that cannot terminate the surrounding <style> element.
	 */
	public static function neutralize_style_closing_tags( $css ) {
		return str_ireplace( '</style', '<\/style', $css );
	}

	/**
	 * Add a small piece of JavaScript to the footer, which on load flips all
	 * linked stylesheets from media="not all" to "all", and switches the
	 * Critical CSS <style> block to media="not all" to deactivate it.
	 */
	public function onload_flip_stylesheets() {
		/*
			Unminified version of footer script.

		?>
			<script>
				window.addEventListener( 'load', function() {

					// Flip all media="not all" links to media="all".
					document.querySelectorAll( 'link' ).forEach(
						function( link ) {
							if ( link.media === 'not all' && link.dataset.media ) {
								link.media = link.dataset.media;
								delete link.dataset.media;
							}
						}
					);

					// Turn off Critical CSS style block with media="not all".
					var element = document.getElementById( 'jetpack-boost-critical-css' );
					if ( element ) {
						element.media = 'not all';
					}

				} );
			</script>
		<?php
		*/

		// Minified version of footer script. See above comment for unminified version.
		?>
		<script>window.addEventListener( 'load', function() {
				document.querySelectorAll( 'link' ).forEach( function( e ) {'not all' === e.media && e.dataset.media && ( e.media = e.dataset.media, delete e.dataset.media );} );
				var e = document.getElementById( 'jetpack-boost-critical-css' );
				e && ( e.media = 'not all' );
			} );</script>
		<?php
	}
}
