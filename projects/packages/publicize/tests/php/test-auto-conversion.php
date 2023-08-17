<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Testing the Settings class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Publicize\Auto_Conversion\Settings as Auto_Conversion_Settings;
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
		$this->settings = new Auto_Conversion_Settings();
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
	 * Test that SIG is available based on the plan check.
	 */
	public function test_correctly_returns_available_status() {
		$this->assertTrue( $this->settings->is_available( 'image' ) );
		$this->assertTrue( $this->settings->is_available( 'video' ) );
	}

	/**
	 * Test that it correctly returns enabled or disabled.
	 */
	public function test_correctly_returns_enabled_status() {
		$this->assertFalse( $this->settings->is_enabled( 'image' ) );
		$this->assertFalse( $this->settings->is_enabled( 'video' ) );
	}

	/**
	 * Test that it correctly returns enabled or disabled.
	 */
	public function test_correctly_updates_enabled_status() {
		$this->settings->set_enabled( 'image', true );
		$this->assertTrue( $this->settings->is_enabled( 'image' ) );
		$this->assertFalse( $this->settings->is_enabled( 'video' ) );
		$this->settings->set_enabled( 'video', true );
		$this->assertTrue( $this->settings->is_enabled( 'image' ) );
		$this->assertTrue( $this->settings->is_enabled( 'video' ) );

		$this->settings->set_enabled( 'image', false );
		$this->assertFalse( $this->settings->is_enabled( 'image' ) );
		$this->assertTrue( $this->settings->is_enabled( 'video' ) );
		$this->settings->set_enabled( 'video', false );
		$this->assertFalse( $this->settings->is_enabled( 'video' ) );
	}
}
