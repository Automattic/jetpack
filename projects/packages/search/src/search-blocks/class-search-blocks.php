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
	 * Slug for the dedicated Jetpack product-search template, registered and
	 * fronted (in place of WooCommerce's) when the override is on. Separate
	 * from `SEARCH_TEMPLATE_SLUG` so it's its own Site Editor entry.
	 */
	const PRODUCT_SEARCH_TEMPLATE_SLUG = 'jetpack-search-product-results';

	/**
	 * Mirror of `ProductSearchResultsTemplate::SLUG`, copied to avoid a hard
	 * dependency on the WooCommerce class.
	 */
	const WC_PRODUCT_SEARCH_TEMPLATE_SLUG = 'product-search-results';

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
	 * Per-request memo backing `supports_paid_search()`. Reads the same
	 * `Plan::get_plan_info()` option as `is_free_plan_cache`, but answers
	 * the inverse question — "does the site have a paid Search plan?" —
	 * which is what paid-only block surfaces (today: AI Answer) gate on.
	 * Kept separate from `is_free_plan_cache` because the two helpers can
	 * disagree: a site with no plan info at all is neither on the free
	 * plan nor on a paid one.
	 *
	 * @var bool|null
	 */
	private static $supports_paid_search_cache = null;

	/**
	 * Per-request memo backing `woocommerce_blocks_enabled()`. Centralized here
	 * (rather than inside any one WC-aware block helper) so every gate that
	 * needs the answer — block-registration filters that hide WC-only blocks
	 * on non-Woo sites, render callbacks that drop product-format sort keys,
	 * the editor-side localized config, the Interactivity store seed —
	 * shares the same `class_exists()` probe.
	 *
	 * @var bool|null
	 */
	private static $woocommerce_blocks_enabled_cache = null;

	/**
	 * Per-request memo backing `supported_custom_taxonomies()`. Derived from
	 * the Sync allowlist intersected with registered taxonomies and unioned
	 * with the map's user-facing keys; same inputs every request.
	 *
	 * @var string[]|null
	 */
	private static $supported_custom_taxonomies_cache = null;

	/**
	 * Cached rendered HTML for the overlay template. Filled during
	 * `wp_enqueue_scripts` so the embedded blocks' view-module enqueues
	 * land before `wp_print_import_map()` runs (footer priority 1) — that
	 * walk is what puts `jetpack-search/store` into the importmap, and
	 * deferring the render to footer priority 10 misses it.
	 *
	 * @var string|null
	 */
	private static $block_template_overlay_rendered_html = null;

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
		Custom_Taxonomy_Slot_Mapping::init();
		// FSE block-template rendering runs *before* `wp_head()` (see
		// `wp-includes/template-canvas.php`), so blocks would resolve
		// `data-wp-bind` / `data-wp-text` against an unseeded IA store if we
		// only hooked `wp_enqueue_scripts`. Seeding on `template_redirect`
		// closes that gap; the second call from `wp_enqueue_scripts` is a
		// deep-merge no-op and keeps classic-theme paths covered.
		add_action( 'template_redirect', array( static::class, 'seed_interactivity_state' ) );
		add_action( 'wp_enqueue_scripts', array( static::class, 'seed_interactivity_state' ) );

		$experience = ( new Module_Control() )->get_experience();

		if ( Module_Control::EXPERIENCE_EMBEDDED === $experience ) {
			add_action( 'init', array( static::class, 'register_search_template' ) );
			add_filter( 'search_template_hierarchy', array( static::class, 'prepend_search_template' ) );
			Theme_Chrome_Slug_Resolver::register_hooks();
		}

		// Priority 20: after WooCommerce's priority-10 prepend (so the
		// result is load-order independent), leaving 11-19 free for other
		// integrations. The WC/product-search guard lives in the callback,
		// which runs late enough to satisfy woocommerce_blocks_enabled()'s
		// load-order contract.
		//
		// Gated to the server-rendered experiences (Embedded / Theme search):
		// Overlay intercepts client-side so the override is a no-op there, and
		// the dashboard hides the toggle in that state — mirror it server-side
		// so a stale option from a since-switched experience can't keep
		// rerouting the template hierarchy.
		if (
			static::woocommerce_search_template_override_enabled()
			&& in_array( $experience, array( Module_Control::EXPERIENCE_EMBEDDED, Module_Control::EXPERIENCE_INLINE ), true )
		) {
			add_action( 'init', array( static::class, 'register_product_search_template' ) );
			add_filter( 'search_template_hierarchy', array( static::class, 'route_woocommerce_product_search_template' ), 20 );
		}

		if ( static::is_block_template_overlay_enabled() ) {
			Overlay_Template::init();
			add_action( 'wp_enqueue_scripts', array( static::class, 'enqueue_block_template_overlay_assets' ) );
			add_action( 'wp_footer', array( static::class, 'print_block_template_overlay' ) );
		}
	}

	/**
	 * Whether the legacy instant-search overlay should be replaced by the
	 * server-rendered Search blocks template
	 * (`templates/jetpack-search-overlay.html`).
	 *
	 * EXPERIMENTAL — off by default; not production-ready. Two conditions
	 * must hold for the runtime swap to occur:
	 *
	 *   1. The `jetpack_search_overlay_block_template_enabled` filter is on.
	 *      This is the operator-level gate that surfaces the new option in
	 *      the Experience Selector and registers the overlay assets.
	 *   2. The site owner has chosen the new overlay experience in the
	 *      dashboard (`Module_Control::EXPERIENCE_OVERLAY_BLOCKS`).
	 *
	 * Both conditions let the legacy and blocks-powered overlays coexist
	 * on the same site — operators can opt a site into the new path, and
	 * site owners can still flip back to the legacy experience without
	 * touching any server-side filter. When both are true the legacy
	 * `SearchApp` is bypassed via the `jetpack_search_init_instant_search`
	 * filter (wired in `Initializer::init_search_blocks()`).
	 *
	 * @return bool
	 */
	public static function is_block_template_overlay_enabled(): bool {
		/**
		 * Opt into the experimental Search blocks overlay. Off by default.
		 * Do not enable in production until this feature graduates.
		 *
		 * @param bool $enabled Default false.
		 */
		if ( ! (bool) apply_filters( 'jetpack_search_overlay_block_template_enabled', false ) ) {
			return false;
		}
		return Module_Control::EXPERIENCE_OVERLAY_BLOCKS === ( new Module_Control() )->get_experience();
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
	 * Whether the site has a paid Jetpack Search subscription. Paid-only
	 * block surfaces (AI Answer's `render.php` and editor preview) call
	 * this on every render to decide whether to emit the panel scaffold
	 * or short-circuit; same cold-cache WPCOM round-trip hazard
	 * `is_free_plan()` guards against, so memoize the same way.
	 *
	 * Why both probes: WPCOM reports `supports_instant_search: true` on
	 * the free Search plan too — "this plan supports instant search as a
	 * feature," not "the plan is paid." So `supports_instant_search()`
	 * alone would let the free plan through. Combining with
	 * `! is_free_plan()` rules out both the free product
	 * (`jetpack_search_free`) and the forced-free filter, while
	 * `supports_instant_search()` still rules out the no-plan / no-Search
	 * case (which `is_free_plan()` returns false for).
	 *
	 * No `apply_filters()` wrapper here by design (cf. the
	 * `jetpack_search_woocommerce_blocks_enabled` filter on the WC gate).
	 * This is a paid-feature gate — a filter that any plugin could flip
	 * would defeat its purpose. Tests bypass the probe via
	 * `set_supports_paid_search_for_testing()`.
	 *
	 * @return bool
	 */
	public static function supports_paid_search(): bool {
		if ( null === self::$supports_paid_search_cache ) {
			$plan                             = new Plan();
			self::$supports_paid_search_cache = $plan->supports_instant_search() && ! $plan->is_free_plan();
		}
		return self::$supports_paid_search_cache;
	}

	/**
	 * Force the `supports_paid_search()` answer to a specific boolean —
	 * tests only. Pass `null` to clear the override and revive the real
	 * `Plan` probe (also done by `reset_supports_paid_search_cache()`).
	 * Mirrors `set_woocommerce_blocks_enabled_for_testing()`, the
	 * canonical setter pattern documented in `AGENTS.md`.
	 *
	 * @internal
	 *
	 * @param bool|null $value Forced answer or null to clear.
	 */
	public static function set_supports_paid_search_for_testing( ?bool $value ): void {
		self::$supports_paid_search_cache = $value;
	}

	/**
	 * Reset the `supports_paid_search()` memo. Tests only — production
	 * callers should never need this.
	 *
	 * @internal
	 */
	public static function reset_supports_paid_search_cache(): void {
		self::$supports_paid_search_cache = null;
	}

	/**
	 * Whether Jetpack Search exposes its WooCommerce-only blocks, filter
	 * variations, and render paths. Use from any gate that needs to skip
	 * a WC-only feature (block registration of `filter-wc-*` blocks, the
	 * product-format sort keys on `results-sort`, etc.). Memoized
	 * per-request so adding a new caller doesn't multiply autoloader probes.
	 *
	 * **Load-order contract:** must be called at or after `plugins_loaded`.
	 * WooCommerce includes its main `WooCommerce` class only when its plugin
	 * file runs (during `plugins_loaded`), so an earlier call would return
	 * false on a WC site. Every existing caller fires from a hook later
	 * than that — `enqueue_block_editor_assets`, `template_redirect`,
	 * `wp_enqueue_scripts`, or block render — so the contract is naturally
	 * satisfied. New callers earlier in the request lifecycle should defer
	 * the probe to a `plugins_loaded`-or-later hook.
	 *
	 * **Filter:** `jetpack_search_woocommerce_blocks_enabled` lets a site
	 * force the gate either way regardless of WC's plugin state — e.g. a
	 * Woo site hiding WC-only blocks on a non-shop content area, or a
	 * non-Woo site previewing them in staging. Default is the
	 * `class_exists( 'WooCommerce', false )` probe. Filter fires once per
	 * request before the result is memoized, so an expensive callback
	 * (DB probe, option read) pays its cost at most once.
	 *
	 * @return bool
	 */
	public static function woocommerce_blocks_enabled(): bool {
		if ( null === self::$woocommerce_blocks_enabled_cache ) {
			// Pass `false` so a missing class doesn't fire the autoloader
			// on non-Woo sites — the gate is hit on every request, and
			// any upstream autoloader work is wasted when the answer is "no".
			$probed = class_exists( 'WooCommerce', false );

			/**
			 * Whether Jetpack Search exposes its WooCommerce-only blocks,
			 * filter variations, and render paths. Default is the
			 * `class_exists( 'WooCommerce', false )` probe; cast to bool
			 * before caching so a truthy non-bool return (e.g. `1`)
			 * doesn't poison strictly-typed callers.
			 *
			 * @since 0.59.0
			 *
			 * @param bool $enabled Defaults to the WooCommerce class probe.
			 */
			self::$woocommerce_blocks_enabled_cache = (bool) apply_filters(
				'jetpack_search_woocommerce_blocks_enabled',
				$probed
			);
		}
		return self::$woocommerce_blocks_enabled_cache;
	}

	/**
	 * Force the `woocommerce_blocks_enabled()` answer to a specific boolean —
	 * tests only. Pass `null` to clear the override and revive the real
	 * `class_exists()` probe (also done by `reset_woocommerce_blocks_enabled_cache()`).
	 *
	 * @internal
	 *
	 * @param bool|null $value Forced answer or null to clear.
	 */
	public static function set_woocommerce_blocks_enabled_for_testing( ?bool $value ): void {
		self::$woocommerce_blocks_enabled_cache = $value;
	}

	/**
	 * Reset the `woocommerce_blocks_enabled()` memo. Tests only.
	 *
	 * @internal
	 */
	public static function reset_woocommerce_blocks_enabled_cache(): void {
		self::$woocommerce_blocks_enabled_cache = null;
	}

	/**
	 * The `jetpack_search_override_woocommerce_search_template` opt-in
	 * (default off), set from the Search dashboard.
	 *
	 * @return bool
	 */
	public static function woocommerce_search_template_override_enabled(): bool {
		return (bool) get_option( 'jetpack_search_override_woocommerce_search_template', false );
	}

	/**
	 * Mirrors WooCommerce's own `ProductSearchResultsTemplate` guard so the
	 * override only touches requests WooCommerce would itself reroute.
	 *
	 * @return bool
	 */
	protected static function is_woocommerce_product_search(): bool {
		return self::woocommerce_blocks_enabled()
			&& is_search()
			&& is_post_type_archive( 'product' )
			&& static::block_templates_active();
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
	 * Built-in taxonomies that have their own dedicated filter-checkbox
	 * variations — Category / Tag plus the three WooCommerce product
	 * taxonomies. Excluded from the "Custom Taxonomy" picker (both server
	 * and editor) so site builders reach for the dedicated variation rather
	 * than the generic Custom Taxonomy entry. Mirrors `BUILT_IN_TAXONOMY_SLUGS`
	 * in filter-checkbox/edit.js — must stay in lockstep.
	 *
	 * @var string[]
	 */
	const BUILT_IN_CUSTOM_TAXONOMY_EXCLUSIONS = array(
		'category',
		'post_tag',
		'product_cat',
		'product_tag',
		'product_brand',
	);

	/**
	 * Back-compat proxy for `Custom_Taxonomy_Slot_Mapping::get_map()`.
	 * The slot-mapping logic lives in its own class; this proxy keeps the
	 * editor enqueue + `supported_custom_taxonomies()` call sites stable.
	 *
	 * @return array<string, string>
	 */
	public static function custom_taxonomy_map(): array {
		return Custom_Taxonomy_Slot_Mapping::get_map();
	}

	/**
	 * Back-compat proxy for `Custom_Taxonomy_Slot_Mapping::resolve_slot()`.
	 * Used by `Filter_Checkbox::build_config()` to seed `effectiveSlug`
	 * on each filterConfig at config-build time.
	 *
	 * @param string $taxonomy User-facing taxonomy slug.
	 * @return string Effective ES field slug.
	 */
	public static function resolve_taxonomy_slot( string $taxonomy ): string {
		return Custom_Taxonomy_Slot_Mapping::resolve_slot( $taxonomy );
	}

	/**
	 * Reset both the slot-mapping memo and the `supported_custom_taxonomies()`
	 * memo. Tests only — production WP runs a single request per process and
	 * the map is derived purely from a filter hook, so callers should never
	 * need to clear the cache.
	 *
	 * @internal
	 */
	public static function reset_custom_taxonomy_map_cache(): void {
		Custom_Taxonomy_Slot_Mapping::reset_cache_for_testing();
		self::$supported_custom_taxonomies_cache = null;
	}

	/**
	 * Custom-taxonomy slugs the "Custom Taxonomy" filter variation should
	 * offer in the editor picker. A taxonomy is "supported" when:
	 *
	 *   1. It's registered locally AND in Jetpack Search's indexable
	 *      allowlist (`Sync\Modules\Search::get_all_taxonomies()`), so an
	 *      aggregation against it will actually return buckets; OR
	 *   2. It's a key in `custom_taxonomy_map()` AND registered locally —
	 *      the mapping routes its queries through a reserved slot.
	 *
	 * Built-in slugs already covered by dedicated filter variations
	 * (`category`, `post_tag`, `product_cat`, `product_tag`, `product_brand`)
	 * are stripped so the Custom Taxonomy variation never offers them as
	 * alternatives.
	 *
	 * The Sync allowlist comes from `automattic/jetpack-sync` (a runtime
	 * dependency of `automattic/jetpack-search`); the class_exists guard is
	 * defensive for partial installs / isolated tests where the Sync
	 * package isn't autoloaded — in that case the helper falls back to
	 * "map keys only", which is the most conservative answer.
	 *
	 * @return string[] Distinct, zero-indexed list of supported taxonomy slugs.
	 */
	public static function supported_custom_taxonomies(): array {
		if ( null !== self::$supported_custom_taxonomies_cache ) {
			return self::$supported_custom_taxonomies_cache;
		}

		// Limit to public taxonomies so the picker stays in lockstep with
		// the editor's `core.getTaxonomies()` call, which only returns
		// REST-visible (public) taxonomies. Avoids surfacing a private
		// taxonomy that happens to be in the Sync allowlist.
		$registered = function_exists( 'get_taxonomies' )
			? array_values( get_taxonomies( array( 'public' => true ), 'names' ) )
			: array();

		$indexed = class_exists( '\\Automattic\\Jetpack\\Sync\\Modules\\Search' )
			? \Automattic\Jetpack\Sync\Modules\Search::get_all_taxonomies()
			: array();

		$map_keys = array_keys( self::custom_taxonomy_map() );

		// A registered taxonomy is supported when it sits in the index
		// allowlist OR when the site owner has mapped it to a slot.
		$candidates = array_unique( array_merge( $indexed, $map_keys ) );
		$supported  = array_values(
			array_diff(
				array_values( array_intersect( $registered, $candidates ) ),
				self::BUILT_IN_CUSTOM_TAXONOMY_EXCLUSIONS
			)
		);

		self::$supported_custom_taxonomies_cache = $supported;
		return $supported;
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

		// Surface the WC gate to the editor bundle. `isWooCommerceBlocksEnabled`
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
					'isWooCommerceBlocksEnabled' => self::woocommerce_blocks_enabled(),
					'woocommerceOnlyBlocks'      => self::woocommerce_only_block_names(),
					// `supportsPaidSearch` mirrors the PHP gate the AI Answer
					// block applies in its `render.php` — paid-only block
					// edits read this flag and swap their preview for an
					// upgrade Placeholder when it's false. Server-side is
					// the source of truth; the editor flag just lets the
					// preview match what the front end will actually emit.
					'supportsPaidSearch'         => self::supports_paid_search(),
					// `supportedCustomTaxonomies` drives the "Custom Taxonomy"
					// picker in filter-checkbox/edit.js — only taxonomies in
					// this list (Jetpack-Search-indexed OR mapped to a
					// reserved slot via `jetpack_search_custom_taxonomy_map`)
					// are offered. See `supported_custom_taxonomies()` for
					// the derivation and the FAQ link:
					// https://jetpack.com/support/search/frequently-asked-questions/#troubleshoot-custom-tax
					'supportedCustomTaxonomies'  => self::supported_custom_taxonomies(),
					// `customTaxonomyMap` is keyed by the user-facing slug;
					// the picker uses key membership to append a "(mapped)"
					// suffix to those entries' labels so authors know the
					// filter routes through a reserved slot.
					'customTaxonomyMap'          => (object) self::custom_taxonomy_map(),
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

		self::register_store_script_module();

		$blocks_dir = __DIR__ . '/blocks';
		$block_dirs = glob( $blocks_dir . '/*', GLOB_ONLYDIR );

		if ( ! $block_dirs ) {
			return;
		}

		$wc_blocks_enabled = self::woocommerce_blocks_enabled();
		foreach ( $block_dirs as $block_dir ) {
			if ( ! file_exists( $block_dir . '/block.json' ) ) {
				continue;
			}
			if ( ! $wc_blocks_enabled && self::is_woocommerce_only_block( basename( $block_dir ) ) ) {
				continue;
			}
			register_block_type( $block_dir );
		}

		add_filter( 'get_block_type_variations', array( static::class, 'inject_filter_checkbox_variations' ), 10, 2 );
		static::register_patterns();
	}

	/**
	 * Register the shared store as the `jetpack-search/store` Script Module.
	 *
	 * Every interactive block's `view.js` imports this bare specifier instead
	 * of inlining the ~1,250-line store; the build externalizes it (see
	 * `tools/webpack.blocks.config.js`) and writes the dependency into each
	 * block's generated `.asset.php`, so WordPress resolves it to this single
	 * module and ships the store once instead of ~14 duplicated copies.
	 */
	public static function register_store_script_module() {
		if ( ! function_exists( 'wp_register_script_module' ) ) {
			return;
		}

		$base_path  = Package::get_installed_path() . 'build/search-blocks/store/';
		$asset_file = $base_path . 'index.asset.php';
		if ( ! file_exists( $asset_file ) ) {
			return;
		}
		$asset = require $asset_file;

		wp_register_script_module(
			'jetpack-search/store',
			plugins_url( 'index.js', $base_path . 'index.js' ),
			$asset['dependencies'] ?? array(),
			$asset['version'] ?? false
		);
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

		// WC-only product taxonomies. Gated on `woocommerce_blocks_enabled()` so
		// they don't appear in the inserter on non-Woo sites where the
		// taxonomies happen to exist via another plugin (or a previous WC
		// install that left them registered). `product_brand` layers an
		// extra `taxonomy_exists()` probe on top because it isn't a core WC
		// taxonomy — extensions like WC Brands / Perfect Brands / recent
		// bundled WC versions provide it. The three product variations stay
		// grouped before `custom_taxonomy` below so the inserter renders
		// them as a contiguous cluster.
		if ( self::woocommerce_blocks_enabled() ) {
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
		$wc_blocks_enabled = self::woocommerce_blocks_enabled();
		foreach ( $pattern_files as $pattern_file ) {
			if ( ! $wc_blocks_enabled && 0 === strpos( basename( $pattern_file ), 'wc-' ) ) {
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
		$template_path = __DIR__ . '/templates/jetpack-search.html';
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local, bundled template file.
		$raw = is_readable( $template_path ) ? (string) file_get_contents( $template_path ) : '';
		return static::substitute_template_placeholders( $raw );
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
	 *
	 * Skipped on classic themes: the registry is only consulted by the Site
	 * Editor and the block-theme render path. Re-checked every `init`.
	 */
	public static function register_search_template() {
		if ( ! function_exists( 'register_block_template' ) || ! static::block_templates_active() ) {
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
		static::replace_block_template(
			static::get_parent_plugin_slug() . '//' . self::SEARCH_TEMPLATE_SLUG,
			array(
				'title'       => __( 'Jetpack Search Results', 'jetpack-search-pkg' ),
				'description' => __( 'Displays search results with Jetpack Search filters.', 'jetpack-search-pkg' ),
				'content'     => $content,
			)
		);
	}

	/**
	 * Read the dedicated overlay-template markup (`jetpack-search-overlay.html`).
	 *
	 * Distinct from `get_search_template_content()`: that one wraps the
	 * search blocks inside `header` / `main` / `footer` template-parts so
	 * the result renders as a full page. The overlay needs only the main
	 * region — a modal isn't a page — so it ships as its own file rather
	 * than runtime-stripping the page template's wrappers.
	 *
	 * Memoized like the page template: the markup is identical every
	 * request, so the file read happens once per process. Unlike the
	 * page-template variant, this template has no `{{FILTER_HEADING}}`
	 * placeholder — the per-filter labels on each filter block render
	 * the headings directly, matching the legacy overlay's per-filter
	 * subheading layout.
	 *
	 * Source of truth, in order:
	 *
	 *   1. The customized singleton CPT (`Overlay_Template`), if an admin
	 *      has saved one via the dashboard's "Edit the Search overlay" link.
	 *   2. The bundled `templates/jetpack-search-overlay.html` file.
	 *
	 * Memoized per-request. The customization branch is hit at most once
	 * per request even when the singleton's content is empty, because
	 * `Overlay_Template::get_customized_content()` does its own caching.
	 *
	 * @return string Block markup for the overlay body.
	 */
	protected static function get_overlay_template_content(): string {
		static $content = null;
		if ( null !== $content ) {
			return $content;
		}
		$customized = Overlay_Template::get_customized_content();
		if ( null !== $customized ) {
			$content = $customized;
			return $content;
		}
		$template_path = __DIR__ . '/templates/jetpack-search-overlay.html';
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local, bundled template file; wp_remote_get() is for remote URLs.
		$content = is_readable( $template_path ) ? (string) file_get_contents( $template_path ) : '';
		return $content;
	}

	/**
	 * Echo the Search-blocks overlay shell into `wp_footer`.
	 *
	 * Server-renders `jetpack-search.html` once per request (template-part
	 * comments stripped), wraps it in a hidden modal container, and prints
	 * the result. Block markup carries `data-wp-interactive` directives, so
	 * the Interactivity API's standard `DOMContentLoaded` hydration picks it
	 * up — no client-side fetch and no private-API re-hydration needed.
	 *
	 * Caller (`init()`) gates this on `is_block_template_overlay_enabled()`,
	 * so the action isn't even registered when the legacy overlay is in use.
	 */
	public static function print_block_template_overlay() {
		$rendered = self::$block_template_overlay_rendered_html;
		if ( null === $rendered || '' === $rendered ) {
			return;
		}
		$config = wp_json_encode(
			array(
				'searchInputSelector'    => 'input[name="s"]:not(.jetpack-search-input__field), #searchform input.search-field, .search-form input.search-field, .searchform input.search-field',
				'overlayTriggerSelector' => '.jetpack-search-block-overlay-trigger, .jetpack-instant-search__open-overlay-button, header#site-header .search-toggle[data-toggle-target]',
			),
			JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
		);
		?>
		<script id="jetpack-search-block-overlay-config">window.JetpackSearchBlockOverlay=<?php echo $config; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- wp_json_encode + JSON_HEX_* flags. ?>;</script>
		<?php
		// `<template>` keeps `data-wp-interactive` regions out of
		// `document.querySelectorAll`, so the IA runtime's one-shot
		// DOMContentLoaded hydration walk skips them; the bootstrap
		// clones the content into the shell on first open and hydrates
		// there.
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- do_blocks output.
		printf( '<template id="jetpack-search-block-overlay-template">%s</template>', $rendered );
		?>
		<div
			id="jetpack-search-block-overlay"
			class="jetpack-search-block-overlay"
			role="dialog"
			aria-modal="true"
			aria-label="<?php echo esc_attr__( 'Search', 'jetpack-search-pkg' ); ?>"
			hidden
		>
			<div class="jetpack-search-block-overlay__card">
				<button
					type="button"
					class="jetpack-search-block-overlay__close"
					aria-label="<?php echo esc_attr__( 'Close search', 'jetpack-search-pkg' ); ?>"
				>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
						<path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12 5.7 16.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z" fill="currentColor" />
					</svg>
				</button>
				<div class="jetpack-search-block-overlay__content"></div>
			</div>
		</div>
		<?php
	}

	/**
	 * Register + enqueue the overlay-bootstrap Script Module that wires
	 * theme-defined search triggers (input, form, button) to the rendered
	 * overlay shell, plus a minimal inline stylesheet for the modal chrome.
	 * Config (trigger selectors) is emitted alongside the overlay HTML in
	 * `print_block_template_overlay()` so it's guaranteed to land in the
	 * page before the deferred module imports it.
	 */
	public static function enqueue_block_template_overlay_assets() {
		if ( ! function_exists( 'wp_register_script_module' ) ) {
			return;
		}
		$base_path  = Package::get_installed_path() . 'build/search-blocks/overlay-bootstrap/';
		$asset_file = $base_path . 'index.asset.php';
		if ( ! file_exists( $asset_file ) ) {
			return;
		}
		$asset = require $asset_file;
		wp_register_script_module(
			'jetpack-search/overlay-bootstrap',
			plugins_url( 'index.js', $base_path . 'index.js' ),
			$asset['dependencies'] ?? array(),
			$asset['version'] ?? false
		);
		wp_enqueue_script_module( 'jetpack-search/overlay-bootstrap' );

		wp_register_style( 'jetpack-search-block-overlay', false, array(), $asset['version'] ?? false );
		wp_enqueue_style( 'jetpack-search-block-overlay' );
		wp_add_inline_style( 'jetpack-search-block-overlay', static::block_template_overlay_inline_css() );

		// Render the template content now (during `wp_enqueue_scripts`) so
		// the view-module enqueues triggered by `do_blocks()` are in place
		// before the importmap is printed in `wp_footer` priority 1.
		// `wp_footer` priority 10 (where `print_block_template_overlay`
		// runs) is too late — the importmap walk has already happened and
		// `jetpack-search/store` would be missing from it.
		self::$block_template_overlay_rendered_html = trim(
			do_blocks( static::get_overlay_template_content() )
		);
	}

	/**
	 * Minimal CSS for the overlay shell. Block-rendered content brings its
	 * own styling; this only handles the modal chrome (positioning, scrim,
	 * close button) and the hidden/visible toggle.
	 *
	 * @return string
	 */
	protected static function block_template_overlay_inline_css(): string {
		return <<<'CSS'
/*
 * Modal chrome only. The rendered Search blocks bring their own styling
 * from the active theme; this stylesheet handles only the overlay scrim,
 * the centered card, the header strip (search input + close button),
 * open/close animation, and the body-scroll-lock helper. Mirrors the
 * visual idiom of the legacy `instant-search/components/overlay.scss`.
 */
.jetpack-search-block-overlay {
	position: fixed;
	inset: 0;
	z-index: 100000;
	display: flex;
	justify-content: center;
	align-items: flex-start;
	background: rgba(31, 31, 31, 0.7);
	overflow-y: auto;
	padding: 3em 1em;
	transition: opacity 0.1s ease-in;
}
.jetpack-search-block-overlay[hidden] {
	display: none;
}
@media (prefers-reduced-motion: reduce) {
	.jetpack-search-block-overlay {
		transition: none;
	}
}
.jetpack-search-block-overlay__card {
	position: relative;
	width: 100%;
	max-width: 1080px;
	background: #fff;
	border-radius: 4px;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
	padding-top: 60px;
}
.jetpack-search-block-overlay__close {
	position: absolute;
	top: 0;
	right: 0;
	width: 60px;
	height: 60px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: transparent;
	border: 0;
	border-bottom: 1px solid #e0e0e0;
	cursor: pointer;
	color: inherit;
}
.jetpack-search-block-overlay__close:hover,
.jetpack-search-block-overlay__close:focus-visible {
	background: #f6f7f7;
}
.jetpack-search-block-overlay__close svg {
	width: 24px;
	height: 24px;
}
/*
 * The first child of the rendered template is the search-input block.
 * Promote it to a 60px header strip flush with the close button so the
 * two read as a single top bar — matching the legacy `__box` header:
 * 60px magnifying-glass column on the left, full-width input in the
 * middle, ×-clear column on the right (before the overlay's own X).
 * The block's default `border-bottom: 1px solid currentColor` on
 * `.jetpack-search-input__inside-wrapper` is intentionally suppressed
 * inside the overlay — the header strip's own border-bottom handles
 * the visual separation from the results area.
 */
.jetpack-search-block-overlay__card .wp-block-jetpack-search-search-input {
	position: absolute;
	top: 0;
	left: 0;
	right: 60px;
	height: 60px;
	margin: 0;
	padding: 0;
	border-bottom: 1px solid #e0e0e0;
}
.jetpack-search-block-overlay__card .wp-block-jetpack-search-search-input .jetpack-search-input__inside-wrapper {
	height: 100%;
	display: flex;
	align-items: stretch;
	gap: 0;
	padding: 0;
	border-bottom: 0;
}
.jetpack-search-block-overlay__card .wp-block-jetpack-search-search-input .jetpack-search-input__icon {
	flex: 0 0 60px;
	width: 60px;
	height: 60px;
	padding: 18px;
	box-sizing: border-box;
	opacity: 0.5;
}
.jetpack-search-block-overlay__card .wp-block-jetpack-search-search-input .jetpack-search-input__field {
	flex: 1 1 auto;
	min-width: 0;
	height: 100%;
	font-size: 18px;
	line-height: 1;
	padding: 0;
	background: transparent;
}
.jetpack-search-block-overlay__card .wp-block-jetpack-search-search-input .jetpack-search-input__clear {
	flex: 0 0 60px;
	width: 60px;
	height: 60px;
	padding: 0;
	font-size: 0.875rem;
	font-weight: 400;
	line-height: 1;
}
.jetpack-search-block-overlay__content > .wp-block-group:first-child {
	padding: 0 2em 2em;
}
/*
 * The "Found N results" + sort dropdown row sits inside the rendered
 * `search-results` block. The wp:group inline layout
 * (`justifyContent: space-between`) does not always emit the matching
 * core flex-layout class in this context, so we force the row layout
 * explicitly. Results count anchors left, sort anchors right — matching
 * the legacy `__search-results-controls` row.
 */
.jetpack-search-block-overlay__results-header {
	display: flex;
	flex-wrap: nowrap;
	justify-content: space-between;
	align-items: center;
}
@media (max-width: 781px) {
	.jetpack-search-block-overlay {
		padding: 0;
	}
	.jetpack-search-block-overlay__card {
		min-height: 100vh;
		border-radius: 0;
		box-shadow: none;
	}
	.jetpack-search-block-overlay__content > .wp-block-group:first-child {
		padding: 0 1em 1em;
	}
}
/*
 * Body-scroll lock — set `position: fixed` while the overlay is open so
 * the page underneath doesn't scroll, with the JS side stashing and
 * restoring scrollY around the toggle to keep the visible position stable.
 */
body.jetpack-search-block-overlay-open {
	position: fixed;
	left: 0;
	right: 0;
	width: 100%;
	overflow: hidden;
}
CSS;
	}

	/**
	 * Product-search counterpart of `get_search_template_content()`. Seeds
	 * from `templates/jetpack-search-product-results.html` (a copy of the search
	 * layout for now; product-specific blocks land in a follow-up).
	 *
	 * @return string Block markup for the product-search template.
	 */
	protected static function get_product_search_template_content(): string {
		$template_path = __DIR__ . '/templates/jetpack-search-product-results.html';
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local, bundled template file.
		$raw = is_readable( $template_path ) ? (string) file_get_contents( $template_path ) : '';
		return static::substitute_template_placeholders( $raw );
	}

	/**
	 * Substitute {{FILTER_HEADING}} / {{HEADER_SLUG}} / {{FOOTER_SLUG}}
	 * in a bundled template's raw markup. Empty input passes through so
	 * the "missing-file" bail-out in the registrars still fires.
	 *
	 * @param string $raw Raw template-file contents.
	 * @return string
	 */
	protected static function substitute_template_placeholders( string $raw ): string {
		if ( '' === $raw ) {
			return $raw;
		}
		$slugs = static::resolve_chrome_slugs();
		return str_replace(
			array( '{{FILTER_HEADING}}', '{{HEADER_SLUG}}', '{{FOOTER_SLUG}}' ),
			array(
				esc_html__( 'Filter options', 'jetpack-search-pkg' ),
				$slugs['header'],
				$slugs['footer'],
			),
			$raw
		);
	}

	/**
	 * Active theme's chrome slugs. Seam — tests override to inject
	 * canned values; the resolver itself lives in
	 * Theme_Chrome_Slug_Resolver.
	 *
	 * @return array{header:string,footer:string}
	 */
	protected static function resolve_chrome_slugs(): array {
		return Theme_Chrome_Slug_Resolver::resolve();
	}

	/**
	 * Idempotent wrapper around register_block_template — unregisters
	 * first so a stale entry from a prior init (long-lived PHP-FPM
	 * worker) is replaced rather than triggering doing_it_wrong.
	 *
	 * @param string              $name Fully-qualified template name.
	 * @param array<string,mixed> $args Args for register_block_template().
	 */
	protected static function replace_block_template( string $name, array $args ) {
		if ( class_exists( '\WP_Block_Templates_Registry' ) ) {
			$registry = \WP_Block_Templates_Registry::get_instance();
			if ( $registry->is_registered( $name ) ) {
				$registry->unregister( $name );
			}
		}
		register_block_template( $name, $args );
	}

	/**
	 * Register the dedicated Jetpack product-search template. Counterpart of
	 * `register_search_template()`; same Site Editor / DB-customization
	 * semantics and empty-content / classic-theme bail-outs.
	 */
	public static function register_product_search_template() {
		if ( ! function_exists( 'register_block_template' ) || ! static::block_templates_active() ) {
			return;
		}
		$content = static::get_product_search_template_content();
		if ( '' === $content ) {
			return;
		}
		static::replace_block_template(
			static::get_parent_plugin_slug() . '//' . self::PRODUCT_SEARCH_TEMPLATE_SLUG,
			array(
				'title'       => __( 'Jetpack Search Product Results', 'jetpack-search-pkg' ),
				'description' => __( 'Displays WooCommerce product search results with Jetpack Search filters.', 'jetpack-search-pkg' ),
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
	 * Only takes effect on a block-theme search request — the slug resolves
	 * only through the block-template system, so injecting it anywhere else
	 * just mis-shapes the hierarchy.
	 *
	 * WooCommerce product-search carve-out: override off → leave the
	 * hierarchy to WooCommerce's prepend; override on → fall through here,
	 * then `route_woocommerce_product_search_template()` swaps WooCommerce's
	 * slug for `jetpack-search-product-results`.
	 *
	 * @param string[] $templates Template hierarchy slugs.
	 * @return string[]
	 */
	public static function prepend_search_template( $templates ) {
		if ( ! is_search() || ! static::block_templates_active() ) {
			return $templates;
		}
		if ( ! static::woocommerce_search_template_override_enabled() && static::is_woocommerce_product_search() ) {
			return $templates;
		}
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
	 * Whether the active theme resolves block templates. Wraps
	 * `wp_is_block_theme()` as an overridable seam so tests can exercise the
	 * block-theme path without standing up a block theme.
	 *
	 * @return bool
	 */
	protected static function block_templates_active(): bool {
		return wp_is_block_theme();
	}

	/**
	 * Front the dedicated `jetpack-search-product-results` template for a WooCommerce
	 * product search: drop WooCommerce's `product-search-results` slug and
	 * unshift ours so it resolves first (ahead of any `jetpack-search`
	 * prepended for the generic search route). Registered at priority 20
	 * only when the override is on; no-op outside a WooCommerce product
	 * search.
	 *
	 * @param string[] $templates Template hierarchy slugs.
	 * @return string[]
	 */
	public static function route_woocommerce_product_search_template( $templates ) {
		if ( ! static::is_woocommerce_product_search() ) {
			return $templates;
		}
		$templates = array_values(
			array_filter(
				(array) $templates,
				static function ( $slug ) {
					return self::WC_PRODUCT_SEARCH_TEMPLATE_SLUG !== $slug
						&& self::PRODUCT_SEARCH_TEMPLATE_SLUG !== $slug;
				}
			)
		);
		array_unshift( $templates, self::PRODUCT_SEARCH_TEMPLATE_SLUG );
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
		if ( self::woocommerce_blocks_enabled() ) {
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
			'siteId'                     => $site_id,
			'apiRoot'                    => function_exists( 'rest_url' ) ? esc_url_raw( rest_url() ) : '',
			'nonce'                      => function_exists( 'wp_create_nonce' ) ? wp_create_nonce( 'wp_rest' ) : '',
			'isPrivateSite'              => $is_private,
			'isWpcom'                    => $is_wpcom,
			// Whether the product-format sort keys (rating, price asc/desc)
			// are valid on this site, plus a JS-side gate any WC-only block
			// can read. The store threads it into url-state so a
			// `?orderby=price_asc` deep link round-trips on Woo sites and
			// collapses to relevance everywhere else.
			'isWooCommerceBlocksEnabled' => self::woocommerce_blocks_enabled(),
			'homeUrl'                    => function_exists( 'home_url' ) ? home_url() : '',
			// BCP47-ish locale (e.g. `en-US`) for Intl.DateTimeFormat on the
			// client. Converts WP's `en_US` underscore form. Uses the blog
			// locale (site setting) rather than the viewer's user-profile
			// locale so formatting is consistent for logged-out visitors
			// hitting a search page.
			'locale'                     => function_exists( 'get_locale' )
				? str_replace( '_', '-', get_locale() )
				: 'en-US',
			// Site `date_format` token string (PHP `date()` syntax — e.g.
			// `F j, Y`, `Y-m-d`) so the result card's date matches the rest of
			// the site rather than `toLocaleDateString`'s fixed shape. Parsed
			// client-side by `wp-date-format.js` because the Interactivity API
			// view bundle can't import `@wordpress/date`. Empty string falls
			// the JS side back to its legacy `{ year, month, day }` Intl
			// shape, which keeps tests that don't seed a format passing.
			'dateFormat'                 => function_exists( 'get_option' )
				? (string) get_option( 'date_format', '' )
				: '',

			// Search state, seeded from the URL so a deep link like
			// /?s=boots&orderby=newest&category[]=news renders correctly on
			// first paint.
			'searchQuery'                => $search_query,
			// Whether the search-query URL key was present in `$_GET`, even
			// when its value is empty. The JS store's `initialize()` reads
			// this so a `?s=` deep link still fires the initial search —
			// `searchQuery` alone can't carry that signal because an empty
			// param and a missing param both round-trip as `''`.
			'hasSearchParam'             => static::has_search_param(),
			// URL key the JS store uses to read/write the search query. `s`
			// on the WP search route, `q` on non-search pages — see
			// `get_search_param_name()`. Threaded through the seed so the JS
			// store reads from the same key the seed pulled `searchQuery`
			// from.
			'searchParamName'            => static::get_search_param_name(),
			'sortOrder'                  => static::parse_url_sort(),
			'activeFilters'              => $active_filters,
			'filterLogic'                => $filter_logic,
			'priceRange'                 => $price_range,

			// filterConfigs: each filter-checkbox block's render.php merges its
			// own entry here. Shape: { [filterKey]: { filterKey, filterType,
			// taxonomy, effectiveSlug, label, showCount, maxItems } }. The
			// `effectiveSlug` is resolved server-side at config-build time
			// against `jetpack_search_custom_taxonomy_map`, so JS query
			// builders never have to consult the global map themselves.
			'filterConfigs'              => array(),

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
			'results'                    => array(),
			'aggregations'               => (object) array(),
			// Per-filter union of values seen across the session's aggregation
			// responses. The JS store appends to this on each successful fetch
			// so checkbox-filter lists can keep options visible even after a
			// narrower query drops them from ES results.
			'retainedFilterOptions'      => (object) array(),
			'totalResults'               => 0,
			'pageHandle'                 => null,

			// UI state. `isLoading` is seeded true when the URL carries a
			// search query or filter selection so the empty-state region inside
			// `jetpack-search/results-list` stays hidden between first paint and JS
			// hydrating the initial fetch — otherwise a "No results found" flash
			// appears on deep links.
			'isLoading'                  => $is_initial_loading,
			'isLoadingMore'              => false,
			'hasError'                   => false,

			// One-shot pre-hydration skeleton gate. The IA SSR pass evaluates
			// `data-wp-bind--hidden` against literal seeded values (it can't
			// run JS getters), so skeleton elements bind directly to this
			// boolean. JS flips it to true once `actions.search()` resolves
			// and never resets it — subsequent re-searches keep live results
			// on screen without re-flashing placeholders.
			'skeletonHidden'             => false,

			// Seeded so the SSR pass can resolve `data-wp-text` to a real
			// string on first paint; `actions.search()` keeps it in lockstep
			// with `isLoading` / `totalResults` via `computeResultsCountText`.
			'resultsCountText'           => $is_initial_loading ? $searching_text : '',

			// Translated view-bundle strings. The Interactivity API view bundle
			// can't import @wordpress/i18n (only @wordpress/interactivity is
			// registered as a script module), so any JS-produced text is seeded
			// here and read via state.strings.* on the client. Both _n() forms
			// are seeded so the client can pick based on the live totalResults
			// without a round trip; languages with more than two plural forms
			// degrade to "plural for all count > 1" as an accepted tradeoff.
			'strings'                    => static::build_initial_strings(),

			// Currency symbol displayed inside the price filter pill rendered
			// by the active-filters block. Defaults to `$`; the price block's
			// render.php overrides this with the author's currencySymbol
			// attribute so a single chip on the page reflects whatever symbol
			// the price input itself uses. The stored numeric value stays
			// locale-agnostic — only the display string carries the symbol.
			'priceCurrencySymbol'        => '$',

			// Localized rotating loading hints shown while the "Show more"
			// extended AI answer streams. Lives on the top-level seed (not
			// under `strings`) because the `strings` map is typed
			// `array<string,string>` for Phan, and an `array<int,string>`
			// value would break that contract — splitting it out keeps both
			// surfaces strictly typed.
			'aiExtendedLoadingHints'     => static::build_ai_extended_loading_hints(),

			// Display labels for `wc_stock_status` selections, keyed by slug.
			// Seeded from the status block's static option list so an active-
			// filters chip for "instock" reads "In stock" rather than the raw
			// slug. RSM-1932 will swap this with WC's translated labels so
			// non-English locales render correctly; the map shape stays the
			// same.
			'wcStockStatusLabels'        => static::build_stock_status_labels(),
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
		// `has_search_param()` rather than `parse_url_search_query() !== ''` —
		// an explicit `?s=` (empty value) still means the visitor landed on a
		// search page and expects an initial unfiltered result set, the same
		// as submitting a blank search form. The non-empty case is a subset
		// of "param present" so this guard subsumes the old text-query check.
		if ( static::has_search_param() ) {
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
	 * Whether the current request is scoped to exactly the `product` post
	 * type via the URL. In practice this is driven by the Jetpack Search
	 * array shape `?post_types[]=product` — the shape store/url-state.js
	 * writes and round-trips. The scalar `?post_type=product` is also
	 * accepted for completeness, but a top-level `?post_type=product` is a
	 * WordPress core query var that reroutes the request to the product
	 * post-type archive (the WooCommerce shop template) before any Jetpack
	 * Search block renders, so it does not reach this code on a normal
	 * search page; it only matters for a custom search context that carries
	 * the scalar param within the Search template.
	 *
	 * Used by results-list/render.php to auto-switch to the product layout
	 * for a product search without the author hand-picking it. "Exactly
	 * product" is deliberate: a mixed request (e.g.
	 * `?post_types[]=product&post_types[]=post`) keeps the saved layout so
	 * non-product results never render as product cards. Reads `$_GET`
	 * directly rather than `parse_url_filters()` because post-type scope is
	 * not a registered visitor-facing filter — it never lands in
	 * `activeFilters`.
	 *
	 * Deliberately not memoized (unlike `is_initial_loading()`): the only
	 * caller is results-list/render.php, and a page carries one such block,
	 * so this runs at most once per request. Mirrors `parse_url_filters()`,
	 * which is likewise uncached. Skipping the static-cache + test-reset
	 * plumbing keeps the no-shared-state contract the tests rely on.
	 *
	 * @return bool
	 */
	public static function request_is_product_only(): bool {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- read-only URL state; sanitized per-value below.
		$raw = wp_unslash( $_GET );
		if ( ! is_array( $raw ) ) {
			return false;
		}

		$requested = array();
		foreach ( array( 'post_type', 'post_types' ) as $param ) {
			if ( ! isset( $raw[ $param ] ) ) {
				continue;
			}
			$values = is_array( $raw[ $param ] ) ? $raw[ $param ] : array( $raw[ $param ] );
			foreach ( $values as $value ) {
				if ( ! is_scalar( $value ) ) {
					continue;
				}
				$slug = sanitize_key( (string) $value );
				if ( '' !== $slug ) {
					$requested[ $slug ] = true;
				}
			}
		}

		return array( 'product' ) === array_keys( $requested );
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
				'searching'               => 'Searching…',
				'resultsCountSingle'      => 'Found %d result',
				'resultsCountPlural'      => 'Found %d results',
				'removeFilter'            => 'Remove %s',
				'ratingStarsTop'          => '5 stars',
				'ratingStarsAndUpSingle'  => '%d star and up',
				'ratingStarsAndUpPlural'  => '%d stars and up',
				'priceRangeFromTo'        => '%1$s – %2$s',
				'priceRangeFrom'          => '%s+',
				'priceRangeUpTo'          => 'Under %s',
				'priceLabel'              => 'Price',
				'suggestionLabelQuery'    => 'Suggestions',
				'suggestionLabelTaxonomy' => 'Popular Filters',
				'suggestionLabelPost'     => 'Articles',
				'aiErrorMessage'          => 'Sorry, an error occurred while generating an answer.',
				'aiErrorCode'             => 'Error code: %s',
			);
		}
		return array(
			'searching'               => __( 'Searching…', 'jetpack-search-pkg' ),
			/* translators: %d: number of results. */
			'resultsCountSingle'      => _n( 'Found %d result', 'Found %d results', 1, 'jetpack-search-pkg' ),
			/* translators: %d: number of results. */
			'resultsCountPlural'      => _n( 'Found %d result', 'Found %d results', 2, 'jetpack-search-pkg' ),
			/* translators: %s: filter label (e.g. "Category: News"). Announced by screen readers when focus lands on a filter pill's remove button. */
			'removeFilter'            => __( 'Remove %s', 'jetpack-search-pkg' ),
			/* translators: Active-filter chip label for the 5-star row. The 5-star row is "exactly 5 stars" — no "& up" affordance — because there is no higher rating. Mirrors the row's aria-label in filter-wc-rating/render.php. */
			'ratingStarsTop'          => __( '5 stars', 'jetpack-search-pkg' ),
			/* translators: %d: rating threshold (singular form, i.e. 1). Active-filter chip label for the "1 star and up" threshold row. Mirrors the row's aria-label in filter-wc-rating/render.php. */
			'ratingStarsAndUpSingle'  => _n( '%d star and up', '%d stars and up', 1, 'jetpack-search-pkg' ),
			/* translators: %d: rating threshold (plural form, i.e. 2-4). Active-filter chip label for the "X stars and up" threshold rows. Mirrors the row's aria-label in filter-wc-rating/render.php. */
			'ratingStarsAndUpPlural'  => _n( '%d star and up', '%d stars and up', 2, 'jetpack-search-pkg' ),
			/* translators: 1: minimum price (already includes the currency symbol). 2: maximum price (already includes the currency symbol). Renders an active "Price: $10 – $50" filter pill. */
			'priceRangeFromTo'        => __( '%1$s – %2$s', 'jetpack-search-pkg' ),
			/* translators: %s: minimum price (already includes the currency symbol). Renders an active "Price: $10+" filter pill (no upper bound) — compact "and above" form aligned with mainstream e-commerce filter chips. */
			'priceRangeFrom'          => __( '%s+', 'jetpack-search-pkg' ),
			/* translators: %s: maximum price (already includes the currency symbol). Renders an active "Price: Under $50" filter pill (no lower bound) — mirrors Amazon/eBay/Walmart's "Under $X" convention. */
			'priceRangeUpTo'          => __( 'Under %s', 'jetpack-search-pkg' ),
			/* translators: Group label for the price filter pill ("Price: $10 – $50"). Mirrors the price block's default heading; falls back to this when no price block is on the page. */
			'priceLabel'              => __( 'Price', 'jetpack-search-pkg' ),
			/* translators: Group label for the typed-query suggestions section of the Search Input autocomplete dropdown. */
			'suggestionLabelQuery'    => __( 'Suggestions', 'jetpack-search-pkg' ),
			/* translators: Group label for the taxonomy (category / tag) section of the Search Input autocomplete dropdown. */
			'suggestionLabelTaxonomy' => __( 'Popular Filters', 'jetpack-search-pkg' ),
			/* translators: Group label for the post-title section of the Search Input autocomplete dropdown. */
			'suggestionLabelPost'     => __( 'Articles', 'jetpack-search-pkg' ),
			/* translators: Heading shown on the AI Answer panel when the agent endpoint returns an error. The technical message + HTTP/JSON-RPC code render below this string. */
			'aiErrorMessage'          => __( 'Sorry, an error occurred while generating an answer.', 'jetpack-search-pkg' ),
			/* translators: %s: numeric error code. Surfaces the HTTP / JSON-RPC code that came back with the AI Answer failure, under the technical message. */
			'aiErrorCode'             => __( 'Error code: %s', 'jetpack-search-pkg' ),
		);
	}

	/**
	 * Localized rotating loading hints shown while the "Show more" extended
	 * AI answer streams. Mirrors the overlay's copy verbatim so the two
	 * surfaces read the same to a visitor switching between them.
	 *
	 * @return array<int, string>
	 */
	protected static function build_ai_extended_loading_hints(): array {
		// Source strings deliberately omit a trailing `…`. The block's
		// render.php emits an animated three-dot ellipsis right after the
		// label, so a static one in the source would read as a doubled
		// "Searching harder… …". The overlay strips the trailing `…` for
		// the same reason — keeping the source clean here means the two
		// surfaces share the same translation keys.
		if ( ! function_exists( '__' ) ) {
			return array(
				'Searching harder',
				'Looking deeper into this',
				'Finding a more complete answer',
				'Analyzing additional sources',
				'Gathering more details',
				'Pulling in more context',
				'Expanding the search',
				'Rolling up my virtual sleeves',
				'Digging through the archives',
				'Putting on my reading glasses',
				'Checking under the digital couch cushions',
				'Consulting the oracle',
				'Asking a smarter algorithm',
				'Brewing a fresh batch of insights',
				'Unleashing the full power of search',
			);
		}
		return array(
			__( 'Searching harder', 'jetpack-search-pkg' ),
			__( 'Looking deeper into this', 'jetpack-search-pkg' ),
			__( 'Finding a more complete answer', 'jetpack-search-pkg' ),
			__( 'Analyzing additional sources', 'jetpack-search-pkg' ),
			__( 'Gathering more details', 'jetpack-search-pkg' ),
			__( 'Pulling in more context', 'jetpack-search-pkg' ),
			__( 'Expanding the search', 'jetpack-search-pkg' ),
			__( 'Rolling up my virtual sleeves', 'jetpack-search-pkg' ),
			__( 'Digging through the archives', 'jetpack-search-pkg' ),
			__( 'Putting on my reading glasses', 'jetpack-search-pkg' ),
			__( 'Checking under the digital couch cushions', 'jetpack-search-pkg' ),
			__( 'Consulting the oracle', 'jetpack-search-pkg' ),
			__( 'Asking a smarter algorithm', 'jetpack-search-pkg' ),
			__( 'Brewing a fresh batch of insights', 'jetpack-search-pkg' ),
			__( 'Unleashing the full power of search', 'jetpack-search-pkg' ),
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
	 * Whether the active search-query URL key is present in `$_GET`, regardless
	 * of value. Distinguishes `?s=` (visitor submitted a blank search and
	 * expects an unfiltered result set) from a URL that omits `s` entirely
	 * (homepage, archive, etc.) — `parse_url_search_query()` collapses both
	 * to `''`. Mirrors the JS-side `hasSearchParam` field seeded into the
	 * Interactivity store.
	 *
	 * Array-shaped `?s[]=foo` is treated as "not present" to stay in lockstep
	 * with `parse_url_search_query()` (which returns `''` for non-scalar
	 * input) — otherwise a malformed deep link would flip the page into the
	 * loading state with no usable query to fire.
	 *
	 * @return bool
	 */
	public static function has_search_param(): bool {
		$key = self::get_search_param_name();
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only URL presence check; the value is never read here.
		return isset( $_GET[ $key ] ) && is_scalar( $_GET[ $key ] );
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
		if ( ! self::woocommerce_blocks_enabled() ) {
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
