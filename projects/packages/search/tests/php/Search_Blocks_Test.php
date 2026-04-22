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
		);

		$this->assertTrue( class_exists( Search_Blocks::class ) );
		$state = Search_Blocks::build_initial_state();
		foreach ( $required_keys as $key ) {
			$this->assertArrayHasKey( $key, $state, "Missing key: $key" );
		}
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
	 * Invoke a protected static on Search_Blocks from test code. Reflection
	 * is the cheapest way to cover this logic without leaking visibility
	 * just for testability.
	 *
	 * @param string $method Method name.
	 * @param mixed  ...$args Positional args.
	 * @return mixed
	 */
	private function invoke_protected( string $method, ...$args ) {
		// setAccessible() is a no-op since PHP 8.1 and deprecated in 8.5,
		// so just invoke directly — ReflectionMethod::invoke() already
		// bypasses visibility.
		return ( new \ReflectionMethod( Search_Blocks::class, $method ) )->invoke( null, ...$args );
	}
}
