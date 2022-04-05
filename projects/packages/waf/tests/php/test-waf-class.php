<?php
/**
 * Standalone bootstrap test suite.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\Waf;

/**
 * Runtime test suite.
 */
final class WafTest extends PHPUnit\Framework\TestCase {

	/**
	 * Test define mode
	 */
	public function testDefineMode() {
		add_test_option( 'jetpack_waf_mode', 'normal' );
		Waf::define_mode();
		$this->assertSame( 'normal', JETPACK_WAF_MODE );
	}

	/**
	 * Test is_allowed_modes
	 */
	public function testIsAllowedModes() {
		$this->assertFalse( Waf::is_allowed_mode( 'test' ) );
		$this->assertFalse( Waf::is_allowed_mode( ' normal' ) );
		$this->assertFalse( Waf::is_allowed_mode( '' ) );
		$this->assertTrue( Waf::is_allowed_mode( 'normal' ) );
		$this->assertTrue( Waf::is_allowed_mode( 'silent' ) );
	}
}
