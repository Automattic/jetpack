<?php
/**
 * Post-type scope helpers shared by the search blocks.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Server-side post-type scope helpers for `search-input`'s per-instance
 * post-type setting. Single-mode (include OR exclude); translates
 * `{ mode, postTypes }` into the `{ include, exclude }` shape that
 * `buildStaticPostTypeClauses()` consumes.
 */
class Filter_Post_Type {

	/**
	 * Per-request cache. Tests reset via Reflection.
	 *
	 * @var string[]|null
	 */
	private static $searchable_cache = null;

	/**
	 * Translate a single `?post_type=<slug>` URL value into the same
	 * `{ include, exclude }` shape `build_constraint()` returns, or `null`
	 * if the slug is empty / not searchable. Single-slug include only — the
	 * URL contract round-trips just that case (see `store/url-state.js`).
	 *
	 * @param mixed $raw Raw URL value (typically string).
	 * @return array{include: string[], exclude: string[]}|null
	 */
	public static function from_url_param( $raw ): ?array {
		if ( ! is_scalar( $raw ) ) {
			return null;
		}
		$slugs = static::sanitize_slug_list(
			array( (string) $raw ),
			static::searchable_post_type_slugs()
		);
		if ( empty( $slugs ) ) {
			return null;
		}
		return array(
			'include' => $slugs,
			'exclude' => array(),
		);
	}

	/**
	 * Translate attributes → `{ include, exclude }`. Slugs validated against
	 * the live searchable-types registry (typos / retired CPTs dropped).
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
	 * Sanitize, dedupe, optionally allowlist a slug list.
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
}
