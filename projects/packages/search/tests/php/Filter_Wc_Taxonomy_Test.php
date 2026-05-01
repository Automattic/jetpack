<?php
/**
 * Filter_Wc_Taxonomy helper tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Tests for the WC product taxonomy filter block helper class.
 *
 * Covers the slug allow-list, the per-slug default label fallback, and
 * the filterConfig shape — all three feed the URL gate and the JS
 * aggregation/filter-clause builders.
 */
class Filter_Wc_Taxonomy_Test extends TestCase {

	public function test_allowed_taxonomies_lists_the_three_product_taxonomies() {
		$this->assertSame(
			array( 'product_cat', 'product_tag', 'product_brand' ),
			Filter_Wc_Taxonomy::get_allowed_taxonomies()
		);
	}

	public function test_derive_filter_key_accepts_product_taxonomies() {
		foreach ( array( 'product_cat', 'product_tag', 'product_brand' ) as $slug ) {
			$this->assertSame(
				$slug,
				Filter_Wc_Taxonomy::derive_filter_key( array( 'taxonomy' => $slug ) ),
				"derive_filter_key should accept $slug"
			);
		}
	}

	public function test_derive_filter_key_rejects_out_of_list_slug() {
		// The block is opinionated — non-product taxonomies route through
		// the filter-checkbox custom-taxonomy variation instead.
		$this->assertSame(
			'',
			Filter_Wc_Taxonomy::derive_filter_key( array( 'taxonomy' => 'category' ) )
		);
		$this->assertSame(
			'',
			Filter_Wc_Taxonomy::derive_filter_key( array( 'taxonomy' => 'post_tag' ) )
		);
	}

	public function test_derive_filter_key_rejects_empty_slug() {
		$this->assertSame(
			'',
			Filter_Wc_Taxonomy::derive_filter_key( array( 'taxonomy' => '' ) )
		);
		$this->assertSame( '', Filter_Wc_Taxonomy::derive_filter_key( array() ) );
	}

	public function test_default_label_falls_back_per_slug_without_registered_taxonomy() {
		// Plain phpunit run — no WC taxonomies are registered, so
		// get_taxonomy() returns null and the per-slug English fallbacks
		// kick in. Production WC sites override this via the labels
		// branch so localized installs render correctly.
		$this->assertSame(
			'Category',
			Filter_Wc_Taxonomy::default_label( array( 'taxonomy' => 'product_cat' ) )
		);
		$this->assertSame(
			'Tag',
			Filter_Wc_Taxonomy::default_label( array( 'taxonomy' => 'product_tag' ) )
		);
		$this->assertSame(
			'Brand',
			Filter_Wc_Taxonomy::default_label( array( 'taxonomy' => 'product_brand' ) )
		);
	}

	public function test_default_label_returns_empty_for_empty_slug() {
		$this->assertSame(
			'',
			Filter_Wc_Taxonomy::default_label( array( 'taxonomy' => '' ) )
		);
	}

	public function test_build_config_shapes_filter_type_as_taxonomy() {
		$config = Filter_Wc_Taxonomy::build_config(
			array(
				'taxonomy'        => 'product_cat',
				'label'           => '',
				'showCount'       => true,
				'maxItems'        => 12,
				'bucketSortOrder' => 'count',
			),
			'product_cat'
		);
		$this->assertSame( 'taxonomy', $config['filterType'] );
		$this->assertSame( 'product_cat', $config['taxonomy'] );
		$this->assertSame( 'product_cat', $config['filterKey'] );
		// Empty label rolls forward to the per-slug default so the chip
		// always has a group prefix.
		$this->assertSame( 'Category', $config['label'] );
		$this->assertSame( 12, $config['maxItems'] );
	}

	public function test_build_config_honors_custom_label() {
		$config = Filter_Wc_Taxonomy::build_config(
			array(
				'taxonomy' => 'product_brand',
				'label'    => 'Marca',
			),
			'product_brand'
		);
		$this->assertSame( 'Marca', $config['label'] );
	}
}
