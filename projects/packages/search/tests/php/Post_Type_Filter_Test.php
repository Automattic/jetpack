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
	 * Slugs are sanitized via `sanitize_key`, deduplicated, and re-indexed
	 * so a malformed attribute can never reach the ES filter clause.
	 */
	public function test_build_lists_sanitizes_and_dedupes_slugs() {
		$lists = Post_Type_Filter::build_lists(
			array(
				'include' => array( 'Post', 'page', 'page', '<bad>', '' ),
				'exclude' => array( 'product', 'product' ),
			)
		);
		// `sanitize_key` lowercases and strips disallowed characters.
		$this->assertSame( array( 'post', 'page', 'bad' ), $lists['include'] );
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
	 * stray non-array value can't poison the merged output.
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
