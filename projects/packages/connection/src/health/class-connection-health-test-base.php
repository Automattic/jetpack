<?php
/**
 * Base class for Jetpack Connection health tests.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status;
use WP_Error;

/**
 * Base framework for connection health tests.
 *
 * Provides test registration, execution, result formatting, and output
 * for WordPress Site Health integration.
 *
 * Individual tests should be added in the Connection_Health_Tests class.
 *
 * @since 8.5.0
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
	 * @since 8.5.0
	 *
	 * @param callable $callable Test to add to queue.
	 * @param string   $name     Unique name for the test.
	 * @param string   $type     Optional. Core Site Health type: 'direct' or 'async'. Default 'direct'.
	 * @param array    $groups   Optional. Testing groups to add test to. Default array( 'default' ).
	 *
	 * @return true|WP_Error True if successfully added. WP_Error on failure.
	 */
	public function add_test( $callable, $name, $type = 'direct', $groups = array( 'default' ) ) {
		if ( is_array( $name ) ) {
			// Pre-7.3.0 method passed the $groups parameter here.
			return new WP_Error( 'invalid_arguments', __( 'add_test arguments changed in 7.3.0. Please reference inline documentation.', 'jetpack-connection' ) );
		}
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
	 * @since 8.5.0
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
			$value_groups = isset( $value['group'] ) ? (array) $value['group'] : array();
			if ( ( 'all' === $group || in_array( $group, $value_groups, true ) )
				&& ( 'all' === $type || $type === $value['type'] )
			) {
				$tests[ $name ] = $value;
			}
		}

		return $tests;
	}

	/**
	 * Run a specific test.
	 *
	 * @since 8.5.0
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
	 * @since 8.5.0
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
	 * @since 8.5.0
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
	 * @since 8.5.0
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
	 * @since 8.5.0
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
	 * @since 8.5.0
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
	 * @since 8.5.0
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
	 * @since 8.5.0
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
	 * @since 8.5.0
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
	 * Helper function to check if the site is connected and not in offline mode.
	 *
	 * @return bool
	 */
	protected function helper_is_connected() {
		return ( new Manager() )->is_connected() && ! ( new Status() )->is_offline_mode();
	}

	/**
	 * Helper function to look up the connection owner and return the local WP_User.
	 *
	 * @return \WP_User The connection owner user.
	 */
	protected function helper_retrieve_connection_owner() {
		$owner_id = ( new Manager() )->get_connection_owner_id();
		return new \WP_User( $owner_id );
	}

	/**
	 * Retrieve the blog token if it exists.
	 *
	 * @return object|false
	 */
	protected function helper_get_blog_token() {
		return ( new Tokens() )->get_access_token();
	}

	/**
	 * Returns the URL to reconnect.
	 *
	 * @return string The reconnect URL.
	 */
	protected static function helper_get_reconnect_url() {
		/**
		 * Filters the URL used to reconnect the Jetpack connection.
		 *
		 * @since 8.5.0
		 *
		 * @param string $url The reconnect URL.
		 */
		return apply_filters( 'jetpack_connection_reconnect_url', '' );
	}

	/**
	 * Returns a support URL.
	 *
	 * @return string The support URL.
	 */
	protected function helper_get_support_url() {
		/**
		 * Filters the Jetpack support URL used in connection health tests.
		 *
		 * @since 8.5.0
		 *
		 * @param string $url The support URL.
		 */
		return apply_filters(
			'jetpack_connection_support_url',
			Redirect::get_url( 'jetpack-contact-support' )
		);
	}

	/**
	 * Gets translated support text.
	 *
	 * @return string
	 */
	protected function helper_get_support_text() {
		return __( 'Please contact Jetpack support.', 'jetpack-connection' );
	}

	/**
	 * Returns the translated text to reconnect.
	 *
	 * @return string
	 */
	protected static function helper_get_reconnect_text() {
		return __( 'Reconnect now', 'jetpack-connection' );
	}

	/**
	 * Returns the translated text for failing tests due to timeouts.
	 *
	 * @return string
	 */
	protected static function helper_get_timeout_text() {
		return __( 'The test timed out which may sometimes indicate a failure or may be a false failure. Please relaunch tests.', 'jetpack-connection' );
	}

	/**
	 * Gets translated reconnect long description.
	 *
	 * @param string $connection_error  The connection specific error.
	 * @param string $recommendation   The recommendation for resolving the connection error.
	 *
	 * @return string The translated long description.
	 */
	protected static function helper_get_reconnect_long_description( $connection_error, $recommendation ) {
		return sprintf(
			'<p>%1$s</p>' .
			'<p><span class="dashicons fail"><span class="screen-reader-text">%2$s</span></span> %3$s</p><p><strong>%4$s</strong></p>',
			__( 'A healthy Jetpack Connection allows connected plugins (such as Jetpack and WooCommerce) to provide features like Stats, Site Security, and Payments.', 'jetpack-connection' ),
			/* translators: screen reader text indicating a test failed */
			__( 'Error', 'jetpack-connection' ),
			$connection_error,
			$recommendation
		);
	}

	/**
	 * Helper function to return consistent responses for a connection failing test.
	 *
	 * @param string $name             The test method name.
	 * @param string $connection_error The connection specific error.
	 * @param string $recommendation   The recommendation for resolving the connection error.
	 *
	 * @return array Test results.
	 */
	public static function connection_failing_test( $name, $connection_error = '', $recommendation = '' ) {
		$connection_error = empty( $connection_error ) ? __( 'Your site is not connected to WordPress.com.', 'jetpack-connection' ) : $connection_error;
		$recommendation   = empty( $recommendation ) ? __( 'We recommend reconnecting your site to WordPress.com.', 'jetpack-connection' ) : $recommendation;

		$reconnect_url = self::helper_get_reconnect_url();

		$args = array(
			'name'              => $name,
			'short_description' => $connection_error,
			'long_description'  => self::helper_get_reconnect_long_description( $connection_error, $recommendation ),
		);

		if ( ! empty( $reconnect_url ) ) {
			$args['action']       = $reconnect_url;
			$args['action_label'] = self::helper_get_reconnect_text();
		}

		return self::failing_test( $args );
	}

	/**
	 * Gets translated text to enable outbound requests.
	 *
	 * @param string $protocol Either 'HTTP' or 'HTTPS'.
	 *
	 * @return string
	 */
	protected function helper_enable_outbound_requests( $protocol ) {
		return sprintf(
			/* translators: %1$s - request protocol, either http or https */
			__(
				'Your server did not successfully connect to WordPress.com using %1$s.
				Please ask your hosting provider to confirm your server can make outbound requests to WordPress.com.',
				'jetpack-connection'
			),
			$protocol
		);
	}

	/**
	 * Returns 30 for use with a filter to increase HTTP request timeout.
	 *
	 * @return int 30
	 */
	public static function increase_timeout() {
		return 30;
	}

	/**
	 * Returns a human-readable explanation of why the site is in offline mode.
	 *
	 * @since 8.5.0
	 *
	 * @return string The offline mode trigger explanation.
	 */
	public static function offline_mode_trigger_text() {
		$status = new Status();

		if ( ! $status->is_offline_mode() ) {
			return __( 'The site is not in Offline Mode.', 'jetpack-connection' );
		}

		if ( defined( 'JETPACK_DEV_DEBUG' ) && JETPACK_DEV_DEBUG ) {
			$notice = __( 'The JETPACK_DEV_DEBUG constant is defined in wp-config.php or elsewhere.', 'jetpack-connection' );
		} elseif ( defined( 'WP_LOCAL_DEV' ) && WP_LOCAL_DEV ) {
			$notice = __( 'The WP_LOCAL_DEV constant is defined in wp-config.php or elsewhere.', 'jetpack-connection' );
		} elseif ( $status->is_local_site() ) {
			$notice = __( 'The site URL is a known local development environment URL (e.g. http://localhost).', 'jetpack-connection' );
		} elseif ( get_option( 'jetpack_offline_mode' ) ) {
			$notice = __( 'The jetpack_offline_mode option is set to true.', 'jetpack-connection' );
		} else {
			$notice = __( 'The jetpack_offline_mode filter is set to true.', 'jetpack-connection' );
		}

		return $notice;
	}

	/**
	 * Provide WP_CLI friendly testing results.
	 *
	 * @since 8.5.0
	 *
	 * @param string $group Testing group whose results we are outputting. Default 'all'.
	 */
	public function output_results_for_cli( $group = 'all' ) {
		if ( ! ( defined( 'WP_CLI' ) && WP_CLI ) ) {
			return;
		}

		if ( ( new Status() )->is_offline_mode() ) {
			\WP_CLI::line( __( 'Your site is in Offline Mode:', 'jetpack-connection' ) );
			\WP_CLI::line( self::offline_mode_trigger_text() );
		}
		\WP_CLI::line( __( 'TEST RESULTS:', 'jetpack-connection' ) );
		foreach ( $this->raw_results( 'all', $group ) as $test ) {
			if ( true === $test['pass'] ) {
				\WP_CLI::log( \WP_CLI::colorize( '%gPassed:%n  ' . $test['name'] ) );
			} elseif ( 'skipped' === $test['pass'] ) {
				\WP_CLI::log( \WP_CLI::colorize( '%ySkipped:%n ' . $test['name'] ) );
				if ( $test['short_description'] ) {
					\WP_CLI::log( '         ' . $test['short_description'] );
				}
			} elseif ( 'informational' === $test['pass'] ) {
				\WP_CLI::log( \WP_CLI::colorize( '%yInfo:%n    ' . $test['name'] ) );
				if ( $test['short_description'] ) {
					\WP_CLI::log( '         ' . $test['short_description'] );
				}
			} else {
				\WP_CLI::log( \WP_CLI::colorize( '%rFailed:%n  ' . $test['name'] ) );
				\WP_CLI::log( '         ' . $test['short_description'] );
			}
		}
	}

	/**
	 * Output results of failures in format expected by Core's Site Health tool for async tests.
	 *
	 * @since 8.5.0
	 *
	 * @return array Array of test results.
	 */
	public function output_results_for_core_async_site_health() {
		$badge_label = $this->get_site_health_badge_label();

		$result = array(
			'label'       => __( 'Jetpack Connection passed all async tests.', 'jetpack-connection' ),
			'status'      => 'good',
			'badge'       => array(
				'label' => $badge_label,
				'color' => 'green',
			),
			'description' => sprintf(
				'<p>%s</p>',
				__( "The Jetpack Connection's async local testing suite passed all tests!", 'jetpack-connection' )
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
				$result['label']       = $fail['short_description'];
				$result['status']      = $fail['severity'];
				$result['description'] = sprintf(
					'<p>%s</p>',
					$fail['long_description'] ? $fail['long_description'] : $fail['short_description']
				);
				if ( ! empty( $fail['action'] ) ) {
					$result['actions'] = sprintf(
						'<a class="button button-primary" href="%1$s" target="_blank" rel="noopener noreferrer">%2$s <span class="screen-reader-text">%3$s</span><span aria-hidden="true" class="dashicons dashicons-external"></span></a>',
						esc_url( $fail['action'] ),
						$fail['action_label'] ? $fail['action_label'] : __( 'Resolve', 'jetpack-connection' ),
						/* translators: accessibility text */
						__( '(opens in a new tab)', 'jetpack-connection' )
					);
				}
			} else {
				$result['description'] .= sprintf(
					'<p>%s</p>',
					__( 'There was another problem:', 'jetpack-connection' )
				) . ' ' . $fail['short_description'];
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
	 * @since 8.5.0
	 *
	 * @param string $type  Test type, direct or async. Default 'all'.
	 * @param string $group Testing group whose failures we want converted. Default 'all'.
	 *
	 * @return WP_Error|false WP_Error with all failed tests or false if no failures.
	 */
	public function output_fails_as_wp_error( $type = 'all', $group = 'all' ) {
		if ( $this->pass( $type, $group ) ) {
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
	 * @since 8.5.0
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

		$public_key = openssl_get_publickey( REST_Connector::JETPACK__DEBUGGER_PUBLIC_KEY );

		// Select the first allowed cipher method.
		$allowed_methods = array( 'aes-256-ctr', 'aes-256-cbc' );
		$methods         = array_intersect( $allowed_methods, openssl_get_cipher_methods() );
		$method          = array_shift( $methods );

		$iv = '';
		// @phan-suppress-next-line PhanTypeMismatchArgumentInternal -- $env_key is populated by reference by openssl_seal().
		if ( $public_key && $method && openssl_seal( $data, $encrypted_data, $env_key, array( $public_key ), $method, $iv ) ) {
			// We are returning base64-encoded values to ensure they're characters we can use in JSON responses without issue.
			$return = array(
				'data'   => base64_encode( $encrypted_data ), // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
				'key'    => base64_encode( $env_key[0] ), // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- @phan-suppress-current-line PhanTypeArraySuspiciousNullable
				'iv'     => base64_encode( $iv ), // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
				'cipher' => strtoupper( $method ),
			);
		}

		// openssl_free_key was deprecated as no longer needed in PHP 8.0+. Can remove when PHP 8.0 is our minimum. (lol).
		if ( PHP_VERSION_ID < 80000 ) {
			// @phan-suppress-next-line PhanDeprecatedFunctionInternal
			openssl_free_key( $public_key ); // phpcs:ignore PHPCompatibility.FunctionUse.RemovedFunctions.openssl_free_keyDeprecated, Generic.PHP.DeprecatedFunctions.Deprecated
		}

		return $return;
	}

	/**
	 * Returns the badge label for Site Health integration.
	 *
	 * @since 8.5.0
	 *
	 * @return string The badge label.
	 */
	public function get_site_health_badge_label() {
		/**
		 * Filters the badge label shown in WordPress Site Health for connection tests.
		 *
		 * @since 8.5.0
		 *
		 * @param string $label The badge label. Default 'Jetpack Connection'.
		 */
		return apply_filters( 'jetpack_connection_site_health_badge_label', __( 'Jetpack Connection', 'jetpack-connection' ) );
	}
}
