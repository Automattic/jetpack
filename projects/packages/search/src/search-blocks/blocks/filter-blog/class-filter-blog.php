<?php
/**
 * Filter-blog block helpers.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Helper methods for the jetpack/filter-blog block.
 *
 * Resolves the static blog list from the legacy `blogIdFilteringLabels`
 * option (populated by consumers via the long-standing
 * `jetpack_instant_search_options` filter — see
 * `Helper::generate_initial_javascript_state()`). Conventions mirror
 * src/instant-search/lib/filters.js: filter key is `blog_ids`, ES field is
 * `blog_id`, deep links round-trip with the legacy overlay.
 */
class Filter_Blog {

	const FILTER_KEY = 'blog_ids';

	/**
	 * Memoized blog options for the current request.
	 *
	 * @var array<int, array{value: string, label: string}>|null
	 */
	protected static $options_cache = null;

	/**
	 * Build the filterConfig entry this block contributes to the shared
	 * Interactivity state.
	 *
	 * @param array $attributes Block attributes.
	 * @return array<string, mixed>
	 */
	public static function build_config( array $attributes ): array {
		$label = sanitize_text_field( (string) ( $attributes['label'] ?? '' ) );
		if ( '' === $label ) {
			$label = static::default_label();
		}

		return array(
			'filterKey'  => self::FILTER_KEY,
			'filterType' => 'blog_id',
			'label'      => $label,
			'options'    => static::get_options(),
		);
	}

	/**
	 * Default group label.
	 *
	 * @return string
	 */
	public static function default_label(): string {
		return __( 'Blog', 'jetpack-search-pkg' );
	}

	/**
	 * Resolve the static `[ { value, label } ]` blog list from the legacy
	 * widget's `blogIdFilteringLabels` option. Sorted alphabetically by
	 * label so the radio order is stable across requests.
	 *
	 * @return array<int, array{value: string, label: string}>
	 */
	public static function get_options(): array {
		if ( null !== self::$options_cache ) {
			return self::$options_cache;
		}
		$options = array();
		if ( function_exists( 'apply_filters' ) ) {
			/** This filter is documented in src/class-helper.php */
			$server_options = apply_filters( 'jetpack_instant_search_options', array() );
			if ( is_array( $server_options ) && ! empty( $server_options['blogIdFilteringLabels'] ) && is_array( $server_options['blogIdFilteringLabels'] ) ) {
				foreach ( $server_options['blogIdFilteringLabels'] as $blog_id => $label ) {
					$value = (string) $blog_id;
					$label = sanitize_text_field( (string) $label );
					if ( '' === $value || '' === $label ) {
						continue;
					}
					$options[] = array(
						'value' => $value,
						'label' => $label,
					);
				}
				usort(
					$options,
					static function ( $a, $b ) {
						return strcasecmp( $a['label'], $b['label'] );
					}
				);
			}
		}
		self::$options_cache = $options;
		return self::$options_cache;
	}

	/**
	 * Reset the memoized options cache. Test-only.
	 */
	public static function reset_options_cache(): void {
		self::$options_cache = null;
	}
}
