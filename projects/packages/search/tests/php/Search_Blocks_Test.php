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
	 * Clear `Search_Blocks::is_initial_loading()`'s per-request memo between
	 * tests. PHPUnit runs every test in a single process, so without this
	 * the first test that exercises a query/filter/price URL would pin the
	 * cached value and every later test that sets `$_GET` would silently
	 * read stale state.
	 */
	protected function tearDown(): void {
		Search_Blocks::reset_initial_loading_cache();
		Search_Blocks::reset_woocommerce_blocks_enabled_cache();
		Search_Blocks::reset_custom_taxonomy_map_cache();
		// Guards against a failed assertion leaking the option across tests.
		delete_option( 'jetpack_search_override_woocommerce_search_template' );
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
	 * result card renders dates with the same layout as the rest of the site
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
			$this->assertFalse( $state['isWooCommerceBlocksEnabled'] );
		} finally {
			$_GET = $original_get;
		}
	}

	/**
	 * On Woo sites the same product-format `?orderby` values must seed the
	 * matching sort and surface `isWooCommerceBlocksEnabled=true` on the IA store
	 * so the JS-side url-state gate accepts them too (RSM-1082).
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
	 * gate true on a non-Woo install — useful for staging previews of
	 * WC-only Search blocks. The filter result must be cached, so a
	 * subsequent call returns the override even after the filter is
	 * removed.
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
	 * can't construct a "WC is loaded" PHPUnit env without polluting the
	 * global namespace with a `WooCommerce` stub class, so instead the
	 * test pins the *contract*: the filter receives the probed bool and
	 * its return value is what the function returns. The cast-to-bool
	 * test below covers the related "filter result wins over probe" path
	 * for non-bool returns.
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
	 * the result is cached, so a callback that probes the database or
	 * reads an option pays its cost once even on a hot path.
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
	 * must not poison the strictly-typed `bool` cache. The function casts
	 * before storing so callers using `===` against `true` still match.
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
	 * Subclass forcing `block_templates_active()` so the block-theme path
	 * runs without a real block theme in the dbless env.
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
	 * hierarchy, and a pre-existing copy is de-duplicated rather than doubled.
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
	 * block theme — the slug only resolves through the block-template system.
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
	 * the hierarchy untouched so WooCommerce's own priority-10 prepend of
	 * `product-search-results` wins — that's the no-regression default for
	 * stores that haven't opted in.
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
	 * through the prepend carve-out (the priority-20 router then swaps
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
	 * With the override on, `init()` registers both the product-search
	 * template and the priority-20 routing filter.
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
	 * the dashboard's Embedded|Inline visibility gate. With the option on it
	 * registers under Inline (server-rendered theme search); with the option
	 * still on after the site switches to Overlay (client-side) or Off it must
	 * NOT register — a stale option from a since-switched experience can't keep
	 * rerouting the hierarchy.
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
	 * exposes no public unregister, and the registry persists for the whole
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
	 * build. Returns a cleanup callback that restores the prior state
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
	 * declared in its generated asset file — that's what lets WordPress
	 * resolve the dependency each block's view module declares instead of
	 * shipping the store inlined per block.
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
	 * the method must bail without registering anything or erroring, so
	 * block registration is unaffected.
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
	 * On the Embedded experience, the template-override hooks must be
	 * registered so `/?s=…` resolves to the Jetpack Search template instead
	 * of the theme's `search.html`.
	 */
	public function test_init_registers_template_hooks_when_embedded() {
		$this->reset_search_blocks_hooks();
		$this->set_module_active( true );
		add_filter( 'jetpack_search_theme_supports_embedded_experience', '__return_true' );
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

		remove_filter( 'jetpack_search_theme_supports_embedded_experience', '__return_true' );
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
	}

	/**
	 * Saved Embedded but on a non-block theme: the experience resolves to Theme
	 * search (inline), so the FSE template-takeover hooks must NOT register —
	 * otherwise `/?s=…` would resolve to a template the theme can't render.
	 */
	public function test_init_does_not_register_template_hooks_when_embedded_on_non_block_theme() {
		$this->reset_search_blocks_hooks();
		$this->set_module_active( true );
		add_filter( 'jetpack_search_theme_supports_embedded_experience', '__return_false' );
		update_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, Module_Control::EXPERIENCE_EMBEDDED );

		Search_Blocks::init();

		$this->assertFalse(
			has_action( 'init', array( Search_Blocks::class, 'register_search_template' ) ),
			'register_search_template must not hook into init when the theme cannot render Embedded'
		);
		$this->assertFalse(
			has_filter( 'search_template_hierarchy', array( Search_Blocks::class, 'prepend_search_template' ) ),
			'prepend_search_template must not hook into search_template_hierarchy on a non-block theme'
		);

		remove_filter( 'jetpack_search_theme_supports_embedded_experience', '__return_false' );
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
	}

	/**
	 * If the module isn't active, the experience is `'off'` regardless of any
	 * stale value in the experience option, so the template-override hooks
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
		remove_action( 'init', array( Search_Blocks::class, 'register_product_search_template' ) );
		remove_filter( 'block_categories_all', array( Search_Blocks::class, 'register_block_category' ) );
		remove_filter( 'search_template_hierarchy', array( Search_Blocks::class, 'prepend_search_template' ) );
		remove_filter( 'search_template_hierarchy', array( Search_Blocks::class, 'route_woocommerce_product_search_template' ), 20 );
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
	 * from the product-search layout.
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
	 * resolves to an empty template and renders a blank `/?s=...` page.
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
	 * theme is classic, so the real guard is exercised here.
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
	 * `extract_chrome_slugs()` lifts the first and last top-level
	 * `core/template-part` slugs out of a piece of template markup. Covers
	 * the standard "header then footer" shape and the variant shape
	 * (e.g. Twenty Twenty-Two-style `header-large-dark`) so we can prove
	 * the resolver doesn't silently downgrade to the plain `header` /
	 * `footer` defaults when a theme uses something fancier.
	 *
	 * Nested `template-part` references inside an inner wrapper must NOT
	 * be promoted — the resolver only walks the top level and a theme
	 * burying its chrome in a wrapper should fall back to the defaults
	 * higher up the chain.
	 *
	 * @dataProvider provider_extract_chrome_slugs
	 *
	 * @param string                               $content  Template markup.
	 * @param array{header:?string,footer:?string} $expected Expected extracted slugs.
	 */
	#[DataProvider( 'provider_extract_chrome_slugs' )]
	public function test_extract_chrome_slugs( string $content, array $expected ) {
		$ref = new \ReflectionMethod( Search_Blocks::class, 'extract_chrome_slugs' );
		if ( PHP_VERSION_ID < 80100 ) {
			$ref->setAccessible( true );
		}
		$this->assertSame( $expected, $ref->invoke( null, $content ) );
	}

	/**
	 * Fixtures for `test_extract_chrome_slugs`.
	 *
	 * @return array<string, array{0:string, 1:array{header:?string,footer:?string}}>
	 */
	public static function provider_extract_chrome_slugs(): array {
		return array(
			'standard header + footer (TT3/4/5 shape)' => array(
				'<!-- wp:template-part {"slug":"header","tagName":"header"} /-->' . "\n"
				. '<main></main>' . "\n"
				. '<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->',
				array(
					'header' => 'header',
					'footer' => 'footer',
				),
			),
			'variant slugs (bespoke theme with no plain header.html)' => array(
				'<!-- wp:template-part {"slug":"header-large-dark"} /-->' . "\n"
				. '<main></main>' . "\n"
				. '<!-- wp:template-part {"slug":"site-footer"} /-->',
				array(
					'header' => 'header-large-dark',
					'footer' => 'site-footer',
				),
			),
			'single template-part is treated as header-only, footer falls back' => array(
				'<!-- wp:template-part {"slug":"header"} /-->' . "\n"
				. '<main></main>',
				array(
					'header' => 'header',
					'footer' => null,
				),
			),
			'two template-parts with the same slug are preserved (deliberate theme choice, not the single-part dedup)' => array(
				'<!-- wp:template-part {"slug":"site-shell"} /-->' . "\n"
				. '<main></main>' . "\n"
				. '<!-- wp:template-part {"slug":"site-shell"} /-->',
				array(
					'header' => 'site-shell',
					'footer' => 'site-shell',
				),
			),
			'slug with unsafe characters is rejected (guards JSON round-trip in substitute_template_placeholders)' => array(
				// parse_blocks() preserves attrs verbatim from the JSON; if it ever
				// surfaced a slug containing characters that would break the
				// `{"slug":"..."}` re-insertion (a quote, a brace, a newline), we
				// drop it and let the resolver fall back to the default.
				'<!-- wp:template-part {"slug":"valid"} /-->' . "\n"
				. '<!-- wp:template-part {"slug":"has space"} /-->',
				array(
					'header' => 'valid',
					'footer' => null,
				),
			),
			'nested template-parts in a wrapper are ignored' => array(
				'<!-- wp:group --><div class="wp-block-group">'
				. '<!-- wp:template-part {"slug":"buried-header"} /-->'
				. '</div><!-- /wp:group -->',
				array(
					'header' => null,
					'footer' => null,
				),
			),
			'no template-parts at all yields nulls'    => array(
				'<main><p>No chrome here.</p></main>',
				array(
					'header' => null,
					'footer' => null,
				),
			),
			'empty markup yields nulls'                => array(
				'',
				array(
					'header' => null,
					'footer' => null,
				),
			),
		);
	}

	/**
	 * `resolve_theme_chrome_slugs()` prefers the active theme's
	 * `search.html`, falls back to `index.html`, and finally to the
	 * hard-coded `header`/`footer` defaults. Stubs the template-content
	 * fetch so the resolver can be exercised without a real block theme
	 * in the dbless env.
	 */
	public function test_resolve_theme_chrome_slugs_prefers_search_template() {
		$cls = get_class(
			new class() extends Search_Blocks {
				protected static function get_active_theme_template_content( string $template_name ): ?string {
					if ( 'search' === $template_name ) {
						return '<!-- wp:template-part {"slug":"header-large-dark"} /-->'
							. '<!-- wp:template-part {"slug":"footer"} /-->';
					}
					if ( 'index' === $template_name ) {
						return '<!-- wp:template-part {"slug":"index-header"} /-->'
							. '<!-- wp:template-part {"slug":"index-footer"} /-->';
					}
					return null;
				}
			}
		);
		$ref = new \ReflectionMethod( $cls, 'resolve_theme_chrome_slugs' );
		if ( PHP_VERSION_ID < 80100 ) {
			$ref->setAccessible( true );
		}
		$this->assertSame(
			array(
				'header' => 'header-large-dark',
				'footer' => 'footer',
			),
			$ref->invoke( null )
		);
	}

	/**
	 * When the theme has no `search.html`, the resolver walks to
	 * `index.html`. Covers the gap themes like Twenty Twenty-Three's
	 * earlier releases had where only `index.html` shipped.
	 */
	public function test_resolve_theme_chrome_slugs_falls_back_to_index_template() {
		$cls = get_class(
			new class() extends Search_Blocks {
				protected static function get_active_theme_template_content( string $template_name ): ?string {
					if ( 'index' === $template_name ) {
						return '<!-- wp:template-part {"slug":"index-header"} /-->'
							. '<!-- wp:template-part {"slug":"index-footer"} /-->';
					}
					return null;
				}
			}
		);
		$ref = new \ReflectionMethod( $cls, 'resolve_theme_chrome_slugs' );
		if ( PHP_VERSION_ID < 80100 ) {
			$ref->setAccessible( true );
		}
		$this->assertSame(
			array(
				'header' => 'index-header',
				'footer' => 'index-footer',
			),
			$ref->invoke( null )
		);
	}

	/**
	 * When neither template resolves AND the area-based fallback finds
	 * nothing either, the slugs must fall back to the hard-coded
	 * `header` / `footer` defaults so the registered template stays
	 * valid markup on classic-themed or otherwise empty sites.
	 */
	public function test_resolve_theme_chrome_slugs_falls_back_to_defaults() {
		$cls = get_class(
			new class() extends Search_Blocks {
				protected static function get_active_theme_template_content( string $template_name ): ?string {
					unset( $template_name ); // stub: neither template resolves, regardless of name.
					return null;
				}
				protected static function resolve_chrome_slugs_by_area(): array {
					// stub: theme also has no declared header/footer parts.
					return array(
						'header' => null,
						'footer' => null,
					);
				}
			}
		);
		$ref = new \ReflectionMethod( $cls, 'resolve_theme_chrome_slugs' );
		if ( PHP_VERSION_ID < 80100 ) {
			$ref->setAccessible( true );
		}
		$this->assertSame(
			array(
				'header' => 'header',
				'footer' => 'footer',
			),
			$ref->invoke( null )
		);
	}

	/**
	 * When neither `search.html` nor `index.html` resolves to top-level
	 * template-parts, the resolver must walk to the area-based fallback
	 * and use whatever slugs the theme declares with
	 * `area: "header"` / `area: "footer"` — covers bespoke block themes
	 * that ship variant slugs like `site-header` and don't reference
	 * them from a standard template.
	 */
	public function test_resolve_theme_chrome_slugs_uses_area_fallback_when_templates_silent() {
		$cls = get_class(
			new class() extends Search_Blocks {
				protected static function get_active_theme_template_content( string $template_name ): ?string {
					unset( $template_name ); // stub: neither template resolves.
					return null;
				}
				protected static function resolve_chrome_slugs_by_area(): array {
					return array(
						'header' => 'site-header',
						'footer' => 'site-footer',
					);
				}
			}
		);
		$ref = new \ReflectionMethod( $cls, 'resolve_theme_chrome_slugs' );
		if ( PHP_VERSION_ID < 80100 ) {
			$ref->setAccessible( true );
		}
		$this->assertSame(
			array(
				'header' => 'site-header',
				'footer' => 'site-footer',
			),
			$ref->invoke( null )
		);
	}

	/**
	 * The slug-resolution chain is per-slot: if `search.html` declares
	 * only a header (e.g. a minimalist template), the footer falls
	 * through to the area-based fallback before reaching the defaults.
	 * Without this the resolver could leak a `footer` default while the
	 * theme has a real `area: "footer"` part it would prefer to use.
	 */
	public function test_resolve_theme_chrome_slugs_mixes_template_header_with_area_footer() {
		$cls = get_class(
			new class() extends Search_Blocks {
				protected static function get_active_theme_template_content( string $template_name ): ?string {
					if ( 'search' === $template_name ) {
						return '<!-- wp:template-part {"slug":"hero-header"} /-->';
					}
					return null;
				}
				protected static function resolve_chrome_slugs_by_area(): array {
					return array(
						'header' => 'never-used',
						'footer' => 'site-footer',
					);
				}
			}
		);
		$ref = new \ReflectionMethod( $cls, 'resolve_theme_chrome_slugs' );
		if ( PHP_VERSION_ID < 80100 ) {
			$ref->setAccessible( true );
		}
		$this->assertSame(
			array(
				'header' => 'hero-header',
				'footer' => 'site-footer',
			),
			$ref->invoke( null )
		);
	}

	/**
	 * Per-slot fill across the search → index step: a minimalist
	 * `search.html` that wraps only its header should pull the footer
	 * slug from `index.html` rather than skipping straight to the area
	 * or hardcoded-defaults rungs. Documents the cross-template fill
	 * the resolver loop is responsible for.
	 */
	public function test_resolve_theme_chrome_slugs_fills_footer_from_index_when_search_has_header_only() {
		$cls = get_class(
			new class() extends Search_Blocks {
				protected static function get_active_theme_template_content( string $template_name ): ?string {
					if ( 'search' === $template_name ) {
						return '<!-- wp:template-part {"slug":"search-header"} /-->';
					}
					if ( 'index' === $template_name ) {
						return '<!-- wp:template-part {"slug":"index-header"} /-->'
							. '<!-- wp:template-part {"slug":"index-footer"} /-->';
					}
					return null;
				}
				protected static function resolve_chrome_slugs_by_area(): array {
					// Should not be reached; both slots are filled by templates.
					return array(
						'header' => 'never-used',
						'footer' => 'never-used',
					);
				}
			}
		);
		$ref = new \ReflectionMethod( $cls, 'resolve_theme_chrome_slugs' );
		if ( PHP_VERSION_ID < 80100 ) {
			$ref->setAccessible( true );
		}
		$this->assertSame(
			array(
				'header' => 'search-header',
				'footer' => 'index-footer',
			),
			$ref->invoke( null )
		);
	}

	/**
	 * `extract_chrome_slugs_from_parts()` picks the alphabetically-first
	 * slug per area so the chrome stays deterministic across requests
	 * even when WP returns parts in filesystem-enumeration order. Twenty
	 * Twenty-Two ships three header parts (`header`, `header-large-dark`,
	 * `header-small-dark`) all declared `area: "header"`; we want plain
	 * `header` as the most neutral pick, not whichever the directory
	 * scan surfaced first.
	 */
	public function test_extract_chrome_slugs_from_parts_picks_alphabetical_first_per_area() {
		$parts = array(
			(object) array(
				'theme' => 'tt-bespoke',
				'slug'  => 'header-small-dark',
				'area'  => 'header',
			),
			(object) array(
				'theme' => 'tt-bespoke',
				'slug'  => 'header-large-dark',
				'area'  => 'header',
			),
			(object) array(
				'theme' => 'tt-bespoke',
				'slug'  => 'header',
				'area'  => 'header',
			),
			(object) array(
				'theme' => 'tt-bespoke',
				'slug'  => 'footer-newsletter',
				'area'  => 'footer',
			),
			(object) array(
				'theme' => 'tt-bespoke',
				'slug'  => 'footer',
				'area'  => 'footer',
			),
			(object) array(
				'theme' => 'tt-bespoke',
				'slug'  => 'sidebar',
				'area'  => 'uncategorized',
			),
		);
		$ref   = new \ReflectionMethod( Search_Blocks::class, 'extract_chrome_slugs_from_parts' );
		if ( PHP_VERSION_ID < 80100 ) {
			$ref->setAccessible( true );
		}
		$this->assertSame(
			array(
				'header' => 'header',
				'footer' => 'footer',
			),
			$ref->invoke( null, $parts, 'tt-bespoke' )
		);
	}

	/**
	 * `extract_chrome_slugs_from_parts()` ignores parts from other
	 * themes and rejects unsafe slugs the same way `extract_chrome_slugs()`
	 * does — both run through the JSON round-trip in
	 * `substitute_template_placeholders()`.
	 */
	public function test_extract_chrome_slugs_from_parts_filters_by_theme_and_unsafe_slugs() {
		$parts = array(
			(object) array(
				'theme' => 'other-theme',
				'slug'  => 'header',
				'area'  => 'header',
			),
			(object) array(
				'theme' => 'tt-bespoke',
				'slug'  => 'has space',
				'area'  => 'header',
			),
			(object) array(
				'theme' => 'tt-bespoke',
				'slug'  => 'site-header',
				'area'  => 'header',
			),
			(object) array(
				'theme' => 'tt-bespoke',
				'slug'  => '',
				'area'  => 'footer',
			),
		);
		$ref   = new \ReflectionMethod( Search_Blocks::class, 'extract_chrome_slugs_from_parts' );
		if ( PHP_VERSION_ID < 80100 ) {
			$ref->setAccessible( true );
		}
		$this->assertSame(
			array(
				'header' => 'site-header',
				'footer' => null,
			),
			$ref->invoke( null, $parts, 'tt-bespoke' )
		);
	}

	/**
	 * End-to-end check: `register_search_template()` must register markup
	 * that references the resolved chrome slugs (not the raw
	 * `{{HEADER_SLUG}}` / `{{FOOTER_SLUG}}` placeholders, which would
	 * crash the template-part renderer at runtime).
	 */
	public function test_register_search_template_substitutes_chrome_slug_placeholders() {
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
				protected static function get_active_theme_template_content( string $template_name ): ?string {
					if ( 'search' === $template_name ) {
						return '<!-- wp:template-part {"slug":"header-large-dark"} /-->'
							. '<!-- wp:template-part {"slug":"custom-footer"} /-->';
					}
					return null;
				}
			}
		);
		$cls::register_search_template();

		$expected   = $this->invoke_protected( 'get_parent_plugin_slug' ) . '//jetpack-search';
		$registered = $registry->get_registered( $expected );
		$this->assertNotNull( $registered, "Template $expected should be registered." );
		$this->assertStringContainsString( '"slug":"header-large-dark"', $registered->content );
		$this->assertStringContainsString( '"slug":"custom-footer"', $registered->content );
		$this->assertStringNotContainsString( '{{HEADER_SLUG}}', $registered->content );
		$this->assertStringNotContainsString( '{{FOOTER_SLUG}}', $registered->content );
		// Defaults must not leak in when a theme-resolved slug is available.
		$this->assertStringNotContainsString( '"slug":"header"', $registered->content );
		$this->assertStringNotContainsString( '"slug":"footer"', $registered->content );

		$registry->unregister( $expected );
	}

	/**
	 * Counterpart to the search-template substitution check: the
	 * product-results template ships through the same placeholder
	 * pipeline, so a fix to one must apply to the other.
	 */
	public function test_register_product_search_template_substitutes_chrome_slug_placeholders() {
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
				protected static function get_active_theme_template_content( string $template_name ): ?string {
					if ( 'search' === $template_name ) {
						return '<!-- wp:template-part {"slug":"shop-header"} /-->'
							. '<!-- wp:template-part {"slug":"shop-footer"} /-->';
					}
					return null;
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
	 * is registered only when the taxonomy is present so authors don't see
	 * a silently-empty filter on sites without a brands extension.
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
	 * product_tag, product_brand) must NOT appear in the inserter — the
	 * underlying taxonomies don't exist there, so the variations would
	 * render silently-empty filters. The non-WC variations stay registered.
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
	 * filter-config collection covers the full filter surface.
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
	 * registered on non-Woo sites. A stray deep link must not seed the
	 * `priceRange` slice — otherwise the JS store would re-emit the params
	 * on the next URL push and the API request would carry a `range` clause
	 * for a field the index doesn't have.
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
	 * so the API request fires with the matching `range` clause on first
	 * paint — this is the same contract `filter-wc-price` writes to URL.
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
	 * initial-loading gate must keep firing so `results-list/render.php`
	 * paints the skeleton during the JS-side hydration round-trip.
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
	 * submitted a blank search and expects an unfiltered result set. Both
	 * the presence helper and the loading gate must flip true even though
	 * `parse_url_search_query()` trims to `''`. The `wp_query` is primed
	 * with a non-empty `s` so `is_search()` reports the search route and
	 * `get_search_param_name()` picks the `s` key — the empty URL value
	 * rides on `$_GET`.
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
	 * still trigger initial loading so an inline-search page on a singular
	 * post matches the search-route behavior — visitor submitted a blank
	 * inline search, expects the unfiltered result set.
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
	 * flip into the loading state — there's no fetch to wait on, and a
	 * seeded spinner would render placeholders that never resolve.
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
	 * bails to `''` via its `is_scalar()` guard, so `has_search_param()`
	 * matches that contract and treats it as "not present" rather than
	 * flipping the page into a loading state with no usable query.
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
	 * The slot map is resolved into each filterConfig's `effectiveSlug` at
	 * config-build time rather than threaded through the IA state seed,
	 * so the front-end query builders stay pure. `Filter_Checkbox::build_config()`
	 * is exercised separately in this suite; this case anchors the
	 * intentional absence of a global `customTaxonomyMap` on the seed so a
	 * future refactor doesn't reintroduce the bidirectional plumbing.
	 */
	public function test_build_initial_state_does_not_carry_custom_taxonomy_map_globally() {
		$state = Search_Blocks::build_initial_state();
		$this->assertArrayNotHasKey( 'customTaxonomyMap', $state );
	}

	/**
	 * The resolver routes mapped slugs to their slot and unmapped slugs to
	 * themselves. Built-in slugs (covered by their own filter variations)
	 * always return verbatim regardless of map content, so a stray entry
	 * can't silently redirect a built-in filter.
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
