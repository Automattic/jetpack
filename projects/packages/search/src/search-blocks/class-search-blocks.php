<?php
/**
 * Search Blocks: Interactivity API block registration and state initialization.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Status;

/**
 * Registers Jetpack Search Interactivity API blocks and initializes their shared state.
 */
class Search_Blocks {

	/**
	 * Register block types and hook into WordPress.
	 *
	 * The caller (Initializer) is responsible for gating this behind the
	 * `jetpack_search_blocks_enabled` feature flag.
	 */
	public static function init() {
		add_action( 'init', array( static::class, 'register_blocks' ) );
		add_filter( 'block_categories_all', array( static::class, 'register_block_category' ) );
		add_action( 'wp_enqueue_scripts', array( static::class, 'seed_interactivity_state' ) );
		add_action( 'enqueue_block_editor_assets', array( static::class, 'enqueue_editor_assets' ) );
	}

	/**
	 * Enqueue the client-side block registration bundle in the block editor.
	 *
	 * WordPress bootstraps server-side block metadata into the editor, but a
	 * client-side registerBlockType() call is still needed for each block so
	 * the editor knows how to render a preview. This script registers all
	 * Jetpack Search blocks with ServerSideRender for the editor preview.
	 */
	public static function enqueue_editor_assets() {
		$base_path  = Package::get_installed_path() . 'build/search-blocks-editor/';
		$asset_file = $base_path . 'register-blocks.asset.php';
		if ( ! file_exists( $asset_file ) ) {
			return;
		}
		$asset = require $asset_file;

		// Convert the filesystem path to a URL. plugins_url() resolves against
		// the nearest plugin directory, which handles the jetpack_vendor
		// location that Composer installs the package into.
		$url = plugins_url( 'register-blocks.js', $base_path . 'register-blocks.js' );

		wp_enqueue_script(
			'jetpack-search-blocks-register',
			$url,
			$asset['dependencies'] ?? array(),
			$asset['version'] ?? false,
			true
		);
	}

	/**
	 * Add a "Jetpack Search" block category so our blocks appear under that
	 * heading in the inserter instead of "Uncategorized".
	 *
	 * @param array $categories Existing block categories.
	 * @return array
	 */
	public static function register_block_category( $categories ) {
		foreach ( $categories as $category ) {
			if ( 'jetpack-search' === ( $category['slug'] ?? '' ) ) {
				return $categories;
			}
		}
		$categories[] = array(
			'slug'  => 'jetpack-search',
			'title' => __( 'Jetpack Search', 'jetpack-search-pkg' ),
		);
		return $categories;
	}

	/**
	 * Register all search blocks from their block.json files.
	 */
	public static function register_blocks() {
		// Register block pattern category first so patterns can reference it.
		if ( function_exists( 'register_block_pattern_category' ) ) {
			register_block_pattern_category(
				'jetpack-search',
				array( 'label' => __( 'Jetpack Search', 'jetpack-search-pkg' ) )
			);
		}

		$blocks_dir = __DIR__ . '/blocks';
		$block_dirs = glob( $blocks_dir . '/*', GLOB_ONLYDIR );

		if ( ! $block_dirs ) {
			return;
		}

		foreach ( $block_dirs as $block_dir ) {
			if ( file_exists( $block_dir . '/block.json' ) ) {
				register_block_type( $block_dir );
			}
		}

		static::register_patterns();
	}

	/**
	 * Register block patterns.
	 */
	protected static function register_patterns() {
		$patterns_dir = __DIR__ . '/patterns';
		if ( ! is_dir( $patterns_dir ) ) {
			return;
		}
		$pattern_files = glob( $patterns_dir . '/*.php' );
		if ( ! $pattern_files ) {
			return;
		}
		foreach ( $pattern_files as $pattern_file ) {
			require_once $pattern_file;
		}
	}

	/**
	 * Seed the Interactivity API store with initial state.
	 *
	 * Populates connection config, locale, and the query / sort parsed out of
	 * the URL so blocks render correctly on first paint. Results themselves
	 * are fetched by the JS store on hydration — there is no PHP pre-fetch.
	 */
	public static function seed_interactivity_state() {
		if ( ! function_exists( 'wp_interactivity_state' ) ) {
			return;
		}
		wp_interactivity_state( 'jetpack-search', static::build_initial_state() );
	}

	/**
	 * Build the initial state array for the jetpack-search Interactivity API store.
	 *
	 * @return array<string, mixed>
	 */
	public static function build_initial_state() {
		$is_private   = class_exists( Status::class ) ? ( new Status() )->is_private_site() : false;
		$is_wpcom     = class_exists( Helper::class ) ? Helper::is_wpcom() : false;
		$site_id      = class_exists( Helper::class ) ? Helper::get_wpcom_site_id() : 0;
		$search_query = function_exists( 'get_search_query' ) ? (string) get_search_query() : '';

		return array(
			// Connection / routing config.
			'siteId'        => $site_id,
			'apiRoot'       => function_exists( 'rest_url' ) ? esc_url_raw( rest_url() ) : '',
			'nonce'         => function_exists( 'wp_create_nonce' ) ? wp_create_nonce( 'wp_rest' ) : '',
			'isPrivateSite' => $is_private,
			'isWpcom'       => $is_wpcom,
			'homeUrl'       => function_exists( 'home_url' ) ? home_url() : '',
			// BCP47-ish locale (e.g. `en-US`) for Intl.DateTimeFormat on the
			// client. Converts WP's `en_US` underscore form. Uses the blog
			// locale (site setting) rather than the viewer's user-profile
			// locale so formatting is consistent for logged-out visitors
			// hitting a search page.
			'locale'        => function_exists( 'get_locale' )
				? str_replace( '_', '-', get_locale() )
				: 'en-US',

			// Search state, seeded from the URL so a deep link like
			// /?s=boots&orderby=newest renders correctly on first paint.
			'searchQuery'   => $search_query,
			'sortOrder'     => static::parse_url_sort(),

			// Results — always start empty; the JS store fetches on hydration.
			'results'       => array(),
			'totalResults'  => 0,
			'pageHandle'    => null,

			// UI state. `isLoading` is seeded true when the URL carries a
			// search query so the no-results block stays hidden between
			// first paint and JS hydrating the initial fetch — otherwise a
			// "No results found" flash appears on deep links like `?s=boots`.
			'isLoading'     => '' !== $search_query,
			'isLoadingMore' => false,
			'hasError'      => false,
		);
	}

	/**
	 * Parse the sort order from the URL, defaulting to 'relevance'. Valid
	 * values mirror the UI keys in src/instant-search/lib/constants.js
	 * SORT_OPTIONS so deep links work across both surfaces.
	 *
	 * @return string
	 */
	protected static function parse_url_sort(): string {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only URL state.
		$orderby = isset( $_GET['orderby'] ) ? sanitize_key( wp_unslash( $_GET['orderby'] ) ) : '';
		return in_array( $orderby, array( 'newest', 'oldest' ), true ) ? $orderby : 'relevance';
	}
}
