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
	public function __construct() {
		$this->tests   = array();
		$this->results = array();
	}

	/**
	 * Adds a new test to the Jetpack Connection Testing suite.
	 *
	 * @param callable $callable Test to add to queue.
	 * @param array    $groups Testing groups to add test to.
	 *
	 * @return bool True if successfully added. False for a failure.
	 */
	public function add_test( $callable, $groups = array( 'default' ) ) {
		if ( is_callable( $callable ) ) {
			$this->tests[] = array(
				'test'  => $callable,
				'group' => $groups,
			);
			return true;
		}

		return false;
	}

	/**
	 * Runs the Jetpack connection suite.
	 */
	public function run_tests() {
		foreach ( $this->tests as $test ) {
			$result          = call_user_func( $test['test'] );
			$result['group'] = $test['group'];
			$this->results[] = $result;
			if ( false === $result['pass'] ) {
				$this->pass = false;
			}
		}
	}

	/**
	 * Returns the full results array.
	 *
	 * @param string $group Testing group whose results we want. Defaults to "default" group. Use "all" for all tests.
	 * @return array Array of test results.
	 */
	public function raw_results( $group = 'default' ) {
		if ( ! $this->results ) {
			$this->run_tests();
		}

		$results = $this->results;

		if ( 'all' === $group ) {
			return $results;
		}

		foreach ( $results as $test => $result ) {
			if ( ! in_array( $group, $result['group'], true ) ) {
				unset( $results[ $test ] );
			}
		}

		return $results;
	}

	/**
	 * Returns the status of the connection suite.
	 *
	 * @param string $group Testing group to check status of. Optional, default all tests.
	 *
	 * @return true|array True if all tests pass. Array of failed tests.
	 */
	public function pass( $group = 'default' ) {
		$results = $this->raw_results( $group );

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
	 * @param string $group Testing group whose failures we want. Defaults to "default". Use "all" for all tests.
	 *
	 * @return false|array False if no failed tests. Otherwise, array of failed tests.
	 */
	public function list_fails( $group = 'default' ) {
		$results = $this->raw_results( $group );

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
	 * @param string $message Reason for skipping the test. Optional.
	 *
	 * @return array Test results.
	 */
	public static function skipped_test( $name = 'Unnamed', $message = false ) {
		return array(
			'name'       => $name,
			'pass'       => 'skipped',
			'message'    => $message,
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
	 *
	 * @param string $group Testing group whose results we are outputting. Default "default". Use "all" for all tests.
	 */
	public function output_results_for_cli( $group = 'default' ) {
		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			if ( Jetpack::is_development_mode() ) {
				WP_CLI::line( __( 'Jetpack is in Development Mode:', 'jetpack' ) );
				WP_CLI::line( Jetpack::development_mode_trigger_text() );
			}
			WP_CLI::line( __( 'TEST RESULTS:', 'jetpack' ) );
			foreach ( $this->raw_results( $group ) as $test ) {
				if ( true === $test['pass'] ) {
					WP_CLI::log( WP_CLI::colorize( '%gPassed:%n  ' . $test['name'] ) );
				} elseif ( 'skipped' === $test['pass'] ) {
					WP_CLI::log( WP_CLI::colorize( '%ySkipped:%n ' . $test['name'] ) );
					if ( $test['message'] ) {
						WP_CLI::log( '         ' . $test['message'] ); // Number of spaces to "tab indent" the reason.
					}
				} else { // Failed.
					WP_CLI::log( WP_CLI::colorize( '%rFailed:%n  ' . $test['name'] ) );
					WP_CLI::log( '         ' . $test['message'] ); // Number of spaces to "tab indent" the reason.
				}
			}
		}
	}

	/**
	 * Provide single WP Error instance of all failures.
	 *
	 * @param string $group Testing group whose failures we want converted. Default "default". Use "all" for all tests.
	 *
	 * @return WP_Error|false WP_Error with all failed tests or false if there were no failures.
	 */
	public function output_fails_as_wp_error( $group = 'default' ) {
		if ( $this->pass( $group ) ) {
			return false;
		}
		$fails = $this->list_fails( $group );
		$error = false;

		foreach ( $fails as $result ) {
			$code    = 'failed_' . $result['name'];
			$message = $result['message'];
			$data    = array(
				'resolution' => $result['resolution'],
			);
			if ( ! $error ) {
				$error = new WP_Error( $code, $message, $data );
			} else {
				$error->add( $code, $message, $data );
			}
		}

		return $error;
	}

	/**
	 * Encrypt data for sending to WordPress.com.
	 *
	 * @todo When PHP minimum is 5.3+, add cipher detection to use an agreed better cipher than RC4. RC4 should be the last resort.
	 *
	 * @param string $data Data to encrypt with the WP.com Public Key.
	 *
	 * @return false|array False if functionality not available. Array of encrypted data, encryption key.
	 */
	public function encrypt_string_for_wpcom( $data ) {
		$return = false;
		if ( ! function_exists( 'openssl_get_publickey' ) || ! function_exists( 'openssl_seal' ) ) {
			return $return;
		}

		$public_key = openssl_get_publickey( JETPACK__DEBUGGER_PUBLIC_KEY );

		if ( $public_key && openssl_seal( $data, $encrypted_data, $env_key, array( $public_key ) ) ) {
			// We are returning base64-encoded values to ensure they're characters we can use in JSON responses without issue.
			$return = array(
				'data'   => base64_encode( $encrypted_data ), // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
				'key'    => base64_encode( $env_key[0] ), // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
				'cipher' => 'RC4', // When Jetpack's minimum WP version is at PHP 5.3+, we will add in detecting and using a stronger one.
			);
		}

		openssl_free_key( $public_key );

		return $return;
	}
}
