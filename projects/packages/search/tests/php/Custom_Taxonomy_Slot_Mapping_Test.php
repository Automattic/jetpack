<?php
/**
 * Custom_Taxonomy_Slot_Mapping class tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Tests for the slot-mapping class extracted from Search_Blocks.
 *
 * Behaviors that need real `term_relationships` persistence (e.g. asserting
 * `wp_get_object_terms()` returns the mirrored names) aren't pinned here
 * because the WorDBless harness doesn't fully implement that table — those
 * paths are verified in a live dev env. The tests in this file pin the
 * narrower contracts that *are* observable in WorDBless: taxonomy
 * registration shape, the `set_object_terms` action propagation, and the
 * map-gating behavior.
 */
class Custom_Taxonomy_Slot_Mapping_Test extends TestCase {

	/**
	 * Clear the per-request map memo between tests so each one reads the
	 * filter callback registered inside its own arrange phase.
	 */
	protected function tearDown(): void {
		Custom_Taxonomy_Slot_Mapping::reset_cache_for_testing();
		parent::tearDown();
	}

	/**
	 * `register_slot_taxonomies()` registers each in-use slot as a private
	 * shadow taxonomy on the same object types as the user-side source.
	 * Without this the slot has no `term_taxonomy` row for
	 * `wp_set_object_terms()` to attach against, so the mirror would
	 * silently no-op.
	 */
	public function test_register_slot_taxonomies_registers_slots_attached_to_source_object_types() {
		register_taxonomy( 'genre', 'post', array( 'public' => true ) );
		$callback = static function ( $map ) {
			$map['genre'] = 'jetpack-search-tag1';
			return $map;
		};
		add_filter( 'jetpack_search_custom_taxonomy_map', $callback );
		try {
			Custom_Taxonomy_Slot_Mapping::register_slot_taxonomies();
			$this->assertTrue( taxonomy_exists( 'jetpack-search-tag1' ) );
			$tax = get_taxonomy( 'jetpack-search-tag1' );
			$this->assertContains( 'post', (array) $tax->object_type );
			$this->assertFalse( $tax->public, 'Slot taxonomy must be private — no UI, REST, or rewrites.' );
			$this->assertFalse( $tax->show_in_rest );
			$this->assertFalse( $tax->show_ui );
			$this->assertFalse( $tax->hierarchical );
		} finally {
			remove_filter( 'jetpack_search_custom_taxonomy_map', $callback );
			unregister_taxonomy( 'jetpack-search-tag1' );
			unregister_taxonomy( 'genre' );
		}
	}

	/**
	 * No-op when the map is empty — sites without a slot mapping (the
	 * default) shouldn't accumulate phantom slot taxonomies. The map filter
	 * doubles as the on/off switch, so an empty return means "feature off."
	 */
	public function test_register_slot_taxonomies_no_op_when_map_empty() {
		Custom_Taxonomy_Slot_Mapping::register_slot_taxonomies();
		$this->assertFalse( taxonomy_exists( 'jetpack-search-tag1' ) );
	}

	/**
	 * The mirror hook calls `wp_set_object_terms()` on the slot whenever a
	 * mapped user-side taxonomy is written. End-to-end behavior (term row
	 * persistence and ES indexing) is verified in a live dev env — the
	 * WorDBless harness doesn't fully implement `term_relationships`
	 * storage. The narrowest thing we can pin here is the *call*: when a
	 * mapped taxonomy is written, `wp_set_object_terms()` is invoked on
	 * the corresponding slot. We observe the inner call by hooking
	 * `set_object_terms` at priority 5 (the mirror runs at 10) and
	 * capturing the slot-taxonomy event.
	 */
	public function test_mirror_assignment_invokes_slot_write_for_mapped_taxonomy() {
		register_taxonomy( 'genre', 'post', array( 'public' => true ) );
		$callback = static function ( $map ) {
			$map['genre'] = 'jetpack-search-tag1';
			return $map;
		};
		add_filter( 'jetpack_search_custom_taxonomy_map', $callback );

		$captured = array();
		$listener = static function ( $object_id, $terms, $tt_ids, $taxonomy ) use ( &$captured ) {
			$captured[] = $taxonomy;
		};
		add_action( 'set_object_terms', $listener, 5, 6 );
		add_action( 'set_object_terms', array( Custom_Taxonomy_Slot_Mapping::class, 'mirror_assignment' ), 10, 6 );

		try {
			Custom_Taxonomy_Slot_Mapping::register_slot_taxonomies();
			$post_id = wp_insert_post(
				array(
					'post_title'  => 'mirror test',
					'post_status' => 'publish',
				)
			);
			wp_set_object_terms( $post_id, array( 'Fantasy' ), 'genre', false );

			$this->assertContains( 'genre', $captured, 'Outer set_object_terms call must fire.' );
			$this->assertContains( 'jetpack-search-tag1', $captured, 'Mirror must invoke wp_set_object_terms on the slot.' );
		} finally {
			remove_action( 'set_object_terms', $listener, 5 );
			remove_action( 'set_object_terms', array( Custom_Taxonomy_Slot_Mapping::class, 'mirror_assignment' ), 10 );
			remove_filter( 'jetpack_search_custom_taxonomy_map', $callback );
			unregister_taxonomy( 'jetpack-search-tag1' );
			unregister_taxonomy( 'genre' );
		}
	}

	/**
	 * An unmapped taxonomy must not trigger any slot writes — the mirror is
	 * gated by the presence of a `jetpack_search_custom_taxonomy_map` entry.
	 * Without this gate, every `wp_set_object_terms()` call on the site
	 * would pay the cost of a `wp_get_object_terms()` round-trip for
	 * nothing.
	 */
	public function test_mirror_assignment_skips_unmapped_taxonomies() {
		register_taxonomy( 'mood', 'post', array( 'public' => true ) );

		$captured = array();
		$listener = static function ( $object_id, $terms, $tt_ids, $taxonomy ) use ( &$captured ) {
			$captured[] = $taxonomy;
		};
		add_action( 'set_object_terms', $listener, 5, 6 );
		add_action( 'set_object_terms', array( Custom_Taxonomy_Slot_Mapping::class, 'mirror_assignment' ), 10, 6 );

		try {
			$post_id = wp_insert_post(
				array(
					'post_title'  => 'mirror test',
					'post_status' => 'publish',
				)
			);
			wp_set_object_terms( $post_id, array( 'Happy' ), 'mood', false );

			$this->assertContains( 'mood', $captured );
			// No slot was registered and no mirror call fired.
			$this->assertFalse( taxonomy_exists( 'jetpack-search-tag1' ) );
			foreach ( $captured as $tax ) {
				$this->assertStringStartsNotWith( 'jetpack-search-tag', $tax );
			}
		} finally {
			remove_action( 'set_object_terms', $listener, 5 );
			remove_action( 'set_object_terms', array( Custom_Taxonomy_Slot_Mapping::class, 'mirror_assignment' ), 10 );
			unregister_taxonomy( 'mood' );
		}
	}

	/**
	 * `get_map()` is the single source of truth. The feature is off by
	 * default — the filter returns an empty array unless a site adds an
	 * entry.
	 */
	public function test_get_map_empty_by_default() {
		$this->assertSame( array(), Custom_Taxonomy_Slot_Mapping::get_map() );
	}

	/**
	 * Valid entries pass through; the validation branches (invalid slot,
	 * duplicate slot, non-array return) are pinned in `Search_Blocks_Test`
	 * via the proxy and don't need duplication here.
	 */
	public function test_get_map_accepts_valid_entries() {
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
				Custom_Taxonomy_Slot_Mapping::get_map()
			);
		} finally {
			remove_filter( 'jetpack_search_custom_taxonomy_map', $callback );
		}
	}

	/**
	 * `resolve_slot()` routes mapped slugs to their slot and built-ins to
	 * themselves regardless of map content — a stray map entry must not
	 * silently redirect a built-in filter.
	 */
	public function test_resolve_slot_routes_mapped_and_built_in_slugs_correctly() {
		$callback = static function ( $map ) {
			$map['genre']    = 'jetpack-search-tag1';
			$map['category'] = 'jetpack-search-tag9'; // ignored — built-in.
			return $map;
		};
		add_filter( 'jetpack_search_custom_taxonomy_map', $callback );
		try {
			$this->assertSame( '', Custom_Taxonomy_Slot_Mapping::resolve_slot( '' ) );
			$this->assertSame( 'jetpack-search-tag1', Custom_Taxonomy_Slot_Mapping::resolve_slot( 'genre' ) );
			$this->assertSame( 'mood', Custom_Taxonomy_Slot_Mapping::resolve_slot( 'mood' ) );
			$this->assertSame( 'category', Custom_Taxonomy_Slot_Mapping::resolve_slot( 'category' ) );
			$this->assertSame( 'product_cat', Custom_Taxonomy_Slot_Mapping::resolve_slot( 'product_cat' ) );
		} finally {
			remove_filter( 'jetpack_search_custom_taxonomy_map', $callback );
		}
	}
}
