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
