<?php
/**
 * Standalone bootstrap test suite.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\Waf_Constants;
use Automattic\Jetpack\Waf\Waf_Runner;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
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
	 * Test that run does not evaluate rules when there is no HTTP request method.
	 *
	 * Reproduces PROTECT-174: when wp-cron.php is executed directly (e.g. via a PHP
	 * wrapper for a server-side cron) there is no HTTP context, so REQUEST_METHOD is
	 * absent. The WAF must skip rule evaluation in that case so that HTTP-specific
	 * rules (e.g. rule 911100, which checks the request method) don't fire a
	 * false-positive 403.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function testRunSkipsRulesWhenRequestMethodIsAbsent() {
		define( 'ABSPATH', '/pseudo' );
		define( 'WP_CONTENT_DIR', '/pseudo/dir' );

		// Simulate a non-HTTP execution context: no REQUEST_METHOD present.
		unset( $_SERVER['REQUEST_METHOD'] );

		// Point the WAF at a rules file that would set a flag if it were ever included.
		$rules_dir  = sys_get_temp_dir() . '/jetpack-waf-test-' . uniqid();
		$rules_file = $rules_dir . '/rules.php';
		mkdir( $rules_dir );
		file_put_contents( $rules_file, '<?php define( "JETPACK_WAF_RULES_EXECUTED", true );' );

		define( 'JETPACK_WAF_DIR', $rules_dir );
		define( 'JETPACK_WAF_WPCONFIG', '/pseudo/wp-config.php' );
		define( 'JETPACK_WAF_ENTRYPOINT', 'rules.php' );
		define( 'JETPACK_WAF_MODE', 'normal' );

		try {
			Waf_Runner::run();

			// run() reached the guard (the run-context constant is set before it)...
			$this->assertTrue( defined( 'JETPACK_WAF_RUN' ), 'Waf_Runner::run() should have started executing.' );
			// ...but returned early without ever including the rules file.
			$this->assertFalse( defined( 'JETPACK_WAF_RULES_EXECUTED' ), 'WAF rules must not be evaluated when there is no HTTP request method.' );
		} finally {
			// Clean up, even if an assertion fails.
			unlink( $rules_file );
			rmdir( $rules_dir );
		}
	}
}
