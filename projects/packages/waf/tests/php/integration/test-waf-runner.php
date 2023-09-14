<?php
/**
 * Runner tests.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Waf\Waf_Initializer;
use Automattic\Jetpack\Waf\Waf_Runner;

/**
 * Integration tests for the firewall runner.
 */
final class WafRunsTest extends WorDBless\BaseTestCase {

	/**
	 * Test setup.
	 */
	public function set_up() {
		// Set a blog token and id so the site is connected.
		Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		Jetpack_Options::update_option( 'id', 1234 );

		// Set the WPCOM JSON API base URL so the site will attempt to make requests.
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

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
	 * Test that the firewall runs.
	 */
	public function testWafRuns() {
		Waf_Runner::run();
		$this->assertTrue( defined( 'JETPACK_WAF_RUN' ) );
	}
}
