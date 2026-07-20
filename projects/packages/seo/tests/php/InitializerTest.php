<?php
/**
 * Tests for the Jetpack SEO Initializer.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\SEO\Initializer
 */
#[CoversClass( Initializer::class )]
class InitializerTest extends TestCase {

	/**
	 * The cache and the database both persist between tests here, so every one of them
	 * has to start from a known-empty state.
	 */
	protected function setUp(): void {
		parent::setUp();
		$this->reset_coverage_cache();
		$this->reset_content();
	}

	protected function tearDown(): void {
		$this->reset_content();
		$this->reset_coverage_cache();
		parent::tearDown();
	}

	/**
	 * Empty the posts tables. WorDBless keeps the SQLite database between tests, so
	 * content created by one test would otherwise be counted by the next.
	 */
	private function reset_content() {
		global $wpdb;

		$wpdb->query( "DELETE FROM {$wpdb->postmeta}" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->query( "DELETE FROM {$wpdb->posts}" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

		wp_cache_flush();
	}

	/**
	 * Drop the cached counts.
	 */
	private function reset_coverage_cache() {
		delete_transient( Initializer::COVERAGE_COUNTS_TRANSIENT );
	}

	/**
	 * Invoke one of the class's private statics.
	 *
	 * @param string $name Method name.
	 * @param mixed  ...$args Arguments.
	 * @return mixed
	 */
	private function invoke_private( $name, ...$args ) {
		$method = new \ReflectionMethod( Initializer::class, $name );
		// Required to invoke a private method on PHP < 8.1 (a no-op from 8.1 on).
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		return $method->invoke( null, ...$args );
	}

	/**
	 * A coverage payload with distinctive numbers, so a cached read is unmistakable:
	 * recomputing in this database-less suite can only ever produce zeros.
	 *
	 * @return array
	 */
	private function seeded_coverage() {
		return array(
			'total'               => 41,
			'with_schema'         => 7,
			'with_title'          => 13,
			'with_description'    => 11,
			'with_search_visible' => 39,
		);
	}

	/**
	 * The Initializer class exists and exposes the expected menu slug.
	 */
	public function test_menu_slug_constant_is_defined() {
		$this->assertSame( 'jetpack-seo', Initializer::MENU_SLUG );
	}

	/**
	 * The package version constant is defined and non-empty.
	 */
	public function test_package_version_constant_is_defined() {
		$this->assertNotEmpty( Initializer::PACKAGE_VERSION );
	}

	/**
	 * The feature-flag filter name is the expected slug.
	 */
	public function test_feature_filter_constant_is_defined() {
		$this->assertSame( 'rsm_jetpack_seo', Initializer::FEATURE_FILTER );
	}

	/**
	 * The factual content-coverage counts expose the expected integer shape
	 * (state, not a score). Invoked directly to avoid get_overview_data()'s
	 * Modules dependency, which needs host-plugin option classes absent here.
	 */
	public function test_content_coverage_shape() {
		$method = new \ReflectionMethod( Initializer::class, 'get_content_coverage' );
		// Required to invoke a private method on PHP < 8.1 (a no-op from 8.1 on).
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		$coverage = $method->invoke( null );

		foreach ( array( 'total', 'with_schema', 'with_title', 'with_description', 'with_search_visible' ) as $key ) {
			$this->assertArrayHasKey( $key, $coverage );
			$this->assertIsInt( $coverage[ $key ] );
		}

		// Search-visible can never exceed the total (it's total minus noindexed).
		$this->assertLessThanOrEqual( $coverage['total'], $coverage['with_search_visible'] );
	}

	/**
	 * The coverage query joins `wp_postmeta` on the key list `coverage_meta_keys()`
	 * returns, but counts each metric with its own CASE arm naming a `META_*`
	 * constant directly. Those two have to name the same keys: a key dropped from
	 * the join list (or a CASE arm pointing at a key the join never selected) makes
	 * the affected metric silently count zero rather than fail. Pin both lists.
	 */
	public function test_coverage_targets_the_seo_meta_keys_and_post_types() {
		$meta_keys  = new \ReflectionMethod( Initializer::class, 'coverage_meta_keys' );
		$post_types = new \ReflectionMethod( Initializer::class, 'coverage_post_types' );
		// Required to invoke a private method on PHP < 8.1 (a no-op from 8.1 on).
		if ( PHP_VERSION_ID < 80100 ) {
			$meta_keys->setAccessible( true );
			$post_types->setAccessible( true );
		}

		$this->assertEqualsCanonicalizing(
			array(
				Initializer::META_SCHEMA_TYPE,
				Initializer::META_TITLE,
				Initializer::META_DESCRIPTION,
				Initializer::META_NOINDEX,
			),
			$meta_keys->invoke( null ),
			'Every meta key a CASE arm counts must also be selected by the join.'
		);

		$this->assertSame( array( 'post', 'page' ), $post_types->invoke( null ) );
	}

	/**
	 * An empty site still gets a well-formed payload. The aggregate has no GROUP BY, so
	 * it returns its row even with nothing to count, and the Overview card destructures
	 * all five counts unconditionally.
	 */
	public function test_content_coverage_is_all_zeros_on_an_empty_site() {
		$this->assertSame(
			array(
				'total'               => 0,
				'with_schema'         => 0,
				'with_title'          => 0,
				'with_description'    => 0,
				'with_search_visible' => 0,
			),
			$this->invoke_private( 'get_content_coverage' )
		);
	}

	/**
	 * The counts against real content. Every fixture here is one the query could plausibly
	 * get wrong: a post with two rows for the same meta key must be counted once, not
	 * twice; an empty-string value means "not set"; noindex only counts on an exact '1',
	 * so '0' leaves the post search-visible; and drafts, trashed posts and other post types
	 * are not part of the published set at all.
	 */
	public function test_content_coverage_counts_published_posts_and_pages() {
		// Published, everything set, and hidden from search.
		$this->publish(
			array(
				Initializer::META_SCHEMA_TYPE => 'Article',
				Initializer::META_TITLE       => 'A title',
				Initializer::META_DESCRIPTION => 'A description',
				Initializer::META_NOINDEX     => '1',
			)
		);

		// Published, nothing set.
		$this->publish();

		// Empty strings are not "set".
		$this->publish(
			array(
				Initializer::META_TITLE       => '',
				Initializer::META_DESCRIPTION => '',
			)
		);

		// noindex '0' is not noindexed — the post stays search-visible.
		$this->publish( array( Initializer::META_NOINDEX => '0' ) );

		// Two rows for one key: the post has a title, and counts once.
		$duplicated = $this->publish();
		$this->add_meta_row( $duplicated, Initializer::META_TITLE, 'first' );
		$this->add_meta_row( $duplicated, Initializer::META_TITLE, 'second' );

		// A page counts alongside posts.
		$this->publish( array( Initializer::META_DESCRIPTION => 'Page description' ), 'page' );

		// None of these are part of the published set.
		$this->publish( array( Initializer::META_TITLE => 'Draft title' ), 'post', 'draft' );
		$this->publish( array( Initializer::META_TITLE => 'Trashed title' ), 'post', 'trash' );
		$this->publish( array( Initializer::META_TITLE => 'Attachment title' ), 'attachment' );

		$this->assertSame(
			array(
				'total'               => 6,
				'with_schema'         => 1,
				'with_title'          => 2,
				'with_description'    => 2,
				'with_search_visible' => 5,
			),
			$this->invoke_private( 'get_content_coverage' )
		);
	}

	/**
	 * Publish a post with the given SEO meta.
	 *
	 * @param array  $meta      Meta keys to set.
	 * @param string $post_type Post type.
	 * @param string $status    Post status.
	 * @return int Post ID.
	 */
	private function publish( $meta = array(), $post_type = 'post', $status = 'publish' ) {
		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Test post',
				'post_status' => $status,
				'post_type'   => $post_type,
			)
		);

		foreach ( $meta as $key => $value ) {
			update_post_meta( $post_id, $key, $value );
		}

		return $post_id;
	}

	/**
	 * Add a postmeta row directly, so a post can end up with two rows for one key —
	 * which `update_post_meta()` would never produce, and which the counts must dedupe.
	 *
	 * @param int    $post_id Post to attach the row to.
	 * @param string $key     Meta key.
	 * @param string $value   Meta value.
	 * @return void
	 */
	private function add_meta_row( $post_id, $key, $value ) {
		global $wpdb;

		$wpdb->insert(
			$wpdb->postmeta,
			array(
				'post_id'    => $post_id,
				'meta_key'   => $key,
				'meta_value' => $value,
			)
		);
	}

	/**
	 * A warm cache is returned as-is. The seeded numbers can't have been recomputed —
	 * there's no database here, so a recompute yields zeros — which is what makes this
	 * prove the query was skipped rather than merely that the shape survived.
	 */
	public function test_content_coverage_is_served_from_the_cache() {
		set_transient( Initializer::COVERAGE_COUNTS_TRANSIENT, $this->seeded_coverage(), HOUR_IN_SECONDS );

		$this->assertSame( $this->seeded_coverage(), $this->invoke_private( 'get_content_coverage' ) );
	}

	/**
	 * A miss computes and then writes the counts back, so the next read is a hit.
	 */
	public function test_content_coverage_populates_the_cache_on_a_miss() {
		$this->assertFalse( get_transient( Initializer::COVERAGE_COUNTS_TRANSIENT ) );

		$coverage = $this->invoke_private( 'get_content_coverage' );

		$this->assertSame( $coverage, get_transient( Initializer::COVERAGE_COUNTS_TRANSIENT ) );
	}

	/**
	 * Anything in the transient that isn't a well-formed payload — a truncated write, a
	 * value left by an older version of this code, someone else's data under the key — is
	 * treated as a miss. The Overview card destructures all five counts unconditionally,
	 * so handing it a partial array would be worse than recomputing.
	 *
	 * @param mixed $garbage Value found in the transient.
	 * @dataProvider provide_malformed_cache_values
	 */
	#[DataProvider( 'provide_malformed_cache_values' )]
	public function test_malformed_cache_value_is_recomputed( $garbage ) {
		set_transient( Initializer::COVERAGE_COUNTS_TRANSIENT, $garbage, HOUR_IN_SECONDS );

		$coverage = $this->invoke_private( 'get_content_coverage' );

		$this->assertSame(
			array(
				'total'               => 0,
				'with_schema'         => 0,
				'with_title'          => 0,
				'with_description'    => 0,
				'with_search_visible' => 0,
			),
			$coverage
		);
	}

	/**
	 * @return array<string, array{mixed}>
	 */
	public static function provide_malformed_cache_values() {
		return array(
			'a string'           => array( 'nonsense' ),
			'a partial payload'  => array( array( 'total' => 5 ) ),
			'non-integer counts' => array(
				array(
					'total'               => '5',
					'with_schema'         => '1',
					'with_title'          => '1',
					'with_description'    => '1',
					'with_search_visible' => '5',
				),
			),
		);
	}

	/**
	 * Writing one of the four SEO fields the Overview counts drops the cache; writing any
	 * other post meta leaves it alone. Without that second half, every meta write on the
	 * site — and plugins write a lot of it — would throw the counts away.
	 */
	public function test_meta_change_invalidates_only_for_the_counted_keys() {
		set_transient( Initializer::COVERAGE_COUNTS_TRANSIENT, $this->seeded_coverage(), HOUR_IN_SECONDS );

		Initializer::invalidate_content_coverage_on_meta_change( 1, 123, '_edit_lock' );
		$this->assertSame(
			$this->seeded_coverage(),
			get_transient( Initializer::COVERAGE_COUNTS_TRANSIENT ),
			'An unrelated meta key must not invalidate the counts.'
		);

		Initializer::invalidate_content_coverage_on_meta_change( 1, 123, Initializer::META_DESCRIPTION );
		$this->assertFalse( get_transient( Initializer::COVERAGE_COUNTS_TRANSIENT ) );
	}

	/**
	 * Publishing and unpublishing move the counts; a transition between two unpublished
	 * states doesn't, and neither does one on a post type the Overview never counts.
	 *
	 * @param string $new_status  Status transitioned to.
	 * @param string $old_status  Status transitioned from.
	 * @param string $post_type   Post type transitioning.
	 * @param bool   $invalidates Whether the cache should be dropped.
	 * @dataProvider provide_status_transitions
	 */
	#[DataProvider( 'provide_status_transitions' )]
	public function test_status_change_invalidates_only_when_the_published_set_changes( $new_status, $old_status, $post_type, $invalidates ) {
		set_transient( Initializer::COVERAGE_COUNTS_TRANSIENT, $this->seeded_coverage(), HOUR_IN_SECONDS );

		$post = new \WP_Post( (object) array( 'post_type' => $post_type ) );
		Initializer::invalidate_content_coverage_on_status_change( $new_status, $old_status, $post );

		if ( $invalidates ) {
			$this->assertFalse( get_transient( Initializer::COVERAGE_COUNTS_TRANSIENT ) );
		} else {
			$this->assertSame( $this->seeded_coverage(), get_transient( Initializer::COVERAGE_COUNTS_TRANSIENT ) );
		}
	}

	/**
	 * @return array<string, array{string, string, string, bool}>
	 */
	public static function provide_status_transitions() {
		return array(
			'post published'         => array( 'publish', 'draft', 'post', true ),
			'page published'         => array( 'publish', 'auto-draft', 'page', true ),
			'post unpublished'       => array( 'draft', 'publish', 'post', true ),
			'post trashed'           => array( 'trash', 'publish', 'post', true ),
			'draft to pending'       => array( 'pending', 'draft', 'post', false ),
			'uncounted post type'    => array( 'publish', 'draft', 'attachment', false ),
			'uncounted type trashed' => array( 'trash', 'publish', 'product', false ),
		);
	}

	/**
	 * A hard delete drops the cache for the counted post types only. Trashing already went
	 * through the status transition; this is the path where an already-trashed post is
	 * deleted for good and transitions nothing.
	 */
	public function test_delete_invalidates_only_for_the_counted_post_types() {
		set_transient( Initializer::COVERAGE_COUNTS_TRANSIENT, $this->seeded_coverage(), HOUR_IN_SECONDS );

		Initializer::invalidate_content_coverage_on_delete( 123, new \WP_Post( (object) array( 'post_type' => 'attachment' ) ) );
		$this->assertSame( $this->seeded_coverage(), get_transient( Initializer::COVERAGE_COUNTS_TRANSIENT ) );

		Initializer::invalidate_content_coverage_on_delete( 123, new \WP_Post( (object) array( 'post_type' => 'page' ) ) );
		$this->assertFalse( get_transient( Initializer::COVERAGE_COUNTS_TRANSIENT ) );
	}

	/**
	 * Every tracked write drops the transient, with no once-per-request guard: a later
	 * write in the same request must clear a cache a concurrent read re-warmed in between,
	 * so an intermediate count can't survive to the end of a bulk update.
	 */
	public function test_every_tracked_write_invalidates_the_cache() {
		set_transient( Initializer::COVERAGE_COUNTS_TRANSIENT, $this->seeded_coverage(), HOUR_IN_SECONDS );

		Initializer::invalidate_content_coverage_on_meta_change( 1, 123, Initializer::META_TITLE );
		$this->assertFalse( get_transient( Initializer::COVERAGE_COUNTS_TRANSIENT ) );

		// A concurrent read re-warms the cache mid-write; the next write must still clear it.
		set_transient( Initializer::COVERAGE_COUNTS_TRANSIENT, $this->seeded_coverage(), HOUR_IN_SECONDS );
		Initializer::invalidate_content_coverage_on_meta_change( 2, 124, Initializer::META_TITLE );
		$this->assertFalse( get_transient( Initializer::COVERAGE_COUNTS_TRANSIENT ) );
	}

	/**
	 * `get_overview_data()` assembles the full Overview bootstrap (site
	 * visibility, verification booleans, content coverage, and plan state) the
	 * dashboard reads. With no host-plugin options present it degrades to
	 * sensible defaults, so we assert only the stable shape and types.
	 */
	public function test_get_overview_data_shape() {
		$overview = Initializer::get_overview_data();

		$this->assertArrayHasKey( 'site_visibility', $overview );
		$this->assertArrayHasKey( 'site_verification', $overview );
		$this->assertArrayHasKey( 'content_coverage', $overview );
		$this->assertArrayHasKey( 'plan', $overview );

		$this->assertArrayHasKey( 'search_engines_visible', $overview['site_visibility'] );
		$this->assertIsBool( $overview['site_visibility']['search_engines_visible'] );

		$this->assertArrayHasKey( 'total', $overview['content_coverage'] );
		$this->assertIsInt( $overview['content_coverage']['total'] );

		$this->assertArrayHasKey( 'seo_enabled_for_site', $overview['plan'] );
		$this->assertIsBool( $overview['plan']['seo_enabled_for_site'] );
	}

	/**
	 * With the feature flag on, the surface discoverable, and the `seo-tools` module
	 * active, `init()` registers the front-end JSON-LD schema and the admin/REST hooks.
	 * We drive module state through the `jetpack_active_modules` filter (the package test
	 * context has no on-disk modules), mark the cohort surface visible so init() passes
	 * its discoverability gate, and reset the one-shot `$initialized` guard so the body runs.
	 */
	public function test_init_registers_schema_and_hooks_when_enabled() {
		$initialized = new \ReflectionProperty( Initializer::class, 'initialized' );
		if ( PHP_VERSION_ID < 80100 ) {
			$initialized->setAccessible( true );
		}
		$initialized->setValue( null, false );

		$enable_module = static function () {
			return array( 'seo-tools' );
		};
		add_filter( 'rsm_jetpack_seo', '__return_true' );
		add_filter( 'jetpack_active_modules', $enable_module );
		// Past the discoverability cohort gate (self-hosted opted-in / fresh install).
		update_option( Initializer::VISIBILITY_OPTION, '1' );

		try {
			Initializer::init();

			// Line proving the body ran past the module gate: Schema_Builder::init()
			// self-hooks wp_head, and init() registers its admin/REST callbacks.
			$this->assertNotFalse(
				has_action( 'wp_head', array( Schema_Builder::class, 'emit' ) )
			);
			$this->assertNotFalse(
				has_action( 'admin_menu', array( Initializer::class, 'maybe_load_wp_build' ) )
			);
			$this->assertNotFalse(
				has_action( 'rest_api_init', array( Initializer::class, 'register_rest_settings' ) )
			);

			// The coverage cache is invalidated from writes that happen anywhere — the block
			// editor posts through REST, where is_admin() is false — so these have to be
			// registered by init() itself, not by the admin-only branch above.
			$this->assertNotFalse(
				has_action( 'transition_post_status', array( Initializer::class, 'invalidate_content_coverage_on_status_change' ) )
			);
			$this->assertNotFalse(
				has_action( 'deleted_post', array( Initializer::class, 'invalidate_content_coverage_on_delete' ) )
			);
			foreach ( array( 'added_post_meta', 'updated_post_meta', 'deleted_post_meta' ) as $hook ) {
				$this->assertNotFalse(
					has_action( $hook, array( Initializer::class, 'invalidate_content_coverage_on_meta_change' ) ),
					"init() must hook {$hook} to keep the coverage counts fresh."
				);
			}
		} finally {
			remove_filter( 'rsm_jetpack_seo', '__return_true' );
			remove_filter( 'jetpack_active_modules', $enable_module );
			delete_option( Initializer::VISIBILITY_OPTION );
			$initialized->setValue( null, false );
		}
	}

	/**
	 * The Google-verification bootstrap exposes the connect URL + connection flag the
	 * React app expects, with the right types. Without the host plugin's Keyring/Manager
	 * classes present (the package test context) it degrades to an empty URL and not
	 * connected, so the UI falls back to manual entry.
	 */
	public function test_get_google_verify_data_shape() {
		$data = Initializer::get_google_verify_data();

		$this->assertArrayHasKey( 'connect_url', $data );
		$this->assertArrayHasKey( 'is_connected', $data );
		$this->assertIsString( $data['connect_url'] );
		$this->assertIsBool( $data['is_connected'] );
		$this->assertSame( '', $data['connect_url'] );
		$this->assertFalse( $data['is_connected'] );
	}

	/**
	 * The AI tab bootstrap exposes the enhancer shape the React app expects, with
	 * boolean availability/enabled. Without a plan-supporting environment the
	 * enhancer is unavailable.
	 */
	public function test_get_ai_data_shape() {
		// Force the enhancer feature filter off so availability is deterministic
		// regardless of whether Current_Plan happens to be loaded in the test
		// environment (availability is `filter_on && plan_supports`).
		add_filter( 'ai_seo_enhancer_enabled', '__return_false' );

		try {
			$ai = Initializer::get_ai_data();

			$this->assertArrayHasKey( 'enhancer', $ai );
			$this->assertArrayHasKey( 'available', $ai['enhancer'] );
			$this->assertArrayHasKey( 'enabled', $ai['enhancer'] );
			$this->assertIsBool( $ai['enhancer']['available'] );
			$this->assertIsBool( $ai['enhancer']['enabled'] );
			// With the feature filter forced off, the enhancer is never available.
			$this->assertFalse( $ai['enhancer']['available'] );
		} finally {
			remove_filter( 'ai_seo_enhancer_enabled', '__return_false' );
		}
	}

	/**
	 * The site-identity bootstrap (used by the Settings search/social previews)
	 * exposes title, url, icon and image, all as strings. With no site icon or
	 * custom logo in the test environment the image falls back to the (empty)
	 * icon.
	 */
	public function test_get_site_data_shape() {
		$site = Initializer::get_site_data();

		$this->assertArrayHasKey( 'title', $site );
		$this->assertArrayHasKey( 'url', $site );
		$this->assertArrayHasKey( 'icon', $site );
		$this->assertArrayHasKey( 'image', $site );
		$this->assertIsString( $site['title'] );
		$this->assertIsString( $site['url'] );
		$this->assertIsString( $site['icon'] );
		$this->assertIsString( $site['image'] );
	}

	/**
	 * Reads the durable sitemap option without consulting the live module state
	 * when the option is present (set or explicitly off).
	 */
	public function test_is_sitemap_enabled_reads_durable_option() {
		$method = new \ReflectionMethod( Initializer::class, 'is_sitemap_enabled' );
		// Required to invoke a private method on PHP < 8.1 (a no-op from 8.1 on).
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		$modules = new \Automattic\Jetpack\Modules();

		update_option( Initializer::SITEMAP_ENABLED_OPTION, '1' );
		$this->assertTrue( $method->invoke( null, $modules ) );

		// Present-but-off: still read from the option, never the module fallback.
		update_option( Initializer::SITEMAP_ENABLED_OPTION, '' );
		$this->assertFalse( $method->invoke( null, $modules ) );

		delete_option( Initializer::SITEMAP_ENABLED_OPTION );
	}

	/**
	 * Reads the durable canonical-urls option without consulting the live module state
	 * when the option is present (set or explicitly off).
	 */
	public function test_is_canonical_enabled_reads_durable_option() {
		$method = new \ReflectionMethod( Initializer::class, 'is_canonical_enabled' );
		// Required to invoke a private method on PHP < 8.1 (a no-op from 8.1 on).
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		$modules = new \Automattic\Jetpack\Modules();

		update_option( Initializer::CANONICAL_ENABLED_OPTION, '1' );
		$this->assertTrue( $method->invoke( null, $modules ) );

		// Present-but-off: still read from the option, never the module fallback.
		update_option( Initializer::CANONICAL_ENABLED_OPTION, '' );
		$this->assertFalse( $method->invoke( null, $modules ) );

		delete_option( Initializer::CANONICAL_ENABLED_OPTION );
	}

	/**
	 * The Settings bootstrap sources `sitemap_active` / `canonical_active` from the durable
	 * options, so the module toggles hydrate correctly without reading live module state.
	 */
	public function test_get_settings_data_reads_module_toggles_from_options() {
		update_option( Initializer::SITEMAP_ENABLED_OPTION, '1' );
		update_option( Initializer::CANONICAL_ENABLED_OPTION, '' );

		$settings = Initializer::get_settings_data();

		$this->assertArrayHasKey( 'sitemap_active', $settings );
		$this->assertArrayHasKey( 'canonical_active', $settings );
		$this->assertArrayHasKey( 'schema', $settings );
		$this->assertArrayHasKey( 'organization', $settings['schema'] );
		$this->assertArrayHasKey( 'defaults', $settings['schema'] );
		$this->assertTrue( $settings['sitemap_active'] );
		$this->assertFalse( $settings['canonical_active'] );

		delete_option( Initializer::SITEMAP_ENABLED_OPTION );
		delete_option( Initializer::CANONICAL_ENABLED_OPTION );
	}

	/**
	 * On self-hosted sites, discoverability is driven by the durable cohort option:
	 * hidden when absent (the non-disruptive default) or empty, visible when set.
	 */
	public function test_is_seo_surface_visible_reads_cohort_option_on_self_hosted() {
		delete_option( Initializer::VISIBILITY_OPTION );
		$this->assertFalse( Initializer::is_seo_surface_visible() );

		update_option( Initializer::VISIBILITY_OPTION, '1' );
		$this->assertTrue( Initializer::is_seo_surface_visible() );

		update_option( Initializer::VISIBILITY_OPTION, '' );
		$this->assertFalse( Initializer::is_seo_surface_visible() );

		delete_option( Initializer::VISIBILITY_OPTION );
	}

	/**
	 * WordPress.com sites (here: Simple, via the IS_WPCOM constant) are always
	 * discoverable, bypassing the cohort option entirely.
	 */
	public function test_is_seo_surface_visible_always_true_on_wpcom() {
		delete_option( Initializer::VISIBILITY_OPTION ); // Hidden for self-hosted...
		\Automattic\Jetpack\Constants::set_constant( 'IS_WPCOM', true );

		try {
			$this->assertTrue( Initializer::is_seo_surface_visible() );
		} finally {
			\Automattic\Jetpack\Constants::clear_single_constant( 'IS_WPCOM' );
		}
	}

	/**
	 * The opt-in is offered only when the feature flag is on AND the surface is still
	 * hidden (a self-hosted install that hasn't opted in).
	 */
	public function test_is_optin_available_requires_flag_and_hidden_surface() {
		delete_option( Initializer::VISIBILITY_OPTION );

		// Flag off → never available.
		$this->assertFalse( Initializer::is_optin_available() );

		add_filter( Initializer::FEATURE_FILTER, '__return_true' );
		try {
			// Flag on + surface hidden → available.
			$this->assertTrue( Initializer::is_optin_available() );

			// Flag on + surface visible (already opted in) → not available.
			update_option( Initializer::VISIBILITY_OPTION, '1' );
			$this->assertFalse( Initializer::is_optin_available() );
		} finally {
			remove_filter( Initializer::FEATURE_FILTER, '__return_true' );
			delete_option( Initializer::VISIBILITY_OPTION );
		}
	}

	/**
	 * The script-data injector surfaces opt-in availability under the `seo.optin_available`
	 * key (read by the legacy Traffic-page banner), and tolerates non-array input.
	 */
	public function test_inject_optin_availability_surfaces_flag_state() {
		delete_option( Initializer::VISIBILITY_OPTION );

		// Flag off → false, and non-array input is normalized to an array. Surface is also
		// hidden (no cohort option set on this self-hosted test site).
		$data = Initializer::inject_optin_availability( null );
		$this->assertFalse( $data[ Initializer::SCRIPT_DATA_KEY ]['optin_available'] );
		$this->assertFalse( $data[ Initializer::SCRIPT_DATA_KEY ]['surface_visible'] );

		// Flag on + surface hidden → opt-in offered, surface not yet visible; existing keys preserved.
		add_filter( Initializer::FEATURE_FILTER, '__return_true' );
		try {
			$data = Initializer::inject_optin_availability( array( 'keep' => 1 ) );
			$this->assertTrue( $data[ Initializer::SCRIPT_DATA_KEY ]['optin_available'] );
			$this->assertFalse( $data[ Initializer::SCRIPT_DATA_KEY ]['surface_visible'] );
			$this->assertSame( 1, $data['keep'] );

			// Opted in → surface visible, opt-in no longer offered.
			update_option( Initializer::VISIBILITY_OPTION, '1' );
			$data = Initializer::inject_optin_availability( array() );
			$this->assertTrue( $data[ Initializer::SCRIPT_DATA_KEY ]['surface_visible'] );
			$this->assertFalse( $data[ Initializer::SCRIPT_DATA_KEY ]['optin_available'] );
		} finally {
			remove_filter( Initializer::FEATURE_FILTER, '__return_true' );
			delete_option( Initializer::VISIBILITY_OPTION );
		}
	}

	/**
	 * The Settings tab only links to the sitemap when it is genuinely reachable.
	 * The URL helper short-circuits to an empty string when generation is disabled
	 * or the site is private, and (in the package-only test context, where the
	 * Jetpack plugin's Sitemaps module is absent) when the librarian/URL helper are
	 * unavailable — so the non-empty branch is exercised by plugin integration
	 * tests, not here.
	 */
	public function test_get_reachable_sitemap_url_returns_empty_when_not_reachable() {
		$method = new \ReflectionMethod( Initializer::class, 'get_reachable_sitemap_url' );
		// Required to invoke a private method on PHP < 8.1 (a no-op from 8.1 on).
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		// Capture the original so we restore (not delete) it — `blog_public` is a
		// core option the test bootstrap may already set, and clobbering it would
		// leak state into other tests.
		$original_blog_public = get_option( 'blog_public', null );

		try {
			// Generation disabled: no link regardless of anything else.
			update_option( 'blog_public', '1' );
			$this->assertSame( '', $method->invoke( null, false ) );

			// Enabled but the site discourages search engines: Jetpack never serves a
			// sitemap, so there is nothing to link to.
			update_option( 'blog_public', '0' );
			$this->assertSame( '', $method->invoke( null, true ) );

			// Enabled and public, but the Sitemaps module (librarian + URL helper) is
			// absent in the package context, so still no link.
			update_option( 'blog_public', '1' );
			$this->assertSame( '', $method->invoke( null, true ) );
		} finally {
			if ( null === $original_blog_public ) {
				delete_option( 'blog_public' );
			} else {
				update_option( 'blog_public', $original_blog_public );
			}
		}
	}

	/**
	 * The Settings bootstrap exposes `sitemap_url` as a string (empty until the
	 * sitemap is reachable) alongside the boolean `sitemap_active`, which the
	 * Settings tab uses to render the "View sitemap" link. The Overview no longer
	 * carries the URL — it shows the status only.
	 */
	public function test_get_settings_data_sitemap_url_is_string() {
		$settings = Initializer::get_settings_data();

		$this->assertArrayHasKey( 'sitemap_active', $settings );
		$this->assertIsBool( $settings['sitemap_active'] );
		$this->assertArrayHasKey( 'sitemap_url', $settings );
		$this->assertIsString( $settings['sitemap_url'] );

		$overview = Initializer::get_overview_data();
		$this->assertArrayNotHasKey( 'sitemap_url', $overview['site_visibility'] );
	}
}
