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
	 *
	 * Includes both `s` (used on the WP search route) and `q` (used by the
	 * inline blocks on non-search pages, see `get_search_param_name()`) so
	 * neither name can be misread as a filter key.
	 */
	const RESERVED_QUERY_PARAMS = array( 's', 'q', 'orderby', 'min_price', 'max_price' );

	/**
	 * URL param the inline search blocks use to carry the query string when
	 * embedded on a non-search page (e.g. `/about/?q=boots`). On the WP
	 * search route (`is_search()`) the canonical `s` key is used instead.
	 *
	 * The non-`s` name on singular pages is what dodges core's
	 * `WP_Query::get_posts()` AND'ing a `post_content LIKE` clause into the
	 * singular page lookup and 404'ing the page on refresh. `q` matches the
	 * de-facto search-URL convention (Google, GitHub, Wikipedia, etc.) so
	 * shared links read naturally. See
	 * `docs/explorations/embedded-search-refresh-404.md` (RSM-1754).
	 */
	const NON_SEARCH_QUERY_PARAM = 'q';

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
	 * Per-request memo backing `is_initial_loading()`. Lifted out of the
	 * method's local `static` so tests can clear it between cases via
	 * `reset_initial_loading_cache()` — function-local statics aren't
	 * reachable from outside the function, so they'd otherwise leak the
	 * first test's URL state into every subsequent test in the same
	 * PHPUnit process.
	 *
	 * @var bool|null
	 */
	private static $is_initial_loading_cache = null;

	/**
	 * Per-request memo backing `is_free_plan()`. Block render callbacks
	 * (`search-results`, `powered-by`) call into the plan gate on every
	 * inner render, including the auto-injected colophon path. WP's option
	 * cache absorbs the redundancy in steady state, but on a cold cache
	 * `Plan::get_plan_info()` falls back to a synchronous WPCOM HTTP call —
	 * memoizing here fences that hazard to a single well-known site per
	 * request.
	 *
	 * @var bool|null
	 */
	private static $is_free_plan_cache = null;

	/**
	 * Per-request memo backing `is_woocommerce_active()`. Centralized here
	 * (rather than inside any one WC-aware block helper) so every gate that
	 * needs the answer — block-registration filters that hide WC-only blocks
	 * on non-Woo sites, render callbacks that drop product-format sort keys,
	 * the editor-side localized config, the Interactivity store seed —
	 * shares the same `class_exists()` probe.
	 *
	 * @var bool|null
	 */
	private static $is_woocommerce_active_cache = null;

	/**
	 * Register block types and hook into WordPress.
	 *
	 * Two gates apply:
	 *
	 * 1. The caller (Initializer) gates the whole method behind the
	 *    `jetpack_search_blocks_enabled` feature flag — when off, the blocks
	 *    don't exist at all.
	 * 2. Within this method, only the *template-takeover* surface (registering
	 *    the Jetpack Search block template and prepending it to
	 *    `search_template_hierarchy`) is additionally gated on the saved
	 *    experience being `'embedded'`. Everything else — block registration,
	 *    editor assets, and Interactivity API state seeding — runs whenever
	 *    the feature flag is on, since admins can insert Search blocks
	 *    anywhere blocks are configurable (post content, sidebar widgets,
	 *    custom templates) regardless of which experience the dashboard has
	 *    saved. Those blocks need the seeded base state (`apiRoot`, `nonce`,
	 *    URL-derived `searchQuery` / `activeFilters`, `filterConfigs` slot,
	 *    etc.) to hydrate; per-block `render.php` files only contribute their
	 *    own config and rely on the global seed for the base.
	 *
	 * Why the template gate: with four experiences (`embedded` / `overlay` /
	 * `inline` / `off`), only Embedded should override the theme's
	 * `search.html`. A site that saves Overlay or Inline still expects
	 * `/?s=…` to resolve through the theme — the Jetpack template is the
	 * right answer only when the user has explicitly opted into the
	 * block-built search page.
	 *
	 * `Module_Control::get_experience()` reads `get_option( 'jetpack_search_experience' )`
	 * (object-cached) and falls back to deriving from the legacy booleans, so
	 * this is cheap on every request. `update_experience()` writes the option
	 * synchronously, so the next request after a save sees the new gate.
	 */
	public static function init() {
		add_action( 'init', array( static::class, 'register_blocks' ) );
		add_filter( 'block_categories_all', array( static::class, 'register_block_category' ) );
		add_action( 'enqueue_block_editor_assets', array( static::class, 'enqueue_editor_assets' ) );
		// FSE block-template rendering runs *before* `wp_head()` (see
		// `wp-includes/template-canvas.php`), so blocks would resolve
		// `data-wp-bind` / `data-wp-text` against an unseeded IA store if we
		// only hooked `wp_enqueue_scripts`. Seeding on `template_redirect`
		// closes that gap; the second call from `wp_enqueue_scripts` is a
		// deep-merge no-op and keeps classic-theme paths covered.
		add_action( 'template_redirect', array( static::class, 'seed_interactivity_state' ) );
		add_action( 'wp_enqueue_scripts', array( static::class, 'seed_interactivity_state' ) );

		if ( Module_Control::EXPERIENCE_EMBEDDED === ( new Module_Control() )->get_experience() ) {
			add_action( 'init', array( static::class, 'register_search_template' ) );
			add_filter( 'search_template_hierarchy', array( static::class, 'prepend_search_template' ) );
		}
	}

	/**
	 * Per-request memoized read of `Plan::is_free_plan()`. Use from any
	 * block render callback that needs the plan gate — avoids paying the
	 * `get_option()` array-parse cost on every block, and ensures the
	 * cold-cache WPCOM round-trip in `Plan::get_plan_info()` happens at
	 * most once per request even when several blocks ask.
	 *
	 * @return bool
	 */
	public static function is_free_plan(): bool {
		if ( null === self::$is_free_plan_cache ) {
			self::$is_free_plan_cache = ( new Plan() )->is_free_plan();
		}
		return self::$is_free_plan_cache;
	}

	/**
	 * Reset the `is_free_plan()` memo. Tests only — production callers
	 * should never need this; the boolean state of the site's plan
	 * doesn't change inside a single request.
	 */
	public static function reset_is_free_plan_cache() {
		self::$is_free_plan_cache = null;
	}

	/**
	 * Whether WooCommerce is loaded on this site. Use from any gate that
	 * needs to skip a WC-only feature (block registration of `filter-wc-*`
	 * blocks, the product-format sort keys on `results-sort`, etc.). The
	 * result is memoized per-request so adding a new caller doesn't
	 * multiply autoloader probes.
	 *
	 * **Load-order contract:** must be called at or after `plugins_loaded`.
	 * WooCommerce includes its main `WooCommerce` class only when its plugin
	 * file runs (during `plugins_loaded`), so an earlier call would return
	 * false on a WC site. Every existing caller fires from a hook later than
	 * that — `enqueue_block_editor_assets`, `template_redirect`,
	 * `wp_enqueue_scripts`, or block render — so the contract is naturally
	 * satisfied. New callers earlier in the request lifecycle should defer
	 * the probe to a `plugins_loaded`-or-later hook.
	 *
	 * **Filter:** `jetpack_search_blocks_is_woocommerce_active` lets a site
	 * force the gate either way — e.g. a WC site that wants to hide
	 * WC-only Search blocks from a non-shop content area, or a non-Woo
	 * site that wants to render WC-only blocks for a staging preview.
	 * Filter fires once per request, before the result is memoized, so a
	 * filter that probes the database or another expensive condition pays
	 * its cost once and is then served from the cache for the remainder
	 * of the request.
	 *
	 * @return bool
	 */
	public static function is_woocommerce_active(): bool {
		if ( null === self::$is_woocommerce_active_cache ) {
			// Pass `false` so a missing class doesn't fire the autoloader
			// on non-Woo sites — the gate is hit on every request, and
			// any upstream autoloader work is wasted when the answer is "no".
			$probed = class_exists( 'WooCommerce', false );

			/**
			 * Override whether Jetpack Search treats WooCommerce as active.
			 *
			 * Cast to bool before caching so a filter returning a truthy
			 * non-bool (e.g. `1`) doesn't poison strictly-typed callers.
			 *
			 * @since 0.59.0
			 *
			 * @param bool $is_active Result of the WooCommerce class probe.
			 */
			self::$is_woocommerce_active_cache = (bool) apply_filters(
				'jetpack_search_blocks_is_woocommerce_active',
				$probed
			);
		}
		return self::$is_woocommerce_active_cache;
	}

	/**
	 * Force the `is_woocommerce_active()` answer to a specific boolean —
	 * tests only. Pass `null` to clear the override and revive the real
	 * `class_exists()` probe (also done by `reset_is_woocommerce_active_cache()`).
	 *
	 * @internal
	 *
	 * @param bool|null $value Forced answer or null to clear.
	 */
	public static function set_is_woocommerce_active_for_testing( ?bool $value ): void {
		self::$is_woocommerce_active_cache = $value;
	}

	/**
	 * Reset the `is_woocommerce_active()` memo. Tests only.
	 *
	 * @internal
	 */
	public static function reset_is_woocommerce_active_cache(): void {
		self::$is_woocommerce_active_cache = null;
	}

	/**
	 * Canonical list of WooCommerce-only block names. Single source of
	 * truth for the WC-only gate applied to block registration
	 * (`register_blocks()`), the `filter_block_helpers()` map, and the
	 * editor's `register-blocks.js` bundle (read after being localized
	 * onto `window.JetpackSearchBlocksConfig.woocommerceOnlyBlocks` in
	 * `enqueue_editor_assets()`).
	 *
	 * Add a new WC-only block by appending one entry — every gate picks
	 * it up automatically. Names are full namespaced names (not bare
	 * slugs) so the list reads identically to what `BLOCKS` contains in
	 * `register-blocks.js` and what `filter_block_helpers()` keys against.
	 *
	 * @return string[]
	 */
	public static function woocommerce_only_block_names(): array {
		return array(
			'jetpack-search/filter-wc-attribute',
			'jetpack-search/filter-wc-price',
			'jetpack-search/filter-wc-rating',
			'jetpack-search/filter-wc-stock-status',
			'jetpack-search/filters-product',
		);
	}

	/**
	 * Whether a block name (or block-directory basename) belongs to a
	 * WooCommerce-only block. Membership is decided by exact match against
	 * `woocommerce_only_block_names()`; either form (full namespaced name
	 * or bare directory basename) works because `register_blocks()` walks
	 * directory basenames while the helpers map and editor bundle hold
	 * full names.
	 *
	 * @param string $block_name Full block name (`jetpack-search/filter-wc-rating`)
	 *                           or bare directory basename (`filter-wc-rating`).
	 * @return bool
	 */
	public static function is_woocommerce_only_block( string $block_name ): bool {
		$candidate = false === strpos( $block_name, '/' )
			? 'jetpack-search/' . $block_name
			: $block_name;
		return in_array( $candidate, self::woocommerce_only_block_names(), true );
	}

	/**
	 * URL param key the inline search experience uses for the current request.
	 *
	 * On WP's search route (`is_search()`) the canonical `s` key is used so
	 * the blocks interoperate with core's search routing, body classes, and
	 * any theme/plugin code keyed off `s`. On non-search pages — singular
	 * permalinks, archives, the front page — the blocks switch to
	 * `NON_SEARCH_QUERY_PARAM` (`q`) so a refresh of an inline-search URL
	 * like `/about/?q=boots` doesn't trip core's `WP_Query::get_posts()`
	 * `post_content LIKE` AND clause and 404 the page.
	 *
	 * @return string
	 */
	public static function get_search_param_name(): string {
		return function_exists( 'is_search' ) && is_search() ? 's' : self::NON_SEARCH_QUERY_PARAM;
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

		// Surface the WC gate to the editor bundle. `isWooCommerceActive`
		// drives per-component branches (e.g. the results-sort inspector
		// hiding product-format checkboxes, the results-list inspector
		// hiding the Product layout) and the `register-blocks.js`
		// registration loop. `woocommerceOnlyBlocks` is the canonical
		// list the registration loop intersects with — keeping it
		// localized (rather than duplicated in JS) means
		// `Search_Blocks::woocommerce_only_block_names()` is the single
		// source of truth across the PHP and JS sides.
		// `wp_add_inline_script` (rather than `wp_localize_script`) per
		// core ticket #25280 — the latter HTML-encodes ampersands inside
		// nested values.
		wp_add_inline_script(
			'jetpack-search-blocks-register',
			'window.JetpackSearchBlocksConfig = ' . wp_json_encode(
				array(
					'isWooCommerceActive'   => self::is_woocommerce_active(),
					'woocommerceOnlyBlocks' => self::woocommerce_only_block_names(),
				),
				JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
			) . ';',
			'before'
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

		$is_wc = self::is_woocommerce_active();
		foreach ( $block_dirs as $block_dir ) {
			if ( ! file_exists( $block_dir . '/block.json' ) ) {
				continue;
			}
			if ( ! $is_wc && self::is_woocommerce_only_block( basename( $block_dir ) ) ) {
				continue;
			}
			register_block_type( $block_dir );
		}

		add_filter( 'get_block_type_variations', array( static::class, 'inject_filter_checkbox_variations' ), 10, 2 );
		static::register_patterns();
	}

	/**
	 * Inject named block variations for the filter-checkbox block.
	 *
	 * Hooks `get_block_type_variations` (added in WP 6.5) rather than calling
	 * `register_block_variation()` because the latter is a JS-only API; no
	 * matching PHP function exists in WordPress core. Filtering on the block
	 * type's own variations getter is the supported PHP-side path and keeps
	 * the editor-only JS bundle out of the ESM pipeline. Jetpack already
	 * requires WP 6.8+, so the hook is always live in supported environments.
	 *
	 * Variation names and default `taxonomy` / `filterType` attributes
	 * intentionally mirror the filter types exposed by the instant-search
	 * overlay so the two surfaces describe the same filters.
	 *
	 * @param array          $variations Variations registered on the block type.
	 * @param \WP_Block_Type $block_type Block type the filter is being applied to.
	 * @return array
	 */
	public static function inject_filter_checkbox_variations( $variations, $block_type ) {
		if ( ! isset( $block_type->name ) || 'jetpack-search/filter-checkbox' !== $block_type->name ) {
			return $variations;
		}

		$additions = array(
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
		);

		// WC-only product taxonomies. Gated on `is_woocommerce_active()` so
		// they don't appear in the inserter on non-Woo sites where the
		// taxonomies happen to exist via another plugin (or a previous WC
		// install that left them registered). `product_brand` layers an
		// extra `taxonomy_exists()` probe on top because it isn't a core WC
		// taxonomy — extensions like WC Brands / Perfect Brands / recent
		// bundled WC versions provide it. The three product variations stay
		// grouped before `custom_taxonomy` below so the inserter renders
		// them as a contiguous cluster.
		if ( self::is_woocommerce_active() ) {
			$additions[] = array(
				'name'        => 'product_cat',
				'title'       => __( 'Filter by Product Category', 'jetpack-search-pkg' ),
				'description' => __( 'Show product category checkboxes with live result counts.', 'jetpack-search-pkg' ),
				'attributes'  => array(
					'filterType' => 'taxonomy',
					'taxonomy'   => 'product_cat',
					'label'      => __( 'Product Category', 'jetpack-search-pkg' ),
				),
				'isActive'    => array( 'filterType', 'taxonomy' ),
			);
			$additions[] = array(
				'name'        => 'product_tag',
				'title'       => __( 'Filter by Product Tag', 'jetpack-search-pkg' ),
				'description' => __( 'Show product tag checkboxes with live result counts.', 'jetpack-search-pkg' ),
				'attributes'  => array(
					'filterType' => 'taxonomy',
					'taxonomy'   => 'product_tag',
					'label'      => __( 'Product Tag', 'jetpack-search-pkg' ),
				),
				'isActive'    => array( 'filterType', 'taxonomy' ),
			);
			if ( taxonomy_exists( 'product_brand' ) ) {
				$additions[] = array(
					'name'        => 'product_brand',
					'title'       => __( 'Filter by Product Brand', 'jetpack-search-pkg' ),
					'description' => __( 'Show product brand checkboxes with live result counts.', 'jetpack-search-pkg' ),
					'attributes'  => array(
						'filterType' => 'taxonomy',
						'taxonomy'   => 'product_brand',
						'label'      => __( 'Product Brand', 'jetpack-search-pkg' ),
					),
					'isActive'    => array( 'filterType', 'taxonomy' ),
				);
			}
		}

		$additions[] = array(
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
			// via the inspector. Category, Tag, and the product taxonomy
			// variations all pin `taxonomy` in their isActive arrays, so
			// WP's most-specific-match resolution still routes those
			// slugs to their dedicated variations — Custom Taxonomy
			// claims every other registered taxonomy.
			'isActive'    => array( 'filterType' ),
		);

		// Merge by `name` so a variation already registered upstream (block.json
		// or a higher-priority filter) wins over our preset of the same name —
		// `array_merge` would otherwise append duplicates and the inserter
		// would render two cards for the same variation.
		$variations    = (array) $variations;
		$existing_keys = array_flip( array_column( $variations, 'name' ) );
		foreach ( $additions as $variation ) {
			if ( ! isset( $existing_keys[ $variation['name'] ] ) ) {
				$variations[] = $variation;
			}
		}
		return $variations;
	}

	/**
	 * Register block patterns.
	 *
	 * Convention: a pattern file whose basename starts with `wc-` composes
	 * WooCommerce-only blocks and is loaded only when WC is active. Mirrors
	 * the `filter-wc-*` block-slug convention so a new WC-only pattern
	 * auto-enrolls in the gate without an extra registration step.
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
		$is_wc = self::is_woocommerce_active();
		foreach ( $pattern_files as $pattern_file ) {
			if ( ! $is_wc && 0 === strpos( basename( $pattern_file ), 'wc-' ) ) {
				continue;
			}
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
	 * Walk the current post's block tree for jetpack-search/filter-checkbox blocks
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
		$helpers = array(
			'jetpack-search/filter-checkbox'        => Filter_Checkbox::class,
			'jetpack-search/filter-date'            => Filter_Date::class,
			'jetpack-search/filter-wc-rating'       => Filter_Wc_Rating::class,
			'jetpack-search/filter-wc-attribute'    => Filter_Wc_Attribute::class,
			'jetpack-search/filter-wc-stock-status' => Search_Product_Filter_Status::class,
		);
		if ( self::is_woocommerce_active() ) {
			return $helpers;
		}
		// On non-Woo sites the WC-only blocks aren't registered (see
		// `register_blocks()`), so any saved instance in post content has no
		// renderer. Drop them from the helper map too — that keeps the
		// filter-config walk symmetrical with what the inserter offers.
		foreach ( array_keys( $helpers ) as $name ) {
			if ( self::is_woocommerce_only_block( $name ) ) {
				unset( $helpers[ $name ] );
			}
		}
		return $helpers;
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
		$is_private         = class_exists( Status::class ) ? ( new Status() )->is_private_site() : false;
		$is_wpcom           = class_exists( Helper::class ) ? Helper::is_wpcom() : false;
		$site_id            = class_exists( Helper::class ) ? Helper::get_wpcom_site_id() : 0;
		$search_query       = static::parse_url_search_query();
		$active_filters     = static::parse_url_filters();
		$filter_logic       = static::parse_url_filter_logic( $active_filters );
		$price_range        = static::parse_url_price_range();
		$is_initial_loading = static::is_initial_loading();
		$searching_text     = function_exists( '__' ) ? __( 'Searching…', 'jetpack-search-pkg' ) : 'Searching…';

		return array(
			// Connection / routing config.
			'siteId'                => $site_id,
			'apiRoot'               => function_exists( 'rest_url' ) ? esc_url_raw( rest_url() ) : '',
			'nonce'                 => function_exists( 'wp_create_nonce' ) ? wp_create_nonce( 'wp_rest' ) : '',
			'isPrivateSite'         => $is_private,
			'isWpcom'               => $is_wpcom,
			// Whether the product-format sort keys (rating, price asc/desc)
			// are valid on this site, plus a JS-side gate any WC-only block
			// can read. The store threads it into url-state so a
			// `?orderby=price_asc` deep link round-trips on Woo sites and
			// collapses to relevance everywhere else.
			'isWooCommerceActive'   => self::is_woocommerce_active(),
			'homeUrl'               => function_exists( 'home_url' ) ? home_url() : '',
			// BCP47-ish locale (e.g. `en-US`) for Intl.DateTimeFormat on the
			// client. Converts WP's `en_US` underscore form. Uses the blog
			// locale (site setting) rather than the viewer's user-profile
			// locale so formatting is consistent for logged-out visitors
			// hitting a search page.
			'locale'                => function_exists( 'get_locale' )
				? str_replace( '_', '-', get_locale() )
				: 'en-US',

			// Search state, seeded from the URL so a deep link like
			// /?s=boots&orderby=newest&category[]=news renders correctly on
			// first paint.
			'searchQuery'           => $search_query,
			// URL key the JS store uses to read/write the search query. `s`
			// on the WP search route, `q` on non-search pages — see
			// `get_search_param_name()`. Threaded through the seed so the JS
			// store reads from the same key the seed pulled `searchQuery`
			// from.
			'searchParamName'       => static::get_search_param_name(),
			'sortOrder'             => static::parse_url_sort(),
			'activeFilters'         => $active_filters,
			'filterLogic'           => $filter_logic,
			'priceRange'            => $price_range,

			// filterConfigs: each filter-checkbox block's render.php merges its
			// own entry here. Shape: { [filterKey]: { filterKey, filterType,
			// taxonomy, label, showCount, maxItems } }.
			'filterConfigs'         => array(),

			// Note: `staticPostTypes` (contributed by `jetpack-search/filter-post-type`)
			// is intentionally NOT seeded here. FSE block templates can render
			// before `wp_enqueue_scripts` fires (where this seed runs), so
			// pre-seeding the slot with `{ include: [], exclude: [] }` would
			// merge AFTER the block contribution and clobber it. Letting
			// render.php own the slot keeps template-rendered blocks working;
			// the JS reader treats `state.staticPostTypes` undefined as
			// "no constraint" via Array.isArray() checks in store/api.js.

			// Results + aggregations are populated by the JS store on hydration —
			// seed empty defaults so template bindings always have a shape to read.
			// `aggregations` is a stdClass so JS sees `{}`, not `[]`.
			'results'               => array(),
			'aggregations'          => (object) array(),
			// Per-filter union of values seen across the session's aggregation
			// responses. The JS store appends to this on each successful fetch
			// so checkbox-filter lists can keep options visible even after a
			// narrower query drops them from ES results.
			'retainedFilterOptions' => (object) array(),
			'totalResults'          => 0,
			'pageHandle'            => null,

			// UI state. `isLoading` is seeded true when the URL carries a
			// search query or filter selection so the empty-state region inside
			// `jetpack-search/results-list` stays hidden between first paint and JS
			// hydrating the initial fetch — otherwise a "No results found" flash
			// appears on deep links.
			'isLoading'             => $is_initial_loading,
			'isLoadingMore'         => false,
			'hasError'              => false,

			// One-shot pre-hydration skeleton gate. The IA SSR pass evaluates
			// `data-wp-bind--hidden` against literal seeded values (it can't
			// run JS getters), so skeleton elements bind directly to this
			// boolean. JS flips it to true once `actions.search()` resolves
			// and never resets it — subsequent re-searches keep live results
			// on screen without re-flashing placeholders.
			'skeletonHidden'        => false,

			// Seeded so the SSR pass can resolve `data-wp-text` to a real
			// string on first paint; `actions.search()` keeps it in lockstep
			// with `isLoading` / `totalResults` via `computeResultsCountText`.
			'resultsCountText'      => $is_initial_loading ? $searching_text : '',

			// Translated view-bundle strings. The Interactivity API view bundle
			// can't import @wordpress/i18n (only @wordpress/interactivity is
			// registered as a script module), so any JS-produced text is seeded
			// here and read via state.strings.* on the client. Both _n() forms
			// are seeded so the client can pick based on the live totalResults
			// without a round trip; languages with more than two plural forms
			// degrade to "plural for all count > 1" as an accepted tradeoff.
			'strings'               => static::build_initial_strings(),

			// Currency symbol displayed inside the price filter pill rendered
			// by the active-filters block. Defaults to `$`; the price block's
			// render.php overrides this with the author's currencySymbol
			// attribute so a single chip on the page reflects whatever symbol
			// the price input itself uses. The stored numeric value stays
			// locale-agnostic — only the display string carries the symbol.
			'priceCurrencySymbol'   => '$',

			// Display labels for `wc_stock_status` selections, keyed by slug.
			// Seeded from the status block's static option list so an active-
			// filters chip for "instock" reads "In stock" rather than the raw
			// slug. RSM-1932 will swap this with WC's translated labels so
			// non-English locales render correctly; the map shape stays the
			// same.
			'wcStockStatusLabels'   => static::build_stock_status_labels(),
		);
	}

	/**
	 * Slug → display label map for `wc_stock_status` selections, used by the
	 * active-filters block to render product-aware chips.
	 *
	 * Sourced from the status block's `get_options()` so there's one source of
	 * truth for the label set; in RSM-1932 we'll switch to WC's translated
	 * labels (`wc_get_product_stock_status_options()`) without changing this
	 * shape. Returns an empty array when the status helper class isn't loaded
	 * — defensive for environments that pull the search package in isolation
	 * (tests, partial installs, or sites where the status block PR hasn't
	 * landed yet).
	 *
	 * @return array<string, string>
	 */
	protected static function build_stock_status_labels(): array {
		if ( ! class_exists( Search_Product_Filter_Status::class ) ) {
			return array();
		}
		$labels = array();
		foreach ( Search_Product_Filter_Status::get_options() as $option ) {
			$value = (string) ( $option['value'] ?? '' );
			if ( '' === $value ) {
				continue;
			}
			$labels[ $value ] = (string) ( $option['label'] ?? $value );
		}
		return $labels;
	}

	/**
	 * Whether the page starts in a loading state — i.e. the URL carries a
	 * search query, filter selection, or price range, so the JS store will
	 * fire an initial fetch on hydration.
	 *
	 * Render.php callers branch on this to emit pre-hydration affordances
	 * (skeleton placeholders, seeded "Searching…" text). The value is derived
	 * from the request URL rather than read back through
	 * `wp_interactivity_state()` because in block themes individual block
	 * renders can run before `seed_interactivity_state()` finishes (FSE
	 * pre-resolves template attributes by walking blocks before the
	 * `wp_enqueue_scripts` hook fires) — so a state-read fallback would
	 * silently return false on the very pages this helper is meant to flag.
	 * The condition mirrors the `isLoading` value seeded into
	 * `build_initial_state()` exactly so PHP-time and JS-side answers stay
	 * in lockstep.
	 *
	 * @return bool
	 */
	public static function is_initial_loading(): bool {
		// Memoize per-request: the URL doesn't change mid-request, and this
		// helper is hit by every block render.php (one per filter block plus
		// search-results, results-count, etc.) AND by `build_initial_state()`,
		// each of which would otherwise re-parse `$_GET` independently.
		if ( null !== self::$is_initial_loading_cache ) {
			return self::$is_initial_loading_cache;
		}
		$search_query = static::parse_url_search_query();
		if ( '' !== $search_query ) {
			self::$is_initial_loading_cache = true;
			return true;
		}
		if ( ! empty( static::parse_url_filters() ) ) {
			self::$is_initial_loading_cache = true;
			return true;
		}
		self::$is_initial_loading_cache = null !== static::parse_url_price_range();
		return self::$is_initial_loading_cache;
	}

	/**
	 * Reset the `is_initial_loading()` memo. Test-only — production WP runs
	 * a single request per process, so the memo never needs clearing there.
	 * The PHPUnit harness reuses one process across every test method, so
	 * without this hook a `$_GET` set by an earlier test would pin the
	 * memoized value and silently override later tests' URL fixtures.
	 *
	 * Guarded so a misconfigured production caller can't accidentally drop
	 * the cache mid-request: bail when running under WordPress (`ABSPATH`
	 * defined) but not under PHPUnit (`PHPUNIT_COMPOSER_INSTALL` is set by
	 * PHPUnit's composer-installed autoloader).
	 */
	public static function reset_initial_loading_cache(): void {
		if ( defined( 'ABSPATH' ) && ! defined( 'PHPUNIT_COMPOSER_INSTALL' ) ) {
			return;
		}
		self::$is_initial_loading_cache = null;
	}

	/**
	 * Pre-hydration view state for a filter block's wrapper. Centralizes the
	 * seeded-state read shared by filter-checkbox and filter-date so each
	 * render.php branches on a single struct rather than re-deriving the
	 * same flags inline.
	 *
	 * @param string $filter_key The filter key (e.g. `category`, `post_type`).
	 * @return array{has_buckets:bool,is_initial_loading:bool,show_wrapper:bool}
	 */
	public static function pre_hydration_filter_view( string $filter_key ): array {
		if ( ! function_exists( 'wp_interactivity_state' ) ) {
			return array(
				'has_buckets'        => false,
				'is_initial_loading' => false,
				'show_wrapper'       => false,
			);
		}
		// `aggregations` is seeded as `stdClass` when empty (so JS sees `{}`,
		// not `[]`); cast before subscripting so the read works in either shape.
		$state              = wp_interactivity_state( 'jetpack-search' );
		$aggs               = (array) ( $state['aggregations'] ?? array() );
		$has_buckets        = ! empty( $aggs[ $filter_key ]['buckets'] ?? array() );
		$is_initial_loading = static::is_initial_loading();
		return array(
			'has_buckets'        => $has_buckets,
			'is_initial_loading' => $is_initial_loading,
			'show_wrapper'       => $has_buckets || $is_initial_loading,
		);
	}

	/**
	 * Emit the `data-wp-context` attribute for a filter block's wrapper. The
	 * seeded `wrapperHidden` value is what the IA SSR pass evaluates
	 * `data-wp-bind--hidden="context.wrapperHidden"` against, and what the
	 * `syncFilterWrapperVisibility` callback updates after hydration.
	 *
	 * @param string $filter_key   The filter key.
	 * @param bool   $show_wrapper Whether the wrapper should be visible on first paint.
	 */
	public static function emit_filter_wrapper_context( string $filter_key, bool $show_wrapper ): void {
		if ( ! function_exists( 'wp_interactivity_data_wp_context' ) ) {
			return;
		}
		echo wp_kses_data(
			wp_interactivity_data_wp_context(
				array(
					'filterKey'     => $filter_key,
					'wrapperHidden' => ! $show_wrapper,
				)
			)
		);
	}

	/**
	 * Normalize the `displayStyle` attribute shared by the bucket-driven
	 * filter blocks (`filter-checkbox`, `filter-date`, `filter-wc-attribute`)
	 * so render wrappers always emit one of the two supported CSS variants.
	 * Per-block classes delegate here so every adopting block applies the
	 * same fallback rule.
	 *
	 * `filter-wc-stock-status` (single option) and `filter-wc-rating` (star
	 * rows + "& up" suffix + count badge) deliberately don't ship a chip
	 * variant — see the PR thread for the discussion — so they don't call
	 * this helper today. Adding them later is a one-attribute change in
	 * their respective `block.json` / `render.php` / `edit.js`; the helper
	 * doesn't need updating.
	 *
	 * @param mixed $value Raw attribute value (string, null, or unexpected type).
	 * @return string Either 'checkbox-list' or 'chips'.
	 */
	public static function normalize_display_style( $value ): string {
		return 'chips' === $value ? 'chips' : 'checkbox-list';
	}

	/**
	 * Seed translated view-bundle strings for the Interactivity API store.
	 *
	 * @return array<string, string>
	 */
	protected static function build_initial_strings(): array {
		if ( ! function_exists( '__' ) || ! function_exists( '_n' ) ) {
			return array(
				'searching'              => 'Searching…',
				'resultsCountSingle'     => 'Found %d result',
				'resultsCountPlural'     => 'Found %d results',
				'removeFilter'           => 'Remove %s',
				'ratingStarsTop'         => '5 stars',
				'ratingStarsAndUpSingle' => '%d star and up',
				'ratingStarsAndUpPlural' => '%d stars and up',
				'priceRangeFromTo'       => '%1$s – %2$s',
				'priceRangeFrom'         => '%s+',
				'priceRangeUpTo'         => 'Under %s',
				'priceLabel'             => 'Price',
			);
		}
		return array(
			'searching'              => __( 'Searching…', 'jetpack-search-pkg' ),
			/* translators: %d: number of results. */
			'resultsCountSingle'     => _n( 'Found %d result', 'Found %d results', 1, 'jetpack-search-pkg' ),
			/* translators: %d: number of results. */
			'resultsCountPlural'     => _n( 'Found %d result', 'Found %d results', 2, 'jetpack-search-pkg' ),
			/* translators: %s: filter label (e.g. "Category: News"). Announced by screen readers when focus lands on a filter pill's remove button. */
			'removeFilter'           => __( 'Remove %s', 'jetpack-search-pkg' ),
			/* translators: Active-filter chip label for the 5-star row. The 5-star row is "exactly 5 stars" — no "& up" affordance — because there is no higher rating. Mirrors the row's aria-label in filter-wc-rating/render.php. */
			'ratingStarsTop'         => __( '5 stars', 'jetpack-search-pkg' ),
			/* translators: %d: rating threshold (singular form, i.e. 1). Active-filter chip label for the "1 star and up" threshold row. Mirrors the row's aria-label in filter-wc-rating/render.php. */
			'ratingStarsAndUpSingle' => _n( '%d star and up', '%d stars and up', 1, 'jetpack-search-pkg' ),
			/* translators: %d: rating threshold (plural form, i.e. 2-4). Active-filter chip label for the "X stars and up" threshold rows. Mirrors the row's aria-label in filter-wc-rating/render.php. */
			'ratingStarsAndUpPlural' => _n( '%d star and up', '%d stars and up', 2, 'jetpack-search-pkg' ),
			/* translators: 1: minimum price (already includes the currency symbol). 2: maximum price (already includes the currency symbol). Renders an active "Price: $10 – $50" filter pill. */
			'priceRangeFromTo'       => __( '%1$s – %2$s', 'jetpack-search-pkg' ),
			/* translators: %s: minimum price (already includes the currency symbol). Renders an active "Price: $10+" filter pill (no upper bound) — compact "and above" form aligned with mainstream e-commerce filter chips. */
			'priceRangeFrom'         => __( '%s+', 'jetpack-search-pkg' ),
			/* translators: %s: maximum price (already includes the currency symbol). Renders an active "Price: Under $50" filter pill (no lower bound) — mirrors Amazon/eBay/Walmart's "Under $X" convention. */
			'priceRangeUpTo'         => __( 'Under %s', 'jetpack-search-pkg' ),
			/* translators: Group label for the price filter pill ("Price: $10 – $50"). Mirrors the price block's default heading; falls back to this when no price block is on the page. */
			'priceLabel'             => __( 'Price', 'jetpack-search-pkg' ),
		);
	}

	/**
	 * Parse the search query from the URL, reading whichever key
	 * `get_search_param_name()` says is active for this request (`s` on
	 * the WP search route, `q` everywhere else). Sanitization mirrors
	 * what WP would have done for `s` (sanitize_text_field + trim).
	 *
	 * Public so block render templates (e.g. `search-input/render.php`)
	 * can seed their initial `value=` from the same source the
	 * Interactivity store seeds `searchQuery` from.
	 *
	 * @return string
	 */
	public static function parse_url_search_query(): string {
		$key = self::get_search_param_name();
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized,WordPress.Security.ValidatedSanitizedInput.MissingUnslash -- read-only URL state; coerced to string + sanitize_text_field( wp_unslash( ... ) ) on the next line.
		$raw = $_GET[ $key ] ?? '';
		if ( ! is_scalar( $raw ) ) {
			return '';
		}
		return trim( sanitize_text_field( wp_unslash( (string) $raw ) ) );
	}

	/**
	 * Parse the sort order from the URL, defaulting to 'relevance'. Valid
	 * values come from `Results_Sort::get_all_option_keys()` so the seeded
	 * sort matches what the results-sort block would render — including the
	 * product-format keys when WooCommerce is active. On non-Woo sites a
	 * `?orderby=price_asc` deep link collapses to `relevance`, mirroring the
	 * JS-side gate in store/url-state.js.
	 *
	 * @return string
	 */
	protected static function parse_url_sort(): string {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only URL state.
		$orderby = isset( $_GET['orderby'] ) ? sanitize_key( wp_unslash( $_GET['orderby'] ) ) : '';
		$allowed = array_values(
			array_filter(
				Results_Sort::get_all_option_keys(),
				static function ( $key ) {
					return 'relevance' !== $key;
				}
			)
		);
		return in_array( $orderby, $allowed, true ) ? $orderby : 'relevance';
	}

	/**
	 * Parse the price range from the URL, mirroring the contract in
	 * src/search-blocks/store/url-state.js. Either bound may be null for a
	 * half-open range; non-numeric or negative values yield null so a
	 * garbage URL can't drive the API into producing zero results.
	 *
	 * Returns null when neither bound is set, so callers can early-out
	 * without checking individual fields. Also returns null on non-Woo
	 * sites — `min_price` / `max_price` are WC-only and the price filter
	 * block (`filter-wc-price`) isn't registered there, so a stray
	 * `?min_price=10` in the URL can't drive the API into building a
	 * `range` clause for a field the index doesn't have.
	 *
	 * @return array{min: float|null, max: float|null}|null
	 */
	protected static function parse_url_price_range(): ?array {
		if ( ! self::is_woocommerce_active() ) {
			return null;
		}
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

	/**
	 * Parse the per-filter AND/OR override params (`?query_type_<key>=and`)
	 * from the current request URL. Returns `{ [filterKey]: 'and' }` —
	 * matches the JS-side parser in `store/url-state.js`. Only the literal
	 * value `'and'` is honoured; anything else collapses to the default and
	 * is omitted so it can never round-trip back through `pushStateToUrl`.
	 *
	 * Filter keys for which no active selection exists are dropped because
	 * they'd otherwise hang around in state and re-emit on the next URL push.
	 *
	 * @param array<string, string[]> $active_filters Result of parse_url_filters().
	 * @return array<string, string>
	 */
	protected static function parse_url_filter_logic( array $active_filters ): array {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- read-only URL state; sanitized per-value below.
		$raw = wp_unslash( $_GET );
		if ( ! is_array( $raw ) ) {
			return array();
		}

		$out = array();
		foreach ( $raw as $key => $value ) {
			if ( ! is_string( $key ) || 0 !== strpos( $key, 'query_type_' ) ) {
				continue;
			}
			if ( ! is_string( $value ) || 'and' !== $value ) {
				continue;
			}
			$filter_key = sanitize_key( substr( $key, strlen( 'query_type_' ) ) );
			if ( '' === $filter_key || in_array( $filter_key, self::RESERVED_QUERY_PARAMS, true ) ) {
				continue;
			}
			if ( empty( $active_filters[ $filter_key ] ) ) {
				continue;
			}
			$out[ $filter_key ] = 'and';
		}
		return $out;
	}
}
