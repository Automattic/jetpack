<?php
/**
 * Filter-post-type block helpers.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Server-side helpers for jetpack-search/filter-post-type.
 *
 * Single-mode block (`include` OR `exclude`); the helper translates the
 * `{ mode, postTypes }` attributes into the `{ include, exclude }` shape
 * `store/api.js`'s `buildStaticPostTypeClauses()` consumes.
 */
class Filter_Post_Type {

	/**
	 * Per-request cache of slugs registered with `exclude_from_search => false`.
	 * Tests reset this via Reflection.
	 *
	 * @var string[]|null
	 */
	private static $searchable_cache = null;

	/**
	 * Translate block attributes into `{ include, exclude }`. Slugs are
	 * sanitized and validated against the live searchable-post-type
	 * registry — typos / retired CPTs / private types are dropped before
	 * reaching ES.
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
	 * Sanitize, dedupe, optionally allowlist-filter a slug list.
	 *
	 * @param mixed         $raw     Raw attribute value.
	 * @param string[]|null $allowed Optional allowlist of slugs to keep.
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
	 * Searchable post-type slugs (lazy + cached per request).
	 *
	 * @return string[]|null Slug list, or null when get_post_types is unavailable.
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
	 * Union a block's contribution into the existing `staticPostTypes`
	 * state slot. Multi-instance composition broadens (rather than
	 * intersects) each side so stacked blocks cannot silently produce
	 * zero results.
	 *
	 * @param array{include?: mixed, exclude?: mixed}     $existing     Current slot value.
	 * @param array{include: string[], exclude: string[]} $contribution New block lists.
	 * @return array{include: string[], exclude: string[]}
	 */
	public static function merge_state( array $existing, array $contribution ): array {
		$existing_include = static::sanitize_slug_list( $existing['include'] ?? array() );
		$existing_exclude = static::sanitize_slug_list( $existing['exclude'] ?? array() );

		return array(
			'include' => array_values( array_unique( array_merge( $existing_include, $contribution['include'] ) ) ),
			'exclude' => array_values( array_unique( array_merge( $existing_exclude, $contribution['exclude'] ) ) ),
		);
	}
}
