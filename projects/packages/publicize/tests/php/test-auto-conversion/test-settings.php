<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Testing the Settings class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Publicize\Auto_Conversion\Auto_Conversion_Settings;
use WorDBless\BaseTestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Posts as WorDBless_Posts;
use WorDBless\Users as WorDBless_Users;

/**
 * Testing the Settings class.
 */
class Autoconversion_Settings_Test extends BaseTestCase {
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
		global $publicize_ui;
		if ( ! isset( $publicize_ui ) ) {
			$publicize_ui = new Publicize_UI();
		}

		$plan                       = Current_Plan::PLAN_DATA['free'];
		$plan['features']['active'] = array( 'jetpack-social-image-auto-convert' );
		update_option( Current_Plan::PLAN_OPTION, $plan, true );
		$this->settings = new Auto_Conversion_Settings();
	}

	/**
	 * Tear down
	 *
	 * @after
	 */
	public function tear_down() {
		remove_filter( 'jetpack_active_modules', array( $this, 'mock_publicize_being_active' ) );
		$plan                       = Current_Plan::PLAN_DATA['free'];
		$plan['features']['active'] = array();
		update_option( Current_Plan::PLAN_OPTION, $plan, true );
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
		$this->assertTrue( $this->settings->is_available() );
	}

	/**
	 * Test that it correctly returns enabled or disabled.
	 */
	public function test_correctly_returns_enabled_status() {
		$this->assertFalse( $this->settings->is_enabled( 'image' ) );
		$this->assertFalse( $this->settings->is_enabled( 'video' ) );
	}

	/**
	 * Test that it correctly updates the enabled status.
	 */
	public function test_correctly_updates_enabled_status() {
		$this->settings->enable_or_disable( 'image', true );
		$this->assertTrue( $this->settings->is_enabled( 'image' ) );
		$this->assertFalse( $this->settings->is_enabled( 'video' ) );

		$this->settings->enable_or_disable( 'image', false );
		$this->assertFalse( $this->settings->is_enabled( 'image' ) );
		$this->assertFalse( $this->settings->is_enabled( 'video' ) );

		$this->settings->enable_or_disable( 'video', true );
		$this->assertTrue( $this->settings->is_enabled( 'video' ) );
		$this->assertFalse( $this->settings->is_enabled( 'image' ) );

		$this->settings->enable_or_disable( 'image', true );
		$this->assertTrue( $this->settings->is_enabled( 'video' ) );
		$this->assertTrue( $this->settings->is_enabled( 'image' ) );
	}

}
