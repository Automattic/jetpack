<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase, WordPress.Files.FileName.InvalidClassFileName -- Test helper.
/**
 * A fake database for WorDBless tests: records SQL, answers SELECTs, and behaves like real locks.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use WorDBless\InsertId;

/**
 * Answers queries that contain a given text with given rows.
 */
class Fake_Db {

	/**
	 * SQL seen, in order, with `%` restored.
	 *
	 * @var string[]
	 */
	public $queries = array();

	/**
	 * Rows (or a closure taking the SQL) by a text the query contains; the first match wins.
	 *
	 * @var array
	 */
	private $answers = array();

	/**
	 * Locks held, by option name.
	 *
	 * @var array<string, true>
	 */
	public $locks = array();

	/**
	 * Start answering.
	 */
	public function __construct() {
		add_filter( 'wordbless_wpdb_query_results', array( $this, 'answer' ), 10, 2 );
	}

	/**
	 * Stop answering.
	 */
	public function remove() {
		remove_filter( 'wordbless_wpdb_query_results', array( $this, 'answer' ), 10 );
	}

	/**
	 * Answer queries containing a text.
	 *
	 * @param string         $needle Text in the SQL.
	 * @param array|\Closure $rows   Rows, or a closure that takes the SQL and returns rows.
	 * @return $this
	 */
	public function on( $needle, $rows ) {
		$this->answers[ $needle ] = $rows;
		return $this;
	}

	/**
	 * The queries containing a text.
	 *
	 * @param string $needle Text.
	 * @return string[]
	 */
	public function matching( $needle ) {
		return array_values( array_filter( $this->queries, fn( $query ) => false !== strpos( $query, $needle ) ) );
	}

	/**
	 * The `wordbless_wpdb_query_results` callback.
	 *
	 * @param array  $results Default results.
	 * @param string $query   SQL.
	 * @return array
	 */
	public function answer( $results, $query ) {
		global $wpdb;
		$query           = $wpdb->remove_placeholder_escape( $query );
		$this->queries[] = $query;
		if ( preg_match( "/'(jetpack_send_lock_[a-z0-9_]+)'/", $query, $lock ) ) {
			if ( 0 === stripos( $query, 'INSERT IGNORE' ) ) {
				$wpdb->rows_affected     = isset( $this->locks[ $lock[1] ] ) ? 0 : 1;
				$this->locks[ $lock[1] ] = true;
			} elseif ( 0 === stripos( $query, 'DELETE' ) ) {
				unset( $this->locks[ $lock[1] ] );
			} elseif ( 0 === stripos( $query, 'SELECT option_value' ) && isset( $this->locks[ $lock[1] ] ) ) {
				return array( (object) array( 'option_value' => (string) time() ) );
			}
			return $results;
		}
		if ( 0 === stripos( $query, 'INSERT' ) ) {
			InsertId::bump_and_get();
		}
		foreach ( $this->answers as $needle => $rows ) {
			if ( false !== strpos( $query, $needle ) ) {
				$rows = $rows instanceof \Closure ? $rows( $query ) : $rows;
				return array_map( fn( $row ) => (object) $row, (array) $rows );
			}
		}
		return $results;
	}
}
