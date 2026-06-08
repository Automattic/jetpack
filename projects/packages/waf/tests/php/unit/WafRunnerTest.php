<?php
/**
 * Standalone bootstrap test suite.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\Waf_Constants;
use Automattic\Jetpack\Waf\Waf_Runner;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/**
 * Runtime test suite.
 */
final class WafRunnerTest extends PHPUnit\Framework\TestCase {

	/**
	 * Test define mode
	 */
	public function testDefineModeSetsDefinition() {
		add_test_option( Waf_Runner::MODE_OPTION_NAME, 'normal' );
		Waf_Constants::define_mode();
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
	#[RunInSeparateProcess]
	public function testRunSetsConstants() {
		define( 'ABSPATH', '/pseudo' );
		define( 'WP_CONTENT_DIR', '/pseudo/dir' );

		$this->assertFalse( defined( 'JETPACK_WAF_DIR' ) );
		$this->assertFalse( defined( 'JETPACK_WAF_WPCONFIG' ) );

		Waf_Runner::run();
		$this->assertSame( '/pseudo/dir/jetpack-waf', JETPACK_WAF_DIR );
		$this->assertSame( '/pseudo/dir/../wp-config.php', JETPACK_WAF_WPCONFIG );
	}

	/**
	 * Test that run exits early and skips rule evaluation when REQUEST_METHOD is absent.
	 *
	 * This reproduces the scenario where wp-cron.php is executed directly via a PHP
	 * wrapper that does not set REQUEST_METHOD (no HTTP context), which caused rule 911100
	 * to fire a 403 because the empty request method was not in the allowed-methods list.
	 *
	 * @runInSeparateProcess
	 */
	#[RunInSeparateProcess]
	public function testRunSkipsRulesWhenRequestMethodIsAbsent() {
		define( 'ABSPATH', '/pseudo' );
		define( 'WP_CONTENT_DIR', '/pseudo/dir' );

		// Simulate a non-HTTP execution context: no REQUEST_METHOD present.
		unset( $_SERVER['REQUEST_METHOD'] );

		// Create a temporary rules file that would set a flag if evaluated.
		$rules_dir  = sys_get_temp_dir() . '/jetpack-waf-test-' . uniqid();
		$rules_file = $rules_dir . '/rules.php';
		mkdir( $rules_dir );
		file_put_contents( $rules_file, '<?php define( "JETPACK_WAF_RULES_EXECUTED", true );' );

		define( 'JETPACK_WAF_DIR', $rules_dir );
		define( 'JETPACK_WAF_WPCONFIG', '/pseudo/wp-config.php' );
		define( 'JETPACK_WAF_ENTRYPOINT', 'rules.php' );
		define( 'JETPACK_WAF_MODE', 'normal' );

		Waf_Runner::run();

		// The rules file must NOT have been included: no HTTP context means no rules.
		$this->assertFalse( defined( 'JETPACK_WAF_RULES_EXECUTED' ), 'WAF rules must not be evaluated when REQUEST_METHOD is absent.' );

		// Clean up.
		unlink( $rules_file );
		rmdir( $rules_dir );
	}
}
