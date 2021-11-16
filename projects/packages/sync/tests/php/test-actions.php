<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Sync;

use Automattic\Jetpack\Constants;
use WorDBless\BaseTestCase;

/**
 * Unit tests for the Actions class.
 *
 * @package automattic/jetpack-sync
 */
class Test_Actions extends BaseTestCase {

	/**
	 * Set up before each test.
	 *
	 * @before
	 */
	public function set_up() {
		// Don't try to get options directly from the database.
		Constants::set_constant( 'JETPACK_DISABLE_RAW_OPTIONS', true );
	}

	/**
	 * Tests the do_only_first_intitial_sync method when an initial sync has not been performed yet.
	 */
	public function test_do_only_first_intitial_sync_successful() {
		$this->assertNull( Actions::do_only_first_initial_sync() );
	}

	/**
	 * Tests the do_only_first_intitial_sync method when an initial sync has already been performed.
	 */
	public function test_do_only_first_intitial_sync_already_started() {
		$full_sync_option = array(
			'started'  => time(),
			'finished' => false,
			'progress' => array(),
			'config'   => array(),
		);
		update_option( Modules\Full_Sync_Immediately::STATUS_OPTION, $full_sync_option );

		$this->assertFalse( Actions::do_only_first_initial_sync() );
	}
}
