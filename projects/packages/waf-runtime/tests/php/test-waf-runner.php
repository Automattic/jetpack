<?php
/**
 * Standalone bootstrap test suite.
 *
 * @package automattic/jetpack-waf-runtime
 */

namespace Automattic\Jetpack\Waf_Runtime;

require_once __DIR__ . '/../../src/class-runner.php';

/**
 * Runtime test suite.
 */
final class WafRunnerTest extends \PHPUnit\Framework\TestCase {
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

		Runner::run();
		$this->assertSame( 'plugin', JETPACK_WAF_RUN );
	}
}
