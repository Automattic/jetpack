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
	 * Uses the jetpack_package_versions filter to obtain the package versions from packages that need
	 * version tracking. If the package versions have changed, updates the option and notifies WPCOM.
	 */
	public function maybe_update_package_versions() {
		/**
		 * Obtains the package versions.
		 *
		 * @since $$next_version$$
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
	 * Updates the package versions:
	 *   - Sends the updated package versions to wpcom.
	 *   - Updates the 'jetpack_package_versions' option.
	 *
	 * @param array $package_versions The package versions.
	 */
	protected function update_package_versions_option( $package_versions ) {
		$site_id = \Jetpack_Options::get_option( 'id' );

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
		}
	}

}
