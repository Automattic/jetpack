<?php

use Automattic\Jetpack\Sync\Queue;
use Automattic\Jetpack\Sync\Utils;

class Jetpack_Sync_Queue_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	private $queue;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		$this->queue = new Queue( 'my_queue' );
	}

	public function test_peek_newest_items() {
		$this->queue->add( 'foo' );
		$this->queue->add( 'bar' );
		$this->queue->add( 'baz' );

		$this->assertEquals( array( 'baz' ), $this->queue->peek_newest( 1 ) );
		$this->assertEquals( array( 'baz', 'bar' ), $this->queue->peek_newest( 2 ) );
	}

	public function test_pop_items() {
		$this->queue->add( 'foo' );
		$this->queue->add( 'bar' );
		$this->queue->add( 'baz' );

		$popped = $this->queue->pop( 1 );

		$this->assertEquals( array( 'foo' ), Utils::get_item_values( $popped ) );
		$this->assertSame( 2, $this->queue->size() );
	}

	public function test_pop_newest_items() {
		$this->queue->add( 'foo' );
		$this->queue->add( 'bar' );
		$this->queue->add( 'baz' );

		$popped = $this->queue->pop_newest( 1 );

		$this->assertEquals( array( 'baz' ), Utils::get_item_values( $popped ) );
		$this->assertSame( 2, $this->queue->size() );
	}

	public function test_malformed_checkout_value_treated_as_expired() {
		global $wpdb;

		$this->queue->add( 'foo' );

		// Simulate a corrupted lock value (no colon separator).
		$wpdb->query(
			$wpdb->prepare(
				"INSERT INTO $wpdb->options ( option_name, option_value, autoload ) VALUES ( %s, %s, 'no' )
				ON DUPLICATE KEY UPDATE option_value = VALUES(option_value)",
				'jpsq_my_queue_checkout',
				'malformed_no_colon'
			)
		);

		// The queue should treat the malformed value as expired and not be locked.
		$this->assertFalse( $this->queue->is_locked() );

		// Checkout should succeed since the malformed lock is treated as expired.
		$buffer = $this->queue->checkout( 5 );
		$this->assertNotFalse( $buffer );
		$this->assertFalse( is_wp_error( $buffer ) );
		$this->assertEquals( array( 'foo' ), $buffer->get_item_values() );
	}
}
