<?php
/**
 * Filter_Wc_Attribute helper tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Tests for the WC product attribute filter block helper class.
 *
 * Covers the slug-derivation guards and the filterConfig shape since both
 * are load-bearing for the URL gate (`Search_Blocks::gate_active_filters`)
 * and the JS aggregation/filter-clause builders.
 */
class Filter_Wc_Attribute_Test extends TestCase {

	public function test_derive_filter_key_returns_pa_slug() {
		$this->assertSame(
			'pa_color',
			Filter_Wc_Attribute::derive_filter_key(
				array( 'attributeTaxonomy' => 'pa_color' )
			)
		);
	}

	public function test_derive_filter_key_rejects_empty_slug() {
		$this->assertSame(
			'',
			Filter_Wc_Attribute::derive_filter_key( array( 'attributeTaxonomy' => '' ) )
		);
		$this->assertSame( '', Filter_Wc_Attribute::derive_filter_key( array() ) );
	}

	public function test_derive_filter_key_rejects_non_pa_taxonomy() {
		// Defensive: a category slug saved through the editor (manual JSON
		// edit, schema drift) must not mint an attribute-shaped filter
		// against a taxonomy that isn't a WC product attribute.
		$this->assertSame(
			'',
			Filter_Wc_Attribute::derive_filter_key(
				array( 'attributeTaxonomy' => 'category' )
			)
		);
	}

	public function test_derive_filter_key_rejects_reserved_query_param() {
		// `s`, `orderby`, `min_price`, `max_price` are RESERVED_QUERY_PARAMS.
		// A `pa_*` taxonomy can't collide with them, but the guard is the
		// same shared one Filter_Checkbox uses, so verify it's wired up.
		$this->assertSame(
			'',
			Filter_Wc_Attribute::derive_filter_key(
				array( 'attributeTaxonomy' => 'orderby' )
			)
		);
	}

	public function test_build_config_shapes_filter_type_as_taxonomy() {
		// JS reads filterType=taxonomy + taxonomy=<slug> to compose the ES
		// `taxonomy.<slug>.slug_slash_name` aggregation field. Mirrors how
		// filter-checkbox custom-taxonomy variations work so the data plane
		// is shared.
		$config = Filter_Wc_Attribute::build_config(
			array(
				'attributeTaxonomy' => 'pa_color',
				'label'             => 'Colour',
				'showCount'         => true,
				'maxItems'          => 15,
				'bucketSortOrder'   => 'alpha',
			),
			'pa_color'
		);
		$this->assertSame( 'taxonomy', $config['filterType'] );
		$this->assertSame( 'pa_color', $config['taxonomy'] );
		$this->assertSame( 'pa_color', $config['filterKey'] );
		$this->assertSame( 'Colour', $config['label'] );
		$this->assertTrue( $config['showCount'] );
		$this->assertSame( 15, $config['maxItems'] );
		$this->assertSame( 'alpha', $config['bucketSortOrder'] );
	}

	public function test_build_config_falls_back_to_default_label_when_attribute_label_empty() {
		// In a non-WP context (no get_taxonomy()) the fallback humanizes
		// the slug — verify the fallback path so the chip doesn't render
		// "Pa_screen_size: …" when a registered taxonomy is missing labels.
		$config = Filter_Wc_Attribute::build_config(
			array(
				'attributeTaxonomy' => 'pa_screen_size',
				'label'             => '',
			),
			'pa_screen_size'
		);
		$this->assertSame( 'Screen Size', $config['label'] );
	}

	public function test_build_config_clamps_negative_max_items_to_one() {
		$config = Filter_Wc_Attribute::build_config(
			array(
				'attributeTaxonomy' => 'pa_color',
				'maxItems'          => -3,
			),
			'pa_color'
		);
		$this->assertSame( 1, $config['maxItems'] );
	}
}
