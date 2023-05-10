<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Testing the Settings class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Publicize\Social_Image_Generator\Settings;
use Automattic\Jetpack\Publicize\Social_Image_Generator\Templates;
use WorDBless\BaseTestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Posts as WorDBless_Posts;
use WorDBless\Users as WorDBless_Users;

/**
 * Testing the Settings class.
 */
class Settings_Test extends BaseTestCase {
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
		$plan['features']['active'] = array( 'social-image-generator' );
		update_option( Current_Plan::PLAN_OPTION, $plan, true );
		$this->settings = new Settings();
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
	 * Test that SIG is available based on the plan check.
	 */
	public function test_correctly_returns_available_status() {
		$this->assertTrue( $this->settings->is_available() );
	}

	/**
	 * Test that it correctly returns enabled or disabled.
	 */
	public function test_correctly_returns_enabled_status() {
		$this->assertFalse( $this->settings->is_enabled() );
	}

	/**
	 * Test that it correctly updates the enabled status.
	 */
	public function test_correctly_updates_enabled_status() {
		$this->settings->set_enabled( true );
		$this->assertTrue( $this->settings->is_enabled() );
	}

	/**
	 * Test that it returns the default template if a template is not set.
	 */
	public function test_returns_default_template_if_not_set() {
		$this->assertEquals( Templates::DEFAULT_TEMPLATE, $this->settings->get_default_template() );
	}

	/**
	 * Test that it returns all the correct defaults.
	 */
	public function test_defaults_have_all_required_keys() {
		$defaults = $this->settings->get_defaults();
		$this->assertArrayHasKey( 'template', $defaults );
		$this->assertCount( 1, $defaults );
	}

	/**
	 * Test that it returns correct template if set.
	 */
	public function test_returns_correct_template_if_set() {
		$this->settings->set_default_template( 'example_template' );
		$this->assertEquals( 'example_template', $this->settings->get_default_template() );
	}
}
