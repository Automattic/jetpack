<?php
/**
 * Critical CSS DOM manipulation class.
 *
 * @link       https://automattic.com
 * @since      1.3.2
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS;

/**
 * Class Critical_CSS_DOM.
 */
class Critical_CSS_DOM {
	/**
	 * Critical CSS string.
	 *
	 * @var string|bool
	 */
	protected $critical_css;

	/**
	 * Get the Critical CSS string for the current page.
	 *
	 * @return string|bool Critical CSS
	 */
	public function get_critical_css() {
		return $this->critical_css;
	}

	/**
	 * Set the Critical CSS string for the current page.
	 *
	 * @param string|bool $critical_css Critical CSS.
	 */
	public function set_critical_css( $critical_css ) {
		$this->critical_css = $critical_css;
	}

	/**
	 * Initialize DOM update actions and filters.
	 */
	public function init_dom_update() {
		add_action( 'wp_head', array( $this, 'display_critical_css' ), 0 );
		add_filter( 'style_loader_tag', array( $this, 'asynchronize_stylesheets' ), 10, 4 );
		add_action( 'wp_footer', array( $this, 'onload_flip_stylesheets' ) );
	}

	/**
	 * Prints the critical CSS to the page.
	 */
	public function display_critical_css() {
		if ( function_exists( 'is_amp_endpoint' ) && is_amp_endpoint() ) {
			return false;
		}

		$critical_css = $this->get_critical_css();

		if ( false === $critical_css ) {
			return false;
		}

		echo '<style id="jetpack-boost-critical-css">';

		// Ensure no </style> tag (or any HTML tags) in output.
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo wp_strip_all_tags( $critical_css );

		echo '</style>';
	}

	/**
	 * Converts existing screen CSS to be asynchronously loaded.
	 *
	 * @param string $html   The link tag for the enqueued style.
	 * @param string $handle The style's registered handle.
	 * @param string $href   The stylesheet's source URL.
	 * @param string $media  The stylesheet's media attribute.
	 *
	 * @return string|string[]|null
	 * @see style_loader_tag
	 */
	public function asynchronize_stylesheets( $html, $handle, $href, $media ) {
		// If is AMP, do not alter the stylesheet loading.
		if ( function_exists( 'is_amp_endpoint' ) && is_amp_endpoint() ) {
			return $html;
		}

		// If there is no critical CSS, do not alter the stylesheet loading.
		if ( false === $this->get_critical_css() ) {
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
		 * @see onload_flip_stylesheets for how stylesheets loading is deferred.
		 *
		 * @param string $handle The style's registered handle.
		 * @param string $media  The stylesheet's media attribute.
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
	 * Add a small piece of JavaScript to the footer, which on window load flips all
	 * linked stylesheets from media="not all" to "{original media}", and switches the
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
		<script>window.addEventListener('load', function() {
			document.querySelectorAll('link').forEach(function(e) {'not all' === e.media && e.dataset.media && (e.media=e.dataset.media,delete e.dataset.media)});
			var e = document.getElementById('jetpack-boost-critical-css');
			e && (e.media = 'not all');
		});</script>
		<?php
	}
}
