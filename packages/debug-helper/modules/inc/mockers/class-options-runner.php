<?php
/**
 * The Mocker Runner that creates mock options.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Debug_Helper\Mocker;

require_once __DIR__ . '/interface-runner.php';
require_once __DIR__ . '/class-tools.php';

/**
 * Creating the mock options.
 */
class Options_Runner implements Runner_Interface {

	/**
	 * Generate the random options.
	 *
	 * @param int $number Number of options to generate.
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

		$sql = "INSERT INTO {$wpdb->options} (option_name, option_value, autoload) VALUES ";

		for ( $i = 0; $i < $limit; ++$i ) {
			$sql .= "('" . esc_sql( $this->get_random_name() ) . "', '" . esc_sql( $this->get_random_value() ) . "', 'no'), ";
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
		$wpdb->query( substr( $sql, 0, -2 ) );

		return true;
	}

	/**
	 * Generate a random option name.
	 *
	 * @return string
	 */
	private function get_random_name() {
		return 'mock_option_' . Tools::get_random_string() . '_' . microtime( true );
	}

	/**
	 * Generate a random option value.
	 *
	 * @return string
	 */
	private function get_random_value() {
		return 'mock_value_' . Tools::get_random_string();
	}

}
