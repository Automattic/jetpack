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
		if ( is_dir( $patterns_dir ) ) {
			foreach ( glob( $patterns_dir . '/*.php' ) as $pattern_file ) {
				require_once $pattern_file;
			}
		}
	}

	/**
	 * Seed the Interactivity API store with initial state.
	 *
	 * The search-results render.php deep-merges its pre-fetched results into
	 * the same `jetpack-search` store via wp_interactivity_state().
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

			// Search state, seeded from the URL so a deep link like
			// /?s=boots&orderby=date renders correctly on first paint.
			'searchQuery'   => function_exists( 'get_search_query' ) ? (string) get_search_query() : '',
			'sortOrder'     => static::parse_url_sort(),

			// Results (populated by search-results block render.php).
			'results'       => array(),
			'totalResults'  => 0,
			'pageHandle'    => null,

			// UI state.
			'isLoading'     => false,
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

	/**
	 * Normalize a v1.3 Jetpack Search result into a flat shape suitable for
	 * the Interactivity API templates.
	 *
	 * The v1.3 API returns keys with dots (`permalink.url.raw`, `image.url.raw`,
	 * `title.default`) that the Interactivity `data-wp-bind--*` and
	 * `data-wp-text` directives cannot address. Flattening here lets the
	 * client and server speak the same shape, and centralises the URL
	 * sanitisation so a malformed API response can't smuggle a javascript:
	 * URL into an href.
	 *
	 * @param array $raw Raw result from the API.
	 * @return array<string, mixed>
	 */
	public static function normalize_result( array $raw ): array {
		$fields    = isset( $raw['fields'] ) && is_array( $raw['fields'] ) ? $raw['fields'] : array();
		$highlight = isset( $raw['highlight'] ) && is_array( $raw['highlight'] ) ? $raw['highlight'] : array();

		$permalink  = self::prefix_https( (string) ( $fields['permalink.url.raw'] ?? '' ) );
		$raw_image  = $fields['image.url.raw'] ?? '';
		$image_src  = is_array( $raw_image ) ? (string) ( $raw_image[0] ?? '' ) : (string) $raw_image;
		$image_url  = self::prefix_https( $image_src );
		$path       = '';
		$date_label = '';

		if ( '' !== $permalink ) {
			$parsed = wp_parse_url( $permalink, PHP_URL_PATH );
			$parts  = array_values( array_filter( explode( '/', (string) $parsed ), 'strlen' ) );
			$path   = implode( ' › ', array_map( 'rawurldecode', $parts ) );
		}

		if ( ! empty( $fields['date'] ) ) {
			// The v1.3 API occasionally emits microseconds that strtotime() chokes on; strip them.
			$ts = strtotime( preg_replace( '/\.\d+/', '', (string) $fields['date'] ) );
			if ( $ts ) {
				$date_label = wp_date( 'M j, Y', $ts );
			}
		}

		// Prefer the highlighted title (strip <mark> since templates render via data-wp-text),
		// falling back to the plain title.default field.
		$highlight_title = $highlight['title'] ?? '';
		if ( is_array( $highlight_title ) ) {
			$highlight_title = implode( ' ', $highlight_title );
		}
		$highlight_title = is_string( $highlight_title )
			? trim( (string) preg_replace( '#</?mark[^>]*>#i', '', $highlight_title ) )
			: '';
		$title           = '' !== $highlight_title
			? $highlight_title
			: (string) ( $fields['title.default'] ?? $fields['title'] ?? '' );

		return array(
			'id'        => (string) ( $raw['result_id'] ?? ( $fields['post_id'] ?? $permalink ) ),
			'title'     => $title,
			'permalink' => $permalink,
			'path'      => $path,
			'dateLabel' => $date_label,
			'imageUrl'  => $image_url,
		);
	}

	/**
	 * Sanitize a URL, adding the https:// scheme if the value is hostless (v1.3
	 * returns `example.com/path/`). Returns an empty string for anything that
	 * isn't an http(s) URL so downstream templates can skip rendering.
	 *
	 * @param string $url Raw URL.
	 * @return string
	 */
	protected static function prefix_https( string $url ): string {
		if ( '' === $url ) {
			return '';
		}
		// Already http(s): pass through the scheme-restricted sanitizer.
		if ( preg_match( '~^https?://~i', $url ) ) {
			$url = esc_url_raw( $url, array( 'http', 'https' ) );
			return $url ? $url : '';
		}
		// Any other scheme (`javascript:`, `data:`, `ftp:`, …) — reject.
		if ( preg_match( '~^[a-z][a-z0-9+.\-]*:~i', $url ) ) {
			return '';
		}
		// Hostless (e.g. `example.com/path/`): promote to https.
		$url = esc_url_raw( 'https://' . ltrim( $url, '/' ), array( 'http', 'https' ) );
		return $url ? $url : '';
	}
}
