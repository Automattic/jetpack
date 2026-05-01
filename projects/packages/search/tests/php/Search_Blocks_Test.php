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
	 * Verify that the keys required by the Interactivity API store are present.
	 */
	public function test_build_initial_state_shape() {
		$required_keys = array(
			'siteId',
			'apiRoot',
			'nonce',
			'isPrivateSite',
			'isWpcom',
			'homeUrl',
			'locale',
			'searchQuery',
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
	 * Only filter keys registered by a filter-checkbox block on the current
	 * post may survive into the seeded state. An unrelated `?foo[]=bar`
	 * param (e.g. from another plugin) must be dropped so it doesn't get
	 * echoed back into subsequent search URLs.
	 */
	public function test_gate_active_filters_keeps_only_registered_keys() {
		$gated = Search_Blocks::gate_active_filters(
			array(
				'category'   => array( 'news' ),
				'post_types' => array( 'post' ),
				'foo'        => array( 'bar' ),
			),
			array(
				'category'   => array( 'filterKey' => 'category' ),
				'post_types' => array( 'filterKey' => 'post_types' ),
			)
		);
		$this->assertSame(
			array(
				'category'   => array( 'news' ),
				'post_types' => array( 'post' ),
			),
			$gated
		);
	}

	/**
	 * When no filter-checkbox blocks contribute a filterConfig (e.g. the
	 * post uses a template part instead of the bundled pattern), leave
	 * activeFilters alone — hydration may still register them client-side.
	 */
	public function test_gate_active_filters_passthrough_when_configs_empty() {
		$input = array( 'category' => array( 'news' ) );
		$this->assertSame( $input, Search_Blocks::gate_active_filters( $input, array() ) );
	}

	/**
	 * When the URL carries only unregistered array params (e.g. from another
	 * plugin) and no search query, gating drops them — and build_seed_state
	 * must recompute isLoading so the JS store doesn't leave the loading
	 * spinner stuck forever (JS initialize() only fires a search when
	 * searchQuery or hasActiveFilters is truthy).
	 */
	public function test_build_seed_state_recomputes_is_loading_after_gating() {
		$original_get   = $_GET;
		$original_query = $GLOBALS['wp_query'] ?? null;
		$_GET           = array( 'foo' => array( 'bar' ) );
		// Reset the WP_Query global so `get_search_query()` can't leak an `s`
		// value from an earlier test and make isLoading look stuck on its own.
		$GLOBALS['wp_query'] = new \WP_Query( array( 's' => '' ) );
		try {
			$state = Search_Blocks::build_seed_state(
				array( 'category' => array( 'filterKey' => 'category' ) )
			);
			$this->assertSame( '', $state['searchQuery'] );
			$this->assertSame( array(), $state['activeFilters'] );
			$this->assertFalse( $state['isLoading'] );
		} finally {
			$_GET                = $original_get;
			$GLOBALS['wp_query'] = $original_query;
		}
	}

	/**
	 * A URL carrying a registered filter must leave isLoading=true so the
	 * JS store shows the spinner until the first fetch resolves.
	 */
	public function test_build_seed_state_keeps_is_loading_for_registered_filter() {
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
		$this->assertStringContainsString( '<!-- wp:jetpack/search-results /-->', $registered->content );
		$this->assertStringContainsString( '<!-- wp:jetpack/filter-checkbox', $registered->content );
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
	 * The active-filters block reads `state.wcStockStatusLabels` to render
	 * "Stock status: In stock" chips without an extra REST hop. The map is
	 * sourced from the status block's option list so there's one source of
	 * truth for the label set; missing keys would cause the chip to fall
	 * back to the raw slug ("Stock status: instock").
	 */
	public function test_build_initial_state_seeds_wc_stock_status_labels() {
		$state = Search_Blocks::build_initial_state();
		$this->assertArrayHasKey( 'wcStockStatusLabels', $state );
		$labels = $state['wcStockStatusLabels'];
		$this->assertSame( 'In stock', $labels['instock'] ?? null );
		$this->assertSame( 'Out of stock', $labels['outofstock'] ?? null );
		$this->assertSame( 'On backorder', $labels['onbackorder'] ?? null );
	}

	/**
	 * The active-filters block reads `state.priceCurrencySymbol` to format
	 * the price chip ("Price: $10 – $50"). Default is `$`; the price block
	 * overrides this with the author's currencySymbol attribute at render
	 * time. Without this default, sites with no price block on the page
	 * would render "Price: 10 – 50".
	 */
	public function test_build_initial_state_seeds_default_price_currency_symbol() {
		$state = Search_Blocks::build_initial_state();
		$this->assertArrayHasKey( 'priceCurrencySymbol', $state );
		$this->assertSame( '$', $state['priceCurrencySymbol'] );
	}

	/**
	 * The active-filters block can't import @wordpress/i18n (only
	 *
	 * @wordpress/interactivity is registered as a script module), so the
	 * star-row plural templates and price-range format strings must be
	 * seeded as `state.strings.*` for the view bundle to read.
	 */
	public function test_build_initial_state_seeds_product_chip_strings() {
		$strings = Search_Blocks::build_initial_state()['strings'];
		foreach (
			array(
				'ratingStarsSingle',
				'ratingStarsPlural',
				'priceRangeFromTo',
				'priceRangeFrom',
				'priceRangeUpTo',
				'priceLabel',
			) as $key
		) {
			$this->assertArrayHasKey( $key, $strings, "Missing seeded string: $key" );
			$this->assertNotSame( '', $strings[ $key ], "Empty seeded string: $key" );
		}
		$this->assertStringContainsString( '%d', $strings['ratingStarsSingle'] );
		$this->assertStringContainsString( '%d', $strings['ratingStarsPlural'] );
		$this->assertStringContainsString( '%1$s', $strings['priceRangeFromTo'] );
		$this->assertStringContainsString( '%2$s', $strings['priceRangeFromTo'] );
		$this->assertStringContainsString( '%s', $strings['priceRangeFrom'] );
		$this->assertStringContainsString( '%s', $strings['priceRangeUpTo'] );
	}

	/**
	 * `walk_blocks_for_filter_configs` must recognize the new product
	 * filter blocks (attribute + taxonomy) so the URL gate sees the same
	 * keys those blocks register at render time, regardless of block order
	 * in the post tree. Without this, a deep-link with `?pa_color[]=red`
	 * or `?product_cat[]=hoodies` would be dropped on the way through
	 * gate_active_filters().
	 */
	public function test_walk_blocks_recognizes_product_filter_attribute_and_taxonomy() {
		$ref = new \ReflectionMethod( Search_Blocks::class, 'walk_blocks_for_filter_configs' );
		if ( PHP_VERSION_ID < 80100 ) {
			$ref->setAccessible( true );
		}

		$configs = array();
		$blocks  = array(
			array(
				'blockName' => 'jetpack/search-product-filter-attribute',
				'attrs'     => array(
					'attributeTaxonomy' => 'pa_color',
					'label'             => 'Colour',
				),
			),
			array(
				'blockName' => 'jetpack/search-product-filter-taxonomy',
				'attrs'     => array( 'taxonomy' => 'product_cat' ),
			),
			array(
				// Out-of-list taxonomy slug — derive_filter_key returns ''
				// so the walker should NOT push a config entry.
				'blockName' => 'jetpack/search-product-filter-taxonomy',
				'attrs'     => array( 'taxonomy' => 'category' ),
			),
		);
		$ref->invokeArgs( null, array( $blocks, &$configs ) );

		$this->assertArrayHasKey( 'pa_color', $configs );
		$this->assertSame( 'taxonomy', $configs['pa_color']['filterType'] );
		$this->assertSame( 'pa_color', $configs['pa_color']['taxonomy'] );
		$this->assertSame( 'Colour', $configs['pa_color']['label'] );

		$this->assertArrayHasKey( 'product_cat', $configs );
		$this->assertSame( 'taxonomy', $configs['product_cat']['filterType'] );
		$this->assertSame( 'product_cat', $configs['product_cat']['taxonomy'] );

		$this->assertArrayNotHasKey( 'category', $configs );
	}

	/**
	 * Nested filter blocks (e.g. inside a `jetpack/search-product-filters`
	 * parent or a Group block) must be walked recursively so the
	 * filterConfigs map covers every filter on the page, not just
	 * top-level ones.
	 */
	public function test_walk_blocks_recurses_into_inner_blocks() {
		$ref = new \ReflectionMethod( Search_Blocks::class, 'walk_blocks_for_filter_configs' );
		if ( PHP_VERSION_ID < 80100 ) {
			$ref->setAccessible( true );
		}

		$configs = array();
		$blocks  = array(
			array(
				'blockName'   => 'jetpack/search-product-filters',
				'attrs'       => array(),
				'innerBlocks' => array(
					array(
						'blockName' => 'jetpack/search-product-filter-status',
						'attrs'     => array(),
					),
				),
			),
		);
		$ref->invokeArgs( null, array( $blocks, &$configs ) );

		$this->assertArrayHasKey( 'filter_stock_status', $configs );
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
