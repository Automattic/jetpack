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
	 */
	public function tearDown() {
		parent::tearDown();

		Nonce_Handler::invalidate_request_nonces();

		remove_action( 'shutdown', array( Nonce_Handler::class, 'clean_runtime' ) );
	}

	/**
	 * Testing the nonce adding functionality.
	 */
	public function test_add() {
		// Confirm that the nonce gets added.
		self::assertTrue( Nonce_Handler::add( static::TIMESTAMP, static::NONCE ) );

		// Confirm that the nonce is loaded from cache and still valid during the request.
		self::assertTrue( Nonce_Handler::add( static::TIMESTAMP, static::NONCE ) );
	}

	/**
	 * Testing the shutdown cleanup hook.
	 */
	public function test_shutdown_cleanup() {
		global $wp_filter;

		// Using a custom function to avoid collisions with existing callbacks.
		$return_false = function() {
			return false;
		};

		add_filter( 'jetpack_connection_add_nonce_cleanup', $return_false );
		Nonce_Handler::add( static::TIMESTAMP, static::NONCE );
		$is_callback_missing = empty( $wp_filter['shutdown']->callbacks[10][ Nonce_Handler::class . '::clean_runtime' ] );
		remove_filter( 'jetpack_connection_add_nonce_cleanup', $return_false );
		Nonce_Handler::invalidate_request_nonces();

		Nonce_Handler::add( static::TIMESTAMP, static::NONCE );
		$is_callback_placed = ! empty( $wp_filter['shutdown']->callbacks[10][ Nonce_Handler::class . '::clean_runtime' ] );

		self::assertTrue( $is_callback_missing, 'Cleanup callback is in place, it should not exist' );
		self::assertTrue( $is_callback_placed, 'Cleanup callback is missing, it should have been added' );
	}

	/**
	 * Trying to add an existing nonce, and making sure it's considered invalid (returns false).
	 */
	public function test_add_existing() {
		$query_filter_run = false;

		$nonce_object = array(
			'option_id'    => '12345',
			'option_name'  => 'jetpack_nonce_' . static::TIMESTAMP . '_' . static::NONCE,
			'option_value' => static::TIMESTAMP,
			'autoload'     => 'no',
		);

		$query_filter = function( $result, $query ) use ( &$query_filter_run, $nonce_object ) {
			if ( ! $query_filter_run && false !== strpos( $query, 'jetpack_nonce_' ) ) {
				$query_filter_run = true;
				$this->assertEquals( "SELECT * FROM `options` WHERE option_name = '{$nonce_object['option_name']}'", $query );

				return array( $nonce_object );
			}

			return $result;
		};

		add_filter( 'wordbless_wpdb_query_results', $query_filter, 10, 2 );

		$result = Nonce_Handler::add( static::TIMESTAMP, static::NONCE );

		remove_filter( 'wordbless_wpdb_query_results', $query_filter );

		self::assertFalse( $result );
		self::assertTrue( $query_filter_run, "The SQL query assertions haven't run." );
	}

	/**
	 * Testing the nonce cleanup functionality.
	 */
	public function test_clean() {
		$query_filter_run = false;

		$query_filter = function( $result, $query ) use ( &$query_filter_run ) {
			if ( ! $query_filter_run && false !== strpos( $query, 'jetpack\_nonce' ) ) {
				global $wpdb;

				$query_filter_run = true;
				self::assertStringStartsWith( "DELETE FROM `{$wpdb->options}` WHERE `option_name` LIKE 'jetpack\_nonce\_", $query );
			}

			return $result;
		};

		add_filter( 'wordbless_wpdb_query_results', $query_filter, 10, 2 );

		Nonce_Handler::clean();

		remove_filter( 'wordbless_wpdb_query_results', $query_filter );

		self::assertTrue( $query_filter_run, "The SQL query assertions haven't run." );
	}

	/**
	 * Testing the runtime nonce cleanup functionality.
	 */
	public function test_clean_runtime() {
		$nonce_ids = array( 1111, 2222 );

		$query_filter_select_run = false;
		$query_filter_delete_run = false;

		$query_filter_select = function( $result, $query ) use ( &$query_filter_select_run, $nonce_ids ) {
			if ( ! $query_filter_select_run && 0 === strpos( $query, 'SELECT ' ) && false !== strpos( $query, 'jetpack_nonce_' ) ) {
				global $wpdb;

				$query_filter_select_run = true;
				self::assertStringStartsWith( "SELECT option_id FROM `{$wpdb->options}` WHERE `option_name` >= 'jetpack_nonce_' AND `option_name` < ", $query );

				return array( (object) array( 'option_id' => $nonce_ids[0] ), (object) array( 'option_id' => $nonce_ids[1] ) );
			}

			return $result;
		};

		$query_filter_delete = function( $result, $query ) use ( &$query_filter_delete_run, $nonce_ids ) {
			if ( ! $query_filter_delete_run && 0 === strpos( $query, 'DELETE ' ) && false !== strpos( $query, 'option_id' ) ) {
				global $wpdb;

				$query_filter_delete_run = true;
				self::assertEquals( "DELETE FROM `{$wpdb->options}` WHERE `option_id` IN ( " . implode( ', ', $nonce_ids ) . ' )', $query );
			}

			return $result;
		};

		add_filter( 'wordbless_wpdb_query_results', $query_filter_select, 10, 2 );
		add_filter( 'wordbless_wpdb_query_results', $query_filter_delete, 10, 2 );

		Nonce_Handler::clean_runtime();

		remove_filter( 'wordbless_wpdb_query_results', $query_filter_select );
		remove_filter( 'wordbless_wpdb_query_results', $query_filter_delete );

		self::assertTrue( $query_filter_select_run, "The SQL query assertions haven't run." );
		self::assertTrue( $query_filter_delete_run, "The SQL query assertions haven't run." );
	}

}
