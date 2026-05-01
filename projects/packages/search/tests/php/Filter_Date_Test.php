<?php
/**
 * Filter_Date helper tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Tests for Filter_Date helpers — filter-key derivation, default label,
 * config shape, and interval / sort-order normalization.
 */
class Filter_Date_Test extends TestCase {

	/**
	 * Filter key is the constant `post_date` regardless of attributes — the
	 * block has no field selector because the WPCOM Search v1.3 endpoint
	 * only accepts `date` for date_histogram aggs.
	 */
	public function test_derive_filter_key_returns_post_date_constant() {
		$this->assertSame( 'post_date', Filter_Date::FILTER_KEY );
		$this->assertSame( 'post_date', Filter_Date::derive_filter_key( array() ) );
		$this->assertSame( 'post_date', Filter_Date::derive_filter_key( array( 'field' => 'ignored' ) ) );
		$this->assertSame( 'post_date', Filter_Date::derive_filter_key( array( 'interval' => 'month' ) ) );
	}

	/**
	 * Pins the dev-time invariant that `FILTER_KEY` doesn't accidentally
	 * collide with a reserved URL param. The runtime check that lived in
	 * `derive_filter_key` was provably dead with today's constants (Phan
	 * flagged it as `PhanImpossibleTypeComparison`); moving the assertion
	 * here means a future change to either constant — adding `post_date`
	 * to `RESERVED_QUERY_PARAMS`, or renaming `FILTER_KEY` to a reserved
	 * value — fails this test before it can ship.
	 */
	public function test_filter_key_does_not_collide_with_reserved_params() {
		$this->assertNotContains( Filter_Date::FILTER_KEY, Search_Blocks::RESERVED_QUERY_PARAMS );
	}

	/**
	 * Built-in default label is "Date" so a pattern can omit an explicit
	 * label and still render a sensible heading.
	 */
	public function test_default_label_returns_date() {
		$this->assertSame( 'Date', Filter_Date::default_label() );
	}

	/**
	 * Config shape mirrors what the JS store consumes: missing label falls
	 * back to default_label(); falsy `showCount` round-trips as a boolean;
	 * `maxItems` clamps to >= 1; defaults for `interval` and `bucketSortOrder`.
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

		// Explicit values win over the defaults.
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

		// maxItems must clamp to at least 1 so the client slice produces a
		// non-empty bucket list when an author types `0` into the inspector.
		$clamped = Filter_Date::build_config(
			array( 'maxItems' => 0 ),
			'post_date'
		);
		$this->assertSame( 1, $clamped['maxItems'] );
	}

	/**
	 * `interval` accepts only `year` | `month`; anything else falls back to
	 * `year` so the seeded filterConfig always carries a valid
	 * `calendar_interval` for the date_histogram aggregation.
	 */
	public function test_normalize_interval() {
		$this->assertSame( 'year', Filter_Date::normalize_interval( null ) );
		$this->assertSame( 'year', Filter_Date::normalize_interval( '' ) );
		$this->assertSame( 'year', Filter_Date::normalize_interval( 'year' ) );
		$this->assertSame( 'year', Filter_Date::normalize_interval( 'week' ) );
		$this->assertSame( 'month', Filter_Date::normalize_interval( 'month' ) );
	}

	/**
	 * `bucketSortOrder` accepts `newest` | `oldest` | `count`; anything else
	 * falls back to `newest` (the inspector default).
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
	 * The label passes through sanitize_text_field() before it reaches the
	 * Interactivity state so stored block attributes with stray HTML, tabs, or
	 * newlines can never leak into aggregation-layer metadata or the rendered
	 * heading. Output is still esc_html()'d separately in render.php.
	 */
	public function test_build_config_sanitizes_label() {
		$config = Filter_Date::build_config(
			array( 'label' => "  <b>When</b>\nextra  " ),
			'post_date'
		);
		$this->assertSame( 'When extra', $config['label'] );
	}
}
