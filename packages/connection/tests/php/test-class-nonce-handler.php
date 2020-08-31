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
	 * Reset the environment after each test.
	 */
	public function tearDown() {
		parent::tearDown();

		Nonce_Handler::invalidate_request_nonces();
	}

	/**
	 * Testing the nonce adding functionality.
	 */
	public function test_add() {
		$time  = '1598639691';
		$nonce = 'rAnDoM';

		// Confirm that the nonce gets added.
		self::assertTrue( Nonce_Handler::add( $time, $nonce ) );

		// Confirm that the nonce is loaded from cache and still valid during the request.
		self::assertTrue( Nonce_Handler::add( $time, $nonce ) );
	}

	/**
	 * Trying to add an existing nonce, and making sure it's considered invalid (returns false).
	 */
	public function test_add_existing() {
		$query_filter_run = false;

		$time  = '1598639690';
		$nonce = 'rAnDoM2';

		$nonce_object = array(
			'option_id'    => '12345',
			'option_name'  => "jetpack_nonce_{$time}_{$nonce}",
			'option_value' => $time,
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

		$result = Nonce_Handler::add( $time, $nonce );

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

}
