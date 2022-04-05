<?php
/**
 * Standalone bootstrap test suite.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\WafRunner;

/**
 * Runtime test suite.
 */
final class WafTest extends PHPUnit\Framework\TestCase {

	/**
	 * Test define mode
	 */
	public function testDefineModeSetsDefinition() {
		add_test_option( WafRunner::MODE_OPTION_NAME, 'normal' );
		WafRunner::define_mode();
		$this->assertSame( 'normal', JETPACK_WAF_MODE );
	}

	/**
	 * Test is_allowed_modes
	 */
	public function testIsAllowedModes() {
		$this->assertFalse( WafRunner::is_allowed_mode( 'test' ) );
		$this->assertFalse( WafRunner::is_allowed_mode( ' normal' ) );
		$this->assertFalse( WafRunner::is_allowed_mode( '' ) );
		$this->assertTrue( WafRunner::is_allowed_mode( 'normal' ) );
		$this->assertTrue( WafRunner::is_allowed_mode( 'silent' ) );
	}
}
