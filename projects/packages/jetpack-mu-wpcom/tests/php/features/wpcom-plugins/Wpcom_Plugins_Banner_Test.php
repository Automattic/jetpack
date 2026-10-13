<?php
/**
 * Tests for the WordPress.com banner on the Add Plugins screen.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-plugins/wpcom-plugins.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-plugins/wpcom-marketplace-tab.php';

/**
 * Class Wpcom_Plugins_Banner_Test
 */
class Wpcom_Plugins_Banner_Test extends \WorDBless\BaseTestCase {

	/**
	 * Per-flag filter, so toggling ours leaves every other flag alone.
	 *
	 * @var string
	 */
	private const FLAG_FILTER = 'jetpack_feature_flag_enabled_' . WPCOM_MARKETPLACE_TAB_FLAG;

	/**
	 * Clean up.
	 *
	 * @return void
	 */
	public function tear_down() {
		remove_filter( self::FLAG_FILTER, '__return_true' );
		wp_dequeue_script( 'wpcom-plugins-banner' );
		wp_dequeue_style( 'wpcom-plugins-banner-style' );

		parent::tear_down();
	}

	/**
	 * With the Marketplace tab on, nothing on Add Plugins points people at Calypso's marketplace.
	 */
	public function test_the_marketplace_tab_replaces_the_banner() {
		add_filter( self::FLAG_FILTER, '__return_true' );

		wpcom_plugins_show_banner();

		$this->assertFalse( wp_script_is( 'wpcom-plugins-banner', 'enqueued' ) );
		$this->assertFalse( wp_style_is( 'wpcom-plugins-banner-style', 'enqueued' ) );
	}

	/**
	 * Until the tab ships, the banner stays.
	 */
	public function test_the_banner_stays_while_the_marketplace_tab_is_off() {
		if ( ! file_exists( Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-plugins-banner/wpcom-plugins-banner.asset.php' ) ) {
			$this->markTestSkipped( 'The banner is enqueued from its build, which this run does not have.' );
		}

		wpcom_plugins_show_banner();

		$this->assertTrue( wp_script_is( 'wpcom-plugins-banner', 'enqueued' ) );
	}
}
