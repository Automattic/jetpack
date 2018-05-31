<?php

/**
 * Class Jetpack_Constants
 * This class is not meant to be used directly
 * but the Jetpack class inherits from it for clarity's sanitize_key
 *
 * If you need to use any of the methods here just use them likes
 * Jetpack::method_name() for using it statically.
 * Jetpack::init()->method_name for using it from an instance.
 */
class Jetpack_Functions {

	/**
	 * Converts any url in a stylesheet, to the correct absolute url.
	 *
	 * Considerations:
	 *  - Normal, relative URLs     `feh.png`
	 *  - Data URLs                 `data:image/gif;base64,eh129ehiuehjdhsa==`
	 *  - Schema-agnostic URLs      `//domain.com/feh.png`
	 *  - Absolute URLs             `http://domain.com/feh.png`
	 *  - Domain root relative URLs `/feh.png`
	 *
	 * @param $css string: The raw CSS -- should be read in directly from the file.
	 * @param $css_file_url : The URL that the file can be accessed at, for calculating paths from.
	 *
	 * @return mixed|string
	 */
	public static function absolutize_css_urls( $css, $css_file_url ) {
		$pattern = '#url\((?P<path>[^)]*)\)#i';
		$css_dir = dirname( $css_file_url );
		$p       = parse_url( $css_dir );
		$domain  = sprintf(
					'%1$s//%2$s%3$s%4$s',
					isset( $p['scheme'] )           ? "{$p['scheme']}:" : '',
					isset( $p['user'], $p['pass'] ) ? "{$p['user']}:{$p['pass']}@" : '',
					$p['host'],
					isset( $p['port'] )             ? ":{$p['port']}" : ''
				);

		if ( preg_match_all( $pattern, $css, $matches, PREG_SET_ORDER ) ) {
			$find = $replace = array();
			foreach ( $matches as $match ) {
				$url = trim( $match['path'], "'\" \t" );

				// If this is a data url, we don't want to mess with it.
				if ( 'data:' === substr( $url, 0, 5 ) ) {
					continue;
				}

				// If this is an absolute or protocol-agnostic url,
				// we don't want to mess with it.
				if ( preg_match( '#^(https?:)?//#i', $url ) ) {
					continue;
				}

				switch ( substr( $url, 0, 1 ) ) {
					case '/':
						$absolute = $domain . $url;
						break;
					default:
						$absolute = $css_dir . '/' . $url;
				}

				$find[]    = $match[0];
				$replace[] = sprintf( 'url("%s")', $absolute );
			}
			$css = str_replace( $find, $replace, $css );
		}

		return $css;
	}

	/**
	 * Checks if the site is currently in an identity crisis.
	 *
	 * @return array|bool Array of options that are in a crisis, or false if everything is OK.
	 */
	public static function check_identity_crisis() {
		if ( ! Jetpack::is_active() || Jetpack::is_development_mode() || ! Jetpack::validate_sync_error_idc_option() ) {
			return false;
		}

		return Jetpack_Options::get_option( 'sync_error_idc' );
	}

	/**
	 * Get $content_width, but with a <s>twist</s> filter.
	 */
	public static function get_content_width() {
		$content_width = isset( $GLOBALS['content_width'] ) ? $GLOBALS['content_width'] : false;
		/**
		 * Filter the Content Width value.
		 *
		 * @since 2.2.3
		 *
		 * @param string $content_width Content Width value.
		 */
		return apply_filters( 'jetpack_content_width', $content_width );
	}

	/**
	 * Given a minified path, and a non-minified path, will return
	 * a minified or non-minified file URL based on whether SCRIPT_DEBUG is set and truthy.
	 *
	 * Both `$min_base` and `$non_min_base` are expected to be relative to the
	 * root Jetpack directory.
	 *
	 * @since 5.6.0
	 *
	 * @param string $min_path
	 * @param string $non_min_path
	 * @return string The URL to the file
	 */
	public static function get_file_url_for_environment( $min_path, $non_min_path ) {
		$path = ( Jetpack_Constants::is_defined( 'SCRIPT_DEBUG' ) && Jetpack_Constants::get_constant( 'SCRIPT_DEBUG' ) )
			? $non_min_path
			: $min_path;

		return plugins_url( $path, JETPACK__PLUGIN_FILE );
	}

	/**
	 * Checks if Akismet is active and working.
	 *
	 * We dropped support for Akismet 3.0 with Jetpack 6.1.1 while introducing a check for an Akismet valid key
	 * that implied usage of methods present since more recent version.
	 * See https://github.com/Automattic/jetpack/pull/9585
	 *
	 * @since  5.1.0
	 *
	 * @return bool True = Akismet available. False = Aksimet not available.
	 */
	public static function is_akismet_active() {
		if ( method_exists( 'Akismet' , 'http_post' ) ) {
			$akismet_key = Akismet::get_api_key();
			if ( ! $akismet_key ) {
				return false;
			}
			$akismet_key_state = Akismet::verify_key( $akismet_key );
			if ( 'invalid' === $akismet_key_state || 'failed' === $akismet_key_state ) {
				return false;
			}
			return true;
		}
		return false;
	}

	/**
	 * Checks for whether Jetpack Rewind is enabled.
	 * Will return true if the state of Rewind is anything except "unavailable".
	 * @return bool|int|mixed
	 */
	public static function is_rewind_enabled() {
		if ( ! Jetpack::is_active() ) {
			return false;
		}

		$rewind_enabled = get_transient( 'jetpack_rewind_enabled' );
		if ( false === $rewind_enabled ) {
			jetpack_require_lib( 'class.core-rest-api-endpoints' );
			$rewind_data = (array) Jetpack_Core_Json_Api_Endpoints::rewind_data();
			$rewind_enabled = ( ! is_wp_error( $rewind_data )
				&& ! empty( $rewind_data['state'] )
				&& 'active' === $rewind_data['state'] )
				? 1
				: 0;

			set_transient( 'jetpack_rewind_enabled', $rewind_enabled, 10 * MINUTE_IN_SECONDS );
		}
		return $rewind_enabled;
	}

	/**
	 * Checks whether the home and siteurl specifically are whitelisted
	 * Written so that we don't have re-check $key and $value params every time
	 * we want to check if this site is whitelisted, for example in footer.php
	 *
	 * @since  3.8.0
	 * @return bool True = already whitelisted False = not whitelisted
	 */
	public static function is_staging_site() {
		$is_staging = false;

		$known_staging = array(
			'urls' => array(
				'#\.staging\.wpengine\.com$#i', // WP Engine
				'#\.staging\.kinsta\.com$#i',   // Kinsta.com
				),
			'constants' => array(
				'IS_WPE_SNAPSHOT',      // WP Engine
				'KINSTA_DEV_ENV',       // Kinsta.com
				'WPSTAGECOACH_STAGING', // WP Stagecoach
				'JETPACK_STAGING_MODE', // Generic
				)
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
			foreach ( $known_staging['urls'] as $url ){
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
		if ( ! $is_staging && Jetpack::validate_sync_error_idc_option() ) {
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

	/**
	 * Checks whether or not TOS has been agreed upon.
	 * Will return true if a user has clicked to register, or is already connected.
	 */
	public static function jetpack_tos_agreed() {
		return Jetpack_Options::get_option( 'tos_agreed' ) || Jetpack::is_active();
	}

	/**
	 * Normalizes a url by doing three things:
	 *  - Strips protocol
	 *  - Strips www
	 *  - Adds a trailing slash
	 *
	 * @since 4.4.0
	 * @param string $url
	 * @return WP_Error|string
	 */
	public static function normalize_url_protocol_agnostic( $url ) {
		$parsed_url = wp_parse_url( trailingslashit( esc_url_raw( $url ) ) );
		if ( ! $parsed_url || empty( $parsed_url['host'] ) || empty( $parsed_url['path'] ) ) {
			return new WP_Error( 'cannot_parse_url', sprintf( esc_html__( 'Cannot parse URL %s', 'jetpack' ), $url ) );
		}

		// Strip www and protocols
		$url = preg_replace( '/^www\./i', '', $parsed_url['host'] . $parsed_url['path'] );
		return $url;
	}

	/**
	 * Checks whether the sync_error_idc option is valid or not, and if not, will do cleanup.
	 *
	 * @since 4.4.0
	 * @since 5.4.0 Do not call get_sync_error_idc_option() unless site is in IDC
	 *
	 * @return bool
	 */
	public static function validate_sync_error_idc_option() {
		$is_valid = false;

		$idc_allowed = get_transient( 'jetpack_idc_allowed' );
		if ( false === $idc_allowed ) {
			$response = wp_remote_get( 'https://jetpack.com/is-idc-allowed/' );
			if ( 200 === (int) wp_remote_retrieve_response_code( $response ) ) {
				$json = json_decode( wp_remote_retrieve_body( $response ) );
				$idc_allowed = isset( $json, $json->result ) && $json->result ? '1' : '0';
				$transient_duration = HOUR_IN_SECONDS;
			} else {
				// If the request failed for some reason, then assume IDC is allowed and set shorter transient.
				$idc_allowed = '1';
				$transient_duration = 5 * MINUTE_IN_SECONDS;
			}

			set_transient( 'jetpack_idc_allowed', $idc_allowed, $transient_duration );
		}

		// Is the site opted in and does the stored sync_error_idc option match what we now generate?
		$sync_error = Jetpack_Options::get_option( 'sync_error_idc' );
		if ( $idc_allowed && $sync_error && self::sync_idc_optin() ) {
			$local_options = self::get_sync_error_idc_option();
			if ( $sync_error['home'] === $local_options['home'] && $sync_error['siteurl'] === $local_options['siteurl'] ) {
				$is_valid = true;
			}
		}

		/**
		 * Filters whether the sync_error_idc option is valid.
		 *
		 * @since 4.4.0
		 *
		 * @param bool $is_valid If the sync_error_idc is valid or not.
		 */
		$is_valid = (bool) apply_filters( 'jetpack_sync_error_idc_validation', $is_valid );

		if ( ! $idc_allowed || ( ! $is_valid && $sync_error ) ) {
			// Since the option exists, and did not validate, delete it
			Jetpack_Options::delete_option( 'sync_error_idc' );
		}

		return $is_valid;
	}
}
