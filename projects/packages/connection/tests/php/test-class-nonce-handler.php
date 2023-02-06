<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

/**
 * The nonce handler tests.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use PHPUnit\Framework\TestCase;

/**
 * The nonce handler tests.
 */
class Test_Nonce_Handler extends TestCase {

	/**
	 * The nonce timestamp.
	 */
	const TIMESTAMP = '1598639691';

	/**
	 * The nonce.
	 */
	const NONCE = 'rAnDoM';

	/**
	 * Reset the environment after each test.
	 *
	 * @after
	 */
	protected function tear_down() {
		Nonce_Handler::invalidate_request_nonces();
	}

	/**
	 * Testing the nonce adding functionality.
	 */
	public function test_add() {
		// Confirm that the nonce gets added.
		self::assertTrue( ( new Nonce_Handler() )->add( static::TIMESTAMP, static::NONCE ) );

		// Confirm that the nonce is loaded from cache and still valid during the request.
		self::assertTrue( ( new Nonce_Handler() )->add( static::TIMESTAMP, static::NONCE ) );
	}

	/**
	 * Testing the cleanup hook scheduling.
	 */
	public function test_schedule() {
		global $wp_filter;

		$is_callback_missing = empty( $wp_filter['jetpack_clean_nonces']->callbacks[10][ Nonce_Handler::class . '::clean_scheduled' ] );
		$is_schedule_missing = ! wp_next_scheduled( 'jetpack_clean_nonces' );

		( new Nonce_Handler() )->init_schedule();
		$is_callback_placed = ! empty( $wp_filter['jetpack_clean_nonces']->callbacks[10][ Nonce_Handler::class . '::clean_scheduled' ] );
		$is_scheduled       = (bool) wp_next_scheduled( 'jetpack_clean_nonces' );

		self::assertTrue( $is_callback_missing, 'Cleanup callback is in place, it should not exist' );
		self::assertTrue( $is_schedule_missing, 'Schedule is in place, it should not exist' );

		self::assertTrue( $is_callback_placed, 'Cleanup callback is missing, it should have been added' );
		self::assertTrue( $is_scheduled, 'Schedule is missing, it should have been added' );
	}

	/**
	 * Trying to add an existing nonce, and making sure it's considered invalid (returns false).
	 */
	public function test_add_existing() {
		$query_filter_run = false;

		$query_filter = function ( $result, $query ) use ( &$query_filter_run ) {
			if ( ! $query_filter_run && false !== strpos( $query, 'jetpack_nonce_' ) ) {
				global $wpdb;

				$query_filter_run = true;
				$nonce_name       = 'jetpack_nonce_' . static::TIMESTAMP . '_' . static::NONCE;
				$this->assertEquals( "SELECT 1 FROM `{$wpdb->options}` WHERE option_name = '{$nonce_name}'", $query );

				return array( (object) array( 1 => '1' ) );
			}

			return $result;
		};

		add_filter( 'wordbless_wpdb_query_results', $query_filter, 10, 2 );

		$result = ( new Nonce_Handler() )->add( static::TIMESTAMP, static::NONCE );

		remove_filter( 'wordbless_wpdb_query_results', $query_filter );

		self::assertFalse( $result );
		self::assertTrue( $query_filter_run, "The SQL query assertions haven't run." );
	}

	/**
	 * Testing the runtime nonce cleanup functionality.
	 */
	public function test_delete() {
		$nonce_ids        = array( 1111, 2222 );
		$limit            = 42;
		$cutoff_timestamp = static::TIMESTAMP;

		$query_filter_select_run = false;
		$query_filter_delete_run = false;

		$query_filter_select = function ( $result, $query ) use ( &$query_filter_select_run, $nonce_ids, $limit, $cutoff_timestamp ) {
			if ( ! $query_filter_select_run && 0 === strpos( $query, 'SELECT ' ) && false !== strpos( $query, 'jetpack_nonce_' ) ) {
				global $wpdb;

				$query_filter_select_run = true;
				self::assertEquals( "SELECT option_id FROM `{$wpdb->options}` WHERE `option_name` >= 'jetpack_nonce_' AND `option_name` < 'jetpack_nonce_{$cutoff_timestamp}' LIMIT {$limit}", $query );

				return array(
					(object) array( 'option_id' => $nonce_ids[0] ),
					(object) array( 'option_id' => $nonce_ids[1] ),
				);
			}

			return $result;
		};

		$query_filter_delete = function ( $result, $query ) use ( &$query_filter_delete_run, $nonce_ids ) {
			if ( ! $query_filter_delete_run && 0 === strpos( $query, 'DELETE ' ) && false !== strpos( $query, 'option_id' ) ) {
				global $wpdb;

				$query_filter_delete_run = true;
				self::assertStringStartsWith( "DELETE FROM `{$wpdb->options}` WHERE `option_id` IN ( " . implode( ', ', $nonce_ids ) . " ) AND option_name LIKE 'jetpack_nonce_", $query );
			}

			return $result;
		};

		add_filter( 'wordbless_wpdb_query_results', $query_filter_select, 10, 2 );
		add_filter( 'wordbless_wpdb_query_results', $query_filter_delete, 10, 2 );

		( new Nonce_Handler() )->delete( $limit, $cutoff_timestamp );

		remove_filter( 'wordbless_wpdb_query_results', $query_filter_select );
		remove_filter( 'wordbless_wpdb_query_results', $query_filter_delete );

		self::assertTrue( $query_filter_select_run, "The SQL query assertions haven't run." );
		self::assertTrue( $query_filter_delete_run, "The SQL query assertions haven't run." );
	}

	/**
	 * Testing the shutdown cleanup hook.
	 */
	public function test_reschedule() {
		$handler = new Nonce_Handler();

		$handler->init_schedule();
		$scheduled_timestamp = wp_next_scheduled( 'jetpack_clean_nonces' );

		sleep( 1 );

		$handler->reschedule();
		$rescheduled_timestamp = wp_next_scheduled( 'jetpack_clean_nonces' );

		self::assertGreaterThan( $scheduled_timestamp, $rescheduled_timestamp );
	}
}
