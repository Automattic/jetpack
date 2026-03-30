<?php
/**
 * Collection of health tests for the Jetpack connection.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Identity_Crisis;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status;
use Jetpack_Options;

/**
 * Class Connection_Health_Tests contains all connection-specific health tests.
 *
 * @since $$next-version$$
 */
class Connection_Health_Tests extends Connection_Health_Test_Base {

	/**
	 * Connection_Health_Tests constructor.
	 */
	public function __construct() {
		parent::__construct();

		$methods = get_class_methods( static::class );

		foreach ( $methods as $method ) {
			if ( ! str_contains( $method, 'test__' ) ) {
				continue;
			}
			$this->add_test( array( $this, $method ), $method, 'direct' );
		}

		/**
		 * Fires after loading default connection health tests.
		 *
		 * Allows other packages or plugins to register additional tests.
		 *
		 * @since $$next-version$$
		 *
		 * @param Connection_Health_Tests $this The Connection_Health_Tests instance.
		 */
		do_action( 'jetpack_connection_health_tests_loaded', $this );
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
		 * @since $$next-version$$
		 *
		 * @param string $url The reconnect URL.
		 */
		return apply_filters( 'jetpack_connection_reconnect_url', admin_url( 'admin.php?page=jetpack#/reconnect' ) );
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
		 * @since $$next-version$$
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
		return __( 'Reconnect Jetpack now', 'jetpack-connection' );
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
			__( 'A healthy connection ensures Jetpack essential services are provided to your WordPress site, such as Stats and Site Security.', 'jetpack-connection' ),
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
		$connection_error = empty( $connection_error ) ? __( 'Your site is not connected to Jetpack.', 'jetpack-connection' ) : $connection_error;
		$recommendation   = empty( $recommendation ) ? __( 'We recommend reconnecting Jetpack.', 'jetpack-connection' ) : $recommendation;

		$args = array(
			'name'              => $name,
			'short_description' => $connection_error,
			'action'            => self::helper_get_reconnect_url(),
			'action_label'      => self::helper_get_reconnect_text(),
			'long_description'  => self::helper_get_reconnect_long_description( $connection_error, $recommendation ),
		);

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
				'Your server did not successfully connect to the Jetpack server using %1$s
				Please ask your hosting provider to confirm your server can make outbound requests to jetpack.com.',
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
	 * The test verifies the blog token exists.
	 *
	 * @return array
	 */
	protected function test__blog_token_if_exists() {
		$name = 'test__blog_token_if_exists';

		if ( ! $this->helper_is_connected() ) {
			return self::skipped_test(
				array(
					'name'              => $name,
					'short_description' => __( 'Jetpack is not connected. No blog token to check.', 'jetpack-connection' ),
				)
			);
		}
		$blog_token = $this->helper_get_blog_token();

		if ( $blog_token ) {
			return self::passing_test( array( 'name' => $name ) );
		}

		return self::connection_failing_test( $name, __( 'Blog token is missing.', 'jetpack-connection' ) );
	}

	/**
	 * Test if Jetpack is connected.
	 *
	 * @return array
	 */
	protected function test__check_if_connected() {
		$name = 'test__check_if_connected';

		if ( ! $this->helper_get_blog_token() ) {
			return self::skipped_test(
				array(
					'name'              => $name,
					'short_description' => __( 'Blog token is missing.', 'jetpack-connection' ),
				)
			);
		}

		if ( $this->helper_is_connected() ) {
			return self::passing_test(
				array(
					'name'             => $name,
					'label'            => __( 'Your site is connected to Jetpack', 'jetpack-connection' ),
					'long_description' => sprintf(
						'<p>%1$s</p>' .
						'<p><span class="dashicons pass"><span class="screen-reader-text">%2$s</span></span> %3$s</p>',
						__( 'A healthy connection ensures Jetpack essential services are provided to your WordPress site, such as Stats and Site Security.', 'jetpack-connection' ),
						/* translators: Screen reader text indicating a test has passed */
						__( 'Passed', 'jetpack-connection' ),
						__( 'Your site is connected to Jetpack.', 'jetpack-connection' )
					),
				)
			);
		} elseif ( ( new Status() )->is_offline_mode() ) {
			return self::skipped_test(
				array(
					'name'              => $name,
					'short_description' => __( 'Jetpack is in Offline Mode.', 'jetpack-connection' ),
				)
			);
		}

		return self::connection_failing_test( $name, __( 'Your site is not connected to Jetpack', 'jetpack-connection' ) );
	}

	/**
	 * Test that the connection owner still exists on this site.
	 *
	 * @return array
	 */
	protected function test__master_user_exists_on_site() {
		$name = 'test__master_user_exists_on_site';

		if ( ! $this->helper_is_connected() ) {
			return self::skipped_test(
				array(
					'name'              => $name,
					'short_description' => __( 'Jetpack is not connected. No connection owner to check.', 'jetpack-connection' ),
				)
			);
		}
		if ( ! ( new Manager() )->get_connection_owner_id() ) {
			return self::skipped_test(
				array(
					'name'              => $name,
					'short_description' => __( 'Jetpack is running without a connected user. No connection owner to check.', 'jetpack-connection' ),
				)
			);
		}
		$local_user = $this->helper_retrieve_connection_owner();

		if ( $local_user->exists() ) {
			return self::passing_test( array( 'name' => $name ) );
		}

		return self::connection_failing_test(
			$name,
			__( 'The user who set up the Jetpack connection no longer exists on this site.', 'jetpack-connection' )
		);
	}

	/**
	 * Test that the connection owner has the manage options capability (e.g. is an admin).
	 *
	 * @return array
	 */
	protected function test__master_user_can_manage_options() {
		$name = 'test__master_user_can_manage_options';

		if ( ! $this->helper_is_connected() ) {
			return self::skipped_test(
				array(
					'name'              => $name,
					'short_description' => __( 'Jetpack is not connected.', 'jetpack-connection' ),
				)
			);
		}
		if ( ! ( new Manager() )->get_connection_owner_id() ) {
			return self::skipped_test(
				array(
					'name'              => $name,
					'short_description' => __( 'Jetpack is running without a connected user. No connection owner to check.', 'jetpack-connection' ),
				)
			);
		}
		$owner_user = $this->helper_retrieve_connection_owner();

		if ( user_can( $owner_user, 'manage_options' ) ) {
			return self::passing_test( array( 'name' => $name ) );
		}

		/* translators: a WordPress username */
		$connection_error = sprintf( __( 'The user (%s) who set up the Jetpack connection is not an administrator.', 'jetpack-connection' ), $owner_user->user_login );
		/* translators: a WordPress username */
		$recommendation = sprintf( __( 'We recommend either upgrading the user (%s) or reconnecting Jetpack.', 'jetpack-connection' ), $owner_user->user_login );

		return self::connection_failing_test( $name, $connection_error, $recommendation );
	}

	/**
	 * Test that the server is able to send an outbound HTTP communication.
	 *
	 * @return array
	 */
	protected function test__outbound_http() {
		$name     = 'test__outbound_http';
		$api_base = Constants::get_constant( 'JETPACK__API_BASE' );
		if ( ! $api_base ) {
			$api_base = Utils::DEFAULT_JETPACK__API_BASE;
		}
		$request = wp_remote_get( preg_replace( '/^https:/', 'http:', $api_base ) . 'test/1/' );
		$code    = wp_remote_retrieve_response_code( $request );

		if ( 200 === (int) $code ) {
			return self::passing_test( array( 'name' => $name ) );
		}

		return self::failing_test(
			array(
				'name'              => $name,
				'short_description' => $this->helper_enable_outbound_requests( 'HTTP' ),
			)
		);
	}

	/**
	 * Test that the server is able to send an outbound HTTPS communication.
	 *
	 * @return array
	 */
	protected function test__outbound_https() {
		$name     = 'test__outbound_https';
		$api_base = Constants::get_constant( 'JETPACK__API_BASE' );
		if ( ! $api_base ) {
			$api_base = Utils::DEFAULT_JETPACK__API_BASE;
		}
		$request = wp_remote_get( preg_replace( '/^http:/', 'https:', $api_base ) . 'test/1/' );
		$code    = wp_remote_retrieve_response_code( $request );

		if ( 200 === (int) $code ) {
			return self::passing_test( array( 'name' => $name ) );
		}

		return self::failing_test(
			array(
				'name'              => $name,
				'short_description' => $this->helper_enable_outbound_requests( 'HTTPS' ),
			)
		);
	}

	/**
	 * Check for an Identity Crisis.
	 *
	 * @return array
	 */
	protected function test__identity_crisis() {
		$name = 'test__identity_crisis';

		if ( ! $this->helper_is_connected() ) {
			return self::skipped_test(
				array(
					'name'              => $name,
					'short_description' => __( 'Jetpack is not connected.', 'jetpack-connection' ),
				)
			);
		}

		$identity_crisis = $this->check_identity_crisis();

		if ( ! $identity_crisis ) {
			return self::passing_test( array( 'name' => $name ) );
		}

		$messages = array();

		if ( isset( $identity_crisis['home'] ) && isset( $identity_crisis['wpcom_home'] ) && $identity_crisis['home'] !== $identity_crisis['wpcom_home'] ) {
			$messages[] = sprintf(
				/* translators: Two URLs. The first is the locally-recorded value, the second is the value as recorded on WP.com. */
				__( 'Your home URL is set as `%1$s`, but your WordPress.com connection lists it as `%2$s`.', 'jetpack-connection' ),
				$identity_crisis['home'],
				$identity_crisis['wpcom_home']
			);
		}

		if ( isset( $identity_crisis['siteurl'] ) && isset( $identity_crisis['wpcom_siteurl'] ) && $identity_crisis['siteurl'] !== $identity_crisis['wpcom_siteurl'] ) {
			$messages[] = sprintf(
				/* translators: Two URLs. The first is the locally-recorded value, the second is the value as recorded on WP.com. */
				__( 'Your site URL is set as `%1$s`, but your WordPress.com connection lists it as `%2$s`.', 'jetpack-connection' ),
				$identity_crisis['siteurl'],
				$identity_crisis['wpcom_siteurl']
			);
		}

		if ( empty( $messages ) ) {
			$messages[] = __( 'A URL mismatch was detected between your site and WordPress.com.', 'jetpack-connection' );
		}

		return self::failing_test(
			array(
				'name'              => $name,
				'short_description' => implode( ' ', $messages ),
				'action_label'      => $this->helper_get_support_text(),
				'action'            => $this->helper_get_support_url(),
			)
		);
	}

	/**
	 * Check for Identity Crisis using connection package classes.
	 *
	 * @return array|false False if no IDC, array with crisis details otherwise.
	 */
	protected function check_identity_crisis() {
		if ( ! ( new Manager() )->is_connected() || ( new Status() )->is_offline_mode() ) {
			return false;
		}

		if ( ! class_exists( 'Automattic\Jetpack\Identity_Crisis' ) || ! Identity_Crisis::validate_sync_error_idc_option() ) {
			return false;
		}

		return Jetpack_Options::get_option( 'sync_error_idc' );
	}

	/**
	 * Tests the health of the connection tokens.
	 *
	 * @return array
	 */
	protected function test__connection_token_health() {
		$name    = 'test__connection_token_health';
		$m       = new Manager();
		$user_id = get_current_user_id();

		// Check if there's a connected logged in user.
		if ( $user_id && ! $m->is_user_connected( $user_id ) ) {
			$user_id = false;
		}

		// If no logged in user to check, let's see if there's a connection owner set.
		if ( ! $user_id ) {
			$user_id = Jetpack_Options::get_option( 'master_user' );
			if ( $user_id && ! $m->is_user_connected( $user_id ) ) {
				return self::connection_failing_test( $name, __( 'Missing token for the connection owner.', 'jetpack-connection' ) );
			}
		}

		if ( $user_id ) {
			return $this->check_tokens_health( $user_id );
		}

		return $this->check_blog_token_health();
	}

	/**
	 * Tests blog token against WP.com's check-token-health endpoint.
	 *
	 * @return array
	 */
	protected function check_blog_token_health() {
		$name  = 'test__connection_token_health';
		$valid = ( new Tokens() )->validate_blog_token();

		if ( ! $valid ) {
			return self::connection_failing_test( $name, __( 'Blog token validation failed.', 'jetpack-connection' ) );
		}

		return self::passing_test( array( 'name' => $name ) );
	}

	/**
	 * Tests blog and user tokens against WP.com's check-token-health endpoint.
	 *
	 * @param int $user_id The user ID to check the tokens for.
	 *
	 * @return array
	 */
	protected function check_tokens_health( $user_id ) {
		$name             = 'test__connection_token_health';
		$validated_tokens = ( new Tokens() )->validate( $user_id );

		if ( ! is_array( $validated_tokens ) || count( array_diff_key( array_flip( array( 'blog_token', 'user_token' ) ), $validated_tokens ) ) ) {
			return self::skipped_test(
				array(
					'name'              => $name,
					'short_description' => __( 'Token health check failed to validate tokens.', 'jetpack-connection' ),
				)
			);
		}

		$invalid_tokens_exist = false;
		foreach ( $validated_tokens as $validated_token ) {
			if ( ! $validated_token['is_healthy'] ) {
				$invalid_tokens_exist = true;
				break;
			}
		}

		if ( ! $invalid_tokens_exist ) {
			return self::passing_test( array( 'name' => $name ) );
		}

		return self::connection_failing_test( $name, __( 'Invalid Jetpack connection tokens.', 'jetpack-connection' ) );
	}

	/**
	 * Tests connection status against WP.com's test-connection endpoint.
	 *
	 * @return array
	 */
	protected function test__wpcom_connection_test() {
		$name = 'test__wpcom_connection_test';

		$status = new Status();
		if ( ! ( new Manager() )->is_connected() || $status->is_offline_mode() || $status->in_safe_mode() || ! $this->pass ) {
			return self::skipped_test( array( 'name' => $name ) );
		}

		add_filter( 'http_request_timeout', array( static::class, 'increase_timeout' ) );
		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/jetpack-blogs/%d/test-connection', Jetpack_Options::get_option( 'id' ) ),
			Client::WPCOM_JSON_API_VERSION
		);
		remove_filter( 'http_request_timeout', array( static::class, 'increase_timeout' ) );

		if ( is_wp_error( $response ) ) {
			if ( str_contains( $response->get_error_message(), 'cURL error 28' ) ) {
				return self::skipped_test(
					array(
						'name'              => $name,
						'short_description' => self::helper_get_timeout_text(),
					)
				);
			}

			/* translators: %1$s is the error code, %2$s is the error message */
			$message = sprintf( __( 'Connection test failed (#%1$s: %2$s)', 'jetpack-connection' ), $response->get_error_code(), $response->get_error_message() );
			return self::connection_failing_test( $name, $message );
		}

		$body = wp_remote_retrieve_body( $response );
		if ( ! $body ) {
			return self::failing_test(
				array(
					'name'              => $name,
					'short_description' => __( 'Connection test failed (empty response body)', 'jetpack-connection' ) . wp_remote_retrieve_response_code( $response ),
					'action_label'      => $this->helper_get_support_text(),
					'action'            => $this->helper_get_support_url(),
				)
			);
		}

		if ( 404 === wp_remote_retrieve_response_code( $response ) ) {
			return self::skipped_test(
				array(
					'name'              => $name,
					'short_description' => __( 'The WordPress.com API returned a 404 error.', 'jetpack-connection' ),
				)
			);
		}

		$result       = json_decode( $body );
		$is_connected = ! empty( $result->connected );
		$message      = $result->message . ': ' . wp_remote_retrieve_response_code( $response );

		if ( $is_connected ) {
			return self::passing_test( array( 'name' => $name ) );
		}

		return self::connection_failing_test( $name, $message );
	}

	/**
	 * Tests the port number to ensure it is an expected value.
	 *
	 * @return array
	 */
	protected function test__server_port_value() {
		$name = 'test__server_port_value';

		if ( ! isset( $_SERVER['HTTP_X_FORWARDED_PORT'] ) && ! isset( $_SERVER['SERVER_PORT'] ) ) {
			return self::skipped_test(
				array(
					'name'              => $name,
					'short_description' => __( 'The server port values are not defined. This is most common when running PHP via a CLI.', 'jetpack-connection' ),
				)
			);
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
			return self::skipped_test( array( 'name' => $name ) );
		}

		if ( is_ssl() && in_array( $server_port, $https_ports, true ) ) {
			return self::passing_test( array( 'name' => $name ) );
		} elseif ( in_array( $server_port, $http_ports, true ) ) {
			return self::passing_test( array( 'name' => $name ) );
		}

		if ( is_ssl() ) {
			$needed_constant = 'JETPACK_SIGNATURE__HTTPS_PORT';
		} else {
			$needed_constant = 'JETPACK_SIGNATURE__HTTP_PORT';
		}
		return self::failing_test(
			array(
				'name'              => $name,
				'short_description' => sprintf(
					/* translators: %1$s - a PHP code snippet */
					__(
						'The server port value is unexpected.
					Try adding the following to your wp-config.php file: %1$s',
						'jetpack-connection'
					),
					"define( '$needed_constant', $server_port )"
				),
			)
		);
	}
}
