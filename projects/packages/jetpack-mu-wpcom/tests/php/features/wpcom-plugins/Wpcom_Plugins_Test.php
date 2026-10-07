<?php
/**
 * Tests for the WordPress.com Plugins integration.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-plugins/wpcom-plugins.php';

/**
 * Class Wpcom_Plugins_Test
 */
class Wpcom_Plugins_Test extends \WorDBless\BaseTestCase {

	/**
	 * Prepare a neutral admin screen.
	 */
	public function set_up() {
		parent::set_up();

		global $pagenow;
		$pagenow = 'index.php';

		set_current_screen( 'dashboard' );
		delete_option( 'big_sky_enable' );
	}

	/**
	 * Restore global request state.
	 */
	public function tear_down() {
		global $pagenow;
		$pagenow = 'index.php';

		delete_option( 'big_sky_enable' );
		set_current_screen( 'front' );

		parent::tear_down();
	}

	/**
	 * The integration registers its Agents Manager request filter.
	 */
	public function test_agents_manager_filter_is_registered() {
		$this->assertNotFalse( has_filter( 'agents_manager_should_load', 'wpcom_plugins_should_load_agents_manager' ) );
	}

	/**
	 * Existing shell requests must remain enabled.
	 */
	public function test_existing_agents_manager_request_is_preserved() {
		$this->assertTrue( wpcom_plugins_should_load_agents_manager( true ) );
	}

	/**
	 * The installed plugins screen loads Agents Manager when WordPress Agent is enabled.
	 */
	public function test_agents_manager_loads_on_plugins_screen() {
		global $pagenow;
		$pagenow = 'plugins.php';

		set_current_screen( 'plugins' );
		update_option( 'big_sky_enable', 1 );

		$this->assertTrue( wpcom_plugins_should_load_agents_manager( false ) );
	}

	/**
	 * The Add Plugins screen loads Agents Manager when WordPress Agent is enabled.
	 */
	public function test_agents_manager_loads_on_plugin_install_screen() {
		global $pagenow;
		$pagenow = 'plugin-install.php';

		set_current_screen( 'plugin-install' );
		update_option( 'big_sky_enable', 1 );

		$this->assertTrue( wpcom_plugins_should_load_agents_manager( false ) );
	}

	/**
	 * Turning WordPress Agent off leaves Agents Manager dormant.
	 */
	public function test_agents_manager_does_not_load_when_wordpress_agent_is_disabled() {
		global $pagenow;
		$pagenow = 'plugins.php';

		set_current_screen( 'plugins' );
		update_option( 'big_sky_enable', 0 );

		$this->assertFalse( wpcom_plugins_should_load_agents_manager( false ) );
	}

	/**
	 * Other wp-admin screens do not request Agents Manager.
	 */
	public function test_agents_manager_does_not_load_on_other_admin_screens() {
		update_option( 'big_sky_enable', 1 );

		$this->assertFalse( wpcom_plugins_should_load_agents_manager( false ) );
	}

	/**
	 * Front-end requests do not load Agents Manager through this integration.
	 */
	public function test_agents_manager_does_not_load_on_frontend() {
		global $pagenow;
		$pagenow = 'plugins.php';

		set_current_screen( 'front' );
		update_option( 'big_sky_enable', 1 );

		$this->assertFalse( wpcom_plugins_should_load_agents_manager( false ) );
	}
}
