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
		 * @since x.x.x
		 *
		 * @param array An associative array of Jetpack package slugs and their corresponding versions as key/value pairs.
		 */
		$filter_versions = apply_filters( 'jetpack_package_versions', array() );

		if ( ! is_array( $filter_versions ) ) {
			return;
		}

		$option_versions = get_option( self::PACKAGE_VERSION_OPTION, array() );

		$package_versions = static::prep_package_versions( $option_versions, $filter_versions );

		if ( ! is_array( $option_versions ) ) {
			$this->update_package_versions_option( $package_versions );
			return;
		}

		if ( count( array_diff_assoc( $package_versions, $option_versions ) ) || count( array_diff_assoc( $option_versions, $package_versions ) ) ) {
			$this->update_package_versions_option( $package_versions );
		}
	}

	/**
	 * Prepares the package versions by verifying that the package versions provided by the filter are
	 * strings. If the filter provided a version that isn't a string, check whether the existing option version
	 * is a string and, if it is, use that.
	 *
	 * @param array $option_versions The package versions stored in the option.
	 * @param array $filter_versions The package versions provided by the filter.
	 *
	 * @return array The package versions.
	 */
	protected function prep_package_versions( $option_versions, $filter_versions ) {
		$new_versions = array();

		foreach ( $filter_versions as $package => $version ) {
			if ( ! is_string( $package ) ) {
				continue;
			}

			if ( is_string( $version ) ) {
				$new_versions[ $package ] = $version;
			} elseif ( isset( $option_versions[ $package ] ) && is_string( $option_versions[ $package ] ) ) {
				$new_versions[ $package ] = $option_versions[ $package ];
			}
		}

		return $new_versions;
	}

	/**
	 * Updates the package versions:
	 *   - Updates the 'jetpack_package_versions' option.
	 *   - Sends the updated package versions to wpcom.
	 *
	 * @param array $package_versions The package versions.
	 */
	protected function update_package_versions_option( $package_versions ) {
		update_option( self::PACKAGE_VERSION_OPTION, $package_versions );

		$site_id = \Jetpack_Options::get_option( 'id' );

		$body = wp_json_encode(
			array(
				'package_versions' => $package_versions,
			)
		);

		Client::wpcom_json_api_request_as_blog(
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
