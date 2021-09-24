<?php //phpcs:ignoreFile
/**
 * Test Module Base Class.
 */

namespace Automattic\Jetpack_Boost\Tests\Modules;

use Automattic\Jetpack_Boost\Tests\Base_Test_Case;
use Automattic\Jetpack_Boost\Tests\Mocks\Mock_Module;

/**
 * Class WP_Test_Module
 *
 * @package Automattic\Jetpack_Boost\Tests\Modules
 */
class WP_Test_Module extends Base_Test_Case {

	/**
	 * Test deactivation hook.
	 */
	public function test_deactivate_hook() {
		$module = new Mock_Module();
		$this->assertEquals( 10, has_action( 'jetpack_boost_deactivate', [ $module, 'on_deactivate' ] ) );
	}

	/**
	 * Test uninstall hook.
	 */
	public function test_uninstall_hook() {
		$module = new Mock_Module();
		$this->assertEquals( 10, has_action( 'jetpack_boost_uninstall', [ $module, 'on_uninstall' ] ) );
	}
}
