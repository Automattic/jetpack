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
		if ( false === $this->css ) {
			return $html;
		}

		$available_methods = array(
			'async'    => 'media="not all" data-media="' . $media . '" onload="this.media=this.dataset.media; delete this.dataset.media; this.removeAttribute( \'onload\' );"',
			'deferred' => 'media="not all" data-media="' . $media . '"',
		);

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

		// If the loading method is not allowed, do not alter the stylesheet loading.
		if ( ! isset( $available_methods[ $method ] ) ) {
			return $html;
		}

		$html_no_script = '<noscript>' . $html . '</noscript>';

		// Update the stylesheet markup for allowed methods.
		$html = preg_replace( '~media=(\'[^\']+\')|("[^"]+")~', $available_methods[ $method ], $html );

		// Append to the HTML stylesheet tag the same untouched HTML stylesheet tag within the noscript tag
		// to support the rendering of the stylesheet when JavaScript is disabled.
		return $html_no_script . $html;
	}

	/**
	 * Prints the critical CSS to the page.
	 */
	public function display_critical_css() {
		$critical_css = $this->css;

		if ( false === $critical_css ) {
			// phpcs:ignore Universal.CodeAnalysis.ConstructorDestructorReturn.ReturnValueFound -- This is not a PHP 4 constructor, that only applies to non-namespaced classes.
			return false;
		}

		echo '<style id="jetpack-boost-critical-css">';

		// Ensure no </style> tag (or any HTML tags) in output.
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo wp_strip_all_tags( $critical_css );

		echo '</style>';
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
