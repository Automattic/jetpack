<?php

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Search\TestCase as Search_TestCase;

/**
 * Unit tests for the Search_Template singleton CPT and its integration with
 * Search_Blocks's classic-theme render path.
 *
 * @package automattic/jetpack-search
 */
class Search_Template_Test extends Search_TestCase {

	public function setUp(): void {
		parent::setUp();
		// The classmap-registered CPT needs to be live so wp_insert_post
		// can stamp the right post_type. register_post_type() is
		// idempotent.
		Search_Template::register_post_type();
		Search_Template::reset_customized_content_cache();
		delete_option( Search_Template::OPTION_POST_ID );
	}

	public function tearDown(): void {
		// Force-delete any singleton this test class created so other
		// tests start clean.
		$post_id = (int) get_option( Search_Template::OPTION_POST_ID, 0 );
		if ( $post_id ) {
			wp_delete_post( $post_id, true );
		}
		delete_option( Search_Template::OPTION_POST_ID );
		Search_Template::reset_customized_content_cache();
		parent::tearDown();
	}

	/**
	 * `Search_Template` and `Overlay_Template` must declare distinct
	 * post-type / option / nonce identifiers — they're keyed by class
	 * constant on the shared base so a typo collision would let two
	 * subclasses share one singleton.
	 */
	public function test_subclass_constants_are_distinct_from_overlay() {
		$this->assertNotSame( Overlay_Template::POST_TYPE, Search_Template::POST_TYPE );
		$this->assertNotSame( Overlay_Template::REST_BASE, Search_Template::REST_BASE );
		$this->assertNotSame( Overlay_Template::OPTION_POST_ID, Search_Template::OPTION_POST_ID );
		$this->assertNotSame( Overlay_Template::EDITOR_REQUEST_KEY, Search_Template::EDITOR_REQUEST_KEY );
		$this->assertNotSame( Overlay_Template::EDITOR_NONCE, Search_Template::EDITOR_NONCE );
		$this->assertSame( 'jp_search_template', Search_Template::POST_TYPE );
		$this->assertLessThanOrEqual(
			20,
			strlen( Search_Template::POST_TYPE ),
			'register_post_type() limits the slug to 20 chars; staying under is a hard requirement.'
		);
	}

	/**
	 * No singleton on file ⇒ `get_customized_content()` returns null,
	 * `is_customized()` is false. The shape callers depend on to fall
	 * back to the bundled template.
	 */
	public function test_uncustomized_state_returns_nulls() {
		$this->assertNull( Search_Template::get_customized_content() );
		$this->assertFalse( Search_Template::is_customized() );
		$this->assertSame( 0, Search_Template::get_post_id() );
	}

	/**
	 * A saved customization round-trips: `get_customized_content()`
	 * returns the post content, `is_customized()` flips true.
	 */
	public function test_customized_state_returns_post_content() {
		$post_id = wp_insert_post(
			array(
				'post_type'    => Search_Template::POST_TYPE,
				'post_status'  => 'publish',
				'post_title'   => 'Search Template Test',
				'post_content' => '<!-- wp:paragraph --><p>SENTINEL_CONTENT</p><!-- /wp:paragraph -->',
			)
		);
		$this->assertIsInt( $post_id );
		$this->assertGreaterThan( 0, $post_id );
		update_option( Search_Template::OPTION_POST_ID, $post_id );
		Search_Template::reset_customized_content_cache();

		$this->assertSame(
			'<!-- wp:paragraph --><p>SENTINEL_CONTENT</p><!-- /wp:paragraph -->',
			Search_Template::get_customized_content()
		);
		$this->assertTrue( Search_Template::is_customized() );
	}

	/**
	 * A trashed singleton must be treated as "no customization" — the
	 * front end already falls back to the bundled template in that
	 * state, and surfacing `isCustomized=true` to the dashboard would
	 * show a "Restore default" link with nothing to restore.
	 */
	public function test_trashed_singleton_reads_as_uncustomized() {
		$post_id = wp_insert_post(
			array(
				'post_type'    => Search_Template::POST_TYPE,
				'post_status'  => 'publish',
				'post_content' => 'trash-test',
			)
		);
		update_option( Search_Template::OPTION_POST_ID, $post_id );
		wp_trash_post( $post_id );
		Search_Template::reset_customized_content_cache();

		$this->assertNull( Search_Template::get_customized_content() );
		$this->assertFalse( Search_Template::is_customized() );
	}

	/**
	 * The editor URL must carry both the request key + a verified
	 * nonce so a CSRF can't lazy-create the singleton on behalf of an
	 * authenticated admin.
	 */
	public function test_editor_url_includes_request_key_and_nonce() {
		// nonces depend on a current user.
		$user_id = wp_create_user( 'search_template_test_admin', 'p', 'admin@example.com' );
		( new \WP_User( $user_id ) )->set_role( 'administrator' );
		wp_set_current_user( $user_id );

		try {
			$url = Search_Template::get_editor_url();
			parse_str( wp_parse_url( $url, PHP_URL_QUERY ), $params );

			$this->assertSame( '1', $params[ Search_Template::EDITOR_REQUEST_KEY ] ?? null );
			$this->assertNotEmpty( $params['_wpnonce'] ?? '' );
			$this->assertSame(
				1,
				wp_verify_nonce( $params['_wpnonce'], Search_Template::EDITOR_NONCE )
			);
		} finally {
			wp_delete_user( $user_id );
			wp_set_current_user( 0 );
		}
	}

	/**
	 * The seed content for a fresh singleton is exactly what
	 * `Search_Blocks::get_classic_theme_search_body()` returns —
	 * placeholders substituted, template-part wrappers stripped — so
	 * the editor opens populated with the same markup the front end
	 * renders.
	 */
	public function test_seed_content_matches_classic_theme_search_body() {
		$seed = Search_Blocks::get_classic_theme_search_body();
		$this->assertNotEmpty( $seed );
		$this->assertStringNotContainsString( 'wp:template-part', $seed, 'Seed must have template-parts stripped.' );
		$this->assertStringContainsString( 'wp:jetpack-search/search-input', $seed );
	}

	/**
	 * `Search_Blocks::get_classic_theme_search_body()` must prefer a
	 * saved customization over the bundled file — the whole point of
	 * the CPT path. An empty string customization (admin saved a blank
	 * canvas) is honored verbatim.
	 */
	public function test_classic_theme_search_body_prefers_customization() {
		$post_id = wp_insert_post(
			array(
				'post_type'    => Search_Template::POST_TYPE,
				'post_status'  => 'publish',
				'post_content' => '<!-- wp:heading --><h2>CUSTOMIZED</h2><!-- /wp:heading -->',
			)
		);
		update_option( Search_Template::OPTION_POST_ID, $post_id );
		Search_Template::reset_customized_content_cache();

		$body = Search_Blocks::get_classic_theme_search_body();
		$this->assertStringContainsString( 'CUSTOMIZED', $body );
		$this->assertStringNotContainsString( 'wp:jetpack-search/search-input', $body, 'When customized, the bundled body should NOT be merged in.' );
	}

	/**
	 * Class-keyed cache on the shared base must not cross-contaminate
	 * Overlay_Template and Search_Template lookups within a request —
	 * the base shares one static cache for `static::class` keying.
	 */
	public function test_subclass_caches_are_isolated() {
		// Prime Search_Template with a customization.
		$post_id = wp_insert_post(
			array(
				'post_type'    => Search_Template::POST_TYPE,
				'post_status'  => 'publish',
				'post_content' => 'SEARCH_TEMPLATE_CONTENT',
			)
		);
		update_option( Search_Template::OPTION_POST_ID, $post_id );
		Search_Template::reset_customized_content_cache();

		$this->assertSame( 'SEARCH_TEMPLATE_CONTENT', Search_Template::get_customized_content() );
		// Overlay_Template, having no singleton on file, must NOT pick
		// up Search_Template's cached content.
		$this->assertNull( Overlay_Template::get_customized_content() );
	}

	/**
	 * Deleting the singleton through any path (REST DELETE, post.php,
	 * wp_delete_post) clears the option pointer + per-request cache so
	 * the next render falls back to the bundled file. Cuts state-drift
	 * where the option still references a deleted post.
	 */
	public function test_delete_singleton_cleans_up_state() {
		$post_id = wp_insert_post(
			array(
				'post_type'    => Search_Template::POST_TYPE,
				'post_status'  => 'publish',
				'post_content' => 'will-be-deleted',
			)
		);
		update_option( Search_Template::OPTION_POST_ID, $post_id );
		Search_Template::reset_customized_content_cache();
		$this->assertTrue( Search_Template::is_customized() );

		wp_delete_post( $post_id, true );

		$this->assertSame( 0, Search_Template::get_post_id() );
		$this->assertNull( Search_Template::get_customized_content() );
		$this->assertFalse( Search_Template::is_customized() );
	}

	/**
	 * `init()` must register the CPT synchronously when invoked from inside
	 * an `init` callback. Adding a callback to the priority WordPress is
	 * currently iterating leaves it stranded by PHP's `foreach` snapshot —
	 * the regression that hid the CPT on downstream consumers hooking
	 * `Search_Blocks::init()` onto `init`.
	 */
	public function test_init_during_init_action_registers_cpt_synchronously() {
		unregister_post_type( Search_Template::POST_TYPE );
		$this->assertFalse( post_type_exists( Search_Template::POST_TYPE ) );

		global $wp_current_filter;
		$wp_current_filter[] = 'init';
		try {
			Search_Template::init();
			$this->assertTrue(
				post_type_exists( Search_Template::POST_TYPE ),
				'register_post_type() must run inline when init() is invoked from inside an init callback.'
			);
		} finally {
			array_pop( $wp_current_filter );
		}
	}

	/**
	 * `init()` must also register the CPT synchronously when invoked after
	 * `init` has already fired — `did_action( 'init' )` returns non-zero
	 * and queuing on `init:9` would be a permanent no-op.
	 */
	public function test_init_after_init_action_registers_cpt_synchronously() {
		unregister_post_type( Search_Template::POST_TYPE );
		$this->assertFalse( post_type_exists( Search_Template::POST_TYPE ) );

		// Bump the action counter that `did_action()` reads, without
		// dispatching `init` (which would re-fire every WP and plugin init
		// callback in the suite — heavy and unrelated to what we're testing).
		global $wp_actions;
		$prev_count         = $wp_actions['init'] ?? 0;
		$wp_actions['init'] = $prev_count + 1;
		try {
			$this->assertGreaterThan( 0, did_action( 'init' ) );
			Search_Template::init();
			$this->assertTrue(
				post_type_exists( Search_Template::POST_TYPE ),
				'register_post_type() must run inline when init() is invoked after init has fired.'
			);
		} finally {
			if ( 0 === $prev_count ) {
				unset( $wp_actions['init'] );
			} else {
				$wp_actions['init'] = $prev_count;
			}
		}
	}
}
