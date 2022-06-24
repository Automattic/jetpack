<?php
/**
 * Standalone bootstrap test suite.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\Waf_Runner;

/**
 * Runtime test suite.
 */
final class WafRunnerTest extends PHPUnit\Framework\TestCase {

	/**
	 * Test define mode
	 */
	public function testDefineModeSetsDefinition() {
		add_test_option( Waf_Runner::MODE_OPTION_NAME, 'normal' );
		Waf_Runner::define_mode();
		$this->assertSame( 'normal', JETPACK_WAF_MODE );
	}

	/**
	 * Test is_allowed_modes
	 */
	public function testIsAllowedModes() {
		$this->assertFalse( Waf_Runner::is_allowed_mode( 'test' ) );
		$this->assertFalse( Waf_Runner::is_allowed_mode( ' normal' ) );
		$this->assertFalse( Waf_Runner::is_allowed_mode( '' ) );
		$this->assertTrue( Waf_Runner::is_allowed_mode( 'normal' ) );
		$this->assertTrue( Waf_Runner::is_allowed_mode( 'silent' ) );
	}

	/**
	 * Test run
	 *
	 * @runInSeparateProcess
	 */
	public function testRunSetsConstants() {
		define( 'ABSPATH', '/pseudo' );
		define( 'WP_CONTENT_DIR', '/pseudo/dir' );

		$this->assertFalse( defined( 'JETPACK_WAF_DIR' ) );
		$this->assertFalse( defined( 'JETPACK_WAF_WPCONFIG' ) );

		Waf_Runner::run();
		$this->assertSame( '/pseudo/dir/jetpack-waf', JETPACK_WAF_DIR );
		$this->assertSame( '/pseudo/dir/../wp-config.php', JETPACK_WAF_WPCONFIG );
	}
}
