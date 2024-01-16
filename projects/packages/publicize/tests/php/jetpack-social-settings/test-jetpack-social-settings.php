<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Testing the Settings class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Publicize\Jetpack_Social_Settings\Settings as SocialSettings;
use Automattic\Jetpack\Publicize\Social_Image_Generator\Templates;
use WorDBless\BaseTestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Posts as WorDBless_Posts;
use WorDBless\Users as WorDBless_Users;

/**
 * Testing the Settings class.
 */
class Jetpack_Social_Settings_Test extends BaseTestCase {
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
		$publicize = $this->getMockBuilder( Publicize::class )->setMethods( array( 'has_social_auto_conversion_feature', 'has_social_image_generator_feature' ) )->getMock();
		$publicize->method( 'has_social_auto_conversion_feature' )
			->withAnyParameters()
			->willReturn( true );
		$publicize->method( 'has_social_image_generator_feature' )
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
	 * Tests that the settings are returned correctly with the availability parameter.
	 */
	public function test_get_settings_with_availability() {
		$settings = $this->settings->get_settings( true );

		$this->assertArrayHasKey( 'autoConversionSettings', $settings );
		$this->assertArrayHasKey( 'socialImageGeneratorSettings', $settings );
		$this->assertArrayHasKey( 'available', $settings['autoConversionSettings'] );
		$this->assertArrayHasKey( 'available', $settings['socialImageGeneratorSettings'] );

		$this->assertTrue( $settings['autoConversionSettings']['available'] );
		$this->assertTrue( $settings['socialImageGeneratorSettings']['available'] );
	}

	/**
	 * Tests that the settings are returned correctly on new sites without the option.
	 */
	public function test_settings_on_new_site() {
		$settings = $this->settings->get_settings();

		$this->assertArrayHasKey( 'autoConversionSettings', $settings );
		$this->assertArrayHasKey( 'socialImageGeneratorSettings', $settings );
		$this->assertArrayHasKey( 'enabled', $settings['socialImageGeneratorSettings'] );
		$this->assertArrayHasKey( 'template', $settings['socialImageGeneratorSettings'] );

		$this->assertTrue( $settings['autoConversionSettings']['enabled'] );
		$this->assertFalse( $settings['socialImageGeneratorSettings']['enabled'] );
		$this->assertEquals( Templates::DEFAULT_TEMPLATE, $settings['socialImageGeneratorSettings']['template'] );
	}

	/**
	 * Tests that the sites can be migrated from the old set of options
	 */
	public function test_migrate_old_options() {
		update_option( 'jetpack_social_settings', array( 'image' => true ) );
		update_option(
			'jetpack_social_image_generator_settings',
			array(
				'enabled'  => true,
				'defaults' => array( 'template' => 'example_template' ),
			)
		);

		$expected_options = array(
			'autoConversionSettings'       => array( 'enabled' => true ),
			'socialImageGeneratorSettings' => array(
				'enabled'  => true,
				'template' => 'example_template',
			),
		);

		$this->settings = new SocialSettings();

		$this->assertEquals( $expected_options, $this->settings->get_settings() );
	}

	/**
	 * Tests that the sites can be migrated from the old set of options with missing template option
	 */
	public function test_migrate_old_options_with_missing() {
		update_option( 'jetpack_social_settings', array( 'image' => true ) );

		$expected_options = array(
			'autoConversionSettings'       => array( 'enabled' => true ),
			'socialImageGeneratorSettings' => array(
				'enabled'  => false,
				'template' => Templates::DEFAULT_TEMPLATE,
			),
		);

		$this->settings = new SocialSettings();
		$this->assertEquals( $expected_options, $this->settings->get_settings() );
	}

	/**
	 * Tests that the auto-conversion settings are migrated even if it was false before.
	 */
	public function test_migrate_old_options_with_disabled_autoconversion() {
		update_option( 'jetpack_social_settings', array( 'image' => false ) );
		$expected_options = array( 'enabled' => false );

		$this->settings = new SocialSettings();
		$this->assertEquals( $expected_options, $this->settings->get_settings()['autoConversionSettings'] );
	}
}
