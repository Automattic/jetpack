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
		// Product taxonomies get distinct "Product X" defaults so they don't
		// collide visually with the post-taxonomy variations on the same page.
		$this->assertSame(
			'Product Category',
			Filter_Checkbox::default_label(
				array(
					'filterType' => 'taxonomy',
					'taxonomy'   => 'product_cat',
				)
			)
		);
		$this->assertSame(
			'Product Tag',
			Filter_Checkbox::default_label(
				array(
					'filterType' => 'taxonomy',
					'taxonomy'   => 'product_tag',
				)
			)
		);
		$this->assertSame(
			'Product Brand',
			Filter_Checkbox::default_label(
				array(
					'filterType' => 'taxonomy',
					'taxonomy'   => 'product_brand',
				)
			)
		);
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
				// `effectiveSlug` mirrors `taxonomy` for built-in slugs and
				// natively-indexed custom slugs; the slot-mapping case is
				// exercised in `Search_Blocks::resolve_taxonomy_slot`'s own
				// test.
				'effectiveSlug'   => 'category',
				'label'           => 'Category',
				'showCount'       => true,
				'maxItems'        => 10,
				'bucketSortOrder' => 'count',
				// AND/OR combination of multi-value selections. Default OR
				// matches Search 3.0's broaden-on-click UX.
				'queryType'       => 'or',
				// Taxonomy buckets carry their label inline (slug_slash_name), so
				// no value→label seeding is needed.
				'valueLabels'     => array(),
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
	 * Post-type filters seed a `valueLabels` map keyed by post-type slug so the
	 * active-filter pill can render the post type's `singular_name` (e.g.
	 * "Post Type: Post") instead of the raw `post` slug. Post-type aggregation
	 * buckets are bare slugs with no `slug_slash_name` variant, so without
	 * this map the pill has nothing else to display. Other filter types skip
	 * the map because their `slug_slash_name` buckets carry the label inline.
	 */
	public function test_build_config_seeds_value_labels_for_post_type() {
		register_post_type(
			'rsm_book',
			array(
				'public'              => true,
				'exclude_from_search' => false,
				'labels'              => array( 'singular_name' => 'Book' ),
			)
		);

		$config = Filter_Checkbox::build_config(
			array( 'filterType' => 'post_type' ),
			'post_types'
		);
		$this->assertArrayHasKey( 'valueLabels', $config );
		$this->assertSame( 'Book', $config['valueLabels']['rsm_book'] ?? null );

		// Taxonomy and author filters skip the map — their buckets carry labels.
		$taxonomy_config = Filter_Checkbox::build_config(
			array(
				'filterType' => 'taxonomy',
				'taxonomy'   => 'category',
			),
			'category'
		);
		$this->assertSame( array(), $taxonomy_config['valueLabels'] );

		$author_config = Filter_Checkbox::build_config(
			array( 'filterType' => 'author' ),
			'authors'
		);
		$this->assertSame( array(), $author_config['valueLabels'] );

		unregister_post_type( 'rsm_book' );
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
	 * Display style supports only checkbox-list or chips; unknown values map
	 * to checkbox-list so the wrapper always emits a known CSS hook.
	 */
	public function test_normalize_display_style() {
		$this->assertSame( 'checkbox-list', Filter_Checkbox::normalize_display_style( null ) );
		$this->assertSame( 'checkbox-list', Filter_Checkbox::normalize_display_style( '' ) );
		$this->assertSame( 'checkbox-list', Filter_Checkbox::normalize_display_style( 'checkbox-list' ) );
		$this->assertSame( 'checkbox-list', Filter_Checkbox::normalize_display_style( 'bogus' ) );
		$this->assertSame( 'chips', Filter_Checkbox::normalize_display_style( 'chips' ) );
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

	/**
	 * The queryType attribute accepts only the literal 'and' AND only for taxonomy filters.
	 * Tampered saved data with `queryType: 'and'` on a post_type or author
	 * block would otherwise produce an ES query that always returns zero
	 * results (each doc has one post_type / author).
	 */
	public function test_normalize_query_type() {
		// Default: anything missing / garbage / explicit 'or' collapses to 'or'.
		$this->assertSame( 'or', Filter_Checkbox::normalize_query_type( null, 'taxonomy' ) );
		$this->assertSame( 'or', Filter_Checkbox::normalize_query_type( '', 'taxonomy' ) );
		$this->assertSame( 'or', Filter_Checkbox::normalize_query_type( 'banana', 'taxonomy' ) );
		$this->assertSame( 'or', Filter_Checkbox::normalize_query_type( 'or', 'taxonomy' ) );

		// 'and' is honoured only for taxonomy filters.
		$this->assertSame( 'and', Filter_Checkbox::normalize_query_type( 'and', 'taxonomy' ) );
		$this->assertSame( 'or', Filter_Checkbox::normalize_query_type( 'and', 'post_type' ) );
		$this->assertSame( 'or', Filter_Checkbox::normalize_query_type( 'and', 'author' ) );
		$this->assertSame( 'or', Filter_Checkbox::normalize_query_type( 'and', '' ) );
	}

	/**
	 * The queryType attribute round-trips through build_config so the JS-side ES query
	 * builder can read it off the filterConfig entry without re-querying
	 * the block attributes.
	 */
	public function test_build_config_round_trips_query_type_for_taxonomy() {
		$config = Filter_Checkbox::build_config(
			array(
				'filterType' => 'taxonomy',
				'taxonomy'   => 'category',
				'queryType'  => 'and',
			),
			'category'
		);
		$this->assertSame( 'and', $config['queryType'] );
	}

	/**
	 * Defensive gate: build_config must not echo `queryType: 'and'` back for
	 * post_type / author saved data. Hiding the inspector control on those
	 * variations is the primary defense, but tampered serialized markup or
	 * legacy saves shouldn't be able to slip past it.
	 */
	public function test_build_config_drops_query_type_and_for_non_taxonomy_filters() {
		foreach ( array( 'post_type', 'author' ) as $filter_type ) {
			$config = Filter_Checkbox::build_config(
				array(
					'filterType' => $filter_type,
					'queryType'  => 'and',
				),
				'post_type' === $filter_type ? 'post_types' : 'authors'
			);
			$this->assertSame(
				'or',
				$config['queryType'],
				"queryType=and must collapse to 'or' for {$filter_type} filters."
			);
		}
	}
}
