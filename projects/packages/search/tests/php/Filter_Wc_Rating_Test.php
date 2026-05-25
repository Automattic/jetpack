<?php
/**
 * Filter_Wc_Rating helper tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Tests for Filter_Wc_Rating helpers.
 */
class Filter_Wc_Rating_Test extends TestCase {

	/**
	 * Filter key is `rating_filter` regardless of attributes.
	 */
	public function test_derive_filter_key_returns_rating_filter_constant() {
		$this->assertSame( 'rating_filter', Filter_Wc_Rating::FILTER_KEY );
		$this->assertSame( 'rating_filter', Filter_Wc_Rating::derive_filter_key( array() ) );
		$this->assertSame( 'rating_filter', Filter_Wc_Rating::derive_filter_key( array( 'ignored' => 'value' ) ) );
	}

	/**
	 * Pin the dev-time invariant that FILTER_KEY isn't reserved.
	 */
	public function test_filter_key_does_not_collide_with_reserved_params() {
		$this->assertNotContains( Filter_Wc_Rating::FILTER_KEY, Search_Blocks::RESERVED_QUERY_PARAMS );
	}

	/**
	 * Default label.
	 */
	public function test_default_label_returns_rating() {
		$this->assertSame( 'Rating', Filter_Wc_Rating::default_label() );
	}

	/**
	 * Star values list is 5..1 (descending).
	 */
	public function test_get_star_values_returns_five_to_one() {
		$this->assertSame( array( 5, 4, 3, 2, 1 ), Filter_Wc_Rating::get_star_values() );
	}

	/**
	 * Config shape and defaults.
	 */
	public function test_build_config_shape_and_defaults() {
		$config = Filter_Wc_Rating::build_config( array() );
		$this->assertSame(
			array(
				'filterKey'  => 'rating_filter',
				'filterType' => 'wc_rating',
				'label'      => 'Rating',
				'showCount'  => true,
			),
			$config
		);
	}

	/**
	 * Custom attributes are reflected in the config.
	 */
	public function test_build_config_with_custom_attributes() {
		$config = Filter_Wc_Rating::build_config(
			array(
				'label'     => 'Product Rating',
				'showCount' => false,
			)
		);
		$this->assertSame( 'Product Rating', $config['label'] );
		$this->assertFalse( $config['showCount'] );
		$this->assertSame( 'rating_filter', $config['filterKey'] );
		$this->assertSame( 'wc_rating', $config['filterType'] );
	}

	/**
	 * Empty label falls back to the default.
	 */
	public function test_build_config_empty_label_falls_back_to_default() {
		$config = Filter_Wc_Rating::build_config( array( 'label' => '' ) );
		$this->assertSame( 'Rating', $config['label'] );
	}

	/**
	 * Label is sanitize_text_field()'d before it reaches Interactivity state.
	 */
	public function test_build_config_sanitizes_label() {
		$config = Filter_Wc_Rating::build_config(
			array( 'label' => "  <b>Stars</b>\nextra  " )
		);
		$this->assertSame( 'Stars extra', $config['label'] );
	}

	/**
	 * Missing / unset enabledStars defaults to all five rows.
	 */
	public function test_get_enabled_stars_defaults_to_all_when_unset() {
		$this->assertSame( array( 5, 4, 3, 2, 1 ), Filter_Wc_Rating::get_enabled_stars( array() ) );
	}

	/**
	 * Author-picked subset is preserved and sorted high-to-low.
	 */
	public function test_get_enabled_stars_preserves_subset_and_sorts() {
		$this->assertSame(
			array( 4, 2 ),
			Filter_Wc_Rating::get_enabled_stars( array( 'enabledStars' => array( 2, 4 ) ) )
		);
	}

	/**
	 * Out-of-range and duplicate values are filtered out, never producing
	 * a row outside 1..5 — protects render.php's projection map.
	 */
	public function test_get_enabled_stars_filters_invalid_and_duplicates() {
		$this->assertSame(
			array( 5, 3, 1 ),
			Filter_Wc_Rating::get_enabled_stars(
				array( 'enabledStars' => array( 0, 5, 6, 3, '1', 1, 'bogus', -2 ) )
			)
		);
	}

	/**
	 * Empty list (after sanitization) falls back to all five — better than
	 * rendering an empty `<ul>` from a stale attribute.
	 */
	public function test_get_enabled_stars_falls_back_when_all_invalid() {
		$this->assertSame(
			array( 5, 4, 3, 2, 1 ),
			Filter_Wc_Rating::get_enabled_stars(
				array( 'enabledStars' => array( 0, 6, 'no' ) )
			)
		);
		$this->assertSame(
			array( 5, 4, 3, 2, 1 ),
			Filter_Wc_Rating::get_enabled_stars( array( 'enabledStars' => array() ) )
		);
	}
}
