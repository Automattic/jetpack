<?php // phpcs:ignore WordPress.Files.Filename

use Automattic\Jetpack\Heartbeat;

/**
 * Test the sync stats module.
 */
class WP_Test_Jetpack_Sync_Module_Stats extends WP_Test_Jetpack_Sync_Base {

	const TEST_STAT_NAME = 'test_stat';

	const TEST_STAT_VALUE = 'test_stat_value';

	/**
	 * Tests that stats data is sent on heartbeat.
	 */
	public function test_sends_data_on_heartbeat() {
		$heartbeat = Heartbeat::init();

		// Add a test stat to the heartbeat stats array.
		add_filter( 'jetpack_heartbeat_stats_array', array( $this, 'add_test_stat' ) );

		add_filter( 'pre_http_request', array( $this, 'pre_http_request_success' ) );
		$heartbeat->cron_exec();
		remove_filter( 'pre_http_request', array( $this, 'pre_http_request_success' ) );

		$this->sender->do_sync();
		remove_filter( 'jetpack_heartbeat_stats_array', array( $this, 'add_test_stat' ) );

		$action = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_heartbeat_stats' );

		$this->assertEquals( self::TEST_STAT_VALUE, $action->args[0][ self::TEST_STAT_NAME ] );

	}

	/**
	 * Tests that expensive data is not sent on heartbeat.
	 *
	 * @return void
	 */
	public function test_dont_send_expensive_data_on_heartbeat() {
		$heartbeat = Heartbeat::init();

		// Add a test stat to the heartbeat stats array.
		add_filter( 'jetpack_heartbeat_stats_array', array( $this, 'add_test_stat' ) );

		add_filter( 'pre_http_request', array( $this, 'pre_http_request_success' ) );
		$heartbeat->cron_exec();
		remove_filter( 'pre_http_request', array( $this, 'pre_http_request_success' ) );

		$this->sender->do_sync();
		remove_filter( 'jetpack_heartbeat_stats_array', array( $this, 'add_test_stat' ) );

		$action = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_heartbeat_stats' );

		$this->delete_connection_options();

		$this->assertFalse( isset( $action->args[0]['users'] ) );
	}

	/**
	 * Test that stats data is sent on heartbeat on multisite.
	 *
	 * @return void
	 */
	public function test_sends_stats_data_on_heartbeat_on_multisite() {
		global $wpdb;

		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Run it in multi site mode' );
		}

		$user_id         = self::factory()->user->create();
		$mu_blog_user_id = self::factory()->user->create();

		// Create a different blog.
		$suppress      = $wpdb->suppress_errors();
		$other_blog_id = wpmu_create_blog( 'foo.com', '', 'My Blog', $user_id );
		$wpdb->suppress_errors( $suppress );

		// Create a user from within that blog (won't be synced).
		switch_to_blog( $other_blog_id );
		\Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		\Jetpack_Options::update_option( 'id', 1234 );

		add_user_to_blog( $other_blog_id, $mu_blog_user_id, 'administrator' );

		$heartbeat = Heartbeat::init();

		// Add a test stat to the heartbeat stats array.
		add_filter( 'jetpack_heartbeat_stats_array', array( $this, 'add_test_stat' ) );

		add_filter( 'pre_http_request', array( $this, 'pre_http_request_success' ) );
		$heartbeat->cron_exec();
		remove_filter( 'pre_http_request', array( $this, 'pre_http_request_success' ) );

		$this->sender->do_sync();
		add_filter( 'jetpack_heartbeat_stats_array', array( $this, 'add_test_stat' ) );

		$action = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_heartbeat_stats' );

		\Jetpack_Options::delete_option( 'blog_token', 'asdasd.123123' );
		\Jetpack_Options::delete_option( 'id', 1234 );
		restore_current_blog();

		$this->assertEquals( self::TEST_STAT_VALUE, $action->args[0][ self::TEST_STAT_NAME ] );
		$this->assertFalse( isset( $action->args[0]['users'] ) );
	}

	/**
	 * Sets the 'master_user', 'id' and 'blog_token' options so the site is considered connected.
	 */
	private function add_connection_options() {
		Jetpack_Options::update_option( 'id', 1234 );
		Jetpack_Options::update_option( 'master_user', 1 );
		Jetpack_Options::update_option( 'blog_token', 'asd.qwe.1' );
	}

	/**
	 * Deletes the 'master_user' and 'user_tokens" options.
	 */
	private function delete_connection_options() {
		Jetpack_Options::delete_option( 'master_user' );
		Jetpack_Options::delete_option( 'user_tokens' );
	}

	/**
	 * Adds a test stat to the stats array.
	 *
	 * @param array $stats The stats array.
	 */
	public function add_test_stat( $stats ) {
		return array_merge(
			$stats,
			array(
				self::TEST_STAT_NAME => self::TEST_STAT_VALUE,
			)
		);
	}
}
