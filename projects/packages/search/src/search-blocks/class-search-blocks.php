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
	 * Reserved query params (mirrors `RESERVED_PARAMS` in `store/url-state.js`).
	 * `s` is the WP search route key; `q` is what the inline blocks use on
	 * non-search pages (see `get_search_param_name()`). Neither may be parsed as a filter key.
	 */
	const RESERVED_QUERY_PARAMS = array( 's', 'q', 'orderby', 'min_price', 'max_price' );

	/**
	 * Query-string param for inline search on non-search pages (e.g. `/about/?q=boots`).
	 * Not `s`, because on singular pages WP's `WP_Query::get_posts()` AND's a
	 * `post_content LIKE` clause into the lookup and 404s on refresh. See
	 * `docs/explorations/embedded-search-refresh-404.md` (RSM-1754).
	 */
	const NON_SEARCH_QUERY_PARAM = 'q';

	/**
	 * Jetpack Search page template slug. Distinct from WP's `search` slug so a
	 * block theme's `search.html` doesn't dedupe ours; `search_template_hierarchy`
	 * prepends this slug so it still wins on `/?s=...`.
	 */
	const SEARCH_TEMPLATE_SLUG = 'jetpack-search';

	/**
	 * Jetpack product-search template slug. Separate from `SEARCH_TEMPLATE_SLUG`
	 * so it gets its own Site Editor entry.
	 */
	const PRODUCT_SEARCH_TEMPLATE_SLUG = 'jetpack-search-product-results';

	/**
	 * Mirror of `ProductSearchResultsTemplate::SLUG`, inlined to avoid a hard
	 * dependency on the WooCommerce class.
	 */
	const WC_PRODUCT_SEARCH_TEMPLATE_SLUG = 'product-search-results';

	/**
	 * Lowest WC version that registers the `product-search-results` template
	 * (WC 6.5 bundled WC Blocks 7.4, the release that first added it). Below
	 * this, WC-only Search features have nothing to front and the gate stays closed.
	 */
	const MIN_WOOCOMMERCE_VERSION = '6.5.0';

	/**
	 * Per-request memo for `is_initial_loading()`. Lifted out of a method-local
	 * `static` so tests can clear it via `reset_initial_loading_cache()`;
	 * otherwise URL state from the first test leaks into subsequent ones.
	 *
	 * @var bool|null
	 */
	private static $is_initial_loading_cache = null;

	/**
	 * Per-request memo for `get_overlay_template_content()`, keyed `default` /
	 * `product`. Lifted out of a method-local `static` so tests can clear it via
	 * `reset_overlay_template_content_cache()` — otherwise a CPT-customized
	 * overlay saved mid-test would be pinned by an earlier bundled-file read.
	 *
	 * @var array<string,string>
	 */
	private static $overlay_template_content_cache = array();

	/**
	 * Per-request memo for `is_free_plan()`. Avoids the cold-cache hazard where
	 * `Plan::get_plan_info()` falls back to a synchronous WPCOM HTTP call —
	 * render callbacks hit the plan gate on every inner render.
	 *
	 * @var bool|null
	 */
	private static $is_free_plan_cache = null;

	/**
	 * Per-request memo for `supports_paid_search()`. Separate from
	 * `is_free_plan_cache` because the two answers can disagree: a site with
	 * no plan info is neither on the free plan nor on a paid one.
	 *
	 * @var bool|null
	 */
	private static $supports_paid_search_cache = null;

	/**
	 * Per-request memo for `woocommerce_blocks_enabled()`. Centralized so every
	 * gate (registration, render, editor config, IA store seed) shares one probe.
	 *
	 * @var bool|null
	 */
	private static $woocommerce_blocks_enabled_cache = null;

	/**
	 * Per-request memo for `supported_custom_taxonomies()`. Derived from the
	 * Sync allowlist intersected with registered taxonomies and unioned with
	 * the map's user-facing keys — same inputs every request.
	 *
	 * @var string[]|null
	 */
	private static $supported_custom_taxonomies_cache = null;

	/**
	 * Cached rendered overlay-template HTML. Filled during `wp_enqueue_scripts`
	 * so the embedded blocks' view-module enqueues land before
	 * `wp_print_import_map()` (footer priority 1) — see AGENTS.md
	 * § Hydration & SSR seeding.
	 *
	 * @var string|null
	 */
	private static $block_template_overlay_rendered_html = null;

	/**
	 * Register block types and hook into WordPress.
	 *
	 * Two gates apply: the caller (`Initializer`) gates everything behind the
	 * `jetpack_search_blocks_enabled` feature flag, and within this method the
	 * template-takeover surface (registering the Search template and prepending
	 * it to `search_template_hierarchy`) is additionally gated on the saved
	 * experience being `'embedded'` — only Embedded should override the theme's
	 * `search.html`. Block registration, editor assets, and IA state seeding
	 * always run so blocks inserted anywhere (post content, widgets, custom
	 * templates) get their base seed.
	 */
	public static function init() {
		add_action( 'init', array( static::class, 'register_blocks' ) );
		add_filter( 'block_categories_all', array( static::class, 'register_block_category' ) );
		add_action( 'enqueue_block_editor_assets', array( static::class, 'enqueue_editor_assets' ) );
		add_action( 'wp_body_open', array( static::class, 'print_theme_token_sampler' ) );
		// Relativize `jetpack-search/*` Script Module URLs whose host matches
		// the site canonical so the rendered `<script type="module">` is
		// same-origin with the page. ES modules go through CORS even without
		// a `crossorigin` attribute, and `wp-content/*` typically lacks the
		// `Access-Control-Allow-Origin` header — see
		// `same_origin_script_module_src()`.
		add_filter( 'script_module_loader_src', array( static::class, 'same_origin_script_module_src' ), 10, 2 );
		Custom_Taxonomy_Slot_Mapping::init();
		// Both hooks needed; see AGENTS.md § Hydration & SSR seeding.
		add_action( 'template_redirect', array( static::class, 'seed_interactivity_state' ) );
		add_action( 'wp_enqueue_scripts', array( static::class, 'seed_interactivity_state' ) );

		$experience = ( new Module_Control() )->get_experience();

		if ( Module_Control::EXPERIENCE_EMBEDDED === $experience ) {
			if ( static::block_templates_active() ) {
				// Block themes: register the template and front it via the FSE hierarchy filter.
				add_action( 'init', array( static::class, 'register_search_template' ) );
				add_filter( 'search_template_hierarchy', array( static::class, 'prepend_search_template' ) );
				add_action( 'wp_enqueue_scripts', array( static::class, 'enqueue_search_page_assets' ) );
				Theme_Chrome_Slug_Resolver::register_hooks();
			} else {
				// Classic themes: no FSE hierarchy to prepend to, so swap the
				// resolved template path via `template_include`. The block markup
				// renders inside the theme's `get_header()`/`get_footer()`.
				//
				// Priority 20: WooCommerce's `WC_Template_Loader::template_loader`
				// hooks at priority 10 and rewrites the path to `archive-product.php`
				// on product-archive requests — that includes product search. We
				// need to run *after* WC so the override actually sticks; running
				// at 10 (same priority, later registration) is order-of-load
				// dependent. Higher priorities (anything > 20 used by chrome
				// filters) aren't relevant — nothing else swaps the path.
				add_filter( 'template_include', array( static::class, 'route_classic_theme_search_template' ), 20 );
				// No Site Editor entry on classic themes; the singleton CPTs give
				// authors the standard block editor on hidden posts instead. Both
				// init regardless of the WooCommerce override option so admins can
				// pre-customize either template before activating the relevant
				// surface — matching `Search_Template`'s "expose URLs before
				// activation" rule. The override option still gates the actual
				// front-end render path in `route_classic_theme_search_template()`.
				Search_Template::init();
				Product_Search_Template::init();
			}
		}

		// Inline on a classic theme: the theme renders regular searches, but a
		// WooCommerce product search can still be routed to the Jetpack product
		// shim. `route_classic_theme_search_template()` is product-only for
		// Inline (it bails on regular searches unless Embedded); the block-theme
		// Inline path is covered by the `search_template_hierarchy` route below.
		// Init the product CPT regardless of the override so admins can
		// pre-customize it (expose-before-activation, as in the Embedded branch).
		if (
			Module_Control::EXPERIENCE_INLINE === $experience
			&& ! static::block_templates_active()
		) {
			add_filter( 'template_include', array( static::class, 'route_classic_theme_search_template' ), 20 );
			Product_Search_Template::init();
		}

		// Blocks render results client-side, so the server-side search is wasted work.
		// (Classic/Instant init is also suppressed in `Initializer::init_search_blocks()`.)
		if ( ! is_admin() && static::owns_search_results() ) {
			add_filter( 'posts_pre_query', array( static::class, 'filter__posts_pre_query' ), 10, 2 );
		}

		// Priority 20: after WC's priority-10 prepend so the result is load-order
		// independent. Gated to server-rendered experiences (Embedded / Inline) —
		// Overlay intercepts client-side, and a stale option from a since-switched
		// experience must not keep rerouting the template hierarchy.
		if (
			static::woocommerce_search_template_override_enabled()
			&& in_array( $experience, array( Module_Control::EXPERIENCE_EMBEDDED, Module_Control::EXPERIENCE_INLINE ), true )
		) {
			add_action( 'init', array( static::class, 'register_product_search_template' ) );
			add_filter( 'search_template_hierarchy', array( static::class, 'route_woocommerce_product_search_template' ), 20 );
			// Inline experience doesn't go through the EMBEDDED branch above, so
			// hook the page-template CSS enqueue here too. Idempotent on EMBEDDED
			// — `add_action` dedupes same callback at same priority.
			add_action( 'wp_enqueue_scripts', array( static::class, 'enqueue_search_page_assets' ) );
		}

		// Two-tier gate: register the editable template CPT + admin-init editor
		// handler whenever the operator filter is on, so admins can edit the
		// overlay template *before* opting into the blocks Overlay experience
		// (e.g. preview the editor from the Beta card while the preact Overlay
		// is still the active arm — without this split, the editorUrl seeded
		// into the React initial state at page load would be null and the
		// link would become a no-op once the user switched to the Beta card
		// without a page refresh). The front-end render hooks stay gated on
		// the active experience — they only paint the overlay when the user
		// has actually committed to it.
		if ( static::is_block_template_overlay_filter_on() ) {
			Overlay_Template::init();
			// The product overlay only renders on a Woo store, so its editable
			// CPT is pointless off Woo. Init regardless of the override option
			// (parity with `Product_Search_Template`) so admins can pre-customize
			// before flipping it on; the front-end render path stays gated by
			// the override option in `should_use_product_overlay()`.
			if ( static::woocommerce_blocks_enabled() ) {
				Product_Overlay_Template::init();
			}
		}
		if ( static::is_block_template_overlay_enabled() ) {
			add_action( 'wp_enqueue_scripts', array( static::class, 'enqueue_block_template_overlay_assets' ) );
			add_action( 'wp_footer', array( static::class, 'print_block_template_overlay' ) );
		}
	}

	/**
	 * Whether the Search blocks own the front-end search results for the active
	 * experience, meaning the server should run no search of its own.
	 *
	 * True for Embedded (the blocks template takes over the search page) and for
	 * the enabled blocks Overlay (a full-screen modal over the theme's search
	 * page). The Overlay arm goes through `is_block_template_overlay_enabled()`
	 * — operator filter plus saved experience — so a stale `overlay_blocks`
	 * option can't keep suppressing server search after the overlay is turned
	 * off. Drives both the Classic/Instant init suppression in
	 * `Initializer::init_search_blocks()` and the `posts_pre_query` short-circuit
	 * registered in `init()`.
	 *
	 * @return bool
	 */
	public static function owns_search_results(): bool {
		return Module_Control::EXPERIENCE_EMBEDDED === ( new Module_Control() )->get_experience()
			|| static::is_block_template_overlay_enabled();
	}

	/**
	 * Whether TrainTracks analytics are suppressed for this request. Mirrors
	 * instant search (Helper::get_search_options): the `?disable_tracking=1`
	 * crawler/QA param plus the `jetpack_instant_search_disable_tracking`
	 * operator filter. Gates both the `_tkq` pushes (seeded into
	 * `state.disableTracking`) and whether the Tracks consumer script loads.
	 *
	 * @return bool
	 */
	public static function is_tracking_disabled(): bool {
		return ( class_exists( Helper::class ) && Helper::is_tracking_disabled() )
			|| apply_filters( 'jetpack_instant_search_disable_tracking', false );
	}

	/**
	 * Short-circuit the main front-end search query when the blocks own results
	 * (see AGENTS.md § Search experiences). Registered only when
	 * `owns_search_results()` is true and off `is_admin()`.
	 *
	 * Pagination totals are set to `1` (not `0`) so `have_posts()`-gated
	 * templates still render the shell the client hydrates — WP core skips
	 * `set_found_posts()` when `posts_pre_query` returns an array.
	 *
	 * @param array|null $posts Posts to return in place of the query (null by default).
	 * @param \WP_Query  $query The WP_Query being filtered.
	 * @return array|null Empty array to short-circuit, or $posts to let it run.
	 */
	public static function filter__posts_pre_query( $posts, $query ) {
		if ( ! $query->is_main_query() || ! $query->is_search() ) {
			return $posts;
		}

		$query->found_posts   = 1;
		$query->max_num_pages = 1;

		return array();
	}

	/**
	 * Whether to replace the legacy instant-search overlay with the
	 * server-rendered Search blocks template
	 * (`templates/jetpack-search-overlay.html`).
	 *
	 * Two conditions: the operator filter `is_block_template_overlay_filter_on()`
	 * is on (defaults true), AND the site owner has chosen
	 * `Module_Control::EXPERIENCE_OVERLAY_BLOCKS` in the dashboard. When both
	 * hold, the legacy `SearchApp` is bypassed via
	 * `jetpack_search_init_instant_search` in `Initializer::init_search_blocks()`.
	 *
	 * @return bool
	 */
	public static function is_block_template_overlay_enabled(): bool {
		if ( ! static::is_block_template_overlay_filter_on() ) {
			return false;
		}
		return Module_Control::EXPERIENCE_OVERLAY_BLOCKS === ( new Module_Control() )->get_experience();
	}

	/**
	 * Whether the operator filter that exposes the blocks-powered overlay is on.
	 *
	 * Lighter than `is_block_template_overlay_enabled()` — doesn't require the
	 * user to have opted into the new overlay. Use for one-time setup that
	 * should run *before* opt-in (e.g. registering the editable template CPT
	 * so admins can preview the editor while preact Overlay is still active).
	 *
	 * @return bool
	 */
	public static function is_block_template_overlay_filter_on(): bool {
		/**
		 * Opt out of the experimental Search blocks overlay. Available by
		 * default; return false to hide the Beta card from the Experience
		 * Selector and disable the editable-template CPT.
		 *
		 * @param bool $enabled Default true.
		 */
		return (bool) apply_filters( 'jetpack_search_overlay_block_template_enabled', true );
	}

	/**
	 * Memoized `Plan::is_free_plan()`. See `$is_free_plan_cache`.
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
	 * Reset the `is_free_plan()` memo. Tests only.
	 */
	public static function reset_is_free_plan_cache() {
		self::$is_free_plan_cache = null;
	}

	/**
	 * Whether the site has a paid Jetpack Search subscription. Paid-only block
	 * surfaces (AI Answer) call this on every render.
	 *
	 * Both probes are needed: `supports_instant_search()` is true on the free
	 * Search plan too ("plan supports the feature"), so it alone would let free
	 * through. `! is_free_plan()` excludes free + forced-free; `supports_instant_search()`
	 * excludes the no-plan case (which `is_free_plan()` returns false for).
	 *
	 * No `apply_filters()` wrapper by design — a filter that any plugin could
	 * flip would defeat a paid-feature gate. Tests bypass via
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
	 * Force the `supports_paid_search()` answer — tests only. Pass `null` to clear.
	 *
	 * @internal
	 * @param bool|null $value Forced answer or null to clear.
	 */
	public static function set_supports_paid_search_for_testing( ?bool $value ): void {
		self::$supports_paid_search_cache = $value;
	}

	/**
	 * Reset the `supports_paid_search()` memo. Tests only.
	 *
	 * @internal
	 */
	public static function reset_supports_paid_search_cache(): void {
		self::$supports_paid_search_cache = null;
	}

	/**
	 * Whether Jetpack Search exposes its WooCommerce-only blocks, filter
	 * variations, and render paths. See AGENTS.md § WooCommerce gating.
	 *
	 * **Load-order contract:** call at or after `plugins_loaded`. WC includes
	 * its main class during `plugins_loaded`, so an earlier call returns false
	 * on a WC site. Existing callers all fire later (`enqueue_block_editor_assets`,
	 * `template_redirect`, `wp_enqueue_scripts`, block render).
	 *
	 * @return bool
	 */
	public static function woocommerce_blocks_enabled(): bool {
		if ( null === self::$woocommerce_blocks_enabled_cache ) {
			// `false` second arg: skip the autoloader on non-Woo sites — this
			// gate is hit on every request and autoloader work would be wasted.
			$probed = class_exists( 'WooCommerce', false ) && self::woocommerce_version_supported();

			/**
			 * Whether Jetpack Search exposes its WooCommerce-only blocks,
			 * filter variations, and render paths. Default is the
			 * `class_exists( 'WooCommerce', false )` probe AND a minimum
			 * WooCommerce version check.
			 *
			 * @since 0.59.0
			 *
			 * @param bool $enabled Defaults to the WooCommerce class + version probe.
			 */
			self::$woocommerce_blocks_enabled_cache = (bool) apply_filters(
				'jetpack_search_woocommerce_blocks_enabled',
				$probed
			);
		}
		return self::$woocommerce_blocks_enabled_cache;
	}

	/**
	 * Whether the active WooCommerce is at `MIN_WOOCOMMERCE_VERSION` or newer.
	 * Older or absent WooCommerce reads as unsupported.
	 *
	 * @since 7.1.0
	 *
	 * @param string|null $version WooCommerce version to test; defaults to the
	 *   live `WC_VERSION` constant. Override is for tests pinning a version.
	 * @return bool
	 */
	public static function woocommerce_version_supported( ?string $version = null ): bool {
		// `constant()` keeps static analysis happy — WC isn't a dependency here.
		$version = $version ?? ( defined( 'WC_VERSION' ) ? (string) constant( 'WC_VERSION' ) : '' );
		return '' !== $version && version_compare( $version, self::MIN_WOOCOMMERCE_VERSION, '>=' );
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
	 * Whether the current request is a WooCommerce product search — a search
	 * query scoped to the `product` post-type archive on a Woo-enabled site.
	 *
	 * Theme-agnostic. Block-theme-only behavior (FSE hierarchy work) gates on
	 * {@see block_templates_active()} at the call site so this predicate also
	 * drives the classic-theme product shim. Public to keep the WC-gating
	 * surface (see AGENTS.md § WooCommerce gating) discoverable from outside
	 * the class; the in-class callers are `route_classic_theme_search_template()`
	 * and `route_woocommerce_product_search_template()`.
	 *
	 * @return bool
	 */
	public static function is_woocommerce_product_search(): bool {
		return self::woocommerce_blocks_enabled()
			&& is_search()
			&& is_post_type_archive( 'product' );
	}

	/**
	 * Canonical list of WooCommerce-only block names. Single source of truth
	 * for the WC gate across registration, helpers, and editor bundle — see
	 * AGENTS.md § WooCommerce gating. Add an entry and every gate picks it up.
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
	 * Whether a block name belongs to a WooCommerce-only block. Accepts either
	 * the full namespaced name or a bare directory basename (the registration
	 * loop walks basenames; helpers and editor hold full names).
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
	 * Built-in taxonomies that have dedicated filter-checkbox variations.
	 * Excluded from the "Custom Taxonomy" picker so authors reach for the
	 * dedicated variation. Mirrors `BUILT_IN_TAXONOMY_SLUGS` in
	 * `filter-checkbox/edit.js` — must stay in lockstep.
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
	 *
	 * @return array<string, string>
	 */
	public static function custom_taxonomy_map(): array {
		return Custom_Taxonomy_Slot_Mapping::get_map();
	}

	/**
	 * Back-compat proxy for `Custom_Taxonomy_Slot_Mapping::resolve_slot()`.
	 *
	 * @param string $taxonomy User-facing taxonomy slug.
	 * @return string Effective ES field slug.
	 */
	public static function resolve_taxonomy_slot( string $taxonomy ): string {
		return Custom_Taxonomy_Slot_Mapping::resolve_slot( $taxonomy );
	}

	/**
	 * Reset both the slot-mapping and `supported_custom_taxonomies()` memos. Tests only.
	 *
	 * @internal
	 */
	public static function reset_custom_taxonomy_map_cache(): void {
		Custom_Taxonomy_Slot_Mapping::reset_cache_for_testing();
		self::$supported_custom_taxonomies_cache = null;
	}

	/**
	 * Custom-taxonomy slugs the "Custom Taxonomy" filter variation offers.
	 *
	 * Supported when registered locally AND either (a) in the Jetpack Search
	 * indexable allowlist (`Sync\Modules\Search::get_all_taxonomies()`, so
	 * aggregations actually return buckets) or (b) a key in `custom_taxonomy_map()`
	 * (queries route through a reserved slot). Built-ins with dedicated variations
	 * are stripped. The Sync `class_exists` guard is defensive — partial installs
	 * fall back to "map keys only".
	 *
	 * @return string[] Distinct, zero-indexed list of supported taxonomy slugs.
	 */
	public static function supported_custom_taxonomies(): array {
		if ( null !== self::$supported_custom_taxonomies_cache ) {
			return self::$supported_custom_taxonomies_cache;
		}

		// Public taxonomies only — the editor's `core.getTaxonomies()` only returns
		// REST-visible ones, and a private taxonomy in the Sync allowlist shouldn't surface.
		$registered = function_exists( 'get_taxonomies' )
			? array_values( get_taxonomies( array( 'public' => true ), 'names' ) )
			: array();

		$indexed = class_exists( '\\Automattic\\Jetpack\\Sync\\Modules\\Search' )
			? \Automattic\Jetpack\Sync\Modules\Search::get_all_taxonomies()
			: array();

		$map_keys = array_keys( self::custom_taxonomy_map() );

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
	 * On the WP search route `s`; elsewhere `q` (see `NON_SEARCH_QUERY_PARAM`).
	 *
	 * @return string
	 */
	public static function get_search_param_name(): string {
		return function_exists( 'is_search' ) && is_search() ? 's' : self::NON_SEARCH_QUERY_PARAM;
	}

	/**
	 * Enqueue the client-side block registration bundle in the block editor.
	 *
	 * WP bootstraps server-side block metadata into the editor, but each block
	 * still needs a client-side `registerBlockType()` call so the editor knows
	 * how to render a preview. This script does that with ServerSideRender.
	 */
	public static function enqueue_editor_assets() {
		$base_path  = Package::get_installed_path() . 'build/search-blocks-editor/';
		$asset_file = $base_path . 'register-blocks.asset.php';
		if ( ! file_exists( $asset_file ) ) {
			return;
		}
		$asset = require $asset_file;

		// `plugins_url()` resolves against the nearest plugin directory, which
		// handles the `jetpack_vendor` location Composer installs into.
		$url = plugins_url( 'register-blocks.js', $base_path . 'register-blocks.js' );

		wp_enqueue_script(
			'jetpack-search-blocks-register',
			$url,
			$asset['dependencies'] ?? array(),
			$asset['version'] ?? false,
			true
		);

		// Surface PHP gates to the editor bundle so block edits and the
		// registration loop branch consistently with server-side renders.
		// `wp_add_inline_script` (not `wp_localize_script`) per core #25280 —
		// the latter HTML-encodes ampersands inside nested values.
		wp_add_inline_script(
			'jetpack-search-blocks-register',
			'window.JetpackSearchBlocksConfig = ' . wp_json_encode(
				array(
					'isWooCommerceBlocksEnabled' => self::woocommerce_blocks_enabled(),
					'woocommerceOnlyBlocks'      => self::woocommerce_only_block_names(),
					'supportsPaidSearch'         => self::supports_paid_search(),
					'supportedCustomTaxonomies'  => self::supported_custom_taxonomies(),
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
	 * See AGENTS.md § Shared store / bundles for why this is externalized.
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
	 * Relativize Jetpack Search Script Module URLs so the browser fetches them
	 * same-origin with the page.
	 *
	 * `wp_register_script_module()` resolves src via `plugins_url()`, which
	 * returns the canonical `site_url()` host. When a visitor is on a
	 * different host (Multisite mapped domains, www vs non-www without a
	 * canonical redirect, asset-offload plugins, reverse-proxy staging) the
	 * `<script type="module">` becomes cross-origin and is blocked with
	 * `MissingAllowOriginHeader` — ES modules always go through the CORS
	 * algorithm, even without a `crossorigin` attribute, and typical WP
	 * hosts don't send `Access-Control-Allow-Origin` for `wp-content/*`.
	 *
	 * Stripping scheme + host with `wp_make_link_relative()` lets the browser
	 * resolve against the page's actual origin. No `$_SERVER['HTTP_HOST']`
	 * trust — emitting an attacker-controllable host into a `<script src>`
	 * would be a cache-poisoning vector.
	 *
	 * No-op when the src host is a deliberately external host (CDN that
	 * doesn't match `home_url()`/`site_url()`); operators of those setups
	 * configure CORS on the CDN themselves.
	 *
	 * Identifier gate covers both shapes Jetpack Search ships: directly-
	 * registered modules with a slash (`jetpack-search/store`,
	 * `jetpack-search/overlay-bootstrap`) and the per-block view modules
	 * WP auto-registers from `block.json`'s `viewScriptModule`, which run
	 * `generate_block_asset_handle()` and emit hyphen-joined IDs like
	 * `jetpack-search-results-list-view-script-module`.
	 *
	 * @param string $src        Module src URL.
	 * @param string $identifier Module identifier (e.g. `jetpack-search/results-list`
	 *                           or `jetpack-search-results-list-view-script-module`).
	 * @return string Relativized src on match, original otherwise.
	 */
	public static function same_origin_script_module_src( $src, $identifier ) {
		if ( ! is_string( $src ) || '' === $src || ! is_string( $identifier ) ) {
			return $src;
		}
		if ( 0 !== strpos( $identifier, 'jetpack-search/' ) && 0 !== strpos( $identifier, 'jetpack-search-' ) ) {
			return $src;
		}

		$src_host = wp_parse_url( $src, PHP_URL_HOST );
		if ( ! $src_host ) {
			return $src;
		}

		$canonical_hosts = array_map(
			'strtolower',
			array_filter(
				array(
					wp_parse_url( home_url(), PHP_URL_HOST ),
					wp_parse_url( site_url(), PHP_URL_HOST ),
				)
			)
		);

		if ( ! in_array( strtolower( $src_host ), $canonical_hosts, true ) ) {
			return $src;
		}

		return wp_make_link_relative( $src );
	}

	/**
	 * Inject named block variations for the filter-checkbox block.
	 *
	 * Uses the `get_block_type_variations` filter (WP 6.5+) rather than
	 * `register_block_variation()` — the latter is JS-only and has no PHP
	 * equivalent. Variation names + default attributes mirror the
	 * instant-search overlay so both surfaces describe the same filters.
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

		// WC-only product-taxonomy variations. `product_brand` gets an extra
		// `taxonomy_exists()` probe — it isn't core WC, it ships via extensions
		// (WC Brands, Perfect Brands) or recent bundled WC versions.
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
			// Match on filterType only so identity survives the author picking a
			// slug. The dedicated variations pin `taxonomy` in their isActive
			// arrays, so WP's most-specific-match resolution still routes named
			// slugs to those; Custom Taxonomy claims every other taxonomy.
			'isActive'    => array( 'filterType' ),
		);

		// Merge by `name` so an upstream variation (block.json or earlier filter)
		// wins over our preset of the same name; plain `array_merge` would
		// append duplicates and the inserter would render two cards.
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
	 * Register block patterns. Files prefixed `wc-` compose WooCommerce-only
	 * blocks and load only when WC is active (mirrors `filter-wc-*` blocks).
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
	 * Derive a block-pattern's content from a chrome-free layout template (the
	 * overlay templates, which already ship without header/footer/main page
	 * chrome), so patterns stay in sync with the template they mirror instead of
	 * carrying a hand-copied second copy of the layout.
	 *
	 * @param string $template_file Template basename under `templates/`.
	 * @return string Block markup ready for `register_block_pattern()`, or '' when unreadable.
	 */
	public static function pattern_content_from_template( string $template_file ): string {
		$template_path = __DIR__ . '/templates/' . basename( $template_file );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local, bundled template file.
		$raw = is_readable( $template_path ) ? (string) file_get_contents( $template_path ) : '';
		if ( '' === $raw ) {
			return '';
		}
		return trim( static::substitute_template_placeholders( $raw ) );
	}

	/**
	 * Build the full search page template content.
	 *
	 * Markup lives in `templates/jetpack-search.html` with a `{{FILTER_HEADING}}`
	 * placeholder so the sidebar heading still goes through `esc_html__()`.
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
	 * Register the Jetpack Search page template so it surfaces in the Site
	 * Editor and resolves via the template hierarchy. DB-stored customizations
	 * still win automatically — the `custom` source beats `plugin`. Classic
	 * themes are skipped: the registry is only consulted by block themes.
	 */
	public static function register_search_template() {
		if ( ! function_exists( 'register_block_template' ) || ! static::block_templates_active() ) {
			return;
		}
		$content = static::get_search_template_content();
		// Bail on missing/unreadable file: our slug is prepended to the search
		// hierarchy, so registering empty content would render a blank page on
		// `/?s=…`. Falling through lets core resolve the theme's `search.html`.
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
	 * Whether the overlay should paint the WooCommerce product variant for the
	 * current request. True only when the override option is on and the request
	 * is a product search — mirrors the embedded/inline interception
	 * (`is_woocommerce_product_search()` already folds in the WC probe). The
	 * overlay opens client-side from any search box, so this only flips on the
	 * server-rendered product-search request (deep link or product-archive
	 * search), not on a live form intercept from a non-product page.
	 *
	 * @return bool
	 */
	protected static function should_use_product_overlay(): bool {
		return static::woocommerce_search_template_override_enabled()
			&& static::is_woocommerce_product_search();
	}

	/**
	 * Read the dedicated overlay-template markup.
	 *
	 * Distinct from `get_search_template_content()`: a modal isn't a page, so
	 * the overlay markup ships without `header`/`main`/`footer` template-parts
	 * rather than runtime-stripping them.
	 *
	 * Picks the product variant on a WooCommerce product search (see
	 * `should_use_product_overlay()`). Source of truth, in order:
	 *   1. Customized singleton CPT (`Overlay_Template` / `Product_Overlay_Template`).
	 *   2. The bundled `jetpack-search-overlay{-product}.html`.
	 *
	 * @return string Block markup for the overlay body.
	 */
	protected static function get_overlay_template_content(): string {
		$is_product = static::should_use_product_overlay();
		$key        = $is_product ? 'product' : 'default';
		if ( isset( self::$overlay_template_content_cache[ $key ] ) ) {
			return self::$overlay_template_content_cache[ $key ];
		}
		$cpt_class  = $is_product ? Product_Overlay_Template::class : Overlay_Template::class;
		$customized = $cpt_class::get_customized_content();
		if ( null !== $customized ) {
			self::$overlay_template_content_cache[ $key ] = $customized;
			return self::$overlay_template_content_cache[ $key ];
		}
		$file          = $is_product ? 'jetpack-search-overlay-product.html' : 'jetpack-search-overlay.html';
		$template_path = __DIR__ . '/templates/' . $file;
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local, bundled template file; wp_remote_get() is for remote URLs.
		self::$overlay_template_content_cache[ $key ] = is_readable( $template_path ) ? (string) file_get_contents( $template_path ) : '';
		return self::$overlay_template_content_cache[ $key ];
	}

	/**
	 * Reset the `get_overlay_template_content()` memo. Tests only — PHPUnit
	 * reuses a single process, so a CPT-customized overlay saved in one test
	 * would otherwise be pinned (or a bundled read would mask it) in the next.
	 * Guarded against accidental production use.
	 */
	public static function reset_overlay_template_content_cache(): void {
		if ( defined( 'ABSPATH' ) && ! defined( 'PHPUNIT_COMPOSER_INSTALL' ) ) {
			return;
		}
		self::$overlay_template_content_cache = array();
	}

	/**
	 * Echo the Search-blocks overlay shell into `wp_footer`. Block markup
	 * carries `data-wp-interactive` so the IA's standard `DOMContentLoaded`
	 * hydration picks it up — no client-side fetch needed. The caller (`init()`)
	 * gates registration on `is_block_template_overlay_enabled()`.
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
		// `<template>` keeps the region out of `document.querySelectorAll` so
		// the IA runtime's DOMContentLoaded walk skips it. The bootstrap clones
		// into the shell on first open and hydrates there.
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
	 * theme-defined search triggers to the rendered shell. Inline-CSS for the
	 * modal chrome. Config emits alongside the overlay HTML in
	 * `print_block_template_overlay()`.
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

		// Shared responsive layout CSS (narrow-width sidebar collapse +
		// in-header popover toggle). Same rules ship to the embedded /
		// WC-product page templates via `enqueue_search_page_assets()`.
		static::enqueue_search_layout_style();

		// Render here (during `wp_enqueue_scripts`) so view-module enqueues
		// from `do_blocks()` land before the importmap prints — see
		// AGENTS.md § Hydration & SSR seeding.
		self::$block_template_overlay_rendered_html = trim(
			do_blocks( static::get_overlay_template_content() )
		);
	}

	/**
	 * Print the body-sampler `<script>` that sets `--jp-search-page-ink` /
	 * `--jp-search-page-surface` on `:root` from the body's resolved `color` /
	 * `backgroundColor`. Skips writing surface when bg is transparent (the
	 * theme paints on the browser canvas) or when bg equals ink (vintage
	 * frame-themes like Twenty Sixteen use body as a colored border around a
	 * lighter `.site` content wrapper). See AGENTS.md § Theme tokens.
	 */
	public static function print_theme_token_sampler(): void {
		if ( is_admin() ) {
			return;
		}
		echo "<script id='jetpack-search-theme-token-sampler'>(function(){try{var c=getComputedStyle(document.body),r=document.documentElement,ink=c.color,bg=c.backgroundColor;if(ink){r.style.setProperty('--jp-search-page-ink',ink);}if(bg&&bg!==ink&&bg!=='rgba(0, 0, 0, 0)'&&bg!=='transparent'){r.style.setProperty('--jp-search-page-surface',bg);}}catch(e){}})();</script>";
	}

	/**
	 * Inline CSS for the overlay modal chrome. Block content brings its own
	 * theme styling; this is just the scrim, centered card, 60px header strip,
	 * close button, mobile padding tweaks, and scroll lock. The responsive
	 * sidebar-collapse + in-header popover rules shared with the page
	 * templates live in `search_layout_inline_css()`.
	 *
	 * Surface/ink hoist `--jp-search-page-*` (with the legacy
	 * `--wp--preset--color--*` chain as fallback — see AGENTS.md § Theme
	 * tokens) onto two custom props so in-card surfaces share one source.
	 * Hairlines use `color-mix(--jp-search-overlay-ink, --jp-search-overlay-surface)`.
	 *
	 * @return string
	 */
	protected static function block_template_overlay_inline_css(): string {
		return <<<'CSS'
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
	--jp-search-overlay-surface: var(--jp-search-page-surface, var(--wp--preset--color--base, var(--wp--preset--color--background, #fff)));
	--jp-search-overlay-ink: var(--jp-search-page-ink, var(--wp--preset--color--contrast, var(--wp--preset--color--foreground, #1d2327)));
	/* Single source for the content group's inset. The corner-join in
	 * search_layout_inline_css() zeroes the block-start/block-end of this
	 * padding on the group and re-adds the same tokens on the columns, so the
	 * sidebar hairline reaches both card edges — keep them as var()s so the
	 * two sites can't drift. */
	--jp-search-overlay-content-pad-block-start: 0.5em;
	--jp-search-overlay-content-pad-inline: 2em;
	--jp-search-overlay-content-pad-block-end: 2em;
	background: var(--jp-search-overlay-surface);
	color: var(--jp-search-overlay-ink);
	border: 1px solid rgba(128, 128, 128, 0.25);
	border-radius: 4px;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
	padding-top: 60px;
}
/* Token-aware card / scrim separation (SEARCH-270): tint the resolved surface
 * ~5% toward ink and paint the hairline border with the same ink-over-surface
 * mix used for the header `::before`. Both auto-invert polarity per theme, so
 * dark themes get a card that visibly layers above the scrim without losing
 * the themed surface color. The static `rgba(128,128,128,.25)` border + the
 * un-tinted token chain stay as the fallback for browsers without `color-mix`. */
@supports (background: color-mix(in sRGB, black 50%, white)) {
	.jetpack-search-block-overlay__card {
		--jp-search-overlay-surface: color-mix(in sRGB, var(--jp-search-page-ink, var(--wp--preset--color--contrast, var(--wp--preset--color--foreground, #1d2327))) 5%, var(--jp-search-page-surface, var(--wp--preset--color--base, var(--wp--preset--color--background, #fff))));
		border-color: color-mix(in sRGB, var(--jp-search-overlay-ink) 20%, var(--jp-search-overlay-surface));
		/* Ink-derived shadow inverts polarity per theme (SEARCH-289): a dark drop
		 * shadow on light cards, a soft light halo on dark — a flat black shadow is
		 * invisible against the dark scrim. Static black above is the fallback. */
		box-shadow: 0 8px 32px color-mix(in sRGB, var(--jp-search-overlay-ink) 22%, transparent);
	}
}
/* Single hairline over the full 60px header strip — siblings paint with a seam (SEARCH-260). */
.jetpack-search-block-overlay__card::before {
	content: "";
	position: absolute;
	top: 60px;
	left: 0;
	right: 0;
	height: 1px;
	background: transparent;
	pointer-events: none;
}
@supports (background: color-mix(in sRGB, black 50%, white)) {
	.jetpack-search-block-overlay__card::before {
		background: color-mix(in sRGB, var(--jp-search-overlay-ink) 15%, var(--jp-search-overlay-surface));
	}
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
	cursor: pointer;
	color: inherit;
}
/* Opaque ink-over-surface mix — `color-mix(currentColor, transparent)` collapses to full-opacity ink on Safari <16.4 and swallows the X icon. */
@supports (background: color-mix(in sRGB, black 50%, white)) {
	.jetpack-search-block-overlay__close:hover,
	.jetpack-search-block-overlay__close:focus-visible {
		background: color-mix(in sRGB, var(--jp-search-overlay-ink) 14%, var(--jp-search-overlay-surface));
	}
}
.jetpack-search-block-overlay__close svg {
	width: 24px;
	height: 24px;
}
/* Pin in-overlay button `color` against host-theme `button:hover|:focus` overrides
 * (fieldguide and similar legacy themes flip button color to a brand accent on hover).
 * Our block-level rules set `color: inherit` at (0,1,0); a stray `button:hover` rule
 * at (0,1,1) outranks it on `:hover`, and the `color-mix(currentColor X%, …)` hover
 * affordances on the filters-popover trigger, results-sort trigger, suggestions
 * options, etc. then resolve against the host's hover color (often white-on-white).
 * Card-scoped `:hover|:focus|[aria-expanded=true]` lands at (0,2,1) — beats the
 * theme rule without escalating to `!important`. */
.jetpack-search-block-overlay__card button:hover,
.jetpack-search-block-overlay__card button:focus,
.jetpack-search-block-overlay__card button:focus-visible,
.jetpack-search-block-overlay__card button[aria-expanded="true"] {
	color: var(--jp-search-overlay-ink);
}
/* Load More is a solid theme `core/button` on the search page, which is right
 * there. Inside the overlay card it sits on the resolved card surface, where the
 * theme's solid button background (and its accent `:hover`, e.g. Twenty Sixteen's
 * #007acc) reads as a heavy slab that clashes with the card's otherwise
 * `currentColor`-ghost controls (close, sort/filter triggers, active-filter
 * pills). Card-scoped (0,2,0 / 0,2,1) so it only restyles the in-overlay button
 * to the same ghost affordance — the page button is untouched. */
.jetpack-search-block-overlay__card .jetpack-search-load-more__button {
	background: transparent;
	border: 1px solid;
	border-color: color-mix(in sRGB, currentColor 20%, transparent);
	color: var(--jp-search-overlay-ink);
}
.jetpack-search-block-overlay__card .jetpack-search-load-more__button:hover:not(:disabled),
.jetpack-search-block-overlay__card .jetpack-search-load-more__button:focus-visible {
	background: color-mix(in sRGB, currentColor 8%, transparent);
}
/* Promote the first child (search-input) to a 60px header strip flush with
 * the close button, matching the legacy `__box` header. Suppress the input
 * block's own border-bottom — the card's `::before` hairline handles the
 * separator across the whole strip. */
.jetpack-search-block-overlay__card .wp-block-jetpack-search-search-input {
	position: absolute;
	top: 0;
	left: 0;
	right: 60px;
	height: 60px;
	margin: 0;
	padding: 0;
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
	margin: 0;
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
/* Suggestions panel covers the full card width (cancel the input's `right: 60px`
 * offset) and sits above `results-sort` / `filters-popover` (both `z-index: 20`).
 * Background reads from `--jp-search-overlay-surface` so the panel tracks the
 * resolved card surface — a hardcoded `#fff` would re-introduce the white-on-dark
 * bug on legacy `--background`/`--foreground` themes. */
.jetpack-search-block-overlay__card .wp-block-jetpack-search-search-input .jetpack-search-input__suggestions {
	right: -60px;
	z-index: 30;
	background: var(--jp-search-overlay-surface, #fff);
}
/* Top padding clears the absolutely-positioned 60px header strip (SEARCH-243). */
.jetpack-search-block-overlay__content > .wp-block-group:first-child {
	padding: var(--jp-search-overlay-content-pad-block-start) var(--jp-search-overlay-content-pad-inline) var(--jp-search-overlay-content-pad-block-end);
}
@media (max-width: 781px) {
	.jetpack-search-block-overlay {
		padding: 0;
	}
	.jetpack-search-block-overlay__card {
		min-height: 100vh;
		border: 0;
		border-radius: 0;
		box-shadow: none;
		--jp-search-overlay-content-pad-inline: 1em;
		--jp-search-overlay-content-pad-block-end: 1em;
	}
}
/* Mirror legacy `$break-lg: 992px → $modal-max-width-lg: 95%` from `instant-search/components/search-results.scss`. */
@media (min-width: 992px) {
	.jetpack-search-block-overlay__card {
		max-width: 95%;
	}
}
/* Body-scroll lock while open. JS side stashes/restores scrollY on toggle. */
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
	 * Register + enqueue the shared responsive layout CSS on the embedded /
	 * WC-product page templates (`jetpack-search.html`,
	 * `jetpack-search-product-results.html`). Self-gates on `is_search()` so
	 * non-search requests skip the work entirely; the overlay path enqueues
	 * the same handle unconditionally from its own asset hook.
	 */
	public static function enqueue_search_page_assets() {
		if ( ! is_search() ) {
			return;
		}
		static::enqueue_search_layout_style();
	}

	/**
	 * Register + enqueue the inline CSS that drives the shared responsive
	 * layout pattern across all three Search Blocks templates — narrow-width
	 * sidebar collapse and in-header popover toggle. Called from both the
	 * overlay enqueue path and the page-template enqueue path.
	 *
	 * `wp_register_style` / `wp_enqueue_style` are idempotent, but
	 * `wp_add_inline_style` is **not** — it appends to an internal array on
	 * every call, so a second invocation would double the inline payload.
	 * The `wp_style_is( …, 'enqueued' )` short-circuit makes the helper safe
	 * to call from multiple sites in one request.
	 */
	public static function enqueue_search_layout_style() {
		// No src — this handle exists only as a target for `wp_add_inline_style`.
		// Version tracks the package so a release bust cache-invalidates any
		// reusing site's inline-style cache.
		wp_register_style( 'jetpack-search-layout', false, array(), Package::VERSION );
		if ( wp_style_is( 'jetpack-search-layout', 'enqueued' ) ) {
			return;
		}
		wp_enqueue_style( 'jetpack-search-layout' );
		wp_add_inline_style( 'jetpack-search-layout', static::search_layout_inline_css() );
	}

	/**
	 * Inline CSS for the responsive search-results layout shared across the
	 * overlay, embedded (`jetpack-search.html`), and WC product
	 * (`jetpack-search-product-results.html`) templates.
	 *
	 * Below 992px the right-column filter sidebar collapses to a popover
	 * trigger docked next to results-sort; at >= 992px the sidebar is the
	 * sole filter UI and the in-header popover is hidden so the two don't
	 * double up. Same breakpoint as the legacy Instant Search overlay
	 * (`.jetpack-instant-search__search-results-secondary { display: none }`
	 * below `$break-lg`). Lives next to `block_template_overlay_inline_css()`
	 * (which keeps overlay-only chrome) because the rules target the
	 * templates' outer columns + results-header, none of which any single
	 * block owns.
	 *
	 * @return string
	 */
	protected static function search_layout_inline_css(): string {
		return <<<'CSS'
/* The block group already carries `layout.type:flex` which makes the WordPress
 * block-layout system emit `display:flex` / `flex-wrap:nowrap` /
 * `justify-content:space-between`. Restating them is defensive (decouples us
 * from block-layout CSS being present); the operative net-new rule is
 * `align-items: center`, which centers `results-count` against the controls
 * cluster. */
.jetpack-search-layout__results-header {
	display: flex;
	flex-wrap: nowrap;
	justify-content: space-between;
	align-items: center;
}
/* Right-side controls cluster: sort + filters-popover trigger. Without this
 * the three `__results-header` children get spread evenly by the parent's
 * `space-between`; nesting sort + popover here pins them as one block on the
 * trailing edge. */
.jetpack-search-layout__results-header-controls {
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	gap: 0.75rem;
}
/* Name the columns row as the layout container so the sidebar/popover flip
 * tracks its inline-size. The `@media` rules below are the universal base —
 * they fire in every browser (including legacy ones without container-query
 * support) and they drive standalone usage outside the named container (no
 * container ancestor → only `@media` applies). The `@container` rule further
 * down overrides `@media` via source-order cascade at equal specificity when
 * the named container is in scope AND narrower than 992px. The override has
 * to undo `@media (min-width: 992px)`'s `popover { display: none }`
 * explicitly: in the "wide viewport, narrow container" case `@media
 * (min-width: 992px)` keeps firing on the viewport width and would otherwise
 * leave the visitor with no filter UI at all. `@container (min-width: 992px)`
 * isn't defined — container width is bounded by viewport width in practice,
 * so the matching `@media (min-width: 992px)` already covers the wide case. */
.wp-block-columns:has(> .jetpack-search-layout__filters-column) {
	container-type: inline-size;
	container-name: jetpack-search-layout;
}
/* Below 992px the right-column filter sidebar collapses to a popover trigger
 * docked next to results-sort. The trigger comes from the
 * `jetpack-search/filters-popover` block that ships in each template. The
 * selector is scoped to the named outer column so nested `wp-block-column`s
 * inside result-card templates aren't affected. */
@media (max-width: 991.98px) {
	.jetpack-search-layout__filters-column {
		display: none;
	}
	/* `!important` defends against the parent `wp:columns` block-layout CSS
	 * that pins `.wp-block-column` to its inline `flex-basis` (or to an even
	 * split when no width is set). Once the filter column is `display:none`,
	 * the results column has to be able to claim the full row at any
	 * specificity. */
	.jetpack-search-layout__results-column {
		flex-basis: 100% !important;
	}
}
/* Sidebar left divider tracks `currentColor` so the hairline stays subtle on
 * light themes and visible on dark themes, matching the search-input
 * underline. We only set color; each template's column block sets
 * `border-left-width: 1px` inline. Fallback to `transparent` so themes/UAs
 * without `color-mix` support get an invisible divider rather than a hard
 * grey rule. */
.jetpack-search-layout__filters-column {
	border-left-color: transparent;
}
@supports (border-color: color-mix(in sRGB, black 50%, white)) {
	.jetpack-search-layout__filters-column {
		border-left-color: color-mix(in sRGB, currentColor 15%, transparent);
	}
}
/* Sidebar-showing rules (>= 992px). The corner-join is structural: the
 * columns row is pulled flush to the search-input hairline and breathing
 * room re-added as internal column padding, so the filters column's
 * `border-left` runs the row's full height — hairline (top) to end-of-div
 * (bottom). Three vertical gaps are neutralised:
 *
 *   a) `margin-block-start` on the row (outer group's `spacing.blockGap` or
 *      the theme's default block-gap) — zeroed.
 *
 *   b) `.is-layout-flex { align-items: center }` (theme/core default), which
 *      centres the shorter filters column and drops its top edge. Overridden
 *      to `stretch` (not `flex-start`) so the column also grows to full row
 *      height; it's flow layout, so its content stays top-aligned regardless.
 *
 *   c) Overlay-only: SEARCH-243's content-group inset sits outside the
 *      columns, so the stretched column stops short of the card edges (below
 *      the `::before` hairline at the top, and short of the bottom). Zeroed
 *      on the group's block axis and re-added on the columns, both sides
 *      reading the same `--jp-search-overlay-content-pad-*` tokens the group
 *      itself uses — so the divider reaches both edges while content keeps
 *      its breathing room, and the two sites can't drift.
 *
 * `.is-layout-flex` bumps the columns selector to (0,3,0) to outrank
 * per-container `blockGap` CSS; `:has(> filters-column)` scopes it to our
 * rows. These target the row/group, which `@container` can't reach from
 * inside the named container, so they stay viewport-driven — harmless when
 * the sidebar collapses below 992px. (b) is also a no-op wherever WP core's
 * `.wp-block-columns { align-items: normal !important }` is present; see
 * AGENTS.md. */
@media (min-width: 992px) {
	/* Sidebar shown, popover-in-results-header hidden. The `@container
	 * (max-width: 991.98px)` block below re-shows the popover when the
	 * named container is narrower than the viewport. */
	.jetpack-search-layout__results-header .jetpack-search-filters-popover {
		display: none;
	}
	.wp-block-columns.is-layout-flex:has(> .jetpack-search-layout__filters-column) {
		align-items: stretch;
		margin-block-start: 0;
	}
	.jetpack-search-block-overlay__content > .wp-block-group:first-child:has(.jetpack-search-layout__filters-column) {
		padding-top: 0;
		padding-bottom: 0;
	}
	.wp-block-columns:has(> .jetpack-search-layout__filters-column) > .wp-block-column {
		padding-top: var(--jp-search-overlay-content-pad-block-start, 0.5em);
	}
	.jetpack-search-block-overlay__content .wp-block-columns:has(> .jetpack-search-layout__filters-column) > .wp-block-column {
		padding-bottom: var(--jp-search-overlay-content-pad-block-end, 2em);
	}
}
/* @container override: applies when the named container exists. Placed AFTER
 * the `@media` rules so source-order cascade lets it win over them at equal
 * specificity. In "wide viewport, narrow container" (the case the change is
 * meant to fix), `@media (max-width: 991.98px)` doesn't fire but `@media
 * (min-width: 992px)` does — this block undoes the latter's `popover {
 * display: none }` via `display: inline-block` and hides the sidebar that
 * the `@media (max-width)` rule wouldn't have hidden at this viewport. Same
 * `!important` reasoning on `flex-basis: 100%` as the @media block. */
@container jetpack-search-layout (max-width: 991.98px) {
	.jetpack-search-layout__filters-column {
		display: none;
	}
	.jetpack-search-layout__results-column {
		flex-basis: 100% !important;
	}
	.jetpack-search-layout__results-header .jetpack-search-filters-popover {
		display: inline-block;
	}
}
CSS;
	}

	/**
	 * Product-search counterpart of `get_search_template_content()`.
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
	 * Substitute `{{FILTER_HEADING}}` / `{{HEADER_SLUG}}` / `{{FOOTER_SLUG}}` in a
	 * bundled template. Empty input passes through.
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
	 * Active theme's chrome slugs. Test seam; resolver lives on
	 * `Theme_Chrome_Slug_Resolver`.
	 *
	 * @return array{header:string,footer:string}
	 */
	protected static function resolve_chrome_slugs(): array {
		return Theme_Chrome_Slug_Resolver::resolve();
	}

	/**
	 * Idempotent wrapper around `register_block_template`. Unregisters first so
	 * a stale entry from a prior init (long-lived PHP-FPM worker) is replaced
	 * rather than triggering `doing_it_wrong`.
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
	 * Counterpart of `register_search_template()` for product search.
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
	 * Directory slug of the plugin that owns the template in the Site Editor UI.
	 * Picked by preference so the more-specific "Jetpack Search" label wins
	 * when both the standalone plugin and the Jetpack monolith are active:
	 * `jetpack-search` → `jetpack` → `jetpack-search` fallback.
	 *
	 * @return string
	 */
	protected static function get_parent_plugin_slug(): string {
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
	 * Prepend the Jetpack Search slug to the search template hierarchy on
	 * block-theme search requests. Existing occurrences are stripped first
	 * so a second init pass / another filter on the same hook can't dup.
	 *
	 * WooCommerce product-search carve-out: override off → leave to WC's
	 * prepend; override on → fall through here, then
	 * `route_woocommerce_product_search_template()` swaps WC's slug for ours.
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
	 * Classic-theme counterpart to `prepend_search_template()`. Block-theme
	 * hierarchy filters are a no-op on classic themes — `locate_template()`
	 * walks slugs as `{slug}.php` and a classic theme doesn't ship one for
	 * our slug. So let the hierarchy resolve normally, then swap the path
	 * via `template_include` to our bundled PHP shim, which renders the same
	 * block markup inside the theme's `get_header()`/`get_footer()`.
	 *
	 * @param string $template Resolved template path.
	 * @return string
	 */
	public static function route_classic_theme_search_template( $template ) {
		if ( ! is_search() ) {
			return $template;
		}
		$is_product_search = static::is_woocommerce_product_search();
		// Override off: leave product search to WooCommerce / the theme's own
		// archive routing — we don't impose the product shim without opt-in.
		if ( ! static::woocommerce_search_template_override_enabled() && $is_product_search ) {
			return $template;
		}
		// Override on + product search: route to the product-results shim.
		// Bail back to the theme's template if neither a customization nor a
		// bundled body is available — rendering header/footer around an empty
		// body looks broken.
		if ( $is_product_search ) {
			if ( null === Product_Search_Template::get_customized_content() && '' === static::get_classic_theme_product_search_body() ) {
				return $template;
			}
			return __DIR__ . '/templates/classic-theme-product-search.php';
		}
		// Regular (non-product) search: only Embedded takes over the whole search
		// page. Inline registers this router too (for the product shim above) but
		// leaves regular searches to the theme, so bail here unless Embedded.
		if ( Module_Control::EXPERIENCE_EMBEDDED !== ( new Module_Control() )->get_experience() ) {
			return $template;
		}
		// Same empty-body bail-out for the generic shim. A saved empty
		// customization ('' vs null) is honored as intentional.
		if ( null === Search_Template::get_customized_content() && '' === static::get_classic_theme_search_body() ) {
			return $template;
		}
		return __DIR__ . '/templates/classic-theme-search.php';
	}

	/**
	 * Classic-theme search body — same markup as the block-theme path with
	 * top-level `core/template-part` references stripped so the theme's
	 * `get_header()` / `get_footer()` drive the chrome.
	 *
	 * Source of truth: customized `Search_Template` CPT → bundled `jetpack-search.html`.
	 * Public because `templates/classic-theme-search.php` calls it from outside the class.
	 *
	 * @return string Block markup, no template-part wrappers.
	 */
	public static function get_classic_theme_search_body(): string {
		$customized = Search_Template::get_customized_content();
		if ( null !== $customized ) {
			return $customized;
		}
		return static::strip_top_level_template_parts( static::get_search_template_content() );
	}

	/**
	 * Product-search counterpart to {@see get_classic_theme_search_body()} —
	 * source of truth for the classic-theme product-results shim. Customized
	 * `Product_Search_Template` CPT → bundled `jetpack-search-product-results.html`.
	 * Public because `templates/classic-theme-product-search.php` calls it from
	 * outside the class.
	 *
	 * @return string Block markup, no template-part wrappers.
	 */
	public static function get_classic_theme_product_search_body(): string {
		$customized = Product_Search_Template::get_customized_content();
		if ( null !== $customized ) {
			return $customized;
		}
		return static::strip_top_level_template_parts( static::get_product_search_template_content() );
	}

	/**
	 * Strip top-level `core/template-part` self-closing comments — classic
	 * themes can't resolve their slugs. Non-greedy `.*?` capped by `-->` keeps
	 * matching cleanly across template revisions and across nested attribute
	 * payloads.
	 *
	 * @param string $content Block markup, possibly empty.
	 * @return string
	 */
	protected static function strip_top_level_template_parts( string $content ): string {
		if ( '' === $content ) {
			return '';
		}
		return (string) preg_replace( '#<!--\s*wp:template-part\s+.*?/-->\s*#s', '', $content );
	}

	/**
	 * Inline layout `<style>` block the classic-theme shims emit before the
	 * bundled block markup. Classic themes don't emit core's block-supports
	 * layout CSS, so two traits the bundled templates rely on collapse on
	 * classic themes: the inner group's 1.5rem `blockGap` vanishes (search
	 * input runs straight into the results row), and `alignwide` has no
	 * effect (content stretches edge-to-edge because `template_include`
	 * bypasses the theme's own content wrapper). Reapplying both, scoped to
	 * `<main class="wp-block-group">`, restores parity without leaking
	 * outside the shim. Shared by both shims so a future layout tweak
	 * touches one place. The `<style>` `id` is unique per render — routing
	 * ensures only one shim runs per request, so duplicate IDs can't occur.
	 *
	 * Public because both `templates/classic-theme-search.php` and
	 * `templates/classic-theme-product-search.php` call it from outside the
	 * class.
	 *
	 * @return string Inline `<style>` element ready to echo.
	 */
	public static function get_classic_theme_layout_style(): string {
		return <<<'HTML'
<style id="jetpack-search-classic-theme-layout">
main.wp-block-group {
	max-width: var(--wp--style--global--wide-size, 1280px);
	margin-inline: auto;
	padding-inline: clamp(1rem, 4vw, 2rem);
}
main.wp-block-group .is-layout-flow > * + * {
	margin-block-start: var(--wp--style--block-gap, 1.5rem);
}
</style>
HTML;
	}

	/**
	 * Test override for `block_templates_active()`. Null = read the live state.
	 *
	 * @var bool|null
	 */
	private static $block_templates_active_for_testing = null;

	/**
	 * Test seam. Set true/false to force `block_templates_active()`, or null to clear.
	 *
	 * @param bool|null $active Forced value, or null to clear.
	 */
	public static function set_block_templates_active_for_testing( ?bool $active ): void {
		self::$block_templates_active_for_testing = $active;
	}

	/**
	 * Whether the theme resolves block templates. Overridable seam over
	 * `wp_is_block_theme()` for tests.
	 *
	 * @return bool
	 */
	protected static function block_templates_active(): bool {
		if ( null !== self::$block_templates_active_for_testing ) {
			return self::$block_templates_active_for_testing;
		}
		return wp_is_block_theme();
	}

	/**
	 * Front the `jetpack-search-product-results` template for WC product
	 * search. Drops WC's `product-search-results` and unshifts ours so it
	 * resolves before any `jetpack-search` prepend for the generic route.
	 *
	 * @param string[] $templates Template hierarchy slugs.
	 * @return string[]
	 */
	public static function route_woocommerce_product_search_template( $templates ) {
		// FSE-hierarchy work — classic themes resolve template slugs as `{slug}.php`
		// and there's no `jetpack-search-product-results.php`. The classic-theme
		// equivalent runs through `route_classic_theme_search_template()` instead.
		if ( ! static::block_templates_active() || ! static::is_woocommerce_product_search() ) {
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
	 * Seed the Interactivity API store with initial state. Per-block render
	 * callbacks deep-merge their own entries on top (e.g. filter-checkbox
	 * writes its filterConfig). See AGENTS.md § Hydration & SSR seeding.
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
	 * @param array<string, array<string, mixed>> $filter_configs Map of filter configs.
	 * @return array<string, mixed>
	 */
	public static function build_seed_state( array $filter_configs ): array {
		$state                  = static::build_initial_state();
		$state['filterConfigs'] = $filter_configs;
		return $state;
	}

	/**
	 * Walk the current post's block tree for filter blocks and build the
	 * filterConfigs map. Template-part scans are not performed — a filter
	 * inside a template part still works, but its config isn't available to
	 * the search-results SSR until hydration.
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
		// Non-Woo sites: drop WC-only entries so the filter-config walk stays
		// symmetric with what `register_blocks()` actually registered.
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
			// TrainTracks gate, mirroring instant search's `disableTracking`
			// (Helper::get_search_options): suppresses `_tkq` pushes for
			// `?disable_tracking=1` crawlers/QA and the filter override.
			'disableTracking'            => static::is_tracking_disabled(),
			// Threaded through url-state so `?orderby=price_asc` round-trips on Woo only.
			'isWooCommerceBlocksEnabled' => self::woocommerce_blocks_enabled(),
			'homeUrl'                    => function_exists( 'home_url' ) ? home_url() : '',
			// Blog locale (not viewer's profile locale) for consistent
			// logged-out formatting. BCP47-ish (`en-US`).
			'locale'                     => function_exists( 'get_locale' )
				? str_replace( '_', '-', get_locale() )
				: 'en-US',
			// PHP-style token string parsed client-side by `wp-date-format.js`
			// (IA view bundle can't import `@wordpress/date`). Empty → Intl fallback.
			'dateFormat'                 => function_exists( 'get_option' )
				? (string) get_option( 'date_format', '' )
				: '',

			// URL-seeded so deep links render on first paint.
			'searchQuery'                => $search_query,
			// `?s=` (empty value) must still fire the initial fetch; `searchQuery`
			// alone collapses present-but-empty and missing to `''`.
			'hasSearchParam'             => static::has_search_param(),
			'searchParamName'            => static::get_search_param_name(),
			'sortOrder'                  => static::parse_url_sort(),
			'activeFilters'              => $active_filters,
			'filterLogic'                => $filter_logic,
			'priceRange'                 => $price_range,
			// Scalar `?filter_id=value`; seeded as `{}` so JS readers see a defined shape.
			'staticFilterSelections'     => (object) array(),

			// Each filter block's render.php deep-merges its entry. Shape:
			// `{ [key]: { filterKey, filterType, taxonomy, effectiveSlug, label, showCount, maxItems } }`.
			'filterConfigs'              => array(),

			// JS hydration fills these. `aggregations` is stdClass so JS sees `{}`.
			'results'                    => array(),
			'aggregations'               => (object) array(),
			// See AGENTS.md § Filter bucket lifecycle.
			'retainedFilterOptions'      => (object) array(),
			'totalResults'               => 0,
			'pageHandle'                 => null,

			// `isLoading` true on deep links keeps the empty-state hidden until
			// JS fires the initial fetch (otherwise "No results found" flashes).
			'isLoading'                  => $is_initial_loading,
			'isLoadingMore'              => false,
			'hasError'                   => false,

			// Seeded so SSR resolves `data-wp-text` on first paint.
			'resultsCountText'           => $is_initial_loading ? $searching_text : '',

			'strings'                    => static::build_initial_strings(),
			'priceCurrencySymbol'        => '$',

			// Top-level (not under `strings`) — keeps Phan's `array<string,string>`
			// contract on `strings` intact.
			'aiExtendedLoadingHints'     => static::build_ai_extended_loading_hints(),

			'wcStockStatusLabels'        => static::build_stock_status_labels(),
		);
	}

	/**
	 * Slug → display-label map for `wc_stock_status` selections, used by the
	 * active-filters block for product-aware chips. RSM-1932 will swap this
	 * for WC's translated labels (`wc_get_product_stock_status_options()`)
	 * without changing the shape. Empty when the status helper isn't loaded.
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
	 * Whether the URL carries a search query, filter, or price range — i.e.
	 * the JS store will fire an initial fetch on hydration. Render callbacks
	 * use this to emit pre-hydration affordances (skeleton, "Searching…").
	 *
	 * URL-derived rather than read back from `wp_interactivity_state()`
	 * because FSE pre-resolves block attributes before `wp_enqueue_scripts`
	 * fires, so a state-read would silently return false on the very pages
	 * this is meant to flag. Mirrors the `isLoading` seed exactly.
	 *
	 * @return bool
	 */
	public static function is_initial_loading(): bool {
		if ( null !== self::$is_initial_loading_cache ) {
			return self::$is_initial_loading_cache;
		}
		// `has_search_param()` not `parse_url_search_query() !== ''` — an
		// explicit `?s=` (empty value) still means "visitor landed on a
		// search page" and should fire an unfiltered initial fetch.
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
	 * Reset the `is_initial_loading()` memo. Tests only — PHPUnit reuses a
	 * single process so `$_GET` from an earlier test would pin the value.
	 * Guarded against accidental production use.
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
	 * Normalize the shared `displayStyle` attribute to one of the two CSS
	 * variants. `filter-wc-stock-status` and `filter-wc-rating` deliberately
	 * don't ship a chip variant and don't call this helper.
	 *
	 * @param mixed $value Raw attribute value.
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
	 * Rotating loading hints for the "Show more" extended AI answer.
	 * Mirrors the overlay verbatim so visitors switching surfaces see
	 * the same copy.
	 *
	 * @return array<int, string>
	 */
	protected static function build_ai_extended_loading_hints(): array {
		// Strings omit trailing `…` — render.php appends an animated ellipsis,
		// so a static one would double up. Overlay does the same.
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
	 * Parse the search query from the URL using whichever key
	 * `get_search_param_name()` returns (`s` on search routes, `q` elsewhere).
	 * Public so render templates can seed their input from the same source.
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
	 * Whether the search-query key is present in `$_GET` (any value).
	 * Distinguishes `?s=` (blank search) from a URL that omits the key —
	 * `parse_url_search_query()` collapses both to `''`. Array-shaped
	 * `?s[]=foo` reads as "not present" to stay in lockstep.
	 *
	 * @return bool
	 */
	public static function has_search_param(): bool {
		$key = self::get_search_param_name();
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only URL presence check; the value is never read here.
		return isset( $_GET[ $key ] ) && is_scalar( $_GET[ $key ] );
	}

	/**
	 * Parse the sort order from the URL, defaulting to 'relevance'. Allowed
	 * values track `Results_Sort::get_all_option_keys()` — on non-Woo sites
	 * a `?orderby=price_asc` deep link collapses to `relevance` (mirrors
	 * `store/url-state.js`).
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
	 * Parse the price range from the URL. Mirrors `store/url-state.js`.
	 * Either bound may be null for a half-open range; non-numeric or
	 * negative values null out. Returns null entirely on non-Woo sites —
	 * `min_price`/`max_price` are WC-only and a stray param shouldn't drive
	 * the API into a `range` clause for a field the index doesn't have.
	 *
	 * @return array{min: float|null, max: float|null}|null
	 */
	protected static function parse_url_price_range(): ?array {
		if ( ! self::woocommerce_blocks_enabled() ) {
			return null;
		}
		// phpcs:disable WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized,WordPress.Security.ValidatedSanitizedInput.MissingUnslash -- coerced to float in parse_price_bound().
		$min = self::parse_price_bound( $_GET['min_price'] ?? null );
		$max = self::parse_price_bound( $_GET['max_price'] ?? null );
		// phpcs:enable

		if ( null === $min && null === $max ) {
			return null;
		}
		// Inverted bounds → empty ES `range` clause / zero results silently.
		// Treat as garbage and bail so the page falls back to unfiltered search.
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
		// `is_numeric` keeps PHP in lockstep with JS's `Number()`: rejects
		// partially-numeric strings ("1.5.3") that `(float)` would silently
		// extract as `1.5` while `Number()` returns `NaN`.
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
	 * Parse `?<filterKey>[]=<value>` URL params into `{ [filterKey]: string[] }`.
	 * Mirrors the shape `store/url-state.js` writes (see AGENTS.md § URL format).
	 * No registered-key filtering here — `filterConfigs` aren't available until
	 * blocks render. The JS layer gates on hydration.
	 *
	 * Scalar `?post_type=<slug>` is also accepted as a shortcut for
	 * `?post_types[]=<slug>` — matches WP/WC's own URL convention. Merged into
	 * any existing array selections so `?post_type=foo&post_types[]=bar` reads
	 * as `[foo, bar]`. Singular-form-on-an-array-key keeps its existing
	 * "ignored noise" behaviour for every other filter.
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
			if ( 'post_type' === $filter_key ) {
				// `is_string` (not `is_scalar`) keeps the gate consistent with
				// `parse_url_filter_logic`'s value check — `$_GET` only ever
				// carries strings or arrays, and the array case takes the
				// `is_array( $values )` branch immediately below.
				if ( ! is_string( $values ) ) {
					continue;
				}
				// `sanitize_key`, not `sanitize_text_field` — post-type slugs are
				// always lowercase + `[a-z0-9_-]`; the lowercase pass keeps a
				// `?post_type=Product` URL from reaching ES with the wrong case
				// and silently returning zero results.
				$slug = sanitize_key( $values );
				if ( '' === $slug ) {
					continue;
				}
				$existing          = $out['post_types'] ?? array();
				$out['post_types'] = array_values( array_unique( array_merge( $existing, array( $slug ) ) ) );
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
				$existing           = $out[ $filter_key ] ?? array();
				$out[ $filter_key ] = array_values( array_unique( array_merge( $existing, $clean ) ) );
			}
		}
		return $out;
	}

	/**
	 * Parse `?query_type_<key>=and` overrides into `{ [filterKey]: 'and' }`.
	 * Only literal `'and'` is honoured — anything else is dropped so it
	 * can't round-trip back through `pushStateToUrl`. Mirrors
	 * `store/url-state.js`.
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
