<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Testing the Settings class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Publicize\Jetpack_Social_Settings\Settings as SocialSettings;
use Automattic\Jetpack\Publicize\Social_Image_Generator\Templates;
use WorDBless\BaseTestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Posts as WorDBless_Posts;
use WorDBless\Users as WorDBless_Users;

/**
 * Testing the Settings class.
 */
class Social_Image_Generator_Settings_Test extends BaseTestCase {
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
		$this->settings = new SocialSettings();
		$this->settings->register_settings();
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
		$this->assertTrue( $this->settings->is_sig_available() );
	}

	/**
	 * Test that it correctly returns enabled or disabled.
	 */
	public function test_correctly_returns_enabled_status() {
		$sig_settings = $this->settings->get_settings()['socialImageGeneratorSettings'];
		$this->assertFalse( $sig_settings['enabled'] );
	}

	/**
	 * Test that it correctly updates the enabled status.
	 */
	public function test_correctly_updates_enabled_status() {
		$sig_settings = $this->settings->get_settings()['socialImageGeneratorSettings'];
		$this->assertFalse( $sig_settings['enabled'] );

		$this->settings->update_social_image_generator_settings( array( 'enabled' => true ) );

		$sig_settings = $this->settings->get_settings()['socialImageGeneratorSettings'];
		$this->assertTrue( $sig_settings['enabled'] );
	}

	/**
	 * Test that it returns the default template if a template is not set.
	 */
	public function test_returns_default_template_if_not_set() {
		$sig_settings = $this->settings->get_settings()['socialImageGeneratorSettings'];
		$this->assertEquals( Templates::DEFAULT_TEMPLATE, $sig_settings['template'] );
	}

	/**
	 * Test that it returns correct template if set.
	 */
	public function test_returns_correct_template_if_set() {
		$this->settings->update_social_image_generator_settings( array( 'template' => 'example_template' ) );
		$sig_settings = $this->settings->get_settings()['socialImageGeneratorSettings'];

		$this->assertEquals( 'example_template', $sig_settings['template'] );
	}
}
