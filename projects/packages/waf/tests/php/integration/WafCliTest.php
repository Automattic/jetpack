<?php
/**
 * WP-CLI command tests.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\CLI;
use Automattic\Jetpack\Waf\Waf_Constants;
use Automattic\Jetpack\Waf\Waf_Runner;

require_once __DIR__ . '/stubs/wp-cli.php';

/**
 * Integration tests for the jetpack-waf WP-CLI command.
 */
final class WafCliTest extends WorDBless\BaseTestCase {

	/**
	 * Make the "waf" module available, as the Jetpack and Protect plugins do.
	 */
	protected function set_up() {
		add_filter( 'jetpack_get_available_standalone_modules', array( $this, 'add_waf_to_available_modules' ) );
	}

	/**
	 * Remove the available-modules filter.
	 */
	protected function tear_down() {
		remove_filter( 'jetpack_get_available_standalone_modules', array( $this, 'add_waf_to_available_modules' ) );
	}

	/**
	 * Add "waf" to the available modules.
	 *
	 * @param array $modules The available modules.
	 * @return array The available modules, including "waf".
	 */
	public function add_waf_to_available_modules( $modules ) {
		$modules[] = Waf_Runner::WAF_MODULE_NAME;
		return $modules;
	}

	/**
	 * Teardown must turn the module off, not only empty the rules.
	 */
	public function testTeardownDeactivatesTheModule() {
		Waf_Constants::define_entrypoint();
		Waf_Runner::enable();
		update_option( Waf_Runner::MODE_OPTION_NAME, 'normal' );
		$this->assertTrue( Waf_Runner::is_enabled() );

		( new CLI() )->teardown();

		$this->assertFalse( Waf_Runner::is_enabled() );
		$this->assertFalse( get_option( Waf_Runner::MODE_OPTION_NAME ) );
	}
}
