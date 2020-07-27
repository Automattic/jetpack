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
	 * @deprecated 8.8.0 Use Status->is_offline_mode().
	 *
	 * @return bool Whether Jetpack's offline mode is active.
	 */
	public function is_development_mode() {
		_deprecated_function( __FUNCTION__, 'Jetpack 8.8.0', 'Automattic\Jetpack\Status->is_offline_mode' );
		return $this->is_offline_mode();
	}

	/**
	 * Is Jetpack in offline mode?
	 *
	 * This was formerly called "Development Mode", but sites "in development" aren't always offline/localhost.
	 *
	 * @since 8.8.0
	 *
	 * @return bool Whether Jetpack's offline mode is active.
	 */
	public function is_offline_mode() {
		$offline_mode = false;

		if ( defined( '\\JETPACK_DEV_DEBUG' ) ) {
			$offline_mode = constant( '\\JETPACK_DEV_DEBUG' );
		} elseif ( defined( '\\WP_LOCAL_DEV' ) ) {
			$offline_mode = constant( '\\WP_LOCAL_DEV' );
		} elseif ( $this->is_local_site() ) {
			$offline_mode = true;
		}

		/**
		 * Filters Jetpack's offline mode.
		 *
		 * @see https://jetpack.com/support/development-mode/
		 * @todo Update documentation ^^.
		 *
		 * @since 2.2.1
		 * @deprecated 8.8.0
		 *
		 * @param bool $offline_mode Is Jetpack's offline mode active.
		 */
		$offline_mode = (bool) apply_filters_deprecated( 'jetpack_development_mode', array( $offline_mode ), '8.8.0', 'jetpack_offline_mode' );

		/**
		 * Filters Jetpack's offline mode.
		 *
		 * @see https://jetpack.com/support/development-mode/
		 * @todo Update documentation ^^.
		 *
		 * @since 8.8.0
		 *
		 * @param bool $offline_mode Is Jetpack's offline mode active.
		 */
		$offline_mode = (bool) apply_filters( 'jetpack_offline_mode', $offline_mode );

		return $offline_mode;
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
	 * If the site is a local site.
	 *
	 * @since 8.8.0
	 *
	 * @return bool
	 */
	public function is_local_site() {
		// Check for localhost and sites using an IP only first.
		$is_local = site_url() && false === strpos( site_url(), '.' );

		// Then check for usual usual domains used by local dev tools.
		$known_local = array(
			'#\.local$#i',
			'#\.localhost$#i',
			'#\.test$#i',
			'#\.docksal$#i',      // Docksal.
			'#\.docksal\.site$#i', // Docksal.
			'#\.dev\.cc$#i',       // ServerPress.
			'#\.lndo\.site$#i',    // Lando.
		);

		if ( ! $is_local ) {
			foreach ( $known_local as $url ) {
				if ( preg_match( $url, site_url() ) ) {
					$is_local = true;
					break;
				}
			}
		}

		/**
		 * Filters is_local_site check.
		 *
		 * @since 8.8.0
		 *
		 * @param bool $is_local If the current site is a local site.
		 */
		return apply_filters( 'jetpack_is_local_site', $is_local );
	}

	/**
	 * If is a staging site.
	 *
	 * @todo Add IDC detection to a package.
	 *
	 * @return bool
	 */
	public function is_staging_site() {
		// @todo Remove function_exists when WP 5.5 is the minimum version.
		// Core's wp_get_environment_type allows for a few specific options. We should default to bowing out gracefully for anything other than production.
		$is_staging = function_exists( 'wp_get_environment_type' ) && 'production' !== wp_get_environment_type();

		$known_staging = array(
			'urls'      => array(
				'#\.staging\.wpengine\.com$#i', // WP Engine.
				'#\.staging\.kinsta\.com$#i',   // Kinsta.com.
				'#\.kinsta\.cloud$#i',          // Kinsta.com.
				'#\.stage\.site$#i',            // DreamPress.
				'#\.newspackstaging\.com$#i',   // Newspack.
				'#\.pantheonsite\.io$#i',       // Pantheon.
				'#\.flywheelsites\.com$#i',     // Flywheel.
				'#\.flywheelstaging\.com$#i',   // Flywheel.
				'#\.cloudwaysapps\.com$#i',     // Cloudways.
				'#\.azurewebsites\.net$#i',     // Azure.
				'#\.wpserveur\.net$#i',         // WPServeur.
				'#\-liquidwebsites\.com$#i',    // Liquidweb.
			),
			'constants' => array(
				'IS_WPE_SNAPSHOT',      // WP Engine.
				'KINSTA_DEV_ENV',       // Kinsta.com.
				'WPSTAGECOACH_STAGING', // WP Stagecoach.
				'JETPACK_STAGING_MODE', // Generic.
				'WP_LOCAL_DEV',         // Generic.
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
