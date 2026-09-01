<?php
/**
 * Filter-static block helpers.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Helpers for `jetpack-search/filter-static`. Host-configured (no editor UI
 * for values), single-select radio. URL round-trips as scalar `?filter_id=value`
 * (not `[]=`). Mirrors the legacy overlay's static-filter widget.
 */
class Filter_Static {

	/**
	 * Per-request memo of the resolved static-filter config.
	 *
	 * @var array<int, array<string, mixed>>|null
	 */
	private static $config_cache = null;

	/**
	 * Site-configured static-filter list, memoized per request. Reads raw
	 * entries from the hooks, normalizes, dedupes by `filter_id`.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	public static function get_static_filters_config(): array {
		if ( null !== self::$config_cache ) {
			return self::$config_cache;
		}
		self::$config_cache = self::dedupe_by_filter_id(
			self::normalize_entries( self::read_raw_entries() )
		);
		return self::$config_cache;
	}

	/**
	 * Reset the per-request memo. Tests only.
	 */
	public static function reset_cache_for_testing(): void {
		self::$config_cache = null;
	}

	/**
	 * Read raw entries — union of legacy `jetpack_instant_search_options`
	 * (`staticFilters` key, overlay-era) and `jetpack_search_static_filters`
	 * (narrower, blocks-only). Sites wired up for the overlay get the block for free.
	 *
	 * @return array<int, mixed>
	 */
	private static function read_raw_entries(): array {
		if ( ! function_exists( 'apply_filters' ) ) {
			return array();
		}
		$options     = apply_filters( 'jetpack_instant_search_options', array() );
		$from_legacy = is_array( $options['staticFilters'] ?? null )
			? $options['staticFilters']
			: array();
		return (array) apply_filters( 'jetpack_search_static_filters', $from_legacy );
	}

	/**
	 * Normalise a raw entry list, dropping ones that don't pass validation.
	 *
	 * @param array<int, mixed> $raw Raw entries from the filter hooks.
	 * @return array<int, array<string, mixed>>
	 */
	private static function normalize_entries( array $raw ): array {
		$out = array();
		foreach ( $raw as $entry ) {
			$normalized = self::normalize_entry( $entry );
			if ( null !== $normalized ) {
				$out[] = $normalized;
			}
		}
		return $out;
	}

	/**
	 * Collapse duplicates by `filter_id`, last-write-wins. Original position
	 * is preserved so iteration order stays deterministic.
	 *
	 * @param array<int, array<string, mixed>> $entries Normalized entries.
	 * @return array<int, array<string, mixed>>
	 */
	private static function dedupe_by_filter_id( array $entries ): array {
		$position = array();
		$out      = array();
		foreach ( $entries as $entry ) {
			$filter_id = $entry['filter_id'];
			if ( isset( $position[ $filter_id ] ) ) {
				self::warn_duplicate_filter_id( $filter_id );
				$out[ $position[ $filter_id ] ] = $entry;
				continue;
			}
			$position[ $filter_id ] = count( $out );
			$out[]                  = $entry;
		}
		return $out;
	}

	/**
	 * Surface duplicate registration via `_doing_it_wrong()`. Silent in production.
	 *
	 * @param string $filter_id The colliding filter id.
	 */
	private static function warn_duplicate_filter_id( string $filter_id ): void {
		if ( ! function_exists( '_doing_it_wrong' ) ) {
			return;
		}
		$message = sprintf(
			/* translators: %s: duplicate filter ID. */
			esc_html__( 'Duplicate static filter "%s" — last registration wins.', 'jetpack-search-pkg' ),
			esc_html( $filter_id )
		);
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $message is sprintf() of esc_html__() with esc_html()-wrapped arg.
		_doing_it_wrong( __METHOD__, $message, 'jetpack-search-pkg 7.0.0' );
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
	 * Normalize variation. Anything but `tabbed` collapses to `sidebar`
	 * (matches the legacy `getAvailableStaticFilters()` default).
	 *
	 * @param mixed $value Raw variation value.
	 * @return string Either 'sidebar' or 'tabbed'.
	 */
	public static function normalize_variation( $value ): string {
		return 'tabbed' === $value ? 'tabbed' : 'sidebar';
	}

	/**
	 * Sanitize + validate one entry. Returns null on missing required fields
	 * or a reserved-param collision — the block renders nothing for that entry
	 * rather than silently failing on round-trip.
	 *
	 * @param mixed $entry Raw entry from the filter hook.
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
		$values = self::normalize_values( $entry['values'] ?? array() );
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
	 * Sanitize the `values` array. Drops non-array entries and empty `value`s.
	 * Missing `name` falls back to value so the radio always has a label.
	 *
	 * @param mixed $raw Raw values list.
	 * @return array<int, array{value: string, name: string}>
	 */
	private static function normalize_values( $raw ): array {
		$out = array();
		foreach ( (array) $raw as $entry ) {
			if ( ! is_array( $entry ) ) {
				continue;
			}
			$value = sanitize_text_field( (string) ( $entry['value'] ?? '' ) );
			if ( '' === $value ) {
				continue;
			}
			$name  = sanitize_text_field( (string) ( $entry['name'] ?? '' ) );
			$out[] = array(
				'value' => $value,
				'name'  => '' === $name ? $value : $name,
			);
		}
		return $out;
	}

	/**
	 * Build the filterConfig entry. `kind => 'static'` is what the JS store
	 * checks for scalar URL serialization and the single-select action path.
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
	 * Block-attribute label overrides server name; empty falls back.
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
	 * Scalar URL params matching configured static-filter keys → `{ filter_id => value }`.
	 * Iterates configured filters (not `$_GET`) so arbitrary plugin params don't leak in.
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
		$out = array();
		foreach ( self::get_static_filters_config() as $entry ) {
			$filter_id = $entry['filter_id'];
			$value     = $raw[ $filter_id ] ?? null;
			// Drops missing values + array-shaped misuse (`?section[]=…`).
			if ( ! is_string( $value ) ) {
				continue;
			}
			$clean = sanitize_text_field( $value );
			if ( '' !== $clean ) {
				$out[ $filter_id ] = $clean;
			}
		}
		return $out;
	}
}
