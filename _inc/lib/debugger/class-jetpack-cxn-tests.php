<?php
/**
 * Collection of tests to run on the Jetpack connection locally.
 *
 * @package Jetpack
 */

/**
 * Class Jetpack_Cxn_Tests contains all of the actual tests.
 */
class Jetpack_Cxn_Tests extends Jetpack_Cxn_Test_Base {

	/**
	 * Jetpack_Cxn_Tests constructor.
	 */
	public function __construct() {
		parent::__construct();

		$methods = get_class_methods( 'Jetpack_Cxn_Tests' );

		foreach ( $methods as $method ) {
			if ( false === strpos( $method, 'test__' ) ) {
				continue;
			}
			$this->add_test( array( $this, $method ), $method, 'direct' );
		}

		/**
		 * Fires after loading default Jetpack Connection tests.
		 *
		 * @since 7.1.0
		 */
		do_action( 'jetpack_connection_tests_loaded' );

		/**
		 * Determines if the WP.com testing suite should be included.
		 *
		 * @since 7.1.0
		 *
		 * @param bool $run_test To run the WP.com testing suite. Default true.
		 */
		if ( apply_filters( 'jetpack_debugger_run_self_test', true ) ) {
			/**
			 * Intentionally added last as it checks for an existing failure state before attempting.
			 * Generally, any failed location condition would result in the WP.com check to fail too, so
			 * we will skip it to avoid confusing error messages.
			 *
			 * Note: This really should be an 'async' test.
			 */
			$this->add_test( array( $this, 'last__wpcom_self_test' ), 'test__wpcom_self_test', 'direct' );
		}
	}

	/**
	 * Helper function to look up the expected master user and return the local WP_User.
	 *
	 * @return WP_User Jetpack's expected master user.
	 */
	protected function helper_retrieve_local_master_user() {
		$master_user = Jetpack_Options::get_option( 'master_user' );
		return new WP_User( $master_user );
	}

	/**
	 * Is Jetpack even connected and supposed to be talking to WP.com?
	 */
	protected function helper_is_jetpack_connected() {
		return ( Jetpack::is_active() && ! Jetpack::is_development_mode() );
	}

	/**
	 * Test if Jetpack is connected.
	 */
	protected function test__check_if_connected() {
		$name = __FUNCTION__;
		if ( $this->helper_is_jetpack_connected() ) {
			$result = self::passing_test( $name );
		} elseif ( Jetpack::is_development_mode() ) {
			$result = self::skipped_test( $name, __( 'Jetpack is in Development Mode:', 'jetpack' ) . ' ' . Jetpack::development_mode_trigger_text(), __( 'Disable development mode.', 'jetpack' ) );
		} else {
			$result = self::failing_test( $name, __( 'Jetpack is not connected.', 'jetpack' ), 'cycle_connection' );
		}

		return $result;
	}

	/**
	 * Test that the master user still exists on this site.
	 *
	 * @return array Test results.
	 */
	protected function test__master_user_exists_on_site() {
		$name = __FUNCTION__;
		if ( ! $this->helper_is_jetpack_connected() ) {
			return self::skipped_test( $name, __( 'Jetpack is not connected. No master user to check.', 'jetpack' ) ); // Skip test.
		}
		$local_user = $this->helper_retrieve_local_master_user();

		if ( $local_user->exists() ) {
			$result = self::passing_test( $name );
		} else {
			$result = self::failing_test( $name, __( 'The user who setup the Jetpack connection no longer exists on this site.', 'jetpack' ), 'cycle_connection' );
		}

		return $result;
	}

	/**
	 * Test that the master user has the manage options capability (e.g. is an admin).
	 *
	 * Generic calls from WP.com execute on Jetpack as the master user. If it isn't an admin, random things will fail.
	 *
	 * @return array Test results.
	 */
	protected function test__master_user_can_manage_options() {
		$name = __FUNCTION__;
		if ( ! $this->helper_is_jetpack_connected() ) {
			return self::skipped_test( $name, __( 'Jetpack is not connected.', 'jetpack' ) ); // Skip test.
		}
		$master_user = $this->helper_retrieve_local_master_user();

		if ( user_can( $master_user, 'manage_options' ) ) {
			$result = self::passing_test( $name );
		} else {
			/* translators: a WordPress username */
			$result = self::failing_test( $name, sprintf( __( 'The user (%s) who setup the Jetpack connection is not an administrator.', 'jetpack' ), $master_user->user_login ), __( 'Either upgrade the user or disconnect and reconnect Jetpack.', 'jetpack' ) ); // @todo: Link to the right places.
		}

		return $result;
	}

	/**
	 * Test that the PHP's XML library is installed.
	 *
	 * While it should be installed by default, increasingly in PHP 7, some OSes require an additional php-xml package.
	 *
	 * @return array Test results.
	 */
	protected function test__xml_parser_available() {
		$name = __FUNCTION__;
		if ( function_exists( 'xml_parser_create' ) ) {
			$result = self::passing_test( $name );
		} else {
			$result = self::failing_test( $name, __( 'PHP XML manipluation libraries are not available.', 'jetpack' ), __( "Please ask your hosting provider to refer to our server requirements at https://jetpack.com/support/server-requirements/ and enable PHP's XML module.", 'jetpack' ) );
		}

		return $result;
	}

	/**
	 * Test that the server is able to send an outbound http communication.
	 *
	 * @return array Test results.
	 */
	protected function test__outbound_http() {
		$name    = __FUNCTION__;
		$request = wp_remote_get( preg_replace( '/^https:/', 'http:', JETPACK__API_BASE ) . 'test/1/' );
		$code    = wp_remote_retrieve_response_code( $request );

		if ( 200 === intval( $code ) ) {
			$result = self::passing_test( $name );
		} else {
			$result = self::failing_test( $name, __( 'Your server did not successfully connect to the Jetpack server using HTTP', 'jetpack' ), 'outbound_requests' );
		}

		return $result;
	}

	/**
	 * Test that the server is able to send an outbound https communication.
	 *
	 * @return array Test results.
	 */
	protected function test__outbound_https() {
		$name    = __FUNCTION__;
		$request = wp_remote_get( preg_replace( '/^http:/', 'https:', JETPACK__API_BASE ) . 'test/1/' );
		$code    = wp_remote_retrieve_response_code( $request );

		if ( 200 === intval( $code ) ) {
			$result = self::passing_test( $name );
		} else {
			$result = self::failing_test( $name, __( 'Your server did not successfully connect to the Jetpack server using HTTPS', 'jetpack' ), 'outbound_requests' );
		}

		return $result;
	}

	/**
	 * Check for an IDC.
	 *
	 * @return array Test results.
	 */
	protected function test__identity_crisis() {
		$name = __FUNCTION__;
		if ( ! $this->helper_is_jetpack_connected() ) {
			return self::skipped_test( $name, __( 'Jetpack is not connected.', 'jetpack' ) ); // Skip test.
		}
		$identity_crisis = Jetpack::check_identity_crisis();

		if ( ! $identity_crisis ) {
			$result = self::passing_test( $name );
		} else {
			$message = sprintf(
				/* translators: Two URLs. The first is the locally-recorded value, the second is the value as recorded on WP.com. */
				__( 'Your url is set as `%1$s`, but your WordPress.com connection lists it as `%2$s`!', 'jetpack' ),
				$identity_crisis['home'],
				$identity_crisis['wpcom_home']
			);
			$result = self::failing_test( $name, $message, 'support' );
		}
		return $result;
	}

	/**
	 * Tests connection status against wp.com's test-connection endpoint
	 *
	 * @todo: Compare with the wpcom_self_test. We only need one of these.
	 *
	 * @return array Test results.
	 */
	protected function test__wpcom_connection_test() {
		$name = __FUNCTION__;

		if ( ! Jetpack::is_active() || Jetpack::is_development_mode() || Jetpack::is_staging_site() || ! $this->pass ) {
			return self::skipped_test( $name );
		}

		$response = Jetpack_Client::wpcom_json_api_request_as_blog(
			sprintf( '/jetpack-blogs/%d/test-connection', Jetpack_Options::get_option( 'id' ) ),
			Jetpack_Client::WPCOM_JSON_API_VERSION
		);

		if ( is_wp_error( $response ) ) {
			/* translators: %1$s is the error code, %2$s is the error message */
			$message = sprintf( __( 'Connection test failed (#%1$s: %2$s)', 'jetpack' ), $response->get_error_code(), $response->get_error_message() );
			return self::failing_test( $name, $message );
		}

		$body = wp_remote_retrieve_body( $response );
		if ( ! $body ) {
			$message = __( 'Connection test failed (empty response body)', 'jetpack' ) . wp_remote_retrieve_response_code( $response );
			return self::failing_test( $name, $message );
		}

		$result       = json_decode( $body );
		$is_connected = (bool) $result->connected;
		$message      = $result->message . ': ' . wp_remote_retrieve_response_code( $response );

		if ( $is_connected ) {
			return self::passing_test( $name );
		} else {
			return self::failing_test( $name, $message );
		}
	}

	/**
	 * Tests the port number to ensure it is an expected value.
	 *
	 * We expect that sites on be on one of:
	 * port 80,
	 * port 443 (https sites only),
	 * the value of JETPACK_SIGNATURE__HTTP_PORT,
	 * unless the site is intentionally on a different port (e.g. example.com:8080 is the site's URL).
	 *
	 * If the value isn't one of those and the site's URL doesn't include a port, then the signature verification will fail.
	 *
	 * This happens most commonly on sites with reverse proxies, so the edge (e.g. Varnish) is running on 80/443, but nginx
	 * or Apache is responding internally on a different port (e.g. 81).
	 *
	 * @return array Test results
	 */
	protected function test__server_port_value() {
		$name = __FUNCTION__;
		if ( ! isset( $_SERVER['HTTP_X_FORWARDED_PORT'] ) && ! isset( $_SERVER['SERVER_PORT'] ) ) {
			$message = 'The server port values are not defined. This is most common when running PHP via a CLI.';
			return self::skipped_test( $name, $message );
		}
		$site_port   = wp_parse_url( home_url(), PHP_URL_PORT );
		$server_port = isset( $_SERVER['HTTP_X_FORWARDED_PORT'] ) ? (int) $_SERVER['HTTP_X_FORWARDED_PORT'] : (int) $_SERVER['SERVER_PORT'];
		$http_ports  = array( 80 );
		$https_ports = array( 80, 443 );

		if ( defined( 'JETPACK_SIGNATURE__HTTP_PORT' ) ) {
			$http_ports[] = JETPACK_SIGNATURE__HTTP_PORT;
		}

		if ( defined( 'JETPACK_SIGNATURE__HTTPS_PORT' ) ) {
			$https_ports[] = JETPACK_SIGNATURE__HTTPS_PORT;
		}

		if ( $site_port ) {
			return self::skipped_test( $name ); // Not currently testing for this situation.
		}

		if ( is_ssl() && in_array( $server_port, $https_ports, true ) ) {
			return self::passing_test( $name );
		} elseif ( in_array( $server_port, $http_ports, true ) ) {
			return self::passing_test( $name );
		} else {
			if ( is_ssl() ) {
				$needed_constant = 'JETPACK_SIGNATURE__HTTPS_PORT';
			} else {
				$needed_constant = 'JETPACK_SIGNATURE__HTTP_PORT';
			}
			$message    = __( 'The server port value is unexpected.', 'jetpack' );
			$resolution = __( 'Try adding the following to your wp-config.php file:', 'jetpack' ) . " define( '$needed_constant', $server_port );";
			return self::failing_test( $name, $message, $resolution );
		}
	}

	/**
	 * Calls to WP.com to run the connection diagnostic testing suite.
	 *
	 * Intentionally added last as it will be skipped if any local failed conditions exist.
	 *
	 * @return array Test results.
	 */
	protected function last__wpcom_self_test() {
		$name = 'test__wpcom_self_test';
		if ( ! Jetpack::is_active() || Jetpack::is_development_mode() || Jetpack::is_staging_site() || ! $this->pass ) {
			return self::skipped_test( $name );
		}

		$self_xml_rpc_url = site_url( 'xmlrpc.php' );

		$testsite_url = Jetpack::fix_url_for_bad_hosts( JETPACK__API_BASE . 'testsite/1/?url=' );

		add_filter( 'http_request_timeout', array( 'Jetpack_Debugger', 'jetpack_increase_timeout' ) );

		$response = wp_remote_get( $testsite_url . $self_xml_rpc_url );

		remove_filter( 'http_request_timeout', array( 'Jetpack_Debugger', 'jetpack_increase_timeout' ) );

		if ( 200 === wp_remote_retrieve_response_code( $response ) ) {
			return self::passing_test( $name );
		} else {
			return self::failing_test( $name, __( 'Jetpack.com detected an error.', 'jetpack' ), __( 'Visit the Jetpack.com debugging page for more information or contact support.', 'jetpack' ) ); // @todo direct links.
		}
	}
}
