<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Main plugin file testing.
 *
 * @package automattic/jetpack-social-plugin
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Modules;
use WorDBless\BaseTestCase;

/**
 * Main plugin file testing.
 */
class Jetpack_Social_Test extends BaseTestCase {
	/**
	 * Initialize tests
	 *
	 * @before
	 */
	public function set_up() {
		$this->social = new Jetpack_Social();
	}

	/**
	 * Triggers the actions to mimic activating the plugin.
	 *
	 * @param string $plugin The plugin slug to activate.
	 */
	public function activate_plugin( $plugin ) {
		do_action( 'activate_' . $plugin );
		// Run the function that would be called on admin_init.
		// Calling do_action( 'admin_init' ) has other side effects.
		$this->social->activate_module_on_plugin_activation();
	}
	/**
	 * Test that plugin activation activates the Publicize module.
	 */
	public function test_publicize_module_is_activated_on_plugin_activation() {
		$this->activate_plugin( 'hello-world.php' );
		$this->assertFalse( ( new Modules() )->is_active( Jetpack_Social::JETPACK_PUBLICIZE_MODULE_SLUG ) );

		$this->activate_plugin( JETPACK_SOCIAL_PLUGIN_ROOT_FILE_RELATIVE_PATH );
		$this->assertFalse( ( new Modules() )->is_active( Jetpack_Social::JETPACK_PUBLICIZE_MODULE_SLUG ) );

		$connection_manager = $this->createMock( Connection_Manager::class );
		$connection_manager->method( 'is_connected' )->willReturn( true );
		$this->social = new Jetpack_Social( $connection_manager );
		$this->activate_plugin( JETPACK_SOCIAL_PLUGIN_ROOT_FILE_RELATIVE_PATH );
		$this->assertTrue( ( new Modules() )->is_active( Jetpack_Social::JETPACK_PUBLICIZE_MODULE_SLUG ) );

	}
}
