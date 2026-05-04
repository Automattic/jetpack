<?php
/**
 * Post-type-filter block helpers.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Helpers for the jetpack/post-type-filter hidden constraint block.
 *
 * The block renders nothing on the front end; it only contributes a
 * single-mode (`include` OR `exclude`, never both) post-type constraint to
 * the shared Interactivity store. The JS search-URL builder folds it into
 * the ES filter clause as `must.should` (include) or `bool.must_not` (exclude).
 *
 * The store slot stays the `{ include: [], exclude: [] }` shape that
 * `store/api.js`'s `buildStaticPostTypeClauses()` consumes — this PHP
 * helper just picks which side to populate from the block's `mode`
 * attribute. Multi-instance composition continues to union by side, so
 * multiple Include blocks broaden the include set and multiple Exclude
 * blocks broaden the exclude set.
 */
class Post_Type_Filter {

	/**
	 * Per-request cache of slugs of post types registered with
	 * `exclude_from_search => false`. Built lazily by
	 * `searchable_post_type_slugs()` on first call. Tests reset this via
	 * Reflection across `setUp`/`tearDown`; production code never mutates
	 * it directly.
	 *
	 * @var string[]|null
	 */
	private static $searchable_cache = null;

	/**
	 * Translate raw block attributes into the `{ include, exclude }` store
	 * slot shape. Exactly one side will be non-empty (or both empty when
	 * the block has no selection), matching the block's single-mode UX.
	 *
	 * Output guarantees:
	 *  - Each value is a non-empty `sanitize_key`'d string.
	 *  - Each value is a registered post type whose `exclude_from_search`
	 *    flag is `false`. Anything else (typo, retired CPT, private type)
	 *    is dropped silently so a stray slug can't collapse every search
	 *    on the page to zero results by reaching ES.
	 *  - Lists are deduplicated and re-indexed.
	 *
	 * @param array $attributes Block attributes.
	 * @return array{include: string[], exclude: string[]}
	 */
	public static function build_constraint( array $attributes ): array {
		$mode  = ( $attributes['mode'] ?? 'exclude' ) === 'include' ? 'include' : 'exclude';
		$slugs = static::sanitize_slug_list(
			$attributes['postTypes'] ?? array(),
			static::searchable_post_type_slugs()
		);

		return array(
			'include' => 'include' === $mode ? $slugs : array(),
			'exclude' => 'exclude' === $mode ? $slugs : array(),
		);
	}

	/**
	 * Coerce a raw attribute value into a sanitized, deduped, re-indexed
	 * list of post-type slugs. Non-arrays, non-scalars, and empty values
	 * are dropped silently so a malformed attribute can never reach the
	 * ES filter clause. When `$allowed` is provided, slugs not present in
	 * the allowlist are also dropped.
	 *
	 * @param mixed         $raw     Raw attribute value.
	 * @param string[]|null $allowed Optional allowlist of slugs to keep; null skips the check.
	 * @return string[]
	 */
	private static function sanitize_slug_list( $raw, ?array $allowed = null ): array {
		if ( ! is_array( $raw ) ) {
			return array();
		}
		$clean = array();
		foreach ( $raw as $value ) {
			if ( ! is_scalar( $value ) ) {
				continue;
			}
			$slug = sanitize_key( (string) $value );
			if ( '' === $slug || in_array( $slug, $clean, true ) ) {
				continue;
			}
			if ( null !== $allowed && ! in_array( $slug, $allowed, true ) ) {
				continue;
			}
			$clean[] = $slug;
		}
		return $clean;
	}

	/**
	 * Slugs of post types that participate in search — i.e. registered with
	 * `exclude_from_search => false`. Cached per-request so repeated lookups
	 * (one per render call) don't re-walk the registry. Returns null when
	 * `get_post_types` is unavailable so callers treat that as "no allowlist"
	 * and skip the registry-membership check.
	 *
	 * @return string[]|null
	 */
	private static function searchable_post_type_slugs(): ?array {
		if ( null !== static::$searchable_cache ) {
			return static::$searchable_cache;
		}
		if ( ! function_exists( 'get_post_types' ) ) {
			return null;
		}
		static::$searchable_cache = array_values(
			get_post_types( array( 'exclude_from_search' => false ) )
		);
		return static::$searchable_cache;
	}

	/**
	 * Merge a block's contribution into the existing `staticPostTypes` shape
	 * already on the Interactivity state. Composition rule: union both lists.
	 *
	 * Multiple instances of the block on the same page therefore broaden
	 * each side rather than intersecting it — picking intersection here
	 * would silently zero out results when an editor stacks two blocks
	 * configured for non-overlapping post types.
	 *
	 * @param array{include?: mixed, exclude?: mixed}     $existing     Current state slot value.
	 * @param array{include: string[], exclude: string[]} $contribution New block lists.
	 * @return array{include: string[], exclude: string[]}
	 */
	public static function merge_state( array $existing, array $contribution ): array {
		// Existing state may be malformed (forward-compat with a future
		// shape change); sanitize_slug_list strips bad entries. The
		// contribution itself was already passed through `build_constraint()`
		// so it's clean at this point.
		$existing_include = static::sanitize_slug_list( $existing['include'] ?? array() );
		$existing_exclude = static::sanitize_slug_list( $existing['exclude'] ?? array() );

		return array(
			'include' => array_values( array_unique( array_merge( $existing_include, $contribution['include'] ) ) ),
			'exclude' => array_values( array_unique( array_merge( $existing_exclude, $contribution['exclude'] ) ) ),
		);
	}
}
