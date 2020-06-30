<?php
/**
 * Collection of tests to run on the Jetpack connection locally.
 *
 * @package Jetpack
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Connection\Utils as Connection_Utils;
use Automattic\Jetpack\Sync\Modules;
use Automattic\Jetpack\Sync\Settings as Sync_Settings;
use Automattic\Jetpack\Sync\Health as Sync_Health;
use Automattic\Jetpack\Sync\Sender as Sync_Sender;
use Automattic\Jetpack\Redirect;

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
		 * @since 8.3.0 Passes the Jetpack_Cxn_Tests instance.
		 */
		do_action( 'jetpack_connection_tests_loaded', $this );

		/**
		 * Determines if the WP.com testing suite should be included.
		 *
		 * @since 7.1.0
		 * @since 8.1.0 Default false.
		 *
		 * @param bool $run_test To run the WP.com testing suite. Default false.
		 */
		if ( apply_filters( 'jetpack_debugger_run_self_test', false ) ) {
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
		return Jetpack::is_active() && ! ( new Status() )->is_offline_mode();
	}

	/**
	 * Retrieve the `blog_token` if it exists.
	 *
	 * @return object|false
	 */
	protected function helper_get_blog_token() {
		return Jetpack::connection()->get_access_token();
	}

	/**
	 * Returns a support url based on using a development version.
	 */
	protected function helper_get_support_url() {
		return Jetpack::is_development_version()
			? Redirect::get_url( 'jetpack-contact-support-beta-group' )
			: Redirect::get_url( 'jetpack-contact-support' );
	}

	/**
	 * Gets translated support text.
	 */
	protected function helper_get_support_text() {
		return __( 'Please contact Jetpack support.', 'jetpack' );
	}

	/**
	 * Gets translated text to enable outbound requests.
	 *
	 * @param string $protocol Either 'HTTP' or 'HTTPS'.
	 *
	 * @return string The translated text.
	 */
	protected function helper_enable_outbound_requests( $protocol ) {
		return sprintf(
			/* translators: %1$s - request protocol, either http or https */
			__(
				'Your server did not successfully connect to the Jetpack server using %1$s
				Please ask your hosting provider to confirm your server can make outbound requests to jetpack.com.',
				'jetpack'
			),
			$protocol
		);
	}

	/**
	 * Returns 30 for use with a filter.
	 *
	 * To allow time for WP.com to run upstream testing, this function exists to increase the http_request_timeout value
	 * to 30.
	 *
	 * @return int 30
	 */
	public static function increase_timeout() {
		return 30; // seconds.
	}

	/**
	 * The test verifies the blog token exists.
	 *
	 * @return array
	 */
	protected function test__blog_token_if_exists() {
		$blog_token = $this->helper_get_blog_token();

		if ( $blog_token ) {
			$result = self::passing_test( array( 'name' => __FUNCTION__ ) );
		} else {
			$result = self::failing_test(
				array(
					'name'              => __FUNCTION__,
					'short_description' => __( 'Blog token is missing.', 'jetpack' ),
					'action'            => admin_url( 'admin.php?page=jetpack#/dashboard' ),
					'action_label'      => __( 'Disconnect your site from WordPress.com, and connect it again.', 'jetpack' ),
				)
			);
		}

		return $result;
	}

	/**
	 * Test if Jetpack is connected.
	 */
	protected function test__check_if_connected() {
		$name = __FUNCTION__;

		if ( ! $this->helper_get_blog_token() ) {
			return self::skipped_test(
				array(
					'name'              => $name,
					'short_description' => __( 'Blog token is missing.', 'jetpack' ),
				)
			);
		}

		if ( $this->helper_is_jetpack_connected() ) {
			$result = self::passing_test(
				array(
					'name'             => $name,
					'label'            => __( 'Your site is connected to Jetpack', 'jetpack' ),
					'long_description' => sprintf(
						'<p>%1$s</p>' .
						'<p><span class="dashicons pass"><span class="screen-reader-text">%2$s</span></span> %3$s</p>',
						__( 'A healthy connection ensures Jetpack essential services are provided to your WordPress site, such as Stats and Site Security.', 'jetpack' ),
						/* translators: Screen reader text indicating a test has passed */
						__( 'Passed', 'jetpack' ),
						__( 'Your site is connected to Jetpack.', 'jetpack' )
					),
				)
			);
		} elseif ( ( new Status() )->is_offline_mode() ) {
			$result = self::skipped_test(
				array(
					'name'              => $name,
					'short_description' => __( 'Jetpack is in Offline Mode:', 'jetpack' ) . ' ' . Jetpack::development_mode_trigger_text(),
				)
			);
		} else {
			$result = self::failing_test(
				array(
					'name'             => $name,
					'label'            => __( 'Your site is not connected to Jetpack', 'jetpack' ),
					'action'           => admin_url( 'admin.php?page=jetpack#/dashboard' ),
					'action_label'     => __( 'Reconnect your site now', 'jetpack' ),
					'long_description' => sprintf(
						'<p>%1$s</p>' .
						'<p><span class="dashicons fail"><span class="screen-reader-text">%2$s</span></span> %3$s<strong> %4$s</strong></p>',
						__( 'A healthy connection ensures Jetpack essential services are provided to your WordPress site, such as Stats and Site Security.', 'jetpack' ),
						/* translators: screen reader text indicating a test failed */
						__( 'Error', 'jetpack' ),
						__( 'Your site is not connected to Jetpack.', 'jetpack' ),
						__( 'We recommend reconnecting Jetpack.', 'jetpack' )
					),
				)
			);
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
			return self::skipped_test(
				array(
					'name'              => $name,
					'short_description' => __( 'Jetpack is not connected. No master user to check.', 'jetpack' ),
				)
			);
		}
		$local_user = $this->helper_retrieve_local_master_user();

		if ( $local_user->exists() ) {
			$result = self::passing_test( array( 'name' => $name ) );
		} else {
			$result = self::failing_test(
				array(
					'name'              => $name,
					'short_description' => __( 'The user who setup the Jetpack connection no longer exists on this site.', 'jetpack' ),
					'action_label'      => __( 'Please disconnect and reconnect Jetpack.', 'jetpack' ),
					'action'            => Redirect::get_url( 'jetpack-support-reconnecting-reinstalling-jetpack' ),
				)
			);
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
			return self::skipped_test(
				array(
					'name'              => $name,
					'short_description' => __( 'Jetpack is not connected.', 'jetpack' ),
				)
			);
		}
		$master_user = $this->helper_retrieve_local_master_user();

		if ( user_can( $master_user, 'manage_options' ) ) {
			$result = self::passing_test( array( 'name' => $name ) );
		} else {
			$result = self::failing_test(
				array(
					'name'              => $name,
					/* translators: a WordPress username */
					'short_description' => sprintf( __( 'The user (%s) who setup the Jetpack connection is not an administrator.', 'jetpack' ), $master_user->user_login ),
					'action_label'      => __( 'Either upgrade the user or disconnect and reconnect Jetpack.', 'jetpack' ),
					'action'            => Redirect::get_url( 'jetpack-support-reconnecting-reinstalling-jetpack' ),
				)
			);
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
			$result = self::passing_test( array( 'name' => $name ) );
		} else {
			$result = self::failing_test(
				array(
					'name'              => $name,
					'label'             => __( 'PHP XML manipulation libraries are not available.', 'jetpack' ),
					'short_description' => __( 'Please ask your hosting provider to refer to our server requirements and enable PHP\'s XML module.', 'jetpack' ),
					'action_label'      => __( 'View our server requirements', 'jetpack' ),
					'action'            => Redirect::get_url( 'jetpack-support-server-requirements' ),
				)
			);
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
			$result = self::passing_test( array( 'name' => $name ) );
		} else {
			$result = self::failing_test(
				array(
					'name'              => $name,
					'short_description' => $this->helper_enable_outbound_requests( 'HTTP' ),
				)
			);
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
			$result = self::passing_test( array( 'name' => $name ) );
		} else {
			$result = self::failing_test(
				array(
					'name'              => $name,
					'short_description' => $this->helper_enable_outbound_requests( 'HTTPS' ),
				)
			);
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
			return self::skipped_test(
				array(
					'name'              => $name,
					'short_description' => __( 'Jetpack is not connected.', 'jetpack' ),
				)
			);
		}
		$identity_crisis = Jetpack::check_identity_crisis();

		if ( ! $identity_crisis ) {
			$result = self::passing_test( array( 'name' => $name ) );
		} else {
			$result = self::failing_test(
				array(
					'name'              => $name,
					'short_description' => sprintf(
						/* translators: Two URLs. The first is the locally-recorded value, the second is the value as recorded on WP.com. */
						__( 'Your url is set as `%1$s`, but your WordPress.com connection lists it as `%2$s`!', 'jetpack' ),
						$identity_crisis['home'],
						$identity_crisis['wpcom_home']
					),
					'action_label'      => $this->helper_get_support_text(),
					'action'            => $this->helper_get_support_url(),
				)
			);
		}
		return $result;
	}

	/**
	 * Tests connection status against wp.com's test-connection endpoint.
	 *
	 * @todo: Compare with the wpcom_self_test. We only need one of these.
	 *
	 * @return array Test results.
	 */
	protected function test__wpcom_connection_test() {
		$name = __FUNCTION__;

		$status = new Status();
		if ( ! Jetpack::is_active() || $status->is_offline_mode() || $status->is_staging_site() || ! $this->pass ) {
			return self::skipped_test( array( 'name' => $name ) );
		}

		add_filter( 'http_request_timeout', array( 'Jetpack_Cxn_Tests', 'increase_timeout' ) );
		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/jetpack-blogs/%d/test-connection', Jetpack_Options::get_option( 'id' ) ),
			Client::WPCOM_JSON_API_VERSION
		);
		remove_filter( 'http_request_timeout', array( 'Jetpack_Cxn_Tests', 'increase_timeout' ) );

		if ( is_wp_error( $response ) ) {
			return self::failing_test(
				array(
					'name'              => $name,
					/* translators: %1$s is the error code, %2$s is the error message */
					'short_description' => sprintf( __( 'Connection test failed (#%1$s: %2$s)', 'jetpack' ), $response->get_error_code(), $response->get_error_message() ),
					'action_label'      => $this->helper_get_support_text(),
					'action'            => $this->helper_get_support_url(),
				)
			);
		}

		$body = wp_remote_retrieve_body( $response );
		if ( ! $body ) {
			return self::failing_test(
				array(
					'name'              => $name,
					'short_description' => __( 'Connection test failed (empty response body)', 'jetpack' ) . wp_remote_retrieve_response_code( $response ),
					'action_label'      => $this->helper_get_support_text(),
					'action'            => $this->helper_get_support_url(),
				)
			);
		}

		if ( 404 === wp_remote_retrieve_response_code( $response ) ) {
			return self::skipped_test(
				array(
					'name'              => $name,
					'short_description' => __( 'The WordPress.com API returned a 404 error.', 'jetpack' ),
				)
			);
		}

		$result       = json_decode( $body );
		$is_connected = ! empty( $result->connected );
		$message      = $result->message . ': ' . wp_remote_retrieve_response_code( $response );

		if ( $is_connected ) {
			return self::passing_test( array( 'name' => $name ) );
		} else {
			return self::failing_test(
				array(
					'name'              => $name,
					'short_description' => $message,
					'action_label'      => $this->helper_get_support_text(),
					'action'            => $this->helper_get_support_url(),
				)
			);
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
			return self::skipped_test(
				array(
					'name'              => $name,
					'short_description' => __( 'The server port values are not defined. This is most common when running PHP via a CLI.', 'jetpack' ),
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
			return self::skipped_test( array( 'name' => $name ) ); // Not currently testing for this situation.
		}

		if ( is_ssl() && in_array( $server_port, $https_ports, true ) ) {
			return self::passing_test( array( 'name' => $name ) );
		} elseif ( in_array( $server_port, $http_ports, true ) ) {
			return self::passing_test( array( 'name' => $name ) );
		} else {
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
							'jetpack'
						),
						"define( '$needed_constant', $server_port )"
					),
				)
			);
		}
	}

	/**
	 * Full Sync Health Test.
	 *
	 * Sync Disabled: Results in a skipped test
	 * Not In Progress : Results in a skipped test
	 * In Progress: Results in skipped test w/ status in CLI
	 */
	protected function test__full_sync_health() {

		$name = __FUNCTION__;

		if ( ! $this->helper_is_jetpack_connected() ) {
			// If the site is not connected, there is no point in testing Sync health.
			return self::skipped_test(
				array(
					'name'                => $name,
					'show_in_site_health' => false,
				)
			);
		}

		// Sync is enabled.
		if ( Sync_Settings::is_sync_enabled() ) {

			// Get Full Sync Progress.
			$full_sync_module = Modules::get_module( 'full-sync' );
			$progress_percent = $full_sync_module ? $full_sync_module->get_sync_progress_percentage() : null;

			// Full Sync in Progress.
			if ( $progress_percent ) {

				return self::informational_test(
					array(
						'name'              => $name,
						'label'             => __( 'Jetpack is performing a full sync of your site', 'jetpack' ),
						'severity'          => 'recommended',
						/* translators: placeholder is a percentage number. */
						'short_description' => sprintf( __( 'Jetpack is performing a full sync of your site. Current Progress: %1$d %%', 'jetpack' ), $progress_percent ),
						'long_description'  => sprintf(
							'<p>%1$s</p><p><span class="dashicons dashicons-update"><span class="screen-reader-text">%2$s</span></span> %3$s</p><div class="jetpack-sync-progress-ui"><div class="jetpack-sync-progress-label"></div><div class="jetpack-sync-progress-bar"></div></div>',
							__( 'The information synced by Jetpack ensures that Jetpack Search, Related Posts and other features are aligned with your site’s current content.', 'jetpack' ), /* translators: screen reader text indicating data is updating. */
							__( 'Updating', 'jetpack' ),
							__( 'Jetpack is currently performing a full sync of your site data.', 'jetpack' )
						),
					)
				);

			} else {

				// no Full Sync in Progress.
				return self::skipped_test(
					array(
						'name'                => $name,
						'show_in_site_health' => false,
					)
				);

			}
		} else {

			// If sync is not enabled no Full Sync can occur.
			return self::skipped_test(
				array(
					'name'                => $name,
					'show_in_site_health' => false,
				)
			);

		}

	}

	/**
	 * Sync Health Tests.
	 *
	 * Disabled: Results in a failing test (recommended)
	 * Delayed: Results in failing test (recommended)
	 * Error: Results in failing test (critical)
	 */
	protected function test__sync_health() {

		$name = __FUNCTION__;

		if ( ! $this->helper_is_jetpack_connected() ) {
			// If the site is not connected, there is no point in testing Sync health.
			return self::skipped_test(
				array(
					'name'                => $name,
					'show_in_site_health' => false,
				)
			);
		}

		// Sync is enabled.
		if ( Sync_Settings::is_sync_enabled() ) {

			if ( Sync_Health::get_status() === Sync_Health::STATUS_OUT_OF_SYNC ) {
				/*
				 * Sync has experienced Data Loss.
				 */
				$description  = '<p>';
				$description .= esc_html__( 'The information synced by Jetpack ensures that Jetpack Search, Related Posts and other features are aligned with your site’s current content.', 'jetpack' );
				$description .= '</p>';
				$description .= '<p>';
				$description .= sprintf(
					'<span class="dashicons fail"><span class="screen-reader-text">%1$s</span></span> ',
					esc_html__( 'Error', 'jetpack' )
				);
				$description .= wp_kses(
					__( 'Jetpack has detected an error while syncing your site. <strong>We recommend <a id="full_sync_request_link" href="#">a full sync</a> to align Jetpack with your site data.</strong>', 'jetpack' ),
					array(
						'a'      => array(
							'id'   => array(),
							'href' => array(),
						),
						'strong' => array(),
					)
				);
				$description .= '</p>';

				return self::failing_test(
					array(
						'name'              => $name,
						'label'             => __( 'Jetpack has detected an error syncing your site.', 'jetpack' ),
						'severity'          => 'critical',
						'action'            => Redirect::get_url( 'jetpack-contact-support' ),
						'action_label'      => __( 'Contact Jetpack Support', 'jetpack' ),
						'short_description' => __( 'Jetpack has detected an error while syncing your site. We recommend a full sync to align Jetpack with your site data.', 'jetpack' ),
						'long_description'  => $description,
					)
				);

			} else {
				// Get the Sync Queue.
				$sender     = Sync_Sender::get_instance();
				$sync_queue = $sender->get_sync_queue();

				// lag exceeds 5 minutes.
				if ( $sync_queue->lag() > 5 * MINUTE_IN_SECONDS ) {

					$description  = '<p>';
					$description .= esc_html__( 'The information synced by Jetpack ensures that Jetpack Search, Related Posts and other features are aligned with your site’s current content.', 'jetpack' );
					$description .= '</p>';
					$description .= '<p>';
					$description .= sprintf(
						'<span class="dashicons dashicons-clock" style="color: orange;"><span class="screen-reader-text">%1$s</span></span> ',
						/* translators: name, used to describe a clock icon. */
						esc_html__( 'Clock', 'jetpack' )
					);
					$description .= wp_kses(
						sprintf(
							/* translators: placeholder is a number of minutes. */
							_n(
								'Jetpack has identified a delay while syncing individual content updates. Certain features might be slower than usual, but this is only temporary while sync catches up with recent changes to your site. <strong>We’re seeing a current delay of %1$d minute.</strong>',
								'Jetpack has identified a delay while syncing individual content updates. Certain features might be slower than usual, but this is only temporary while sync catches up with recent changes to your site. <strong>We’re seeing a current delay of %1$d minutes.</strong>',
								intval( $sync_queue->lag() / MINUTE_IN_SECONDS ),
								'jetpack'
							),
							number_format_i18n( $sync_queue->lag() / MINUTE_IN_SECONDS )
						),
						array( 'strong' => array() )
					);
					$description .= '</p>';

					return self::informational_test(
						array(
							'name'              => $name,
							'label'             => __( 'Jetpack is experiencing a delay syncing your site.', 'jetpack' ),
							'severity'          => 'recommended',
							'action'            => null,
							'action_label'      => null,
							'short_description' => __( 'Jetpack is experiencing a delay syncing your site.', 'jetpack' ),
							'long_description'  => $description,
						)
					);

				} else {

					// Sync is Healthy.
					return self::passing_test( array( 'name' => $name ) );

				}
			}
		} else {
			/*
			 * Sync is disabled.
			 */

			$description  = '<p>';
			$description .= esc_html__( 'The information synced by Jetpack ensures that Jetpack Search, Related Posts and other features are aligned with your site’s current content.', 'jetpack' );
			$description .= '</p>';
			$description .= '<p>';
			$description .= __( 'Developers may enable / disable syncing using the Sync Settings API.', 'jetpack' );
			$description .= '</p>';
			$description .= '<p>';
			$description .= sprintf(
				'<span class="dashicons fail"><span class="screen-reader-text">%1$s</span></span> ',
				esc_html__( 'Error', 'jetpack' )
			);
			$description .= wp_kses(
				__( 'Jetpack Sync has been disabled on your site. Without it, certain Jetpack features will not work. <strong>We recommend enabling Sync.</strong>', 'jetpack' ),
				array( 'strong' => array() )
			);
			$description .= '</p>';

			return self::failing_test(
				array(
					'name'              => $name,
					'label'             => __( 'Jetpack Sync has been disabled on your site.', 'jetpack' ),
					'severity'          => 'recommended',
					'action'            => 'https://github.com/Automattic/jetpack/blob/master/packages/sync/src/class-settings.php',
					'action_label'      => __( 'See Github for more on Sync Settings', 'jetpack' ),
					'short_description' => __( 'Jetpack Sync has been disabled on your site.', 'jetpack' ),
					'long_description'  => $description,
				)
			);

		}

	}

	/**
	 * Calls to WP.com to run the connection diagnostic testing suite.
	 *
	 * Intentionally added last as it will be skipped if any local failed conditions exist.
	 *
	 * @since 7.1.0
	 * @since 7.9.0 Timeout waiting for a WP.com response no longer fails the test. Test is marked skipped instead.
	 *
	 * @return array Test results.
	 */
	protected function last__wpcom_self_test() {
		$name = 'test__wpcom_self_test';

		$status = new Status();
		if ( ! Jetpack::is_active() || $status->is_offline_mode() || $status->is_staging_site() || ! $this->pass ) {
			return self::skipped_test( array( 'name' => $name ) );
		}

		$self_xml_rpc_url = site_url( 'xmlrpc.php' );

		$testsite_url = Connection_Utils::fix_url_for_bad_hosts( JETPACK__API_BASE . 'testsite/1/?url=' );

		// Using PHP_INT_MAX - 1 so that there is still a way to override this if needed and since it only impacts this one call.
		add_filter( 'http_request_timeout', array( 'Jetpack_Cxn_Tests', 'increase_timeout' ), PHP_INT_MAX - 1 );

		$response = wp_remote_get( $testsite_url . $self_xml_rpc_url );

		remove_filter( 'http_request_timeout', array( 'Jetpack_Cxn_Tests', 'increase_timeout' ), PHP_INT_MAX - 1 );

		if ( 200 === wp_remote_retrieve_response_code( $response ) ) {
			return self::passing_test( array( 'name' => $name ) );
		} elseif ( is_wp_error( $response ) && false !== strpos( $response->get_error_message(), 'cURL error 28' ) ) { // Timeout.
			return self::skipped_test(
				array(
					'name'              => $name,
					'short_description' => __( 'The test timed out which may sometimes indicate a failure or may be a false failure.', 'jetpack' ),
				)
			);
		} else {
			return self::failing_test(
				array(
					'name'              => $name,
					'short_description' => sprintf(
						/* translators: %1$s - A debugging url */
						__( 'Jetpack.com detected an error on the WP.com Self Test. Visit the Jetpack Debug page for more info: %1$s, or contact support.', 'jetpack' ),
						Redirect::get_url( 'jetpack-support-debug', array( 'query' => 'url=' . rawurlencode( site_url() ) ) )
					),
					'action_label'      => $this->helper_get_support_text(),
					'action'            => $this->helper_get_support_url(),
				)
			);
		}
	}
}
