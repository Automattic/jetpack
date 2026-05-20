<?php
/**
 * Custom taxonomy → reserved Jetpack Search slot mapping.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Power-user escape hatch for taxonomies that aren't natively indexed by
 * Jetpack Search.
 *
 * A site declares a mapping like
 *
 *     add_filter( 'jetpack_search_custom_taxonomy_map', function ( $map ) {
 *         $map['genre'] = 'jetpack-search-tag1';
 *         return $map;
 *     } );
 *
 * Then this class:
 *
 *  1. Registers each in-use slot (`jetpack-search-tag0`…`jetpack-search-tag9`)
 *     as a private shadow taxonomy on the same object types as its
 *     user-side source.
 *  2. Mirrors term assignments from the user-side taxonomy onto the slot
 *     on `set_object_terms`, `deleted_term_relationships`, and `delete_term`
 *     so Sync ships the slot rows to the WPCOM replicastore, where the
 *     Jetpack Search indexer picks them up (the slot taxonomies are on
 *     `Sync\Modules\Search::get_all_taxonomies()`; the user-facing slug
 *     usually isn't).
 *  3. Resolves a user-facing slug to its slot at query-build time
 *     (`Filter_Checkbox::build_config()` stores it on the filterConfig as
 *     `effectiveSlug`) so the front-end aggregates against the slot field.
 *
 * Default `apply_filters( 'jetpack_search_custom_taxonomy_map', array() )`
 * returns empty, so the feature is **off by default**: no slot taxonomies
 * registered, no mirroring, no query rewrite. The filter doubles as the
 * data declaration and the on/off switch — a site that doesn't add an
 * entry pays no runtime cost beyond a cached `isset()` check inside the
 * `set_object_terms` handler.
 *
 * See https://jetpack.com/support/search/frequently-asked-questions/#troubleshoot-custom-tax
 */
class Custom_Taxonomy_Slot_Mapping {

	/**
	 * Backfill modes accepted by `backfill()`.
	 *
	 * - `mirror`: default. Per-post replacement only. For each post that
	 *   currently has at least one user-side term, `wp_set_object_terms()`
	 *   resets the slot's post-set for that post to match the current
	 *   user-side names. **Posts that lost every user-side term during a
	 *   gap when the auto-mirror was inactive are *not* visited** — their
	 *   stale slot relationships orphan. Suitable for the common case:
	 *   one-time initialization on a site that has data predating the
	 *   mapping.
	 * - `rebuild`: full sweep. Every term in the slot taxonomy is deleted
	 *   first (which cascades to drop every slot term-relationship), then
	 *   the per-post mirror runs over the current user-side state. The
	 *   resulting slot is byte-for-byte a fresh projection of the user-side
	 *   taxonomy with no orphans. Use when a site has had the mapping
	 *   toggle on and off, changed slot, or otherwise believes the slot has
	 *   drifted. Costly on large sites — runs N deletes for N slot terms.
	 */
	const BACKFILL_MODES = array( 'mirror', 'rebuild' );

	/**
	 * Per-request memo backing `get_map()`. The map is validated once per
	 * request — re-running the validation on every filter-block render and
	 * on every API request would be wasted work, and the
	 * `_doing_it_wrong()` notices for a misconfigured map would multiply.
	 *
	 * @var array<string, string>|null
	 */
	private static $map_cache = null;

	/**
	 * Wire the bootstrap and mirror hooks. Called once from
	 * `Search_Blocks::init()`.
	 *
	 * The `set_object_terms` / `deleted_term_relationships` / `delete_term`
	 * hooks attach unconditionally — they short-circuit on `! isset( $map[ $taxonomy ] )`
	 * before any work, so the per-request cost on sites without a mapping
	 * is one cached array read + one `isset` call. Attaching unconditionally
	 * also avoids a load-order foot-gun where a site declares the map after
	 * `init` has already fired.
	 *
	 * The slot taxonomy registration runs at priority 20 so user-side
	 * taxonomies declared on the default priority 10 are present when we
	 * read their `object_type`.
	 */
	public static function init(): void {
		add_action( 'init', array( static::class, 'register_slot_taxonomies' ), 20 );
		add_action( 'set_object_terms', array( static::class, 'mirror_assignment' ), 10, 6 );
		// `wp_remove_object_terms()` (e.g. from `wp post term remove`) fires
		// `deleted_term_relationships` instead of `set_object_terms`, so the
		// slot would drift unless we mirror this path too. Block-editor saves
		// go through `wp_set_object_terms()` (the full replace path) and are
		// already covered by the `set_object_terms` hook above.
		add_action( 'deleted_term_relationships', array( static::class, 'mirror_removal' ), 10, 3 );
		add_action( 'delete_term', array( static::class, 'mirror_deletion' ), 10, 4 );
	}

	/**
	 * Map of user-facing custom taxonomy slug → reserved Jetpack Search
	 * index slot (`jetpack-search-tag0`…`jetpack-search-tag9`).
	 *
	 * Validation:
	 *  - Slot value must match `jetpack-search-tag[0-9]` exactly. Anything
	 *    else is dropped with a `_doing_it_wrong()` notice — silently
	 *    accepting an arbitrary string would route queries to a field that
	 *    doesn't exist in the index.
	 *  - Two user-slugs pointing at the same slot are rejected (only the
	 *    first wins) — both would merge their term spaces in the index and
	 *    the second filter would silently return results from the first.
	 *
	 * @return array<string, string>
	 */
	public static function get_map(): array {
		if ( null !== self::$map_cache ) {
			return self::$map_cache;
		}

		/**
		 * Map custom taxonomy slugs to a reserved Jetpack Search index slot.
		 *
		 * Default is an empty array, which leaves the slot-mapping feature
		 * entirely off — no slot taxonomies registered, no auto-mirror, no
		 * query rewrite. A site enables the feature by returning a non-empty
		 * map from this filter.
		 *
		 * @since 0.60.0
		 *
		 * @param array<string, string> $map Empty by default; entries shape
		 *                                   `[ 'user_slug' => 'jetpack-search-tagN' ]`.
		 */
		$raw = apply_filters( 'jetpack_search_custom_taxonomy_map', array() );
		if ( ! is_array( $raw ) ) {
			$msg = esc_html__( 'The jetpack_search_custom_taxonomy_map filter must return an array of user-slug => jetpack-search-tagN pairs.', 'jetpack-search-pkg' );
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $msg is esc_html__() output.
			_doing_it_wrong( 'jetpack_search_custom_taxonomy_map', $msg, 'jetpack-search-pkg 0.60.0' );
			self::$map_cache = array();
			return self::$map_cache;
		}

		$map        = array();
		$slot_owner = array();
		foreach ( $raw as $user_slug => $slot ) {
			if ( ! is_string( $user_slug ) || '' === $user_slug || ! is_string( $slot ) ) {
				continue;
			}
			$user_slug = sanitize_key( $user_slug );
			if ( '' === $user_slug ) {
				continue;
			}
			if ( ! preg_match( '/^jetpack-search-tag[0-9]$/', $slot ) ) {
				/* translators: 1: invalid slot value, 2: user-facing taxonomy slug */
				$msg = sprintf( esc_html__( 'Invalid Jetpack Search slot "%1$s" for taxonomy "%2$s"; expected one of jetpack-search-tag0…jetpack-search-tag9.', 'jetpack-search-pkg' ), esc_html( $slot ), esc_html( $user_slug ) );
				// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $msg is sprintf() of esc_html__() with esc_html()-wrapped args.
				_doing_it_wrong( 'jetpack_search_custom_taxonomy_map', $msg, 'jetpack-search-pkg 0.60.0' );
				continue;
			}
			if ( isset( $slot_owner[ $slot ] ) ) {
				/* translators: 1: slot, 2: first user-facing slug that owns the slot, 3: second user-facing slug attempting to claim it */
				$msg = sprintf( esc_html__( 'Slot "%1$s" is already mapped to "%2$s"; ignoring duplicate mapping from "%3$s".', 'jetpack-search-pkg' ), esc_html( $slot ), esc_html( $slot_owner[ $slot ] ), esc_html( $user_slug ) );
				// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $msg is sprintf() of esc_html__() with esc_html()-wrapped args.
				_doing_it_wrong( 'jetpack_search_custom_taxonomy_map', $msg, 'jetpack-search-pkg 0.60.0' );
				continue;
			}
			$map[ $user_slug ]   = $slot;
			$slot_owner[ $slot ] = $user_slug;
		}

		self::$map_cache = $map;
		return $map;
	}

	/**
	 * Resolve a user-facing taxonomy slug to the Elasticsearch field slug
	 * that should be queried for it. Returns the matching
	 * `jetpack-search-tagN` slot when the slug has an entry in `get_map()`,
	 * otherwise the slug itself. Built-in slugs that have their own
	 * dedicated variations (`category`, `post_tag`, and the WC product
	 * taxonomies) are returned verbatim so a stray map entry can never
	 * silently redirect a built-in filter onto a slot.
	 *
	 * Empty input returns empty so callers can pass the raw block attribute
	 * without a guard.
	 *
	 * @param string $taxonomy User-facing taxonomy slug.
	 * @return string Effective ES field slug.
	 */
	public static function resolve_slot( string $taxonomy ): string {
		if ( '' === $taxonomy ) {
			return '';
		}
		// Built-ins are anchored to their canonical field paths regardless
		// of whether a map entry tries to redirect them.
		if ( in_array( $taxonomy, Search_Blocks::BUILT_IN_CUSTOM_TAXONOMY_EXCLUSIONS, true ) ) {
			return $taxonomy;
		}
		$map = self::get_map();
		return $map[ $taxonomy ] ?? $taxonomy;
	}

	/**
	 * Reset the `get_map()` memo. Tests only — production WP runs a single
	 * request per process and the map is derived purely from a filter
	 * hook, so callers should never need to clear the cache.
	 *
	 * @internal
	 */
	public static function reset_cache_for_testing(): void {
		self::$map_cache = null;
	}

	/**
	 * Register each in-use Jetpack Search slot as a private shadow taxonomy
	 * on the same object types as its user-side source.
	 *
	 * The slot taxonomies need to be real registered taxonomies on the
	 * source site so `wp_set_object_terms()` accepts them and Sync's
	 * normal Terms / Term-Relationships modules ship them to the WPCOM
	 * replicastore. They're intentionally invisible — no UI, no REST, no
	 * rewrites, no admin column, no query var, no nav-menu surface —
	 * because authors only ever edit the user-side taxonomy (e.g. `genre`);
	 * `mirror_assignment()` keeps the slot taxonomy in lockstep behind
	 * the scenes.
	 *
	 * Hierarchical: forced flat. The WPCOM search proxy aggregates slot
	 * taxonomies as bag-of-terms and a parent/child relationship between
	 * slot terms wouldn't survive the round-trip anyway.
	 */
	public static function register_slot_taxonomies(): void {
		$map = self::get_map();
		if ( empty( $map ) ) {
			return;
		}
		// Collect the object_type union for each slot — a slot can shadow
		// taxonomies attached to different post types in principle (rare),
		// and registering the slot on the union is harmless when a single
		// taxonomy is involved.
		$object_types_by_slot = array();
		foreach ( $map as $user_slug => $slot ) {
			$tax = get_taxonomy( $user_slug );
			if ( ! $tax ) {
				continue;
			}
			foreach ( (array) $tax->object_type as $object_type ) {
				$object_types_by_slot[ $slot ][ $object_type ] = true;
			}
		}
		foreach ( $object_types_by_slot as $slot => $object_types ) {
			if ( taxonomy_exists( $slot ) ) {
				continue;
			}
			register_taxonomy(
				$slot,
				array_keys( $object_types ),
				array(
					'public'            => false,
					'show_ui'           => false,
					'show_in_menu'      => false,
					'show_in_rest'      => false,
					'show_in_nav_menus' => false,
					'show_admin_column' => false,
					'rewrite'           => false,
					'query_var'         => false,
					'hierarchical'      => false,
				)
			);
		}
	}

	/**
	 * Mirror term assignments from a mapped user-facing taxonomy onto the
	 * reserved slot. Fires on `set_object_terms` for every
	 * `wp_set_object_terms()` write; cheap no-op when the taxonomy isn't
	 * mapped (vast majority of calls).
	 *
	 * Uses term names rather than slugs / ids: the slot terms need to display
	 * the same label as the user-side terms (e.g. "Fantasy") in search
	 * results, and `wp_set_object_terms()` will create matching slot terms
	 * by name when none exist. Idempotent — re-running with the same source
	 * assignment is a no-op on the slot.
	 *
	 * Recursion is bounded by the `isset( $map[ $taxonomy ] )` gate: the
	 * inner `wp_set_object_terms()` call fires `set_object_terms` again
	 * with `$taxonomy = jetpack-search-tagN`, which is never a key in the
	 * user-facing map, so the second invocation returns immediately.
	 *
	 * @param int    $object_id  Post (or other object) id receiving the terms.
	 * @param array  $terms      Raw input from the caller (ignored — re-fetched).
	 * @param array  $tt_ids     Term taxonomy ids (unused).
	 * @param string $taxonomy   Taxonomy slug the assignment targeted.
	 * @param bool   $append     Whether the caller appended (unused — full mirror).
	 * @param array  $old_tt_ids Previous term taxonomy ids (unused).
	 */
	public static function mirror_assignment( $object_id, $terms, $tt_ids, $taxonomy, $append, $old_tt_ids ): void {
		unset( $terms, $tt_ids, $append, $old_tt_ids );

		$map = self::get_map();
		if ( ! isset( $map[ $taxonomy ] ) ) {
			return;
		}
		$slot = $map[ $taxonomy ];
		if ( ! taxonomy_exists( $slot ) ) {
			return;
		}
		$names = wp_get_object_terms( (int) $object_id, $taxonomy, array( 'fields' => 'names' ) );
		if ( is_wp_error( $names ) ) {
			return;
		}
		wp_set_object_terms( (int) $object_id, $names, $slot, false );
	}

	/**
	 * Mirror term *removals* (as opposed to full assignment replacements)
	 * from a mapped user-facing taxonomy onto the slot. Re-reads the
	 * canonical post-set rather than diffing the removed tt_ids so the slot
	 * always reflects the current post-set on the source side — same shape
	 * `mirror_assignment()` uses for the add/replace path.
	 *
	 * @param int    $object_id Post receiving the removal.
	 * @param array  $tt_ids    Term taxonomy ids that were removed (unused).
	 * @param string $taxonomy  Taxonomy the removal targeted.
	 */
	public static function mirror_removal( $object_id, $tt_ids, $taxonomy ): void {
		unset( $tt_ids );

		$map = self::get_map();
		if ( ! isset( $map[ $taxonomy ] ) ) {
			return;
		}
		$slot = $map[ $taxonomy ];
		if ( ! taxonomy_exists( $slot ) ) {
			return;
		}
		$names = wp_get_object_terms( (int) $object_id, $taxonomy, array( 'fields' => 'names' ) );
		if ( is_wp_error( $names ) ) {
			return;
		}
		wp_set_object_terms( (int) $object_id, $names, $slot, false );
	}

	/**
	 * Mirror term deletions from a mapped user-facing taxonomy onto the
	 * slot. Without this, deleting a "Fantasy" term in `genre` leaves an
	 * orphan "Fantasy" term in the slot taxonomy that ES would keep
	 * returning as a (zero-doc) bucket on retained-option lists.
	 *
	 * @param int    $term_id      User-side term id (unused — match by name).
	 * @param int    $tt_id        Term taxonomy id (unused).
	 * @param string $taxonomy     Taxonomy the term lived in.
	 * @param object $deleted_term Term object as it existed just before deletion.
	 */
	public static function mirror_deletion( $term_id, $tt_id, $taxonomy, $deleted_term ): void {
		unset( $term_id, $tt_id );

		$map = self::get_map();
		if ( ! isset( $map[ $taxonomy ] ) ) {
			return;
		}
		$slot = $map[ $taxonomy ];
		if ( ! taxonomy_exists( $slot ) ) {
			return;
		}
		// Match by slug rather than name: `wp_set_object_terms()` creates the
		// slot term with `sanitize_title( $name )` as its slug regardless of
		// the user-side name's case, and `get_term_by( 'name', ... )` is
		// case-sensitive on case-sensitive collations — slug-based lookup
		// avoids missing "fantasy" when the source term is "Fantasy".
		$slug = isset( $deleted_term->slug ) ? (string) $deleted_term->slug : '';
		if ( '' === $slug ) {
			return;
		}
		$slot_term = get_term_by( 'slug', $slug, $slot );
		if ( $slot_term && ! is_wp_error( $slot_term ) ) {
			wp_delete_term( (int) $slot_term->term_id, $slot );
		}
	}

	/**
	 * One-shot backfill: walk every post that carries a term in a mapped
	 * user-facing taxonomy and mirror its current assignment onto the slot.
	 * Use after first introducing a mapping on a site whose posts were
	 * tagged before the auto-mirror was active.
	 *
	 * Idempotent — `wp_set_object_terms()` replaces the post-set on the slot
	 * each call, so re-running picks up later edits cleanly. Not hooked
	 * automatically; sites with millions of posts shouldn't pay this cost on
	 * every request. Call from a one-off script or `wp eval`.
	 *
	 * The default `mirror` mode walks user-side terms only and won't clean
	 * up orphan slot rows from posts that have lost all their user-side
	 * terms. Pass `rebuild` to wipe the slot taxonomy first and re-project
	 * from scratch — slower but guarantees no drift survives.
	 *
	 * @param string $mode One of `self::BACKFILL_MODES` — `mirror` (default) or `rebuild`.
	 * @return int Number of (post, taxonomy) pairs mirrored. Slot wipes in
	 *             `rebuild` mode are not counted; the return value is the
	 *             count of fresh per-post writes either way.
	 */
	public static function backfill( string $mode = 'mirror' ): int {
		if ( ! in_array( $mode, self::BACKFILL_MODES, true ) ) {
			/* translators: %s: invalid mode value passed to backfill(). */
			$msg = sprintf( esc_html__( 'Unknown backfill mode "%s"; expected one of mirror | rebuild.', 'jetpack-search-pkg' ), esc_html( $mode ) );
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $msg is sprintf() of esc_html__() with esc_html()-wrapped args.
			_doing_it_wrong( __METHOD__, $msg, 'jetpack-search-pkg 0.60.0' );
			$mode = 'mirror';
		}

		$map = self::get_map();
		if ( empty( $map ) ) {
			return 0;
		}
		$mirrored = 0;
		foreach ( $map as $user_slug => $slot ) {
			if ( ! taxonomy_exists( $user_slug ) || ! taxonomy_exists( $slot ) ) {
				continue;
			}
			// Rebuild mode: drop every term in the slot taxonomy *before*
			// the user-side walk. `wp_delete_term()` cascades to remove
			// each term's term_relationship rows, leaving the slot
			// post-set empty so the mirror loop projects a fresh copy of
			// the current user-side state with no orphans. The inner
			// deletes fire `delete_term` on slot taxonomies; the mirror
			// handler's `isset( $map[ $taxonomy ] )` gate (map keys are
			// user-side slugs, never slot slugs) prevents recursion.
			if ( 'rebuild' === $mode ) {
				// @phan-suppress-next-line PhanAccessMethodInternal @phan-suppress-current-line UnusedSuppression -- Fixed in WP 6.9, but then we need a suppression for the WP 6.8 compat run. @todo Remove this suppression when we drop WP <6.9.
				$existing_slot_terms = get_terms(
					array(
						'taxonomy'   => $slot,
						'hide_empty' => false,
						'fields'     => 'ids',
					)
				);
				if ( ! is_wp_error( $existing_slot_terms ) ) {
					foreach ( (array) $existing_slot_terms as $slot_term_id ) {
						wp_delete_term( (int) $slot_term_id, $slot );
					}
				}
			}
			// @phan-suppress-next-line PhanAccessMethodInternal @phan-suppress-current-line UnusedSuppression -- Fixed in WP 6.9, but then we need a suppression for the WP 6.8 compat run. @todo Remove this suppression when we drop WP <6.9.
			$terms = get_terms(
				array(
					'taxonomy'   => $user_slug,
					'hide_empty' => false,
					'fields'     => 'all',
				)
			);
			// Bail explicitly on `WP_Error` (and on the empty case) rather than
			// relying on `wp_list_pluck()` silently returning `[]` for an
			// error input — keeps the failure path readable.
			if ( is_wp_error( $terms ) || empty( $terms ) ) {
				continue;
			}
			$object_ids = get_objects_in_term(
				wp_list_pluck( $terms, 'term_id' ),
				$user_slug
			);
			if ( is_wp_error( $object_ids ) || empty( $object_ids ) ) {
				continue;
			}
			foreach ( array_unique( array_map( 'intval', (array) $object_ids ) ) as $object_id ) {
				$names = wp_get_object_terms( $object_id, $user_slug, array( 'fields' => 'names' ) );
				if ( is_wp_error( $names ) ) {
					continue;
				}
				wp_set_object_terms( $object_id, $names, $slot, false );
				++$mirrored;
			}
		}
		return $mirrored;
	}
}
