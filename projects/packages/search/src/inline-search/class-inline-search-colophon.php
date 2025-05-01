<?php
/**
 * Inline Search Colophon: Handles Jetpack colophon display
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Class for handling Jetpack colophon display
 *
 * @since $$next-version$$
 */
class Inline_Search_Colophon extends Inline_Search_Component {
	/**
	 * Setup hooks for displaying the Jetpack colophon.
	 *
	 * @param \WP_Query $query The current query.
	 */
	public function setup_colophon_hooks( $query ) {
		if ( ! $this->is_valid_search_query( $query ) ) {
			return;
		}

		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_styles' ) );
		add_action( 'wp_footer', array( $this, 'register_colophon_script' ) );
	}

	/**
	 * Enqueue theme-specific styles for the search colophon.
	 * This is hooked to wp_enqueue_scripts to ensure styles load properly in the head.
	 *
	 * @since $$next-version$$
	 */
	public function enqueue_styles() {
		$handle = 'jetpack-search-inline-colophon';
		$this->register_component_style( $handle, 'colophon.css' );
	}

	/**
	 * Register and configure the JavaScript for displaying the colophon.
	 *
	 * @since $$next-version$$
	 */
	public function register_colophon_script() {
		$this->register_inline_search_script();

		// Only localize the script, don't register it again as it's handled by the base class
		wp_localize_script(
			self::SCRIPT_HANDLE,
			'JetpackSearchColophon',
			array(
				'html'     => $this->get_colophon_html(),
				'selector' => $this->format_selectors_for_query( $this->get_content_selectors() ),
			)
		);
	}

	/**
	 * Get selectors where colophon will be displayed.
	 *
	 * @since $$next-version$$
	 * @return array CSS selectors for content container elements.
	 */
	private function get_content_selectors() {
		$default_selectors = array(
			'.wp-block-query',
			'.content',
			'#content',
			'#site-content',
			'.site-main',
			'.content-area',
		);

		/**
		 * Filter the selectors where colophon appears.
		 *
		 * @since $$next-version$$
		 * @param array $default_selectors CSS selectors for content container elements.
		 */
		return apply_filters( 'jetpack_search_colophon_selectors', $default_selectors );
	}

	/**
	 * Get the locale for the Jetpack URL.
	 *
	 * @return string|null The locale prefix or null.
	 */
	private function get_locale_prefix() {
		$locale = get_locale();
		if ( empty( $locale ) ) {
			return null;
		}

		$locale_prefix = explode( '-', $locale )[0];
		return $locale_prefix !== 'en' ? $locale_prefix : null;
	}

	/**
	 * Generate the HTML for the colophon.
	 *
	 * @return string The HTML for the colophon.
	 */
	private function get_colophon_html() {
		$locale_prefix = $this->get_locale_prefix();
		$url           = $locale_prefix
			? 'https://' . $locale_prefix . '.jetpack.com/upgrade/search?utm_source=poweredby'
			: 'https://jetpack.com/upgrade/search/?utm_source=poweredby';

		$logo_svg = $this->get_logo_svg();

		return sprintf(
			'<div class="jetpack-search-inline-colophon">
				<a href="%s" rel="external noopener noreferrer nofollow" target="_blank" class="jetpack-search-inline-colophon-link">
					%s
					<span>%s</span>
				</a>
			</div>',
			esc_url( $url ),
			$logo_svg,
			esc_html__( 'Search powered by Jetpack', 'jetpack-search-pkg' )
		);
	}

	/**
	 * Get the SVG markup for the Jetpack logo.
	 *
	 * @return string The SVG markup.
	 */
	private function get_logo_svg() {
		$color_jetpack = '#069E08';
		$color_white   = '#ffffff';
		$logo_size     = 12;

		return sprintf(
			'<svg class="jetpack-search-inline-colophon-logo" height="%1$d" width="%1$d" viewBox="0 0 32 32">
				<path class="jetpack-logo__icon-circle" fill="%2$s" d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z" />
				<polygon class="jetpack-logo__icon-triangle" fill="%3$s" points="15,19 7,19 15,3 " />
				<polygon class="jetpack-logo__icon-triangle" fill="%3$s" points="17,29 17,13 25,13 " />
			</svg>',
			$logo_size,
			$color_jetpack,
			$color_white
		);
	}
}
