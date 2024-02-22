<?php
/**
 * The Package_Version_Tracker class.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

/**
 * The Package_Version_Tracker class.
 */
class Package_Version_Tracker {

	const PACKAGE_VERSION_OPTION = 'jetpack_package_versions';

	/**
	 * The cache key for storing a failed request to update remote package versions.
	 * The caching logic is that when a failed request occurs, we cache it temporarily
	 * with a set expiration time.
	 * Only after the key has expired, we'll be able to repeat a remote request.
	 * This also implies that the cached value is redundant, however we chose the datetime
	 * of the failed request to avoid using booleans.
	 */
	const CACHED_FAILED_REQUEST_KEY = 'jetpack_failed_update_remote_package_versions';

	/**
	 * The min time difference in seconds for attempting to
	 * update remote tracked package versions after a failed remote request.
	 */
	const CACHED_FAILED_REQUEST_EXPIRATION = 1 * HOUR_IN_SECONDS;

	/**
	 * Transient key for rate limiting the package version requests;
	 */
	const RATE_LIMITER_KEY = 'jetpack_update_remote_package_last_query';

	/**
	 * Only allow one versions check (and request) per minute.
	 */
	const RATE_LIMITER_TIMEOUT = MINUTE_IN_SECONDS;

	/**
	 * Uses the jetpack_package_versions filter to obtain the package versions from packages that need
	 * version tracking. If the package versions have changed, updates the option and notifies WPCOM.
	 */
	public function maybe_update_package_versions() {
		// Do not run too early or all the modules may not be loaded.
		if ( ! did_action( 'init' ) ) {
			return;
		}

		// The version check is being rate limited.
		if ( $this->is_rate_limiting() ) {
			return;
		}

		/**
		 * Obtains the package versions.
		 *
		 * @since 1.30.2
		 *
		 * @param array An associative array of Jetpack package slugs and their corresponding versions as key/value pairs.
		 */
		$filter_versions = apply_filters( 'jetpack_package_versions', array() );

		if ( ! is_array( $filter_versions ) ) {
			return;
		}

		$option_versions = get_option( self::PACKAGE_VERSION_OPTION, array() );

		foreach ( $filter_versions as $package => $version ) {
			if ( ! is_string( $package ) || ! is_string( $version ) ) {
				unset( $filter_versions[ $package ] );
			}
		}

		if ( ! is_array( $option_versions )
			|| count( array_diff_assoc( $filter_versions, $option_versions ) )
			|| count( array_diff_assoc( $option_versions, $filter_versions ) )
		) {
			$this->update_package_versions_option( $filter_versions );
		}
	}

	/**
	 * Updates the package versions option.
	 *
	 * @param array $package_versions The package versions.
	 */
	protected function update_package_versions_option( $package_versions ) {
		if ( ! $this->is_sync_enabled() ) {
			$this->update_package_versions_via_remote_request( $package_versions );
			return;
		}

		update_option( self::PACKAGE_VERSION_OPTION, $package_versions );
	}

	/**
	 * Whether Jetpack Sync is enabled.
	 *
	 * @return boolean true if Sync is present and enabled, false otherwise
	 */
	protected function is_sync_enabled() {
		if ( class_exists( 'Automattic\Jetpack\Sync\Settings' ) && \Automattic\Jetpack\Sync\Settings::is_sync_enabled() ) {

			return true;
		}

		return false;
	}

	/**
	 * Fallback for updating the package versions via a remote request when Sync is not present.
	 *
	 * Updates the package versions as follows:
	 *   - Sends the updated package versions to wpcom.
	 *   - Updates the 'jetpack_package_versions' option.
	 *
	 * @param array $package_versions The package versions.
	 */
	protected function update_package_versions_via_remote_request( $package_versions ) {
		$connection = new Manager();
		if ( ! $connection->is_connected() ) {
			return;
		}

		$site_id = \Jetpack_Options::get_option( 'id' );

		$last_failed_attempt_within_hour = get_transient( self::CACHED_FAILED_REQUEST_KEY );

		if ( $last_failed_attempt_within_hour ) {
			return;
		}

		$body = wp_json_encode(
			array(
				'package_versions' => $package_versions,
			)
		);

		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/jetpack-package-versions', $site_id ),
			'2',
			array(
				'headers' => array( 'content-type' => 'application/json' ),
				'method'  => 'POST',
			),
			$body,
			'wpcom'
		);

		if ( 200 === wp_remote_retrieve_response_code( $response ) ) {
			update_option( self::PACKAGE_VERSION_OPTION, $package_versions );
		} else {
			set_transient( self::CACHED_FAILED_REQUEST_KEY, time(), self::CACHED_FAILED_REQUEST_EXPIRATION );
		}
	}

	/**
	 * Check if version check is being rate limited, and update the rate limiting transient if needed.
	 *
	 * @return bool
	 */
	private function is_rate_limiting() {
		if ( get_transient( static::RATE_LIMITER_KEY ) ) {
			return true;
		}

		set_transient( static::RATE_LIMITER_KEY, time(), static::RATE_LIMITER_TIMEOUT );

		return false;
	}
}
