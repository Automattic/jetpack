<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Main plugin file testing.
 *
 * @package automattic/jetpack-social-plugin
 */

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
	 * Test that plugin activation activates the Publicize module.
	 */
	public function test_publicize_module_is_activated_on_plugin_activation() {
		do_action( 'activated_plugin', 'hello-world.php' );
		$this->assertFalse( ( new Modules() )->is_active( $this->social::JETPACK_PUBLICIZE_MODULE_SLUG ) );

		do_action( 'activated_plugin', JETPACK_SOCIAL_PLUGIN_ROOT_FILE_RELATIVE_PATH );
		$this->assertTrue( ( new Modules() )->is_active( $this->social::JETPACK_PUBLICIZE_MODULE_SLUG ) );
	}

	/**
	 * Test that `active_modules` gets added to Jetpack Sync correctly.
	 */
	public function test_active_modules_option_gets_added_to_jetpack_sync_correctly() {
		// Active modules shouldn't be changed if it's set already.
		$input = array( 'active_modules' => array( 'test' ) );
		$this->assertEquals( $input, $this->social->filter_sync_callable_whitelist( $input ) );

		// Test with Publicize enabled.
		( new Modules() )->activate( $this->social::JETPACK_PUBLICIZE_MODULE_SLUG, false, false );
		$callables = $this->social->filter_sync_callable_whitelist( array() );
		$this->assertArrayHasKey( 'active_modules', $callables );
		$this->assertEquals( $callables['active_modules'](), array( $this->social::JETPACK_PUBLICIZE_MODULE_SLUG ) );

		// Test with Publicize disabled.
		( new Modules() )->deactivate( $this->social::JETPACK_PUBLICIZE_MODULE_SLUG, false, false );
		$callables = $this->social->filter_sync_callable_whitelist( array() );
		$this->assertArrayHasKey( 'active_modules', $callables );
		$this->assertEquals( $callables['active_modules'](), array() );
	}
}
