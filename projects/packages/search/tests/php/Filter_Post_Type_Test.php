<?php
/**
 * Filter_Post_Type helper tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Tests for Filter_Post_Type helpers — single-mode constraint building
 * and registry-allowlist enforcement.
 */
class Filter_Post_Type_Test extends TestCase {

	/**
	 * Register the fixture post types each test relies on. `product` and
	 * `shop_order` mirror common WooCommerce CPTs the block is most likely
	 * to scope. Built-in `post` / `page` are always registered.
	 *
	 * `setUp` runs after the in-class static cache for `searchable_post_type_slugs`
	 * may have been seeded by prior tests, so each test re-resets the cache via
	 * Reflection below.
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
		// A type opted out of search; build_constraint() must drop it.
		register_post_type(
			'private_doc',
			array(
				'public'              => false,
				'exclude_from_search' => true,
				'labels'              => array( 'singular_name' => 'Private Doc' ),
			)
		);
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
	 * Reset the static cache `searchable_post_type_slugs()` keeps so tests
	 * that register/unregister fixtures see fresh registry data.
	 */
	private function reset_searchable_cache(): void {
		// PHP 7.2–8.0 require setAccessible(true) to read/write private
		// statics via Reflection; PHP 8.1 made the call a no-op and 8.5
		// emits a deprecation. Gate on the version so the package's full
		// CI matrix (PHP 7.2 through 8.5) stays green.
		$prop = ( new \ReflectionClass( Filter_Post_Type::class ) )->getProperty( 'searchable_cache' );
		if ( PHP_VERSION_ID < 80100 ) {
			$prop->setAccessible( true );
		}
		$prop->setValue( null, null );
	}

	/**
	 * Empty / missing attributes produce an all-empty constraint so an
	 * unconfigured block contributes nothing to the search query.
	 */
	public function test_build_constraint_returns_empty_for_missing_attributes() {
		$this->assertSame(
			array(
				'include' => array(),
				'exclude' => array(),
			),
			Filter_Post_Type::build_constraint( array() )
		);
	}

	/**
	 * Default mode is `exclude` — matches the SEARCH-145 motivating use
	 * case (the legacy `excluded_post_types` option). A block with only
	 * `postTypes` set populates the `exclude` side.
	 */
	public function test_build_constraint_defaults_to_exclude_mode() {
		$constraint = Filter_Post_Type::build_constraint(
			array( 'postTypes' => array( 'product' ) )
		);
		$this->assertSame( array(), $constraint['include'] );
		$this->assertSame( array( 'product' ), $constraint['exclude'] );
	}

	/**
	 * `mode: include` populates the `include` side and leaves `exclude`
	 * empty — single-mode UX guarantees only one side is ever set per block.
	 */
	public function test_build_constraint_include_mode_populates_include_only() {
		$constraint = Filter_Post_Type::build_constraint(
			array(
				'mode'      => 'include',
				'postTypes' => array( 'post', 'page' ),
			)
		);
		$this->assertSame( array( 'post', 'page' ), $constraint['include'] );
		$this->assertSame( array(), $constraint['exclude'] );
	}

	/**
	 * `mode: exclude` populates the `exclude` side and leaves `include` empty.
	 */
	public function test_build_constraint_exclude_mode_populates_exclude_only() {
		$constraint = Filter_Post_Type::build_constraint(
			array(
				'mode'      => 'exclude',
				'postTypes' => array( 'product' ),
			)
		);
		$this->assertSame( array(), $constraint['include'] );
		$this->assertSame( array( 'product' ), $constraint['exclude'] );
	}

	/**
	 * Unknown mode values fall back to `exclude` so a malformed attribute
	 * (older block schema, hand-edited markup) can't silently flip
	 * Exclude into Include and broaden results in the wrong direction.
	 */
	public function test_build_constraint_unknown_mode_falls_back_to_exclude() {
		$constraint = Filter_Post_Type::build_constraint(
			array(
				'mode'      => 'something-else',
				'postTypes' => array( 'product' ),
			)
		);
		$this->assertSame( array(), $constraint['include'] );
		$this->assertSame( array( 'product' ), $constraint['exclude'] );
	}

	/**
	 * Slugs are sanitized via `sanitize_key`, deduplicated, re-indexed, and
	 * filtered against the live post-type registry — anything not registered
	 * with `exclude_from_search => false` is dropped so a stray slug can't
	 * collapse every search to zero results by reaching ES.
	 */
	public function test_build_constraint_sanitizes_dedupes_and_validates_slugs() {
		$constraint = Filter_Post_Type::build_constraint(
			array(
				'mode'      => 'include',
				'postTypes' => array( 'Post', 'page', 'page', '<bad>', '', 'unregistered_cpt' ),
			)
		);
		// `Post` lowercases to `post`; `<bad>` sanitizes to `bad` and gets
		// dropped because no `bad` post type is registered.
		$this->assertSame( array( 'post', 'page' ), $constraint['include'] );
		$this->assertSame( array(), $constraint['exclude'] );
	}

	/**
	 * Post types registered with `exclude_from_search => true` are dropped.
	 * In include mode, listing one would zero results (the type is invisible
	 * to search); in exclude mode it would be a no-op (already absent).
	 */
	public function test_build_constraint_drops_search_excluded_post_types() {
		$exclude_constraint = Filter_Post_Type::build_constraint(
			array(
				'mode'      => 'exclude',
				'postTypes' => array( 'private_doc', 'product' ),
			)
		);
		$this->assertSame( array( 'product' ), $exclude_constraint['exclude'] );

		$include_constraint = Filter_Post_Type::build_constraint(
			array(
				'mode'      => 'include',
				'postTypes' => array( 'post', 'private_doc' ),
			)
		);
		$this->assertSame( array( 'post' ), $include_constraint['include'] );
	}

	/**
	 * Non-array / non-scalar postTypes are dropped silently — an attribute
	 * stored as a string or an object would otherwise trip a fatal in
	 * `sanitize_key`. Normalization is the boundary at which malformed
	 * input is contained.
	 */
	public function test_build_constraint_drops_non_scalar_values() {
		$string_input = Filter_Post_Type::build_constraint(
			array( 'postTypes' => 'not-an-array' )
		);
		$this->assertSame( array(), $string_input['exclude'] );

		$mixed_input = Filter_Post_Type::build_constraint(
			array( 'postTypes' => array( 'page', array( 'nested' ), null, false, 'product' ) )
		);
		$this->assertSame( array( 'page', 'product' ), $mixed_input['exclude'] );
	}
}
