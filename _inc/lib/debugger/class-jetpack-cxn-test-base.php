<?php
/**
 * Base class for Jetpack's debugging tests.
 *
 * @package Jetpack.
 */

use Automattic\Jetpack\Status;

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
 *
 * @since 7.1.0
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
	 * @since 7.1.0
	 * @since 7.3.0 Adds name parameter and returns WP_Error on failure.
	 *
	 * @param callable $callable Test to add to queue.
	 * @param string   $name Unique name for the test.
	 * @param string   $type   Optional. Core Site Health type: 'direct' if test can be run during initial load or 'async' if test should run async.
	 * @param array    $groups Optional. Testing groups to add test to.
	 *
	 * @return mixed True if successfully added. WP_Error on failure.
	 */
	public function add_test( $callable, $name, $type = 'direct', $groups = array( 'default' ) ) {
		if ( is_array( $name ) ) {
			// Pre-7.3.0 method passed the $groups parameter here.
			return new WP_Error( __( 'add_test arguments changed in 7.3.0. Please reference inline documentation.', 'jetpack' ) );
		}
		if ( array_key_exists( $name, $this->tests ) ) {
			return new WP_Error( __( 'Test names must be unique.', 'jetpack' ) );
		}
		if ( ! is_callable( $callable ) ) {
			return new WP_Error( __( 'Tests must be valid PHP callables.', 'jetpack' ) );
		}

		$this->tests[ $name ] = array(
			'name'  => $name,
			'test'  => $callable,
			'group' => $groups,
			'type'  => $type,
		);
		return true;
	}

	/**
	 * Lists all tests to run.
	 *
	 * @since 7.3.0
	 *
	 * @param string $type Optional. Core Site Health type: 'direct' or 'async'. All by default.
	 * @param string $group Optional. A specific testing group. All by default.
	 *
	 * @return array $tests Array of tests with test information.
	 */
	public function list_tests( $type = 'all', $group = 'all' ) {
		if ( ! ( 'all' === $type || 'direct' === $type || 'async' === $type ) ) {
			_doing_it_wrong( 'Jetpack_Cxn_Test_Base->list_tests', 'Type must be all, direct, or async', '7.3.0' );
		}

		$tests = array();
		foreach ( $this->tests as $name => $value ) {
			// Get all valid tests by group staged.
			if ( 'all' === $group || $group === $value['group'] ) {
				$tests[ $name ] = $value;
			}

			// Next filter out any that do not match the type.
			if ( 'all' !== $type && $type !== $value['type'] ) {
				unset( $tests[ $name ] );
			}
		}

		return $tests;
	}

	/**
	 * Run a specific test.
	 *
	 * @since 7.3.0
	 *
	 * @param string $name Name of test.
	 *
	 * @return mixed $result Test result array or WP_Error if invalid name. {
	 * @type string $name Test name
	 * @type mixed  $pass True if passed, false if failed, 'skipped' if skipped.
	 * @type string $message Human-readable test result message.
	 * @type string $resolution Human-readable resolution steps.
	 * }
	 */
	public function run_test( $name ) {
		if ( array_key_exists( $name, $this->tests ) ) {
			return call_user_func( $this->tests[ $name ]['test'] );
		}
		return new WP_Error( __( 'There is no test by that name: ', 'jetpack' ) . $name );
	}

	/**
	 * Runs the Jetpack connection suite.
	 */
	public function run_tests() {
		foreach ( $this->tests as $test ) {
			$result          = call_user_func( $test['test'] );
			$result['group'] = $test['group'];
			$result['type']  = $test['type'];
			$this->results[] = $result;
			if ( false === $result['pass'] ) {
				$this->pass = false;
			}
		}
	}

	/**
	 * Returns the full results array.
	 *
	 * @since 7.1.0
	 * @since 7.3.0 Add 'type'
	 *
	 * @param string $type  Test type, async or direct.
	 * @param string $group Testing group whose results we want. Defaults to all tests.
	 * @return array Array of test results.
	 */
	public function raw_results( $type = 'all', $group = 'all' ) {
		if ( ! $this->results ) {
			$this->run_tests();
		}

		$results = $this->results;

		if ( 'all' !== $group ) {
			foreach ( $results as $test => $result ) {
				if ( ! in_array( $group, $result['group'], true ) ) {
					unset( $results[ $test ] );
				}
			}
		}

		if ( 'all' !== $type ) {
			foreach ( $results as $test => $result ) {
				if ( $type !== $result['type'] ) {
					unset( $results[ $test ] );
				}
			}
		}

		return $results;
	}

	/**
	 * Returns the status of the connection suite.
	 *
	 * @since 7.1.0
	 * @since 7.3.0 Add 'type'
	 *
	 * @param string $type  Test type, async or direct. Optional, direct all tests.
	 * @param string $group Testing group to check status of. Optional, default all tests.
	 *
	 * @return true|array True if all tests pass. Array of failed tests.
	 */
	public function pass( $type = 'all', $group = 'all' ) {
		$results = $this->raw_results( $type, $group );

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
	 * @since 7.1.0
	 * @since 7.3.0 Add 'type'
	 *
	 * @param string $type  Test type, direct or async.
	 * @param string $group Testing group whose failures we want. Defaults to "all".
	 *
	 * @return false|array False if no failed tests. Otherwise, array of failed tests.
	 */
	public function list_fails( $type = 'all', $group = 'all' ) {
		$results = $this->raw_results( $type, $group );

		foreach ( $results as $test => $result ) {
			// We do not want tests that passed or ones that are misconfigured (no pass status or no failure message).
			if ( ! isset( $result['pass'] ) || false !== $result['pass'] || ! isset( $result['short_description'] ) ) {
				unset( $results[ $test ] );
			}
		}

		return $results;
	}

	/**
	 * Helper function to return consistent responses for a passing test.
	 * Possible Args:
	 * - name: string The raw method name that runs the test. Default 'unnamed_test'.
	 * - label: bool|string If false, tests will be labeled with their `name`. You can pass a string to override this behavior. Default false.
	 * - short_description: bool|string A brief, non-html description that will appear in CLI results. Default 'Test passed!'.
	 * - long_description: bool|string An html description that will appear in the site health page. Default false.
	 * - severity: bool|string 'critical', 'recommended', or 'good'. Default: false.
	 * - action: bool|string A URL for the recommended action. Default: false
	 * - action_label: bool|string The label for the recommended action. Default: false
	 * - show_in_site_health: bool True if the test should be shown on the Site Health page. Default: true
	 *
	 * @param array $args Arguments to override defaults.
	 *
	 * @return array Test results.
	 */
	public static function passing_test( $args ) {
		$defaults                      = self::test_result_defaults();
		$defaults['short_description'] = __( 'Test passed!', 'jetpack' );

		$args = wp_parse_args( $args, $defaults );

		$args['pass'] = true;

		return $args;
	}

	/**
	 * Helper function to return consistent responses for a skipped test.
	 * Possible Args:
	 * - name: string The raw method name that runs the test. Default unnamed_test.
	 * - label: bool|string If false, tests will be labeled with their `name`. You can pass a string to override this behavior. Default false.
	 * - short_description: bool|string A brief, non-html description that will appear in CLI results, and as headings in admin UIs. Default false.
	 * - long_description: bool|string An html description that will appear in the site health page. Default false.
	 * - severity: bool|string 'critical', 'recommended', or 'good'. Default: false.
	 * - action: bool|string A URL for the recommended action. Default: false
	 * - action_label: bool|string The label for the recommended action. Default: false
	 * - show_in_site_health: bool True if the test should be shown on the Site Health page. Default: true
	 *
	 * @param array $args Arguments to override defaults.
	 *
	 * @return array Test results.
	 */
	public static function skipped_test( $args = array() ) {
		$args = wp_parse_args(
			$args,
			self::test_result_defaults()
		);

		$args['pass'] = 'skipped';

		return $args;
	}

	/**
	 * Helper function to return consistent responses for an informational test.
	 * Possible Args:
	 * - name: string The raw method name that runs the test. Default unnamed_test.
	 * - label: bool|string If false, tests will be labeled with their `name`. You can pass a string to override this behavior. Default false.
	 * - short_description: bool|string A brief, non-html description that will appear in CLI results, and as headings in admin UIs. Default false.
	 * - long_description: bool|string An html description that will appear in the site health page. Default false.
	 * - severity: bool|string 'critical', 'recommended', or 'good'. Default: false.
	 * - action: bool|string A URL for the recommended action. Default: false
	 * - action_label: bool|string The label for the recommended action. Default: false
	 * - show_in_site_health: bool True if the test should be shown on the Site Health page. Default: true
	 *
	 * @param array $args Arguments to override defaults.
	 *
	 * @return array Test results.
	 */
	public static function informational_test( $args = array() ) {
		$args = wp_parse_args(
			$args,
			self::test_result_defaults()
		);

		$args['pass'] = 'informational';

		return $args;
	}

	/**
	 * Helper function to return consistent responses for a failing test.
	 * Possible Args:
	 * - name: string The raw method name that runs the test. Default unnamed_test.
	 * - label: bool|string If false, tests will be labeled with their `name`. You can pass a string to override this behavior. Default false.
	 * - short_description: bool|string A brief, non-html description that will appear in CLI results, and as headings in admin UIs. Default 'Test failed!'.
	 * - long_description: bool|string An html description that will appear in the site health page. Default false.
	 * - severity: bool|string 'critical', 'recommended', or 'good'. Default: 'critical'.
	 * - action: bool|string A URL for the recommended action. Default: false.
	 * - action_label: bool|string The label for the recommended action. Default: false.
	 * - show_in_site_health: bool True if the test should be shown on the Site Health page. Default: true
	 *
	 * @since 7.1.0
	 *
	 * @param array $args Arguments to override defaults.
	 *
	 * @return array Test results.
	 */
	public static function failing_test( $args ) {
		$defaults                      = self::test_result_defaults();
		$defaults['short_description'] = __( 'Test failed!', 'jetpack' );
		$defaults['severity']          = 'critical';

		$args = wp_parse_args( $args, $defaults );

		$args['pass'] = false;

		return $args;
	}

	/**
	 * Provides defaults for test arguments.
	 *
	 * @since 8.5.0
	 *
	 * @return array Result defaults.
	 */
	private static function test_result_defaults() {
		return array(
			'name'                => 'unnamed_test',
			'label'               => false,
			'short_description'   => false,
			'long_description'    => false,
			'severity'            => false,
			'action'              => false,
			'action_label'        => false,
			'show_in_site_health' => true,
		);
	}

	/**
	 * Provide WP_CLI friendly testing results.
	 *
	 * @since 7.1.0
	 * @since 7.3.0 Add 'type'
	 *
	 * @param string $type  Test type, direct or async.
	 * @param string $group Testing group whose results we are outputting. Default all tests.
	 */
	public function output_results_for_cli( $type = 'all', $group = 'all' ) {
		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			if ( ( new Status() )->is_offline_mode() ) {
				WP_CLI::line( __( 'Jetpack is in Offline Mode:', 'jetpack' ) );
				WP_CLI::line( Jetpack::development_mode_trigger_text() );
			}
			WP_CLI::line( __( 'TEST RESULTS:', 'jetpack' ) );
			foreach ( $this->raw_results( $group ) as $test ) {
				if ( true === $test['pass'] ) {
					WP_CLI::log( WP_CLI::colorize( '%gPassed:%n  ' . $test['name'] ) );
				} elseif ( 'skipped' === $test['pass'] ) {
					WP_CLI::log( WP_CLI::colorize( '%ySkipped:%n ' . $test['name'] ) );
					if ( $test['short_description'] ) {
						WP_CLI::log( '         ' . $test['short_description'] ); // Number of spaces to "tab indent" the reason.
					}
				} elseif ( 'informational' === $test['pass'] ) {
					WP_CLI::log( WP_CLI::colorize( '%yInfo:%n    ' . $test['name'] ) );
					if ( $test['short_description'] ) {
						WP_CLI::log( '         ' . $test['short_description'] ); // Number of spaces to "tab indent" the reason.
					}
				} else { // Failed.
					WP_CLI::log( WP_CLI::colorize( '%rFailed:%n  ' . $test['name'] ) );
					WP_CLI::log( '         ' . $test['short_description'] ); // Number of spaces to "tab indent" the reason.
				}
			}
		}
	}

	/**
	 * Output results of failures in format expected by Core's Site Health tool for async tests.
	 *
	 * Specifically not asking for a testing group since we're opinionated that Site Heath should see all.
	 *
	 * @since 7.3.0
	 *
	 * @return array Array of test results
	 */
	public function output_results_for_core_async_site_health() {
		$result = array(
			'label'       => __( 'Jetpack passed all async tests.', 'jetpack' ),
			'status'      => 'good',
			'badge'       => array(
				'label' => __( 'Jetpack', 'jetpack' ),
				'color' => 'green',
			),
			'description' => sprintf(
				'<p>%s</p>',
				__( "Jetpack's async local testing suite passed all tests!", 'jetpack' )
			),
			'actions'     => '',
			'test'        => 'jetpack_debugger_local_testing_suite_core',
		);

		if ( $this->pass() ) {
			return $result;
		}

		$fails = $this->list_fails( 'async' );
		$error = false;
		foreach ( $fails as $fail ) {
			if ( ! $error ) {
				$error                 = true;
				$result['label']       = $fail['message'];
				$result['status']      = $fail['severity'];
				$result['description'] = sprintf(
					'<p>%s</p>',
					$fail['resolution']
				);
				if ( ! empty( $fail['action'] ) ) {
					$result['actions'] = sprintf(
						'<a class="button button-primary" href="%1$s" target="_blank" rel="noopener noreferrer">%2$s <span class="screen-reader-text">%3$s</span><span aria-hidden="true" class="dashicons dashicons-external"></span></a>',
						esc_url( $fail['action'] ),
						__( 'Resolve', 'jetpack' ),
						/* translators: accessibility text */
						__( '(opens in a new tab)', 'jetpack' )
					);
				}
			} else {
				$result['description'] .= sprintf(
					'<p>%s</p>',
					__( 'There was another problem:', 'jetpack' )
				) . ' ' . $fail['message'] . ': ' . $fail['resolution'];
				if ( 'critical' === $fail['severity'] ) { // In case the initial failure is only "recommended".
					$result['status'] = 'critical';
				}
			}
		}

		return $result;

	}

	/**
	 * Provide single WP Error instance of all failures.
	 *
	 * @since 7.1.0
	 * @since 7.3.0 Add 'type'
	 *
	 * @param string $type  Test type, direct or async.
	 * @param string $group Testing group whose failures we want converted. Default all tests.
	 *
	 * @return WP_Error|false WP_Error with all failed tests or false if there were no failures.
	 */
	public function output_fails_as_wp_error( $type = 'all', $group = 'all' ) {
		if ( $this->pass( $group ) ) {
			return false;
		}
		$fails = $this->list_fails( $type, $group );
		$error = false;

		foreach ( $fails as $result ) {
			$code    = 'failed_' . $result['name'];
			$message = $result['short_description'];
			$data    = array(
				'resolution' => $result['action'] ?
					$result['action_label'] . ' :' . $result['action'] :
					'',
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
