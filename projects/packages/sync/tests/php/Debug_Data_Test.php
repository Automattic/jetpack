<?php

namespace Automattic\Jetpack\Sync;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for the Debug_Data class.
 *
 * @package automattic/jetpack-sync
 * @covers \Automattic\Jetpack\Sync\Debug_Data
 */
#[CoversClass( Debug_Data::class )]
class Debug_Data_Test extends TestCase {

	/**
	 * Clean up after each test.
	 */
	public function tearDown(): void {
		parent::tearDown();

		Jetpack_Options::delete_option( array( 'id', 'blog_token' ) );
		( new Connection_Manager() )->reset_connection_status();
	}

	/**
	 * Tests that the queue status is reported when sync is allowed.
	 */
	public function test_add_fields_reports_queue_status() {
		Jetpack_Options::update_option( 'id', 12345 );
		Jetpack_Options::update_option( 'blog_token', 'blogkey.blogsecret' );

		$fields = Debug_Data::add_fields( array() );

		$this->assertSame( 'Yes', $fields['sync_allowed']['value'] );
		$this->assertSame( 0, $fields['sync_size']['value'] );
		$this->assertSame( '0 seconds', $fields['sync_lag']['value'] );
		$this->assertArrayHasKey( 'full_sync_lag', $fields );
	}

	/**
	 * Tests that only the sync allowed field is reported when sync is not allowed.
	 */
	public function test_add_fields_skips_queue_fields_when_sync_is_not_allowed() {
		$fields = Debug_Data::add_fields( array() );

		$this->assertSame(
			array(
				'sync_allowed' => array(
					'label'   => 'Sync Allowed',
					'value'   => 'No',
					'private' => false,
				),
			),
			$fields
		);
	}
}
