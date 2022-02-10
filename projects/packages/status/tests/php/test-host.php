<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for Automattic\Jetpack\Status\Hosts methods
 *
 * @package automattic/jetpack-status
 */

namespace Automattic\Jetpack\Status;

use Automattic\Jetpack\Constants;
use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\TestCase;

/**
 * Status test suite.
 */
class Test_Host extends TestCase {
	/**
	 * Testing object.
	 *
	 * @var Host
	 */
	private $host_obj;

	/**
	 * Test setup.
	 *
	 * @before
	 */
	public function set_up() {
		Monkey\setUp();

		$this->host_obj = new Host();
	}

	/**
	 * Test teardown.
	 *
	 * @after
	 */
	public function tear_down() {
		Monkey\tearDown();
		Constants::clear_constants();
	}

	/**
	 * Setup Atomic-defining constants.
	 */
	private function setup_atomic_constants() {
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 999 );
		Constants::set_constant( 'ATOMIC_SITE_ID', 999 );
	}

	/**
	 * Tests if WoA Site based on option
	 */
	public function test_woa_site_based_on_option() {
		$this->setup_atomic_constants();
		Functions\when( 'get_option' )->justReturn( array( 'fruit' => 'apples' ) ); // Just need a non-empty value.
		$this->assertTrue( $this->host_obj->is_woa_site() );
	}

	/**
	 * Tests if WoA Site based on option
	 */
	public function test_woa_site_based_on_constant() {
		$this->setup_atomic_constants();
		Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', true );
		Functions\when( 'get_option' )->justReturn( array() ); // Intentionally want to return empty the option.
		$this->assertTrue( $this->host_obj->is_woa_site() );
	}

	/**
	 * Confirms a site is Atomic, but not WoA
	 */
	public function test_atomic_not_woa() {
		$this->setup_atomic_constants();
		Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', false );
		Functions\when( 'get_option' )->justReturn( array() ); // Intentionally want to return empty the option.
		$this->assertTrue( $this->host_obj->is_atomic_platform() );
		$this->assertFalse( $this->host_obj->is_woa_site() );
	}

	/**
	 * Test if Atomic site based on constants.
	 */
	public function test_atomic_site_based_on_constants() {
		$this->setup_atomic_constants();
		$this->assertTrue( $this->host_obj->is_atomic_platform() );
	}

	/**
	 * Test that lack of Atomic constants is false.
	 */
	public function test_false_for_not_atomic() {
		Constants::set_constant( 'ATOMIC_CLIENT_ID', false );
		Constants::set_constant( 'ATOMIC_SITE_ID', false );
		$this->assertFalse( $this->host_obj->is_atomic_platform() );
	}

}
