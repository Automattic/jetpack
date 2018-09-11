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
		require_once( ABSPATH . 'wp-admin/includes/update.php' );

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
			if ( in_array( $src, $known_core_files ) ) {
				$wp_scripts->registered[ $handle ]->src = sprintf('https://c0.wp.com/c/%1$s/%2$s', $wp_version, $src );
				$wp_scripts->registered[ $handle ]->ver = null;
			}
		}
		foreach ( $wp_styles->registered as $handle => $thing ) {
			if ( wp_startswith( $thing->src, 'https://c0.wp.com/' ) ) {
				continue;
			}
			$src = ltrim( str_replace( $site_url, '', $thing->src ), '/' );
			if ( in_array( $src, $known_core_files ) ) {
				$wp_styles->registered[ $handle ]->src = sprintf('https://c0.wp.com/c/%1$s/%2$s', $wp_version, $src );
				$wp_styles->registered[ $handle ]->ver = null;
			}
		}

		self::cdnize_plugin_assets( 'jetpack', JETPACK__VERSION );
	}

	public static function cdnize_plugin_assets( $plugin_slug, $current_version ) {
		global $wp_scripts, $wp_styles;

		$assets = self::get_plugin_assets( $plugin_slug, $current_version );
		$plugin_directory_url = plugins_url() . '/' . $plugin_slug . '/';

		if ( is_wp_error( $assets ) ) {
			return false;
		}

		foreach ( $wp_scripts->registered as $handle => $thing ) {
			if ( wp_startswith( $thing->src, 'https://c0.wp.com/' ) ) {
				continue;
			}
			if ( wp_startswith( $thing->src, $plugin_directory_url ) ) {
				$local_path = substr( $thing->src, strlen( $plugin_directory_url ) );
				if ( in_array( $local_path, $assets ) ) {
					$wp_scripts->registered[ $handle ]->src = sprintf('https://c0.wp.com/p/%1$s/%2$s/%3$s', $plugin_slug, $current_version, $local_path );
					$wp_scripts->registered[ $handle ]->ver = null;
				}
			}
		}
		foreach ( $wp_styles->registered as $handle => $thing ) {
			if ( wp_startswith( $thing->src, 'https://c0.wp.com/' ) ) {
				continue;
			}
			if ( wp_startswith( $thing->src, $plugin_directory_url ) ) {
				$local_path = substr( $thing->src, strlen( $plugin_directory_url ) );
				if ( in_array( $local_path, $assets ) ) {
					$wp_styles->registered[ $handle ]->src = sprintf('https://c0.wp.com/p/%1$s/%2$s/%3$s', $plugin_slug, $current_version, $local_path );
					$wp_styles->registered[ $handle ]->ver = null;
				}
			}
		}
	}

	public static function get_core_checksums( $version = null, $locale = null ) {
		if ( empty( $version ) ) {
			$version = $GLOBALS['wp_version'];
		}
		if ( empty( $locale ) ) {
			$locale = get_locale();
		}

		return get_core_checksums( $version, $locale );
	}

	/**
	 * Returns cdn-able assets for core.
	 *
	 * @param null $version
	 * @param null $locale
	 * @return array|bool
	 */
	public static function get_core_assets( $version = null, $locale = null ) {
		if ( empty( $version ) ) {
			$version = $GLOBALS['wp_version'];
		}
		if ( empty( $locale ) ) {
			$locale = get_locale();
		}

		$cache = Jetpack_Options::get_option( 'static_asset_cdn_files', array() );
		if ( isset( $cache['core'][ $version ][ $locale ] ) ) {
			return $cache['core'][ $version ][ $locale ];
		}

		$checksums = get_core_checksums( $version, $locale );

		$return = array_filter( array_keys( $checksums ), array( __CLASS__, 'is_js_or_css_file' ) );

		if ( ! isset( $cache['core'][ $version ] ) ) {
			$cache['core'] = array();
			$cache['core'][ $version ] = array();
		}
		$cache['core'][ $version ][ $locale ] = $return;
		Jetpack_Options::update_option( 'static_asset_cdn_files', $cache, true );

		return $return;
	}

	/**
	 * Returns cdn-able assets for a given plugin.
	 *
	 * @param string $plugin
	 * @param string $version
	 * @return array
	 */
	public static function get_plugin_assets( $plugin, $version ) {
		$cache = Jetpack_Options::get_option( 'static_asset_cdn_files', array() );
		if ( isset( $cache[ $plugin ][ $version ] ) ) {
			return $cache[ $plugin ][ $version ];
		}

		$url = sprintf( 'http://downloads.wordpress.org/plugin-checksums/%s/%s.json', $plugin, $version );

		if ( wp_http_supports( array( 'ssl' ) ) ) {
			$url = set_url_scheme( $url, 'https' );
		}

		$response = wp_remote_get( $url );

		$body = trim( wp_remote_retrieve_body( $response ) );
		$body = json_decode( $body, true );

		if( ! is_array( $body ) ) {
			return array();
		}

		$return = array_filter( array_keys( $body['files'] ), array( __CLASS__, 'is_js_or_css_file' ) );

		$cache[ $plugin ] = array();
		$cache[ $plugin ][ $version ] = $return;
		Jetpack_Options::update_option( 'static_asset_cdn_files', $cache, true );

		return $return;
	}

	public static function is_js_or_css_file( $path ) {
		return in_array( substr( $path, -3 ), array( 'css', '.js' ) );
	}
}
Jetpack_Photon_Static_Assets_CDN::go();

