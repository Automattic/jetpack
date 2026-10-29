<?php

namespace Automattic\Jetpack\Sync;

use PHPUnit\Framework\TestCase;

/**
 * Unit tests for the Debug_Data class.
 *
 * @package automattic/jetpack-sync
 */
class Debug_Data_Test extends TestCase {

	/**
	 * Clean up after each test.
	 */
	public function tearDown(): void {
		parent::tearDown();

		remove_all_filters( 'jetpack_connection_debug_data' );
	}

	/**
	 * Tests that configuring Sync adds the queue status to the Connection package's Site Health section.
	 */
	public function test_configure_adds_queue_fields() {
		Main::configure();

		$fields = apply_filters( 'jetpack_connection_debug_data', array() );

		$this->assertSame( 0, $fields['sync_size']['value'] );
		$this->assertSame( '0 seconds', $fields['sync_lag']['value'] );
		$this->assertArrayHasKey( 'full_sync_lag', $fields );
	}
}
