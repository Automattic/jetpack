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

	function test_add_queue_item_is_not_set_to_autoload() {
		global $wpdb;
		$this->assertEquals( 0, $this->queue->size() );
		$this->queue->add( 'foo' );

		$queue =  $wpdb->get_row( "SELECT * FROM $wpdb->options WHERE option_name LIKE 'jpsq_my_queue%'" );

		$this->assertEquals( 'no', $queue->autoload );
	}

	function test_peek_items() {
		$this->queue->add( 'foo' );
		$this->queue->add( 'bar' );
		$this->queue->add( 'baz' );

		$this->assertEquals( array( 'foo' ), $this->queue->peek( 1 ) );
		$this->assertEquals( array( 'foo', 'bar' ), $this->queue->peek( 2 ) );
	}

	function test_items_exist() {
		$this->assertFalse( $this->queue->has_any_items() );

		$this->queue->add( 'foo' );

		$this->assertTrue( $this->queue->has_any_items() );
	}

	function test_queue_lag() {
		// lag is the difference in time between the age of the oldest item and the current time
		$this->queue->reset();
		$this->queue->add( 'foo' );
		sleep(3);
		$this->queue->add( 'bar' );
		sleep(3);
		$this->assertEquals( 6, intval( $this->queue->lag() ) );
	}

	function test_checkout_queue_items() {
		$this->queue->add( 'foo' );

		$buffer = $this->queue->checkout();

		$this->assertFalse( is_wp_error( $buffer ) );

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
		$this->queue->add_all( array( 1, 2, 3, 4 ) );
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

	function test_reset_removes_all_items() {
		$this->queue->add( 'foo' );
		$this->assertEquals( 1, $this->queue->size() );
		
		$this->queue->reset();

		$this->assertEquals( 0, $this->queue->size() );
	}

	function test_checkout_returns_false_if_checkout_zero_items() {
		$this->queue->set_checkout_size( 2 );
		$this->queue->add_all( array(1, 2, 3) );

		$buffer = $this->queue->checkout();
		$this->assertNotEquals( false, $buffer );
		$this->queue->close( $buffer );

		$buffer = $this->queue->checkout();
		$this->assertNotEquals( false, $buffer );
		$this->queue->close( $buffer );

		$buffer = $this->queue->checkout();
		$this->assertEquals( false, $buffer );
	}

	function test_queue_is_persisted() {
		$other_queue = new Jetpack_Sync_Queue( $this->queue->id );

		$this->queue->add( 'foo' );
		$this->assertEquals( array( 'foo' ), $other_queue->checkout()->get_items() );
	}

	function test_benchmark() {
		$iterations = 100;
		$buffer_size = 10;

		$this->queue->set_checkout_size( $buffer_size );

		$queue_add_time = (double) 0;
		$post_create_time = (double) 0;

		// add a whole bunch of posts
		for( $i = 0; $i < $iterations; $i+=1 ) {
			$start_create_post_time = microtime(true);
			
			$post_id = $this->factory->post->create();
			
			$start_add_queue_time = microtime(true);
			
			$this->queue->add( $post_id );
			
			$end_time = microtime(true);

			$post_create_time += $start_add_queue_time - $start_create_post_time;
			$queue_add_time += $end_time - $start_add_queue_time;
		}

		error_log("Post create time: ".($post_create_time/$iterations)." ($post_create_time seconds)");
		error_log("Queue add time: ".($queue_add_time/$iterations)." ($queue_add_time seconds)");

		// pop off 10 at a time
		$pop_buffer_time = (double) 0;
		$close_buffer_time = (double) 0;
		$num_iterations = 0;
		for( $i = 0; $i < $iterations/$buffer_size; $i+=1 ) {
			$start_pop_buffer_time = microtime(true);
			$buffer = $this->queue->checkout();
			$start_close_buffer_time = microtime(true);
			$this->queue->close( $buffer );
			$end_time = microtime(true);

			$pop_buffer_time += $start_close_buffer_time - $start_pop_buffer_time;
			$close_buffer_time += $end_time - $start_close_buffer_time;
			$num_iterations+=1;
		}

		error_log("Pop buffer time: ".($pop_buffer_time/$num_iterations)." ($pop_buffer_time seconds)");
		error_log("Close buffer time: ".($close_buffer_time/$num_iterations)." ($close_buffer_time seconds)");
	}

	/**
	 * Basically this test asserts that two processes can write to the queue at the same time
	 */
//	Todo: This test is failing on some platform combinations probably because of how phpunit deals with `fork`
//	function test_multiprocess() {
//		$child_pid = pcntl_fork();
//		$is_child = !$child_pid; // if $child_pid is a positive integer it means we're the parent
//		$my_pid = getmypid();
//
//		$iterations = 10;
//		$buffer_size = 10;
//		$this->queue->set_checkout_size( $buffer_size );
//
//		if ( $is_child ) {
//			// reconnect mysql
//			global $wpdb;
//			$wpdb->db_connect();
//		}
//
//		for( $i = 0; $i < $iterations; $i+=1 ) {
//			if ( $i % 10 === 0 )
//				error_log("pid $my_pid: iteration $i");
//			$post_id = $this->factory->post->create();
//			$this->queue->add( $post_id );
//		}
//
//		if ( $is_child ) {
//			if ( method_exists( $wpdb, 'close' ) ) {
//				$wpdb->close();
//			} else {
//				if ( $wpdb->use_mysqli ) {
//					mysqli_close( $wpdb->dbh );
//				} else {
//					mysql_close( $wpdb->dbh );
//				}
//			}
//			// http://stackoverflow.com/a/12590975
//			posix_kill( $my_pid, 9);
//		}
//
//		error_log("waiting for $child_pid");
//		$status = null;
//		pcntl_waitpid( $child_pid, $status );
//		error_log("child $child_pid has exited");
//
//		$this->assertEquals( 2 * $iterations, $this->queue->size() );
//	}

	// TODO:
	// timeouts on checked out buffer
}
