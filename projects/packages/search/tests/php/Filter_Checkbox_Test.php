<?php
/**
 * Filter_Checkbox helper tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Tests for Filter_Checkbox helpers — filter-key derivation, default labels,
 * and aggregation / filter-clause builders that back the block's SSR path.
 */
class Filter_Checkbox_Test extends TestCase {

	/**
	 * Built-in filter variations map to stable keys that round-trip through
	 * the flat URL shape (store/url-state.js writes `?<key>[]=<value>`).
	 */
	public function test_derive_filter_key_for_built_in_variations() {
		$this->assertSame(
			'category',
			Filter_Checkbox::derive_filter_key(
				array(
					'filterType' => 'taxonomy',
					'taxonomy'   => 'category',
				)
			)
		);
		$this->assertSame(
			'post_tag',
			Filter_Checkbox::derive_filter_key(
				array(
					'filterType' => 'taxonomy',
					'taxonomy'   => 'post_tag',
				)
			)
		);
		$this->assertSame( 'post_types', Filter_Checkbox::derive_filter_key( array( 'filterType' => 'post_type' ) ) );
		$this->assertSame( 'authors', Filter_Checkbox::derive_filter_key( array( 'filterType' => 'author' ) ) );
	}

	/**
	 * A taxonomy slug that collides with a reserved URL param (`s`, `orderby`)
	 * must be rejected. parse_url_filters() and url-state.js both skip those
	 * keys, so a filter keyed on one would silently drop every selection.
	 */
	public function test_derive_filter_key_rejects_reserved_taxonomy_slugs() {
		foreach ( Search_Blocks::RESERVED_QUERY_PARAMS as $reserved ) {
			$this->assertSame(
				'',
				Filter_Checkbox::derive_filter_key(
					array(
						'filterType' => 'taxonomy',
						'taxonomy'   => $reserved,
					)
				),
				"Reserved taxonomy slug `$reserved` should produce an empty filter key."
			);
		}
	}

	/**
	 * Missing attributes and unknown filter types return an empty key so the
	 * render short-circuits instead of registering a broken filterConfig.
	 */
	public function test_derive_filter_key_returns_empty_for_unknown_or_missing_types() {
		$this->assertSame( '', Filter_Checkbox::derive_filter_key( array() ) );
		$this->assertSame( '', Filter_Checkbox::derive_filter_key( array( 'filterType' => 'unknown' ) ) );
		$this->assertSame( '', Filter_Checkbox::derive_filter_key( array( 'filterType' => 'taxonomy' ) ) );
		$this->assertSame(
			'',
			Filter_Checkbox::derive_filter_key(
				array(
					'filterType' => 'taxonomy',
					'taxonomy'   => '',
				)
			)
		);
	}

	/**
	 * Built-in filter types carry localized fallback labels so a pattern
	 * can omit an explicit label and still render sensible headings.
	 */
	public function test_default_label_returns_fallback_for_built_in_types() {
		// Strings come through the translation layer in production; in the
		// test environment with no loaded textdomain they fall through to the
		// original English, which is what we assert against here.
		$this->assertSame(
			'Category',
			Filter_Checkbox::default_label(
				array(
					'filterType' => 'taxonomy',
					'taxonomy'   => 'category',
				)
			)
		);
		$this->assertSame(
			'Tag',
			Filter_Checkbox::default_label(
				array(
					'filterType' => 'taxonomy',
					'taxonomy'   => 'post_tag',
				)
			)
		);
		$this->assertSame( 'Post Type', Filter_Checkbox::default_label( array( 'filterType' => 'post_type' ) ) );
		$this->assertSame( 'Author', Filter_Checkbox::default_label( array( 'filterType' => 'author' ) ) );
		// Custom taxonomies get no fallback — the editor user is expected to
		// provide a meaningful label.
		$this->assertSame(
			'',
			Filter_Checkbox::default_label(
				array(
					'filterType' => 'taxonomy',
					'taxonomy'   => 'genre',
				)
			)
		);
	}

	/**
	 * Config shape mirrors what the JS store consumes: missing label falls
	 * back to default_label(); falsy `showCount` round-trips as a boolean;
	 * `maxItems` clamps to >= 1; `bucketSortOrder` defaults to `count`.
	 */
	public function test_build_config_shape_and_defaults() {
		$config = Filter_Checkbox::build_config(
			array(
				'filterType' => 'taxonomy',
				'taxonomy'   => 'category',
			),
			'category'
		);
		$this->assertSame(
			array(
				'filterKey'       => 'category',
				'filterType'      => 'taxonomy',
				'taxonomy'        => 'category',
				'label'           => 'Category',
				'showCount'       => true,
				'maxItems'        => 10,
				'bucketSortOrder' => 'count',
			),
			$config
		);

		// Explicit label wins over the default.
		$custom = Filter_Checkbox::build_config(
			array(
				'filterType'      => 'taxonomy',
				'taxonomy'        => 'category',
				'label'           => 'Topic',
				'showCount'       => false,
				'maxItems'        => 5,
				'bucketSortOrder' => 'alpha',
			),
			'category'
		);
		$this->assertSame( 'Topic', $custom['label'] );
		$this->assertFalse( $custom['showCount'] );
		$this->assertSame( 5, $custom['maxItems'] );
		$this->assertSame( 'alpha', $custom['bucketSortOrder'] );

		// maxItems must clamp to at least 1 so the ES aggregation size is valid.
		$clamped = Filter_Checkbox::build_config(
			array(
				'filterType' => 'post_type',
				'maxItems'   => 0,
			),
			'post_types'
		);
		$this->assertSame( 1, $clamped['maxItems'] );
	}

	/**
	 * The bucketSortOrder attribute accepts only `count` | `alpha`; anything
	 * else falls back to `count` so aggregation requests always have a valid
	 * `order` clause and bucket order matches the instant-search overlay default.
	 */
	public function test_normalize_bucket_sort_order() {
		$this->assertSame( 'count', Filter_Checkbox::normalize_bucket_sort_order( null ) );
		$this->assertSame( 'count', Filter_Checkbox::normalize_bucket_sort_order( '' ) );
		$this->assertSame( 'count', Filter_Checkbox::normalize_bucket_sort_order( 'count' ) );
		$this->assertSame( 'count', Filter_Checkbox::normalize_bucket_sort_order( 'bogus' ) );
		$this->assertSame( 'alpha', Filter_Checkbox::normalize_bucket_sort_order( 'alpha' ) );
	}

	/**
	 * The label passes through sanitize_text_field() before it reaches the
	 * Interactivity state so stored block attributes with stray HTML, tabs, or
	 * newlines can never leak into aggregation-layer metadata or the rendered
	 * heading. Output is still esc_html()'d separately in render.php.
	 */
	public function test_build_config_sanitizes_label() {
		$config = Filter_Checkbox::build_config(
			array(
				'filterType' => 'post_type',
				'label'      => "  <b>Topic</b>\nextra  ",
			),
			'post_types'
		);
		$this->assertSame( 'Topic extra', $config['label'] );
	}

	/**
	 * An invalid bucketSortOrder in the stored attributes must never reach
	 * the config map — the JS `buildAggregations()` path maps anything
	 * non-'alpha' to the count-desc order, but normalizing up front keeps
	 * the serialized Interactivity state narrow.
	 */
	public function test_build_config_falls_back_bucket_sort_order_for_unknown_values() {
		$config = Filter_Checkbox::build_config(
			array(
				'filterType'      => 'post_type',
				'bucketSortOrder' => 'something-else',
			),
			'post_types'
		);
		$this->assertSame( 'count', $config['bucketSortOrder'] );
	}
}
