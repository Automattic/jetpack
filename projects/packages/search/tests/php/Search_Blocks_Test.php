<?php
/**
 * Search_Blocks class tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Tests for the Search_Blocks registration class.
 */
class Search_Blocks_Test extends TestCase {

	/**
	 * The main query as it was before a test replaced it, so the swap the
	 * `posts_pre_query` callback tests perform doesn't leak across tests.
	 *
	 * @var \WP_Query|null
	 */
	private $original_wp_the_query;

	/**
	 * Snapshot the main query before each test so tearDown can restore it.
	 */
	protected function setUp(): void {
		parent::setUp();
		$this->original_wp_the_query = $GLOBALS['wp_the_query'] ?? null;
	}

	/**
	 * Clear `Search_Blocks::is_initial_loading()`'s per-request memo between
	 * Tests. PHPUnit runs every test in a single process, so without this
	 * The first test that exercises a query/filter/price URL would pin the
	 * Cached value and every later test that sets `$_GET` would silently
	 * Read stale state.
	 */
	protected function tearDown(): void {
		Search_Blocks::reset_initial_loading_cache();
		Search_Blocks::reset_woocommerce_blocks_enabled_cache();
		Search_Blocks::reset_custom_taxonomy_map_cache();
		// Guards against a failed assertion leaking the option across tests.
		delete_option( 'jetpack_search_override_woocommerce_search_template' );
		$GLOBALS['wp_the_query'] = $this->original_wp_the_query;
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
			'isWooCommerceBlocksEnabled',
			'homeUrl',
			'locale',
			'dateFormat',
			'searchQuery',
			'hasSearchParam',
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
	 * The site's `date_format` Settings option flows into the seed so the JS
	 * Result card renders dates with the same layout as the rest of the site
	 * (`F j, Y`, `Y-m-d`, etc.). Parsed client-side by `wp-date-format.js`.
	 */
	public function test_build_initial_state_seeds_site_date_format() {
		$original = get_option( 'date_format' );
		try {
			update_option( 'date_format', 'Y-m-d' );
			$state = Search_Blocks::build_initial_state();
			$this->assertSame( 'Y-m-d', $state['dateFormat'] );
		} finally {
			if ( false === $original ) {
				delete_option( 'date_format' );
			} else {
				update_option( 'date_format', $original );
			}
		}
	}

	/**
	 * View-bundle strings seeded here are the sole i18n channel for the
	 * Interactivity API bundle — it can't import @wordpress/i18n. Both
	 * Plural forms must be seeded so the client can pick based on the
	 * Live totalResults, and the format string must carry a `%d` token.
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
	 * The correct ordering. Values must stay aligned with the UI keys in
	 * Src/instant-search/lib/constants.js SORT_OPTIONS.
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
	 * Sort, not propagate into the Elasticsearch query.
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
	 * A deep link to a sort the API can't honour can't reach the
	 * Elasticsearch query (RSM-1082).
	 */
	public function test_build_initial_state_rejects_product_sort_when_woocommerce_inactive() {
		$original_get = $_GET;
		$_GET         = array( 'orderby' => 'price_asc' );
		try {
			$state = Search_Blocks::build_initial_state();
			$this->assertSame( 'relevance', $state['sortOrder'] );
			$this->assertFalse( $state['isWooCommerceBlocksEnabled'] );
		} finally {
			$_GET = $original_get;
		}
	}

	/**
	 * On Woo sites the same product-format `?orderby` values must seed the
	 * Matching sort and surface `isWooCommerceBlocksEnabled=true` on the IA store
	 * So the JS-side url-state gate accepts them too (RSM-1082).
	 */
	public function test_build_initial_state_accepts_product_sort_when_woocommerce_active() {
		$original_get = $_GET;
		Search_Blocks::set_woocommerce_blocks_enabled_for_testing( true );
		try {
			foreach ( array( 'rating_desc', 'price_asc', 'price_desc' ) as $key ) {
				$_GET  = array( 'orderby' => $key );
				$state = Search_Blocks::build_initial_state();
				$this->assertSame( $key, $state['sortOrder'], "Expected $key to seed sortOrder when WC is active." );
				$this->assertTrue( $state['isWooCommerceBlocksEnabled'] );
			}
		} finally {
			$_GET = $original_get;
			Search_Blocks::set_woocommerce_blocks_enabled_for_testing( null );
		}
	}

	/**
	 * `jetpack_search_woocommerce_blocks_enabled` lets a site force the
	 * Gate true on a non-Woo install — useful for staging previews of
	 * WC-only Search blocks. The filter result must be cached, so a
	 * Subsequent call returns the override even after the filter is
	 * Removed.
	 */
	public function test_woocommerce_blocks_enabled_filter_can_force_true() {
		Search_Blocks::reset_woocommerce_blocks_enabled_cache();
		add_filter( 'jetpack_search_woocommerce_blocks_enabled', '__return_true' );
		try {
			$this->assertTrue( Search_Blocks::woocommerce_blocks_enabled() );
		} finally {
			remove_filter( 'jetpack_search_woocommerce_blocks_enabled', '__return_true' );
		}
	}

	/**
	 * Symmetry: the filter must also be able to force the gate false. We
	 * Can't construct a "WC is loaded" PHPUnit env without polluting the
	 * Global namespace with a `WooCommerce` stub class, so instead the
	 * Test pins the *contract*: the filter receives the probed bool and
	 * Its return value is what the function returns. The cast-to-bool
	 * Test below covers the related "filter result wins over probe" path
	 * For non-bool returns.
	 */
	public function test_woocommerce_blocks_enabled_filter_receives_probe_and_return_wins() {
		Search_Blocks::reset_woocommerce_blocks_enabled_cache();
		$received_value = null;
		$callback       = function ( $value ) use ( &$received_value ) {
			$received_value = $value;
			return false;
		};
		add_filter( 'jetpack_search_woocommerce_blocks_enabled', $callback );
		try {
			$this->assertFalse( Search_Blocks::woocommerce_blocks_enabled() );
			$this->assertIsBool( $received_value, 'Filter received a bool from the probe.' );
		} finally {
			remove_filter( 'jetpack_search_woocommerce_blocks_enabled', $callback );
		}
	}

	/**
	 * Pins the docblock promise: the filter fires once per request and
	 * The result is cached, so a callback that probes the database or
	 * Reads an option pays its cost once even on a hot path.
	 */
	public function test_woocommerce_blocks_enabled_filter_only_fires_once_per_request() {
		Search_Blocks::reset_woocommerce_blocks_enabled_cache();
		$call_count = 0;
		$callback   = function ( $value ) use ( &$call_count ) {
			++$call_count;
			return $value;
		};
		add_filter( 'jetpack_search_woocommerce_blocks_enabled', $callback );
		try {
			for ( $i = 0; $i < 3; $i++ ) {
				Search_Blocks::woocommerce_blocks_enabled();
			}
			$this->assertSame( 1, $call_count, 'Filter ran once; subsequent calls served from cache.' );
		} finally {
			remove_filter( 'jetpack_search_woocommerce_blocks_enabled', $callback );
		}
	}

	/**
	 * A filter callback returning a truthy non-bool (`'1'`, `1`, etc.)
	 * Must not poison the strictly-typed `bool` cache. The function casts
	 * Before storing so callers using `===` against `true` still match.
	 */
	public function test_woocommerce_blocks_enabled_filter_casts_truthy_non_bool_to_true() {
		Search_Blocks::reset_woocommerce_blocks_enabled_cache();
		$callback = static function () {
			return '1';
		};
		add_filter( 'jetpack_search_woocommerce_blocks_enabled', $callback );
		try {
			$this->assertTrue( Search_Blocks::woocommerce_blocks_enabled() );
		} finally {
			remove_filter( 'jetpack_search_woocommerce_blocks_enabled', $callback );
		}
	}

	/**
	 * The WC gate also requires a WooCommerce new enough to register the
	 * `product-search-results` template. `woocommerce_version_supported()`
	 * is the comparison; pin it against explicit versions so the floor is
	 * Exercised without a live WooCommerce in the test process.
	 *
	 * @dataProvider provider_woocommerce_version_supported
	 *
	 * @param string|null $version  Version to test, or null for the default path.
	 * @param bool        $expected Expected support result.
	 */
	#[DataProvider( 'provider_woocommerce_version_supported' )]
	public function test_woocommerce_version_supported( $version, bool $expected ) {
		$this->assertSame( $expected, Search_Blocks::woocommerce_version_supported( $version ) );
	}

	/**
	 * Cases for `test_woocommerce_version_supported`.
	 *
	 * @return array<string, array{0: string|null, 1: bool}>
	 */
	public static function provider_woocommerce_version_supported(): array {
		return array(
			'below floor'       => array( '6.4.0', false ),
			'at floor'          => array( '6.5.0', true ),
			'above floor'       => array( '8.0.0', true ),
			'patch below floor' => array( '6.4.99', false ),
			'empty/unknown'     => array( '', false ),
			// No WC_VERSION constant in the test process, so the default path reads unsupported.
			'default no WC'     => array( null, false ),
		);
	}

	/**
	 * Seeded `activeFilters` is the raw URL params — gating moved to
	 * Store/index.js's `initialize()` callback, which can apply it once
	 * Every filter block's render.php has contributed its filterConfig (and
	 * The registry is complete). `build_seed_state()` must therefore pass
	 * URL params through unchanged regardless of whether the matching filter
	 * Block was found in post content.
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
	 * Store shows the spinner until the first fetch resolves. JS-side gating
	 * May later flip it back to false if every key gets dropped, but the
	 * Seed should default to true whenever activeFilters is non-empty.
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
	 * Subclass forcing `block_templates_active()` so the block-theme path
	 * Runs without a real block theme in the dbless env.
	 *
	 * @return class-string<Search_Blocks>
	 */
	private function block_theme_search_blocks(): string {
		return get_class(
			new class() extends Search_Blocks {
				protected static function block_templates_active(): bool {
					return true;
				}
			}
		);
	}

	/**
	 * On a block-theme search request the slug is moved to the front of the
	 * Hierarchy, and a pre-existing copy is de-duplicated rather than doubled.
	 */
	public function test_prepend_search_template_prepends_unique_slug() {
		$original_query = $GLOBALS['wp_query'] ?? null;
		try {
			$GLOBALS['wp_query'] = new \WP_Query( array( 's' => 'boots' ) );
			$class               = $this->block_theme_search_blocks();

			$this->assertSame(
				array( 'jetpack-search', 'search', 'index' ),
				$class::prepend_search_template( array( 'search', 'index' ) )
			);
			$deduped = $class::prepend_search_template( array( 'jetpack-search', 'search', 'index' ) );
			$this->assertSame( array( 'jetpack-search', 'search', 'index' ), $deduped );
			$this->assertCount( 1, array_keys( $deduped, 'jetpack-search', true ) );
		} finally {
			$GLOBALS['wp_query'] = $original_query;
		}
	}

	/**
	 * The hierarchy is returned untouched unless the request is a search on a
	 * Block theme — the slug only resolves through the block-template system.
	 */
	public function test_prepend_search_template_skips_outside_block_theme_search() {
		$original_query = $GLOBALS['wp_query'] ?? null;
		try {
			$input = array( 'search', 'index' );

			$GLOBALS['wp_query'] = new \WP_Query();
			$this->assertFalse( is_search() );
			$this->assertSame( $input, Search_Blocks::prepend_search_template( $input ) );

			$GLOBALS['wp_query'] = new \WP_Query( array( 's' => 'boots' ) );
			$this->assertTrue( is_search() );
			$this->assertFalse( wp_is_block_theme(), 'dbless default theme is expected to be classic' );
			$this->assertSame( $input, Search_Blocks::prepend_search_template( $input ) );
		} finally {
			$GLOBALS['wp_query'] = $original_query;
		}
	}

	/**
	 * WC-off arm: with WooCommerce inactive it is never a product search.
	 */
	public function test_is_woocommerce_product_search_false_when_woocommerce_inactive() {
		Search_Blocks::set_woocommerce_blocks_enabled_for_testing( false );
		try {
			$this->assertFalse( $this->invoke_protected( 'is_woocommerce_product_search' ) );
		} finally {
			Search_Blocks::set_woocommerce_blocks_enabled_for_testing( null );
		}
	}

	/**
	 * WC-on arm: a plain (non-product) request is still not a product search.
	 */
	public function test_is_woocommerce_product_search_false_on_plain_request_when_woocommerce_active() {
		$original_query = $GLOBALS['wp_query'] ?? null;
		Search_Blocks::set_woocommerce_blocks_enabled_for_testing( true );
		try {
			$GLOBALS['wp_query'] = new \WP_Query();
			$this->assertFalse( $this->invoke_protected( 'is_woocommerce_product_search' ) );
		} finally {
			$GLOBALS['wp_query'] = $original_query;
			Search_Blocks::set_woocommerce_blocks_enabled_for_testing( null );
		}
	}

	/**
	 * With the override option OFF, a WooCommerce product search must leave
	 * The hierarchy untouched so WooCommerce's own priority-10 prepend of
	 * `product-search-results` wins — that's the no-regression default for
	 * Stores that haven't opted in.
	 */
	public function test_prepend_search_template_defers_to_woocommerce_when_override_off() {
		delete_option( 'jetpack_search_override_woocommerce_search_template' );
		// Force the block-theme search context so we exercise the WooCommerce
		// carve-out rather than the upstream `is_search()`/block-theme guard.
		$anon           = get_class(
			new class() extends Search_Blocks {
				protected static function block_templates_active(): bool {
					return true;
				}
				protected static function is_woocommerce_product_search(): bool {
					return true;
				}
			}
		);
		$original_query = $GLOBALS['wp_query'] ?? null;
		try {
			$GLOBALS['wp_query'] = new \WP_Query( array( 's' => 'boots' ) );

			$input  = array( 'product-search-results', 'search', 'index' );
			$result = $anon::prepend_search_template( $input );

			$this->assertSame( $input, $result, 'Hierarchy must be returned unchanged so WooCommerce wins.' );
		} finally {
			$GLOBALS['wp_query'] = $original_query;
		}
	}

	/**
	 * With the override option ON, a WooCommerce product search falls
	 * Through the prepend carve-out (the priority-20 router then swaps
	 * WooCommerce's slug for `jetpack-search-product-results`).
	 */
	public function test_prepend_search_template_fronts_jetpack_when_override_on() {
		update_option( 'jetpack_search_override_woocommerce_search_template', true );
		$anon           = get_class(
			new class() extends Search_Blocks {
				protected static function block_templates_active(): bool {
					return true;
				}
				protected static function is_woocommerce_product_search(): bool {
					return true;
				}
			}
		);
		$original_query = $GLOBALS['wp_query'] ?? null;
		try {
			$GLOBALS['wp_query'] = new \WP_Query( array( 's' => 'boots' ) );

			$result = $anon::prepend_search_template( array( 'product-search-results', 'search', 'index' ) );

			$this->assertSame( 'jetpack-search', $result[0] );
		} finally {
			$GLOBALS['wp_query'] = $original_query;
			delete_option( 'jetpack_search_override_woocommerce_search_template' );
		}
	}

	/**
	 * On a WooCommerce product search, WooCommerce's slug is dropped and
	 * `jetpack-search-product-results` is fronted ahead of any `jetpack-search`.
	 */
	public function test_route_woocommerce_product_search_template_fronts_product_slug() {
		$anon = new class() extends Search_Blocks {
			protected static function is_woocommerce_product_search(): bool {
				return true;
			}
		};

		$result = $anon::route_woocommerce_product_search_template(
			array( 'jetpack-search', 'product-search-results', 'search', 'index' )
		);

		$this->assertSame( array( 'jetpack-search-product-results', 'jetpack-search', 'search', 'index' ), $result );
		$this->assertNotContains( Search_Blocks::WC_PRODUCT_SEARCH_TEMPLATE_SLUG, $result );
	}

	/**
	 * Outside a WooCommerce product search the router is a strict no-op.
	 */
	public function test_route_woocommerce_product_search_template_noop_off_product_search() {
		$anon = new class() extends Search_Blocks {
			protected static function is_woocommerce_product_search(): bool {
				return false;
			}
		};

		$input  = array( 'product-search-results', 'search', 'index' );
		$result = $anon::route_woocommerce_product_search_template( $input );

		$this->assertSame( $input, $result );
	}

	/**
	 * On a classic-theme search request the router swaps the resolved
	 * Theme PHP template for the bundled `classic-theme-search.php` shim.
	 */
	public function test_route_classic_theme_search_template_returns_bundled_path_on_search() {
		$original_query = $GLOBALS['wp_query'] ?? null;
		try {
			$GLOBALS['wp_query'] = new \WP_Query( array( 's' => 'boots' ) );

			$result = Search_Blocks::route_classic_theme_search_template( '/var/www/html/wp-content/themes/twentytwentyone/search.php' );

			$this->assertStringEndsWith(
				'/src/search-blocks/templates/classic-theme-search.php',
				$result,
				'Search requests must resolve to the bundled classic-theme shim.'
			);
			$this->assertFileExists( $result, 'Bundled classic-theme shim must exist at the routed path.' );
		} finally {
			$GLOBALS['wp_query'] = $original_query;
		}
	}

	/**
	 * Off the search page the router is a strict no-op so non-search
	 * Requests keep the theme's own template (single, archive, page, …).
	 */
	public function test_route_classic_theme_search_template_noop_off_search() {
		$original_query = $GLOBALS['wp_query'] ?? null;
		try {
			$GLOBALS['wp_query'] = new \WP_Query();
			$this->assertFalse( is_search() );

			$input  = '/var/www/html/wp-content/themes/twentytwentyone/index.php';
			$result = Search_Blocks::route_classic_theme_search_template( $input );

			$this->assertSame( $input, $result );
		} finally {
			$GLOBALS['wp_query'] = $original_query;
		}
	}

	/**
	 * WC-on, override-off: a WooCommerce product search on a classic theme
	 * Falls through the classic router so WooCommerce's own archive routing
	 * Keeps owning product search results (we don't ship a product-search
	 * Classic-theme shim).
	 */
	public function test_route_classic_theme_search_template_defers_to_woocommerce_when_override_off() {
		delete_option( 'jetpack_search_override_woocommerce_search_template' );
		$anon           = get_class(
			new class() extends Search_Blocks {
				protected static function is_woocommerce_product_search(): bool {
					return true;
				}
			}
		);
		$original_query = $GLOBALS['wp_query'] ?? null;
		try {
			$GLOBALS['wp_query'] = new \WP_Query( array( 's' => 'boots' ) );

			$input  = '/var/www/html/wp-content/themes/twentytwentyone/search.php';
			$result = $anon::route_classic_theme_search_template( $input );

			$this->assertSame( $input, $result, 'Classic router must defer to WooCommerce when override is off on a product search.' );
		} finally {
			$GLOBALS['wp_query'] = $original_query;
		}
	}

	/**
	 * WC-on, override-on: with the override flipped on, a product search on
	 * A classic theme routes through the same generic shim a non-product
	 * Search would use. There's no dedicated product-results classic-theme
	 * Template — block themes get one via `register_block_template()`,
	 * Classic themes share the single shim and rely on the generic blocks
	 * For the product layout. Pins that documented behavior so an accidental
	 * WC carve-out for the classic path doesn't slip through.
	 */
	public function test_route_classic_theme_search_template_routes_to_shim_when_override_on() {
		update_option( 'jetpack_search_override_woocommerce_search_template', true );
		$anon           = get_class(
			new class() extends Search_Blocks {
				protected static function is_woocommerce_product_search(): bool {
					return true;
				}
			}
		);
		$original_query = $GLOBALS['wp_query'] ?? null;
		try {
			$GLOBALS['wp_query'] = new \WP_Query( array( 's' => 'boots' ) );

			$result = $anon::route_classic_theme_search_template( '/var/www/html/wp-content/themes/twentytwentyone/search.php' );

			$this->assertStringEndsWith(
				'/src/search-blocks/templates/classic-theme-search.php',
				$result,
				'Classic router must route to the bundled shim on product searches when the override is on.'
			);
		} finally {
			$GLOBALS['wp_query'] = $original_query;
			delete_option( 'jetpack_search_override_woocommerce_search_template' );
		}
	}

	/**
	 * Defensive bail-out: if the bundled `jetpack-search.html` ever fails to
	 * Load (returns empty markup), the router must return the input template
	 * Unchanged so the theme's own `search.php` renders instead of the shim
	 * Wrapping a blank body. Mirrors the block-theme path's empty-content
	 * Bail-out in `register_search_template()`.
	 */
	public function test_route_classic_theme_search_template_bails_when_body_is_empty() {
		$original_query = $GLOBALS['wp_query'] ?? null;
		$anon           = get_class(
			new class() extends Search_Blocks {
				public static function get_classic_theme_search_body(): string {
					return '';
				}
			}
		);
		try {
			$GLOBALS['wp_query'] = new \WP_Query( array( 's' => 'boots' ) );

			$input  = '/var/www/html/wp-content/themes/twentytwentyone/search.php';
			$result = $anon::route_classic_theme_search_template( $input );

			$this->assertSame( $input, $result, 'Empty body must bail back to the theme template.' );
		} finally {
			$GLOBALS['wp_query'] = $original_query;
		}
	}

	/**
	 * Regression guard: the template-part stripper must keep working when
	 * The attribute payload nests an object (e.g. a future revision that
	 * Sets `wp:template-part {"theme":{"name":"foo"}} /-->`). The earlier
	 * `[^}]*` shape would have left a stray `}}/-->` tail in the output —
	 * Anchor the test on a `}}` inside the attribute so a tightening back
	 * Up to a character-class fails visibly.
	 */
	public function test_get_classic_theme_search_body_strips_nested_attribute_template_parts() {
		$anon = get_class(
			new class() extends Search_Blocks {
				protected static function get_search_template_content(): string {
					return "<!-- wp:template-part {\"slug\":\"header\",\"theme\":{\"name\":\"twentytwentyfive\"}} /-->\n"
						. "<!-- wp:jetpack-search/search-input /-->\n"
						. '<!-- wp:template-part {"slug":"footer"} /-->';
				}
			}
		);

		$body = $anon::get_classic_theme_search_body();

		$this->assertStringNotContainsString( 'wp:template-part', $body, 'Both wrappers must be stripped, even with nested JSON.' );
		$this->assertStringNotContainsString( '}}', $body, 'No stray closing braces should leak from a partial strip.' );
		$this->assertStringNotContainsString( '"name":"twentytwentyfive"', $body, 'Nested attribute tail must not leak after a partial strip.' );
		$this->assertStringContainsString( 'wp:jetpack-search/search-input', $body, 'Inner blocks must be preserved.' );
	}

	/**
	 * `get_classic_theme_search_body()` returns the same block markup that
	 * `register_search_template()` registers on block themes, with the two
	 * Top-level `core/template-part` self-closing comments stripped so the
	 * Theme's `get_header()` / `get_footer()` drive the chrome instead.
	 */
	public function test_get_classic_theme_search_body_strips_template_parts() {
		$body = Search_Blocks::get_classic_theme_search_body();

		$this->assertNotEmpty( $body, 'Body must be non-empty when the bundled template file exists.' );
		$this->assertStringNotContainsString(
			'wp:template-part',
			$body,
			'Body must not reference template-parts — those resolve only on block themes.'
		);
		$this->assertStringContainsString(
			'wp:jetpack-search/search-input',
			$body,
			'Body must keep the core Search blocks so the page is usable.'
		);
		$this->assertStringContainsString(
			'wp:jetpack-search/results-list',
			$body,
			'Body must keep the results-list block.'
		);
	}

	/**
	 * With the override on, `init()` registers both the product-search
	 * Template and the priority-20 routing filter.
	 */
	public function test_init_registers_product_search_hooks_when_override_on() {
		$this->reset_search_blocks_hooks();
		$this->set_module_active( true );
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
		update_option( 'jetpack_search_override_woocommerce_search_template', true );

		try {
			Search_Blocks::init();

			$this->assertNotFalse(
				has_action( 'init', array( Search_Blocks::class, 'register_product_search_template' ) ),
				'register_product_search_template must hook into init when the override is on'
			);
			$this->assertSame(
				20,
				has_filter(
					'search_template_hierarchy',
					array( Search_Blocks::class, 'route_woocommerce_product_search_template' )
				),
				'route_woocommerce_product_search_template must hook at priority 20 when the override is on'
			);
		} finally {
			delete_option( 'jetpack_search_override_woocommerce_search_template' );
		}
	}

	/**
	 * The product-search hooks are absent when the override is off.
	 */
	public function test_init_does_not_register_product_search_hooks_when_override_off() {
		$this->reset_search_blocks_hooks();
		$this->set_module_active( true );
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
		delete_option( 'jetpack_search_override_woocommerce_search_template' );

		Search_Blocks::init();

		$this->assertFalse(
			has_action( 'init', array( Search_Blocks::class, 'register_product_search_template' ) ),
			'register_product_search_template must not hook when the override is off'
		);
		$this->assertFalse(
			has_filter(
				'search_template_hierarchy',
				array( Search_Blocks::class, 'route_woocommerce_product_search_template' )
			),
			'route_woocommerce_product_search_template must not hook when the override is off'
		);
	}

	/**
	 * The override only applies to the server-rendered experiences, mirroring
	 * The dashboard's Embedded|Inline visibility gate. With the option on it
	 * Registers under Inline (server-rendered theme search); with the option
	 * Still on after the site switches to Overlay (client-side) or Off it must
	 * NOT register — a stale option from a since-switched experience can't keep
	 * Rerouting the hierarchy.
	 */
	public function test_init_gates_product_search_hooks_on_server_rendered_experience() {
		try {
			update_option( 'jetpack_search_override_woocommerce_search_template', true );

			// Inline (allowed): module active, no experience opt-in saved, so
			// get_experience() resolves to 'inline' — the override applies.
			$this->reset_search_blocks_hooks();
			$this->set_module_active( true );
			delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
			Search_Blocks::init();

			$this->assertNotFalse(
				has_action( 'init', array( Search_Blocks::class, 'register_product_search_template' ) ),
				'register_product_search_template must hook when experience is Inline'
			);
			$this->assertSame(
				20,
				has_filter(
					'search_template_hierarchy',
					array( Search_Blocks::class, 'route_woocommerce_product_search_template' )
				),
				'route_woocommerce_product_search_template must hook at priority 20 when experience is Inline'
			);

			// Overlay: module active, experience explicitly saved as overlay.
			$this->reset_search_blocks_hooks();
			$this->set_module_active( true );
			update_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, Module_Control::EXPERIENCE_OVERLAY );
			Search_Blocks::init();

			$this->assertFalse(
				has_action( 'init', array( Search_Blocks::class, 'register_product_search_template' ) ),
				'register_product_search_template must not hook when experience is Overlay'
			);
			$this->assertFalse(
				has_filter(
					'search_template_hierarchy',
					array( Search_Blocks::class, 'route_woocommerce_product_search_template' )
				),
				'route_woocommerce_product_search_template must not hook when experience is Overlay'
			);

			// Off: module inactive, get_experience() resolves to 'off'.
			$this->reset_search_blocks_hooks();
			delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
			$this->set_module_active( false );
			Search_Blocks::init();

			$this->assertFalse(
				has_action( 'init', array( Search_Blocks::class, 'register_product_search_template' ) ),
				'register_product_search_template must not hook when the module is off'
			);
			$this->assertFalse(
				has_filter(
					'search_template_hierarchy',
					array( Search_Blocks::class, 'route_woocommerce_product_search_template' )
				),
				'route_woocommerce_product_search_template must not hook when the module is off'
			);
		} finally {
			delete_option( 'jetpack_search_override_woocommerce_search_template' );
			delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
		}
	}

	/**
	 * `init()` must always register the block-level hooks AND the IA state
	 * Seeding regardless of which experience the site has saved — admins can
	 * Insert Search blocks anywhere blocks are configurable, and those blocks
	 * Need the seeded base state to hydrate.
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
	 * Read the private `registered` map off the WP_Script_Modules singleton.
	 *
	 * @return array<string,array> Registered script modules keyed by id.
	 */
	private function registered_script_modules(): array {
		$modules  = wp_script_modules();
		$property = new \ReflectionProperty( $modules, 'registered' );
		// PHP 7.2–8.0 require setAccessible(true) to read a private prop via
		// Reflection; 8.1 made it a no-op and 8.5 deprecates the call. Gate
		// on the version so the package's PHP 7.2–8.5 matrix stays green.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		return $property->getValue( $modules );
	}

	/**
	 * Drop a script module from the WP_Script_Modules singleton. The class
	 * Exposes no public unregister, and the registry persists for the whole
	 * PHPUnit process, so reach into the private map to keep tests isolated.
	 *
	 * @param string $id Script module id.
	 */
	private function unregister_script_module( string $id ): void {
		$modules  = wp_script_modules();
		$property = new \ReflectionProperty( $modules, 'registered' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$registered = $property->getValue( $modules );
		unset( $registered[ $id ] );
		$property->setValue( $modules, $registered );
	}

	/**
	 * Place a fixture `store/index.asset.php` at the path
	 * `register_store_script_module()` reads, without clobbering a real
	 * Build. Returns a cleanup callback that restores the prior state
	 * (original contents, or removal of anything this created).
	 *
	 * @param array $asset Asset array to write.
	 * @return callable Cleanup callback.
	 */
	private function stub_store_asset_file( array $asset ): callable {
		$dir  = Package::get_installed_path() . 'build/search-blocks/store';
		$file = $dir . '/index.asset.php';

		$created_dirs = array();
		foreach ( array( Package::get_installed_path() . 'build', Package::get_installed_path() . 'build/search-blocks', $dir ) as $d ) {
			if ( ! is_dir( $d ) ) {
				mkdir( $d );
				$created_dirs[] = $d;
			}
		}

		$had_file = file_exists( $file );
		$original = $had_file ? file_get_contents( $file ) : null;
		$export   = var_export( $asset, true );
		file_put_contents( $file, "<?php return $export;\n" );

		return static function () use ( $file, $had_file, $original, $created_dirs ) {
			if ( $had_file ) {
				file_put_contents( $file, $original );
			} elseif ( file_exists( $file ) ) {
				unlink( $file );
			}
			foreach ( array_reverse( $created_dirs ) as $d ) {
				// Only directories this fixture created, and only while
				// empty — scandir() returns just '.' and '..' for an empty
				// dir, so guard on that instead of silencing rmdir().
				if ( is_dir( $d ) && 2 === count( scandir( $d ) ) ) {
					rmdir( $d );
				}
			}
		};
	}

	/**
	 * The shared store must register as the `jetpack-search/store` Script
	 * Module, sourced from the built `store/index.js` with the deps/version
	 * Declared in its generated asset file — that's what lets WordPress
	 * Resolve the dependency each block's view module declares instead of
	 * Shipping the store inlined per block.
	 */
	public function test_register_store_script_module_registers_shared_module() {
		$cleanup = $this->stub_store_asset_file(
			array(
				'dependencies' => array( '@wordpress/interactivity' ),
				'version'      => 'test-store-version',
			)
		);

		try {
			Search_Blocks::register_store_script_module();

			$registered = $this->registered_script_modules();
			$this->assertArrayHasKey( 'jetpack-search/store', $registered, 'Shared store must be registered as a script module.' );

			$module = $registered['jetpack-search/store'];
			$this->assertStringContainsString( 'build/search-blocks/store/index.js', $module['src'] );
			$this->assertSame( 'test-store-version', $module['version'] );
			$this->assertContains(
				'@wordpress/interactivity',
				array_column( $module['dependencies'], 'id' ),
				'Store module must carry the dependencies from its asset file.'
			);
		} finally {
			$this->unregister_script_module( 'jetpack-search/store' );
			$cleanup();
		}
	}

	/**
	 * No build present (the common case in a fresh checkout / CI unit job):
	 * The method must bail without registering anything or erroring, so
	 * Block registration is unaffected.
	 */
	public function test_register_store_script_module_noop_without_asset_file() {
		$base = Package::get_installed_path() . 'build/search-blocks/store/index.asset.php';
		if ( file_exists( $base ) ) {
			$this->markTestSkipped( 'A real build asset file is present; the missing-file path cannot be exercised here.' );
		}

		// A prior test may have registered it in the process-wide singleton.
		$this->unregister_script_module( 'jetpack-search/store' );

		Search_Blocks::register_store_script_module();

		$this->assertArrayNotHasKey(
			'jetpack-search/store',
			$this->registered_script_modules(),
			'Without an asset file the store module must not be registered.'
		);
	}

	/**
	 * Off the Embedded experience, the template-override hooks
	 * (`register_search_template` / `prepend_search_template`) must NOT be
	 * Registered — `/?s=…` should resolve to the theme's `search.html`, not
	 * The Jetpack Search template.
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
	 * On the Embedded experience under a block theme, the FSE template-override
	 * Hooks must be registered so `/?s=…` resolves to the Jetpack Search
	 * Template instead of the theme's `search.html`. The classic-theme
	 * `template_include` route must NOT register on this path.
	 */
	public function test_init_registers_block_theme_template_hooks_when_embedded_on_block_theme() {
		$this->reset_search_blocks_hooks();
		$this->set_module_active( true );
		Search_Blocks::set_block_templates_active_for_testing( true );
		update_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, Module_Control::EXPERIENCE_EMBEDDED );

		Search_Blocks::init();

		$this->assertNotFalse(
			has_action( 'init', array( Search_Blocks::class, 'register_search_template' ) ),
			'register_search_template must hook into init on embedded + block theme'
		);
		$this->assertNotFalse(
			has_filter( 'search_template_hierarchy', array( Search_Blocks::class, 'prepend_search_template' ) ),
			'prepend_search_template must hook into search_template_hierarchy on embedded + block theme'
		);
		$this->assertFalse(
			has_filter( 'template_include', array( Search_Blocks::class, 'route_classic_theme_search_template' ) ),
			'classic-theme template_include route must not hook on a block theme'
		);

		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
	}

	/**
	 * On the Embedded experience under a classic theme, prepending a slug to
	 * `search_template_hierarchy` is a no-op (no `jetpack-search.php` in the
	 * Theme), so the classic-theme `template_include` route is what takes over
	 * The search page. The block-theme hooks must NOT register on this path.
	 */
	public function test_init_registers_classic_theme_template_include_when_embedded_on_classic_theme() {
		$this->reset_search_blocks_hooks();
		$this->set_module_active( true );
		Search_Blocks::set_block_templates_active_for_testing( false );
		update_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, Module_Control::EXPERIENCE_EMBEDDED );

		Search_Blocks::init();

		$this->assertNotFalse(
			has_filter( 'template_include', array( Search_Blocks::class, 'route_classic_theme_search_template' ) ),
			'classic-theme template_include route must hook on embedded + classic theme'
		);
		$this->assertFalse(
			has_action( 'init', array( Search_Blocks::class, 'register_search_template' ) ),
			'register_search_template must not hook on a classic theme — the registry is FSE-only'
		);
		$this->assertFalse(
			has_filter( 'search_template_hierarchy', array( Search_Blocks::class, 'prepend_search_template' ) ),
			'prepend_search_template must not hook on a classic theme — the hierarchy filter is FSE-only'
		);

		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
	}

	/**
	 * If the module isn't active, the experience is `'off'` regardless of any
	 * Stale value in the experience option, so the template-override hooks
	 * Must not register. Guards against a leftover `'embedded'` value on a
	 * Site that's been deactivated. The block-level and seed hooks still
	 * Register so any post-content Search block continues to hydrate.
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
	 * On the Embedded experience the main search query is rendered client-side,
	 * So `init()` must register the `posts_pre_query` short-circuit.
	 */
	public function test_init_registers_posts_pre_query_when_embedded() {
		$this->reset_search_blocks_hooks();
		$this->set_module_active( true );
		update_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, Module_Control::EXPERIENCE_EMBEDDED );

		Search_Blocks::init();

		$this->assertSame(
			10,
			has_filter( 'posts_pre_query', array( Search_Blocks::class, 'filter__posts_pre_query' ) ),
			'posts_pre_query short-circuit must hook at priority 10 on embedded'
		);

		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
	}

	/**
	 * The experimental blocks Overlay also renders results client-side, so the
	 * Short-circuit registers when the overlay is enabled (operator filter on +
	 * Saved `overlay_blocks` experience).
	 */
	public function test_init_registers_posts_pre_query_when_overlay_blocks_enabled() {
		$this->reset_search_blocks_hooks();
		$this->set_module_active( true );
		add_filter( 'jetpack_search_overlay_block_template_enabled', '__return_true' );
		update_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, Module_Control::EXPERIENCE_OVERLAY_BLOCKS );

		Search_Blocks::init();

		$this->assertSame(
			10,
			has_filter( 'posts_pre_query', array( Search_Blocks::class, 'filter__posts_pre_query' ) ),
			'posts_pre_query short-circuit must hook at priority 10 when the blocks Overlay is enabled'
		);

		remove_filter( 'jetpack_search_overlay_block_template_enabled', '__return_true' );
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
	}

	/**
	 * A stale `overlay_blocks` option with the operator filter OFF must not
	 * Bypass the query — otherwise the page would render no server results and
	 * No overlay would cover them.
	 */
	public function test_init_does_not_register_posts_pre_query_when_overlay_blocks_filter_off() {
		$this->reset_search_blocks_hooks();
		$this->set_module_active( true );
		update_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, Module_Control::EXPERIENCE_OVERLAY_BLOCKS );
		// Defaults true since the Beta release; pin it back to false so this
		// test exercises the operator-opt-out path that it is named after.
		add_filter( 'jetpack_search_overlay_block_template_enabled', '__return_false' );

		Search_Blocks::init();

		$this->assertFalse(
			has_filter( 'posts_pre_query', array( Search_Blocks::class, 'filter__posts_pre_query' ) ),
			'posts_pre_query short-circuit must not hook when the overlay operator filter is off'
		);

		remove_filter( 'jetpack_search_overlay_block_template_enabled', '__return_false' );
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
	}

	/**
	 * Theme search (inline), legacy Overlay, and Off all leave the server-side
	 * Search query intact, so the short-circuit must not register.
	 */
	public function test_init_does_not_register_posts_pre_query_for_server_rendered_experiences() {
		// Inline: module active, no opt-in saved.
		$this->reset_search_blocks_hooks();
		$this->set_module_active( true );
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
		Search_Blocks::init();
		$this->assertFalse(
			has_filter( 'posts_pre_query', array( Search_Blocks::class, 'filter__posts_pre_query' ) ),
			'posts_pre_query short-circuit must not hook on Theme search (inline)'
		);

		// Legacy Overlay: Instant Search owns the short-circuit via its own hook.
		$this->reset_search_blocks_hooks();
		$this->set_module_active( true );
		update_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, Module_Control::EXPERIENCE_OVERLAY );
		Search_Blocks::init();
		$this->assertFalse(
			has_filter( 'posts_pre_query', array( Search_Blocks::class, 'filter__posts_pre_query' ) ),
			'posts_pre_query short-circuit must not hook on the legacy Overlay'
		);

		// Off: module inactive.
		$this->reset_search_blocks_hooks();
		$this->set_module_active( false );
		update_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, Module_Control::EXPERIENCE_EMBEDDED );
		Search_Blocks::init();
		$this->assertFalse(
			has_filter( 'posts_pre_query', array( Search_Blocks::class, 'filter__posts_pre_query' ) ),
			'posts_pre_query short-circuit must not hook when the module is off'
		);

		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
	}

	/**
	 * The callback bypasses the database on the main front-end search query:
	 * Returns an empty array and sets the dummy pagination totals WP core skips
	 * In the `posts_pre_query` path.
	 */
	public function test_filter_posts_pre_query_short_circuits_main_search_query() {
		$query                   = new \WP_Query();
		$query->is_search        = true;
		$GLOBALS['wp_the_query'] = $query;

		$result = Search_Blocks::filter__posts_pre_query( null, $query );

		$this->assertSame( array(), $result, 'Main search query must be short-circuited to an empty array' );
		$this->assertSame( 1, $query->found_posts );
		$this->assertSame( 1, $query->max_num_pages );
	}

	/**
	 * Secondary / non-search queries fall through untouched so widgets, related
	 * Posts, etc. keep working on a search page.
	 */
	public function test_filter_posts_pre_query_passes_through_non_search_query() {
		$main                    = new \WP_Query();
		$main->is_search         = true;
		$GLOBALS['wp_the_query'] = $main;

		// A secondary query (not the main query) must be left alone.
		$secondary            = new \WP_Query();
		$secondary->is_search = true;
		$sentinel             = array( 'untouched' );
		$this->assertSame(
			$sentinel,
			Search_Blocks::filter__posts_pre_query( $sentinel, $secondary ),
			'A secondary query must not be short-circuited'
		);

		// The main query on a non-search route must be left alone too.
		$main->is_search = false;
		$this->assertSame(
			$sentinel,
			Search_Blocks::filter__posts_pre_query( $sentinel, $main ),
			'A non-search main query must not be short-circuited'
		);
	}

	/**
	 * Remove every hook this class registers, so each `init()` test starts
	 * From a known-empty state.
	 */
	private function reset_search_blocks_hooks(): void {
		remove_action( 'init', array( Search_Blocks::class, 'register_blocks' ) );
		remove_action( 'init', array( Search_Blocks::class, 'register_search_template' ) );
		remove_action( 'init', array( Search_Blocks::class, 'register_product_search_template' ) );
		remove_filter( 'block_categories_all', array( Search_Blocks::class, 'register_block_category' ) );
		remove_filter( 'search_template_hierarchy', array( Search_Blocks::class, 'prepend_search_template' ) );
		remove_filter( 'search_template_hierarchy', array( Search_Blocks::class, 'route_woocommerce_product_search_template' ), 20 );
		remove_filter( 'template_include', array( Search_Blocks::class, 'route_classic_theme_search_template' ) );
		remove_action( 'template_redirect', array( Search_Blocks::class, 'seed_interactivity_state' ) );
		remove_action( 'wp_enqueue_scripts', array( Search_Blocks::class, 'seed_interactivity_state' ) );
		remove_action( 'enqueue_block_editor_assets', array( Search_Blocks::class, 'enqueue_editor_assets' ) );
		remove_filter( 'posts_pre_query', array( Search_Blocks::class, 'filter__posts_pre_query' ), 10 );
		Search_Blocks::set_block_templates_active_for_testing( null );
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

		$class = $this->block_theme_search_blocks();
		$class::register_search_template();

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
	 * `register_product_search_template()` registers the dedicated
	 * `jetpack-search-product-results` template (its own Site Editor entry) seeded
	 * From the product-search layout.
	 */
	public function test_register_product_search_template_registers_via_block_template_api() {
		if ( ! function_exists( 'register_block_template' ) ) {
			$this->markTestSkipped( 'register_block_template() unavailable in this test environment.' );
		}
		$registry = \WP_Block_Templates_Registry::get_instance();
		foreach ( array( 'jetpack-search//jetpack-search-product-results', 'jetpack//jetpack-search-product-results' ) as $name ) {
			if ( $registry->is_registered( $name ) ) {
				$registry->unregister( $name );
			}
		}

		$class = $this->block_theme_search_blocks();
		$class::register_product_search_template();

		$expected = $this->invoke_protected( 'get_parent_plugin_slug' ) . '//jetpack-search-product-results';
		$this->assertTrue( $registry->is_registered( $expected ), "Template $expected should be registered." );

		$registered = $registry->get_registered( $expected );
		$this->assertSame( 'Jetpack Search Product Results', $registered->title );
		// Product-specific layout: product result list + the product filters block.
		$this->assertStringContainsString(
			'<!-- wp:jetpack-search/results-list {"layout":"product"} /-->',
			$registered->content
		);
		// filters-product serialized with its children (it's an InnerBlocks
		// container — a self-closing tag would render an empty sidebar).
		$this->assertStringContainsString(
			'<!-- wp:jetpack-search/filters-product -->',
			$registered->content
		);
		$this->assertStringContainsString(
			'"taxonomy":"product_cat","displayStyle":"chips"',
			$registered->content
		);
		$this->assertStringNotContainsString( '{{FILTER_HEADING}}', $registered->content );

		$registry->unregister( $expected );
	}

	/**
	 * Empty template content must be a no-op — otherwise the prepended slug
	 * Resolves to an empty template and renders a blank `/?s=...` page.
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

		// block_templates_active() forced true so the block-theme guard
		// doesn't short-circuit before the empty-content check.
		$anon = new class() extends Search_Blocks {
			protected static function get_search_template_content(): string {
				return '';
			}
			protected static function block_templates_active(): bool {
				return true;
			}
		};
		$anon::register_search_template();

		foreach ( array( 'jetpack-search//jetpack-search', 'jetpack//jetpack-search' ) as $name ) {
			$this->assertFalse( $registry->is_registered( $name ), "Template $name should NOT be registered when content is empty." );
		}
	}

	/**
	 * On a classic theme registration must be a no-op. The dbless default
	 * Theme is classic, so the real guard is exercised here.
	 */
	public function test_register_search_template_skips_on_classic_theme() {
		if ( ! function_exists( 'register_block_template' ) ) {
			$this->markTestSkipped( 'register_block_template() unavailable in this test environment.' );
		}
		$this->assertFalse( wp_is_block_theme(), 'dbless default theme is expected to be classic' );

		$registry = \WP_Block_Templates_Registry::get_instance();
		foreach ( array( 'jetpack-search//jetpack-search', 'jetpack//jetpack-search' ) as $name ) {
			if ( $registry->is_registered( $name ) ) {
				$registry->unregister( $name );
			}
		}

		Search_Blocks::register_search_template();

		foreach ( array( 'jetpack-search//jetpack-search', 'jetpack//jetpack-search' ) as $name ) {
			$this->assertFalse( $registry->is_registered( $name ), "Template $name must NOT be registered on a classic theme." );
		}
	}

	/**
	 * Registered template must reference resolved slugs, not raw
	 * {{HEADER_SLUG}} / {{FOOTER_SLUG}} placeholders.
	 */
	public function test_register_search_template_substitutes_resolved_chrome_slugs() {
		if ( ! function_exists( 'register_block_template' ) ) {
			$this->markTestSkipped( 'register_block_template() unavailable in this test environment.' );
		}
		$registry = \WP_Block_Templates_Registry::get_instance();
		foreach ( array( 'jetpack-search//jetpack-search', 'jetpack//jetpack-search' ) as $name ) {
			if ( $registry->is_registered( $name ) ) {
				$registry->unregister( $name );
			}
		}

		$cls = get_class(
			new class() extends Search_Blocks {
				protected static function block_templates_active(): bool {
					return true;
				}
				protected static function resolve_chrome_slugs(): array {
					return array(
						'header' => 'main-header',
						'footer' => 'footer-columns',
					);
				}
			}
		);
		$cls::register_search_template();

		$expected   = $this->invoke_protected( 'get_parent_plugin_slug' ) . '//jetpack-search';
		$registered = $registry->get_registered( $expected );
		$this->assertNotNull( $registered, "Template $expected should be registered." );
		$this->assertStringContainsString( '"slug":"main-header"', $registered->content );
		$this->assertStringContainsString( '"slug":"footer-columns"', $registered->content );
		$this->assertStringNotContainsString( '{{HEADER_SLUG}}', $registered->content );
		$this->assertStringNotContainsString( '{{FOOTER_SLUG}}', $registered->content );

		$registry->unregister( $expected );
	}

	/**
	 * Replace_block_template wrapper makes registration idempotent: a
	 * Second call with the same name replaces the prior entry instead
	 * Of triggering doing_it_wrong (long-lived PHP-FPM workers).
	 */
	public function test_register_search_template_replaces_existing_registration() {
		if ( ! function_exists( 'register_block_template' ) ) {
			$this->markTestSkipped( 'register_block_template() unavailable in this test environment.' );
		}
		$registry = \WP_Block_Templates_Registry::get_instance();
		foreach ( array( 'jetpack-search//jetpack-search', 'jetpack//jetpack-search' ) as $name ) {
			if ( $registry->is_registered( $name ) ) {
				$registry->unregister( $name );
			}
		}

		$first = get_class(
			new class() extends Search_Blocks {
				protected static function block_templates_active(): bool {
					return true;
				}
				protected static function resolve_chrome_slugs(): array {
					return array(
						'header' => 'old-header',
						'footer' => 'old-footer',
					);
				}
			}
		);
		$first::register_search_template();

		$second = get_class(
			new class() extends Search_Blocks {
				protected static function block_templates_active(): bool {
					return true;
				}
				protected static function resolve_chrome_slugs(): array {
					return array(
						'header' => 'new-header',
						'footer' => 'new-footer',
					);
				}
			}
		);
		$second::register_search_template();

		$expected   = $this->invoke_protected( 'get_parent_plugin_slug' ) . '//jetpack-search';
		$registered = $registry->get_registered( $expected );
		$this->assertNotNull( $registered );
		$this->assertStringContainsString( '"slug":"new-header"', $registered->content );
		$this->assertStringContainsString( '"slug":"new-footer"', $registered->content );
		$this->assertStringNotContainsString( '"slug":"old-header"', $registered->content );
		$this->assertStringNotContainsString( '"slug":"old-footer"', $registered->content );

		$registry->unregister( $expected );
	}

	/**
	 * Product-results template goes through the same placeholder pipeline.
	 */
	public function test_register_product_search_template_substitutes_resolved_chrome_slugs() {
		if ( ! function_exists( 'register_block_template' ) ) {
			$this->markTestSkipped( 'register_block_template() unavailable in this test environment.' );
		}
		$registry = \WP_Block_Templates_Registry::get_instance();
		foreach ( array( 'jetpack-search//jetpack-search-product-results', 'jetpack//jetpack-search-product-results' ) as $name ) {
			if ( $registry->is_registered( $name ) ) {
				$registry->unregister( $name );
			}
		}

		$cls = get_class(
			new class() extends Search_Blocks {
				protected static function block_templates_active(): bool {
					return true;
				}
				protected static function resolve_chrome_slugs(): array {
					return array(
						'header' => 'shop-header',
						'footer' => 'shop-footer',
					);
				}
			}
		);
		$cls::register_product_search_template();

		$expected   = $this->invoke_protected( 'get_parent_plugin_slug' ) . '//jetpack-search-product-results';
		$registered = $registry->get_registered( $expected );
		$this->assertNotNull( $registered );
		$this->assertStringContainsString( '"slug":"shop-header"', $registered->content );
		$this->assertStringContainsString( '"slug":"shop-footer"', $registered->content );
		$this->assertStringNotContainsString( '{{HEADER_SLUG}}', $registered->content );
		$this->assertStringNotContainsString( '{{FOOTER_SLUG}}', $registered->content );

		$registry->unregister( $expected );
	}

	/**
	 * When both the Jetpack monolith and the standalone Jetpack Search plugin
	 * Are active, the more-specific "Jetpack Search" label must win so the
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
	 * Loaded by one of them — but test the safe fallback so a misconfigured
	 * Site doesn't break template registration with an invalid namespace).
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
	 * Canonical `s` URL key so they interoperate with core's search
	 * Routing, body classes, and any theme/plugin code keyed off `s`.
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
	 * The inline blocks must switch to `q` so a refresh of an inline-
	 * Search URL like `/about/?q=boots` doesn't trip core's
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
	 * Canonical key.
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
	 * Must read `searchQuery` from `?q=…` and ignore any stray `?s=…`
	 * (which is the URL shape we deliberately stopped writing to
	 * Dodge the singular 404 path).
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
	 * Search — the active key is `q`. Without this, a stray `s` (from
	 * A pre-existing shared link or an unrelated plugin) would still
	 * Hydrate the Interactivity store and re-emit `?s=` on the next
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
	 * Or malformed `?s[]=…&q[]=…` can't smuggle the search query into
	 * `activeFilters` (which would forward it to ES as a filter clause
	 * And round-trip it back into the URL on every keystroke). The real
	 * Filter alongside them proves the rest of the parser is still
	 * Working — i.e. the reservation gate is surgical, not a side
	 * Effect of an unrelated rejection earlier in the loop.
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
	 * Seeded attributes drift, the editor stops offering the expected filter
	 * Presets or inserts them with the wrong defaults.
	 */
	public function test_inject_filter_checkbox_variations_adds_expected_shapes() {
		// Product variations are WC-gated; flip the probe so this matrix
		// can assert their full shape. The non-Woo case is covered by
		// `test_inject_filter_checkbox_variations_drops_product_when_woocommerce_inactive`.
		Search_Blocks::set_woocommerce_blocks_enabled_for_testing( true );
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

		$this->assertSame(
			array(
				'filterType' => 'taxonomy',
				'taxonomy'   => 'product_tag',
				'label'      => 'Product Tag',
			),
			$variations_by_name['product_tag']['attributes']
		);
		$this->assertSame( array( 'filterType', 'taxonomy' ), $variations_by_name['product_tag']['isActive'] );

		// product_brand is gated on `taxonomy_exists( 'product_brand' )`. In a
		// bare phpunit run no taxonomies are registered, so it must NOT appear.
		$this->assertArrayNotHasKey( 'product_brand', $variations_by_name );
	}

	/**
	 * `product_brand` isn't a core WC taxonomy — it's added by extensions
	 * (WC Brands, Perfect Brands, recent bundled WC versions). The variation
	 * Is registered only when the taxonomy is present so authors don't see
	 * A silently-empty filter on sites without a brands extension.
	 */
	public function test_inject_filter_checkbox_variations_gates_product_brand_on_taxonomy_existence() {
		Search_Blocks::set_woocommerce_blocks_enabled_for_testing( true );
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
	 * Product_tag, product_brand) must NOT appear in the inserter — the
	 * Underlying taxonomies don't exist there, so the variations would
	 * Render silently-empty filters. The non-WC variations stay registered.
	 */
	public function test_inject_filter_checkbox_variations_drops_product_when_woocommerce_inactive() {
		Search_Blocks::set_woocommerce_blocks_enabled_for_testing( false );
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
	 * The three coupled gates — `register_blocks()` registration loop, the
	 * `filter_block_helpers()` map, and the editor's `register-blocks.js`
	 * Bundle (after the localized list). Membership is decided by exact
	 * Match against `woocommerce_only_block_names()`, so adding a name to
	 * That list auto-enrolls every gate without further plumbing.
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
	 * Needs to know whether a block name is filter-shaped. On non-Woo sites
	 * The WC-only blocks aren't registered, so they must drop out of the
	 * Helper map too — keeping the registry symmetric with what the inserter
	 * Offered.
	 */
	public function test_filter_block_helpers_drops_wc_helpers_when_woocommerce_inactive() {
		Search_Blocks::set_woocommerce_blocks_enabled_for_testing( false );
		$helpers = $this->invoke_protected( 'filter_block_helpers' );

		$this->assertArrayHasKey( 'jetpack-search/filter-checkbox', $helpers );
		$this->assertArrayHasKey( 'jetpack-search/filter-date', $helpers );
		$this->assertArrayNotHasKey( 'jetpack-search/filter-wc-rating', $helpers );
		$this->assertArrayNotHasKey( 'jetpack-search/filter-wc-attribute', $helpers );
		$this->assertArrayNotHasKey( 'jetpack-search/filter-wc-stock-status', $helpers );
	}

	/**
	 * On Woo sites the helper map must include every WC-only block so
	 * Filter-config collection covers the full filter surface.
	 */
	public function test_filter_block_helpers_includes_wc_helpers_when_woocommerce_active() {
		Search_Blocks::set_woocommerce_blocks_enabled_for_testing( true );
		$helpers = $this->invoke_protected( 'filter_block_helpers' );

		$this->assertArrayHasKey( 'jetpack-search/filter-wc-rating', $helpers );
		$this->assertArrayHasKey( 'jetpack-search/filter-wc-attribute', $helpers );
		$this->assertArrayHasKey( 'jetpack-search/filter-wc-stock-status', $helpers );
	}

	/**
	 * `min_price` / `max_price` are WC-only; `filter-wc-price` isn't
	 * Registered on non-Woo sites. A stray deep link must not seed the
	 * `priceRange` slice — otherwise the JS store would re-emit the params
	 * On the next URL push and the API request would carry a `range` clause
	 * For a field the index doesn't have.
	 */
	public function test_build_initial_state_drops_price_range_when_woocommerce_inactive() {
		Search_Blocks::set_woocommerce_blocks_enabled_for_testing( false );
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
	 * So the API request fires with the matching `range` clause on first
	 * Paint — this is the same contract `filter-wc-price` writes to URL.
	 */
	public function test_build_initial_state_seeds_price_range_when_woocommerce_active() {
		Search_Blocks::set_woocommerce_blocks_enabled_for_testing( true );
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
	 * `?s=foo` is the established case: param present and non-empty. The
	 * Initial-loading gate must keep firing so `results-list/render.php`
	 * Paints the skeleton during the JS-side hydration round-trip.
	 */
	public function test_is_initial_loading_with_non_empty_search_query() {
		$original_get        = $_GET;
		$original_query      = $GLOBALS['wp_query'] ?? null;
		$_GET                = array( 's' => 'boots' );
		$GLOBALS['wp_query'] = new \WP_Query( array( 's' => 'boots' ) );
		try {
			$this->assertTrue( Search_Blocks::has_search_param() );
			$this->assertTrue( Search_Blocks::is_initial_loading() );
			$state = Search_Blocks::build_initial_state();
			$this->assertTrue( $state['hasSearchParam'] );
			$this->assertTrue( $state['isLoading'] );
		} finally {
			$_GET                = $original_get;
			$GLOBALS['wp_query'] = $original_query;
		}
	}

	/**
	 * `?s=` (param present, value empty) is the SEARCH-183 case — visitor
	 * Submitted a blank search and expects an unfiltered result set. Both
	 * The presence helper and the loading gate must flip true even though
	 * `parse_url_search_query()` trims to `''`. The `wp_query` is primed
	 * With a non-empty `s` so `is_search()` reports the search route and
	 * `get_search_param_name()` picks the `s` key — the empty URL value
	 * Rides on `$_GET`.
	 */
	public function test_is_initial_loading_with_empty_search_query_string() {
		$original_get        = $_GET;
		$original_query      = $GLOBALS['wp_query'] ?? null;
		$_GET                = array( 's' => '' );
		$GLOBALS['wp_query'] = new \WP_Query( array( 's' => 'placeholder' ) );
		try {
			$this->assertSame( '', Search_Blocks::parse_url_search_query() );
			$this->assertTrue( Search_Blocks::has_search_param() );
			$this->assertTrue( Search_Blocks::is_initial_loading() );
			$state = Search_Blocks::build_initial_state();
			$this->assertTrue( $state['hasSearchParam'] );
			$this->assertTrue( $state['isLoading'] );
		} finally {
			$_GET                = $original_get;
			$GLOBALS['wp_query'] = $original_query;
		}
	}

	/**
	 * Off the search route the active key is `q`. `?q=` (empty value) must
	 * Still trigger initial loading so an inline-search page on a singular
	 * Post matches the search-route behavior — visitor submitted a blank
	 * Inline search, expects the unfiltered result set.
	 */
	public function test_is_initial_loading_with_empty_q_param_off_search_route() {
		$original_get        = $_GET;
		$original_query      = $GLOBALS['wp_query'] ?? null;
		$_GET                = array( 'q' => '' );
		$GLOBALS['wp_query'] = new \WP_Query();
		try {
			$this->assertTrue( Search_Blocks::has_search_param() );
			$this->assertTrue( Search_Blocks::is_initial_loading() );
		} finally {
			$_GET                = $original_get;
			$GLOBALS['wp_query'] = $original_query;
		}
	}

	/**
	 * A URL with no search param at all (homepage, archive, etc.) must not
	 * Flip into the loading state — there's no fetch to wait on, and a
	 * Seeded spinner would render placeholders that never resolve.
	 */
	public function test_is_initial_loading_with_no_search_param_present() {
		$original_get        = $_GET;
		$original_query      = $GLOBALS['wp_query'] ?? null;
		$_GET                = array();
		$GLOBALS['wp_query'] = new \WP_Query();
		try {
			$this->assertFalse( Search_Blocks::has_search_param() );
			$this->assertFalse( Search_Blocks::is_initial_loading() );
			$state = Search_Blocks::build_initial_state();
			$this->assertFalse( $state['hasSearchParam'] );
			$this->assertFalse( $state['isLoading'] );
		} finally {
			$_GET                = $original_get;
			$GLOBALS['wp_query'] = $original_query;
		}
	}

	/**
	 * Array-shaped `?q[]=foo` is malformed input — `parse_url_search_query()`
	 * Bails to `''` via its `is_scalar()` guard, so `has_search_param()`
	 * Matches that contract and treats it as "not present" rather than
	 * Flipping the page into a loading state with no usable query.
	 */
	public function test_has_search_param_rejects_non_scalar_input() {
		$original_get        = $_GET;
		$original_query      = $GLOBALS['wp_query'] ?? null;
		$_GET                = array( 'q' => array( 'foo' ) );
		$GLOBALS['wp_query'] = new \WP_Query();
		try {
			$this->assertFalse( Search_Blocks::has_search_param() );
			$this->assertFalse( Search_Blocks::is_initial_loading() );
		} finally {
			$_GET                = $original_get;
			$GLOBALS['wp_query'] = $original_query;
		}
	}

	/**
	 * The injector must be scoped to jetpack-search/filter-checkbox so it
	 * Can't leak Search-specific presets onto unrelated blocks.
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
	 * Block.json or a higher-priority filter), the existing entry must win —
	 * Otherwise `array_merge` would emit two inserter cards under the same
	 * Variation name and the editor would resolve `isActive` ambiguously.
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
	 * Blocks that opt into chips today (filter-checkbox, filter-date,
	 * Filter-wc-attribute). Per-block delegations are exercised in their
	 * Own tests; this case pins the source-of-truth contract so a `'chips'`
	 * Literal never gains a third synonym (`'chip'`, `'CHIPS'`, …) without
	 * An explicit test update.
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
	 * Site that hasn't opted into the slot-mapping feature pays nothing
	 * For it (the `Custom Taxonomy` picker still works against the native
	 * Allowlist).
	 */
	public function test_custom_taxonomy_map_empty_by_default() {
		$this->assertSame( array(), Search_Blocks::custom_taxonomy_map() );
	}

	/**
	 * Valid mappings round-trip through the filter, including across multiple
	 * Slots — pins both the per-entry shape and the multi-entry support.
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
	 * The ES field name, so an arbitrary string would query a non-existent
	 * Field and the filter would silently return zero buckets. The valid
	 * Sibling entry must still come through so one bad entry doesn't sink
	 * The entire map.
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
	 * Spaces in the index (they'd both pull from the same `jetpack-search-tagN`
	 * Field) — the second filter would silently return results from the
	 * First. Reject the duplicate; first-write wins.
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
	 * Crash callers — empty map is the safe fallback. `_doing_it_wrong()` is
	 * Fired so a misconfiguration is visible during development; tested
	 * Separately below.
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
	 * During development rather than silently getting an empty picker.
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
	 * Picker even if it's not in Jetpack Search's native allowlist. The
	 * Taxonomy must be registered on the site — otherwise the editor's
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
	 * Surface in the whitelist — the editor picker can't render a label for
	 * An unregistered taxonomy, so silently dropping it keeps the surface
	 * Consistent with what the editor will actually display.
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
	 * Appear in the Custom Taxonomy picker even though they sit on the
	 * Jetpack Search allowlist — the dedicated variation is the right
	 * Surface for those filters and a duplicate entry would be confusing.
	 */
	public function test_supported_custom_taxonomies_excludes_built_in_variations() {
		// `category` and `post_tag` are registered by core in any WP env.
		$supported = Search_Blocks::supported_custom_taxonomies();
		$this->assertNotContains( 'category', $supported );
		$this->assertNotContains( 'post_tag', $supported );
	}

	/**
	 * A taxonomy that's in Jetpack Search's native allowlist must surface
	 * Automatically when registered on the site — without requiring an
	 * Entry in the slot map. This is the case the FAQ's
	 * `jetpack_search_allowed_taxonomies_for_widget_filters` walkthrough
	 * Covers: pre-allowlisted taxonomies just need to be registered.
	 *
	 * `jetpack-search-tag0`…`jetpack-search-tag9` are themselves on the
	 * Sync allowlist (they're the reserved slot taxonomies), so a site
	 * That registers one directly gets it in the picker straight away.
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
	 * The slot map is resolved into each filterConfig's `effectiveSlug` at
	 * Config-build time rather than threaded through the IA state seed,
	 * So the front-end query builders stay pure. `Filter_Checkbox::build_config()`
	 * Is exercised separately in this suite; this case anchors the
	 * Intentional absence of a global `customTaxonomyMap` on the seed so a
	 * Future refactor doesn't reintroduce the bidirectional plumbing.
	 */
	public function test_build_initial_state_does_not_carry_custom_taxonomy_map_globally() {
		$state = Search_Blocks::build_initial_state();
		$this->assertArrayNotHasKey( 'customTaxonomyMap', $state );
	}

	/**
	 * The resolver routes mapped slugs to their slot and unmapped slugs to
	 * Themselves. Built-in slugs (covered by their own filter variations)
	 * Always return verbatim regardless of map content, so a stray entry
	 * Can't silently redirect a built-in filter.
	 */
	public function test_resolve_taxonomy_slot_routes_mapped_and_built_in_slugs_correctly() {
		$callback = static function ( $map ) {
			$map['genre']       = 'jetpack-search-tag1';
			$map['category']    = 'jetpack-search-tag9'; // Should be ignored.
			$map['product_cat'] = 'jetpack-search-tag8'; // Should be ignored.
			return $map;
		};
		add_filter( 'jetpack_search_custom_taxonomy_map', $callback );
		try {
			$this->assertSame( '', Search_Blocks::resolve_taxonomy_slot( '' ) );
			$this->assertSame( 'jetpack-search-tag1', Search_Blocks::resolve_taxonomy_slot( 'genre' ) );
			$this->assertSame( 'mood', Search_Blocks::resolve_taxonomy_slot( 'mood' ) );
			$this->assertSame( 'category', Search_Blocks::resolve_taxonomy_slot( 'category' ) );
			$this->assertSame( 'post_tag', Search_Blocks::resolve_taxonomy_slot( 'post_tag' ) );
			$this->assertSame( 'product_cat', Search_Blocks::resolve_taxonomy_slot( 'product_cat' ) );
			$this->assertSame( 'product_tag', Search_Blocks::resolve_taxonomy_slot( 'product_tag' ) );
			$this->assertSame( 'product_brand', Search_Blocks::resolve_taxonomy_slot( 'product_brand' ) );
		} finally {
			remove_filter( 'jetpack_search_custom_taxonomy_map', $callback );
		}
	}

	/**
	 * Silence `_doing_it_wrong()` notices for tests that exercise the
	 * Misconfiguration branches. PHPUnit's deprecation/notice handlers
	 * Would otherwise flip the test red on the very codepath we want to
	 * Exercise.
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
	 * Is the cheapest way to cover this logic without leaking visibility
	 * Just for testability.
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
