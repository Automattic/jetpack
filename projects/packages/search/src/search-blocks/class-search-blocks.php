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
	 */
	public static function init() {
		add_action( 'init', array( static::class, 'register_blocks' ) );
		add_filter( 'block_categories_all', array( static::class, 'register_block_category' ) );
		add_action( 'wp_enqueue_scripts', array( static::class, 'seed_interactivity_state' ) );
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

		static::register_variations();
		static::register_patterns();
	}

	/**
	 * Register named block variations for the filter-checkbox block.
	 *
	 * PHP-side registration keeps the editor-only JS bundle out of the ESM pipeline.
	 */
	protected static function register_variations() {
		if ( ! function_exists( 'register_block_variation' ) || ! function_exists( 'wp_register_block_variation' ) ) {
			// Older WP: register_block_variation() was not available until 6.5.
			// Skip silently; variations are editor UX only.
			if ( ! function_exists( 'register_block_variation' ) ) {
				return;
			}
		}

		$variations = array(
			array(
				'name'        => 'category',
				'title'       => __( 'Filter by Category', 'jetpack-search-pkg' ),
				'description' => __( 'Show category checkboxes with live result counts.', 'jetpack-search-pkg' ),
				'attributes'  => array(
					'filterType' => 'taxonomy',
					'taxonomy'   => 'category',
					'label'      => __( 'Category', 'jetpack-search-pkg' ),
				),
				'isActive'    => array( 'filterType', 'taxonomy' ),
			),
			array(
				'name'        => 'post_tag',
				'title'       => __( 'Filter by Tag', 'jetpack-search-pkg' ),
				'description' => __( 'Show tag checkboxes with live result counts.', 'jetpack-search-pkg' ),
				'attributes'  => array(
					'filterType' => 'taxonomy',
					'taxonomy'   => 'post_tag',
					'label'      => __( 'Tag', 'jetpack-search-pkg' ),
				),
				'isActive'    => array( 'filterType', 'taxonomy' ),
			),
			array(
				'name'        => 'post_type',
				'title'       => __( 'Filter by Post Type', 'jetpack-search-pkg' ),
				'description' => __( 'Show post type checkboxes with live result counts.', 'jetpack-search-pkg' ),
				'attributes'  => array(
					'filterType' => 'post_type',
					'label'      => __( 'Post Type', 'jetpack-search-pkg' ),
				),
				'isActive'    => array( 'filterType' ),
			),
			array(
				'name'        => 'author',
				'title'       => __( 'Filter by Author', 'jetpack-search-pkg' ),
				'description' => __( 'Show author checkboxes with live result counts.', 'jetpack-search-pkg' ),
				'attributes'  => array(
					'filterType' => 'author',
					'label'      => __( 'Author', 'jetpack-search-pkg' ),
				),
				'isActive'    => array( 'filterType' ),
			),
			array(
				'name'        => 'custom_taxonomy',
				'title'       => __( 'Filter by Custom Taxonomy', 'jetpack-search-pkg' ),
				'description' => __( 'Show checkboxes for any registered taxonomy.', 'jetpack-search-pkg' ),
				'attributes'  => array(
					'filterType' => 'taxonomy',
					'taxonomy'   => '',
					'label'      => '',
				),
				'isActive'    => array( 'filterType', 'taxonomy' ),
			),
			array(
				'name'        => 'post_meta',
				'title'       => __( 'Filter by Custom Field', 'jetpack-search-pkg' ),
				'description' => __( 'Show checkboxes for a post meta key (curated values).', 'jetpack-search-pkg' ),
				'attributes'  => array(
					'filterType'  => 'post_meta',
					'metaKey'     => '',
					'displayMode' => 'curated',
					'label'       => '',
				),
				'isActive'    => array( 'filterType' ),
			),
		);

		foreach ( $variations as $variation ) {
			register_block_variation( 'jetpack/filter-checkbox', $variation );
		}
	}

	/**
	 * Register block patterns.
	 */
	protected static function register_patterns() {
		$patterns_dir = __DIR__ . '/patterns';
		if ( is_dir( $patterns_dir ) ) {
			foreach ( glob( $patterns_dir . '/*.php' ) as $pattern_file ) {
				require_once $pattern_file;
			}
		}
	}

	/**
	 * Seed the Interactivity API store with initial state.
	 *
	 * Individual block render.php files call wp_interactivity_state() too —
	 * core deep-merges the arrays, so the search-results render.php adds the
	 * pre-fetched results and each filter-checkbox adds its config.
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
		$is_private = class_exists( Status::class ) ? ( new Status() )->is_private_site() : false;
		$is_wpcom   = class_exists( Helper::class ) ? Helper::is_wpcom() : false;
		$site_id    = class_exists( Helper::class ) ? Helper::get_wpcom_site_id() : 0;

		return array(
			// Connection / routing config.
			'siteId'        => $site_id,
			'apiRoot'       => function_exists( 'rest_url' ) ? esc_url_raw( rest_url() ) : '',
			'nonce'         => function_exists( 'wp_create_nonce' ) ? wp_create_nonce( 'wp_rest' ) : '',
			'isPrivateSite' => $is_private,
			'isWpcom'       => $is_wpcom,
			'homeUrl'       => function_exists( 'home_url' ) ? home_url() : '',

			// Search state, seeded from the URL so that landing on a deep link
			// (?s=boots&filter[category][]=shoes&orderby=date) renders the correct
			// filter selection and SSR results on the first paint without a
			// client-side second-fetch flash.
			'searchQuery'   => function_exists( 'get_search_query' ) ? (string) get_search_query() : '',
			'activeFilters' => static::parse_url_filters(),
			'sortOrder'     => static::parse_url_sort(),

			// filterConfigs: each filter-checkbox block's render.php merges its own entry here.
			// Shape: { [filterKey]: { filterKey, esField, aggType, curatedValues, showCount, maxItems } }
			'filterConfigs' => array(),

			// Results (populated by search-results block render.php).
			'results'       => array(),
			'aggregations'  => array(),
			'totalResults'  => 0,
			'pageHandle'    => null,

			// UI state.
			'isLoading'     => false,
			'isLoadingMore' => false,
			'hasError'      => false,
		);
	}

	/**
	 * Parse filter selections from the current request URL.
	 *
	 * Accepts `filter[<filterKey>][]=<value>` query params — the same shape that
	 * store/url-state.js writes — and returns an { [filterKey]: string[] } map.
	 * Unexpected values are sanitized and empty entries dropped so downstream
	 * code can safely feed this into the ES request.
	 *
	 * @return array<string, string[]>
	 */
	protected static function parse_url_filters(): array {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- read-only URL state; sanitized per-value below.
		$raw = isset( $_GET['filter'] ) ? wp_unslash( $_GET['filter'] ) : array();
		if ( ! is_array( $raw ) ) {
			return array();
		}

		$out = array();
		foreach ( $raw as $key => $values ) {
			$filter_key = sanitize_key( (string) $key );
			if ( '' === $filter_key ) {
				continue;
			}
			$clean = array_values(
				array_filter(
					array_map( 'sanitize_text_field', (array) $values ),
					static fn( $v ) => '' !== $v
				)
			);
			if ( $clean ) {
				$out[ $filter_key ] = $clean;
			}
		}
		return $out;
	}

	/**
	 * Parse the sort order from the URL, defaulting to 'relevance'.
	 *
	 * @return string
	 */
	protected static function parse_url_sort(): string {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only URL state.
		$orderby = isset( $_GET['orderby'] ) ? sanitize_key( wp_unslash( $_GET['orderby'] ) ) : '';
		return in_array( $orderby, array( 'date' ), true ) ? $orderby : 'relevance';
	}
}
