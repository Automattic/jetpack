<?php
/**
 * Test class for Scheduled_Updates.
 *
 * @package automattic/scheduled-updates
 */

namespace Automattic\Jetpack;

/**
 * Test class for Scheduled_Updates.
 *
 * @coversDefaultClass Scheduled_Updates
 */
class Scheduled_Updates_Test extends \WorDBless\BaseTestCase {

	/**
	 * Used to mock global functions inside a namespace.
	 *
	 * @see https://github.com/php-mock/php-mock-phpunit
	 */
	use \phpmock\phpunit\PHPMock;

	/**
	 * Set up before class.
	 *
	 * @see Restrictions here: https://github.com/php-mock/php-mock-phpunit?tab=readme-ov-file#restrictions
	 * @beforeClass
	 */
	public static function set_up_before_class() {
		\phpmock\phpunit\PHPMock::defineFunctionMock( 'Automattic\Jetpack', 'realpath' );
	}

	/**
	 * Set up.
	 *
	 * @before
	 */
	protected function set_up() {
		parent::set_up_wordbless();
		\WorDBless\Users::init()->clear_all_users();

		// Initialize the WordPress filesystem variable.
		global $wp_filesystem;
		require_once ABSPATH . 'wp-admin/includes/file.php';
		WP_Filesystem();
		$this->wp_filesystem = $wp_filesystem;

		$this->plugin_dir = WP_PLUGIN_DIR;
		$this->admin_id   = wp_insert_user(
			array(
				'user_login' => 'dumasdasdasmy_user',
				'user_pass'  => 'dummy_pass',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $this->admin_id );

		// Ensure plugin directory exists.
		$this->wp_filesystem->mkdir( $this->plugin_dir );

		// init the hook
		add_action( 'rest_api_init', array( 'Automattic\Jetpack\Scheduled_Updates', 'add_is_managed_extension_field' ) );

		do_action( 'rest_api_init' );
	}

	/**
	 * Clean up after test
	 *
	 * @after
	 */
	protected function tear_down() {
		// Clean up the temporary plugin directory
		$this->wp_filesystem->rmdir( $this->plugin_dir, true );

		// Clean up the plugins cache created by get_plugins()
		wp_cache_delete( 'plugins', 'plugins' );

		wp_clear_scheduled_hook( 'jetpack_scheduled_update' );
		delete_option( 'jetpack_scheduled_update_statuses' );

		parent::tear_down_wordbless();
	}

	/**
	 * Simulate and test unmanaged plugins
	 *
	 * @covers ::add_is_managed_extension_field
	 */
	public function test_unmanaged_plugins() {
		// direct
		$plugin_name = 'direct-plugin';
		$this->wp_filesystem->mkdir( "$this->plugin_dir/$plugin_name" );
		$this->populate_file_with_plugin_header( "$this->plugin_dir/$plugin_name/$plugin_name.php", 'direct-plugin' );

		// make sure the directory exists
		$this->assertTrue( $this->wp_filesystem->is_dir( "$this->plugin_dir/direct-plugin" ) );

		$request       = new \WP_REST_Request( 'GET', '/wp/v2/plugins' );
		$result        = rest_do_request( $request );
		$plugin_result = $result->get_data()[0];

		$this->assertSame( 'direct-plugin', $plugin_result['textdomain'] );
		$this->assertSame( false, $plugin_result['is_managed'] );
	}

	/**
	 * Managed plugins should be linked from a root /wordpress directory,
	 * other paths should be ignored.
	 *
	 * @covers ::add_is_managed_extension_field
	 */
	public function test_unmanaged_plugins_not_in_root_directory() {
		// we simulate a symlink to a subdirectory inside a wp directory
		$plugin_name = 'managed-plugin';
		$target_dir  = "$this->plugin_dir/wordpress";
		$this->wp_filesystem->mkdir( $target_dir );
		$this->wp_filesystem->mkdir( "$target_dir/$plugin_name" );
		$this->populate_file_with_plugin_header( "$target_dir/$plugin_name/$plugin_name.php", 'managed-plugin' );
		symlink( "$target_dir/$plugin_name", "$this->plugin_dir/$plugin_name" );

		// make sure the symlink exists
		$this->assertFalse( $this->wp_filesystem->is_dir( "$this->plugin_dir/direct-plugin" ) );
		$this->assertTrue( is_link( "$this->plugin_dir/managed-plugin" ) );

		$request       = new \WP_REST_Request( 'GET', '/wp/v2/plugins' );
		$result        = rest_do_request( $request );
		$plugin_result = $result->get_data()[0];

		$this->assertSame( 'managed-plugin', $plugin_result['textdomain'] );
		$this->assertSame( false, $plugin_result['is_managed'] );
	}

	/**
	 * Simulate managed plugins linked from a root /wordpress directory.
	 *
	 * @group failing
	 * @covers ::add_is_managed_extension_field
	 */
	public function test_managed_plugins() {
		// we simulate a symlink to a subdirectory inside a wp directory
		$plugin_name = 'managed-plugin';
		$target_dir  = "$this->plugin_dir/wordpress";
		$this->wp_filesystem->mkdir( $target_dir );
		$this->wp_filesystem->mkdir( "$target_dir/$plugin_name" );
		$this->populate_file_with_plugin_header( "$target_dir/$plugin_name/$plugin_name.php", 'managed-plugin' );
		symlink( "$target_dir/$plugin_name", "$this->plugin_dir/$plugin_name" );

		// make sure the symlink exists
		$this->assertFalse( $this->wp_filesystem->is_dir( "$this->plugin_dir/direct-plugin" ) );
		$this->assertTrue( is_link( "$this->plugin_dir/managed-plugin" ) );

		// tweak realpath so that it returns `/wordpress/...`
		$realpath = $this->getFunctionMock( __NAMESPACE__, 'realpath' );
		$realpath->expects( $this->once() )->willReturn( "/wordpress/plugins/$plugin_name" );

		$request       = new \WP_REST_Request( 'GET', '/wp/v2/plugins' );
		$result        = rest_do_request( $request );
		$plugin_result = $result->get_data()[0];

		$this->assertSame( 'managed-plugin', $plugin_result['textdomain'] );
		$this->assertSame( true, $plugin_result['is_managed'] );
	}

	/**
	 * Test valid statuses.
	 *
	 * @covers ::get_scheduled_events_with_statuses
	 */
	public function test_get_scheduled_events_with_statuses() {
		$plugins = array( 'gutenberg/gutenberg.php' );
		$id      = Scheduled_Updates::generate_schedule_id( $plugins );
		$events  = $this->schedule_event( strtotime( 'next Monday 8:00' ), $plugins );

		$this->assertIsArray( $events );
		$this->arrayHasKey( $id, $events );
		$this->assertNull( $events[ $id ]->last_run_timestamp );
		$this->assertNull( $events[ $id ]->last_run_status );
	}

	/**
	 * Test set scheduled update status.
	 *
	 * @covers ::set_scheduled_update_status
	 */
	public function test_set_scheduled_update_status() {
		$this->assertFalse( Scheduled_Updates::set_scheduled_update_status( 'test', 0, '' ) );

		$plugins = array( 'gutenberg/gutenberg.php' );
		$id_1    = Scheduled_Updates::generate_schedule_id( $plugins );

		$this->schedule_event( strtotime( 'next Monday 8:00' ), $plugins );

		$updated_schedule = Scheduled_Updates::set_scheduled_update_status( $id_1, 1, 'success' );

		$this->assertIsArray( $updated_schedule );
		$this->assertSame( 1, $updated_schedule['last_run_timestamp'] );
		$this->assertSame( 'success', $updated_schedule['last_run_status'] );

		$plugins = array( 'hello-dolly/hello.php' );
		$id_2    = Scheduled_Updates::generate_schedule_id( $plugins );

		$this->schedule_event( strtotime( 'next Monday 9:00' ), $plugins );
		$updated_schedule = Scheduled_Updates::set_scheduled_update_status( $id_2, 2, 'failure-and-rollback' );

		$this->assertIsArray( $updated_schedule );
		$this->assertSame( 2, $updated_schedule['last_run_timestamp'] );
		$this->assertSame( 'failure-and-rollback', $updated_schedule['last_run_status'] );

		$events = Scheduled_Updates::get_scheduled_events_with_statuses();

		$this->arrayHasKey( $id_1, $events );
		$this->arrayHasKey( $id_2, $events );
		$this->assertSame( 1, $events[ $id_1 ]->last_run_timestamp );
		$this->assertSame( 2, $events[ $id_2 ]->last_run_timestamp );
	}

	/**
	 * Populates the plugin file with a plugin header so get_plugins() can find it.
	 *
	 * @param string $plugin_file Path to plugin file.
	 * @param string $plugin_name The plugin name.
	 */
	private function populate_file_with_plugin_header( $plugin_file, $plugin_name ) {
		$this->wp_filesystem->touch( $plugin_file );
		$this->wp_filesystem->put_contents(
			$plugin_file,
			"/**
				* Plugin Name: $plugin_name
				* Plugin URI: https://jetpack.com/
				* Description: $plugin_name
				* Version: 4.0.0
				* Author: Automattic
				* Text Domain: $plugin_name
				*/"
		);
	}

	/**
	 * Schedule an event.
	 *
	 * @param int    $timestamp  The timestamp to schedule the event.
	 * @param array  $plugins    The plugins to schedule the event for.
	 * @param string $recurrence The recurrence of the event.
	 * @return array The scheduled events.
	 */
	private function schedule_event( $timestamp, $plugins, $recurrence = 'weekly' ) {
		wp_schedule_event( $timestamp, $recurrence, 'jetpack_scheduled_update', $plugins );

		return Scheduled_Updates::get_scheduled_events_with_statuses();
	}
}
