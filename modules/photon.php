<?php
/**
 * Module Name: Photon
 * Module Description: Serve images from our servers
 * Jumpstart Description: Mirrors and serves your images from our free and fast image CDN, improving your site’s performance with no additional load on your servers.
 * Sort Order: 25
 * Recommendation Order: 1
 * First Introduced: 2.0
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: Photos and Videos, Appearance, Recommended
 * Feature: Recommended, Jumpstart, Appearance
 * Additional Search Queries: photon, image, cdn, performance, speed
 */

Jetpack::dns_prefetch( array(
	'//i0.wp.com',
	'//i1.wp.com',
	'//i2.wp.com',
	'//c0.wp.com',
) );

Jetpack_Photon::instance();

class Jetpack_Photon_Static_Assets_CDN {
	public static function go() {
		add_action( 'wp_print_scripts', array( __CLASS__, 'cdnize_assets' ) );
		add_action( 'wp_print_styles',  array( __CLASS__, 'cdnize_assets' ) );
		add_action( 'wp_footer',        array( __CLASS__, 'cdnize_assets' ) );
	}

	public static function cdnize_assets() {
		global $wp_scripts, $wp_styles, $wp_version;

		$known_core_files = self::get_core_checksums();
		$site_url = trailingslashit( site_url() );
		foreach ( $wp_scripts->registered as $handle => $thing ) {
			if ( wp_startswith( $thing->src, 'https://c0.wp.com/' ) ) {
				continue;
			}
			$src = ltrim( str_replace( $site_url, '', $thing->src ), '/' );
			if ( isset( $known_core_files[ $src ] ) ) {
				$wp_scripts->registered[ $handle ]->src = sprintf('https://c0.wp.com/c/%1$s/%2$s', $wp_version, $src );
				wp_script_add_data( $handle, 'integrity', 'md5-' . base64_encode( $known_core_files[ $src ] ) );
			}
		}
		foreach ( $wp_styles->registered as $handle => $thing ) {
			if ( wp_startswith( $thing->src, 'https://c0.wp.com/' ) ) {
				continue;
			}
			$src = ltrim( str_replace( $site_url, '', $thing->src ), '/' );
			if ( isset( $known_core_files[ $src ] ) ) {
				$wp_styles->registered[ $handle ]->src = sprintf('https://c0.wp.com/c/%1$s/%2$s', $wp_version, $src );
				wp_style_add_data( $handle, 'integrity', 'md5-' . base64_encode( $known_core_files[ $src ] ) );
			}
		}

		$jetpack_version = JETPACK__VERSION;

		// If Jetpack is running a known version that we have the assets CDN'd for...
		// @todo Abstract this out to make it easy to run for multiple plugins, like WooCommerce.
		if ( in_array( $jetpack_version, self::get_plugin_versions( 'jetpack' ) ) ) {
			$jetpack_asset_hashes = self::get_plugin_checksums( $jetpack_version, 'jetpack' );
			$jetpack_directory_url = plugins_url( '/', JETPACK__PLUGIN_FILE );

			foreach ( $wp_scripts->registered as $handle => $thing ) {
				if ( wp_startswith( $thing->src, 'https://c0.wp.com/' ) ) {
					continue;
				}
				if ( wp_startswith( $thing->src, $jetpack_directory_url ) ) {
					$local_path = substr( $thing->src, strlen( $jetpack_directory_url ) );
					if ( isset( $jetpack_asset_hashes[ $local_path ] ) ) {
						$wp_scripts->registered[ $handle ]->src = sprintf('https://c0.wp.com/p/jetpack/%1$s/%2$s', $jetpack_version, $local_path );
						wp_script_add_data( $handle, 'integrity', 'sha256-' . base64_encode( $jetpack_asset_hashes[ $local_path ] ) );
					}
				}
			}
			foreach ( $wp_styles->registered as $handle => $thing ) {
				if ( wp_startswith( $thing->src, 'https://c0.wp.com/' ) ) {
					continue;
				}
				if ( wp_startswith( $thing->src, $jetpack_directory_url ) ) {
					$local_path = substr( $thing->src, strlen( $jetpack_directory_url ) );
					if ( isset( $jetpack_asset_hashes[ $local_path ] ) ) {
						$wp_styles->registered[ $handle ]->src = sprintf('https://c0.wp.com/p/jetpack/%1$s/%2$s', $jetpack_version, $local_path );
						wp_style_add_data( $handle, 'integrity', 'sha256-' . base64_encode( $jetpack_asset_hashes[ $local_path ] ) );
					}
				}
			}
		}
	}

	/**
	 * Returns MD5 checksums (boo, hiss)
	 * @todo CACHING
	 *
	 * @param null $version
	 * @param null $locale
	 * @return array|bool
	 */
	public static function get_core_checksums( $version = null, $locale = null ) {
		if ( empty( $version ) ) {
			$version = $GLOBALS['wp_version'];
		}
		if ( empty( $locale ) ) {
			$locale = get_locale();
		}
		require_once( ABSPATH . 'wp-admin/includes/update.php' );
		return get_core_checksums( $version, $locale );
	}

	/**
	 * @todo CACHING
	 *
	 * @param string $plugin
	 * @return array
	 */
	public static function get_plugin_versions( $plugin = 'jetpack' ) {
		$response = wp_remote_get( sprintf( 'https://api.wordpress.org/plugins/info/1.0/%s.json', esc_url( $plugin ) ) );
		$body = trim( wp_remote_retrieve_body( $response ) );
		$body = json_decode( $body, true );
		return array_keys( $body['versions'] );
	}

	/**
	 * Returns SHA-256 checksums
	 * @todo CACHING
	 *
	 * @param null $version
	 * @param string $plugin
	 * @return array
	 */
	public static function get_plugin_checksums( $version = null, $plugin = 'jetpack' ) {
		if ( empty( $version ) ) {
			$version = JETPACK__VERSION;
		}
		$url = sprintf( 'http://downloads.wordpress.org/plugin-checksums/%s/%s.json', $plugin, $version );

		if ( wp_http_supports( array( 'ssl' ) ) ) {
			$url = set_url_scheme( $url, 'https' );
		}

		$response = wp_remote_get( $url );

		$body = trim( wp_remote_retrieve_body( $response ) );
		$body = json_decode( $body, true );

		$return = array();

		foreach ( $body['files'] as $file => $hashes ) {
			if ( in_array( substr( $file, -3 ), array( 'css', '.js' ) ) ) {
				$return[ $file ] = $hashes['sha256'];
			}
		}

		return $return;
	}
}
Jetpack_Photon_Static_Assets_CDN::go();

