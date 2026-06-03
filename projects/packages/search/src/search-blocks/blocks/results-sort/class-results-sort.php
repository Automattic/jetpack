<?php
/**
 * Results-sort block helpers.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Helpers for `jetpack-search/results-sort` — sort keys, translated labels,
 * and attribute normalization shared between render.php and tests. Product
 * keys (`rating_desc`, `price_asc`, `price_desc`) are gated on WooCommerce
 * so non-Woo deep links can't reach the rendered control.
 */
class Results_Sort {

	const BASE_SORT_KEYS = array( 'relevance', 'newest', 'oldest' );

	/**
	 * Product keys, gated on Woo. Order is meaningful — `rating` leads
	 * because it's the most common default for product pages.
	 */
	const PRODUCT_SORT_KEYS = array( 'rating_desc', 'price_asc', 'price_desc' );

	/**
	 * All keys the block may render. Order is meaningful (option/radio sequence).
	 *
	 * @return string[]
	 */
	public static function get_all_option_keys(): array {
		if ( Search_Blocks::woocommerce_blocks_enabled() ) {
			return array_merge( self::BASE_SORT_KEYS, self::PRODUCT_SORT_KEYS );
		}
		return self::BASE_SORT_KEYS;
	}

	/**
	 * Translated label per sort key. Accessor (not a constant) so strings go
	 * through `__()` at call time.
	 *
	 * @return array<string, string>
	 */
	public static function get_option_labels(): array {
		return array(
			'relevance'   => __( 'Relevance', 'jetpack-search-pkg' ),
			'newest'      => __( 'Newest', 'jetpack-search-pkg' ),
			'oldest'      => __( 'Oldest', 'jetpack-search-pkg' ),
			'rating_desc' => __( 'Rating', 'jetpack-search-pkg' ),
			'price_asc'   => __( 'Price: low to high', 'jetpack-search-pkg' ),
			'price_desc'  => __( 'Price: high to low', 'jetpack-search-pkg' ),
		);
	}

	/**
	 * Normalize `defaultSort`. Unknown values collapse to `relevance` so the
	 * fallback matches `parse_url_sort()` and `DEFAULT_SORT_ORDER` in JS.
	 *
	 * @param array $attributes Block attributes.
	 * @return string
	 */
	public static function normalize_default_sort( array $attributes ): string {
		$candidate = (string) ( $attributes['defaultSort'] ?? 'relevance' );
		return in_array( $candidate, self::get_all_option_keys(), true ) ? $candidate : 'relevance';
	}

	/**
	 * Resolve the ordered sort keys to render. Canonical order from
	 * `get_all_option_keys()` wins (stable UI across saves). Empty / all-unknown
	 * falls back to the full set so a misconfigured block never renders zero options.
	 *
	 * @param array $attributes Block attributes.
	 * @return string[]
	 */
	public static function resolve_available_options( array $attributes ): array {
		$all      = self::get_all_option_keys();
		$provided = $attributes['availableSortOptions'] ?? null;
		if ( ! is_array( $provided ) ) {
			return $all;
		}
		$allowed = array_values(
			array_filter(
				$all,
				static function ( $key ) use ( $provided ) {
					return in_array( $key, $provided, true );
				}
			)
		);
		if ( empty( $allowed ) ) {
			return $all;
		}
		return $allowed;
	}

	/**
	 * Normalize `displayAs`. Unknown collapses to `select`.
	 *
	 * @param array $attributes Block attributes.
	 * @return string 'select', 'radio', or 'popover'.
	 */
	public static function normalize_display_as( array $attributes ): string {
		$candidate = (string) ( $attributes['displayAs'] ?? 'select' );
		if ( in_array( $candidate, array( 'radio', 'popover' ), true ) ) {
			return $candidate;
		}
		$legacy_candidate = (string) ( $attributes['display'] ?? 'select' );
		return 'popover' === $legacy_candidate ? 'popover' : 'select';
	}

	/**
	 * User-visible label, defaulting to "Sort by" (pre-SEARCH-138 fallback for
	 * posts saved before the attribute existed).
	 *
	 * @param array $attributes Block attributes.
	 * @return string
	 */
	public static function resolve_label( array $attributes ): string {
		$label = trim( (string) ( $attributes['label'] ?? '' ) );
		if ( '' === $label ) {
			return __( 'Sort by', 'jetpack-search-pkg' );
		}
		return $label;
	}

	/**
	 * Read `?orderby=…` off the request. Extends `Search_Blocks::parse_url_sort()`
	 * by accepting every option this block may render — a radio UI can expose
	 * a product-format key the state-seeder doesn't recognize, and a deep link
	 * to that key should still select it.
	 *
	 * @param string[]|null $allowed_keys Restrict to this list (defaults to all).
	 * @return string|null Sort key, or null when no URL sort is present/recognized.
	 */
	public static function parse_url_sort( ?array $allowed_keys = null ): ?string {
		// `?orderby[]=x` arrives as an array; sanitize_key() warns on that. Bail.
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only URL state.
		if ( ! isset( $_GET['orderby'] ) || ! is_scalar( $_GET['orderby'] ) ) {
			return null;
		}
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only URL state.
		$raw  = sanitize_key( wp_unslash( $_GET['orderby'] ) );
		$pool = $allowed_keys ?? self::get_all_option_keys();
		return in_array( $raw, $pool, true ) ? $raw : null;
	}
}
