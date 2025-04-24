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
 * @since $$next-version$$
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
		add_action( 'wp_footer', array( $this, 'register_corrected_query_script' ) );
	}

	/**
	 * Register and configure the JavaScript for displaying the corrected query notice.
	 *
	 * @since $$next-version$$
	 */
	public function register_corrected_query_script() {
		$corrected_query_html = $this->get_corrected_query_html();
		if ( empty( $corrected_query_html ) ) {
			return;
		}

		$handle = 'jetpack-search-inline-corrected-query';

		Assets::register_script(
			$handle,
			'js/corrected-query.js',
			__FILE__,
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
	 * Replaces the search query with the corrected query in the title.
	 *
	 * @param string $query The original search query.
	 * @return string The corrected query if available, otherwise the original query.
	 */
	public function maybe_use_corrected_query( $query ) {
		$search_result = $this->get_search_result();
		if ( ! empty( $search_result['corrected_query'] ) && ! empty( $search_result['results'] ) ) {
			return $search_result['corrected_query'];
		}

		return $query;
	}

	/**
	 * Get selectors where corrected query notice will be displayed.
	 *
	 * @since $$next-version$$
	 * @return array CSS selectors for search title elements.
	 */
	private function get_title_selectors() {
		$default_selectors = array(
			'.wp-block-query-title',
			'.page-title',
			'.archive-title',
		);

		/**
		 * Filter the selectors where corrected query notice appears.
		 *
		 * @since $$next-version$$
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
		$original_query = sanitize_text_field( wp_unslash( $_GET['s'] ?? '' ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- This is a search query.
		$search_result  = $this->get_search_result();

		if ( empty( $search_result['corrected_query'] ) || empty( $search_result['results'] ) ) {
			return '';
		}

		$message = sprintf(
			/* translators: %s: Original search term the user entered */
			esc_html__( 'No results for %s', 'jetpack-search-pkg' ),
			esc_html( $original_query )
		);

		return sprintf(
			'<h2 class="jetpack-search-corrected-query">%s</h2>',
			$message
		);
	}

	/**
	 * Get the search result from the Inline_Search instance.
	 *
	 * @return array|null The search result or null if not available.
	 */
	private function get_search_result() {
		$inline_search = Inline_Search::instance();
		return $inline_search->get_search_result();
	}
}
