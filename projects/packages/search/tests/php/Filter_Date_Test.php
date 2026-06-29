<?php
/**
 * Filter_Date helper tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Tests for Filter_Date helpers.
 */
class Filter_Date_Test extends TestCase {

	/**
	 * Filter key is `post_date` regardless of attributes.
	 */
	public function test_derive_filter_key_returns_post_date_constant() {
		$this->assertSame( 'post_date', Filter_Date::FILTER_KEY );
		$this->assertSame( 'post_date', Filter_Date::derive_filter_key( array() ) );
		$this->assertSame( 'post_date', Filter_Date::derive_filter_key( array( 'field' => 'ignored' ) ) );
		$this->assertSame( 'post_date', Filter_Date::derive_filter_key( array( 'interval' => 'month' ) ) );
	}

	/**
	 * Pin the dev-time invariant that FILTER_KEY isn't reserved.
	 */
	public function test_filter_key_does_not_collide_with_reserved_params() {
		$this->assertNotContains( Filter_Date::FILTER_KEY, Search_Blocks::RESERVED_QUERY_PARAMS );
	}

	/**
	 * Default label.
	 */
	public function test_default_label_returns_date() {
		$this->assertSame( 'Date', Filter_Date::default_label() );
	}

	/**
	 * Config shape and defaults.
	 */
	public function test_build_config_shape_and_defaults() {
		$config = Filter_Date::build_config( array(), 'post_date' );
		$this->assertSame(
			array(
				'filterKey'       => 'post_date',
				'filterType'      => 'date',
				'interval'        => 'year',
				'label'           => 'Date',
				'showCount'       => true,
				'maxItems'        => 10,
				'bucketSortOrder' => 'newest',
			),
			$config
		);

		$custom = Filter_Date::build_config(
			array(
				'interval'        => 'month',
				'label'           => 'When',
				'showCount'       => false,
				'maxItems'        => 5,
				'bucketSortOrder' => 'oldest',
			),
			'post_date'
		);
		$this->assertSame( 'month', $custom['interval'] );
		$this->assertSame( 'When', $custom['label'] );
		$this->assertFalse( $custom['showCount'] );
		$this->assertSame( 5, $custom['maxItems'] );
		$this->assertSame( 'oldest', $custom['bucketSortOrder'] );

		// maxItems clamps to >= 1 so author-entered 0 still yields a usable list.
		$clamped = Filter_Date::build_config(
			array( 'maxItems' => 0 ),
			'post_date'
		);
		$this->assertSame( 1, $clamped['maxItems'] );
	}

	/**
	 * Interval normalization.
	 */
	public function test_normalize_interval() {
		$this->assertSame( 'year', Filter_Date::normalize_interval( null ) );
		$this->assertSame( 'year', Filter_Date::normalize_interval( '' ) );
		$this->assertSame( 'year', Filter_Date::normalize_interval( 'year' ) );
		$this->assertSame( 'year', Filter_Date::normalize_interval( 'week' ) );
		$this->assertSame( 'month', Filter_Date::normalize_interval( 'month' ) );
	}

	/**
	 * BucketSortOrder normalization.
	 */
	public function test_normalize_bucket_sort_order() {
		$this->assertSame( 'newest', Filter_Date::normalize_bucket_sort_order( null ) );
		$this->assertSame( 'newest', Filter_Date::normalize_bucket_sort_order( '' ) );
		$this->assertSame( 'newest', Filter_Date::normalize_bucket_sort_order( 'newest' ) );
		$this->assertSame( 'newest', Filter_Date::normalize_bucket_sort_order( 'bogus' ) );
		$this->assertSame( 'oldest', Filter_Date::normalize_bucket_sort_order( 'oldest' ) );
		$this->assertSame( 'count', Filter_Date::normalize_bucket_sort_order( 'count' ) );
	}

	/**
	 * Label is sanitize_text_field()'d before it reaches Interactivity state.
	 */
	public function test_build_config_sanitizes_label() {
		$config = Filter_Date::build_config(
			array( 'label' => "  <b>When</b>\nextra  " ),
			'post_date'
		);
		$this->assertSame( 'When extra', $config['label'] );
	}
}
