<?php
/**
 * Post_Type_Filter helper tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Tests for Post_Type_Filter helpers — list normalization, conflict
 * resolution between include / exclude, and multi-instance state merging.
 */
class Post_Type_Filter_Test extends TestCase {

	/**
	 * Register the fixture post types each test relies on. `product` and
	 * `shop_order` mirror common WooCommerce CPTs the block is most likely
	 * to scope. Built-in `post` / `page` are always registered.
	 *
	 * `setUp` runs after the in-class static cache for `searchable_post_type_slugs`
	 * may have been seeded by prior tests, so each test re-resets the cache via
	 * the helper below.
	 */
	protected function setUp(): void {
		parent::setUp();
		register_post_type(
			'product',
			array(
				'public'              => true,
				'exclude_from_search' => false,
				'labels'              => array( 'singular_name' => 'Product' ),
			)
		);
		register_post_type(
			'shop_order',
			array(
				'public'              => true,
				'exclude_from_search' => false,
				'labels'              => array( 'singular_name' => 'Order' ),
			)
		);
		// A type opted out of search; build_lists() must drop it from
		// include and exclude lists alike.
		register_post_type(
			'private_doc',
			array(
				'public'              => false,
				'exclude_from_search' => true,
				'labels'              => array( 'singular_name' => 'Private Doc' ),
			)
		);
		// Reset the cached registry on each test so a register/unregister
		// in another test can't leak through.
		$this->reset_searchable_cache();
	}

	protected function tearDown(): void {
		unregister_post_type( 'product' );
		unregister_post_type( 'shop_order' );
		unregister_post_type( 'private_doc' );
		$this->reset_searchable_cache();
		parent::tearDown();
	}

	/**
	 * Reset the static cache `searchable_post_type_slugs()` keeps. Uses
	 * Reflection because the helper is private — preferable to making the
	 * cache `protected`/`public` purely for test access.
	 */
	private function reset_searchable_cache(): void {
		// PHP 8.1+ no longer requires setAccessible() for non-public
		// reflection access; calling it triggers a deprecation on 8.5+.
		( new \ReflectionClass( Post_Type_Filter::class ) )
			->getProperty( 'searchable_cache' )
			->setValue( null, null );
	}

	/**
	 * Empty / missing attributes produce empty include and exclude lists so
	 * an unconfigured block contributes nothing to the search constraint.
	 */
	public function test_build_lists_returns_empty_for_missing_attributes() {
		$this->assertSame(
			array(
				'include' => array(),
				'exclude' => array(),
			),
			Post_Type_Filter::build_lists( array() )
		);
	}

	/**
	 * Slugs are sanitized via `sanitize_key`, deduplicated, re-indexed, and
	 * filtered against the live post-type registry — anything not registered
	 * with `exclude_from_search => false` is dropped so a stray slug can't
	 * collapse every search to zero results by reaching ES.
	 */
	public function test_build_lists_sanitizes_dedupes_and_validates_slugs() {
		$lists = Post_Type_Filter::build_lists(
			array(
				'include' => array( 'Post', 'page', 'page', '<bad>', '', 'unregistered_cpt' ),
				'exclude' => array( 'product', 'product' ),
			)
		);
		// `Post` lowercases to `post`; `<bad>` sanitizes to `bad` and gets
		// dropped because no `bad` post type is registered. The blank entry
		// and the duplicate `page` are silently filtered.
		$this->assertSame( array( 'post', 'page' ), $lists['include'] );
		$this->assertSame( array( 'product' ), $lists['exclude'] );
	}

	/**
	 * Post types registered with `exclude_from_search => true` are dropped
	 * from both lists. Listing one would either zero results (if in
	 * include — the type is invisible to search) or be a no-op (if in
	 * exclude — the type is already absent from the result set).
	 */
	public function test_build_lists_drops_search_excluded_post_types() {
		$lists = Post_Type_Filter::build_lists(
			array(
				'include' => array( 'post', 'private_doc' ),
				'exclude' => array( 'private_doc', 'product' ),
			)
		);
		$this->assertSame( array( 'post' ), $lists['include'] );
		$this->assertSame( array( 'product' ), $lists['exclude'] );
	}

	/**
	 * Non-array / non-scalar values are dropped silently — an attribute
	 * stored as a string or an object would otherwise trip a fatal in
	 * `sanitize_key`. Normalization is the boundary at which malformed
	 * input is contained.
	 */
	public function test_build_lists_drops_non_scalar_values() {
		$lists = Post_Type_Filter::build_lists(
			array(
				'include' => 'not-an-array',
				'exclude' => array( 'page', array( 'nested' ), null, false, 'product' ),
			)
		);
		$this->assertSame( array(), $lists['include'] );
		$this->assertSame( array( 'page', 'product' ), $lists['exclude'] );
	}

	/**
	 * Slugs that appear in both include and exclude are dropped from the
	 * exclude list. Listing a slug in both is contradictory user input —
	 * the include clause already restricts results to that set, so the
	 * exclude entry is at best redundant and at worst confusing for
	 * future readers of the saved attributes.
	 */
	public function test_build_lists_drops_excludes_that_collide_with_includes() {
		$lists = Post_Type_Filter::build_lists(
			array(
				'include' => array( 'post', 'page' ),
				'exclude' => array( 'page', 'product' ),
			)
		);
		$this->assertSame( array( 'post', 'page' ), $lists['include'] );
		$this->assertSame( array( 'product' ), $lists['exclude'] );
	}

	/**
	 * Exclusion-only configs leave the exclude list untouched — the
	 * include-collision normalization only applies when the include list
	 * is non-empty.
	 */
	public function test_build_lists_keeps_exclude_when_include_is_empty() {
		$lists = Post_Type_Filter::build_lists(
			array(
				'include' => array(),
				'exclude' => array( 'product', 'shop_order' ),
			)
		);
		$this->assertSame( array(), $lists['include'] );
		$this->assertSame( array( 'product', 'shop_order' ), $lists['exclude'] );
	}

	/**
	 * Multi-instance composition is union, not intersection — picking
	 * intersection would silently zero out results when an editor stacks
	 * two blocks configured for non-overlapping post types.
	 */
	public function test_merge_state_unions_lists_across_instances() {
		$merged = Post_Type_Filter::merge_state(
			array(
				'include' => array( 'post' ),
				'exclude' => array( 'product' ),
			),
			array(
				'include' => array( 'page' ),
				'exclude' => array( 'shop_order' ),
			)
		);
		$this->assertSame( array( 'post', 'page' ), $merged['include'] );
		$this->assertSame( array( 'product', 'shop_order' ), $merged['exclude'] );
	}

	/**
	 * After merge, the include/exclude exclusivity normalization is
	 * re-applied: a slug newly added to the include set must not stay in
	 * the exclude set inherited from a previous instance.
	 */
	public function test_merge_state_reapplies_include_exclude_normalization() {
		$merged = Post_Type_Filter::merge_state(
			array(
				'include' => array( 'post' ),
				'exclude' => array( 'page' ),
			),
			array(
				'include' => array( 'page' ),
				'exclude' => array(),
			)
		);
		$this->assertSame( array( 'post', 'page' ), $merged['include'] );
		$this->assertSame( array(), $merged['exclude'] );
	}

	/**
	 * Existing state may carry malformed entries (e.g. from a future field
	 * shape change); the merge sanitizes both sides before unioning so a
	 * stray non-array value can't poison the merged output. `merge_state`
	 * does not enforce the registry allowlist on the existing-state side
	 * (already-filtered by the contributing block's own `build_lists()`
	 * call) — `42` survives sanitize_key as the string `"42"`.
	 */
	public function test_merge_state_sanitizes_existing_state() {
		$merged = Post_Type_Filter::merge_state(
			array(
				'include' => 'malformed',
				'exclude' => array( 'product', 42 ),
			),
			array(
				'include' => array( 'post' ),
				'exclude' => array( 'shop_order' ),
			)
		);
		$this->assertSame( array( 'post' ), $merged['include'] );
		$this->assertSame( array( 'product', '42', 'shop_order' ), $merged['exclude'] );
	}
}
