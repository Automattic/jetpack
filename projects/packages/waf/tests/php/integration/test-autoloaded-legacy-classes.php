<?php
/**
 * Compatibility tests.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\Waf_Runner;

/**
 * Integration tests for the backwards-compatibility of the package.
 */
final class WafAutoloadedLegacyClassesIntegrationTest extends WorDBless\BaseTestCase {
    function testOutdatedRulesManager() {
		require_once dirname( __FILE__ ) . '/legacy-classes/class-waf-rules-manager.php';

		Waf_Runner::run();
		$this->assertTrue( defined( 'JETPACK_WAF_RUN' ) );
	}
}
