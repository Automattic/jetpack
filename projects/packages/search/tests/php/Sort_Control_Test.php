<?php
/**
 * Sort_Control helper tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Tests for the Sort_Control helper class used by the jetpack/sort-control
 * block. Covers attribute normalization so render.php can trust the inputs
 * it receives regardless of what a garbage block attribute carries.
 */
class Sort_Control_Test extends TestCase {

	/**
	 * A missing `defaultSort` attribute must fall back to `relevance` — the
	 * same default `parse_url_sort()` returns when the URL has no `orderby`.
	 */
	public function test_normalize_default_sort_falls_back_when_missing() {
		$this->assertSame( 'relevance', Sort_Control::normalize_default_sort( array() ) );
	}

	/**
	 * Known sort keys must pass through unchanged so block-saved values stay
	 * stable across renders.
	 */
	public function test_normalize_default_sort_accepts_known_key() {
		$this->assertSame( 'newest', Sort_Control::normalize_default_sort( array( 'defaultSort' => 'newest' ) ) );
	}

	/** Product-format keys are deferred to RSM-1082. */
	public function test_normalize_default_sort_rejects_product_key_until_woocommerce_integration() {
		$this->assertSame( 'relevance', Sort_Control::normalize_default_sort( array( 'defaultSort' => 'price_asc' ) ) );
	}

	/**
	 * Unknown keys collapse to `relevance` so a garbage attribute can't leak
	 * into the rendered control or the seeded Interactivity state.
	 */
	public function test_normalize_default_sort_rejects_unknown_key() {
		$this->assertSame( 'relevance', Sort_Control::normalize_default_sort( array( 'defaultSort' => 'drop-tables' ) ) );
	}

	/**
	 * A missing `availableSortOptions` attribute must fall back to every
	 * option so the control renders the full list by default.
	 */
	public function test_resolve_available_options_defaults_to_full_list() {
		$this->assertSame(
			array( 'relevance', 'newest', 'oldest' ),
			Sort_Control::resolve_available_options( array() )
		);
	}

	/**
	 * Filtering must preserve the canonical order from get_all_option_keys(),
	 * not the order the attribute array arrived in — otherwise save/load
	 * round-trips could reshuffle the dropdown.
	 */
	public function test_resolve_available_options_preserves_canonical_order() {
		$this->assertSame(
			array( 'relevance', 'oldest' ),
			Sort_Control::resolve_available_options(
				array( 'availableSortOptions' => array( 'oldest', 'relevance' ) )
			)
		);
	}

	/**
	 * Unknown keys inside the attribute array must be dropped silently so a
	 * stray/typo'd value can't render an `<option>` that the JS store would
	 * reject at change time.
	 */
	public function test_resolve_available_options_drops_unknown_keys() {
		$this->assertSame(
			array( 'relevance', 'newest' ),
			Sort_Control::resolve_available_options(
				array( 'availableSortOptions' => array( 'relevance', 'newest', 'bogus' ) )
			)
		);
	}

	/**
	 * An empty array falls back to the full list rather than rendering a
	 * control with zero options — otherwise an accidental `[]` from the
	 * inspector would produce an empty `<select>` that the user can't fix.
	 */
	public function test_resolve_available_options_empty_falls_back_to_all() {
		$this->assertSame(
			Sort_Control::get_all_option_keys(),
			Sort_Control::resolve_available_options( array( 'availableSortOptions' => array() ) )
		);
	}

	/**
	 * A non-array value (e.g. a string from a misconfigured saved block)
	 * must be handled defensively — fall back to the full list.
	 */
	public function test_resolve_available_options_non_array_falls_back_to_all() {
		$this->assertSame(
			Sort_Control::get_all_option_keys(),
			Sort_Control::resolve_available_options( array( 'availableSortOptions' => 'relevance' ) )
		);
	}

	/**
	 * `displayAs` defaults to `select` so existing posts (saved before the
	 * attribute existed) keep rendering a dropdown.
	 */
	public function test_normalize_display_as_defaults_to_select() {
		$this->assertSame( 'select', Sort_Control::normalize_display_as( array() ) );
	}

	/**
	 * `radio` and `popover` are the supported non-default presentations.
	 */
	public function test_normalize_display_as_accepts_radio() {
		$this->assertSame( 'radio', Sort_Control::normalize_display_as( array( 'displayAs' => 'radio' ) ) );
	}

	/**
	 * `popover` uses the compact toolbar icon trigger and menu.
	 */
	public function test_normalize_display_as_accepts_popover() {
		$this->assertSame( 'popover', Sort_Control::normalize_display_as( array( 'displayAs' => 'popover' ) ) );
	}

	/**
	 * Unknown values must collapse to `select` so a garbage attribute can't
	 * produce markup the view script doesn't know how to bind against.
	 */
	public function test_normalize_display_as_rejects_unknown_value() {
		$this->assertSame( 'select', Sort_Control::normalize_display_as( array( 'displayAs' => 'grid' ) ) );
	}

	/**
	 * Missing label falls back to the translated default so pre-SEARCH-138
	 * posts keep the original "Sort by" copy.
	 */
	public function test_resolve_label_falls_back_when_empty() {
		$this->assertSame( 'Sort by', Sort_Control::resolve_label( array() ) );
		$this->assertSame( 'Sort by', Sort_Control::resolve_label( array( 'label' => '' ) ) );
	}

	/**
	 * A whitespace-only label must behave as empty — the editor inspector
	 * help copy says "Leave empty to use the default", and a blank-looking
	 * value shouldn't render a visually empty label.
	 */
	public function test_resolve_label_treats_whitespace_as_empty() {
		$this->assertSame( 'Sort by', Sort_Control::resolve_label( array( 'label' => '   ' ) ) );
	}

	/**
	 * A user-supplied label passes through (trimmed) unchanged.
	 */
	public function test_resolve_label_returns_user_value() {
		$this->assertSame( 'Order by', Sort_Control::resolve_label( array( 'label' => '  Order by  ' ) ) );
	}
}
