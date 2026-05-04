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
	 * Reserved query params that must not be parsed as filter keys. Mirrors
	 * `RESERVED_PARAMS` in store/url-state.js.
	 */
	const RESERVED_QUERY_PARAMS = array( 's', 'orderby', 'min_price', 'max_price' );

	/**
	 * Template slug used for the Jetpack Search page template.
	 *
	 * Intentionally distinct from WordPress's `search` slug so the plugin
	 * template never collides with (and gets deduplicated against) a block
	 * theme's own `search.html`. `search_template_hierarchy` prepends this
	 * slug so it still wins on `/?s=...` requests.
	 */
	const SEARCH_TEMPLATE_SLUG = 'jetpack-search';

	/**
	 * Register block types and hook into WordPress.
	 *
	 * The caller (Initializer) is responsible for gating this behind the
	 * `jetpack_search_blocks_enabled` feature flag.
	 */
	public static function init() {
		add_action( 'init', array( static::class, 'register_blocks' ) );
		add_action( 'init', array( static::class, 'register_search_template' ) );
		add_filter( 'block_categories_all', array( static::class, 'register_block_category' ) );
		add_filter( 'search_template_hierarchy', array( static::class, 'prepend_search_template' ) );
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

		static::register_variations();
		static::register_patterns();
	}

	/**
	 * Register named block variations for the filter-checkbox block.
	 *
	 * PHP-side registration keeps the editor-only JS bundle out of the ESM
	 * pipeline. Variation names and default `taxonomy` / `filterType`
	 * attributes intentionally mirror the filter types exposed by the
	 * instant-search overlay so the two surfaces describe the same filters.
	 */
	protected static function register_variations() {
		if ( ! function_exists( 'register_block_variation' ) ) {
			return;
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
				'description' => __( 'Show checkboxes for a custom taxonomy. Pick which taxonomy in the block settings after inserting.', 'jetpack-search-pkg' ),
				'attributes'  => array(
					'filterType' => 'taxonomy',
					'taxonomy'   => '',
					'label'      => '',
				),
				// Match on filterType only (no taxonomy comparison) so the
				// variation identity survives once the author picks a slug
				// via the inspector. The Category and Tag variations both
				// pin `taxonomy` in their isActive arrays, so WP's
				// most-specific-match resolution still routes those slugs
				// to their dedicated variations — Custom Taxonomy claims
				// every other registered taxonomy.
				'isActive'    => array( 'filterType' ),
			),
		);

		foreach ( $variations as $variation ) {
			// @phan-suppress-next-line PhanUndeclaredFunction -- Guarded by function_exists() above; stub missing from wordpress-stubs.
			register_block_variation( 'jetpack/filter-checkbox', $variation );
		}
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
	 * Build the full search page template content.
	 *
	 * Mirrors the "Blog Search Page" pattern's layout (see
	 * `src/search-blocks/patterns/blog-search.php`) wrapped in header/main/
	 * footer template parts so the plugin-registered template renders the
	 * same page users get from inserting the pattern directly. Markup lives
	 * in `templates/jetpack-search.html` — the canonical block-theme format
	 * for block templates — with a `{{FILTER_HEADING}}` placeholder for the
	 * filter-sidebar heading so that string still goes through `esc_html__()`.
	 *
	 * Memoized: `register_search_template()` runs on every `init`, and the
	 * template markup is identical every request, so read the file and run
	 * the translation substitution once per process.
	 *
	 * @return string Block markup for a complete page template.
	 */
	protected static function get_search_template_content(): string {
		static $content = null;
		if ( null !== $content ) {
			return $content;
		}
		$template_path = __DIR__ . '/templates/jetpack-search.html';
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local, bundled template file; wp_remote_get() is for remote URLs.
		$raw     = is_readable( $template_path ) ? (string) file_get_contents( $template_path ) : '';
		$content = str_replace(
			'{{FILTER_HEADING}}',
			esc_html__( 'Filter options', 'jetpack-search-pkg' ),
			$raw
		);
		return $content;
	}

	/**
	 * Register the Jetpack Search page template with the block-template
	 * registry so it surfaces in the Site Editor's Templates list and can be
	 * resolved via the template hierarchy.
	 *
	 * Uses `register_block_template()` (WP 6.7+). Jetpack requires WP 6.8+,
	 * so the function is always present at runtime — the function_exists
	 * guard is defensive for phpstan/phan and edge environments.
	 *
	 * DB-stored customizations continue to take precedence: if a site owner
	 * edits this template in the Site Editor, the `custom` source wins during
	 * resolution automatically.
	 */
	public static function register_search_template() {
		if ( ! function_exists( 'register_block_template' ) ) {
			return;
		}
		$content = static::get_search_template_content();
		// Skip registration if the bundled template file is missing or
		// unreadable. Since this template's slug is prepended to the
		// search hierarchy, registering with empty content would take
		// over `/?s=...` and render a blank page; bailing here lets core
		// fall through to the theme's `search.html` instead.
		if ( '' === $content ) {
			return;
		}
		register_block_template(
			static::get_parent_plugin_slug() . '//' . self::SEARCH_TEMPLATE_SLUG,
			array(
				'title'       => __( 'Jetpack Search Results', 'jetpack-search-pkg' ),
				'description' => __( 'Displays search results with Jetpack Search filters.', 'jetpack-search-pkg' ),
				'content'     => $content,
			)
		);
	}

	/**
	 * Directory slug of the plugin that should own the template in the
	 * Site Editor UI.
	 *
	 * The Templates list labels plugin-registered templates by looking up an
	 * active plugin whose directory slug matches the namespace portion of
	 * the registered template name. We pick the slug by preference rather
	 * than by install path so that on sites running both the Jetpack
	 * monolith and the standalone Jetpack Search plugin, the more-specific
	 * "Jetpack Search" label always wins:
	 *
	 * - Jetpack Search plugin active → `jetpack-search` → "Jetpack Search"
	 * - Otherwise Jetpack plugin active → `jetpack` → "Jetpack"
	 * - Neither active (unexpected) → `jetpack-search` fallback
	 *
	 * @return string
	 */
	protected static function get_parent_plugin_slug(): string {
		// Helper::get_active_plugins() already centralizes single-site +
		// multisite active-plugin discovery (reads `active_plugins`, unions
		// network-activated plugins from `active_sitewide_plugins`, dedupes).
		// Reuse it so multisite/activation behavior stays consistent across
		// the package if it ever evolves.
		$active    = Helper::get_active_plugins();
		$preferred = array(
			'jetpack-search' => 'jetpack-search/jetpack-search.php',
			'jetpack'        => 'jetpack/jetpack.php',
		);
		foreach ( $preferred as $slug => $plugin_file ) {
			if ( in_array( $plugin_file, $active, true ) ) {
				return $slug;
			}
		}
		return 'jetpack-search';
	}

	/**
	 * Prepend the Jetpack Search template slug to the search template hierarchy
	 * so `/?s=…` requests resolve to our plugin-registered template instead of
	 * the theme's `search.html`.
	 *
	 * Core resolves each slug in order, stopping at the first template it
	 * finds. Because our slug is unique (`jetpack-search`, not `search`), the
	 * theme's `search.html` is never consulted when this prepend is in effect.
	 * Site Editor customizations (stored in the DB keyed by this slug) still
	 * take precedence over the plugin-registered default.
	 *
	 * Existing occurrences of the slug are stripped first so the hierarchy
	 * can't accumulate duplicates from a second init pass or another filter
	 * on the same hook.
	 *
	 * @param string[] $templates Template hierarchy slugs.
	 * @return string[]
	 */
	public static function prepend_search_template( $templates ) {
		$templates = array_values(
			array_filter(
				(array) $templates,
				static function ( $slug ) {
					return self::SEARCH_TEMPLATE_SLUG !== $slug;
				}
			)
		);
		array_unshift( $templates, self::SEARCH_TEMPLATE_SLUG );
		return $templates;
	}

	/**
	 * Seed the Interactivity API store with initial state.
	 *
	 * Individual block render.php files may also call wp_interactivity_state()
	 * — core deep-merges each call, so each block can contribute its own
	 * entries (e.g. filter-checkbox writes its filterConfig). Filter blocks
	 * placed in templates or template parts contribute their config the same
	 * way; the complete registry exists by the time JS hydrates.
	 *
	 * URL-derived `activeFilters` is passed straight through; the JS store
	 * gates it against the complete `filterConfigs` registry on hydration
	 * (see `gateActiveFilters()` in `store/index.js`), so any stray params
	 * don't round-trip back into subsequent search URLs.
	 */
	public static function seed_interactivity_state() {
		if ( ! function_exists( 'wp_interactivity_state' ) ) {
			return;
		}
		wp_interactivity_state(
			'jetpack-search',
			static::build_seed_state( static::collect_filter_configs_from_post() )
		);
	}

	/**
	 * Compose the final seeded state for `wp_interactivity_state()`.
	 *
	 * `activeFilters` is passed through from the URL — the JS store gates
	 * against the complete `filterConfigs` registry on hydration.
	 *
	 * @param array<string, array<string, mixed>> $filter_configs Map of filter
	 *   configs collected from the current post (or injected by tests).
	 * @return array<string, mixed>
	 */
	public static function build_seed_state( array $filter_configs ): array {
		$state                  = static::build_initial_state();
		$state['filterConfigs'] = $filter_configs;
		return $state;
	}

	/**
	 * Walk the current post's block tree for jetpack/filter-checkbox blocks
	 * and build the matching filterConfigs map.
	 *
	 * Covers the common case where a page uses the Blog Search Page pattern
	 * (or blocks inserted directly into $post->post_content). Template-part
	 * / block-theme scans are not performed here — a filter block placed
	 * inside a template part will still work, but its config won't be
	 * available to the search-results SSR until hydration.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	protected static function collect_filter_configs_from_post(): array {
		if ( ! function_exists( 'get_post' ) || ! function_exists( 'parse_blocks' ) ) {
			return array();
		}
		// Bail if any helper is missing — half-loaded feature would ship inconsistent filterConfigs.
		foreach ( static::filter_block_helpers() as $helper ) {
			if ( ! class_exists( $helper ) ) {
				return array();
			}
		}
		$post = get_post();
		if ( ! $post || empty( $post->post_content ) ) {
			return array();
		}
		$configs = array();
		static::walk_blocks_for_filter_configs( parse_blocks( $post->post_content ), $configs );
		return $configs;
	}

	/**
	 * Map of filter block name → helper class. Add a new filter block type
	 * by appending one entry here.
	 *
	 * @return array<string, class-string>
	 */
	protected static function filter_block_helpers(): array {
		return array(
			'jetpack/filter-checkbox' => Filter_Checkbox::class,
			'jetpack/filter-date'     => Filter_Date::class,
		);
	}

	/**
	 * Recursively walk a parsed block tree, pushing each filter block's
	 * config into `$configs` by reference.
	 *
	 * @param array $blocks  Parsed block tree from parse_blocks().
	 * @param array $configs Accumulator map keyed by filterKey.
	 * @return void
	 */
	protected static function walk_blocks_for_filter_configs( array $blocks, array &$configs ): void {
		$helpers = static::filter_block_helpers();
		foreach ( $blocks as $block ) {
			if ( ! is_array( $block ) ) {
				continue;
			}
			$block_name = (string) ( $block['blockName'] ?? '' );
			if ( isset( $helpers[ $block_name ] ) ) {
				$helper = $helpers[ $block_name ];
				$attrs  = (array) ( $block['attrs'] ?? array() );
				$key    = $helper::derive_filter_key( $attrs );
				if ( '' !== $key ) {
					$configs[ $key ] = $helper::build_config( $attrs, $key );
				}
			}
			if ( ! empty( $block['innerBlocks'] ) && is_array( $block['innerBlocks'] ) ) {
				static::walk_blocks_for_filter_configs( $block['innerBlocks'], $configs );
			}
		}
	}

	/**
	 * Build the initial state array for the jetpack-search Interactivity API store.
	 *
	 * @return array<string, mixed>
	 */
	public static function build_initial_state() {
		$is_private     = class_exists( Status::class ) ? ( new Status() )->is_private_site() : false;
		$is_wpcom       = class_exists( Helper::class ) ? Helper::is_wpcom() : false;
		$site_id        = class_exists( Helper::class ) ? Helper::get_wpcom_site_id() : 0;
		$search_query   = function_exists( 'get_search_query' ) ? (string) get_search_query() : '';
		$active_filters = static::parse_url_filters();
		$price_range    = static::parse_url_price_range();

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
			// /?s=boots&orderby=newest&category[]=news renders correctly on
			// first paint.
			'searchQuery'   => $search_query,
			'sortOrder'     => static::parse_url_sort(),
			'activeFilters' => $active_filters,
			'priceRange'    => $price_range,

			// filterConfigs: each filter-checkbox block's render.php merges its
			// own entry here. Shape: { [filterKey]: { filterKey, filterType,
			// taxonomy, label, showCount, maxItems } }.
			'filterConfigs' => array(),

			// Results + aggregations are populated by the JS store on hydration —
			// seed empty defaults so template bindings always have a shape to read.
			// `aggregations` is a stdClass so JS sees `{}`, not `[]`.
			'results'       => array(),
			'aggregations'  => (object) array(),
			'totalResults'  => 0,
			'pageHandle'    => null,

			// UI state. `isLoading` is seeded true when the URL carries a
			// search query or filter selection so the no-results block stays
			// hidden between first paint and JS hydrating the initial fetch —
			// otherwise a "No results found" flash appears on deep links.
			'isLoading'     => '' !== $search_query || ! empty( $active_filters ) || null !== $price_range,
			'isLoadingMore' => false,
			'hasError'      => false,

			// Translated view-bundle strings. The Interactivity API view bundle
			// can't import @wordpress/i18n (only @wordpress/interactivity is
			// registered as a script module), so any JS-produced text is seeded
			// here and read via state.strings.* on the client. Both _n() forms
			// are seeded so the client can pick based on the live totalResults
			// without a round trip; languages with more than two plural forms
			// degrade to "plural for all count > 1" as an accepted tradeoff.
			'strings'       => static::build_initial_strings(),
		);
	}

	/**
	 * Seed translated view-bundle strings for the Interactivity API store.
	 *
	 * @return array<string, string>
	 */
	protected static function build_initial_strings(): array {
		if ( ! function_exists( '__' ) || ! function_exists( '_n' ) ) {
			return array(
				'searching'          => 'Searching…',
				'resultsCountSingle' => 'Found %d result',
				'resultsCountPlural' => 'Found %d results',
				'removeFilter'       => 'Remove %s',
			);
		}
		return array(
			'searching'          => __( 'Searching…', 'jetpack-search-pkg' ),
			/* translators: %d: number of results. */
			'resultsCountSingle' => _n( 'Found %d result', 'Found %d results', 1, 'jetpack-search-pkg' ),
			/* translators: %d: number of results. */
			'resultsCountPlural' => _n( 'Found %d result', 'Found %d results', 2, 'jetpack-search-pkg' ),
			/* translators: %s: filter label (e.g. "Category: News"). Announced by screen readers when focus lands on a filter pill's remove button. */
			'removeFilter'       => __( 'Remove %s', 'jetpack-search-pkg' ),
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
	 * Parse the price range from the URL, mirroring the contract in
	 * src/search-blocks/store/url-state.js. Either bound may be null for a
	 * half-open range; non-numeric or negative values yield null so a
	 * garbage URL can't drive the API into producing zero results.
	 *
	 * Returns null when neither bound is set, so callers can early-out
	 * without checking individual fields.
	 *
	 * @return array{min: float|null, max: float|null}|null
	 */
	protected static function parse_url_price_range(): ?array {
		// phpcs:disable WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized,WordPress.Security.ValidatedSanitizedInput.MissingUnslash -- read-only URL state; coerced to float in parse_price_bound() which discards any non-numeric input.
		$min = self::parse_price_bound( $_GET['min_price'] ?? null );
		$max = self::parse_price_bound( $_GET['max_price'] ?? null );
		// phpcs:enable

		if ( null === $min && null === $max ) {
			return null;
		}
		// Both bounds present but inverted (min > max) yields an empty ES
		// `range` clause that returns zero results silently. Treat the URL
		// as garbage and bail so the page renders a normal (unfiltered)
		// search rather than a guaranteed-empty one. Mirrors the same
		// rejection in store/url-state.js.
		if ( null !== $min && null !== $max && $min > $max ) {
			return null;
		}
		return array(
			'min' => $min,
			'max' => $max,
		);
	}

	/**
	 * Coerce a single price-range URL value into a finite, non-negative float.
	 *
	 * @param mixed $raw Raw value pulled from $_GET.
	 * @return float|null
	 */
	private static function parse_price_bound( $raw ): ?float {
		if ( null === $raw || '' === $raw || ! is_scalar( $raw ) ) {
			return null;
		}
		// `is_numeric` rejects partially-numeric strings like "1.5.3" that
		// the (float) cast would silently extract as 1.5 — JS's Number()
		// returns NaN for the same input, so without this gate the PHP
		// initial render and JS hydration disagree on parsed value.
		$raw = wp_unslash( $raw );
		if ( ! is_numeric( $raw ) ) {
			return null;
		}
		$num = (float) $raw;
		if ( ! is_finite( $num ) || $num < 0 ) {
			return null;
		}
		return $num;
	}

	/**
	 * Parse flat filter selections from the current request URL.
	 *
	 * Accepts any top-level array-shaped `?<filterKey>[]=<value>` param
	 * (the same shape store/url-state.js writes) and returns an
	 * { [filterKey]: string[] } map. The JS layer drops filters whose keys
	 * are not registered in `filterConfigs`; doing the same here would
	 * require access to block attributes at state-seed time (before blocks
	 * render), which we don't have. Values are sanitized so any garbage
	 * round-tripped through the URL never reaches ES.
	 *
	 * @return array<string, string[]>
	 */
	protected static function parse_url_filters(): array {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- read-only URL state; sanitized per-value below.
		$raw = wp_unslash( $_GET );
		if ( ! is_array( $raw ) ) {
			return array();
		}

		$out = array();
		foreach ( $raw as $key => $values ) {
			$filter_key = sanitize_key( (string) $key );
			if ( '' === $filter_key || in_array( $filter_key, self::RESERVED_QUERY_PARAMS, true ) ) {
				continue;
			}
			if ( ! is_array( $values ) ) {
				continue;
			}
			$clean = array_values(
				array_filter(
					array_map( 'sanitize_text_field', $values ),
					static function ( $v ) {
						return '' !== $v;
					}
				)
			);
			if ( $clean ) {
				$out[ $filter_key ] = $clean;
			}
		}
		return $out;
	}
}
