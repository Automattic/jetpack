<?php
/**
 * Search_Blocks class tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Tests for the Search_Blocks registration class.
 */
class Search_Blocks_Test extends TestCase {

	/**
	 * Clear `Search_Blocks::is_initial_loading()`'s per-request memo between
	 * tests. PHPUnit runs every test in a single process, so without this
	 * the first test that exercises a query/filter/price URL would pin the
	 * cached value and every later test that sets `$_GET` would silently
	 * read stale state.
	 */
	protected function tearDown(): void {
		Search_Blocks::reset_initial_loading_cache();
		Search_Blocks::reset_is_woocommerce_active_cache();
		Search_Blocks::reset_custom_taxonomy_map_cache();
		parent::tearDown();
	}

	/**
	 * Verify that the keys required by the Interactivity API store are present.
	 */
	public function test_build_initial_state_shape() {
		$required_keys = array(
			'siteId',
			'apiRoot',
			'nonce',
			'isPrivateSite',
			'isWpcom',
			'isWooCommerceActive',
			'homeUrl',
			'locale',
			'searchQuery',
			'searchParamName',
			'sortOrder',
			'results',
			'totalResults',
			'pageHandle',
			'isLoading',
			'isLoadingMore',
			'hasError',
			'strings',
		);

		$this->assertTrue( class_exists( Search_Blocks::class ) );
		$state = Search_Blocks::build_initial_state();
		foreach ( $required_keys as $key ) {
			$this->assertArrayHasKey( $key, $state, "Missing key: $key" );
		}
	}

	/**
	 * View-bundle strings seeded here are the sole i18n channel for the
	 * Interactivity API bundle — it can't import @wordpress/i18n. Both
	 * plural forms must be seeded so the client can pick based on the
	 * live totalResults, and the format string must carry a `%d` token.
	 */
	public function test_build_initial_state_seeds_translated_strings() {
		$state = Search_Blocks::build_initial_state();
		$this->assertArrayHasKey( 'strings', $state );
		$strings = $state['strings'];
		$this->assertArrayHasKey( 'searching', $strings );
		$this->assertArrayHasKey( 'resultsCountSingle', $strings );
		$this->assertArrayHasKey( 'resultsCountPlural', $strings );
		$this->assertArrayHasKey( 'removeFilter', $strings );
		$this->assertNotSame( '', $strings['searching'] );
		$this->assertStringContainsString( '%d', $strings['resultsCountSingle'] );
		$this->assertStringContainsString( '%d', $strings['resultsCountPlural'] );
		$this->assertStringContainsString( '%s', $strings['removeFilter'] );
	}

	/**
	 * A known `orderby` in the URL must seed sortOrder so SSR pre-fetches
	 * the correct ordering. Values must stay aligned with the UI keys in
	 * src/instant-search/lib/constants.js SORT_OPTIONS.
	 */
	public function test_build_initial_state_seeds_sort_order_from_url() {
		$original_get = $_GET;
		$_GET         = array( 'orderby' => 'newest' );
		try {
			$state = Search_Blocks::build_initial_state();
			$this->assertSame( 'newest', $state['sortOrder'] );
		} finally {
			$_GET = $original_get;
		}
	}

	/**
	 * Unrecognized `orderby` values must fall back to the default `relevance`
	 * sort, not propagate into the Elasticsearch query.
	 */
	public function test_build_initial_state_rejects_unknown_sort_order() {
		$original_get = $_GET;
		$_GET         = array( 'orderby' => 'drop-tables' );
		try {
			$state = Search_Blocks::build_initial_state();
			$this->assertSame( 'relevance', $state['sortOrder'] );
		} finally {
			$_GET = $original_get;
		}
	}

	/**
	 * Product-format `?orderby` values seed `relevance` on non-Woo sites so
	 * a deep link to a sort the API can't honour can't reach the
	 * Elasticsearch query (RSM-1082).
	 */
	public function test_build_initial_state_rejects_product_sort_when_woocommerce_inactive() {
		$original_get = $_GET;
		$_GET         = array( 'orderby' => 'price_asc' );
		try {
			$state = Search_Blocks::build_initial_state();
			$this->assertSame( 'relevance', $state['sortOrder'] );
			$this->assertFalse( $state['isWooCommerceActive'] );
		} finally {
			$_GET = $original_get;
		}
	}

	/**
	 * On Woo sites the same product-format `?orderby` values must seed the
	 * matching sort and surface `isWooCommerceActive=true` on the IA store
	 * so the JS-side url-state gate accepts them too (RSM-1082).
	 */
	public function test_build_initial_state_accepts_product_sort_when_woocommerce_active() {
		$original_get = $_GET;
		Search_Blocks::set_is_woocommerce_active_for_testing( true );
		try {
			foreach ( array( 'rating_desc', 'price_asc', 'price_desc' ) as $key ) {
				$_GET  = array( 'orderby' => $key );
				$state = Search_Blocks::build_initial_state();
				$this->assertSame( $key, $state['sortOrder'], "Expected $key to seed sortOrder when WC is active." );
				$this->assertTrue( $state['isWooCommerceActive'] );
			}
		} finally {
			$_GET = $original_get;
			Search_Blocks::set_is_woocommerce_active_for_testing( null );
		}
	}

	/**
	 * `jetpack_search_blocks_is_woocommerce_active` lets a site force the
	 * gate true on a non-Woo install — useful for staging previews of
	 * WC-only Search blocks. The filter result must be cached, so a
	 * subsequent call returns the override even after the filter is
	 * removed.
	 */
	public function test_is_woocommerce_active_filter_can_force_true() {
		Search_Blocks::reset_is_woocommerce_active_cache();
		add_filter( 'jetpack_search_blocks_is_woocommerce_active', '__return_true' );
		try {
			$this->assertTrue( Search_Blocks::is_woocommerce_active() );
		} finally {
			remove_filter( 'jetpack_search_blocks_is_woocommerce_active', '__return_true' );
		}
	}

	/**
	 * Symmetry: the filter must also be able to force the gate false. We
	 * can't construct a "WC is loaded" PHPUnit env without polluting the
	 * global namespace with a `WooCommerce` stub class, so instead the
	 * test pins the *contract*: the filter receives the probed bool and
	 * its return value is what the function returns. The cast-to-bool
	 * test below covers the related "filter result wins over probe" path
	 * for non-bool returns.
	 */
	public function test_is_woocommerce_active_filter_receives_probe_and_return_wins() {
		Search_Blocks::reset_is_woocommerce_active_cache();
		$received_value = null;
		$callback       = function ( $value ) use ( &$received_value ) {
			$received_value = $value;
			return false;
		};
		add_filter( 'jetpack_search_blocks_is_woocommerce_active', $callback );
		try {
			$this->assertFalse( Search_Blocks::is_woocommerce_active() );
			$this->assertIsBool( $received_value, 'Filter received a bool from the probe.' );
		} finally {
			remove_filter( 'jetpack_search_blocks_is_woocommerce_active', $callback );
		}
	}

	/**
	 * Pins the docblock promise: the filter fires once per request and
	 * the result is cached, so a callback that probes the database or
	 * reads an option pays its cost once even on a hot path.
	 */
	public function test_is_woocommerce_active_filter_only_fires_once_per_request() {
		Search_Blocks::reset_is_woocommerce_active_cache();
		$call_count = 0;
		$callback   = function ( $value ) use ( &$call_count ) {
			++$call_count;
			return $value;
		};
		add_filter( 'jetpack_search_blocks_is_woocommerce_active', $callback );
		try {
			for ( $i = 0; $i < 3; $i++ ) {
				Search_Blocks::is_woocommerce_active();
			}
			$this->assertSame( 1, $call_count, 'Filter ran once; subsequent calls served from cache.' );
		} finally {
			remove_filter( 'jetpack_search_blocks_is_woocommerce_active', $callback );
		}
	}

	/**
	 * A filter callback returning a truthy non-bool (`'1'`, `1`, etc.)
	 * must not poison the strictly-typed `bool` cache. The function casts
	 * before storing so callers using `===` against `true` still match.
	 */
	public function test_is_woocommerce_active_filter_casts_truthy_non_bool_to_true() {
		Search_Blocks::reset_is_woocommerce_active_cache();
		$callback = static function () {
			return '1';
		};
		add_filter( 'jetpack_search_blocks_is_woocommerce_active', $callback );
		try {
			$this->assertTrue( Search_Blocks::is_woocommerce_active() );
		} finally {
			remove_filter( 'jetpack_search_blocks_is_woocommerce_active', $callback );
		}
	}

	/**
	 * Seeded `activeFilters` is the raw URL params — gating moved to
	 * store/index.js's `initialize()` callback, which can apply it once
	 * every filter block's render.php has contributed its filterConfig (and
	 * the registry is complete). `build_seed_state()` must therefore pass
	 * URL params through unchanged regardless of whether the matching filter
	 * block was found in post content.
	 */
	public function test_build_seed_state_passes_url_filters_through() {
		$original_get   = $_GET;
		$original_query = $GLOBALS['wp_query'] ?? null;
		// post_date isn't in the filterConfigs passed to build_seed_state
		// below — simulating a filter-date block placed in a template
		// rather than post content. PHP must still seed it through; JS
		// gates against the complete registry on hydration.
		$_GET                = array(
			'category'  => array( 'news' ),
			'post_date' => array( '2024-08' ),
		);
		$GLOBALS['wp_query'] = new \WP_Query( array( 's' => '' ) );
		try {
			$state = Search_Blocks::build_seed_state(
				array( 'category' => array( 'filterKey' => 'category' ) )
			);
			$this->assertSame(
				array(
					'category'  => array( 'news' ),
					'post_date' => array( '2024-08' ),
				),
				$state['activeFilters']
			);
		} finally {
			$_GET                = $original_get;
			$GLOBALS['wp_query'] = $original_query;
		}
	}

	/**
	 * A URL carrying a filter selection must leave isLoading=true so the JS
	 * store shows the spinner until the first fetch resolves. JS-side gating
	 * may later flip it back to false if every key gets dropped, but the
	 * seed should default to true whenever activeFilters is non-empty.
	 */
	public function test_build_seed_state_keeps_is_loading_for_active_filter() {
		$original_get        = $_GET;
		$original_query      = $GLOBALS['wp_query'] ?? null;
		$_GET                = array( 'category' => array( 'news' ) );
		$GLOBALS['wp_query'] = new \WP_Query( array( 's' => '' ) );
		try {
			$state = Search_Blocks::build_seed_state(
				array( 'category' => array( 'filterKey' => 'category' ) )
			);
			$this->assertSame( array( 'category' => array( 'news' ) ), $state['activeFilters'] );
			$this->assertTrue( $state['isLoading'] );
		} finally {
			$_GET                = $original_get;
			$GLOBALS['wp_query'] = $original_query;
		}
	}

	/**
	 * The takeover hinges on `search` being replaced by `jetpack-search` at
	 * the front of the hierarchy: that's what makes core resolve our plugin
	 * template instead of the theme's `search.html`.
	 */
	public function test_prepend_search_template_puts_unique_slug_first() {
		$result = Search_Blocks::prepend_search_template( array( 'search', 'index' ) );
		$this->assertSame( array( 'jetpack-search', 'search', 'index' ), $result );
	}

	/**
	 * If the slug is already in the hierarchy (e.g. a second init pass or
	 * another filter already prepended it), the result must not contain
	 * duplicate `jetpack-search` entries — core would otherwise do two
	 * identical registry lookups per search request.
	 */
	public function test_prepend_search_template_dedupes_existing_slug() {
		$result = Search_Blocks::prepend_search_template( array( 'jetpack-search', 'search', 'index' ) );
		$this->assertSame( array( 'jetpack-search', 'search', 'index' ), $result );
		$this->assertCount( 1, array_keys( $result, 'jetpack-search', true ) );
	}

	/**
	 * `init()` must always register the block-level hooks AND the IA state
	 * seeding regardless of which experience the site has saved — admins can
	 * insert Search blocks anywhere blocks are configurable, and those blocks
	 * need the seeded base state to hydrate.
	 */
	public function test_init_always_registers_block_and_seed_hooks() {
		$this->reset_search_blocks_hooks();
		$this->set_module_active( true );
		// No experience opt-in saved — get_experience() falls back to 'inline'
		// (or 'overlay' if instant_search_enabled is true). Either way, not embedded.
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );

		Search_Blocks::init();

		$this->assertNotFalse(
			has_action( 'init', array( Search_Blocks::class, 'register_blocks' ) ),
			'register_blocks must always hook into init'
		);
		$this->assertNotFalse(
			has_filter( 'block_categories_all', array( Search_Blocks::class, 'register_block_category' ) ),
			'register_block_category must always hook into block_categories_all'
		);
		$this->assertNotFalse(
			has_action( 'enqueue_block_editor_assets', array( Search_Blocks::class, 'enqueue_editor_assets' ) ),
			'enqueue_editor_assets must always hook into enqueue_block_editor_assets'
		);
		$this->assertNotFalse(
			has_action( 'template_redirect', array( Search_Blocks::class, 'seed_interactivity_state' ) ),
			'seed_interactivity_state must always hook into template_redirect (blocks may be on any page)'
		);
		$this->assertNotFalse(
			has_action( 'wp_enqueue_scripts', array( Search_Blocks::class, 'seed_interactivity_state' ) ),
			'seed_interactivity_state must always hook into wp_enqueue_scripts (blocks may be on any page)'
		);
	}

	/**
	 * Off the Embedded experience, the template-takeover hooks
	 * (`register_search_template` / `prepend_search_template`) must NOT be
	 * registered — `/?s=…` should resolve to the theme's `search.html`, not
	 * the Jetpack Search template.
	 */
	public function test_init_does_not_register_template_hooks_when_not_embedded() {
		$this->reset_search_blocks_hooks();
		$this->set_module_active( true );
		// Inline = no opt-in saved. Overlay and Off are likewise non-embedded.
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );

		Search_Blocks::init();

		$this->assertFalse(
			has_action( 'init', array( Search_Blocks::class, 'register_search_template' ) ),
			'register_search_template must not hook into init when experience is not embedded'
		);
		$this->assertFalse(
			has_filter( 'search_template_hierarchy', array( Search_Blocks::class, 'prepend_search_template' ) ),
			'prepend_search_template must not hook into search_template_hierarchy when not embedded'
		);
	}

	/**
	 * On the Embedded experience, the template-takeover hooks must be
	 * registered so `/?s=…` resolves to the Jetpack Search template instead
	 * of the theme's `search.html`.
	 */
	public function test_init_registers_template_hooks_when_embedded() {
		$this->reset_search_blocks_hooks();
		$this->set_module_active( true );
		update_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, Module_Control::EXPERIENCE_EMBEDDED );

		Search_Blocks::init();

		$this->assertNotFalse(
			has_action( 'init', array( Search_Blocks::class, 'register_search_template' ) ),
			'register_search_template must hook into init on embedded'
		);
		$this->assertNotFalse(
			has_filter( 'search_template_hierarchy', array( Search_Blocks::class, 'prepend_search_template' ) ),
			'prepend_search_template must hook into search_template_hierarchy on embedded'
		);

		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
	}

	/**
	 * If the module isn't active, the experience is `'off'` regardless of any
	 * stale value in the experience option, so the template-takeover hooks
	 * must not register. Guards against a leftover `'embedded'` value on a
	 * site that's been deactivated. The block-level and seed hooks still
	 * register so any post-content Search block continues to hydrate.
	 */
	public function test_init_does_not_register_template_hooks_when_module_inactive() {
		$this->reset_search_blocks_hooks();
		$this->set_module_active( false );
		update_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, Module_Control::EXPERIENCE_EMBEDDED );

		Search_Blocks::init();

		$this->assertFalse(
			has_action( 'init', array( Search_Blocks::class, 'register_search_template' ) )
		);
		$this->assertFalse(
			has_filter( 'search_template_hierarchy', array( Search_Blocks::class, 'prepend_search_template' ) )
		);
		// Block + seed hooks still register, since blocks may be on any page.
		$this->assertNotFalse(
			has_action( 'init', array( Search_Blocks::class, 'register_blocks' ) )
		);
		$this->assertNotFalse(
			has_action( 'template_redirect', array( Search_Blocks::class, 'seed_interactivity_state' ) )
		);

		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
	}

	/**
	 * Remove every hook this class registers, so each `init()` test starts
	 * from a known-empty state.
	 */
	private function reset_search_blocks_hooks(): void {
		remove_action( 'init', array( Search_Blocks::class, 'register_blocks' ) );
		remove_action( 'init', array( Search_Blocks::class, 'register_search_template' ) );
		remove_filter( 'block_categories_all', array( Search_Blocks::class, 'register_block_category' ) );
		remove_filter( 'search_template_hierarchy', array( Search_Blocks::class, 'prepend_search_template' ) );
		remove_action( 'template_redirect', array( Search_Blocks::class, 'seed_interactivity_state' ) );
		remove_action( 'wp_enqueue_scripts', array( Search_Blocks::class, 'seed_interactivity_state' ) );
		remove_action( 'enqueue_block_editor_assets', array( Search_Blocks::class, 'enqueue_editor_assets' ) );
	}

	/**
	 * Toggle whether the Search module reads as active by writing the
	 * `jetpack_active_modules` option directly.
	 *
	 * @param bool $active True to add `'search'` to the option, false to remove it.
	 */
	private function set_module_active( bool $active ): void {
		if ( $active ) {
			update_option( 'jetpack_active_modules', array( 'search' ) );
		} else {
			update_option( 'jetpack_active_modules', array() );
		}
	}

	/**
	 * `register_search_template()` must push the template into
	 * WP_Block_Templates_Registry (so it shows up in the Site Editor's
	 * Templates list) and the stored content must reference the Jetpack
	 * Search blocks that make the page useful.
	 */
	public function test_register_search_template_registers_via_block_template_api() {
		if ( ! function_exists( 'register_block_template' ) ) {
			$this->markTestSkipped( 'register_block_template() unavailable in this test environment.' );
		}
		// Isolate from any prior registration — the registry is a singleton
		// across tests, and register_block_template() errors on duplicates.
		$registry = \WP_Block_Templates_Registry::get_instance();
		foreach ( array( 'jetpack-search//jetpack-search', 'jetpack//jetpack-search' ) as $name ) {
			if ( $registry->is_registered( $name ) ) {
				$registry->unregister( $name );
			}
		}

		Search_Blocks::register_search_template();

		$namespace = $this->invoke_protected( 'get_parent_plugin_slug' );
		$expected  = $namespace . '//jetpack-search';
		$this->assertTrue( $registry->is_registered( $expected ), "Template $expected should be registered." );

		$registered = $registry->get_registered( $expected );
		$this->assertSame( 'Jetpack Search Results', $registered->title );
		// Core blocks that make up the layout — guards against an accidental
		// empty-file read or a placeholder substitution that blows away the body.
		$this->assertStringContainsString( '<!-- wp:jetpack-search/results-list /-->', $registered->content );
		$this->assertStringContainsString( '<!-- wp:jetpack-search/filter-checkbox', $registered->content );
		// The `{{FILTER_HEADING}}` placeholder must have been substituted —
		// if it leaks into the registry, the heading renders as `{{FILTER_HEADING}}`
		// on the front end.
		$this->assertStringNotContainsString( '{{FILTER_HEADING}}', $registered->content );

		$registry->unregister( $expected );
	}

	/**
	 * If the bundled template file can't be read, registration must be a
	 * no-op — otherwise the slug we prepended to `search_template_hierarchy`
	 * would resolve to an empty plugin template and take over `/?s=...`
	 * with a blank page. Simulate the missing-file case with an anonymous
	 * subclass that overrides `get_search_template_content()` to return ''
	 * (the actual file is always present in the repo).
	 */
	public function test_register_search_template_skips_when_content_empty() {
		if ( ! function_exists( 'register_block_template' ) ) {
			$this->markTestSkipped( 'register_block_template() unavailable in this test environment.' );
		}
		$registry = \WP_Block_Templates_Registry::get_instance();
		foreach ( array( 'jetpack-search//jetpack-search', 'jetpack//jetpack-search' ) as $name ) {
			if ( $registry->is_registered( $name ) ) {
				$registry->unregister( $name );
			}
		}

		// Stub empty content by temporarily overriding the method's output
		// via a mock subclass. Simplest: run register_search_template on a
		// subclass that returns '' from get_search_template_content().
		$anon = new class() extends Search_Blocks {
			protected static function get_search_template_content(): string {
				return '';
			}
		};
		$anon::register_search_template();

		foreach ( array( 'jetpack-search//jetpack-search', 'jetpack//jetpack-search' ) as $name ) {
			$this->assertFalse( $registry->is_registered( $name ), "Template $name should NOT be registered when content is empty." );
		}
	}

	/**
	 * When both the Jetpack monolith and the standalone Jetpack Search plugin
	 * are active, the more-specific "Jetpack Search" label must win so the
	 * Site Editor shows the template under Search rather than the umbrella
	 * Jetpack plugin.
	 */
	public function test_get_parent_plugin_slug_prefers_jetpack_search_over_jetpack() {
		$original = get_option( 'active_plugins', array() );
		update_option( 'active_plugins', array( 'jetpack/jetpack.php', 'jetpack-search/jetpack-search.php' ) );
		try {
			$this->assertSame( 'jetpack-search', $this->invoke_protected( 'get_parent_plugin_slug' ) );
		} finally {
			update_option( 'active_plugins', $original );
		}
	}

	/**
	 * With only the Jetpack monolith active, the label should fall to
	 * "Jetpack" — that's the only plugin WP can resolve to a name.
	 */
	public function test_get_parent_plugin_slug_uses_jetpack_when_only_jetpack_active() {
		$original = get_option( 'active_plugins', array() );
		update_option( 'active_plugins', array( 'jetpack/jetpack.php' ) );
		try {
			$this->assertSame( 'jetpack', $this->invoke_protected( 'get_parent_plugin_slug' ) );
		} finally {
			update_option( 'active_plugins', $original );
		}
	}

	/**
	 * Neither preferred plugin active (shouldn't happen — the package is only
	 * loaded by one of them — but test the safe fallback so a misconfigured
	 * site doesn't break template registration with an invalid namespace).
	 */
	public function test_get_parent_plugin_slug_falls_back_when_neither_active() {
		$original = get_option( 'active_plugins', array() );
		update_option( 'active_plugins', array( 'some-other-plugin/some-other-plugin.php' ) );
		try {
			$this->assertSame( 'jetpack-search', $this->invoke_protected( 'get_parent_plugin_slug' ) );
		} finally {
			update_option( 'active_plugins', $original );
		}
	}

	/**
	 * On the WP search route, the inline blocks must keep using the
	 * canonical `s` URL key so they interoperate with core's search
	 * routing, body classes, and any theme/plugin code keyed off `s`.
	 */
	public function test_get_search_param_name_uses_s_on_search_route() {
		$original_query = $GLOBALS['wp_query'] ?? null;
		try {
			$GLOBALS['wp_query'] = new \WP_Query( array( 's' => 'boots' ) );
			$this->assertSame( 's', Search_Blocks::get_search_param_name() );
		} finally {
			$GLOBALS['wp_query'] = $original_query;
		}
	}

	/**
	 * On any non-search request (singular page, archive, front page),
	 * the inline blocks must switch to `q` so a refresh of an inline-
	 * search URL like `/about/?q=boots` doesn't trip core's
	 * `WP_Query::get_posts()` AND'd `post_content LIKE` clause and
	 * 404 the page (RSM-1754).
	 */
	public function test_get_search_param_name_uses_q_off_search_route() {
		$original_query = $GLOBALS['wp_query'] ?? null;
		try {
			$GLOBALS['wp_query'] = new \WP_Query();
			$this->assertSame( 'q', Search_Blocks::get_search_param_name() );
		} finally {
			$GLOBALS['wp_query'] = $original_query;
		}
	}

	/**
	 * On the WP search route, the seed must read `searchQuery` from
	 * `?s=…` and tell the JS store the active key is `s` so subsequent
	 * URL writes (debounced search keystrokes, `popstate`) stay on the
	 * canonical key.
	 */
	public function test_build_initial_state_uses_s_on_search_route() {
		$original_get        = $_GET;
		$original_query      = $GLOBALS['wp_query'] ?? null;
		$_GET                = array( 's' => 'boots' );
		$GLOBALS['wp_query'] = new \WP_Query( array( 's' => 'boots' ) );
		try {
			$state = Search_Blocks::build_initial_state();
			$this->assertSame( 'boots', $state['searchQuery'] );
			$this->assertSame( 's', $state['searchParamName'] );
		} finally {
			$_GET                = $original_get;
			$GLOBALS['wp_query'] = $original_query;
		}
	}

	/**
	 * On a non-search page (singular embed, archive, etc.), the seed
	 * must read `searchQuery` from `?q=…` and ignore any stray `?s=…`
	 * (which is the URL shape we deliberately stopped writing to
	 * dodge the singular 404 path).
	 */
	public function test_build_initial_state_uses_q_off_search_route() {
		$original_get        = $_GET;
		$original_query      = $GLOBALS['wp_query'] ?? null;
		$_GET                = array(
			'q' => 'boots',
			's' => 'ignored',
		);
		$GLOBALS['wp_query'] = new \WP_Query();
		try {
			$state = Search_Blocks::build_initial_state();
			$this->assertSame( 'boots', $state['searchQuery'] );
			$this->assertSame( 'q', $state['searchParamName'] );
		} finally {
			$_GET                = $original_get;
			$GLOBALS['wp_query'] = $original_query;
		}
	}

	/**
	 * Off the search route, an `?s=boots` URL must NOT seed the inline
	 * search — the active key is `q`. Without this, a stray `s` (from
	 * a pre-existing shared link or an unrelated plugin) would still
	 * hydrate the Interactivity store and re-emit `?s=` on the next
	 * URL push, walking us back into the singular 404 path.
	 */
	public function test_build_initial_state_ignores_legacy_s_param_off_search_route() {
		$original_get        = $_GET;
		$original_query      = $GLOBALS['wp_query'] ?? null;
		$_GET                = array( 's' => 'boots' );
		$GLOBALS['wp_query'] = new \WP_Query();
		try {
			$state = Search_Blocks::build_initial_state();
			$this->assertSame( '', $state['searchQuery'] );
			$this->assertSame( 'q', $state['searchParamName'] );
		} finally {
			$_GET                = $original_get;
			$GLOBALS['wp_query'] = $original_query;
		}
	}

	/**
	 * Both URL keys the inline blocks may write (`s` on the search route,
	 * `q` off it) must be reserved by `parse_url_filters()` so a hostile
	 * or malformed `?s[]=…&q[]=…` can't smuggle the search query into
	 * `activeFilters` (which would forward it to ES as a filter clause
	 * and round-trip it back into the URL on every keystroke). The real
	 * filter alongside them proves the rest of the parser is still
	 * working — i.e. the reservation gate is surgical, not a side
	 * effect of an unrelated rejection earlier in the loop.
	 */
	public function test_build_initial_state_reserves_both_s_and_q_from_active_filters() {
		$original_get        = $_GET;
		$original_query      = $GLOBALS['wp_query'] ?? null;
		$_GET                = array(
			's'        => array( 'ignored' ),
			'q'        => array( 'ignored' ),
			'category' => array( 'news' ),
		);
		$GLOBALS['wp_query'] = new \WP_Query();
		try {
			$state = Search_Blocks::build_initial_state();
			$this->assertSame( array( 'category' => array( 'news' ) ), $state['activeFilters'] );
		} finally {
			$_GET                = $original_get;
			$GLOBALS['wp_query'] = $original_query;
		}
	}

	/**
	 * The filter-checkbox inserter cards come from
	 * Search_Blocks::inject_filter_checkbox_variations(); if these names or
	 * seeded attributes drift, the editor stops offering the expected filter
	 * presets or inserts them with the wrong defaults.
	 */
	public function test_inject_filter_checkbox_variations_adds_expected_shapes() {
		// Product variations are WC-gated; flip the probe so this matrix
		// can assert their full shape. The non-Woo case is covered by
		// `test_inject_filter_checkbox_variations_drops_product_when_woocommerce_inactive`.
		Search_Blocks::set_is_woocommerce_active_for_testing( true );
		$variations = Search_Blocks::inject_filter_checkbox_variations(
			array(
				array(
					'name'  => 'existing',
					'title' => 'Existing variation',
				),
			),
			new \WP_Block_Type( 'jetpack-search/filter-checkbox' )
		);

		$variations_by_name = array_column( $variations, null, 'name' );

		$this->assertArrayHasKey( 'existing', $variations_by_name );
		$this->assertSame(
			array(
				'filterType' => 'taxonomy',
				'taxonomy'   => 'category',
				'label'      => 'Category',
			),
			$variations_by_name['category']['attributes']
		);
		$this->assertSame( array( 'filterType', 'taxonomy' ), $variations_by_name['category']['isActive'] );

		$this->assertSame(
			array(
				'filterType' => 'taxonomy',
				'taxonomy'   => 'post_tag',
				'label'      => 'Tag',
			),
			$variations_by_name['post_tag']['attributes']
		);
		$this->assertSame( array( 'filterType', 'taxonomy' ), $variations_by_name['post_tag']['isActive'] );

		$this->assertSame(
			array(
				'filterType' => 'post_type',
				'label'      => 'Post Type',
			),
			$variations_by_name['post_type']['attributes']
		);
		$this->assertSame( array( 'filterType' ), $variations_by_name['post_type']['isActive'] );

		$this->assertSame(
			array(
				'filterType' => 'author',
				'label'      => 'Author',
			),
			$variations_by_name['author']['attributes']
		);
		$this->assertSame( array( 'filterType' ), $variations_by_name['author']['isActive'] );

		$this->assertSame(
			array(
				'filterType' => 'taxonomy',
				'taxonomy'   => '',
				'label'      => '',
			),
			$variations_by_name['custom_taxonomy']['attributes']
		);
		$this->assertSame( array( 'filterType' ), $variations_by_name['custom_taxonomy']['isActive'] );

		// WC product taxonomies — product_cat / product_tag are unconditional
		// (WooCommerce always registers them); product_brand is gated below
		// in test_inject_filter_checkbox_variations_gates_product_brand_on_taxonomy_existence.
		$this->assertSame(
			array(
				'filterType' => 'taxonomy',
				'taxonomy'   => 'product_cat',
				'label'      => 'Product Category',
			),
			$variations_by_name['product_cat']['attributes']
		);
		$this->assertSame( array( 'filterType', 'taxonomy' ), $variations_by_name['product_cat']['isActive'] );
		$this->assertSame( 'category', $variations_by_name['product_cat']['icon'] );

		$this->assertSame(
			array(
				'filterType' => 'taxonomy',
				'taxonomy'   => 'product_tag',
				'label'      => 'Product Tag',
			),
			$variations_by_name['product_tag']['attributes']
		);
		$this->assertSame( array( 'filterType', 'taxonomy' ), $variations_by_name['product_tag']['isActive'] );
		$this->assertSame( 'tag', $variations_by_name['product_tag']['icon'] );

		// product_brand is gated on `taxonomy_exists( 'product_brand' )`. In a
		// bare phpunit run no taxonomies are registered, so it must NOT appear.
		$this->assertArrayNotHasKey( 'product_brand', $variations_by_name );
	}

	/**
	 * `product_brand` isn't a core WC taxonomy — it's added by extensions
	 * (WC Brands, Perfect Brands, recent bundled WC versions). The variation
	 * is registered only when the taxonomy is present so authors don't see
	 * a silently-empty filter on sites without a brands extension.
	 */
	public function test_inject_filter_checkbox_variations_gates_product_brand_on_taxonomy_existence() {
		Search_Blocks::set_is_woocommerce_active_for_testing( true );
		register_taxonomy( 'product_brand', 'post' );

		$variations         = Search_Blocks::inject_filter_checkbox_variations(
			array(),
			new \WP_Block_Type( 'jetpack-search/filter-checkbox' )
		);
		$variations_by_name = array_column( $variations, null, 'name' );

		$this->assertArrayHasKey( 'product_brand', $variations_by_name );
		$this->assertSame(
			array(
				'filterType' => 'taxonomy',
				'taxonomy'   => 'product_brand',
				'label'      => 'Product Brand',
			),
			$variations_by_name['product_brand']['attributes']
		);
		$this->assertSame( array( 'filterType', 'taxonomy' ), $variations_by_name['product_brand']['isActive'] );
		$this->assertSame( 'awards', $variations_by_name['product_brand']['icon'] );

		// Inserter cards render in the order the variations are returned, so
		// product_brand must precede custom_taxonomy to keep the three
		// product variations grouped together rather than splitting around
		// Custom Taxonomy.
		$names           = array_column( $variations, 'name' );
		$brand_position  = array_search( 'product_brand', $names, true );
		$custom_position = array_search( 'custom_taxonomy', $names, true );
		$this->assertNotFalse( $brand_position );
		$this->assertNotFalse( $custom_position );
		$this->assertLessThan( $custom_position, $brand_position );

		unregister_taxonomy( 'product_brand' );
	}

	/**
	 * On non-Woo sites the three product taxonomy variations (product_cat,
	 * product_tag, product_brand) must NOT appear in the inserter — the
	 * underlying taxonomies don't exist there, so the variations would
	 * render silently-empty filters. The non-WC variations stay registered.
	 */
	public function test_inject_filter_checkbox_variations_drops_product_when_woocommerce_inactive() {
		Search_Blocks::set_is_woocommerce_active_for_testing( false );
		register_taxonomy( 'product_brand', 'post' );
		try {
			$variations         = Search_Blocks::inject_filter_checkbox_variations(
				array(),
				new \WP_Block_Type( 'jetpack-search/filter-checkbox' )
			);
			$variations_by_name = array_column( $variations, null, 'name' );

			$this->assertArrayNotHasKey( 'product_cat', $variations_by_name );
			$this->assertArrayNotHasKey( 'product_tag', $variations_by_name );
			$this->assertArrayNotHasKey( 'product_brand', $variations_by_name );
			// Non-WC presets are unaffected.
			$this->assertArrayHasKey( 'category', $variations_by_name );
			$this->assertArrayHasKey( 'post_tag', $variations_by_name );
			$this->assertArrayHasKey( 'post_type', $variations_by_name );
			$this->assertArrayHasKey( 'author', $variations_by_name );
			$this->assertArrayHasKey( 'custom_taxonomy', $variations_by_name );
		} finally {
			unregister_taxonomy( 'product_brand' );
		}
	}

	/**
	 * `is_woocommerce_only_block()` is the canonical predicate that drives
	 * the three coupled gates — `register_blocks()` registration loop, the
	 * `filter_block_helpers()` map, and the editor's `register-blocks.js`
	 * bundle (after the localized list). Membership is decided by exact
	 * match against `woocommerce_only_block_names()`, so adding a name to
	 * that list auto-enrolls every gate without further plumbing.
	 */
	public function test_is_woocommerce_only_block_matches_canonical_list() {
		// Every entry on the canonical list resolves to true under both
		// the full namespaced form and the bare directory basename form
		// (`register_blocks()` walks dir basenames; the helpers map and
		// editor bundle hold full names).
		foreach ( Search_Blocks::woocommerce_only_block_names() as $full_name ) {
			$this->assertTrue(
				Search_Blocks::is_woocommerce_only_block( $full_name ),
				"Expected $full_name to be recognized as WC-only."
			);
			$bare = substr( $full_name, (int) strrpos( $full_name, '/' ) + 1 );
			$this->assertTrue(
				Search_Blocks::is_woocommerce_only_block( $bare ),
				"Expected bare basename $bare to be recognized as WC-only."
			);
		}

		// `filters-product` lives on the canonical list — it's the WC-specific
		// filter container — and is caught despite not sharing the
		// `filter-wc-` prefix the four filter blocks use.
		$this->assertTrue( Search_Blocks::is_woocommerce_only_block( 'jetpack-search/filters-product' ) );
		$this->assertTrue( Search_Blocks::is_woocommerce_only_block( 'filters-product' ) );

		// Non-WC blocks must not be caught.
		$this->assertFalse( Search_Blocks::is_woocommerce_only_block( 'jetpack-search/filter-checkbox' ) );
		$this->assertFalse( Search_Blocks::is_woocommerce_only_block( 'jetpack-search/results-list' ) );
		$this->assertFalse( Search_Blocks::is_woocommerce_only_block( 'jetpack-search/filters' ) );
		$this->assertFalse( Search_Blocks::is_woocommerce_only_block( 'filter-date' ) );
		// A made-up `filter-wc-foo` that isn't on the canonical list must
		// not be caught — the gate is a list, not a name pattern.
		$this->assertFalse( Search_Blocks::is_woocommerce_only_block( 'jetpack-search/filter-wc-bogus' ) );
	}

	/**
	 * `filter_block_helpers()` underwrites both `walk_blocks_for_filter_configs()`
	 * (which reads block trees in post content) and any future caller that
	 * needs to know whether a block name is filter-shaped. On non-Woo sites
	 * the WC-only blocks aren't registered, so they must drop out of the
	 * helper map too — keeping the registry symmetric with what the inserter
	 * offered.
	 */
	public function test_filter_block_helpers_drops_wc_helpers_when_woocommerce_inactive() {
		Search_Blocks::set_is_woocommerce_active_for_testing( false );
		$helpers = $this->invoke_protected( 'filter_block_helpers' );

		$this->assertArrayHasKey( 'jetpack-search/filter-checkbox', $helpers );
		$this->assertArrayHasKey( 'jetpack-search/filter-date', $helpers );
		$this->assertArrayNotHasKey( 'jetpack-search/filter-wc-rating', $helpers );
		$this->assertArrayNotHasKey( 'jetpack-search/filter-wc-attribute', $helpers );
		$this->assertArrayNotHasKey( 'jetpack-search/filter-wc-stock-status', $helpers );
	}

	/**
	 * On Woo sites the helper map must include every WC-only block so
	 * filter-config collection covers the full filter surface.
	 */
	public function test_filter_block_helpers_includes_wc_helpers_when_woocommerce_active() {
		Search_Blocks::set_is_woocommerce_active_for_testing( true );
		$helpers = $this->invoke_protected( 'filter_block_helpers' );

		$this->assertArrayHasKey( 'jetpack-search/filter-wc-rating', $helpers );
		$this->assertArrayHasKey( 'jetpack-search/filter-wc-attribute', $helpers );
		$this->assertArrayHasKey( 'jetpack-search/filter-wc-stock-status', $helpers );
	}

	/**
	 * `min_price` / `max_price` are WC-only; `filter-wc-price` isn't
	 * registered on non-Woo sites. A stray deep link must not seed the
	 * `priceRange` slice — otherwise the JS store would re-emit the params
	 * on the next URL push and the API request would carry a `range` clause
	 * for a field the index doesn't have.
	 */
	public function test_build_initial_state_drops_price_range_when_woocommerce_inactive() {
		Search_Blocks::set_is_woocommerce_active_for_testing( false );
		$original_get = $_GET;
		$_GET         = array(
			'min_price' => '10',
			'max_price' => '50',
		);
		try {
			$state = Search_Blocks::build_initial_state();
			$this->assertNull( $state['priceRange'] );
			// `isLoading` is derived from `is_initial_loading()`, which
			// pivots on `parse_url_price_range()`. With the price gate
			// dropped on non-Woo sites, a `?min_price=…` URL must not
			// flip the page into the loading state — there's no fetch
			// to wait on. End-to-end coverage for the WC-off branch.
			$this->assertFalse( $state['isLoading'] );
		} finally {
			$_GET = $original_get;
		}
	}

	/**
	 * The same deep link on a Woo site must round-trip into `priceRange`
	 * so the API request fires with the matching `range` clause on first
	 * paint — this is the same contract `filter-wc-price` writes to URL.
	 */
	public function test_build_initial_state_seeds_price_range_when_woocommerce_active() {
		Search_Blocks::set_is_woocommerce_active_for_testing( true );
		$original_get = $_GET;
		$_GET         = array(
			'min_price' => '10',
			'max_price' => '50',
		);
		try {
			$state = Search_Blocks::build_initial_state();
			$this->assertSame(
				array(
					'min' => 10.0,
					'max' => 50.0,
				),
				$state['priceRange']
			);
		} finally {
			$_GET = $original_get;
		}
	}

	/**
	 * The injector must be scoped to jetpack-search/filter-checkbox so it
	 * can't leak Search-specific presets onto unrelated blocks.
	 */
	public function test_inject_filter_checkbox_variations_ignores_other_block_types() {
		$variations = array(
			array(
				'name'  => 'existing',
				'title' => 'Existing variation',
			),
		);

		$this->assertSame(
			$variations,
			Search_Blocks::inject_filter_checkbox_variations( $variations, new \WP_Block_Type( 'core/paragraph' ) )
		);
	}

	/**
	 * If a variation with one of our preset names is already registered (via
	 * block.json or a higher-priority filter), the existing entry must win —
	 * otherwise `array_merge` would emit two inserter cards under the same
	 * variation name and the editor would resolve `isActive` ambiguously.
	 */
	public function test_inject_filter_checkbox_variations_skips_name_collisions() {
		$existing_category = array(
			'name'       => 'category',
			'title'      => 'Site-customized Category filter',
			'attributes' => array(
				'filterType' => 'taxonomy',
				'taxonomy'   => 'category',
				'label'      => 'Topics',
			),
		);
		$variations        = Search_Blocks::inject_filter_checkbox_variations(
			array( $existing_category ),
			new \WP_Block_Type( 'jetpack-search/filter-checkbox' )
		);

		$category_entries = array();
		foreach ( $variations as $v ) {
			if ( 'category' === $v['name'] ) {
				$category_entries[] = $v;
			}
		}
		$this->assertCount( 1, $category_entries );

		$by_name = array_column( $variations, null, 'name' );
		$this->assertSame( 'Site-customized Category filter', $by_name['category']['title'] );
		// Other presets are still added, only the colliding name is skipped.
		$this->assertArrayHasKey( 'post_tag', $by_name );
		$this->assertArrayHasKey( 'post_type', $by_name );
		$this->assertArrayHasKey( 'author', $by_name );
		$this->assertArrayHasKey( 'custom_taxonomy', $by_name );
	}

	/**
	 * The shared display-style normalizer powers the bucket-driven filter
	 * blocks that opt into chips today (filter-checkbox, filter-date,
	 * filter-wc-attribute). Per-block delegations are exercised in their
	 * own tests; this case pins the source-of-truth contract so a `'chips'`
	 * literal never gains a third synonym (`'chip'`, `'CHIPS'`, …) without
	 * an explicit test update.
	 */
	public function test_normalize_display_style_pins_enum() {
		$this->assertSame( 'checkbox-list', Search_Blocks::normalize_display_style( null ) );
		$this->assertSame( 'checkbox-list', Search_Blocks::normalize_display_style( '' ) );
		$this->assertSame( 'checkbox-list', Search_Blocks::normalize_display_style( 'checkbox-list' ) );
		$this->assertSame( 'checkbox-list', Search_Blocks::normalize_display_style( 'bogus' ) );
		$this->assertSame( 'checkbox-list', Search_Blocks::normalize_display_style( 'CHIPS' ) );
		$this->assertSame( 'checkbox-list', Search_Blocks::normalize_display_style( 0 ) );
		$this->assertSame( 'chips', Search_Blocks::normalize_display_style( 'chips' ) );
	}

	/**
	 * No filter registered → empty map. Anchors the default behavior so a
	 * site that hasn't opted into the slot-mapping feature pays nothing
	 * for it (the `Custom Taxonomy` picker still works against the native
	 * allowlist).
	 */
	public function test_custom_taxonomy_map_empty_by_default() {
		$this->assertSame( array(), Search_Blocks::custom_taxonomy_map() );
	}

	/**
	 * Valid mappings round-trip through the filter, including across multiple
	 * slots — pins both the per-entry shape and the multi-entry support.
	 */
	public function test_custom_taxonomy_map_accepts_valid_entries() {
		$callback = static function () {
			return array(
				'genre' => 'jetpack-search-tag1',
				'mood'  => 'jetpack-search-tag2',
			);
		};
		add_filter( 'jetpack_search_custom_taxonomy_map', $callback );
		try {
			$this->assertSame(
				array(
					'genre' => 'jetpack-search-tag1',
					'mood'  => 'jetpack-search-tag2',
				),
				Search_Blocks::custom_taxonomy_map()
			);
		} finally {
			remove_filter( 'jetpack_search_custom_taxonomy_map', $callback );
		}
	}

	/**
	 * Invalid slot values must be dropped — the slot field path determines
	 * the ES field name, so an arbitrary string would query a non-existent
	 * field and the filter would silently return zero buckets. The valid
	 * sibling entry must still come through so one bad entry doesn't sink
	 * the entire map.
	 */
	public function test_custom_taxonomy_map_rejects_invalid_slot_values() {
		$callback = static function () {
			return array(
				'genre'   => 'jetpack-search-tag1',     // OK.
				'bogus_a' => 'jetpack-search-tag10',     // out of range (single digit only).
				'bogus_b' => 'category',                 // not a reserved slot.
				'bogus_c' => 'jetpack-search-tag',       // missing digit.
				'bogus_d' => '',                         // empty.
			);
		};
		add_filter( 'jetpack_search_custom_taxonomy_map', $callback );
		// Suppress _doing_it_wrong notices — we're testing that the map
		// drops bad entries, not the notice channel itself.
		$prev_doing_it_wrong = $this->silence_doing_it_wrong();
		try {
			$this->assertSame(
				array( 'genre' => 'jetpack-search-tag1' ),
				Search_Blocks::custom_taxonomy_map()
			);
		} finally {
			remove_filter( 'jetpack_search_custom_taxonomy_map', $callback );
			$this->restore_doing_it_wrong( $prev_doing_it_wrong );
		}
	}

	/**
	 * Two user-slugs pointing at the same slot would merge their term
	 * spaces in the index (they'd both pull from the same `jetpack-search-tagN`
	 * field) — the second filter would silently return results from the
	 * first. Reject the duplicate; first-write wins.
	 */
	public function test_custom_taxonomy_map_rejects_duplicate_slot_assignment() {
		$callback = static function () {
			return array(
				'genre'   => 'jetpack-search-tag1',
				'subject' => 'jetpack-search-tag1', // duplicate slot.
			);
		};
		add_filter( 'jetpack_search_custom_taxonomy_map', $callback );
		$prev_doing_it_wrong = $this->silence_doing_it_wrong();
		try {
			$this->assertSame(
				array( 'genre' => 'jetpack-search-tag1' ),
				Search_Blocks::custom_taxonomy_map()
			);
		} finally {
			remove_filter( 'jetpack_search_custom_taxonomy_map', $callback );
			$this->restore_doing_it_wrong( $prev_doing_it_wrong );
		}
	}

	/**
	 * A filter callback that returns something other than an array must not
	 * crash callers — empty map is the safe fallback. `_doing_it_wrong()` is
	 * fired so a misconfiguration is visible during development; tested
	 * separately below.
	 */
	public function test_custom_taxonomy_map_handles_non_array_return() {
		$callback = static function () {
			return 'not an array';
		};
		add_filter( 'jetpack_search_custom_taxonomy_map', $callback );
		$prev = $this->silence_doing_it_wrong();
		try {
			$this->assertSame( array(), Search_Blocks::custom_taxonomy_map() );
		} finally {
			remove_filter( 'jetpack_search_custom_taxonomy_map', $callback );
			$this->restore_doing_it_wrong( $prev );
		}
	}

	/**
	 * Pins the docblock promise that a non-array filter return fires a
	 * `_doing_it_wrong()` notice, so site owners notice misconfiguration
	 * during development rather than silently getting an empty picker.
	 */
	public function test_custom_taxonomy_map_fires_doing_it_wrong_on_non_array_return() {
		$callback = static function () {
			return null;
		};
		$captured = null;
		$listener = function ( $function, $message, $version ) use ( &$captured ) {
			if ( 'jetpack_search_custom_taxonomy_map' === $function ) {
				$captured = compact( 'message', 'version' );
			}
		};
		add_filter( 'jetpack_search_custom_taxonomy_map', $callback );
		add_action( 'doing_it_wrong_run', $listener, 10, 3 );
		// Keep the actual error suppressed so PHPUnit's deprecation handler
		// doesn't flip the test red on the codepath we're exercising.
		add_filter( 'doing_it_wrong_trigger_error', '__return_false' );
		try {
			Search_Blocks::custom_taxonomy_map();
			$this->assertIsArray( $captured, 'Expected _doing_it_wrong() to have fired.' );
			$this->assertStringContainsString( 'must return an array', $captured['message'] );
		} finally {
			remove_action( 'doing_it_wrong_run', $listener, 10 );
			remove_filter( 'jetpack_search_custom_taxonomy_map', $callback );
			remove_filter( 'doing_it_wrong_trigger_error', '__return_false' );
		}
	}

	/**
	 * The map's user-facing keys flow into the editor's whitelist (via
	 * `supported_custom_taxonomies()`) so a mapped taxonomy appears in the
	 * picker even if it's not in Jetpack Search's native allowlist. The
	 * taxonomy must be registered on the site — otherwise the editor's
	 * `core.getTaxonomies()` won't surface it anyway.
	 */
	public function test_supported_custom_taxonomies_includes_map_keys_when_registered() {
		register_taxonomy( 'genre', 'post', array( 'public' => true ) );
		$callback = static function () {
			return array( 'genre' => 'jetpack-search-tag1' );
		};
		add_filter( 'jetpack_search_custom_taxonomy_map', $callback );
		try {
			$this->assertContains( 'genre', Search_Blocks::supported_custom_taxonomies() );
		} finally {
			remove_filter( 'jetpack_search_custom_taxonomy_map', $callback );
			unregister_taxonomy( 'genre' );
		}
	}

	/**
	 * A map entry whose user-facing slug isn't registered locally must NOT
	 * surface in the whitelist — the editor picker can't render a label for
	 * an unregistered taxonomy, so silently dropping it keeps the surface
	 * consistent with what the editor will actually display.
	 */
	public function test_supported_custom_taxonomies_drops_unregistered_map_keys() {
		$callback = static function () {
			return array( 'never-registered' => 'jetpack-search-tag3' );
		};
		add_filter( 'jetpack_search_custom_taxonomy_map', $callback );
		try {
			$this->assertNotContains( 'never-registered', Search_Blocks::supported_custom_taxonomies() );
		} finally {
			remove_filter( 'jetpack_search_custom_taxonomy_map', $callback );
		}
	}

	/**
	 * Built-in taxonomies covered by their own filter variations
	 * (`category`, `post_tag`, plus the three product taxonomies) must never
	 * appear in the Custom Taxonomy picker even though they sit on the
	 * Jetpack Search allowlist — the dedicated variation is the right
	 * surface for those filters and a duplicate entry would be confusing.
	 */
	public function test_supported_custom_taxonomies_excludes_built_in_variations() {
		// `category` and `post_tag` are registered by core in any WP env.
		$supported = Search_Blocks::supported_custom_taxonomies();
		$this->assertNotContains( 'category', $supported );
		$this->assertNotContains( 'post_tag', $supported );
	}

	/**
	 * A taxonomy that's in Jetpack Search's native allowlist must surface
	 * automatically when registered on the site — without requiring an
	 * entry in the slot map. This is the case the FAQ's
	 * `jetpack_search_allowed_taxonomies_for_widget_filters` walkthrough
	 * covers: pre-allowlisted taxonomies just need to be registered.
	 *
	 * `jetpack-search-tag0`…`jetpack-search-tag9` are themselves on the
	 * Sync allowlist (they're the reserved slot taxonomies), so a site
	 * that registers one directly gets it in the picker straight away.
	 */
	public function test_supported_custom_taxonomies_includes_natively_indexed_when_registered() {
		register_taxonomy( 'jetpack-search-tag0', 'post', array( 'public' => true ) );
		try {
			$this->assertContains( 'jetpack-search-tag0', Search_Blocks::supported_custom_taxonomies() );
		} finally {
			unregister_taxonomy( 'jetpack-search-tag0' );
		}
	}

	/**
	 * The build_initial_state seed and `enqueue_editor_assets` localization
	 * both expose `customTaxonomyMap` to the client. Pins the contract so
	 * the JS-side `state.customTaxonomyMap` always has a shape to read,
	 * even on sites that haven't registered the filter.
	 */
	public function test_build_initial_state_seeds_custom_taxonomy_map_slot() {
		$state = Search_Blocks::build_initial_state();
		$this->assertArrayHasKey( 'customTaxonomyMap', $state );
	}

	/**
	 * Silence `_doing_it_wrong()` notices for tests that exercise the
	 * misconfiguration branches. PHPUnit's deprecation/notice handlers
	 * would otherwise flip the test red on the very codepath we want to
	 * exercise.
	 *
	 * @return callable|null Previous error handler, restored later.
	 */
	private function silence_doing_it_wrong(): ?callable {
		add_filter( 'doing_it_wrong_trigger_error', '__return_false' );
		return null;
	}

	/**
	 * Restore the previous error handler. Counterpart to
	 * `silence_doing_it_wrong()`.
	 *
	 * @param callable|null $previous Previous handler.
	 */
	private function restore_doing_it_wrong( ?callable $previous ): void {
		remove_filter( 'doing_it_wrong_trigger_error', '__return_false' );
		// $previous unused — handler returned by silence_doing_it_wrong is
		// reserved for future expansion if a test needs to capture the
		// notice payload itself.
		unset( $previous );
	}

	/**
	 * Invoke a protected static on Search_Blocks from test code. Reflection
	 * is the cheapest way to cover this logic without leaking visibility
	 * just for testability.
	 *
	 * @param string $method Method name.
	 * @param mixed  ...$args Positional args.
	 * @return mixed
	 */
	private function invoke_protected( string $method, ...$args ) {
		$ref = new \ReflectionMethod( Search_Blocks::class, $method );
		// setAccessible() became a no-op in 8.1 and was deprecated in 8.5,
		// but the package supports PHP 7.2+ where the call is still required
		// for ReflectionMethod::invoke() to reach a protected method.
		if ( PHP_VERSION_ID < 80100 ) {
			$ref->setAccessible( true );
		}
		return $ref->invoke( null, ...$args );
	}
}
