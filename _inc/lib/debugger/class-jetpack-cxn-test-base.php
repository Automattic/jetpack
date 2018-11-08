<?php
/**
 * Jetpack Connection Testing
 *
 * Framework for various "unit tests" against the Jetpack connection.
 *
 * Individual tests should be added to the class-jetpack-cxn-tests.php file.
 *
 * @author Brandon Kraft
 * @package Jetpack
 */

/**
 * "Unit Tests" for the Jetpack connection.
 */
class Jetpack_Cxn_Test_Base {

	/**
	 * The one true instance
	 *
	 * @var object $_instance
	 */
	private $_instance;

	/**
	 * Tests to run on the Jetpack connection.
	 *
	 * @var array $tests
	 */
	protected $tests = array();

	/**
	 * Results of the Jetpack connection tests.
	 *
	 * @var array $results
	 */
	protected $results = array();

	/**
	 * Status of the testing suite.
	 *
	 * Used internally to determine if a test should be skipped since the tests are already failing. Assume passing.
	 *
	 * @var bool $pass
	 */
	protected $pass = true;

	/**
	 * Jetpack_Cxn_Test constructor.
	 */
	private function __construct() {
	}

	/**
	 * Run this to expose the testing platform
	 */
	public function init() {
		if ( ! isset( $this->_instance ) || ! $this->_instance ) {
			$this->_instance = new Jetpack_Cxn_Test_Base();
			$this->tests     = array();
			$this->results   = array();
		}

		return $this->_instance;
	}

	/**
	 * Adds a new test to the Jetpack Connection Testing suite.
	 *
	 * @param callable $callable Test to add to queue.
	 *
	 * @return bool True if successfully added. False for a failure.
	 */
	public function add_test( $callable ) {
		if ( is_callable( $callable ) ) {
			$this->tests[] = $callable;
			return true;
		}

		return false;
	}

	/**
	 * Runs the Jetpack connection suite.
	 */
	public function run_tests() {
		foreach ( $this->tests as $test ) {
			$result          = call_user_func( $test );
			$this->results[] = $result;
			if ( false === $result['pass'] ) {
				$this->pass = false;
			}
		}
	}

	/**
	 * Returns the full results array.
	 *
	 * @return array Array of test results.
	 */
	public function raw_results() {
		if ( ! $this->results ) {
			$this->run_tests();
		}

		return $this->results;
	}

	/**
	 * Returns the status of the connection suite.
	 *
	 * @return true|array True if all tests pass. Array of failed tests.
	 */
	public function pass() {
		$results = $this->raw_results();

		foreach ( $results as $result ) {
			// 'pass' could be true, false, or 'skipped'. We only want false.
			if ( isset( $result['pass'] ) && false === $result['pass'] ) {
				return false;
			}
		}

		return true;

	}

	/**
	 * Return array of failed test messages.
	 *
	 * @return false|array False if no failed tests. Otherwise, array of failed tests.
	 */
	public function list_fails() {
		$results = $this->raw_results();

		foreach ( $results as $test => $result ) {
			// We do not want tests that passed or ones that are misconfigured (no pass status or no failure message).
			if ( ! isset( $result['pass'] ) || false !== $result['pass'] || ! isset( $result['message'] ) ) {
				unset( $results[ $test ] );
			}
		}

		return $results;
	}

	/**
	 * Helper function to return consistent responses for a passing test.
	 *
	 * @param string $name Test name.
	 *
	 * @return array Test results.
	 */
	public static function passing_test( $name = 'Unnamed' ) {
		return array(
			'name'       => $name,
			'pass'       => true,
			'message'    => __( 'Test Passed!', 'jetpack' ),
			'resolution' => false,
		);
	}

	/**
	 * Helper function to return consistent responses for a skipped test.
	 *
	 * @param string $name Test name.
	 *
	 * @return array Test results.
	 */
	public static function skipped_test( $name = 'Unnamed' ) {
		return array(
			'name'       => $name,
			'pass'       => 'skipped',
			'message'    => __( 'Test Skipped.', 'jetpack' ),
			'resolution' => false,
		);
	}

	/**
	 * Helper function to return consistent responses for a failing test.
	 *
	 * @param string $name Test name.
	 * @param string $message Message detailing the failure.
	 * @param string $resolution Steps to resolve.
	 *
	 * @return array Test results.
	 */
	public static function failing_test( $name, $message, $resolution = false ) {
		// Provide standard resolutions steps, but allow pass-through of non-standard ones.
		switch ( $resolution ) {
			case 'cycle_connection':
				$resolution = __( 'Please disconnect and reconnect Jetpack.', 'jetpack' ); // @todo: Link.
				break;
			case 'outbound_requests':
				$resolution = __( 'Please ask your hosting provider to confirm your server can make outbound requests to jetpack.com.', 'jetpack' );
				break;
			case 'support':
				$resolution = __( 'Please contact support.', 'jetpack' ); // @todo: Link to support.
				break;
		}

		return array(
			'name'       => $name,
			'pass'       => false,
			'message'    => $message,
			'resolution' => $resolution,
		);
	}

	/**
	 * Provide WP_CLI friendly testing results.
	 */
	public function output_results_for_cli() {
		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			WP_CLI::line( __( 'TEST RESULTS:', 'jetpack' ) );
			foreach ( $this->raw_results() as $test ) {
				if ( true === $test['pass'] ) {
					WP_CLI::log( WP_CLI::colorize( '%gPassed:%n  ' . $test['name'] ) );
				} elseif ( 'skipped' === $test['pass'] ) {
					WP_CLI::log( WP_CLI::colorize( '%ySkipped:%n ' . $test['name'] ) );
				} else { // Failed.
					WP_CLI::log( WP_CLI::colorize( '%rFailed:%n  ' . $test['name'] ) );
				}
			}
		}
	}
}
