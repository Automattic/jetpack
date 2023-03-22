<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Testing the Settings class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Publicize\Social_Image_Generator\Settings;
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
}
