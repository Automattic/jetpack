<?php
/**
 * The Mocker Runner that creates mock options.
 *
 * @package automattic/jetpack-debug-helper
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

		$sql = "INSERT INTO {$wpdb->options} (option_name, option_value, autoload) VALUES "
			. implode( ', ', array_fill( 0, $limit, '( %s, %s, "no" )' ) );

		$values_to_insert = array();
		for ( $i = 0; $i < $limit; ++$i ) {
			$values_to_insert[] = $this->get_random_name();
			$values_to_insert[] = $this->get_random_value();
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
		$wpdb->query( $wpdb->prepare( $sql, $values_to_insert ) );

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
