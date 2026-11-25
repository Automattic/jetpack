<?php
/**
 * Tests for Lock.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Send\Lock
 */
#[CoversClass( Lock::class )]
class Lock_Test extends BaseTestCase {

	/**
	 * SQL the fake database saw.
	 *
	 * @var string[]
	 */
	private $queries = array();

	/**
	 * The lock row's value, or null when there's none.
	 *
	 * @var string|null
	 */
	private $held = null;

	/**
	 * Answer the options table like a database with a unique option name.
	 */
	public function set_up() {
		parent::set_up();
		add_filter( 'wordbless_wpdb_query_results', array( $this, 'answer' ), 10, 2 );
	}

	/**
	 * Remove the fake database.
	 */
	public function tear_down() {
		remove_filter( 'wordbless_wpdb_query_results', array( $this, 'answer' ), 10 );
		parent::tear_down();
	}

	/**
	 * The fake database: INSERT IGNORE adds a row only when there's none, UPDATE swaps only the value it names.
	 *
	 * @param array  $results Default results.
	 * @param string $query   SQL.
	 * @return array
	 */
	public function answer( $results, $query ) {
		global $wpdb;
		if ( false === strpos( $query, 'jetpack_send_lock_' ) ) {
			return $results;
		}
		$this->queries[]     = $query;
		$wpdb->rows_affected = 0;
		if ( 0 === strpos( $query, 'INSERT IGNORE' ) && null === $this->held ) {
			preg_match( "/VALUES \( '[^']+', '(\d+)'/", $query, $match );
			$this->held          = $match[1];
			$wpdb->rows_affected = 1;
		} elseif ( 0 === strpos( $query, 'UPDATE' ) && preg_match( "/SET option_value = '(\d+)'.*option_value = '(\d+)'/", $query, $match ) && $match[2] === $this->held ) {
			$this->held          = $match[1];
			$wpdb->rows_affected = 1;
		} elseif ( 0 === strpos( $query, 'SELECT option_value' ) ) {
			return null === $this->held ? array() : array( (object) array( 'option_value' => $this->held ) );
		} elseif ( 0 === strpos( $query, 'DELETE' ) ) {
			$this->held = null;
		}
		return $results;
	}

	public function test_only_the_first_of_two_requests_gets_the_lock() {
		$this->assertTrue( Lock::acquire( 'upgrade', 300 ) );
		$this->assertFalse( Lock::acquire( 'upgrade', 300 ) );
		$this->assertStringContainsString( "INSERT IGNORE INTO `wp_options` ( option_name, option_value, autoload ) VALUES ( 'jetpack_send_lock_upgrade'", $this->queries[0] );
		$this->assertStringContainsString( "'off' )", $this->queries[0] );
	}

	/**
	 * How old the held lock is, and whether a new request takes it over.
	 *
	 * @return array[]
	 */
	public static function provide_lock_ages() {
		return array(
			'left by a request that died' => array( 400, true ),
			'still held'                  => array( 100, false ),
		);
	}

	/**
	 * @dataProvider provide_lock_ages
	 *
	 * @param int  $age   Seconds since it was taken.
	 * @param bool $taken Whether it's taken over.
	 */
	#[DataProvider( 'provide_lock_ages' )]
	public function test_a_stale_lock_is_taken_over( $age, $taken ) {
		$this->held = (string) ( time() - $age );

		$this->assertSame( $taken, Lock::acquire( 'backfill', 300 ) );
	}

	public function test_release_lets_the_next_request_in() {
		Lock::acquire( 'resend_12', 60 );

		Lock::release( 'resend_12' );

		$this->assertTrue( Lock::acquire( 'resend_12', 60 ) );
		$this->assertStringContainsString( "WHERE `option_name` = 'jetpack_send_lock_resend_12'", $this->queries[1] );
	}
}
