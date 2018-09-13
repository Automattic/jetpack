<?php
/**
 * Module Name: Photon CDN
 * Module Description: Serve static assets from our servers
 * Sort Order: 26
 * Recommendation Order: 1
 * First Introduced: 6.6
 * Requires Connection: No
 * Auto Activate: No
 * Module Tags: Photos and Videos, Appearance, Recommended
 * Feature: Recommended, Appearance
 * Additional Search Queries: photon, image, cdn, performance, speed, assets
 */

Jetpack::dns_prefetch( array(
	'//c0.wp.com',
) );

class Jetpack_Photon_Static_Assets_CDN {
	const CDN = 'https://c0.wp.com/';

	public static function go() {
		add_action( 'wp_print_scripts', array( __CLASS__, 'cdnize_assets' ) );
		add_action( 'wp_print_styles',  array( __CLASS__, 'cdnize_assets' ) );
		add_action( 'wp_footer',        array( __CLASS__, 'cdnize_assets' ) );
	}

	public static function cdnize_assets() {
		global $wp_scripts, $wp_styles, $wp_version;

		$known_core_files = self::get_core_assets();

		if ( ! empty( $known_core_files ) && is_array( $known_core_files ) ) {
			$site_url = trailingslashit( site_url() );
			foreach ( $wp_scripts->registered as $handle => $thing ) {
				if ( wp_startswith( $thing->src, self::CDN ) ) {
					continue;
				}
				$src = ltrim( str_replace( $site_url, '', $thing->src ), '/' );
				if ( in_array( $src, $known_core_files ) ) {
					$wp_scripts->registered[ $handle ]->src = sprintf(self::CDN . 'c/%1$s/%2$s', $wp_version, $src );
					$wp_scripts->registered[ $handle ]->ver = null;
				}
			}
			foreach ( $wp_styles->registered as $handle => $thing ) {
				if ( wp_startswith( $thing->src, self::CDN ) ) {
					continue;
				}
				$src = ltrim( str_replace( $site_url, '', $thing->src ), '/' );
				if ( in_array( $src, $known_core_files ) ) {
					$wp_styles->registered[ $handle ]->src = sprintf(self::CDN . 'c/%1$s/%2$s', $wp_version, $src );
					$wp_styles->registered[ $handle ]->ver = null;
				}
			}
		}

		self::cdnize_plugin_assets( 'jetpack', JETPACK__VERSION );
	}

	public static function cdnize_plugin_assets( $plugin_slug, $current_version ) {
		global $wp_scripts, $wp_styles;

		/**
		 * Filters Jetpack CDN's plugin slug and version number. Can be used to override the values
		 * that Jetpack uses to retrieve assets. For example, when testing a development version of Jetpack
		 * the assets are not yet published, so you may need to override the version value to either
		 * trunk, or the latest available version. Expects the values to be returned in an array.
		 *
		 * @since 6.6
		 *
		 * @param array $values array( $slug = the plugin repository slug, i.e. jetpack, $version = the plugin version, i.e. 6.6 )
		 */
		list( $plugin_slug, $current_version ) = apply_filters(
			'jetpack_cdn_plugin_slug_and_version',
			array( $plugin_slug, $current_version )
		);

		$assets = self::get_plugin_assets( $plugin_slug, $current_version );
		$plugin_directory_url = plugins_url() . '/' . $plugin_slug . '/';

		if ( is_wp_error( $assets ) ) {
			return false;
		}

		foreach ( $wp_scripts->registered as $handle => $thing ) {
			if ( wp_startswith( $thing->src, self::CDN ) ) {
				continue;
			}
			if ( wp_startswith( $thing->src, $plugin_directory_url ) ) {
				$local_path = substr( $thing->src, strlen( $plugin_directory_url ) );
				if ( in_array( $local_path, $assets ) ) {
					$wp_scripts->registered[ $handle ]->src = sprintf(self::CDN . 'p/%1$s/%2$s/%3$s', $plugin_slug, $current_version, $local_path );
					$wp_scripts->registered[ $handle ]->ver = null;
				}
			}
		}
		foreach ( $wp_styles->registered as $handle => $thing ) {
			if ( wp_startswith( $thing->src, self::CDN ) ) {
				continue;
			}
			if ( wp_startswith( $thing->src, $plugin_directory_url ) ) {
				$local_path = substr( $thing->src, strlen( $plugin_directory_url ) );
				if ( in_array( $local_path, $assets ) ) {
					$wp_styles->registered[ $handle ]->src = sprintf(self::CDN . 'p/%1$s/%2$s/%3$s', $plugin_slug, $current_version, $local_path );
					$wp_styles->registered[ $handle ]->ver = null;
				}
			}
		}
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

		/**
		 * Filters Jetpack CDN's Core version number and locale. Can be used to override the values
		 * that Jetpack uses to retrieve assets. Expects the values to be returned in an array.
		 *
		 * @since 6.6
		 *
		 * @param array $values array( $version  = core assets version, i.e. 4.9.1, $locale = desired locale )
		 */
		list( $version, $locale ) = apply_filters(
			'jetpack_cdn_plugin_slug_and_version',
			array( $version, $locale )
		);

		$cache = Jetpack_Options::get_option( 'static_asset_cdn_files', array() );
		if ( isset( $cache['core'][ $version ][ $locale ] ) ) {
			return $cache['core'][ $version ][ $locale ];
		}

		require_once( ABSPATH . 'wp-admin/includes/update.php' );
		$checksums = get_core_checksums( $version, $locale );

		if ( empty( $checksums ) ) {
			return false;
		}

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
		if ( 'jetpack' === $plugin && JETPACK__VERSION === $version ) {
			include( JETPACK__PLUGIN_DIR . 'modules/photon-cdn/jetpack-manifest.php' );
			return $assets;
		}

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

	public static function is_public_version( $version, $include_beta_and_rc = false ) {
		if ( preg_match( '/^\d+(\.\d+)+$/', $version ) ) {
			// matches `1` `1.2` `1.2.3`
			return true;
		} elseif ( $include_beta_and_rc && preg_match( '/^\d+(\.\d+)+(-(beta|rc)\d?)$/i', $version ) ) {
			// matches `1.2.3` `1.2.3-beta` `1.2.3-beta1` `1.2.3-rc` `1.2.3-rc2`
			return true;
		}
		// unrecognized version
		return false;
	}
}
Jetpack_Photon_Static_Assets_CDN::go();
