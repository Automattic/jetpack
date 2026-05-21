<?php
/**
 * Filter-static block helpers.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Helper methods for the jetpack-search/filter-static block.
 *
 * Static filters are configured entirely by the host site (no editor UI for
 * adding values) and rendered as a single-select radio list. Selections
 * round-trip through the URL as scalar `?filter_id=value` params (not the
 * `?key[]=value` array shape used by dynamic facet filters). This mirrors the
 * legacy instant-search overlay's static-filter widget so a site already wired
 * up for the overlay gets the blocks for free — see
 * src/instant-search/lib/filters.js getAvailableStaticFilters() and
 * src/instant-search/store/effects.js updateStaticFilterQueryString().
 */
class Filter_Static {

	/**
	 * Per-request memo of the resolved static-filter config.
	 *
	 * @var array<int, array<string, mixed>>|null
	 */
	private static $cached = null;

	/**
	 * Read the site-configured static-filter list.
	 *
	 * Resolves the union of two filter hooks:
	 *
	 * 1. `jetpack_instant_search_options` — the legacy options blob already
	 *    used by the instant-search overlay. Sites that registered static
	 *    filters there get the blocks for free with zero migration.
	 * 2. `jetpack_search_static_filters` — narrower sibling whose payload is
	 *    just the static-filter array. New, blocks-only callers should use
	 *    this one.
	 *
	 * Both feed into the same normalized list. Last-wins on duplicate
	 * `filter_id`.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	public static function get_static_filters_config(): array {
		if ( null !== self::$cached ) {
			return self::$cached;
		}

		$from_options = array();
		if ( function_exists( 'apply_filters' ) ) {
			$options      = apply_filters( 'jetpack_instant_search_options', array() );
			$from_options = is_array( $options['staticFilters'] ?? null )
				? $options['staticFilters']
				: array();

			$from_options = apply_filters( 'jetpack_search_static_filters', $from_options );
		}

		$seen   = array();
		$normal = array();
		foreach ( (array) $from_options as $entry ) {
			$normalized = self::normalize_entry( $entry );
			if ( null === $normalized ) {
				continue;
			}
			$filter_id = $normalized['filter_id'];
			if ( isset( $seen[ $filter_id ] ) ) {
				if ( function_exists( '_doing_it_wrong' ) ) {
					_doing_it_wrong(
						__METHOD__,
						esc_html(
							sprintf(
								/* translators: %s: duplicate filter ID. */
								__( 'Duplicate static filter "%s" — last registration wins.', 'jetpack-search-pkg' ),
								$filter_id
							)
						),
						'jetpack-search 0.1.0'
					);
				}
				// Replace prior entry rather than appending so iteration order
				// stays deterministic (last write wins, position of the first).
				$normal[ $seen[ $filter_id ] ] = $normalized;
				continue;
			}
			$seen[ $filter_id ] = count( $normal );
			$normal[]           = $normalized;
		}

		self::$cached = $normal;
		return $normal;
	}

	/**
	 * Reset the per-request memo. Tests only.
	 */
	public static function reset_cache_for_testing(): void {
		self::$cached = null;
	}

	/**
	 * Narrow the configured list by `variation` and (optionally) `filter_id`.
	 *
	 * @param string $variation Either 'sidebar' or 'tabbed'.
	 * @param string $filter_id When non-empty, return only the matching entry.
	 * @return array<int, array<string, mixed>>
	 */
	public static function filters_for_variation( string $variation, string $filter_id = '' ): array {
		$variation = self::normalize_variation( $variation );
		$out       = array();
		foreach ( self::get_static_filters_config() as $entry ) {
			if ( self::normalize_variation( $entry['variation'] ?? '' ) !== $variation ) {
				continue;
			}
			if ( '' !== $filter_id && $entry['filter_id'] !== $filter_id ) {
				continue;
			}
			$out[] = $entry;
		}
		return $out;
	}

	/**
	 * Normalize the variation value. Anything other than 'tabbed' collapses to
	 * 'sidebar' — matches the legacy `getAvailableStaticFilters()` default.
	 *
	 * @param mixed $value Raw value.
	 * @return string Either 'sidebar' or 'tabbed'.
	 */
	public static function normalize_variation( $value ): string {
		return 'tabbed' === $value ? 'tabbed' : 'sidebar';
	}

	/**
	 * Sanitize and validate a single configured entry. Returns null when the
	 * entry is missing required fields or its `filter_id` collides with a
	 * reserved URL param — the block then renders nothing for that entry
	 * rather than silently failing on round-trip.
	 *
	 * @param mixed $entry Raw entry.
	 * @return array<string, mixed>|null
	 */
	private static function normalize_entry( $entry ): ?array {
		if ( ! is_array( $entry ) ) {
			return null;
		}
		$filter_id = sanitize_key( (string) ( $entry['filter_id'] ?? '' ) );
		if ( '' === $filter_id || in_array( $filter_id, Search_Blocks::RESERVED_QUERY_PARAMS, true ) ) {
			return null;
		}

		$values = array();
		foreach ( (array) ( $entry['values'] ?? array() ) as $value_entry ) {
			if ( ! is_array( $value_entry ) ) {
				continue;
			}
			$value = sanitize_text_field( (string) ( $value_entry['value'] ?? '' ) );
			$name  = sanitize_text_field( (string) ( $value_entry['name'] ?? '' ) );
			if ( '' === $value ) {
				continue;
			}
			$values[] = array(
				'value' => $value,
				'name'  => '' === $name ? $value : $name,
			);
		}
		if ( empty( $values ) ) {
			return null;
		}

		return array(
			'filter_id' => $filter_id,
			'name'      => sanitize_text_field( (string) ( $entry['name'] ?? '' ) ),
			'type'      => 'group',
			'variation' => self::normalize_variation( $entry['variation'] ?? '' ),
			'selected'  => sanitize_text_field( (string) ( $entry['selected'] ?? '' ) ),
			'values'    => $values,
		);
	}

	/**
	 * Build the filterConfig entry this block contributes to the shared
	 * Interactivity state. The `kind => 'static'` flag is what the JS store
	 * keys off to decide URL serialization (scalar vs array shape) and the
	 * single-select vs toggle action path.
	 *
	 * @param array<string, mixed> $entry      Normalized server-config entry.
	 * @param array<string, mixed> $attributes Block attributes.
	 * @return array<string, mixed>
	 */
	public static function build_config( array $entry, array $attributes ): array {
		return array(
			'filterKey'  => $entry['filter_id'],
			'kind'       => 'static',
			'filterType' => 'static',
			'label'      => self::derive_label( $entry, $attributes ),
			'values'     => $entry['values'],
			'selected'   => $entry['selected'],
			'variation'  => $entry['variation'],
		);
	}

	/**
	 * Block-attribute label override beats server name; empty falls back.
	 *
	 * @param array<string, mixed> $entry      Normalized server-config entry.
	 * @param array<string, mixed> $attributes Block attributes.
	 * @return string
	 */
	public static function derive_label( array $entry, array $attributes ): string {
		$override = sanitize_text_field( (string) ( $attributes['label'] ?? '' ) );
		if ( '' !== $override ) {
			return $override;
		}
		return (string) ( $entry['name'] ?? '' );
	}

	/**
	 * Parse scalar URL params that match a configured static-filter key into a
	 * `{ filter_id => value }` map. Called from the seed path so a deep link
	 * pre-checks the right radio and the SSR pass shows the filtered count.
	 *
	 * @return array<string, string>
	 */
	public static function parse_url_selections(): array {
		if ( ! function_exists( 'wp_unslash' ) ) {
			return array();
		}
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- read-only URL state; sanitized per-value below.
		$raw = wp_unslash( $_GET );
		if ( ! is_array( $raw ) ) {
			return array();
		}

		$keys = array();
		foreach ( self::get_static_filters_config() as $entry ) {
			$keys[ $entry['filter_id'] ] = true;
		}
		if ( empty( $keys ) ) {
			return array();
		}

		$out = array();
		foreach ( $raw as $key => $value ) {
			if ( ! is_string( $key ) || ! isset( $keys[ $key ] ) ) {
				continue;
			}
			if ( is_array( $value ) ) {
				// Scalar-only contract: an array-shaped param under a static
				// filter key is a misuse (probably a stray `?section[]=…`).
				// Drop it rather than guessing which entry to pick.
				continue;
			}
			$clean = sanitize_text_field( (string) $value );
			if ( '' === $clean ) {
				continue;
			}
			$out[ $key ] = $clean;
		}
		return $out;
	}
}
