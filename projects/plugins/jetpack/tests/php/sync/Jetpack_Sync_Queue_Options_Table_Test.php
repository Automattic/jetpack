<?php

use Automattic\Jetpack\Sync\Queue;
use PHPUnit\Framework\Attributes\Group;

require_once __DIR__ . '/Jetpack_Sync_Queue_TestBase.php';

/**
 * @group jetpack-sync
 * @group jetpack-sync-queue
 * @group jetpack-sync-queue-options
 */
#[Group( 'jetpack-sync' )]
#[Group( 'jetpack-sync-queue' )]
#[Group( 'jetpack-sync-queue-options' )]
class Jetpack_Sync_Queue_Options_Table_Test extends Jetpack_Sync_Queue_TestBase {

	/**
	 * @var Queue
	 */
	public $queue;

	public function set_up() {
		parent::set_up();

		// Disable the dedicated table, so we can run with the options table
		\Automattic\Jetpack\Sync\Settings::update_settings(
			array(
				'custom_queue_table_enabled' => 0,
			)
		);

		$this->queue = new Queue( 'my_queue_options' );
		$this->queue->reset();
	}

	public function test_add_queue_item_is_not_set_to_autoload() {
		global $wpdb;
		$this->assertSame( 0, $this->queue->size() );
		$this->queue->add( 'foo' );

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$queue = $wpdb->get_row( "SELECT * FROM $wpdb->options WHERE option_name LIKE 'jpsq_my_queue%'" );

		$this->assertEquals( 'no', $queue->autoload );
	}
}
