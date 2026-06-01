<?php
/**
 * Custom taxonomy → reserved Jetpack Search slot mapping.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Power-user escape hatch for taxonomies Jetpack Search doesn't index natively.
 *
 * A site adds a mapping via the `jetpack_search_custom_taxonomy_map` filter
 * (e.g. `'genre' => 'jetpack-search-tag1'`). The class then:
 *
 *   1. Registers each in-use slot (`jetpack-search-tag0…9`) as a private
 *      shadow taxonomy on the same object types as its user-side source.
 *   2. Mirrors assignments onto the slot via `set_object_terms`,
 *      `deleted_term_relationships`, and `delete_term` so Sync ships the
 *      slot rows to WPCOM (slot taxonomies are in `Sync\Modules\Search`).
 *   3. Resolves user-facing slug → slot at query-build time
 *      (`Filter_Checkbox::build_config()` writes the `effectiveSlug`).
 *
 * Empty filter default = feature off. A site with no entry pays only an
 * `isset()` check inside `mirror_assignment()`.
 *
 * See https://jetpack.com/support/search/frequently-asked-questions/#troubleshoot-custom-tax
 */
class Custom_Taxonomy_Slot_Mapping {

	/**
	 * Backfill modes accepted by `backfill()`.
	 *
	 * - `mirror`: per-post replacement only. Walks user-side terms and resets
	 *   each post's slot post-set to match. **Posts that lost every user-side
	 *   term during an inactive-mirror gap aren't visited** — their stale slot
	 *   relationships orphan. Common case for first-time setup.
	 * - `rebuild`: delete every slot term first (cascades to drop relationships),
	 *   then mirror. Byte-for-byte fresh projection, no orphans. Costly on
	 *   large sites — N deletes for N slot terms.
	 */
	const BACKFILL_MODES = array( 'mirror', 'rebuild' );

	/**
	 * Per-request memo backing `get_map()`. Validation runs once per request
	 * so `_doing_it_wrong()` for a bad map doesn't multiply.
	 *
	 * @var array<string, string>|null
	 */
	private static $map_cache = null;

	/**
	 * Wire bootstrap + mirror hooks. Called once from `Search_Blocks::init()`.
	 *
	 * Mirror hooks attach unconditionally — they short-circuit on
	 * `! isset( $map[ $taxonomy ] )` so sites without a mapping pay only one
	 * cached read + `isset` call. Avoids a load-order trap if a site declares
	 * the map after `init` fires.
	 *
	 * Slot-registration priority 20 so user-side taxonomies declared at
	 * default priority 10 are present when we read their `object_type`.
	 */
	public static function init(): void {
		add_action( 'init', array( static::class, 'register_slot_taxonomies' ), 20 );
		add_action( 'set_object_terms', array( static::class, 'mirror_assignment' ), 10, 6 );
		// `wp_remove_object_terms()` fires `deleted_term_relationships`, not
		// `set_object_terms`, so the slot drifts unless we hook both. Block-editor
		// saves go through the full replace path and are covered above.
		add_action( 'deleted_term_relationships', array( static::class, 'mirror_removal' ), 10, 3 );
		add_action( 'delete_term', array( static::class, 'mirror_deletion' ), 10, 4 );
	}

	/**
	 * Map of user-facing taxonomy slug → reserved slot (`jetpack-search-tag0…9`).
	 *
	 * Slots must match `jetpack-search-tag[0-9]` exactly (else dropped with a
	 * `_doing_it_wrong()` notice — routing to a non-existent ES field would
	 * silently return nothing). Two slugs claiming the same slot: first wins;
	 * second is dropped (term spaces would otherwise merge silently).
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
	 * Resolve a user-facing slug to the ES field it should query — the
	 * matching slot when mapped, otherwise the slug itself. Built-ins
	 * (category, post_tag, product_*) are returned verbatim so a stray
	 * map entry can't silently redirect them. Empty in → empty out.
	 *
	 * @param string $taxonomy User-facing taxonomy slug.
	 * @return string Effective ES field slug.
	 */
	public static function resolve_slot( string $taxonomy ): string {
		if ( '' === $taxonomy ) {
			return '';
		}
		if ( in_array( $taxonomy, Search_Blocks::BUILT_IN_CUSTOM_TAXONOMY_EXCLUSIONS, true ) ) {
			return $taxonomy;
		}
		$map = self::get_map();
		return $map[ $taxonomy ] ?? $taxonomy;
	}

	/**
	 * Reset the `get_map()` memo. Tests only.
	 *
	 * @internal
	 */
	public static function reset_cache_for_testing(): void {
		self::$map_cache = null;
	}

	/**
	 * Register each in-use slot as a private shadow taxonomy on the same
	 * object types as its user-side source. They have to be real registered
	 * taxonomies so `wp_set_object_terms()` accepts them and Sync ships them
	 * to WPCOM — but invisible (no UI, REST, rewrite, query var, etc.)
	 * because only `mirror_assignment()` ever writes to them.
	 *
	 * Forced flat: WPCOM aggregates slot taxonomies as bag-of-terms and
	 * parent/child wouldn't survive the round trip.
	 */
	public static function register_slot_taxonomies(): void {
		$map = self::get_map();
		if ( empty( $map ) ) {
			return;
		}
		// Union object_types per slot in case a slot shadows multiple taxonomies.
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
	 * Mirror assignments onto the slot. Uses term names because slot terms
	 * need to display the same label as the source (and `wp_set_object_terms()`
	 * creates matching terms by name). Idempotent. Recursion bounded by the
	 * map gate: the inner call fires with `$taxonomy = jetpack-search-tagN`,
	 * which isn't a map key.
	 *
	 * @param int    $object_id  Post id receiving the terms.
	 * @param array  $terms      Raw input (unused — re-fetched).
	 * @param array  $tt_ids     Term taxonomy ids (unused).
	 * @param string $taxonomy   Taxonomy slug the assignment targeted.
	 * @param bool   $append     Append flag (unused — full mirror).
	 * @param array  $old_tt_ids Previous tt_ids (unused).
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
	 * Mirror removals onto the slot. Re-reads the canonical post-set rather
	 * than diffing the removed tt_ids, so the slot tracks the current state.
	 *
	 * @param int    $object_id Post receiving the removal.
	 * @param array  $tt_ids    Term taxonomy ids removed (unused).
	 * @param string $taxonomy  Taxonomy targeted.
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
	 * Mirror deletions onto the slot. Without this a deleted user-side
	 * "Fantasy" leaves an orphan slot term that ES keeps returning as a
	 * zero-doc bucket on retained-option lists.
	 *
	 * @param int    $term_id      User-side term id (unused).
	 * @param int    $tt_id        Term taxonomy id (unused).
	 * @param string $taxonomy     Taxonomy the term lived in.
	 * @param object $deleted_term Term object as it existed pre-delete.
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
		// Match by slug — `wp_set_object_terms()` uses `sanitize_title()` and
		// `get_term_by('name')` is case-sensitive on case-sensitive collations,
		// so name lookup misses "fantasy" when the source is "Fantasy".
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
	 * One-shot backfill: walk posts with mapped-taxonomy terms and mirror onto
	 * the slot. Use after introducing a mapping on a site with pre-existing
	 * tagged posts. Idempotent. Not hooked — invoke from a script or `wp eval`.
	 *
	 * See `BACKFILL_MODES` for `mirror` vs `rebuild` semantics.
	 *
	 * @param string $mode `mirror` (default) or `rebuild`.
	 * @return int Number of (post, taxonomy) pairs mirrored.
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
			// Rebuild: drop every slot term first. `wp_delete_term()` cascades
			// to remove relationships, so the mirror loop projects a fresh copy
			// with no orphans. Map keys are user-side slugs, never slot slugs,
			// so the inner `delete_term` fires don't recurse.
			if ( 'rebuild' === $mode ) {
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
			$terms = get_terms(
				array(
					'taxonomy'   => $user_slug,
					'hide_empty' => false,
					'fields'     => 'all',
				)
			);
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
