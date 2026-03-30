<?php
/**
 * Base class for Jetpack's debugging tests.
 *
 * Extends the connection package's Connection_Health_Test_Base with Jetpack-specific
 * functionality (WP-CLI output, encryption, legacy text domain).
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Connection_Health_Test_Base;
use Automattic\Jetpack\Status;

/**
 * "Unit Tests" for the Jetpack connection.
 *
 * @since 7.1.0
 */
class Jetpack_Cxn_Test_Base extends Connection_Health_Test_Base {

	/**
	 * Adds a new test to the Jetpack Connection Testing suite.
	 *
	 * Extends the parent to maintain backwards compatibility with the pre-7.3.0 method signature.
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
		return parent::add_test( $callable, $name, $type, $groups );
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
						WP_CLI::log( '         ' . $test['short_description'] );
					}
				} elseif ( 'informational' === $test['pass'] ) {
					WP_CLI::log( WP_CLI::colorize( '%yInfo:%n    ' . $test['name'] ) );
					if ( $test['short_description'] ) {
						WP_CLI::log( '         ' . $test['short_description'] );
					}
				} else {
					WP_CLI::log( WP_CLI::colorize( '%rFailed:%n  ' . $test['name'] ) );
					WP_CLI::log( '         ' . $test['short_description'] );
				}
			}
		}
	}

	/**
	 * Output results of failures in format expected by Core's Site Health tool for async tests.
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
				if ( 'critical' === $fail['severity'] ) {
					$result['status'] = 'critical';
				}
			}
		}

		return $result;
	}

	/**
	 * Encrypt data for sending to WordPress.com.
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

		// Select the first allowed cipher method.
		$allowed_methods = array( 'aes-256-ctr', 'aes-256-cbc' );
		$methods         = array_intersect( $allowed_methods, openssl_get_cipher_methods() );
		$method          = array_shift( $methods );

		$iv = '';
		if ( $public_key && $method && openssl_seal( $data, $encrypted_data, $env_key, array( $public_key ), $method, $iv ) ) {
			// We are returning base64-encoded values to ensure they're characters we can use in JSON responses without issue.
			$return = array(
				'data'   => base64_encode( $encrypted_data ), // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
				'key'    => base64_encode( $env_key[0] ), // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
				'iv'     => base64_encode( $iv ), // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
				'cipher' => strtoupper( $method ),
			);
		}

		// openssl_free_key was deprecated as no longer needed in PHP 8.0+. Can remove when PHP 8.0 is our minimum. (lol).
		if ( PHP_VERSION_ID < 80000 ) {
			openssl_free_key( $public_key ); // phpcs:ignore PHPCompatibility.FunctionUse.RemovedFunctions.openssl_free_keyDeprecated, Generic.PHP.DeprecatedFunctions.Deprecated
		}

		return $return;
	}
}
