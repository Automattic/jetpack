<?php
/**
 * Base class for Jetpack Connection health tests.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use WP_Error;

/**
 * Base framework for connection health tests.
 *
 * Provides test registration, execution, result formatting, and output
 * for WordPress Site Health integration.
 *
 * Individual tests should be added in the Connection_Health_Tests class.
 *
 * @since $$next-version$$
 */
class Connection_Health_Test_Base {

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
	 * Connection_Health_Test_Base constructor.
	 */
	public function __construct() {
		$this->tests   = array();
		$this->results = array();
	}

	/**
	 * Adds a new test to the connection testing suite.
	 *
	 * @since $$next-version$$
	 *
	 * @param callable $callable Test to add to queue.
	 * @param string   $name     Unique name for the test.
	 * @param string   $type     Optional. Core Site Health type: 'direct' or 'async'. Default 'direct'.
	 * @param array    $groups   Optional. Testing groups to add test to. Default array( 'default' ).
	 *
	 * @return true|WP_Error True if successfully added. WP_Error on failure.
	 */
	public function add_test( $callable, $name, $type = 'direct', $groups = array( 'default' ) ) {
		if ( array_key_exists( $name, $this->tests ) ) {
			return new WP_Error( 'duplicate_test', __( 'Test names must be unique.', 'jetpack-connection' ) );
		}
		if ( ! is_callable( $callable ) ) {
			return new WP_Error( 'invalid_callable', __( 'Tests must be valid PHP callables.', 'jetpack-connection' ) );
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
	 * @since $$next-version$$
	 *
	 * @param string $type  Optional. Core Site Health type: 'direct' or 'async'. 'all' by default.
	 * @param string $group Optional. A specific testing group. 'all' by default.
	 *
	 * @return array Array of tests with test information.
	 */
	public function list_tests( $type = 'all', $group = 'all' ) {
		if ( ! ( 'all' === $type || 'direct' === $type || 'async' === $type ) ) {
			_doing_it_wrong( __METHOD__, 'Type must be all, direct, or async.', '' );
		}

		$tests = array();
		foreach ( $this->tests as $name => $value ) {
			if ( 'all' === $group || $group === $value['group'] ) {
				$tests[ $name ] = $value;
			}

			if ( 'all' !== $type && $type !== $value['type'] ) {
				unset( $tests[ $name ] );
			}
		}

		return $tests;
	}

	/**
	 * Run a specific test.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $name Name of test.
	 *
	 * @return array|WP_Error Test result array or WP_Error if invalid name.
	 */
	public function run_test( $name ) {
		if ( array_key_exists( $name, $this->tests ) ) {
			return call_user_func( $this->tests[ $name ]['test'] );
		}
		return new WP_Error( 'unknown_test', __( 'There is no test by that name: ', 'jetpack-connection' ) . $name );
	}

	/**
	 * Runs the connection testing suite.
	 *
	 * @since $$next-version$$
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
	 * @since $$next-version$$
	 *
	 * @param string $type  Test type, async or direct. Default 'all'.
	 * @param string $group Testing group whose results we want. Default 'all'.
	 *
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
	 * @since $$next-version$$
	 *
	 * @param string $type  Test type, async or direct. Default 'all'.
	 * @param string $group Testing group to check status of. Default 'all'.
	 *
	 * @return true|false True if all tests pass. False if any test fails.
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
	 * @since $$next-version$$
	 *
	 * @param string $type  Test type, direct or async. Default 'all'.
	 * @param string $group Testing group whose failures we want. Default 'all'.
	 *
	 * @return array Array of failed tests (may be empty).
	 */
	public function list_fails( $type = 'all', $group = 'all' ) {
		$results = $this->raw_results( $type, $group );

		foreach ( $results as $test => $result ) {
			if ( ! isset( $result['pass'] ) || false !== $result['pass'] || ! isset( $result['short_description'] ) ) {
				unset( $results[ $test ] );
			}
		}

		return $results;
	}

	/**
	 * Helper function to return consistent responses for a passing test.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $args Arguments to override defaults.
	 *
	 * @return array Test results.
	 */
	public static function passing_test( $args ) {
		$defaults                      = self::test_result_defaults();
		$defaults['short_description'] = __( 'Test passed!', 'jetpack-connection' );

		$args = wp_parse_args( $args, $defaults );

		$args['pass'] = true;

		return $args;
	}

	/**
	 * Helper function to return consistent responses for a skipped test.
	 *
	 * @since $$next-version$$
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
	 *
	 * @since $$next-version$$
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
	 *
	 * @since $$next-version$$
	 *
	 * @param array $args Arguments to override defaults.
	 *
	 * @return array Test results.
	 */
	public static function failing_test( $args ) {
		$defaults                      = self::test_result_defaults();
		$defaults['short_description'] = __( 'Test failed!', 'jetpack-connection' );
		$defaults['severity']          = 'critical';

		$args = wp_parse_args( $args, $defaults );

		$args['pass'] = false;

		return $args;
	}

	/**
	 * Provides defaults for test arguments.
	 *
	 * @since $$next-version$$
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
	 * Output results of failures in format expected by Core's Site Health tool for async tests.
	 *
	 * @since $$next-version$$
	 *
	 * @return array Array of test results.
	 */
	public function output_results_for_core_async_site_health() {
		$badge_label = $this->get_site_health_badge_label();

		$result = array(
			'label'       => __( 'Jetpack connection passed all async tests.', 'jetpack-connection' ),
			'status'      => 'good',
			'badge'       => array(
				'label' => $badge_label,
				'color' => 'green',
			),
			'description' => sprintf(
				'<p>%s</p>',
				__( "Jetpack connection's async local testing suite passed all tests!", 'jetpack-connection' )
			),
			'actions'     => '',
			'test'        => 'jetpack_connection_local_testing_suite',
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
						__( 'Resolve', 'jetpack-connection' ),
						/* translators: accessibility text */
						__( '(opens in a new tab)', 'jetpack-connection' )
					);
				}
			} else {
				$result['description'] .= sprintf(
					'<p>%s</p>',
					__( 'There was another problem:', 'jetpack-connection' )
				) . ' ' . $fail['message'] . ': ' . $fail['resolution'];
				if ( 'critical' === $fail['severity'] ) {
					$result['status'] = 'critical';
				}
			}
		}

		return $result;
	}

	/**
	 * Provide single WP_Error instance of all failures.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $type  Test type, direct or async. Default 'all'.
	 * @param string $group Testing group whose failures we want converted. Default 'all'.
	 *
	 * @return WP_Error|false WP_Error with all failed tests or false if no failures.
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
	 * Returns the badge label for Site Health integration.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The badge label.
	 */
	public function get_site_health_badge_label() {
		/**
		 * Filters the badge label shown in WordPress Site Health for connection tests.
		 *
		 * @since $$next-version$$
		 *
		 * @param string $label The badge label. Default 'Jetpack'.
		 */
		return apply_filters( 'jetpack_connection_site_health_badge_label', __( 'Jetpack', 'jetpack-connection' ) );
	}
}
