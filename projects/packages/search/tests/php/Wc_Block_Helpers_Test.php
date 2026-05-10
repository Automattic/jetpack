<?php
/**
 * Wc_Block_Helpers tests — pins the currency fallbacks and the
 * extents helper's no-WC behavior. WC isn't loaded under PHPUnit
 * so the SQL branch runs the null-extents path.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Static helper tests for the shared `filter-wc-*` block utilities.
 */
class Wc_Block_Helpers_Test extends TestCase {

	protected function tearDown(): void {
		// Each test exercises the transient — wipe so the next one starts cold.
		delete_transient( Wc_Block_Helpers::PRICE_EXTENTS_TRANSIENT );
		parent::tearDown();
	}

	/**
	 * With WC absent (the PHPUnit environment), author-empty inputs fall through
	 * to the `$` / `left` defaults that keep the block usable on plain WP.
	 */
	public function test_currency_defaults_when_wc_absent() {
		$currency = Wc_Block_Helpers::get_currency_display( '', '' );
		$this->assertSame( '$', $currency['symbol'] );
		$this->assertSame( 'left', $currency['position'] );
	}

	/**
	 * Author-supplied symbol wins over the WC fallback. Trimmed to 2 chars so
	 * an oversized entity can't overflow the adornment slot in the input.
	 */
	public function test_currency_author_symbol_takes_precedence_and_is_trimmed() {
		$currency = Wc_Block_Helpers::get_currency_display( 'AUD$', 'right' );
		$this->assertSame( 'AU', $currency['symbol'] );
		$this->assertSame( 'right', $currency['position'] );
	}

	/**
	 * Invalid position values coerce to `left` so the markup stays renderable.
	 */
	public function test_currency_position_invalid_coerces_to_left() {
		$currency = Wc_Block_Helpers::get_currency_display( '€', 'middle' );
		$this->assertSame( 'left', $currency['position'] );
	}

	/**
	 * Without WC the extents helper returns the null sentinel pair — callers
	 * are expected to fall back to author / default bounds on null.
	 */
	public function test_extents_null_when_wc_absent() {
		$extents = Wc_Block_Helpers::get_catalog_price_extents();
		$this->assertNull( $extents['min'] );
		$this->assertNull( $extents['max'] );
	}

	/**
	 * Null-extents outcome is cached too — a broken setup shouldn't re-run
	 * the SQL on every render.
	 */
	public function test_extents_null_outcome_is_cached() {
		Wc_Block_Helpers::get_catalog_price_extents();
		$cached = get_transient( Wc_Block_Helpers::PRICE_EXTENTS_TRANSIENT );
		$this->assertIsArray( $cached );
		$this->assertArrayHasKey( 'min', $cached );
		$this->assertArrayHasKey( 'max', $cached );
	}
}
