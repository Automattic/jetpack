<?php
/**
 * Inline Search Component: Base abstract class for inline search components
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Assets;

/**
 * Base abstract class for inline search components
 *
 * @since $$next-version$$
 */
abstract class Inline_Search_Component {
	/**
	 * Common script handle used by all inline search components
	 */
	protected const SCRIPT_HANDLE = 'jetpack-search-inline';

	/**
	 * Verify query is a valid search query.
	 *
	 * @param \WP_Query $query The current query.
	 * @return bool Whether this is a valid search query.
	 */
	protected function is_valid_search_query( $query ) {
		return $query->is_search() && $query->is_main_query();
	}

	/**
	 * Register and enqueue a component stylesheet.
	 *
	 * @since $$next-version$$
	 * @param string $handle The script handle to use for the stylesheet.
	 * @param string $css_file The CSS filename (without the path).
	 * @return bool Whether the style was successfully registered and enqueued.
	 */
	protected function register_component_style( $handle, $css_file ) {
		$css_path      = 'build/inline-search/';
		$full_css_path = $css_path . $css_file;
		$package_path  = Package::get_installed_path();
		$css_full_path = $package_path . '/' . $full_css_path;

		// Verify the CSS file exists before trying to enqueue it
		if ( ! file_exists( $css_full_path ) ) {
			return false;
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

		return true;
	}

	/**
	 * Register the common inline search script if not already registered.
	 *
	 * @since $$next-version$$
	 * @return bool Whether the script was registered.
	 */
	protected function register_inline_search_script() {
		if ( wp_script_is( self::SCRIPT_HANDLE, 'registered' ) ) {
			return true;
		}

		return Assets::register_script(
			self::SCRIPT_HANDLE,
			'build/inline-search/jp-search-inline.js',
			Package::get_installed_path() . '/src',
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-search-pkg',
				'enqueue'    => true,
			)
		);
	}

	/**
	 * Get the search result from the Inline_Search instance.
	 *
	 * @return array|null The search result or null if not available.
	 */
	protected function get_search_result() {
		$inline_search = Inline_Search::instance();
		return $inline_search->get_search_result();
	}

	/**
	 * Convert an array of selectors to a comma-separated string for querySelector.
	 *
	 * @param array $selectors Array of CSS selectors.
	 * @return string Comma-separated string of selectors.
	 */
	protected function format_selectors_for_query( $selectors ) {
		return implode( ', ', $selectors );
	}
}
