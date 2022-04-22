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
		$this->assertFalse( ( new Modules() )->is_active( Jetpack_Social::JETPACK_PUBLICIZE_MODULE_SLUG ) );

		do_action( 'activated_plugin', JETPACK_SOCIAL_PLUGIN_ROOT_FILE_RELATIVE_PATH );
		$this->assertTrue( ( new Modules() )->is_active( Jetpack_Social::JETPACK_PUBLICIZE_MODULE_SLUG ) );
	}

	/**
	 * Test that `active_modules` does not overwrite existing synced modules.
	 */
	public function test_active_modules_sync_does_not_overwrite_other_modules() {
		( new Modules() )->activate( Jetpack_Social::JETPACK_PUBLICIZE_MODULE_SLUG, false, false );
		$input     = array(
			'active_modules' => function () {
				return array( 'example-module' );
			},
		);
		$callables = $this->social->filter_sync_callable_whitelist( $input );
		$this->assertEquals( $callables['active_modules'](), array( 'example-module', Jetpack_Social::JETPACK_PUBLICIZE_MODULE_SLUG ) );
	}

	/**
	 * Test that `active_modules` does not get duplicate modules.
	 */
	public function test_active_modules_sync_does_not_get_duplicate_modules() {
		( new Modules() )->activate( Jetpack_Social::JETPACK_PUBLICIZE_MODULE_SLUG, false, false );
		$input     = array(
			'active_modules' => function () {
				return array( Jetpack_Social::JETPACK_PUBLICIZE_MODULE_SLUG );
			},
		);
		$callables = $this->social->filter_sync_callable_whitelist( $input );
		$this->assertEquals( $callables['active_modules'](), array( Jetpack_Social::JETPACK_PUBLICIZE_MODULE_SLUG ) );
	}

	/**
	 * Test that `active_modules` gets synced correctly with Publicize enabled.
	 */
	public function test_active_modules_option_gets_synced_correctly_with_publicize_enabled() {
		( new Modules() )->activate( Jetpack_Social::JETPACK_PUBLICIZE_MODULE_SLUG, false, false );
		$callables = $this->social->filter_sync_callable_whitelist( array() );
		$this->assertArrayHasKey( 'active_modules', $callables );
		$this->assertEquals( $callables['active_modules'](), array( Jetpack_Social::JETPACK_PUBLICIZE_MODULE_SLUG ) );
	}

	/**
	 * Test that `active_modules` gets synced correctly with Publicize disabled.
	 */
	public function test_active_modules_option_gets_synced_correctly_with_publicize_disabled() {
		( new Modules() )->deactivate( Jetpack_Social::JETPACK_PUBLICIZE_MODULE_SLUG, false, false );
		$callables = $this->social->filter_sync_callable_whitelist( array() );
		$this->assertArrayHasKey( 'active_modules', $callables );
		$this->assertEquals( $callables['active_modules'](), array() );
	}
}
