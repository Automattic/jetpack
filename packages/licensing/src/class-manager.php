<?php
/**
 * A Terms of Service class for Jetpack.
 *
 * @package automattic/jetpack-licensing
 */

namespace Automattic\Jetpack\Licensing;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Jetpack_IXR_ClientMulticall;
use Jetpack_Options;
use WP_Error;

/**
 * Class Manager.
 *
 * @since ??
 *
 * Helper class that is responsible for attaching licenses to the current site.
 */
class Manager {
	/**
	 * Name of the WordPress option that holds all known Jetpack licenses.
	 *
	 * @const string
	 */
	const LICENSES_OPTION_NAME = 'jetpack_licenses';

	/**
	 * Holds the singleton instance of this class.
	 *
	 * @var self
	 */
	protected static $instance = false;

	/**
	 * Singleton.
	 *
	 * @static
	 */
	public static function instance() {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Initialize.
	 *
	 * @return void
	 */
	public function initialize() {
		add_action( 'update_option_' . self::LICENSES_OPTION_NAME, array( $this, 'attach_stored_licenses' ) );
		add_action( 'jetpack_authorize_ending_authorized', array( $this, 'attach_stored_licenses_on_connection' ) );
	}

	/**
	 * Get Jetpack connection manager instance.
	 *
	 * @return Connection_Manager
	 */
	protected function connection() {
		return new Connection_Manager();
	}

	/**
	 * Make an authenticated WP.com API multicall request instance.
	 *
	 * @param array $client_args IXR client arguments.
	 * @return Jetpack_IXR_ClientMulticall
	 */
	protected function request( $client_args ) {
		return new Jetpack_IXR_ClientMulticall( $client_args );
	}

	/**
	 * Get all stored licenses.
	 *
	 * @return string[] License keys.
	 */
	public function stored_licenses() {
		$licenses = (array) get_option( self::LICENSES_OPTION_NAME, array() );
		$licenses = array_filter( $licenses, 'is_scalar' );
		$licenses = array_map( 'strval', $licenses );
		$licenses = array_filter( $licenses );

		return $licenses;
	}

	/**
	 * Attach the given licenses.
	 *
	 * @param string[] $licenses Licenses to attach.
	 * @return array|WP_Error Results for each license (which may include WP_Error instances) or a WP_Error instance.
	 */
	public function attach_licenses( array $licenses ) {
		if ( ! $this->connection()->is_active() ) {
			return new WP_Error( 'not_connected', __( 'Jetpack is not connected.', 'jetpack' ) );
		}

		if ( empty( $licenses ) ) {
			return array();
		}

		$xml = $this->request( array( 'user_id' => JETPACK_MASTER_USER ) );

		foreach ( $licenses as $license ) {
			$xml->addCall( 'jetpack.attachLicense', $license );
		}

		$xml->query();

		if ( $xml->isError() ) {
			$error = new WP_Error( 'request_failed', __( 'License attach request failed.', 'jetpack' ) );
			$error->add( $xml->getErrorCode(), $xml->getErrorMessage() );
			return $error;
		}

		$results = array_map(
			function ( $response ) {
				if ( isset( $response['faultCode'] ) || isset( $response['faultString'] ) ) {
					return new WP_Error( $response['faultCode'], $response['faultString'] );
				}

				return $response;
			},
			(array) $xml->getResponse()
		);

		return $results;
	}

	/**
	 * Attach all stored licenses.
	 *
	 * @return array|WP_Error Results for each license (which may include WP_Error instances) or a WP_Error instance.
	 */
	public function attach_stored_licenses() {
		$licenses = $this->stored_licenses();
		$results  = $this->attach_licenses( $licenses );

		if ( is_wp_error( $results ) ) {
			if ( 'request_failed' === $results->get_error_code() ) {
				/**
				 * Fires when the request to attach all stored licenses fails.
				 *
				 * @since ??
				 *
				 * @param WP_Error $error Request error.
				 */
				do_action( 'jetpack_licensing_stored_licenses_request_failed', $results );
			}
		} else {
			$errors = array();

			foreach ( $results as $index => $result ) {
				if ( isset( $licenses[ $index ] ) && is_wp_error( $result ) ) {
					$errors[] = array(
						'error'   => $result,
						'license' => $licenses[ $index ],
					);
				}
			}

			if ( ! empty( $errors ) ) {
				/**
				 * Fires when one or more stored licenses fail to be attached.
				 *
				 * @param array $errors Array of attaching errors and the licenses they are for.
				 * @since ??
				 */
				do_action( 'jetpack_licensing_stored_licenses_attaching_failed', $errors );
			}
		}

		return $results;
	}

	/**
	 * Attach all stored licenses during connection flow for the master user.
	 *
	 * @return void
	 */
	public function attach_stored_licenses_on_connection() {
		$master_user_id = Jetpack_Options::get_option( 'master_user' );
		$is_master_user = $master_user_id && get_current_user_id() === $master_user_id;

		if ( $is_master_user ) {
			$this->attach_stored_licenses();
		}
	}
}
