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
			$result = call_user_func( $test );
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
	 * Returns standard resolution steps.
	 *
	 * Tests can provide their own messaging, but for any failed tests with the same steps, let's keep it DRY.
	 *
	 * @param string $resolution Standard resolution.
	 *
	 * @return string Human-readable steps to resolve a failed test.
	 */
	public static function serve_message( $resolution = null ) {
		switch ( $resolution ) {
			case 'cycle_connection':
				$message = __( 'Please disconnect and reconnect Jetpack.', 'jetpack' ); // @todo: Link.
				break;
			case 'support':
			default:
				$message = __( 'Please contact support.', 'jetpack' ); // @todo: Link to support.
		}

		return $message;
	}

	/**
	 * Helper function to return consistent responses for a passing test
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
	 * Helper function to return consistent responses for a skipped test
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
}
