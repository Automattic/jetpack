<?php
/**
 * Search product filter — WooCommerce attribute block helpers.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Helper methods for the jetpack-search/filter-wc-attribute block.
 *
 * Each block instance targets one WooCommerce attribute taxonomy
 * (`pa_color`, `pa_size`, …) chosen by the block author. Internally the
 * filter rides the same `filterType: 'taxonomy'` plumbing as the generic
 * filter-checkbox block — `resolveFilterFields()` already maps any
 * `taxonomy.<slug>.slug_slash_name` aggregation field, so the data plane
 * doesn't need a new branch. The block exists as its own type (rather than
 * a filter-checkbox variation) so the inserter / inspector can constrain
 * the picker to `pa_*` taxonomies and surface attribute-specific defaults.
 */
class Filter_Wc_Attribute {

	/**
	 * Common WC product-attribute taxonomy prefix. WooCommerce registers each
	 * product attribute as a regular WP taxonomy whose slug is prefixed `pa_`
	 * (Product Attribute). Using a single constant keeps the prefix in one
	 * place so the picker, the validator, and the editor preview agree.
	 */
	const ATTRIBUTE_PREFIX = 'pa_';

	/**
	 * Derive the URL key + filterConfigs key for this block instance.
	 *
	 * Returns the chosen attribute slug verbatim (sanitized). An empty or
	 * reserved slug short-circuits to '' so render.php can bail early
	 * without registering a half-formed filter — same pattern as
	 * Filter_Checkbox::derive_filter_key().
	 *
	 * @param array $attributes Block attributes.
	 * @return string
	 */
	public static function derive_filter_key( array $attributes ): string {
		$slug = sanitize_key( (string) ( $attributes['attributeTaxonomy'] ?? '' ) );
		if ( '' === $slug || in_array( $slug, Search_Blocks::RESERVED_QUERY_PARAMS, true ) ) {
			return '';
		}
		// Defensive prefix check: if a site builder somehow saves a non-`pa_`
		// taxonomy through the editor (manual block JSON edit, schema drift,
		// etc.), short-circuit so we don't mint a filter contract that the
		// attribute block's UX promises will be a WC product attribute.
		if ( 0 !== strpos( $slug, self::ATTRIBUTE_PREFIX ) ) {
			return '';
		}
		return $slug;
	}

	/**
	 * Default group label when the block author leaves the label attribute
	 * empty. Prefers the registered taxonomy's `singular_name` (so a
	 * `pa_color` attribute reads "Color"), falls back to a humanized form of
	 * the slug-stripped name. WC stores attribute labels separately from
	 * taxonomy labels in some configurations — the taxonomy label is the
	 * version users actually see in the admin, so we use it.
	 *
	 * @param array $attributes Block attributes.
	 * @return string
	 */
	public static function default_label( array $attributes ): string {
		$slug = sanitize_key( (string) ( $attributes['attributeTaxonomy'] ?? '' ) );
		// Mirror the prefix guard from derive_filter_key() so a non-`pa_*` slug
		// reaching this method directly (a future caller skipping build_config)
		// still resolves to '' rather than producing a humanized label for a
		// taxonomy this block doesn't represent.
		if ( '' === $slug || 0 !== strpos( $slug, self::ATTRIBUTE_PREFIX ) ) {
			return '';
		}
		if ( function_exists( 'get_taxonomy' ) ) {
			$tax = get_taxonomy( $slug );
			if ( $tax && ! empty( $tax->labels->singular_name ) ) {
				return (string) $tax->labels->singular_name;
			}
		}
		// Fall back to the slug with the `pa_` prefix stripped and underscores
		// upper-cased ("pa_screen_size" → "Screen Size"). Matches what an
		// admin would see if the taxonomy had no label registered yet.
		$bare = preg_replace( '/^' . preg_quote( self::ATTRIBUTE_PREFIX, '/' ) . '/', '', $slug );
		$bare = (string) str_replace( '_', ' ', (string) $bare );
		return ucwords( $bare );
	}

	/**
	 * Build the filterConfig entry this block contributes to the shared
	 * Interactivity state. JS reads `filterType: 'taxonomy'` to drive the
	 * `taxonomy.<slug>.slug_slash_name` aggregation field and the same
	 * `term` filter clause shape as filter-checkbox.
	 *
	 * @param array  $attributes Block attributes.
	 * @param string $filter_key Result of derive_filter_key().
	 * @return array<string, mixed>
	 */
	public static function build_config( array $attributes, string $filter_key ): array {
		$label = sanitize_text_field( (string) ( $attributes['label'] ?? '' ) );
		if ( '' === $label ) {
			$label = static::default_label( $attributes );
		}

		return array(
			'filterKey'       => $filter_key,
			'filterType'      => 'taxonomy',
			// resolveFilterFields() reads `taxonomy` to compose the ES path
			// (`taxonomy.<slug>.slug_slash_name`). Mirror filter-checkbox so
			// the field shape is identical and any future bridge work doesn't
			// have to special-case attribute filters.
			'taxonomy'        => $filter_key,
			'label'           => $label,
			'showCount'       => (bool) ( $attributes['showCount'] ?? true ),
			'maxItems'        => max( 1, (int) ( $attributes['maxItems'] ?? 10 ) ),
			'bucketSortOrder' => Filter_Checkbox::normalize_bucket_sort_order(
				$attributes['bucketSortOrder'] ?? null
			),
			'valueLabels'     => array(),
		);
	}
}
