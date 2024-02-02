<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Testing the Settings class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Publicize\Jetpack_Social_Settings\Settings as SocialSettings;
use WorDBless\BaseTestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Posts as WorDBless_Posts;
use WorDBless\Users as WorDBless_Users;

/**
 * Testing the Settings class.
 */
class Auto_Conversion_Test extends BaseTestCase {
	/**
	 * Instance of the Settings class.
	 *
	 * @var Settings $settings
	 */
	protected $settings;

	/**
	 * Initialize tests
	 *
	 * @before
	 */
	public function set_up() {
		add_filter( 'jetpack_active_modules', array( $this, 'mock_publicize_being_active' ) );
		global $publicize;
		$publicize = $this->getMockBuilder( Publicize::class )->setMethods( array( 'has_social_auto_conversion_feature' ) )->getMock();
		$publicize->method( 'has_social_auto_conversion_feature' )
		->withAnyParameters()
		->willReturn( true );
		$this->settings = new SocialSettings();
		$this->settings->register_settings();
	}

	/**
	 * Tear down
	 *
	 * @after
	 */
	public function tear_down() {
		wp_set_current_user( 0 );

		global $publicize;
		$publicize = new Publicize();

		remove_filter( 'jetpack_active_modules', array( $this, 'mock_publicize_being_active' ) );
		WorDBless_Options::init()->clear_options();
		WorDBless_Posts::init()->clear_all_posts();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Mock Publicize being active.
	 *
	 * @return array
	 */
	public function mock_publicize_being_active() {
		return array( 'publicize' );
	}

	/**
	 * Test that Auto-Conversion is available based on the plan check.
	 */
	public function test_correctly_returns_available_status() {
		$this->assertTrue( $this->settings->is_auto_conversion_available() );
	}

	/**
	 * Test that it correctly returns enabled or disabled.
	 */
	public function test_correctly_returns_enabled_status() {
		$auto_conversion_settings = $this->settings->get_settings()['autoConversionSettings'];
		$this->assertTrue( $auto_conversion_settings['enabled'] );
		$this->assertFalse( isset( $auto_conversion_settings['video'] ) ? $auto_conversion_settings['video'] : false );
	}

	/**
	 * Test that it correctly returns enabled or disabled.
	 */
	public function test_correctly_updates_enabled_status() {
		$this->settings->update_auto_conversion_setting( array( 'enabled' => false ) );
		$auto_conversion_settings = $this->settings->get_settings()['autoConversionSettings'];
		$this->assertFalse( $auto_conversion_settings['enabled'] );

		$this->settings->update_auto_conversion_setting( array( 'video' => true ) );
		$auto_conversion_settings = $this->settings->get_settings()['autoConversionSettings'];
		$this->assertFalse( $auto_conversion_settings['enabled'] );
		$this->assertTrue( $auto_conversion_settings['video'] );
	}
}
