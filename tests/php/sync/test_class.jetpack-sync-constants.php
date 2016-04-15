<?php

require_once dirname( __FILE__ ) . '/../../../sync/class.jetpack-sync-constants.php';


/**
 * Testing CRUD on Options
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

		if ( defined( 'TEST_FOO' ) ) {
			$test_foo_value = TEST_FOO;
		} else {
			$test_foo_value = 'bar';
			define( 'TEST_FOO', $test_foo_value );
		}
		$this->client->set_constant_whitelist( array( 'TEST_FOO' ) );
		$this->client->do_sync();

		$synced_option_value = $this->server_replica_storage->get_constant( 'TEST_FOO' );
		$this->assertEquals( $test_foo_value, $synced_option_value );
	}

	function test_maybe_sync_constant_is_synced() {
		if ( defined( 'TEST_BAR' ) ) {
			$test_bar_value = TEST_BAR;
		} else {
			$test_bar_value = rand( 0, 999 );
			define( 'TEST_BAR', $test_bar_value );
		}
		// build a codec
		$sync_queue = $this->getMockBuilder( 'Jetpack_Sync_Queue' )
		                   ->disableOriginalConstructor()
		                   ->setMethods( array( 'add' ) )
		                   ->getMock();

		// Set up the expectation for the update() method
		// to be called only once and with the string 'something'
		// as its parameter.
		$sync_queue->expects( $this->once() )
		           ->method( 'add' )
		           ->with( $this->equalTo(
			           array(
				           'jetpack_sync_current_constants',
				           array( array( 'TEST_BAR' => $test_bar_value ) )
			           )
		           ) );

		// set sync queue
		$this->client->set_sync_queue( $sync_queue );
		$this->client->set_constant_whitelist( array( 'TEST_BAR' ) );

		$this->client->do_sync();

		// Since no constants changed we expect no data to be synced
		$this->client->do_sync();

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