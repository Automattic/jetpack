<?php
/**
 * Results_Sort helper tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Tests for the Results_Sort helper class used by the jetpack-search/results-sort
 * block. Covers attribute normalization so render.php can trust the inputs
 * it receives regardless of what a garbage block attribute carries.
 */
class Results_Sort_Test extends TestCase {

	/**
	 * Reset the central WC-blocks-enabled memo between tests so a case
	 * that flipped the gate doesn't leak the answer into the next one.
	 */
	protected function setUp(): void {
		parent::setUp();
		Search_Blocks::reset_woocommerce_blocks_enabled_cache();
	}

	protected function tearDown(): void {
		Search_Blocks::reset_woocommerce_blocks_enabled_cache();
		parent::tearDown();
	}

	/**
	 * Run a test body with the WC gate forced on, restoring the memo on
	 * exit so a thrown assertion can't leak the override into the next
	 * test case.
	 *
	 * @param callable $body Test body.
	 */
	private function withWooCommerceActive( callable $body ): void {
		Search_Blocks::set_woocommerce_blocks_enabled_for_testing( true );
		try {
			$body();
		} finally {
			Search_Blocks::set_woocommerce_blocks_enabled_for_testing( null );
		}
	}

	/**
	 * A missing `defaultSort` attribute must fall back to `relevance` — the
	 * same default `parse_url_sort()` returns when the URL has no `orderby`.
	 */
	public function test_normalize_default_sort_falls_back_when_missing() {
		$this->assertSame( 'relevance', Results_Sort::normalize_default_sort( array() ) );
	}

	/**
	 * Known sort keys must pass through unchanged so block-saved values stay
	 * stable across renders.
	 */
	public function test_normalize_default_sort_accepts_known_key() {
		$this->assertSame( 'newest', Results_Sort::normalize_default_sort( array( 'defaultSort' => 'newest' ) ) );
	}

	/**
	 * Product-format keys must collapse to `relevance` on non-WooCommerce
	 * sites so a saved attribute can't render an option the API can't honour.
	 * `Search_Blocks::woocommerce_blocks_enabled()` returns false in PHPUnit (no
	 * WooCommerce class is loaded), so this is the unmocked default path.
	 */
	public function test_normalize_default_sort_rejects_product_key_when_woocommerce_inactive() {
		$this->assertSame( 'relevance', Results_Sort::normalize_default_sort( array( 'defaultSort' => 'price_asc' ) ) );
	}

	/**
	 * With WooCommerce active the product-format keys must pass through so
	 * authors can save them as the visible default. Stubs the WC class for
	 * the duration of the test so the gate flips on without booting a real
	 * WooCommerce.
	 */
	public function test_normalize_default_sort_accepts_product_key_when_woocommerce_active() {
		$this->withWooCommerceActive(
			function () {
				foreach ( array( 'rating_desc', 'price_asc', 'price_desc' ) as $key ) {
					$this->assertSame(
						$key,
						Results_Sort::normalize_default_sort( array( 'defaultSort' => $key ) ),
						"Expected $key to pass through when WooCommerce is active."
					);
				}
			}
		);
	}

	/**
	 * Unknown keys collapse to `relevance` so a garbage attribute can't leak
	 * into the rendered control or the seeded Interactivity state.
	 */
	public function test_normalize_default_sort_rejects_unknown_key() {
		$this->assertSame( 'relevance', Results_Sort::normalize_default_sort( array( 'defaultSort' => 'drop-tables' ) ) );
	}

	/**
	 * A missing `availableSortOptions` attribute must fall back to every
	 * option so the control renders the full list by default. On non-Woo
	 * sites that's the base three keys.
	 */
	public function test_resolve_available_options_defaults_to_full_list() {
		$this->assertSame(
			array( 'relevance', 'newest', 'oldest' ),
			Results_Sort::resolve_available_options( array() )
		);
	}

	/**
	 * `get_all_option_keys()` and the empty-attribute fallback must include
	 * the product-format keys when WooCommerce is active so the inspector
	 * default exposes them on Woo sites.
	 */
	public function test_get_all_option_keys_includes_product_keys_when_woocommerce_active() {
		$this->withWooCommerceActive(
			function () {
				$this->assertSame(
					array( 'relevance', 'newest', 'oldest', 'rating_desc', 'price_asc', 'price_desc' ),
					Results_Sort::get_all_option_keys()
				);
				$this->assertSame(
					array( 'relevance', 'newest', 'oldest', 'rating_desc', 'price_asc', 'price_desc' ),
					Results_Sort::resolve_available_options( array() )
				);
			}
		);
	}

	/**
	 * On non-Woo sites the product-format keys must be silently dropped
	 * from a saved `availableSortOptions` array — render.php would already
	 * not expose them, but trusting the canonical key set from
	 * `get_all_option_keys()` keeps the rendered DOM in lockstep with the
	 * inspector even when an admin disables WC after authoring the block.
	 */
	public function test_resolve_available_options_drops_product_keys_when_woocommerce_inactive() {
		$this->assertSame(
			array( 'relevance', 'newest' ),
			Results_Sort::resolve_available_options(
				array( 'availableSortOptions' => array( 'relevance', 'newest', 'price_asc', 'rating_desc' ) )
			)
		);
	}

	/**
	 * On Woo sites the product-format keys must filter through, in the
	 * canonical order.
	 */
	public function test_resolve_available_options_keeps_product_keys_when_woocommerce_active() {
		$this->withWooCommerceActive(
			function () {
				$this->assertSame(
					array( 'relevance', 'newest', 'rating_desc', 'price_asc' ),
					Results_Sort::resolve_available_options(
						array( 'availableSortOptions' => array( 'newest', 'price_asc', 'relevance', 'rating_desc' ) )
					)
				);
			}
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
			Results_Sort::resolve_available_options(
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
			Results_Sort::resolve_available_options(
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
			Results_Sort::get_all_option_keys(),
			Results_Sort::resolve_available_options( array( 'availableSortOptions' => array() ) )
		);
	}

	/**
	 * A non-array value (e.g. a string from a misconfigured saved block)
	 * must be handled defensively — fall back to the full list.
	 */
	public function test_resolve_available_options_non_array_falls_back_to_all() {
		$this->assertSame(
			Results_Sort::get_all_option_keys(),
			Results_Sort::resolve_available_options( array( 'availableSortOptions' => 'relevance' ) )
		);
	}

	/**
	 * `displayAs` defaults to `select` so existing posts (saved before the
	 * attribute existed) keep rendering a dropdown.
	 */
	public function test_normalize_display_as_defaults_to_select() {
		$this->assertSame( 'select', Results_Sort::normalize_display_as( array() ) );
	}

	/**
	 * `radio` and `popover` are the supported non-default presentations.
	 */
	public function test_normalize_display_as_accepts_radio() {
		$this->assertSame( 'radio', Results_Sort::normalize_display_as( array( 'displayAs' => 'radio' ) ) );
	}

	/**
	 * `popover` uses the compact toolbar icon trigger and menu.
	 */
	public function test_normalize_display_as_accepts_popover() {
		$this->assertSame( 'popover', Results_Sort::normalize_display_as( array( 'displayAs' => 'popover' ) ) );
	}

	/**
	 * `display=popover` was used before this block adopted `displayAs`.
	 */
	public function test_normalize_display_as_accepts_legacy_display_popover() {
		$this->assertSame( 'popover', Results_Sort::normalize_display_as( array( 'display' => 'popover' ) ) );
	}

	/**
	 * Unknown values must collapse to `select` so a garbage attribute can't
	 * produce markup the view script doesn't know how to bind against.
	 */
	public function test_normalize_display_as_rejects_unknown_value() {
		$this->assertSame( 'select', Results_Sort::normalize_display_as( array( 'displayAs' => 'grid' ) ) );
	}

	/**
	 * Missing label falls back to the translated default so pre-SEARCH-138
	 * posts keep the original "Sort by" copy.
	 */
	public function test_resolve_label_falls_back_when_empty() {
		$this->assertSame( 'Sort by', Results_Sort::resolve_label( array() ) );
		$this->assertSame( 'Sort by', Results_Sort::resolve_label( array( 'label' => '' ) ) );
	}

	/**
	 * A whitespace-only label must behave as empty — the editor inspector
	 * help copy says "Leave empty to use the default", and a blank-looking
	 * value shouldn't render a visually empty label.
	 */
	public function test_resolve_label_treats_whitespace_as_empty() {
		$this->assertSame( 'Sort by', Results_Sort::resolve_label( array( 'label' => '   ' ) ) );
	}

	/**
	 * A user-supplied label passes through (trimmed) unchanged.
	 */
	public function test_resolve_label_returns_user_value() {
		$this->assertSame( 'Order by', Results_Sort::resolve_label( array( 'label' => '  Order by  ' ) ) );
	}
}
