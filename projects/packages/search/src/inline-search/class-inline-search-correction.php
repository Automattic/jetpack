<?php
/**
 * Inline Search Correction: Handles search query correction display
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Assets;

/**
 * Class for handling search correction display
 *
 * @since 0.48.0
 */
class Inline_Search_Correction {
	/**
	 * Setup hooks for displaying corrected query notice.
	 *
	 * @param \WP_Query $query The current query.
	 */
	public function setup_corrected_query_hooks( $query ) {
		if ( ! $query->is_search() || ! $query->is_main_query() ) {
			return;
		}

		add_filter( 'get_search_query', array( $this, 'maybe_use_corrected_query' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_styles' ) );
		add_action( 'wp_footer', array( $this, 'register_corrected_query_script' ) );
	}

	/**
	 * Enqueue theme-specific styles for the search correction.
	 * This is hooked to wp_enqueue_scripts to ensure styles load properly in the head.
	 *
	 * @since 0.48.0
	 */
	public function enqueue_styles() {
		$corrected_query_html = $this->get_corrected_query_html();
		if ( empty( $corrected_query_html ) ) {
			return;
		}

		$handle = 'jetpack-search-inline-corrected-query';
		$this->register_corrected_query_style( $handle );
	}

	/**
	 * Register and configure the JavaScript for displaying the corrected query notice.
	 *
	 * @since 0.48.0
	 */
	public function register_corrected_query_script() {
		$corrected_query_html = $this->get_corrected_query_html();
		if ( empty( $corrected_query_html ) ) {
			return;
		}

		$handle = 'jetpack-search-inline-corrected-query';

		Assets::register_script(
			$handle,
			'build/inline-search/jp-search-inline.js',
			Package::get_installed_path() . '/src',
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-search-pkg',
				'enqueue'    => true,
			)
		);

		wp_localize_script(
			$handle,
			'JetpackSearchCorrectedQuery',
			array(
				'html'      => $corrected_query_html,
				'selectors' => $this->get_title_selectors(),
				'i18n'      => array(
					'error' => esc_html__( 'Error displaying search correction', 'jetpack-search-pkg' ),
				),
			)
		);
	}

	/**
	 * Register and enqueue theme-specific styles for corrected query.
	 *
	 * @since 0.48.0
	 * @param string $handle The script handle to use for the stylesheet.
	 */
	private function register_corrected_query_style( $handle ) {
		$css_path      = 'build/inline-search/';
		$css_file      = 'corrected-query.css';
		$full_css_path = $css_path . $css_file;
		$package_path  = Package::get_installed_path();
		$css_full_path = $package_path . '/' . $full_css_path;

		// Verify the CSS file exists before trying to enqueue it
		if ( ! file_exists( $css_full_path ) ) {
			return;
		}

		// We need to use plugins_url for reliable URL generation
		$file_url = plugins_url(
			$full_css_path,
			$package_path . '/package.json'
		);

		// Use the file's modification time for more precise cache busting
		$file_version = file_exists( $css_full_path ) ? filemtime( $css_full_path ) : Package::VERSION;

		wp_enqueue_style(
			$handle,
			$file_url,
			array(),
			$file_version // Use file modification time for cache busting
		);
	}

	/**
	 * Replaces the search query with the corrected query in the title.
	 *
	 * @param string $query The original search query.
	 * @return string The corrected query if available, otherwise the original query.
	 */
	public function maybe_use_corrected_query( $query ) {
		$search_result = $this->get_search_result();
		if ( is_array( $search_result ) && ! empty( $search_result['corrected_query'] ) && ! empty( $search_result['results'] ) ) {
			return $search_result['corrected_query'];
		}

		return $query;
	}

	/**
	 * Get selectors where corrected query notice will be displayed.
	 *
	 * @since 0.48.0
	 * @return array CSS selectors for search title elements.
	 */
	private function get_title_selectors() {
		$default_selectors = array(
			'.wp-block-query-title',
			'.page-title',
			'.archive-title',
			'.entry-title',
			'.nv-page-title',
			'.page-subheading',
		);

		/**
		 * Filter the selectors where corrected query notice appears.
		 *
		 * @since 0.48.0
		 * @param array $default_selectors CSS selectors for search title elements.
		 */
		return apply_filters( 'jetpack_search_title_selectors', $default_selectors );
	}

	/**
	 * Generate the HTML for the corrected query notice.
	 *
	 * @return string The HTML for the corrected query notice or empty string if none.
	 */
	private function get_corrected_query_html() {
		global $wp_query;
		$original_query = $wp_query->get( 's' );
		$search_result  = $this->get_search_result();

		if ( ! is_array( $search_result ) || empty( $search_result['corrected_query'] ) || empty( $search_result['results'] ) ) {
			return '';
		}

		$message = sprintf(
			/* translators: %s: Original search term the user entered */
			esc_html__( 'No results for "%s"', 'jetpack-search-pkg' ),
			esc_html( $original_query )
		);

		return sprintf(
			'<p class="jetpack-search-corrected-query">%s</p>',
			$message
		);
	}

	/**
	 * Get the search result from the Inline_Search instance.
	 *
	 * @return array|\WP_Error|null The search result or null if not available.
	 */
	private function get_search_result() {
		$inline_search = Inline_Search::instance();
		return $inline_search->get_search_result();
	}
}
