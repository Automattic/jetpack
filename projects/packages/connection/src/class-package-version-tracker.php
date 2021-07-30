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
	public static function maybe_update_package_versions() {
		/**
		 * Obtains the package versions.
		 *
		 * @since x.x.x
		 *
		 * @param array An associative array containing the package versions with the package slugs as the keys.
		 */
		$package_versions = apply_filters( 'jetpack_package_versions', array() );

		$versions_option = get_option( self::PACKAGE_VERSION_OPTION, array() );

		$site_id = \Jetpack_Options::get_option( 'id' );

		if ( count( array_diff_assoc( $package_versions, $versions_option ) ) || count( array_diff_assoc( $versions_option, $package_versions ) ) ) {
			update_option( self::PACKAGE_VERSION_OPTION, $package_versions );

			$body = wp_json_encode(
				array(
					'package_versions' => $package_versions,
				)
			);

			$wpcom_response = Client::wpcom_json_api_request_as_blog(
				sprintf( '/sites/%d/jetpack-package-versions', $site_id ),
				'2',
				array(
					'headers' => array( 'content-type' => 'application/json' ),
					'method'  => 'POST',
				),
				$body,
				'wpcom'
			);
		}
	}
}
