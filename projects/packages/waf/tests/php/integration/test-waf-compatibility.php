<?php
/**
 * Compatibility tests.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\Waf_Initializer;
use Automattic\Jetpack\Waf\Waf_Rules_Manager;
use Automattic\Jetpack\Waf\Waf_Runner;

/**
 * Integration tests for the backwards-compatibility of the package.
 */
final class WafCompatibilityTest extends WorDBless\BaseTestCase {

	/**
	 * Test setup.
	 */
	public function set_up() {
		// Add the WAF module to the available modules.
		add_filter( 'jetpack_get_available_modules', array( $this, 'add_waf_to_available_modules' ), 10, 1 );
		add_filter( 'jetpack_get_available_standalone_modules', array( $this, 'add_waf_to_available_modules' ), 10, 1 );

		// Initialize the firewall.
		Waf_Initializer::init();
	}

	/**
	 * Add "waf" to the available Jetpack modules.
	 *
	 * @param array $modules The available modules.
	 * @return array The available modules, including "waf".
	 */
	public function add_waf_to_available_modules( $modules ) {
		if ( ! in_array( 'waf', $modules, true ) ) {
			$modules[] = 'waf';
		}
		return $modules;
	}

	/**
	 * Test that the automatic rules option inherits from the module status when it is doesn't exist.
	 */
	public function testAutomaticRulesOptionInheritsFromModuleStatus() {
		// Enable the WAF module.
		Waf_Runner::enable();

		// Manually delete the automatic rules option to simulate a site that installed the WAF before the automatic rules option was introduced.
		delete_option( Waf_Rules_Manager::AUTOMATIC_RULES_ENABLED_OPTION_NAME );

		// Check that the automatic rules option is enabled by default.
		$this->assertTrue( Waf_Runner::is_enabled() );
	}

}
