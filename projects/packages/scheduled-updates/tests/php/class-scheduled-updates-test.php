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
		parent::set_up_before_class();
		\phpmock\phpunit\PHPMock::defineFunctionMock( 'Automattic\Jetpack', 'realpath' );

		Scheduled_Updates::init();
		Scheduled_Updates::load_rest_api_endpoints();
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

		wp_clear_scheduled_hook( Scheduled_Updates::PLUGIN_CRON_HOOK );
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
	 * Test no scheduled events are created on plugin deletion and base checks.
	 *
	 * @covers ::deleted_plugin
	 */
	public function a_test_base_deleted_plugin_checks() {
		$plugin_name = 'deleted-plugin';
		$plugin_file = "$plugin_name/$plugin_name.php";
		$is_deleted  = false;

		$this->wp_filesystem->mkdir( "$this->plugin_dir/$plugin_name" );
		$this->populate_file_with_plugin_header( "$this->plugin_dir/$plugin_file", $plugin_name );

		$delete_hook = function ( $plugin_file, $deleted ) use ( &$is_deleted ) {
			$is_deleted = $deleted;
		};

		add_action( 'deleted_plugin', $delete_hook, 10, 2 );

		$this->assertTrue( delete_plugins( array( $plugin_file ) ) );

		$this->assertTrue( $is_deleted );
		$this->assertFalse( $this->wp_filesystem->is_dir( "$this->plugin_dir/$plugin_name" ) );
		$this->assertCount( 0, wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK ) );

		remove_action( 'deleted_plugin', $delete_hook );
	}

	/**
	 * Test single event is deleted if a plugin is deleted.
	 *
	 * @covers ::deleted_plugin
	 */
	public function a_test_event_is_deleted_on_plugin_deletion() {
		$plugin_name = 'deleted-plugin';
		$plugin_file = "$plugin_name/$plugin_name.php";

		$this->wp_filesystem->mkdir( "$this->plugin_dir/$plugin_name" );
		$this->populate_file_with_plugin_header( "$this->plugin_dir/$plugin_file", $plugin_name );

		$request = new \WP_REST_Request( 'POST', '/wpcom/v2/update-schedules' );
		$request->set_body_params(
			array(
				'plugins'  => array( $plugin_file ),
				'schedule' => array(
					'timestamp' => strtotime( 'next Monday 8:00' ),
					'interval'  => 'weekly',
				),
			)
		);

		wp_set_current_user( $this->admin_id );
		$result = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertCount( 1, wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK ) );
		$this->assertTrue( delete_plugins( array( $plugin_file ) ) );
		$this->assertCount( 0, wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK ) );
	}

	/**
	 * Test single event is not deleted if a plugin of a list is deleted.
	 *
	 * @covers ::deleted_plugin
	 */
	public function test_event_is_not_deleted_on_plugin_list_deletion() {
		$plugins = array();

		for ( $i = 0; $i < 3; ++$i ) {
			$plugin_name = 'deleted-plugin-' . $i;
			$plugin_file = "$plugin_name/$plugin_name.php";
			$plugins[]   = $plugin_file;

			$this->wp_filesystem->mkdir( "$this->plugin_dir/$plugin_name" );
			$this->populate_file_with_plugin_header( "$this->plugin_dir/$plugin_file", $plugin_name );
		}

		$request = new \WP_REST_Request( 'POST', '/wpcom/v2/update-schedules' );
		$request->set_body_params(
			array(
				'plugins'  => $plugins,
				'schedule' => array(
					'timestamp' => strtotime( 'next Monday 8:00' ),
					'interval'  => 'weekly',
				),
			)
		);
		wp_set_current_user( $this->admin_id );
		$result = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );

		// Check that the events are scheduled.
		$pre_events = wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK );
		$this->assertCount( 1, $pre_events );

		// Delete the first plugin.
		$this->assertTrue( delete_plugins( array( $plugins[1] ) ) );

		// Check that the event is still scheduled.
		$post_events = wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK );
		$this->assertCount( 1, $post_events );

		$pre_event  = reset( $pre_events );
		$post_event = reset( $post_events );

		$this->assertSame( $pre_event->timestamp, $post_event->timestamp );
		$this->assertSame( $pre_event->schedule, $post_event->schedule );
		$this->assertSame( $pre_event->interval, $post_event->interval );
		$this->assertSame( array( $plugins[0], $plugins[2] ), $post_event->args );
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
}
