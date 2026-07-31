<?php
/**
 * Tests for Newsletter Mode bootstrap wiring.
 *
 * @package automattic/jetpack
 */

/**
 * Newsletter Mode is initialized by its owning module.
 */
class Newsletter_Mode_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Newsletter Mode should not be initialized from the plugin-wide bootstrap.
	 */
	public function test_not_wired_from_plugin_bootstrap() {
		$bootstrap = file_get_contents( JETPACK__PLUGIN_DIR . 'load-jetpack.php' );

		$this->assertStringNotContainsString(
			'Newsletter\Mode::init()',
			$bootstrap,
			'Newsletter Mode must not be initialized for every Jetpack request.'
		);
	}

	/**
	 * Newsletter Mode should be initialized from the Subscriptions module.
	 */
	public function test_wired_from_subscriptions_module() {
		$module = file_get_contents( JETPACK__PLUGIN_DIR . 'modules/subscriptions.php' );

		$this->assertStringContainsString(
			'Newsletter\Mode::init()',
			$module,
			'Newsletter Mode must be initialized from modules/subscriptions.php.'
		);
	}
}
