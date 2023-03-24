<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Testing the Settings class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Publicize\Social_Image_Generator\Settings;
use Automattic\Jetpack\Publicize\Social_Image_Generator\Templates;
use WorDBless\BaseTestCase;

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
	 */
	public function set_up() {
		$this->settings = new Settings();
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
		$this->assertEquals( $this->settings->get_default_template(), Templates::DEFAULT_TEMPLATE );
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
