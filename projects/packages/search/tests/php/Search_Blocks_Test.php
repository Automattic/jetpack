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
	 * The 404 guard must drop `s` from the WP_Query when a search request
	 * resolves to a singular page that hosts at least one Jetpack Search
	 * block. Without this, `WP::handle_404()` would 404 the page on
	 * refresh because the AND'd `post_content LIKE '%react%'` clause
	 * empties $posts (RSM-1754).
	 */
	public function test_unset_search_on_singular_block_host_drops_s_when_page_hosts_blocks() {
		$page_id = wp_insert_post(
			array(
				'post_type'    => 'page',
				'post_title'   => 'About',
				'post_name'    => 'about',
				'post_status'  => 'publish',
				'post_content' => "<!-- wp:jetpack/search-input /-->\n<!-- wp:jetpack/search-results /-->",
			)
		);

		$original_main_query = $GLOBALS['wp_the_query'] ?? null;
		try {
			$query                   = $this->build_singular_search_query( $page_id, 'react' );
			$GLOBALS['wp_the_query'] = $query;
			Search_Blocks::unset_search_on_singular_block_host( $query );
			$this->assertSame( '', $query->get( 's' ) );
		} finally {
			$GLOBALS['wp_the_query'] = $original_main_query;
			wp_delete_post( $page_id, true );
		}
	}

	/**
	 * Pages without any Jetpack Search blocks must keep their `s` query
	 * var intact — the historic singular-search behaviour (which 404s
	 * by default) is only worth overriding when we *know* an inline
	 * search experience is mounted on the page.
	 */
	public function test_unset_search_on_singular_block_host_preserves_s_when_no_blocks() {
		$page_id = wp_insert_post(
			array(
				'post_type'    => 'page',
				'post_title'   => 'Plain',
				'post_name'    => 'plain',
				'post_status'  => 'publish',
				'post_content' => '<!-- wp:paragraph --><p>just some text</p><!-- /wp:paragraph -->',
			)
		);

		$original_main_query = $GLOBALS['wp_the_query'] ?? null;
		try {
			$query                   = $this->build_singular_search_query( $page_id, 'react' );
			$GLOBALS['wp_the_query'] = $query;
			Search_Blocks::unset_search_on_singular_block_host( $query );
			$this->assertSame( 'react', $query->get( 's' ) );
		} finally {
			$GLOBALS['wp_the_query'] = $original_main_query;
			wp_delete_post( $page_id, true );
		}
	}

	/**
	 * On a bare `/?s=react` search (no `pagename`/`name`/`page_id`),
	 * the guard must do nothing so `Inline_Search` and the rest of the
	 * search pipeline continue to handle the query normally.
	 */
	public function test_unset_search_on_singular_block_host_ignores_non_singular_search() {
		$original_main_query = $GLOBALS['wp_the_query'] ?? null;
		try {
			$query = new \WP_Query();
			$query->parse_query( array( 's' => 'react' ) );
			$GLOBALS['wp_the_query'] = $query;
			Search_Blocks::unset_search_on_singular_block_host( $query );
			$this->assertSame( 'react', $query->get( 's' ) );
		} finally {
			$GLOBALS['wp_the_query'] = $original_main_query;
		}
	}

	/**
	 * Non-main queries (e.g. a secondary `WP_Query` in a custom block)
	 * must never be touched — the guard targets the singular 404 path,
	 * which only fires for the main frontend request.
	 */
	public function test_unset_search_on_singular_block_host_ignores_secondary_queries() {
		$page_id = wp_insert_post(
			array(
				'post_type'    => 'page',
				'post_title'   => 'About',
				'post_name'    => 'about',
				'post_status'  => 'publish',
				'post_content' => '<!-- wp:jetpack/search-input /-->',
			)
		);

		$original_main_query = $GLOBALS['wp_the_query'] ?? null;
		try {
			// Build a query and explicitly make a *different* one the main
			// query so `is_main_query()` returns false for our $query.
			$main_query              = new \WP_Query();
			$GLOBALS['wp_the_query'] = $main_query;

			$query = $this->build_singular_search_query( $page_id, 'react' );
			Search_Blocks::unset_search_on_singular_block_host( $query );
			$this->assertSame( 'react', $query->get( 's' ) );
		} finally {
			$GLOBALS['wp_the_query'] = $original_main_query;
			wp_delete_post( $page_id, true );
		}
	}

	/**
	 * After `unset_search_on_singular_block_host()` strips `s` from the
	 * WP_Query to dodge the 404 path, the Interactivity store must still
	 * seed `searchQuery` from the URL — otherwise the user's term shows
	 * up in the address bar but not in the search input or results.
	 * Regression coverage for /<page>/?s=<term> on a page that hosts
	 * search blocks.
	 */
	public function test_build_initial_state_seeds_search_query_from_get_even_when_wp_query_s_is_empty() {
		$original_get   = $_GET;
		$original_query = $GLOBALS['wp_query'] ?? null;
		$_GET           = array( 's' => 'react' );
		// Mimic the post-guard state: $_GET still carries `s`, but the
		// main WP_Query has had it stripped.
		$GLOBALS['wp_query'] = new \WP_Query( array( 's' => '' ) );
		try {
			$state = Search_Blocks::build_initial_state();
			$this->assertSame( 'react', $state['searchQuery'] );
		} finally {
			$_GET                = $original_get;
			$GLOBALS['wp_query'] = $original_query;
		}
	}

	/**
	 * The block walker must detect search blocks nested inside other
	 * blocks (e.g. inside a Group), since the bundled "Blog Search Page"
	 * pattern wraps the search blocks in layout containers.
	 */
	public function test_post_hosts_search_blocks_walks_inner_blocks() {
		$post = new \WP_Post(
			(object) array(
				'post_content' => '<!-- wp:group --><div class="wp-block-group"><!-- wp:jetpack/search-input /--></div><!-- /wp:group -->',
			)
		);
		$this->assertTrue( Search_Blocks::post_hosts_search_blocks( $post ) );
	}

	/**
	 * A post without any registered Jetpack Search block must report
	 * false even when it contains other Jetpack-namespaced blocks, so
	 * we don't accidentally suppress `s` on unrelated pages.
	 */
	public function test_post_hosts_search_blocks_returns_false_for_unrelated_blocks() {
		$post = new \WP_Post(
			(object) array(
				'post_content' => '<!-- wp:jetpack/contact-form /--><!-- wp:paragraph --><p>hi</p><!-- /wp:paragraph -->',
			)
		);
		$this->assertFalse( Search_Blocks::post_hosts_search_blocks( $post ) );
	}

	/**
	 * Build a `WP_Query` resembling the one core dispatches for
	 * `/<pagename>/?s=<term>` (using `page_id` rather than `pagename`
	 * because WorDBless's wpdb stub only resolves SELECTs by ID).
	 *
	 * The caller is responsible for assigning it to `$GLOBALS['wp_the_query']`
	 * so `is_main_query()` returns the desired value (and for restoring
	 * the prior value in a `finally` block).
	 *
	 * @param int    $page_id Singular post ID.
	 * @param string $search  Search term.
	 * @return \WP_Query
	 */
	private function build_singular_search_query( int $page_id, string $search ): \WP_Query {
		$query = new \WP_Query();
		$query->parse_query(
			array(
				'page_id' => $page_id,
				's'       => $search,
			)
		);
		return $query;
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
