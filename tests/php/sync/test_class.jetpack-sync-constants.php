<?php

require_once dirname( __FILE__ ) . '/../../../sync/class.jetpack-sync-constants.php';


/**
 * Testing CRUD on Constants
 */
class WP_Test_Jetpack_New_Constants extends WP_Test_Jetpack_New_Sync_Base {
	protected $post_id;

	public function setUp() {
		parent::setUp();
	}

	// TODO:
	// Add tests for Syncing data on shutdown
	// Add tests that prove that we know constants change
	function test_white_listed_constant_is_synced() {

		$this->client->set_constants_whitelist( array( 'TEST_FOO' ) );

		define( 'TEST_FOO', microtime(true) );
		define( 'TEST_BAR', microtime(true) );

		$this->client->do_sync();

		$synced_foo_value = $this->server_replica_storage->get_constant( 'TEST_FOO' );
		$synced_bar_value = $this->server_replica_storage->get_constant( 'TEST_BAR' );

		$this->assertEquals( TEST_FOO, $synced_foo_value );
		$this->assertNotEquals( TEST_BAR, $synced_bar_value );
	}
}

// phpunit --testsuite sync
class WP_Test_Jetpack_Sync_Constants extends WP_UnitTestCase {

	public function setUp() {
		parent::setUp();
	}

	public function tearDown() {
		parent::tearDown();
	}

	public function test_sync_update_option() {
		if ( defined( 'EMPTY_TRASH_DAYS' ) ) {
			$empty_trash_days = EMPTY_TRASH_DAYS;
		} else {
			$empty_trash_days = 30;
			define( 'EMPTY_TRASH_DAYS', $empty_trash_days );
		}
		$values = Jetpack_Sync_Constants::get_all();

		$query_string = build_query( $values );

		$this->assertContains( 'EMPTY_TRASH_DAYS=' . $empty_trash_days, $query_string );
	}

	public function test_sync_post_revisions_constant() {
		if ( defined( 'WP_POST_REVISIONS' ) ) {
			$post_revisions = WP_POST_REVISIONS;
		} else {
			$post_revisions = rand( 0, 1000 );
			define( 'WP_POST_REVISIONS', $post_revisions );
		}

		$values = Jetpack_Sync::sync_if_has_changed( Jetpack_Sync_Constants::$check_sum_id, Jetpack_Sync_Constants::get_all() );

		$query_string = build_query( $values );
		$this->assertContains( 'WP_POST_REVISIONS=' . $post_revisions, $query_string );

		$dont_sync = Jetpack_Sync::sync_if_has_changed( Jetpack_Sync_Constants::$check_sum_id, Jetpack_Sync_Constants::get_all() );
		$this->assertNull( $dont_sync );
	}

}