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
 * `staticPostTypes` constraint to the shared Interactivity store, which the JS
 * search-URL builder folds into the ES filter clause as `must.should` (include)
 * and `must_not` (exclude).
 *
 * Both lists may be set on the same block. They compose as AND: results must
 * be in the include set AND must not be in the exclude set. Excludes that also
 * appear in the include list are dropped during normalization — the include
 * clause already restricts to that set, so listing a slug in both is
 * contradictory user input rather than a meaningful intent.
 */
class Post_Type_Filter {

	/**
	 * Per-request cache of slugs of post types registered with
	 * `exclude_from_search => false`. Built lazily by
	 * `searchable_post_type_slugs()` on first call.
	 *
	 * Test-only: tests reset this via Reflection across `setUp`/`tearDown`
	 * so newly-registered fixture post types take effect. Production code
	 * never mutates this directly.
	 *
	 * @var string[]|null
	 */
	private static $searchable_cache = null;

	/**
	 * Normalize and sanitize include/exclude lists from raw block attributes.
	 *
	 * Output guarantees:
	 *  - Each value is a non-empty `sanitize_key`'d string.
	 *  - Each value is a registered post type whose `exclude_from_search`
	 *    flag is `false` — anything else (typo, retired CPT, private type)
	 *    is dropped silently so a stray slug can't collapse every search on
	 *    the page to zero results by reaching ES.
	 *  - Lists are deduplicated and re-indexed.
	 *  - `exclude` does not contain any slug that also appears in `include`.
	 *
	 * @param array $attributes Block attributes.
	 * @return array{include: string[], exclude: string[]}
	 */
	public static function build_lists( array $attributes ): array {
		$searchable = static::searchable_post_type_slugs();
		$include    = static::sanitize_slug_list( $attributes['include'] ?? array(), $searchable );
		$exclude    = static::sanitize_slug_list( $attributes['exclude'] ?? array(), $searchable );

		if ( ! empty( $include ) && ! empty( $exclude ) ) {
			$exclude = array_values( array_diff( $exclude, $include ) );
		}

		return array(
			'include' => $include,
			'exclude' => $exclude,
		);
	}

	/**
	 * Coerce a raw attribute value into a sanitized, deduped, re-indexed
	 * list of post-type slugs. Non-arrays, non-scalars, and empty values
	 * are dropped silently so a malformed attribute can never reach the ES
	 * filter clause. When `$allowed` is provided, slugs not present in the
	 * allowlist are also dropped — see `build_lists()` for the boundary
	 * where this is enforced against the live post-type registry.
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
	 * (one per attribute list per render) don't re-walk the registry.
	 *
	 * Returns null if `get_post_types` is unavailable (very early load,
	 * isolated test runtime); callers treat null as "no allowlist" and
	 * skip the registry-membership check.
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
	 * already on the Interactivity state. Composition rule: union both lists,
	 * then re-apply the include/exclude exclusivity normalization so a later
	 * include doesn't leave a contradictory entry in the exclude list.
	 *
	 * Multiple instances of the block on the same page therefore broaden the
	 * include set rather than intersecting it — picking intersection here
	 * would silently zero out results when an editor stacks two blocks
	 * configured for non-overlapping post types.
	 *
	 * @param array{include?: mixed, exclude?: mixed}     $existing     Current state slot value.
	 * @param array{include: string[], exclude: string[]} $contribution New block lists.
	 * @return array{include: string[], exclude: string[]}
	 */
	public static function merge_state( array $existing, array $contribution ): array {
		// Existing state may be malformed (forward-compat with an older
		// state shape); sanitize_slug_list strips bad entries. The
		// contribution itself was already passed through `build_lists()`
		// so it's clean at this point.
		$existing_include = static::sanitize_slug_list( $existing['include'] ?? array() );
		$existing_exclude = static::sanitize_slug_list( $existing['exclude'] ?? array() );

		$include = array_values( array_unique( array_merge( $existing_include, $contribution['include'] ) ) );
		$exclude = array_values( array_unique( array_merge( $existing_exclude, $contribution['exclude'] ) ) );

		if ( ! empty( $include ) && ! empty( $exclude ) ) {
			$exclude = array_values( array_diff( $exclude, $include ) );
		}

		return array(
			'include' => $include,
			'exclude' => $exclude,
		);
	}
}
