<?php

require_once dirname( __FILE__ ) . '/../../class.jetpack-constants-sync.php';

// phpunit --testsuite sync
class WP_Test_Jetpack_Constants_Sync extends WP_UnitTestCase {


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
		$values       = Jetpack_Constants_Sync::sync_all();
		$query_string = Jetpack_Constants_Sync::get_query_string( $values );
		$this->assertContains( 'EMPTY_TRASH_DAYS=' . $empty_trash_days, $query_string );
	}


	public function test_sync_post_revisions_constant() {
		if ( defined( 'WP_POST_REVISIONS' ) ) {
			$post_revisions = WP_POST_REVISIONS;
		} else {
			$post_revisions = rand( 0, 1000 );
			define( 'WP_POST_REVISIONS', $post_revisions );
		}

		$values = Jetpack_Constants_Sync::sync();

		$query_string = Jetpack_Constants_Sync::get_query_string( $values );
		$this->assertContains( 'WP_POST_REVISIONS=' . $post_revisions, $query_string );

		$dont_sync = Jetpack_Constants_Sync::sync();
		$this->assertNull( $dont_sync );
	}

}