<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Main plugin file testing.
 *
 * @package automattic/jetpack-social-plugin
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
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
		$this->social->do_plugin_activation_activities();
	}
	/**
	 * Test that plugin activation activates the Publicize module.
	 */
	public function test_publicize_module_is_activated_on_plugin_activation() {
		$this->activate_plugin( 'hello-world.php' );
		$this->assertFalse( ( Jetpack_Social::is_publicize_active() ) );

		$this->activate_plugin( JETPACK_SOCIAL_PLUGIN_ROOT_FILE_RELATIVE_PATH );
		$this->assertFalse( ( Jetpack_Social::is_publicize_active() ) );

		$connection_manager = $this->createMock( Connection_Manager::class );
		$connection_manager->method( 'is_connected' )->willReturn( true );
		$connection_manager->method( 'has_connected_user' )->willReturn( true );

		// Publicize global is not available at the moment during these tests
		$this->social = $this->getMockBuilder( Jetpack_Social::class )
			->setConstructorArgs( array( $connection_manager ) )
			->setMethods( array( 'calculate_scheduled_shares' ) )
			->getMock();
		$this->social->expects( $this->once() )->method( 'calculate_scheduled_shares' );

		$this->activate_plugin( JETPACK_SOCIAL_PLUGIN_ROOT_FILE_RELATIVE_PATH );
		$this->assertTrue( Jetpack_Social::is_publicize_active() );

	}

	/**
	 * Testh that the Publicize package isn't ensured without a user connection
	 */
	public function test_publicize_not_configured() {
		$connection_manager = $this->createMock( Connection_Manager::class );
		$connection_manager->method( 'is_connected' )->willReturn( true );
		$connection_manager->method( 'has_connected_user' )->willReturn( false );

		$this->social = $this->getMockBuilder( Jetpack_Social::class )
			->setConstructorArgs( array( $connection_manager ) )
			->getMock();

		do_action( 'plugins_loaded' );

		$this->assertSame( 0, did_action( 'jetpack_feature_publicize_enabled' ) );
	}
}
