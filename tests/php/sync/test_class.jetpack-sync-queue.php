<?php

$sync_dir = dirname( __FILE__ ) . '/../../../sync/';

require_once $sync_dir . 'class.jetpack-sync-queue.php';

class WP_Test_Jetpack_New_Sync_Queue extends WP_UnitTestCase {

	private $queue;

	public function setUp() {
		parent::setUp();

		$this->queue = new Jetpack_Sync_Queue( 'my_queue' );
	}

	function test_add_queue_items() {
		$this->assertEquals( 0, $this->queue->size() );

		$this->queue->add( 'foo' );

		$this->assertEquals( 1, $this->queue->size() );
		$this->assertEquals( array( 'foo' ), $this->queue->flush_all() );
		$this->assertEquals( 0, $this->queue->size() );
	}

	function test_checkout_queue_items() {
		$this->queue->add( 'foo' );

		$buffer = $this->queue->checkout();

		$this->assertEquals( array( 'foo' ), $buffer->get_items() );

		$second_buffer = $this->queue->checkout();

		$this->assertTrue( is_wp_error( $second_buffer ) );
		$this->assertEquals( 'unclosed_buffer', $second_buffer->get_error_code() );

		// checkin returns the buffer to the queue - you would call this if you 
		// had an error, e.g. an error POST-ing to WPCOM
		$this->queue->checkin( $buffer );

		$buffer = $this->queue->checkout();

		$this->assertEquals( array( 'foo' ), $buffer->get_items() );
	}

	function test_checkout_enforced_across_multiple_instances() {
		$this->queue->set_checkout_size( 2 );
		$other_queue = new Jetpack_Sync_Queue( $this->queue->id, 2 );

		$this->queue->add_all( array(1, 2, 3, 4, 5) );
		
		$buffer = $this->queue->checkout();

		$this->assertEquals( array(1, 2), $buffer->get_items() );

		$other_buffer = $other_queue->checkout();

		$this->assertTrue( is_wp_error( $other_buffer ) );
		$this->assertEquals( 'unclosed_buffer', $other_buffer->get_error_code() );
	}

	function test_checkin_non_checked_out_buffer_raises_error() {
		$buffer = new Jetpack_Sync_Queue_Buffer( array() );
		$response = $this->queue->checkin( $buffer );

		$this->assertEquals( 'buffer_not_checked_out', $response->get_error_code() );
	}

	function test_checkin_wrong_buffer_raises_error() {
		$buffer = new Jetpack_Sync_Queue_Buffer( array() );
		$other_buffer = $this->queue->checkout();

		$response = $this->queue->checkin( $buffer );

		$this->assertEquals( 'buffer_mismatch', $response->get_error_code() );
	}

	function test_checkout_fetches_queue_of_set_size() {
		$this->queue->set_checkout_size( 2 );

		$this->queue->add_all( array(1, 2, 3, 4, 5) );

		$this->assertEquals( 5, $this->queue->size() );

		$this->assertEquals( count( $this->queue->checkout()->get_items() ), 2 );
	}

	function test_close_buffer_removes_items() {
		$this->queue->set_checkout_size( 2 );
		$this->queue->add_all( array(1, 2, 3, 4, 5) );
		$buffer = $this->queue->checkout();

		$this->assertEquals( array(1, 2), $buffer->get_items() );

		$this->queue->close( $buffer );

		// $this->assertEquals( array(3, 4, 5), $this->queue->flush_all() );

		$buffer = $this->queue->checkout();
		$this->assertEquals( array(3, 4), $buffer->get_items() );
		$this->queue->close( $buffer );

		$buffer = $this->queue->checkout();
		$this->assertEquals( array(5), $buffer->get_items() );
		$this->queue->close( $buffer );
	}

	function test_queue_is_persisted() {
		$other_queue = new Jetpack_Sync_Queue( $this->queue->id );

		$this->queue->add( 'foo' );
		$this->assertEquals( array( 'foo' ), $other_queue->checkout()->get_items() );
	}

	// TODO:
	// timeouts on checked out buffer
}