<?php

use Automattic\Jetpack\Sync\Queue;
use Automattic\Jetpack\Sync\Queue\Queue_Storage_Table;
use Automattic\Jetpack\Sync\Settings;

require_once __DIR__ . '/class-test-jetpack-sync-queue-base-tests.php';

/**
 * @group jetpack-sync
 * @group jetpack-sync-queue
 * @group jetpack-sync-queue-custom-table
 */
class WP_Test_Jetpack_Sync_Queue_Dedicated_Table extends WP_Test_Jetpack_Sync_Queue_Base_Tests {

	/**
	 * @var Queue
	 */
	public $queue;

	public $test_queue_name = 'my_queue_dedicated_table';

	// Ignoring as Dev requirement is >= PHP7
	// phpcs:ignore PHPCompatibility.FunctionDeclarations.NewReturnTypeDeclarations.voidFound
	public function setUp(): void {
		parent::setUp();

		// Reset the setting to be always set to 1.
		Settings::update_settings(
			array(
				'custom_queue_table_enabled' => 0,
			)
		);

		Settings::update_settings(
			array(
				'custom_queue_table_enabled' => 1,
			)
		);

		$this->queue = new Queue( $this->test_queue_name );

		// Reset to initial state. Sometimes buffers were not properly closed.
		$this->queue->reset();
	}

	// Ignoring as Dev requirement is > PHP7
	// phpcs:ignore PHPCompatibility.FunctionDeclarations.NewReturnTypeDeclarations.voidFound
	public function tearDown(): void {
		parent::tearDown(); // TODO: Change the autogenerated stub

		// Disable the custom table setting
		Settings::update_settings(
			array(
				'custom_queue_table_enabled' => 0,
			)
		);
	}

	public function test_dedicated_table_disabled_should_instantiate_options_backend() {
		// The function will detect that the table is force-disabled.
		$this->assertTrue( Settings::is_custom_queue_table_enabled() );

		// Make sure the Queue will get instantiated and fall back to the options table.
		$temporary_queue = new Queue( 'some_test_id' );
		$this->assertInstanceOf( Queue\Queue_Storage_Table::class, $temporary_queue->queue_storage );

		unset( $temporary_queue );

		Settings::update_settings(
			array(
				'custom_queue_table_enabled' => 0,
			)
		);

		// Make sure the Queue will get instantiated and fall back to the options table.
		$temporary_queue = new Queue( 'some_test_id' );
		$this->assertInstanceOf( Queue\Queue_Storage_Options::class, $temporary_queue->queue_storage );
	}

	public function test_dedicated_table_create_table() {
		// set a transient to disable checking if the table should be used or not.
		set_transient( Queue::$dedicated_table_last_check_time_transient, time(), 10 );

		/**
		 * @var Queue_Storage_Table $queue_table
		 */
		$queue_table = $this->getMockBuilder( 'Automattic\\Jetpack\\Sync\\Queue\\Queue_Storage_Table' )
							->setMethods( array( 'is_dedicated_table_healthy' ) )
							->setConstructorArgs( array( 'my_queue' ) )
							->getMock();

		$queue_table->expects( $this->any() )
					->method( 'is_dedicated_table_healthy' )
					->willReturn( true );

		// Make sure the table is dropped first.
		if ( $queue_table->dedicated_table_exists() ) {
			$queue_table->drop_table();
		}

		$this->assertFalse( $queue_table->dedicated_table_exists() );

		$queue_table->create_table();

		$this->assertTrue( $queue_table->dedicated_table_exists() );

		delete_transient( Queue::$dedicated_table_last_check_time_transient );
	}

	public function test_dedicated_table_drop_table() {
		// set a transient to disable checking if the table should be used or not.
		set_transient( Queue::$dedicated_table_last_check_time_transient, time(), 10 );

		/**
		 * @var Queue_Storage_Table $queue_table
		 */
		$queue_table = $this->getMockBuilder( 'Automattic\\Jetpack\\Sync\\Queue\\Queue_Storage_Table' )
							->setMethods( array( 'is_dedicated_table_healthy' ) )
							->setConstructorArgs( array( 'my_queue' ) )
							->getMock();

		$queue_table->expects( $this->any() )
					->method( 'is_dedicated_table_healthy' )
					->willReturn( true );

		// Make sure the table is dropped first.
		if ( $queue_table->dedicated_table_exists() ) {
			$queue_table->drop_table();
		}

		$this->assertFalse( $queue_table->dedicated_table_exists() );

		$queue_table->create_table();

		$this->assertTrue( $queue_table->dedicated_table_exists() );

		$queue_table->drop_table();

		$this->assertFalse( $queue_table->dedicated_table_exists() );

		// Create it again, to make sure we can use it for other tests later and we're restoring the correct state.
		$queue_table->create_table();

		$this->assertTrue( $queue_table->dedicated_table_exists() );

		delete_transient( Queue::$dedicated_table_last_check_time_transient );
	}

	public function test_dedicated_table_is_healthy_table_not_exist() {
		// set a transient to disable checking if the table should be used or not.
		set_transient( Queue::$dedicated_table_last_check_time_transient, time(), 10 );

		/**
		 * @var Queue_Storage_Table $queue_table
		 */
		$queue_table = $this->getMockBuilder( 'Automattic\\Jetpack\\Sync\\Queue\\Queue_Storage_Table' )
							->setMethods( array( 'dedicated_table_exists' ) )
							->setConstructorArgs( array( 'my_queue' ) )
							->getMock();

		$queue_table->expects( $this->any() )
					->method( 'dedicated_table_exists' )
					->willReturn( false );

		$this->assertFalse( $queue_table->is_dedicated_table_healthy() );

		delete_transient( Queue::$dedicated_table_last_check_time_transient );
	}

	public function test_dedicated_table_is_healthy_table_exists_and_healthy() {
		$queue_table = new Queue_Storage_Table( 'my_queue' );

		// Make sure the table is dropped first.
		if ( $queue_table->dedicated_table_exists() ) {
			$queue_table->drop_table();
		}

		$this->assertFalse( $queue_table->dedicated_table_exists() );

		$queue_table->create_table();

		$this->assertTrue( $queue_table->is_dedicated_table_healthy() );
	}

	public function test_dedicated_table_maybe_initialize_dedicated_sync_table_transient_expired_or_not_set_table_exists_unhealthy() {
		// Delete the transient so we get into the update logic.
		delete_transient( Queue::$dedicated_table_last_check_time_transient );
		delete_option( Queue::$use_dedicated_table_option_name );

		/**
		 * @var Queue $queue_table
		 */
		$queue_table = $this->getMockBuilder( 'Automattic\\Jetpack\\Sync\\Queue' )
							->setMethods( array( 'should_use_dedicated_table', 'dedicated_table_enabled' ) )
							->setConstructorArgs( array( 'my_queue' ) )
							->disableOriginalConstructor() // Need to disable the constructor to test the method.
							->getMock();

		$queue_table->expects( $this->never() )
					->method( 'dedicated_table_enabled' );

		/**
		 * @var Queue_Storage_Table $queue_table_dedicated
		 */
		$queue_table_dedicated = $this->getMockBuilder( 'Automattic\\Jetpack\\Sync\\Queue\\Queue_Storage_Table' )
									->setMethods( array( 'dedicated_table_exists', 'create_table', 'is_dedicated_table_healthy' ) )
									->setConstructorArgs( array( 'my_queue' ) )
									->getMock();

		$queue_table_dedicated->expects( $this->once() )
							->method( 'dedicated_table_exists' )
							->willReturn( true );

		$queue_table_dedicated->expects( $this->never() )
							->method( 'create_table' );

		$queue_table_dedicated->expects( $this->once() )
							->method( 'is_dedicated_table_healthy' )
							->willReturn( false );

		// Inject the mock.
		$queue_table->dedicated_table_instance = $queue_table_dedicated;

		$result = $queue_table->maybe_initialize_dedicated_sync_table();

		// Check the side effects of the `enable_dedicated_table_usage`

		$this->assertFalse( $result );
		$this->assertEquals( get_option( Queue::$use_dedicated_table_option_name, null ), '0' );
		$this->assertGreaterThanOrEqual( get_transient( Queue::$dedicated_table_last_check_time_transient ), time() );
	}

	public function test_migration_to_dedicated_table() {
		parent::setUp();

		$test_queue_id = 'mytestqueue';

		// Set the option to `1` so we know that we'll be using a dedicated table.
		update_option( Queue::$use_dedicated_table_option_name, '0' );

		$test_queue                = new Queue( $test_queue_id );
		$test_queue->queue_storage = new Queue\Queue_Storage_Options( $test_queue_id );

		// Empty out the queue
		$test_queue->queue_storage->clear_queue();

		// Add more items, so we can also test the pagination.
		for ( $i = 0; $i < 300; $i++ ) {
			$test_queue->add( 'baz' . $i );
		}

		$items_in_table_before_migration = $test_queue->get_all();

		// Reset the table
		$table_storage = new Queue_Storage_Table( $test_queue_id );
		$table_storage->drop_table();
		$table_storage->create_table();

		Queue::migrate_from_options_table_to_custom_table();

		$this->assertEquals( 300, $table_storage->get_item_count() );

		$items_in_table = $table_storage->get_items_ids_with_size( 500 );

		$keys_before_migration = array_column( $items_in_table_before_migration, 'id' );
		$keys_after_migration  = array_column( $items_in_table, 'id' );

		$this->assertEquals( $keys_before_migration, $keys_after_migration );

		// check the options queue is empty
		$options_storage = new Queue\Queue_Storage_Options( $test_queue_id );
		$options_counts  = $options_storage->get_item_count();

		$this->assertEquals( $options_counts, 0 );
	}

	public function test_migration_to_options_table() {
		parent::setUp();

		$test_queue_id = 'mytestqueue';

		// Set the option to `1` so we know that we'll be using a dedicated table.
		update_option( Queue::$use_dedicated_table_option_name, '1' );

		$test_queue                = new Queue( $test_queue_id );
		$test_queue->queue_storage = new Queue\Queue_Storage_Table( $test_queue_id );

		// Empty out the queue
		$test_queue->queue_storage->clear_queue();

		// Add more items, so we can also test the pagination.
		for ( $i = 0; $i < 300; $i++ ) {
			$test_queue->add( 'foo' . $i );
		}

		$items_in_table_before_migration = $test_queue->get_all();

		// Reset the table
		$options_storage = new Queue\Queue_Storage_Options( $test_queue_id );
		$options_storage->clear_queue();

		Queue::migrate_from_custom_table_to_options_table();

		$this->assertEquals( 300, $options_storage->get_item_count() );

		$items_in_table = $options_storage->get_items_ids_with_size( 500 );

		$keys_before_migration = array_column( $items_in_table_before_migration, 'id' );
		$keys_after_migration  = array_column( $items_in_table, 'id' );

		$this->assertEquals( $keys_before_migration, $keys_after_migration );

		// check the options queue is empty
		$options_storage = new Queue\Queue_Storage_Table( $test_queue_id );
		$options_counts  = $options_storage->get_item_count();

		$this->assertEquals( 0, $options_counts );
	}
}
