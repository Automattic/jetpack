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

	public function test_derive_filter_key_rejects_non_pa_prefix_including_reserved_params() {
		// Reserved params (`s`, `orderby`, etc.) don't start with `pa_`, so
		// the prefix guard fires first. The reserved-param check is a secondary
		// safety net that can't be triggered in practice for this block (no
		// reserved param starts with `pa_`), but the prefix guard rejects
		// anything outside the `pa_*` namespace, which covers the intent.
		$this->assertSame( '', Filter_Wc_Attribute::derive_filter_key( array( 'attributeTaxonomy' => 'orderby' ) ) );
		$this->assertSame( '', Filter_Wc_Attribute::derive_filter_key( array( 'attributeTaxonomy' => 's' ) ) );
		$this->assertSame( '', Filter_Wc_Attribute::derive_filter_key( array( 'attributeTaxonomy' => 'min_price' ) ) );
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
		$this->assertSame( array(), $config['valueLabels'] );
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

	public function test_build_config_clamps_zero_max_items_to_one() {
		$config = Filter_Wc_Attribute::build_config(
			array(
				'attributeTaxonomy' => 'pa_color',
				'maxItems'          => 0,
			),
			'pa_color'
		);
		$this->assertSame( 1, $config['maxItems'] );
	}

	public function test_default_label_returns_empty_for_non_pa_prefixed_slug() {
		// Mirrors the prefix guard in derive_filter_key() so a future caller
		// that skips build_config() can't coerce a non-WC taxonomy slug into
		// a humanized label this block doesn't represent.
		$this->assertSame( '', Filter_Wc_Attribute::default_label( array( 'attributeTaxonomy' => 'category' ) ) );
		$this->assertSame( '', Filter_Wc_Attribute::default_label( array( 'attributeTaxonomy' => '' ) ) );
	}

	public function test_build_config_defaults_bucket_sort_order_to_count() {
		// When the attribute is omitted, normalize_bucket_sort_order() falls
		// through to the 'count' default. Locks the wired-up default so a
		// future refactor to that helper can't silently flip the order.
		$config = Filter_Wc_Attribute::build_config(
			array( 'attributeTaxonomy' => 'pa_color' ),
			'pa_color'
		);
		$this->assertSame( 'count', $config['bucketSortOrder'] );
	}
}
