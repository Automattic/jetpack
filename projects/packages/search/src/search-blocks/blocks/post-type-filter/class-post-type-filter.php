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
	 * Normalize and sanitize include/exclude lists from raw block attributes.
	 *
	 * Output guarantees:
	 *  - Each value is a non-empty `sanitize_key`'d string.
	 *  - Lists are deduplicated and re-indexed.
	 *  - `exclude` does not contain any slug that also appears in `include`.
	 *
	 * @param array $attributes Block attributes.
	 * @return array{include: string[], exclude: string[]}
	 */
	public static function build_lists( array $attributes ): array {
		$include = static::sanitize_slug_list( $attributes['include'] ?? array() );
		$exclude = static::sanitize_slug_list( $attributes['exclude'] ?? array() );

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
	 * filter clause.
	 *
	 * @param mixed $raw Raw attribute value.
	 * @return string[]
	 */
	protected static function sanitize_slug_list( $raw ): array {
		if ( ! is_array( $raw ) ) {
			return array();
		}
		$clean = array();
		foreach ( $raw as $value ) {
			if ( ! is_scalar( $value ) ) {
				continue;
			}
			$slug = sanitize_key( (string) $value );
			if ( '' !== $slug && ! in_array( $slug, $clean, true ) ) {
				$clean[] = $slug;
			}
		}
		return $clean;
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
