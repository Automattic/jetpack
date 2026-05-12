<?php
/**
 * Results-sort block helpers.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Helper methods for the jetpack-search/results-sort block.
 *
 * Centralizes the list of valid sort keys, their translated labels, and the
 * attribute-normalization logic so render.php and the block's own unit tests
 * share one source of truth. Base sort keys (`relevance`, `newest`, `oldest`)
 * are always exposed; the product-format keys (`rating_desc`, `price_asc`,
 * `price_desc`) join the set only when WooCommerce is active so deep links
 * to a sort the API can't honour can't slip into the rendered control on
 * non-Woo sites.
 */
class Results_Sort {

	const BASE_SORT_KEYS = array( 'relevance', 'newest', 'oldest' );

	/**
	 * Product-format keys gated on WooCommerce. Order is meaningful — `rating`
	 * leads because authors most often want it as the visible default sort
	 * for product pages, with the two price directions grouped after it.
	 */
	const PRODUCT_SORT_KEYS = array( 'rating_desc', 'price_asc', 'price_desc' );

	/**
	 * All keys the block may render. Order is meaningful — `<option>` / radio
	 * rows come out in this sequence. Product-format keys append to the base
	 * set when WooCommerce is active so non-Woo sites never expose a sort
	 * the API would silently fall back to relevance on. Reads through to
	 * `Search_Blocks::is_woocommerce_active()` so block-registration gates
	 * for `filter-wc-*` and the sort-key gate share one memoized probe.
	 *
	 * @return string[]
	 */
	public static function get_all_option_keys(): array {
		if ( Search_Blocks::is_woocommerce_active() ) {
			return array_merge( self::BASE_SORT_KEYS, self::PRODUCT_SORT_KEYS );
		}
		return self::BASE_SORT_KEYS;
	}

	/**
	 * Translated labels for each sort key. A separate accessor (rather than a
	 * class constant) so the strings go through `__()` at call time — class
	 * constants can't hold translation-function output. Returns labels for
	 * every key the block could render in any environment (base + product);
	 * `resolve_available_options()` is the gate that decides which keys
	 * actually surface, so the unused entries never reach the DOM.
	 *
	 * @return array<string, string>  Map of sort key → label.
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
	 * Normalize the `defaultSort` attribute. Any unknown value — including a
	 * missing attribute on legacy posts — collapses to `relevance` so the
	 * fallback matches the `parse_url_sort()` default on the Search_Blocks
	 * class and the store's `DEFAULT_SORT_ORDER` in url-state.js.
	 *
	 * @param array $attributes Block attributes.
	 * @return string
	 */
	public static function normalize_default_sort( array $attributes ): string {
		$candidate = (string) ( $attributes['defaultSort'] ?? 'relevance' );
		return in_array( $candidate, self::get_all_option_keys(), true ) ? $candidate : 'relevance';
	}

	/**
	 * Resolve the final ordered list of sort keys this block will render.
	 * Preserves the canonical order from `get_all_option_keys()` rather than
	 * the order the attribute array arrived in — keeps the UI stable across
	 * saves and prevents a garbage attribute value (unknown key) from leaking
	 * into the rendered DOM.
	 *
	 * Whenever the filtered list would be empty (attribute is empty, or every
	 * entry is unknown) we fall back to the full set so an author's
	 * misconfiguration never renders a dropdown with zero options.
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
	 * Normalize the `displayAs` attribute. Unknown values collapse to
	 * `select` so a garbage attribute can't produce markup the view script
	 * doesn't know how to bind against.
	 *
	 * @param array $attributes Block attributes.
	 * @return string  'select', 'radio', or 'popover'.
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
	 * Resolve the user-visible label. Falls back to the translated default
	 * "Sort by" when the author hasn't supplied one — mirrors the pre-
	 * SEARCH-138 copy so posts saved before the attribute existed keep the
	 * same labelling.
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
	 * Read `?orderby=…` off the current request. Returns the key when it
	 * matches one of the exposed options, or `null` when the URL has no
	 * sort parameter (or the value is unrecognized) — letting the caller
	 * fall back to the block's `defaultSort` attribute.
	 *
	 * Mirrors `Search_Blocks::parse_url_sort()` but extends the accepted
	 * set to every option this block may render: a radio UI can expose a
	 * product-format sort key the Search_Blocks state-seeder doesn't
	 * recognise, and a deep link to that key should still select it.
	 *
	 * @param string[]|null $allowed_keys Restrict accepted values to this
	 *   list. Defaults to every option the block knows about.
	 * @return string|null Sort key or null when no URL sort is present.
	 */
	public static function parse_url_sort( ?array $allowed_keys = null ): ?string {
		// `?orderby[]=x` lands as an array — passing that to sanitize_key()
		// would emit a PHP warning (and PHPUnit fails on those). Bail early
		// so a malformed URL can't poison the rendered control.
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
