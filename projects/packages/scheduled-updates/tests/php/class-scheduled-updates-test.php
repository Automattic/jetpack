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
	 * Admin user ID.
	 *
	 * @var int
	 */
	public $admin_id;

	/**
	 * WordPress filesystem.
	 *
	 * @var \WP_Filesystem_Direct
	 */
	public $wp_filesystem;

	/**
	 * Set up before class.
	 *
	 * @see Restrictions here: https://github.com/php-mock/php-mock-phpunit?tab=readme-ov-file#restrictions
	 * @beforeClass
	 */
	public static function set_up_before_class() {
		parent::set_up_before_class();
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
		Scheduled_Updates::init();

		// Initialize the WordPress filesystem variable.
		global $wp_filesystem;
		require_once ABSPATH . 'wp-admin/includes/file.php';
		WP_Filesystem();
		$this->wp_filesystem = $wp_filesystem;

		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'dumasdasdasmy_user',
				'user_pass'  => 'dummy_pass',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $this->admin_id );
	}

	/**
	 * Clean up after test
	 *
	 * @after
	 */
	protected function tear_down() {
		$this->wp_filesystem->delete( WP_PLUGIN_DIR . '/deleted-plugin-0', true );
		$this->wp_filesystem->delete( WP_PLUGIN_DIR . '/deleted-plugin-1', true );
		$this->wp_filesystem->delete( WP_PLUGIN_DIR . '/deleted-plugin-2', true );
		if ( file_exists( WP_PLUGIN_DIR . '/managed-plugin' ) ) {
			wp_delete_file( WP_PLUGIN_DIR . '/managed-plugin' );
		}

		// Clean up the plugins cache created by get_plugins().
		wp_cache_delete( 'plugins', 'plugins' );

		wp_clear_scheduled_hook( Scheduled_Updates::PLUGIN_CRON_HOOK );
		delete_option( 'jetpack_scheduled_update_statuses' );
		delete_option( 'auto_update_plugins' );

		parent::tear_down_wordbless();
	}

	/**
	 * Simulate and test unmanaged plugins
	 *
	 * @covers ::add_is_managed_extension_field
	 */
	public function test_unmanaged_plugins() {
		$request       = new \WP_REST_Request( 'GET', '/wp/v2/plugins' );
		$result        = rest_do_request( $request );
		$plugin_result = wp_list_filter( $result->get_data(), array( 'plugin' => 'gutenberg/gutenberg' ) );
		$plugin_result = reset( $plugin_result );

		$this->assertSame( 'gutenberg', $plugin_result['textdomain'] );
		$this->assertSame( false, $plugin_result['is_managed'] );
	}

	/**
	 * Managed plugins should be linked from a root /wordpress directory,
	 * other paths should be ignored.
	 *
	 * @covers ::add_is_managed_extension_field
	 */
	public function test_unmanaged_plugins_not_in_root_directory() {
		symlink( WP_PLUGIN_DIR . '/wordpress/managed-plugin', WP_PLUGIN_DIR . '/managed-plugin' );

		$request       = new \WP_REST_Request( 'GET', '/wp/v2/plugins' );
		$result        = rest_do_request( $request );
		$plugin_result = wp_list_filter( $result->get_data(), array( 'plugin' => 'managed-plugin/managed-plugin' ) );
		$plugin_result = reset( $plugin_result );

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
		symlink( WP_PLUGIN_DIR . '/wordpress/managed-plugin', WP_PLUGIN_DIR . '/managed-plugin' );

		// Tweak realpath so that it returns `/wordpress/...`.
		$realpath = $this->getFunctionMock( __NAMESPACE__, 'realpath' );
		$realpath->expects( $this->once() )->willReturn( '/wordpress/plugins/managed-plugin' );

		$request       = new \WP_REST_Request( 'GET', '/wp/v2/plugins' );
		$result        = rest_do_request( $request );
		$plugin_result = wp_list_filter( $result->get_data(), array( 'plugin' => 'managed-plugin/managed-plugin' ) );
		$plugin_result = reset( $plugin_result );

		$this->assertSame( 'managed-plugin', $plugin_result['textdomain'] );
		$this->assertSame( true, $plugin_result['is_managed'] );
	}

	/**
	 * Test no scheduled events are created on plugin deletion and base checks.
	 *
	 * @covers ::deleted_plugin
	 */
	public function test_base_deleted_plugin_checks() {
		$plugin_name = 'deleted-plugin';
		$plugin_file = "$plugin_name/$plugin_name.php";
		$is_deleted  = false;

		$delete_hook = function ( $plugin_file, $deleted ) use ( &$is_deleted ) {
			$is_deleted = $deleted;
		};

		add_action( 'deleted_plugin', $delete_hook, 10, 2 );

		$this->assertTrue( delete_plugins( array( $plugin_file ) ) );

		$this->assertTrue( $is_deleted );
		$this->assertFalse( $this->wp_filesystem->is_dir( WP_PLUGIN_DIR . '/' . $plugin_name ) );
		$this->assertCount( 0, wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK ) );

		remove_action( 'deleted_plugin', $delete_hook );
	}

	/**
	 * Test single event is deleted if a plugin is deleted.
	 *
	 * @covers ::deleted_plugin
	 */
	public function test_event_is_deleted_on_plugin_deletion() {
		$plugins = $this->create_plugins_for_deletion( 1 );
		$request = new \WP_REST_Request( 'POST', '/wpcom/v2/update-schedules' );
		$request->set_body_params(
			array(
				'plugins'  => $plugins,
				'schedule' => array(
					'timestamp'          => strtotime( 'next Monday 8:00' ),
					'interval'           => 'weekly',
					'health_check_paths' => array(),
				),
			)
		);

		wp_set_current_user( $this->admin_id );
		$result = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertCount( 1, wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK ) );
		$this->assertTrue( delete_plugins( array( $plugins[0] ) ) );

		$this->assertCount( 0, wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK ) );
	}

	/**
	 * Test other events are not deleted if a plugin of a list is deleted.
	 *
	 * @covers ::deleted_plugin
	 */
	public function test_events_are_not_deleted_on_plugin_list_deletion() {
		$plugins = $this->create_plugins_for_deletion( 3 );

		$request = new \WP_REST_Request( 'POST', '/wpcom/v2/update-schedules' );
		$request->set_body_params(
			array(
				'plugins'  => $plugins,
				'schedule' => array(
					'timestamp'          => strtotime( 'next Monday 8:00' ),
					'interval'           => 'weekly',
					'health_check_paths' => array(),
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
	 * Test deleting a plugin in multiple events do not delete the events.
	 *
	 * @covers ::deleted_plugin
	 */
	public function test_delete_plugin_in_multiple_events() {
		$plugins = $this->create_plugins_for_deletion( 3 );

		// Create two events at 08:00 and 09:00 with plugins 0 and 1, and 1 and 2.
		for ( $i = 0; $i < 2; ++$i ) {
			$hour    = $i + 8;
			$request = new \WP_REST_Request( 'POST', '/wpcom/v2/update-schedules' );
			$request->set_body_params(
				array(
					'plugins'  => array( $plugins[ $i ], $plugins[ $i + 1 ] ),
					'schedule' => array(
						'timestamp'          => strtotime( "next Monday {$hour}:00" ),
						'interval'           => 'weekly',
						'health_check_paths' => array(),
					),
				)
			);
			$result = rest_do_request( $request );

			$this->assertSame( 200, $result->get_status() );
		}

		// Check that the events are scheduled.
		$pre_events = wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK );
		$this->assertCount( 2, $pre_events );

		// Delete second plugin, that appears in both events.
		$this->assertTrue( delete_plugins( array( $plugins[1] ) ) );

		// Check that the events are still scheduled.
		$post_events = wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK );
		$this->assertCount( 2, $post_events );

		$pre_events  = array_values( $pre_events );
		$post_events = array_values( $post_events );
		$map_event   = function ( $event ) {
			$new_event            = new \stdClass();
			$new_event->timestamp = $event->timestamp;
			$new_event->schedule  = $event->schedule;
			$new_event->interval  = $event->interval;

			return $new_event;
		};

		$this->assertCount( 2, $pre_events );
		$this->assertCount( 2, $post_events );
		$this->assertEquals( array_map( $map_event, $pre_events ), array_map( $map_event, $post_events ) );
	}

	/**
	 * Test deleting a plugin in multiple events delete a single event but not the others.
	 *
	 * @covers ::deleted_plugin
	 */
	public function test_delete_plugin_in_multiple_single_and_list_events() {
		$plugins = $this->create_plugins_for_deletion( 3 );

		$request = new \WP_REST_Request( 'POST', '/wpcom/v2/update-schedules' );
		$request->set_body_params(
			array(
				'plugins'  => array( $plugins[2] ),
				'schedule' => array(
					'timestamp'          => strtotime( 'next Monday 8:00' ),
					'interval'           => 'weekly',
					'health_check_paths' => array(),
				),
			)
		);

		$result = rest_do_request( $request );
		$this->assertSame( 200, $result->get_status() );

		$request->set_body_params(
			array(
				'plugins'  => array( $plugins[0], $plugins[1], $plugins[2] ),
				'schedule' => array(
					'timestamp'          => strtotime( 'next Monday 9:00' ),
					'interval'           => 'weekly',
					'health_check_paths' => array(),
				),
			)
		);

		$result = rest_do_request( $request );
		$this->assertSame( 200, $result->get_status() );

		// Check that the events are scheduled.
		$pre_events = wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK );
		$this->assertCount( 2, $pre_events );

		// Delete third plugin, that appears in both events.
		$this->assertTrue( delete_plugins( array( $plugins[2] ) ) );

		// Check that the events are still scheduled.
		$post_events = wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK );
		$this->assertCount( 1, $post_events );

		$pre_events  = array_values( $pre_events );
		$post_events = array_values( $post_events );
		$this->assertSame( $pre_events[1]->timestamp, $post_events[0]->timestamp );
		$this->assertSame( $pre_events[1]->schedule, $post_events[0]->schedule );
		$this->assertSame( $pre_events[1]->interval, $post_events[0]->interval );
		$this->assertSame( array( $plugins[0], $plugins[1] ), $post_events[0]->args );
	}

	/**
	 * Test multiple deleting plugins.
	 *
	 * @covers ::deleted_plugin
	 */
	public function test_multiple_deleted_plugins() {
		$plugins = $this->create_plugins_for_deletion( 2 );

		for ( $i = 0; $i < 2; ++$i ) {
			$hour    = $i + 8;
			$request = new \WP_REST_Request( 'POST', '/wpcom/v2/update-schedules' );
			$request->set_body_params(
				array(
					'plugins'  => array( $plugins[ $i ] ),
					'schedule' => array(
						'timestamp'          => strtotime( "next Monday {$hour}:00" ),
						'interval'           => 'weekly',
						'health_check_paths' => array(),
					),
				)
			);

			$result = rest_do_request( $request );
			$this->assertSame( 200, $result->get_status() );
		}

		// Check that the events are scheduled.
		$this->assertCount( 2, wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK ) );

		for ( $i = 0; $i < 2; ++$i ) {
			// Delete first plugin, that appears in both events.
			$this->assertTrue( delete_plugins( array( $plugins[ $i ] ) ) );
		}

		// Check no more events are scheduled.
		$this->assertCount( 0, wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK ) );
	}

	/**
	 * Test multiple deleting plugins in parallel.
	 *
	 * @covers ::deleted_plugin
	 */
	public function test_multiple_deleted_plugins_in_parallel() {
		$plugins = $this->create_plugins_for_deletion( 2 );

		for ( $i = 0; $i < 2; ++$i ) {
			$hour    = $i + 8;
			$request = new \WP_REST_Request( 'POST', '/wpcom/v2/update-schedules' );
			$request->set_body_params(
				array(
					'plugins'  => array( $plugins[ $i ] ),
					'schedule' => array(
						'timestamp'          => strtotime( "next Monday {$hour}:00" ),
						'interval'           => 'weekly',
						'health_check_paths' => array(),
					),
				)
			);

			$result = rest_do_request( $request );
			$this->assertSame( 200, $result->get_status() );
		}

		// Check that the events are scheduled.
		$this->assertCount( 2, wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK ) );

		// Delete all plugins in parallel.
		$this->assertTrue( delete_plugins( $plugins ) );

		// Check no more events are scheduled.
		$this->assertCount( 0, wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK ) );
	}

	/**
	 * Test unschedule error do not interrupt the deletion hook.
	 *
	 * @covers ::deleted_plugin
	 */
	public function test_unschedule_error_do_not_interrupt_deletion_hook() {
		$plugins = $this->create_plugins_for_deletion( 2 );

		for ( $i = 0; $i < 2; ++$i ) {
			$hour    = $i + 8;
			$request = new \WP_REST_Request( 'POST', '/wpcom/v2/update-schedules' );
			$request->set_body_params(
				array(
					'plugins'  => array( $plugins[ $i ] ),
					'schedule' => array(
						'timestamp'          => strtotime( "next Monday {$hour}:00" ),
						'interval'           => 'weekly',
						'health_check_paths' => array(),
					),
				)
			);

			$result = rest_do_request( $request );
			$this->assertSame( 200, $result->get_status() );
		}

		$unschedule_error = function ( $pre, $timestamp ) {
			// Simulate the first event unschedule error.
			return strtotime( 'next Monday 8:00' ) === $timestamp ? new \WP_Error() : $pre;
		};

		add_filter( 'pre_unschedule_event', $unschedule_error, 10, 2 );

		// Check that the events are scheduled.
		$this->assertCount( 2, wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK ) );

		// Delete first plugin.
		$this->assertTrue( delete_plugins( array( $plugins[0] ) ) );

		// Check that both events are still scheduled.
		$this->assertCount( 2, wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK ) );

		remove_filter( 'pre_unschedule_event', $unschedule_error, 10 );
	}

	/**
	 * Test deleting a plugin in multiple events generate new events that inherit the previous statuses.
	 *
	 * @covers ::deleted_plugin
	 */
	public function test_delete_plugin_new_events_inherit_statuses() {
		$plugins = $this->create_plugins_for_deletion( 3 );

		// Create two events at 08:00 and 09:00 with plugins 0 and 1, and 1 and 2.
		for ( $i = 0; $i < 2; ++$i ) {
			$hour              = $i + 8;
			$request           = new \WP_REST_Request( 'POST', '/wpcom/v2/update-schedules' );
			$scheduled_plugins = array( $plugins[ $i ], $plugins[ $i + 1 ] );
			$request->set_body_params(
				array(
					'plugins'  => $scheduled_plugins,
					'schedule' => array(
						'timestamp'          => strtotime( "next Monday {$hour}:00" ),
						'interval'           => 'weekly',
						'health_check_paths' => array(),
					),
				)
			);

			$result = rest_do_request( $request );
			$this->assertSame( 200, $result->get_status() );

			// Log a start and success.
			Scheduled_Updates_Logs::log(
				$result->get_data(),
				Scheduled_Updates_Logs::PLUGIN_UPDATES_START,
				'no_plugins_to_update'
			);
			Scheduled_Updates_Logs::log(
				$result->get_data(),
				Scheduled_Updates_Logs::PLUGIN_UPDATES_SUCCESS,
				'no_plugins_to_update'
			);
		}

		$request = new \WP_REST_Request( 'GET', '/wpcom/v2/update-schedules' );
		$result  = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$pre_events = array_values( $result->get_data() );

		// Delete second plugin, that appears in both events.
		$this->assertTrue( delete_plugins( array( $plugins[1] ) ) );

		$request = new \WP_REST_Request( 'GET', '/wpcom/v2/update-schedules' );
		$result  = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$post_events = array_values( $result->get_data() );

		// Check previous last run statuses are inherited.
		for ( $i = 0; $i < 2; ++$i ) {
			$this->assertSame( $pre_events[ $i ]['last_run_timestamp'], $post_events[ $i ]['last_run_timestamp'] );
			$this->assertSame( $pre_events[ $i ]['last_run_status'], $post_events[ $i ]['last_run_status'] );
		}
	}

	/**
	 * Test clear CRON cache.
	 *
	 * @covers ::clear_cron_cache
	 */
	public function test_clear_cron_cache() {
		$plugins = $this->create_plugins_for_deletion( 3 );
		$request = new \WP_REST_Request( 'POST', '/wpcom/v2/update-schedules' );
		$params  = array(
			'plugins'  => array( $plugins[0] ),
			'schedule' => array(
				'timestamp'          => strtotime( 'next Monday 8:00' ),
				'interval'           => 'weekly',
				'health_check_paths' => array(),
			),
		);

		wp_set_current_user( $this->admin_id );

		$request->set_body_params( $params );

		// Create first event.
		$result = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );

		$id_1 = $result->get_data();
		$this->assertIsString( $id_1 );

		$events = wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK );
		$this->assertCount( 1, $events );

		$params['plugins']               = array( $plugins[1], $plugins[2] );
		$params['schedule']['timestamp'] = strtotime( 'next Monday 9:00' );
		$request->set_body_params( $params );

		// Create second event.
		$result = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );

		$id_2 = $result->get_data();
		$this->assertIsString( $id_2 );

		// Get scheduled events.
		$events = wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK );
		$this->assertCount( 2, $events );

		$request = new \WP_REST_Request( 'GET', '/wpcom/v2/update-schedules' );
		$result  = rest_do_request( $request );
		$data    = $result->get_data();

		$this->assertSame( 200, $result->get_status() );
		$this->assertArrayHasKey( $id_1, $data );
		$this->assertArrayHasKey( $id_2, $data );

		$request = new \WP_REST_Request( 'DELETE', '/wpcom/v2/update-schedules/' . $id_1 );
		$result  = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertTrue( $result->get_data() );

		// Get scheduled events.
		$events = wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK );
		$this->assertCount( 1, $events );

		$request = new \WP_REST_Request( 'GET', '/wpcom/v2/update-schedules' );
		$result  = rest_do_request( $request );
		$data    = $result->get_data();

		$this->assertSame( 200, $result->get_status() );
		$this->assertArrayNotHasKey( $id_1, $data );
		$this->assertArrayHasKey( $id_2, $data );
	}

	/**
	 * Create a list of plugins to be deleted.
	 *
	 * @param int $count The number of plugins to create.
	 * @return array The list of plugins to be deleted.
	 */
	private function create_plugins_for_deletion( $count ) {
		$plugins = array();

		for ( $i = 0; $i < $count; ++$i ) {
			$plugin_name = 'deleted-plugin-' . $i;
			$plugin_file = "$plugin_name/$plugin_name.php";
			$plugins[]   = $plugin_file;

			$this->wp_filesystem->mkdir( WP_PLUGIN_DIR . '/' . $plugin_name );
			$this->populate_file_with_plugin_header( WP_PLUGIN_DIR . '/' . $plugin_file, $plugin_name );
		}

		return $plugins;
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
	 * Test when all requested plugins are not installed.
	 *
	 * @covers ::verify_plugins
	 */
	public function test_verify_plugins_not_installed() {
		$plugins = array( 'not-installed-plugin-1/not-installed-plugin-1.php', 'not-installed-plugin-2/not-installed-plugin-2.php' );

		$request = new \WP_REST_Request( 'POST', '/wpcom/v2/update-schedules' );
		$request->set_body_params(
			array(
				'plugins'            => $plugins,
				'schedule'           => array(
					'timestamp' => strtotime( 'next Monday 8:00' ),
					'interval'  => 'weekly',
				),
				'health_check_paths' => array(),
			)
		);

		wp_set_current_user( $this->admin_id );
		$result = rest_do_request( $request );

		$this->assertSame( 400, $result->get_status() );
		$this->assertSame( 'rest_invalid_param', $result->get_data()['code'] );
	}

	/**
	 * Test when all requested plugins are managed.
	 *
	 * @covers ::verify_plugins
	 */
	public function test_verify_plugins_all_managed() {
		$plugins = array( 'managed-plugin-1/managed-plugin-1.php', 'managed-plugin-2/managed-plugin-2.php' );

		$request = new \WP_REST_Request( 'POST', '/wpcom/v2/update-schedules' );
		$request->set_body_params(
			array(
				'plugins'            => $plugins,
				'schedule'           => array(
					'timestamp' => strtotime( 'next Monday 8:00' ),
					'interval'  => 'weekly',
				),
				'health_check_paths' => array(),
			)
		);

		wp_set_current_user( $this->admin_id );
		$result = rest_do_request( $request );

		$this->assertSame( 400, $result->get_status() );
		$this->assertSame( 'rest_invalid_param', $result->get_data()['code'] );
	}

	/**
	 * Test when one requested plugin is installed and not managed, and another is installed but managed.
	 *
	 * @covers ::verify_plugins
	 */
	public function test_verify_plugins_installed_mixed() {
		$plugins = array( 'managed-plugin/managed-plugin.php', 'installed-plugin/installed-plugin.php' );
		symlink( WP_PLUGIN_DIR . '/wordpress/managed-plugin', WP_PLUGIN_DIR . '/managed-plugin' );

		// Tweak realpath so that it returns `/wordpress/...` for the managed plugin.
		$realpath = $this->getFunctionMock( __NAMESPACE__, 'realpath' );
		$realpath->expects( $this->once() )->willReturnCallback(
			function ( $path ) {
				return str_replace( WP_PLUGIN_DIR, '/wordpress/plugins', $path );
			}
		);

		$request = new \WP_REST_Request( 'POST', '/wpcom/v2/update-schedules' );
		$request->set_body_params(
			array(
				'plugins'            => $plugins,
				'schedule'           => array(
					'timestamp' => strtotime( 'next Monday 8:00' ),
					'interval'  => 'weekly',
				),
				'health_check_paths' => array(),
			)
		);

		wp_set_current_user( $this->admin_id );
		$result = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
	}
}
