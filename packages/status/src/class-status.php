<?php
/**
 * A status class for Jetpack.
 *
 * @package automattic/jetpack-status
 */

namespace Automattic\Jetpack;

/**
 * Class Automattic\Jetpack\Status
 *
 * Used to retrieve information about the current status of Jetpack and the site overall.
 */
class Status {
	/**
	 * Is Jetpack in development (offline) mode?
	 *
	 * @return bool Whether Jetpack's development mode is active.
	 */
	public function is_development_mode() {
		$development_mode = false;
		$site_url         = site_url();

		if ( defined( '\\JETPACK_DEV_DEBUG' ) ) {
			$development_mode = constant( '\\JETPACK_DEV_DEBUG' );
		} elseif ( $site_url ) {
			$development_mode = false === strpos( $site_url, '.' );
		}

		/**
		 * Filters Jetpack's development mode.
		 *
		 * @see https://jetpack.com/support/development-mode/
		 *
		 * @since 2.2.1
		 *
		 * @param bool $development_mode Is Jetpack's development mode active.
		 */
		$development_mode = (bool) apply_filters( 'jetpack_development_mode', $development_mode );

		return $development_mode;
	}

	/**
	 * Whether this is a system with a multiple networks.
	 * Implemented since there is no core is_multi_network function.
	 * Right now there is no way to tell which network is the dominant network on the system.
	 *
	 * @return boolean
	 */
	public function is_multi_network() {
		global $wpdb;

		// If we don't have a multi site setup no need to do any more.
		if ( ! is_multisite() ) {
			return false;
		}

		$num_sites = $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->site}" );
		if ( $num_sites > 1 ) {
			return true;
		}

		return false;
	}

	/**
	 * Whether the current site is single user site.
	 *
	 * @return bool
	 */
	public function is_single_user_site() {
		global $wpdb;

		$some_users = get_transient( 'jetpack_is_single_user' );
		if ( false === $some_users ) {
			$some_users = $wpdb->get_var( "SELECT COUNT(*) FROM (SELECT user_id FROM $wpdb->usermeta WHERE meta_key = '{$wpdb->prefix}capabilities' LIMIT 2) AS someusers" );
			set_transient( 'jetpack_is_single_user', (int) $some_users, 12 * HOUR_IN_SECONDS );
		}
		return 1 === (int) $some_users;
	}

	/**
	 * If is a staging site.
	 *
	 * @todo Add IDC detection to a package.
	 *
	 * @return bool
	 */
	public function is_staging_site() {
		$is_staging = false;

		$known_staging = array(
			'urls'      => array(
				'#\.staging\.wpengine\.com$#i', // WP Engine.
				'#\.staging\.kinsta\.com$#i',   // Kinsta.com.
				'#\.stage\.site$#i',            // DreamPress.
			),
			'constants' => array(
				'IS_WPE_SNAPSHOT',      // WP Engine.
				'KINSTA_DEV_ENV',       // Kinsta.com.
				'WPSTAGECOACH_STAGING', // WP Stagecoach.
				'JETPACK_STAGING_MODE', // Generic.
			),
		);
		/**
		 * Filters the flags of known staging sites.
		 *
		 * @since 3.9.0
		 *
		 * @param array $known_staging {
		 *     An array of arrays that each are used to check if the current site is staging.
		 *     @type array $urls      URLs of staging sites in regex to check against site_url.
		 *     @type array $constants PHP constants of known staging/developement environments.
		 *  }
		 */
		$known_staging = apply_filters( 'jetpack_known_staging', $known_staging );

		if ( isset( $known_staging['urls'] ) ) {
			foreach ( $known_staging['urls'] as $url ) {
				if ( preg_match( $url, site_url() ) ) {
					$is_staging = true;
					break;
				}
			}
		}

		if ( isset( $known_staging['constants'] ) ) {
			foreach ( $known_staging['constants'] as $constant ) {
				if ( defined( $constant ) && constant( $constant ) ) {
					$is_staging = true;
				}
			}
		}

		// Last, let's check if sync is erroring due to an IDC. If so, set the site to staging mode.
		if ( ! $is_staging && method_exists( 'Jetpack', 'validate_sync_error_idc_option' ) && \Jetpack::validate_sync_error_idc_option() ) {
			$is_staging = true;
		}

		/**
		 * Filters is_staging_site check.
		 *
		 * @since 3.9.0
		 *
		 * @param bool $is_staging If the current site is a staging site.
		 */
		return apply_filters( 'jetpack_is_staging_site', $is_staging );
	}
}
