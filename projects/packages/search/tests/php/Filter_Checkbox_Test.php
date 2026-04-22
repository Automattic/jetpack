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
	 * `maxItems` clamps to >= 1.
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
				'filterKey'  => 'category',
				'filterType' => 'taxonomy',
				'taxonomy'   => 'category',
				'label'      => 'Category',
				'showCount'  => true,
				'maxItems'   => 10,
			),
			$config
		);

		// Explicit label wins over the default.
		$custom = Filter_Checkbox::build_config(
			array(
				'filterType' => 'taxonomy',
				'taxonomy'   => 'category',
				'label'      => 'Topic',
				'showCount'  => false,
				'maxItems'   => 5,
			),
			'category'
		);
		$this->assertSame( 'Topic', $custom['label'] );
		$this->assertFalse( $custom['showCount'] );
		$this->assertSame( 5, $custom['maxItems'] );

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
	 * Aggregations are emitted as one term aggregation per filterConfig
	 * and use the `slug_slash_name` fields for taxonomies/authors so
	 * bucket keys carry display labels back to the client.
	 */
	public function test_build_aggregations_emits_term_aggs_for_known_types() {
		$configs = array(
			'category'   => array(
				'filterKey'  => 'category',
				'filterType' => 'taxonomy',
				'taxonomy'   => 'category',
				'maxItems'   => 10,
			),
			'post_tag'   => array(
				'filterKey'  => 'post_tag',
				'filterType' => 'taxonomy',
				'taxonomy'   => 'post_tag',
				'maxItems'   => 5,
			),
			'post_types' => array(
				'filterKey'  => 'post_types',
				'filterType' => 'post_type',
				'maxItems'   => 20,
			),
			'authors'    => array(
				'filterKey'  => 'authors',
				'filterType' => 'author',
				'maxItems'   => 10,
			),
			'unknown'    => array(
				'filterKey'  => 'unknown',
				'filterType' => 'unsupported',
			),
		);
		$aggs    = Filter_Checkbox::build_aggregations( $configs );

		$this->assertSame( 'category.slug_slash_name', $aggs['category']['terms']['field'] );
		$this->assertSame( 10, $aggs['category']['terms']['size'] );
		$this->assertSame( 'tag.slug_slash_name', $aggs['post_tag']['terms']['field'] );
		$this->assertSame( 5, $aggs['post_tag']['terms']['size'] );
		$this->assertSame( 'post_type', $aggs['post_types']['terms']['field'] );
		$this->assertSame( 'author_login_slash_name', $aggs['authors']['terms']['field'] );
		$this->assertArrayNotHasKey( 'unknown', $aggs, 'Unsupported filterType should be silently dropped.' );
	}

	/**
	 * Filter clause uses the plain `.slug` / post_type fields for term
	 * clauses (values are slugs), OR-wraps multi-select selections per
	 * filterKey, and AND-wraps distinct filterKeys under a `bool.must`.
	 */
	public function test_build_filter_clause_or_within_and_across() {
		$configs = array(
			'category'   => array(
				'filterKey'  => 'category',
				'filterType' => 'taxonomy',
				'taxonomy'   => 'category',
			),
			'post_types' => array(
				'filterKey'  => 'post_types',
				'filterType' => 'post_type',
			),
		);
		$active  = array(
			'category'   => array( 'news', 'sport' ),
			'post_types' => array( 'post' ),
		);
		$clause  = Filter_Checkbox::build_filter_clause( $active, $configs );

		$this->assertNotNull( $clause );
		$must = $clause['bool']['must'];
		$this->assertCount( 2, $must );

		// First filter has 2 values → should OR into a bool.should, with
		// category.slug as the term field (not the slug_slash_name agg field).
		$this->assertSame(
			array( 'term' => array( 'category.slug' => 'news' ) ),
			$must[0]['bool']['should'][0]
		);
		$this->assertSame(
			array( 'term' => array( 'category.slug' => 'sport' ) ),
			$must[0]['bool']['should'][1]
		);

		// Second filter has 1 value → flat term clause, not wrapped in should.
		$this->assertSame(
			array( 'term' => array( 'post_type' => 'post' ) ),
			$must[1]
		);
	}

	/**
	 * Empty selections and configs must return null so the caller can omit
	 * the filter clause from the ES request entirely.
	 */
	public function test_build_filter_clause_returns_null_when_nothing_active() {
		$this->assertNull( Filter_Checkbox::build_filter_clause( array(), array() ) );
		$this->assertNull( Filter_Checkbox::build_filter_clause( array( 'category' => array() ), array() ) );
		$this->assertNull(
			Filter_Checkbox::build_filter_clause(
				array( 'category' => array( 'news' ) ),
				array() // No matching config → clause skipped.
			)
		);
	}
}
