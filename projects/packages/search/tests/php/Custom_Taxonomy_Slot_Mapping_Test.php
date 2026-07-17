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
	 * `wp_remove_object_terms()` fires `deleted_term_relationships` instead
	 * of `set_object_terms`, so the `mirror_removal` hook is the only thing
	 * keeping the slot in lockstep on partial removals (CLI `wp post term
	 * remove`, plugin code, etc.). Use the same priority-5 observer pattern
	 * as the assignment test — we can't pin the persisted slot post-set in
	 * WorDBless, but we can pin the inner `wp_set_object_terms()` call
	 * fires against the slot taxonomy.
	 */
	public function test_mirror_removal_invokes_slot_write_for_mapped_taxonomy() {
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
		add_action( 'deleted_term_relationships', array( Custom_Taxonomy_Slot_Mapping::class, 'mirror_removal' ), 10, 3 );

		try {
			Custom_Taxonomy_Slot_Mapping::register_slot_taxonomies();
			$post_id = wp_insert_post(
				array(
					'post_title'  => 'removal test',
					'post_status' => 'publish',
				)
			);
			// Fire the action directly with synthetic args — WorDBless's
			// `wp_remove_object_terms()` doesn't persist term rows, so the
			// in-band path doesn't reach the hook. Direct invocation pins
			// the handler's behavior in isolation.
			do_action( 'deleted_term_relationships', $post_id, array( 1 ), 'genre' );

			$this->assertContains( 'jetpack-search-tag1', $captured, 'mirror_removal must invoke wp_set_object_terms on the slot.' );
		} finally {
			remove_action( 'set_object_terms', $listener, 5 );
			remove_action( 'deleted_term_relationships', array( Custom_Taxonomy_Slot_Mapping::class, 'mirror_removal' ), 10 );
			remove_filter( 'jetpack_search_custom_taxonomy_map', $callback );
			unregister_taxonomy( 'jetpack-search-tag1' );
			unregister_taxonomy( 'genre' );
		}
	}

	/**
	 * `mirror_deletion` short-circuits cleanly when the user-side taxonomy
	 * isn't mapped. Without the early return, every term deletion on the
	 * site would pay an unnecessary `get_term_by()` lookup. End-to-end
	 * verification (the actual `wp_delete_term` call against the slot) needs
	 * real term-row persistence — WorDBless doesn't carry `get_term_by()`
	 * results far enough for that, so we pin the gating in isolation here
	 * and verify the full path in a live dev env.
	 */
	public function test_mirror_deletion_skips_unmapped_taxonomies() {
		register_taxonomy( 'mood', 'post', array( 'public' => true ) );

		// Sentinel: if the handler escapes the unmapped-taxonomy gate, it
		// will call `wp_delete_term()` on a slot — which fires `delete_term`
		// recursively with a `jetpack-search-tag*` taxonomy. Capture every
		// taxonomy that hits this action and assert none of them are slot
		// taxonomies.
		$slot_deletions = array();
		$listener       = static function ( $term_id, $tt_id, $taxonomy ) use ( &$slot_deletions ) {
			if ( str_starts_with( (string) $taxonomy, 'jetpack-search-tag' ) ) {
				$slot_deletions[] = $taxonomy;
			}
		};
		add_action( 'delete_term', $listener, 5, 3 );
		add_action( 'delete_term', array( Custom_Taxonomy_Slot_Mapping::class, 'mirror_deletion' ), 10, 4 );

		try {
			$deleted_term       = new \stdClass();
			$deleted_term->name = 'Happy';
			$deleted_term->slug = 'happy';
			do_action( 'delete_term', 99, 99, 'mood', $deleted_term );

			$this->assertSame( array(), $slot_deletions, 'mirror_deletion must not touch slot taxonomies for unmapped sources.' );
		} finally {
			remove_action( 'delete_term', $listener, 5 );
			remove_action( 'delete_term', array( Custom_Taxonomy_Slot_Mapping::class, 'mirror_deletion' ), 10 );
			unregister_taxonomy( 'mood' );
		}
	}

	/**
	 * `mirror_deletion` bails when the deleted term object has no slug —
	 * defensive guard against malformed callers. Lookup-by-slug is the
	 * preferred match strategy because `get_term_by( 'name', ... )` is
	 * case-sensitive under non-default collations.
	 */
	public function test_mirror_deletion_bails_on_empty_slug() {
		register_taxonomy( 'genre', 'post', array( 'public' => true ) );
		$callback = static function ( $map ) {
			$map['genre'] = 'jetpack-search-tag1';
			return $map;
		};
		add_filter( 'jetpack_search_custom_taxonomy_map', $callback );
		Custom_Taxonomy_Slot_Mapping::register_slot_taxonomies();

		$slot_deletions = array();
		$listener       = static function ( $term_id, $tt_id, $taxonomy ) use ( &$slot_deletions ) {
			if ( str_starts_with( (string) $taxonomy, 'jetpack-search-tag' ) ) {
				$slot_deletions[] = $taxonomy;
			}
		};
		add_action( 'delete_term', $listener, 5, 3 );
		add_action( 'delete_term', array( Custom_Taxonomy_Slot_Mapping::class, 'mirror_deletion' ), 10, 4 );

		try {
			$deleted_term       = new \stdClass();
			$deleted_term->name = 'Fantasy';
			// Intentionally no `slug` — handler must bail.
			do_action( 'delete_term', 42, 42, 'genre', $deleted_term );

			$this->assertSame( array(), $slot_deletions );
		} finally {
			remove_action( 'delete_term', $listener, 5 );
			remove_action( 'delete_term', array( Custom_Taxonomy_Slot_Mapping::class, 'mirror_deletion' ), 10 );
			remove_filter( 'jetpack_search_custom_taxonomy_map', $callback );
			unregister_taxonomy( 'jetpack-search-tag1' );
			unregister_taxonomy( 'genre' );
		}
	}

	/**
	 * `backfill()` returns 0 when the map is empty — confirms the
	 * `feature off by default` invariant. End-to-end persistence is
	 * verified in a live dev env; this guard test pins the early-return
	 * shape.
	 */
	public function test_backfill_returns_zero_when_map_empty() {
		$this->assertSame( 0, Custom_Taxonomy_Slot_Mapping::backfill() );
	}

	/**
	 * `backfill()` skips map entries whose user-facing taxonomy isn't
	 * registered on the site — a defensive gate against half-configured
	 * mappings (taxonomy moved to a different plugin, plugin deactivated).
	 */
	public function test_backfill_skips_unregistered_user_taxonomies() {
		$callback = static function () {
			return array( 'never-registered' => 'jetpack-search-tag1' );
		};
		add_filter( 'jetpack_search_custom_taxonomy_map', $callback );
		try {
			$this->assertSame( 0, Custom_Taxonomy_Slot_Mapping::backfill() );
		} finally {
			remove_filter( 'jetpack_search_custom_taxonomy_map', $callback );
		}
	}

	/**
	 * `backfill( 'rebuild' )` runs the slot-taxonomy enumeration query
	 * before the per-post mirror — that's the wipe step. Observe the
	 * `pre_get_terms` action: in rebuild mode it fires with the slot
	 * taxonomy in `$query->query_vars['taxonomy']`; in mirror mode it
	 * never does.
	 *
	 * The actual `wp_delete_term()` calls and the resulting empty-slot
	 * state are verified in a live dev env — WorDBless's `get_terms()`
	 * doesn't enumerate freshly-inserted terms, so we can't observe the
	 * delete loop from this harness.
	 */
	public function test_backfill_rebuild_mode_runs_slot_enumeration() {
		register_taxonomy( 'genre', 'post', array( 'public' => true ) );
		$callback = static function ( $map ) {
			$map['genre'] = 'jetpack-search-tag1';
			return $map;
		};
		add_filter( 'jetpack_search_custom_taxonomy_map', $callback );
		Custom_Taxonomy_Slot_Mapping::register_slot_taxonomies();

		$slot_enumerations = array();
		$listener          = static function ( $query ) use ( &$slot_enumerations ) {
			$taxes = (array) ( $query->query_vars['taxonomy'] ?? array() );
			foreach ( $taxes as $tax ) {
				if ( 'jetpack-search-tag1' === $tax ) {
					$slot_enumerations[] = $tax;
				}
			}
		};
		add_action( 'pre_get_terms', $listener, 5 );

		try {
			Custom_Taxonomy_Slot_Mapping::backfill( 'rebuild' );
			$this->assertNotEmpty( $slot_enumerations, 'rebuild mode must enumerate the slot taxonomy before re-mirroring.' );
		} finally {
			remove_action( 'pre_get_terms', $listener, 5 );
			remove_filter( 'jetpack_search_custom_taxonomy_map', $callback );
			unregister_taxonomy( 'jetpack-search-tag1' );
			unregister_taxonomy( 'genre' );
		}
	}

	/**
	 * The default `mirror` mode must NOT enumerate the slot taxonomy —
	 * that's the cheap path that skips the wipe. If the enumeration ever
	 * leaks into the default path it'd silently double the runtime cost.
	 */
	public function test_backfill_default_mode_skips_slot_enumeration() {
		register_taxonomy( 'genre', 'post', array( 'public' => true ) );
		$callback = static function ( $map ) {
			$map['genre'] = 'jetpack-search-tag1';
			return $map;
		};
		add_filter( 'jetpack_search_custom_taxonomy_map', $callback );
		Custom_Taxonomy_Slot_Mapping::register_slot_taxonomies();

		$slot_enumerations = array();
		$listener          = static function ( $query ) use ( &$slot_enumerations ) {
			$taxes = (array) ( $query->query_vars['taxonomy'] ?? array() );
			foreach ( $taxes as $tax ) {
				if ( 'jetpack-search-tag1' === $tax ) {
					$slot_enumerations[] = $tax;
				}
			}
		};
		add_action( 'pre_get_terms', $listener, 5 );

		try {
			Custom_Taxonomy_Slot_Mapping::backfill();
			Custom_Taxonomy_Slot_Mapping::backfill( 'mirror' );
			$this->assertSame( array(), $slot_enumerations, 'mirror mode must never enumerate slot taxonomies.' );
		} finally {
			remove_action( 'pre_get_terms', $listener, 5 );
			remove_filter( 'jetpack_search_custom_taxonomy_map', $callback );
			unregister_taxonomy( 'jetpack-search-tag1' );
			unregister_taxonomy( 'genre' );
		}
	}

	/**
	 * An unknown mode string falls back to `mirror` (with a
	 * `_doing_it_wrong` notice) rather than crashing — defensive guard
	 * against typos in one-off scripts.
	 */
	public function test_backfill_falls_back_to_mirror_on_unknown_mode() {
		add_filter( 'doing_it_wrong_trigger_error', '__return_false' );
		try {
			$this->assertSame( 0, Custom_Taxonomy_Slot_Mapping::backfill( 'wipe-and-pray' ) );
		} finally {
			remove_filter( 'doing_it_wrong_trigger_error', '__return_false' );
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
