<?php
/**
 * The Mocker Runner that creates mock firewall blocked requests.
 *
 * @package automattic/jetpack-debug-helper
 */

namespace Automattic\Jetpack\Debug_Helper\Mocker;

require_once __DIR__ . '/interface-runner.php';
require_once __DIR__ . '/class-tools.php';

/**
 * Creating the mock options.
 */
class Waf_Runner implements Runner_Interface {

	/**
	 * Generate the random options.
	 *
	 * @param int $number Number of options to generate.
	 *
	 * @return bool
	 */
	public function run( $number ) {
		for ( $i = $number, $per_batch = 500; $i > 0; $i -= $per_batch ) {
			$this->run_batch( min( $per_batch, $i ) );
		}

		return true;
	}

	/**
	 * Add a batch of mock options.
	 *
	 * @param int $limit How many options to add.
	 *
	 * @return bool
	 */
	private function run_batch( $limit ) {
		global $wpdb;

		$sql = "INSERT INTO {$wpdb->prefix}jetpack_waf_blocklog (`reason`, `rule_id`, `timestamp`) VALUES "
			. implode( ', ', array_fill( 0, $limit, '( "mock blocked request - jetpack debug helper", %s, %s )' ) );

		$values_to_insert = array();
		for ( $i = 0; $i < $limit; ++$i ) {
			$values_to_insert[] = wp_rand( 99101000, 99199999 );
			$values_to_insert[] = $this->get_random_datestamp();
		}

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery
		$wpdb->query( $wpdb->prepare( $sql, $values_to_insert ) );

		return true;
	}

	/**
	 * Generate a random datetime string within the previous 30 days.
	 *
	 * @return string
	 */
	private function get_random_datestamp() {
		$now = time();
		return gmdate( 'Y-m-d H:i:s', wp_rand( $now - 2592000, $now ) );
	}
}
