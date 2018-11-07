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
		parent::init();

		$methods = get_class_methods( 'Jetpack_Cxn_Tests' );

		foreach ( $methods as $method ) {
			if ( false === strpos( $method, 'test__' ) ) {
				continue;
			}
			$this->add_test( array( $this, $method ) );
		}

		/**
		 * Fires after loading default Jetpack Connection tests.
		 *
		 * Tests can be added by calling the $object->add_test( $callable ) format on this hook.
		 *
		 * @since 6.8.0
		 */
		do_action( 'jetpack_connection_tests_loaded' );
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
	 * Is Jetpack even connected?
	 *
	 * @todo Make this better. Just a quick hack for testing.
	 */
	protected function helper_is_jetpack_connected() {
		if ( Jetpack_Options::get_option( 'master_user' ) ) {
			return true;
		}
		return false;
	}

	/**
	 * Test if Jetpack is connected.
	 */
	protected function test__check_if_connected() {
		if ( $this->helper_is_jetpack_connected() ) {
			$result = $this->passing_test();
		} else {
			$result = array(
				'pass'       => false,
				'message'    => __( 'Jetpack is not connected.', 'jetpack' ),
				'resolution' => $this->serve_message( 'cycle_connection' ),
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
		if ( ! $this->helper_is_jetpack_connected() ) {
			return $result = $this->skipped_test(); // Skip test.
		}
		$local_user = $this->helper_retrieve_local_master_user();

		if ( $local_user->exists() ) {
			$result = $this->passing_test();
		} else {
			$result = array(
				'pass'       => false,
				'message'    => __( 'The user who setup the Jetpack connection no longer exists on this site.', 'jetpack' ),
				'resolution' => $this->serve_message( 'cycle_connection' ),
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
		if ( ! $this->helper_is_jetpack_connected() ) {
			return $result = $this->skipped_test(); // Skip test.
		}
		$master_user = $this->helper_retrieve_local_master_user();

		if ( user_can( $master_user, 'manage_options' ) ) {
			$result = $this->passing_test();
		} else {
			$result = array(
				'pass'       => false,
				'message'    => __( 'The user who setup the Jetpack connection is not an administrator.', 'jetpack' ),
				'resolution' => __( 'Either upgrade the user or cycle.', 'jetpack' ), // @todo: Provide the user name, link to the right places.
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
		if ( function_exists( 'xml_parser_create' ) ) {
			$result = $this->passing_test();
		} else {
			$result = array(
				'pass'       => false,
				'message'    => __( 'PHP XML manipluation libraries are not available.', 'jetpack' ),
				'resolution' => __( "Please ask your hosting provider to refer to our server requirements at https://jetpack.com/support/server-requirements/ and enable PHP's XML module.", 'jetpack' ),
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
		$request = wp_remote_get( preg_replace( '/^https:/', 'http:', JETPACK__API_BASE ) . 'test/1/' );
		$code    = wp_remote_retrieve_response_code( $request );

		if ( 200 === intval( $code ) ) {
			$result = $this->passing_test();
		} else {
			$result = array(
				'pass'       => false,
				'message'    => __( 'Your server did not successfully connect to the Jetpack server using HTTP', 'jetpack' ),
				'resolution' => __( 'Please ask your hosting provider to confirm your server can make outbound requests to jetpack.com', 'jetpack' ),
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
		$request = wp_remote_get( preg_replace( '/^http:/', 'https:', JETPACK__API_BASE ) . 'test/1/' );
		$code    = wp_remote_retrieve_response_code( $request );

		if ( 200 === intval( $code ) ) {
			$result = $this->passing_test();
		} else {
			$result = array(
				'pass'       => false,
				'message'    => __( 'Your server did not successfully connect to the Jetpack server using HTTPS', 'jetpack' ),
				'resolution' => __( 'Please ask your hosting provider to confirm your server can make outbound requests to jetpack.com', 'jetpack' ),
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
		$identity_crisis = Jetpack::check_identity_crisis();

		if ( ! $identity_crisis ) {
			$result = $this->passing_test();
		} else {
			$message = sprintf(
				/* translators: Two URLs. The first is the locally-recorded value, the second is the value as recorded on WP.com. */
				__( 'Your url is set as `%1$s`, but your WordPress.com connection lists it as `%2$s`!', 'jetpack' ),
				$identity_crisis['home'],
				$identity_crisis['wpcom_home']
			);
			$result = array(
				'pass'       => false,
				'message'    => $message,
				'resolution' => $this->serve_message(), // Contact support for now. @todo better message.
			);

		}
		return $result;
	}
}
