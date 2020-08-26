<?php
/**
 * The Mocker Runner that creates mock nonces.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Debug_Helper\Mocker;

require_once __DIR__ . '/class-tools.php';

/**
 * Creating the mock nonces.
 */
class Nonces_Runner implements Runner_Interface {

	/**
	 * Generate random nonces.
	 *
	 * @param int $number Number of nonces to generate.
	 *
	 * @return bool
	 */
	public function run( $number ) {
		for ( $i = $number, $per_batch = 100; $i > 0; $i -= $per_batch ) {
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

		if ( ! $limit ) {
			return false;
		}

		$sql = "INSERT INTO {$wpdb->prefix}options (option_name, option_value, autoload) VALUES ";

		for ( $i = 0; $i < $limit; ++$i ) {
			list( $name, $value ) = $this->get_random_nonce();
			$sql                 .= "('" . esc_sql( $name ) . "', '" . esc_sql( $value ) . "', 'no'), ";
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
		$wpdb->query( substr( $sql, 0, -2 ) );

		return true;
	}

	/**
	 * Generate a random nonce
	 *
	 * @return array [ $option_key, $option_value ]
	 */
	private function get_random_nonce() {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.rand_rand
		$time = rand( 1000000000, time() );

		return array(
			'jetpack_nonce_' . $time . '_' . Tools::get_random_string( 10 ),
			$time,
		);
	}

}
