<?php
/**
 * Admin Notifications Lib Tests.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

/**
 * Tests for admin notification lib functions.
 */
class Admin_Notifications_Test extends \WorDBless\BaseTestCase {

	/**
	 * Tests that bell notification no-ops when notes_send_callback is unavailable.
	 */
	public function test_bell_notification_noop_without_notes_function() {
		// notes_send_callback does not exist in this test environment.
		// Should not throw — gracefully skips.
		wpcom_send_bell_notification( 1, 'test_type', array( 'key' => 'value' ), 'dedup-1' );
		$this->assertTrue( true );
	}
}
