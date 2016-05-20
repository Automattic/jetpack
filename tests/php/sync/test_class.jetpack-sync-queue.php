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

		$buffer = $this->queue->checkout( 5 );

		$this->assertFalse( is_wp_error( $buffer ) );

		$this->assertEquals( array( 'foo' ), $buffer->get_items() );

		$second_buffer = $this->queue->checkout( 5 );

		$this->assertTrue( is_wp_error( $second_buffer ) );
		$this->assertEquals( 'unclosed_buffer', $second_buffer->get_error_code() );

		// checkin returns the buffer to the queue - you would call this if you 
		// had an error, e.g. an error POST-ing to WPCOM
		$this->queue->checkin( $buffer );

		$buffer = $this->queue->checkout( 5 );

		$this->assertEquals( array( 'foo' ), $buffer->get_items() );
	}

	function test_checkout_with_memory_limit_works() {
		// test a function which checks out items up to a given total size
		// this could be a better way to tune dequeuing than # of queue items,
		// since sometimes posts can be really large

		$large_string = str_repeat( 'x', 500 ); // 500 bytes
		$large_string_memory = strlen(serialize($large_string)); // 509 bytes

		$this->queue->add_all( array( $large_string, $large_string, $large_string ) );

		$buffer = $this->queue->checkout_with_memory_limit( 2*$large_string_memory );

		$this->assertEquals( 2, count( $buffer->get_items() ) );
	}

	function test_checkout_with_memory_limit_wont_fetch_more_than_500_rows() {
		$long_array = array();
		for ( $i = 0; $i < 501; $i += 1 ) {
			$long_array[] = 'x'; // one byte
		}

		$this->queue->add_all( $long_array );

		$buffer = $this->queue->checkout_with_memory_limit( 500000 );

		$this->assertEquals( 500, count( $buffer->get_items() ) );	
	}

	function test_checkout_with_memory_limit_can_also_specify_rows() {
		$long_array = array();
		for ( $i = 0; $i < 101; $i += 1 ) {
			$long_array[] = 'x'; // one byte
		}

		$this->queue->add_all( $long_array );

		$buffer = $this->queue->checkout_with_memory_limit( 1000, 50 );

		$this->assertEquals( 50, count( $buffer->get_items() ) );		
	}

	function test_checkout_of_item_larger_than_memory_fetches_it_solo() {
		// basically, if we have an object in the DB that's larger than the memory limit,
		// we should only ever check it out by itself, since that's the smallest possible
		// memory/bandwidth footprint we can manage while still actually sending it.

		$large_string = str_repeat( 'x', 500 ); // 500 bytes

		$this->queue->add_all( array( 'a', 'b', $large_string ) );

		$buffer = $this->queue->checkout_with_memory_limit( 100 ); // way smaller

		$this->assertEquals( 2, count( $buffer->get_items() ) );

		// close that buffer, fetch the next one
		$this->queue->close( $buffer );

		$buffer = $this->queue->checkout_with_memory_limit( 10 ); // way smaller

		// shouldn't be false or null or anything else falsy
		$this->assertTrue( !!$buffer );

		$buffer_items = $buffer->get_items();

		$this->assertEquals( 1, count( $buffer_items ) );

		$this->assertEquals( $large_string, array_values( $buffer_items )[0] );
	}

	function test_checkout_enforced_across_multiple_instances() {
		$other_queue = new Jetpack_Sync_Queue( $this->queue->id, 2 );

		$this->queue->add_all( array(1, 2, 3, 4, 5) );
		
		$buffer = $this->queue->checkout( 2 );

		$this->assertEquals( array(1, 2), $buffer->get_items() );

		$other_buffer = $other_queue->checkout( 2 );

		$this->assertTrue( is_wp_error( $other_buffer ) );
		$this->assertEquals( 'unclosed_buffer', $other_buffer->get_error_code() );
	}

	function test_checkin_non_checked_out_buffer_raises_error() {
		$buffer = new Jetpack_Sync_Queue_Buffer( uniqid(), array() );
		$response = $this->queue->checkin( $buffer );

		$this->assertEquals( 'buffer_not_checked_out', $response->get_error_code() );
	}

	function test_checkin_wrong_buffer_raises_error() {
		$this->queue->add_all( array( 1, 2, 3, 4 ) );
		$buffer = new Jetpack_Sync_Queue_Buffer( uniqid(), array() );
		$other_buffer = $this->queue->checkout( 5 );

		$response = $this->queue->checkin( $buffer );

		$this->assertEquals( 'buffer_mismatch', $response->get_error_code() );
	}

	function test_checkout_fetches_queue_of_set_size() {

		$this->queue->add_all( array(1, 2, 3, 4, 5) );

		$this->assertEquals( 5, $this->queue->size() );

		$this->assertEquals( count( $this->queue->checkout( 2 )->get_items() ), 2 );
	}

	function test_close_buffer_removes_items() {
		$this->queue->add_all( array(1, 2, 3, 4, 5) );
		$buffer = $this->queue->checkout( 2 );

		$this->assertEquals( array(1, 2), $buffer->get_items() );

		$this->queue->close( $buffer );

		// $this->assertEquals( array(3, 4, 5), $this->queue->flush_all() );

		$buffer = $this->queue->checkout( 2 );
		$this->assertEquals( array(3, 4), $buffer->get_items() );
		$this->queue->close( $buffer );

		$buffer = $this->queue->checkout( 2 );
		$this->assertEquals( array(5), $buffer->get_items() );
		$this->queue->close( $buffer );
	}

	function test_close_buffer_can_remove_first_n_items() {
		$this->queue->add_all( array(1, 2, 3, 4, 5) );
		$buffer = $this->queue->checkout( 4 );

		$two_items = array_slice( $buffer->get_item_ids(), 0, 2 );
		$this->queue->close( $buffer, $two_items );

		$this->assertEquals( 3, $this->queue->size() ); // 5 - 2 = 3
	}

	function test_reset_removes_all_items() {
		$this->queue->add( 'foo' );
		$this->assertEquals( 1, $this->queue->size() );
		
		$this->queue->reset();

		$this->assertEquals( 0, $this->queue->size() );
	}

	function test_checkout_returns_false_if_checkout_zero_items() {
		$this->queue->add_all( array(1, 2, 3) );

		$buffer = $this->queue->checkout( 2 );
		$this->assertNotEquals( false, $buffer );
		$this->queue->close( $buffer );

		$buffer = $this->queue->checkout( 2 );
		$this->assertNotEquals( false, $buffer );
		$this->queue->close( $buffer );

		$buffer = $this->queue->checkout( 2 );
		$this->assertEquals( false, $buffer );
	}

	function test_queue_is_persisted() {
		$other_queue = new Jetpack_Sync_Queue( $this->queue->id );

		$this->queue->add( 'foo' );
		$this->assertEquals( array( 'foo' ), $other_queue->checkout( 5 )->get_items() );
	}

	function test_benchmark() {
		$iterations = 100;
		$buffer_size = 10;

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
			$buffer = $this->queue->checkout( $buffer_size );
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
}
