<?php
/**
 * Jetpack Connection Status.
 *
 * Filters the Connection Status API response
 *
 * @package jetpack
 */

/**
 * Filters the Connection Status API response
 */
class Jetpack_Connection_Status {

	/**
	 * Initialize the main hooks.
	 */
	public static function init() {
		add_filter( 'jetpack_connection_status', array( __CLASS__, 'filter_connection_status' ) );
	}

	/**
	 * Filters the connection status API response of the Connection package and modifies isActive value expected by the UI.
	 *
	 * @param array $status An array containing the connection status data.
	 */
	public static function filter_connection_status( $status ) {

		$status['isActive'] = Jetpack::is_connection_ready();

		if ( ! empty( $status['offlineMode']['isActive'] ) ) {
			$status['offlineMode']['localEnvironment'] = self::detect_local_environment();
			$status['offlineMode']['hasInternet']      = self::has_internet_connectivity();
		}

		return $status;
	}

	/**
	 * Detect which local development tool is serving the site, if any.
	 *
	 * @return string|null Identifier of the local environment ('studio', 'ddev', 'lando',
	 *                     'docksal', 'serverpress'), or null when unknown.
	 */
	public static function detect_local_environment() {
		$environment = null;

		// WordPress Studio manages the site through a loader mu-plugin.
		if ( defined( 'WPMU_PLUGIN_DIR' ) && file_exists( WPMU_PLUGIN_DIR . '/99-studio-loader.php' ) ) {
			$environment = 'studio';
		} else {
			$site_url = site_url();
			$tools    = array(
				'ddev'        => '#\.ddev\.site(?::\d+)?$#i',
				'lando'       => '#\.lndo\.site(?::\d+)?$#i',
				'docksal'     => '#\.docksal(?:\.site)?(?::\d+)?$#i',
				'serverpress' => '#\.dev\.cc(?::\d+)?$#i',
			);
			foreach ( $tools as $tool => $pattern ) {
				if ( preg_match( $pattern, $site_url ) ) {
					$environment = $tool;
					break;
				}
			}
		}

		/**
		 * Filters the detected local development environment.
		 *
		 * @since 15.4
		 *
		 * @param string|null $environment Detected local environment identifier, or null when unknown.
		 */
		return apply_filters( 'jetpack_local_dev_environment', $environment );
	}

	/**
	 * Check whether the server can reach the internet, with a short-lived cache.
	 *
	 * Cached for 5 minutes when online, 1 minute when offline so recovery is
	 * noticed quickly. The request timeout is kept short to avoid slowing down
	 * the connection status endpoint.
	 *
	 * @return bool
	 */
	public static function has_internet_connectivity() {
		$cached = get_transient( 'jetpack_has_internet' );
		if ( false !== $cached ) {
			return 'yes' === $cached;
		}

		$response     = wp_remote_head(
			'https://jetpack.com/',
			array(
				'timeout'   => 3,
				'sslverify' => true,
			)
		);
		$has_internet = ! is_wp_error( $response );

		set_transient(
			'jetpack_has_internet',
			$has_internet ? 'yes' : 'no',
			$has_internet ? 5 * MINUTE_IN_SECONDS : MINUTE_IN_SECONDS
		);

		return $has_internet;
	}
}
