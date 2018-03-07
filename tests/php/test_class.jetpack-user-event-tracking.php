<?php

require dirname( __FILE__ ) . '/../../_inc/lib/class.jetpack-user-event-tracking.php';

class WP_Test_Jetpack_User_Event_Tracking extends WP_UnitTestCase {
	protected $user_id;

	public function setUp() {
		parent::setUp();

		// create a user
		$this->user_id = $this->factory->user->create();
	}

	public function test_default_value_is_disabled() {
		$this->assertFalse( Jetpack_User_Event_Tracking::is_disabled( $this->user_id ) );
		$this->assertTrue( Jetpack_User_Event_Tracking::is_enabled( $this->user_id ) );
	}

	public function test_enabeling_tracking() {
		Jetpack_User_Event_Tracking::enable( $this->user_id );
		$this->assertTrue( Jetpack_User_Event_Tracking::is_enabled( $this->user_id ) );
	}

	public function test_disabeling_tracking() {
		Jetpack_User_Event_Tracking::disable( $this->user_id );
		$this->assertFalse( Jetpack_User_Event_Tracking::is_enabled( $this->user_id ) );
	}

	public function test_filter_works_as_expected() {
		// by default opt out every user
		add_filter( 'jetpack_user_event_tracking_opt_out', '__return_true' );
		$user_id = $this->factory->user->create();
		$this->assertFalse( Jetpack_User_Event_Tracking::is_enabled( $user_id ) );
	}
}
