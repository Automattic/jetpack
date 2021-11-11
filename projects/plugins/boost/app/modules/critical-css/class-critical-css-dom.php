<?php
/**
 * Critical CSS DOM ma.
 *
 * @link    https://automattic.com
 * @since   1.3.1
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS;

/**
 * Class Critical_CSS_DOM.
 */
class Critical_CSS_DOM {
	/**
	 * Critical_CSS class instance.
	 *
	 * @var Critical_CSS
	 */
	public $critical_css;

	/**
	 * Constructor.
	 *
	 * @param Critical_CSS $critical_css Critical CSS object.
	 */
	public function __construct( $critical_css ) {
		$this->critical_css = $critical_css;
	}

	/**
	 * Get critical CSS for the current request.
	 *
	 * @return string|false
	 */
	public function get_critical_css() {
		return $this->critical_css->get_critical_css();
	}

	/**
	 * Initialize.
	 */
	public function init() {
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
		if ( function_exists( 'is_amp_endpoint' ) && is_amp_endpoint() ) {
			return $html;
		}

		if ( false === $this->get_critical_css() ) {
			return $html;
		}

		if ( ! apply_filters( 'jetpack_boost_async_style', true, $handle ) ) {
			return $html;
		}
		$async_media = apply_filters( 'jetpack_boost_async_media', array( 'all', 'screen' ) );

		// Convert stylesheets intended for screens.
		if ( in_array( $media, $async_media, true ) ) {
			/**
			 * Load stylesheets after window load event.
			 *
			 * @param string $handle The style's registered handle.
			 * @todo  Retrieve settings from database, either via auto-configuration or UI option.
			 */
			$window_loaded_media = apply_filters( 'jetpack_boost_window_loaded_media', false, $handle );

			$media_replacement = $window_loaded_media ? 'media="not all"' : 'media="not all" onload="this.media=\'all\'"';
			$html              = preg_replace( '~media=[\'"]?[^\'"\s]+[\'"]?~', $media_replacement, $html );
		}

		return $html;
	}

	/**
	 * Add a small piece of JavaScript to the footer, which on load flips all
	 * linked stylesheets from media="not all" to "all", and switches the
	 * Critical CSS <style> block to media="not all" to deactivate it.
	 */
	public function onload_flip_stylesheets() {
		?>
		<script>window.addEventListener('load', function() {
				document.querySelectorAll('link').forEach(function(e) {'not all' === e.media && (e.media = 'all');});
				var e = document.getElementById('jetpack-boost-critical-css');
				e && (e.media = 'not all');
			});</script>
		<?php
	}
}
