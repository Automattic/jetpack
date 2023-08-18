<?php
/**
 * Unsupported environment tests.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status\Cache;
use Automattic\Jetpack\Waf\Waf_Initializer;

/**
 * Integration tests for unsupported environments.
 */
final class WafUnsupportedEnvironmentIntegrationTest extends WorDBless\BaseTestCase {
	/**
	 * Mock data for the available modules
	 *
	 * @var array
	 */
	private static $test_available_modules;

	/**
	 * Test setup.
	 */
	protected function set_up() {
		Cache::clear();

		self::$test_available_modules = array(
			0 => 'waf',
			1 => 'protect',
		);

		// Set a blog token and id so the site is connected.
		Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		Jetpack_Options::update_option( 'id', 1234 );

		// Add the WAF and Brute force protection module to the available modules.
		add_filter( 'jetpack_get_available_standalone_modules', array( $this, 'add_modules_to_available_modules' ), 10, 1 );

		// Initialize the firewall.
		Waf_Initializer::init();
	}

	/**
	 * Test teardown.
	 */
	protected function tear_down() {
		Constants::clear_constants();
		Cache::clear();
	}

	/**
	 * Add "waf" and "protect" to the available Jetpack modules.
	 *
	 * @param array $modules The available modules.
	 * @return array The available modules, including "waf" and "protect".
	 */
	public function add_modules_to_available_modules( $modules ) {
		$modules = array_merge( $modules, self::$test_available_modules );

		return $modules;
	}

	/**
	 * Test WAF init in a supported environment.
	 */
	public function testWafInitSupportedEnvironment() {
		$available_modules = ( new Modules() )->get_available();

		$this->assertContains( 'waf', $available_modules );
		$this->assertContains( 'protect', $available_modules );
	}

	/**
	 * Test WAF init in a WPcom environment.
	 */
	public function testWafInitWpcomEnvironment() {
		Constants::set_constant( 'IS_WPCOM', true );

		$available_modules = ( new Modules() )->get_available();

		$this->assertNotContains( 'waf', $available_modules );
		$this->assertContains( 'protect', $available_modules );
	}

	/**
	 * Test WAF init in an Atomic environment.
	 */
	public function testWafInitAtomicEnvironment() {
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 999 );
		Constants::set_constant( 'ATOMIC_SITE_ID', 999 );

		$available_modules = ( new Modules() )->get_available();

		$this->assertNotContains( 'waf', $available_modules );
		$this->assertContains( 'protect', $available_modules );
	}

	/**
	 * Test WAF init in a VIP environment.
	 */
	public function testWafInitVipEnvironment() {
		Constants::set_constant( 'WPCOM_IS_VIP_ENV', true );

		$available_modules = ( new Modules() )->get_available();

		$this->assertNotContains( 'waf', $available_modules );
		$this->assertContains( 'protect', $available_modules );
	}
}
