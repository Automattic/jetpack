<?php
/**
 * Filter-checkbox block helpers.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Helper methods for the jetpack/filter-checkbox block.
 */
class Filter_Checkbox {

	/**
	 * ES field names for well-known filter types.
	 * These map to the actual Jetpack Search index fields.
	 */
	const ES_FIELDS = array(
		'post_type' => 'post_type',
		'author'    => 'author_login',
		'category'  => 'category.slug',
		'post_tag'  => 'tag.slug',
	);

	/**
	 * Derive a stable, URL-safe filter key from block attributes.
	 *
	 * @param array $attributes Block attributes.
	 * @return string  e.g. 'category', 'post_type', 'author', 'taxonomy_genre', 'meta_color'.
	 */
	public static function derive_filter_key( array $attributes ): string {
		switch ( $attributes['filterType'] ?? '' ) {
			case 'taxonomy':
				$taxonomy = sanitize_key( $attributes['taxonomy'] ?? '' );
				if ( 'category' === $taxonomy ) {
					return 'category';
				}
				if ( 'post_tag' === $taxonomy ) {
					return 'post_tag';
				}
				return '' !== $taxonomy ? 'taxonomy_' . $taxonomy : '';
			case 'post_type':
				return 'post_type';
			case 'author':
				return 'author';
			case 'post_meta':
				$meta = sanitize_key( $attributes['metaKey'] ?? '' );
				return '' !== $meta ? 'meta_' . $meta : '';
		}
		return 'filter_' . sanitize_key( (string) ( $attributes['filterType'] ?? '' ) );
	}

	/**
	 * Derive the Elasticsearch field name for the filter key.
	 *
	 * @param array  $attributes Block attributes.
	 * @param string $filter_key Result of derive_filter_key().
	 * @return string ES field name, or empty string if unknown.
	 */
	public static function derive_es_field( array $attributes, string $filter_key ): string {
		if ( isset( self::ES_FIELDS[ $filter_key ] ) ) {
			return self::ES_FIELDS[ $filter_key ];
		}
		// Block attributes are author-controlled (edit_posts), so the blast
		// radius is small, but sanitize_key() here keeps the derived ES field
		// well-formed even if a crafted REST save stored unusual characters,
		// and matches the sanitisation already applied in derive_filter_key().
		if ( 'taxonomy' === ( $attributes['filterType'] ?? '' ) ) {
			$taxonomy = sanitize_key( $attributes['taxonomy'] ?? '' );
			return '' !== $taxonomy ? 'taxonomy.' . $taxonomy . '.slug_slash_name' : '';
		}
		if ( 'post_meta' === ( $attributes['filterType'] ?? '' ) && ! empty( $attributes['metaKey'] ) ) {
			$meta_key = sanitize_key( $attributes['metaKey'] );
			return '' !== $meta_key ? 'meta.' . $meta_key . '.value' : '';
		}
		return '';
	}

	/**
	 * Get initial items for server-side rendering of the checkbox list.
	 *
	 * In dynamic mode, fetch from WordPress (taxonomy terms, post types, authors).
	 * In curated mode, use the configured curatedValues array directly.
	 *
	 * @param array $attributes Block attributes.
	 * @return array<array{value: string, label: string}>
	 */
	public static function get_initial_items( array $attributes ): array {
		if ( 'curated' === ( $attributes['displayMode'] ?? 'dynamic' ) ) {
			return array_values(
				array_filter(
					array_map(
						static function ( $item ) {
							$value = sanitize_text_field( $item['value'] ?? '' );
							$label = sanitize_text_field( $item['label'] ?? $value );
							return '' === $value ? null : array(
								'value' => $value,
								'label' => $label,
							);
						},
						(array) ( $attributes['curatedValues'] ?? array() )
					)
				)
			);
		}

		$max = max( 1, (int) ( $attributes['maxItems'] ?? 10 ) );

		switch ( $attributes['filterType'] ?? '' ) {
			case 'taxonomy':
				$taxonomy = (string) ( $attributes['taxonomy'] ?? '' );
				if ( '' === $taxonomy ) {
					return array();
				}
				$terms = get_terms(
					array(
						'taxonomy'   => $taxonomy,
						'hide_empty' => true,
						'number'     => $max,
					)
				);
				if ( is_wp_error( $terms ) ) {
					return array();
				}
				return array_map(
					static fn( $t ) => array(
						'value' => $t->slug,
						'label' => $t->name,
					),
					$terms
				);

			case 'post_type':
				$types = get_post_types( array( 'public' => true ), 'objects' );
				return array_slice(
					array_map(
						static fn( $t ) => array(
							'value' => $t->name,
							'label' => $t->labels->name,
						),
						$types
					),
					0,
					$max
				);

			case 'author':
				$authors = get_users(
					array(
						'has_published_posts' => true,
						'number'              => $max,
						'fields'              => array( 'user_login', 'display_name' ),
					)
				);
				return array_map(
					static fn( $u ) => array(
						'value' => $u->user_login,
						'label' => $u->display_name,
					),
					$authors
				);
		}

		return array();
	}
}
