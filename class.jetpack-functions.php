<?php

/**
 * Class Jetpack_Constants
 * This class is not meant to be used directly
 * but the Jetpack class inherits from it for clarity's sanitize_key
 *
 * If you need to use any of the methods here just use them likes
 * Jetpack::method_name() for using it statically.
 * Jetpack::init()->method_name() for using it from an instance.
 */
abstract class Jetpack_Functions {

	public static function admin_url( $args = null ) {
		$args = wp_parse_args( $args, array( 'page' => 'jetpack' ) );
		$url = add_query_arg( $args, admin_url( 'admin.php' ) );
		return $url;
	}

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

	/*
	 * Strip http:// or https:// from a url, replaces forward slash with ::,
	 * so we can bring them directly to their site in calypso.
	 *
	 * @param string | url
	 * @return string | url without the guff
	 */
	public static function build_raw_urls( $url ) {
		$strip_http = '/.*?:\/\//i';
		$url = preg_replace( $strip_http, '', $url  );
		$url = str_replace( '/', '::', $url );
		return $url;
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
	 * Gets current user IP address.
	 *
	 * @param  bool $check_all_headers Check all headers? Default is `false`.
	 *
	 * @return string                  Current user IP address.
	 */
	public static function current_user_ip( $check_all_headers = false ) {
		if ( $check_all_headers ) {
			foreach ( array(
				'HTTP_CF_CONNECTING_IP',
				'HTTP_CLIENT_IP',
				'HTTP_X_FORWARDED_FOR',
				'HTTP_X_FORWARDED',
				'HTTP_X_CLUSTER_CLIENT_IP',
				'HTTP_FORWARDED_FOR',
				'HTTP_FORWARDED',
				'HTTP_VIA',
			) as $key ) {
				if ( ! empty( $_SERVER[ $key ] ) ) {
					return $_SERVER[ $key ];
				}
			}
		}

		return ! empty( $_SERVER['REMOTE_ADDR'] ) ? $_SERVER['REMOTE_ADDR'] : '';
	}

	function current_user_is_connection_owner() {
		$user_token = Jetpack_Data::get_access_token( JETPACK_MASTER_USER );
		return $user_token && is_object( $user_token ) && isset( $user_token->external_user_id ) && get_current_user_id() === $user_token->external_user_id;
	}

	/**
	 * Determines whether the current theme supports featured images or not.
	 * @return string ( '1' | '0' )
	 */
	public static function featured_images_enabled() {
		_deprecated_function( __METHOD__, 'jetpack-4.2' );
		return current_theme_supports( 'post-thumbnails' ) ? '1' : '0';
	}

	/**
	 * Gets all plugins currently active in values, regardless of whether they're
	 * traditionally activated or network activated.
	 *
	 * @todo Store the result in core's object cache maybe?
	 */
	public static function get_active_plugins() {
		$active_plugins = (array) get_option( 'active_plugins', array() );

		if ( is_multisite() ) {
			// Due to legacy code, active_sitewide_plugins stores them in the keys,
			// whereas active_plugins stores them in the values.
			$network_plugins = array_keys( get_site_option( 'active_sitewide_plugins', array() ) );
			if ( $network_plugins ) {
				$active_plugins = array_merge( $active_plugins, $network_plugins );
			}
		}

		sort( $active_plugins );

		return array_unique( $active_plugins );
	}

	/**
	 * Wrapper for core's get_avatar_url().  This one is deprecated.
	 *
	 * @deprecated 4.7 use get_avatar_url instead.
	 * @param int|string|object $id_or_email A user ID,  email address, or comment object
	 * @param int $size Size of the avatar image
	 * @param string $default URL to a default image to use if no avatar is available
	 * @param bool $force_display Whether to force it to return an avatar even if show_avatars is disabled
	 *
	 * @return array
	 */
	public static function get_avatar_url( $id_or_email, $size = 96, $default = '', $force_display = false ) {
		_deprecated_function( __METHOD__, 'jetpack-4.7', 'get_avatar_url' );
		return get_avatar_url( $id_or_email, array(
			'size' => $size,
			'default' => $default,
			'force_default' => $force_display,
		) );
	}

	/**
	 * Get the wpcom email of the current|specified connected user.
	 */
	public static function get_connected_user_email( $user_id = null ) {
		if ( ! $user_id ) {
			$user_id = get_current_user_id();
		}
		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client( array(
			'user_id' => $user_id,
		) );
		$xml->query( 'wpcom.getUserEmail' );
		if ( ! $xml->isError() ) {
			return $xml->getResponse();
		}
		return false;
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
	 * Return string containing the Jetpack logo.
	 *
	 * @since 3.9.0
	 *
	 * @return string
	 */
	public static function get_jp_emblem() {
		return '<svg id="jetpack-logo__icon" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 32 32"><path fill="#00BE28" d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16c8.8,0,16-7.2,16-16S24.8,0,16,0z M15.2,18.7h-8l8-15.5V18.7z M16.8,28.8 V13.3h8L16.8,28.8z"/></svg>';
	}

	/*
	 * This method is used to organize all options that can be reset
	 * without disconnecting Jetpack.
	 *
	 * It is used in class.jetpack-cli.php to reset options
	 *
	 * @since 5.4.0 Logic moved to Jetpack_Options class. Method left in Jetpack class for backwards compat.
	 *
	 * @return array of options to delete.
	 */
	public static function get_jetpack_options_for_reset() {
		return Jetpack_Options::get_options_for_reset();
	}

	/**
	 * Get the locale.
	 *
	 * @return string|bool
	 */
	function get_locale() {
		$locale = $this->guess_locale_from_lang( get_locale() );

		if ( ! $locale ) {
			$locale = 'en_US';
		}

		return $locale;
	}

	/**
	 * Get the wpcom email of the master user.
	 */
	public static function get_master_user_email() {
		$master_user_id = Jetpack_Options::get_option( 'master_user' );
		if ( $master_user_id ) {
			return Jetpack::get_connected_user_email( $master_user_id );
		}
		return '';
	}

	/**
	 * Builds the timeout limit for queries talking with the wpcom servers.
	 *
	 * Based on local php max_execution_time in php.ini
	 *
	 * @since 5.4
	 * @return int
	 **/
	public static function get_max_execution_time() {
		$timeout = (int) ini_get( 'max_execution_time' );

		// Ensure exec time set in php.ini
		if ( ! $timeout ) {
			$timeout = 30;
		}
		return $timeout;
	}

	/**
	 * Gets and parses additional plugin data to send with the heartbeat data
	 *
	 * @since 3.8.1
	 *
	 * @return array Array of plugin data
	 */
	public static function get_parsed_plugin_data() {
		if ( ! function_exists( 'get_plugins' ) ) {
			require_once( ABSPATH . 'wp-admin/includes/plugin.php' );
		}
		/** This filter is documented in wp-admin/includes/class-wp-plugins-list-table.php */
		$all_plugins    = apply_filters( 'all_plugins', get_plugins() );
		$active_plugins = Jetpack::get_active_plugins();

		$plugins = array();
		foreach ( $all_plugins as $path => $plugin_data ) {
			$plugins[ $path ] = array(
					'is_active' => in_array( $path, $active_plugins ),
					'file'      => $path,
					'name'      => $plugin_data['Name'],
					'version'   => $plugin_data['Version'],
					'author'    => $plugin_data['Author'],
			);
		}

		return $plugins;
	}

	/**
	 * Gets and parses theme data to send with the heartbeat data
	 *
	 * @since 3.8.1
	 *
	 * @return array Array of theme data
	 */
	public static function get_parsed_theme_data() {
		$all_themes = wp_get_themes( array( 'allowed' => true ) );
		$header_keys = array( 'Name', 'Author', 'Version', 'ThemeURI', 'AuthorURI', 'Status', 'Tags' );

		$themes = array();
		foreach ( $all_themes as $slug => $theme_data ) {
			$theme_headers = array();
			foreach ( $header_keys as $header_key ) {
				$theme_headers[ $header_key ] = $theme_data->get( $header_key );
			}

			$themes[ $slug ] = array(
					'is_active_theme' => $slug == wp_get_theme()->get_template(),
					'slug' => $slug,
					'theme_root' => $theme_data->get_theme_root_uri(),
					'parent' => $theme_data->parent(),
					'headers' => $theme_headers
			);
		}

		return $themes;
	}

	/**
	 * Guess locale from language code.
	 *
	 * @param string $lang Language code.
	 * @return string|bool
	 */
	function guess_locale_from_lang( $lang ) {
		if ( 'en' === $lang || 'en_US' === $lang || ! $lang ) {
			return 'en_US';
		}

		if ( ! class_exists( 'GP_Locales' ) ) {
			if ( ! defined( 'JETPACK__GLOTPRESS_LOCALES_PATH' ) || ! file_exists( JETPACK__GLOTPRESS_LOCALES_PATH ) ) {
				return false;
			}

			require JETPACK__GLOTPRESS_LOCALES_PATH;
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			// WP.com: get_locale() returns 'it'
			$locale = GP_Locales::by_slug( $lang );
		} else {
			// Jetpack: get_locale() returns 'it_IT';
			$locale = GP_Locales::by_field( 'facebook_locale', $lang );
		}

		if ( ! $locale ) {
			return false;
		}

		if ( empty( $locale->facebook_locale ) ) {
			if ( empty( $locale->wp_locale ) ) {
				return false;
			} else {
				// Facebook SDK is smart enough to fall back to en_US if a
				// locale isn't supported. Since supported Facebook locales
				// can fall out of sync, we'll attempt to use the known
				// wp_locale value and rely on said fallback.
				return $locale->wp_locale;
			}
		}

		return $locale->facebook_locale;
	}

	private static function get_site_user_count() {
		global $wpdb;

		if ( function_exists( 'wp_is_large_network' ) ) {
			if ( wp_is_large_network( 'users' ) ) {
				return -1; // Not a real value but should tell us that we are dealing with a large network.
			}
		}
		if ( false === ( $user_count = get_transient( 'jetpack_site_user_count' ) ) ) {
			// It wasn't there, so regenerate the data and save the transient
			$user_count = $wpdb->get_var( "SELECT COUNT(*) FROM $wpdb->usermeta WHERE meta_key = '{$wpdb->prefix}capabilities'" );
			set_transient( 'jetpack_site_user_count', $user_count, DAY_IN_SECONDS );
		}
		return $user_count;
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
	 * Implemented since there is no core is multi network function
	 * Right now there is no way to tell if we which network is the dominant network on the system
	 *
	 * @since  3.3
	 * @return boolean
	 */
	public static function is_multi_network() {
		global  $wpdb;

		// if we don't have a multi site setup no need to do any more
		if ( ! is_multisite() ) {
			return false;
		}

		$num_sites = $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->site}" );
		if ( $num_sites > 1 ) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Return true if we are with multi-site or multi-network false if we are dealing with single site.
	 *
	 * @param  string  $option
	 * @return boolean
	 */
	public function is_multisite( $option ) {
		return (string) (bool) is_multisite();
	}

	/**
	 * Checks whether a specific plugin is active.
	 *
	 * We don't want to store these in a static variable, in case
	 * there are switch_to_blog() calls involved.
	 */
	public static function is_plugin_active( $plugin = 'jetpack/jetpack.php' ) {
		return in_array( $plugin, Jetpack::get_active_plugins() );
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
	 * Get back if the current site is single user site.
	 *
	 * @return bool
	 */
	public static function is_single_user_site() {
		global $wpdb;

		if ( false === ( $some_users = get_transient( 'jetpack_is_single_user' ) ) ) {
			$some_users = $wpdb->get_var( "SELECT COUNT(*) FROM (SELECT user_id FROM $wpdb->usermeta WHERE meta_key = '{$wpdb->prefix}capabilities' LIMIT 2) AS someusers" );
			set_transient( 'jetpack_is_single_user', (int) $some_users, 12 * HOUR_IN_SECONDS );
		}
		return 1 === (int) $some_users;
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
	 * Finds out if a site is using a version control system.
	 * @return string ( '1' | '0' )
	 **/
	public static function is_version_controlled() {
		_deprecated_function( __METHOD__, 'jetpack-4.2', 'Jetpack_Sync_Functions::is_version_controlled' );
		return (string) (int) Jetpack_Sync_Functions::is_version_controlled();
	}

	/**
	 * Return the network_site_url so that .com knows what network this site is a part of.
	 * @param  bool $option
	 * @return string
	 */
	public function jetpack_main_network_site_option( $option ) {
		return network_site_url();
	}

	/**
	 * Checks whether or not TOS has been agreed upon.
	 * Will return true if a user has clicked to register, or is already connected.
	 */
	public static function jetpack_tos_agreed() {
		return Jetpack_Options::get_option( 'tos_agreed' ) || Jetpack::is_active();
	}

	/**
	 * Loads a view file from the views
	 *
	 * Data passed in with the $data parameter will be available in the
	 * template file as $data['value']
	 *
	 * @param string $template - Template file to load
	 * @param array $data - Any data to pass along to the template
	 * @return boolean - If template file was found
	 **/
	public function load_view( $template, $data = array() ) {
		$views_dir = JETPACK__PLUGIN_DIR . 'views/';

		if( file_exists( $views_dir . $template ) ) {
			require_once( $views_dir . $template );
			return true;
		}

		error_log( "Jetpack: Unable to find view file $views_dir$template" );
		return false;
	}

	/**
	 * Network Name.
	 */
	static function network_name( $option = null ) {
		global $current_site;
		return $current_site->site_name;
	}
	/**
	 * Does the network allow new user and site registrations.
	 * @return string
	 */
	static function network_allow_new_registrations( $option = null ) {
		return ( in_array( get_site_option( 'registration' ), array('none', 'user', 'blog', 'all' ) ) ? get_site_option( 'registration') : 'none' );
	}
	/**
	 * Does the network allow admins to add new users.
	 * @return boolian
	 */
	static function network_add_new_users( $option = null ) {
		return (bool) get_site_option( 'add_new_users' );
	}
	/**
	 * File upload psace left per site in MB.
	 *  -1 means NO LIMIT.
	 * @return number
	 */
	static function network_site_upload_space( $option = null ) {
		// value in MB
		return ( get_site_option( 'upload_space_check_disabled' ) ? -1 : get_space_allowed() );
	}

	/**
	 * Network allowed file types.
	 * @return string
	 */
	static function network_upload_file_types( $option = null ) {
		return get_site_option( 'upload_filetypes', 'jpg jpeg png gif' );
	}

	/**
	 * Maximum file upload size set by the network.
	 * @return number
	 */
	static function network_max_upload_file_size( $option = null ) {
		// value in KB
		return get_site_option( 'fileupload_maxk', 300 );
	}

	/**
	 * Lets us know if a site allows admins to manage the network.
	 * @return array
	 */
	static function network_enable_administration_menus( $option = null ) {
		return get_site_option( 'menu_items' );
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
	 * Sets a minimum request timeout, and returns the current timeout
	 *
	 * @since 5.4
	 **/
	public static function set_min_time_limit( $min_timeout ) {
		$timeout = Jetpack::get_max_execution_time();
		if ( $timeout < $min_timeout ) {
			$timeout = $min_timeout;
			set_time_limit( $timeout );
		}
		return $timeout;
	}

	public static function staticize_subdomain( $url ) {

		// Extract hostname from URL
		$host = parse_url( $url, PHP_URL_HOST );

		// Explode hostname on '.'
		$exploded_host = explode( '.', $host );

		// Retrieve the name and TLD
		if ( count( $exploded_host ) > 1 ) {
			$name = $exploded_host[ count( $exploded_host ) - 2 ];
			$tld = $exploded_host[ count( $exploded_host ) - 1 ];
			// Rebuild domain excluding subdomains
			$domain = $name . '.' . $tld;
		} else {
			$domain = $host;
		}
		// Array of Automattic domains
		$domain_whitelist = array( 'wordpress.com', 'wp.com' );

		// Return $url if not an Automattic domain
		if ( ! in_array( $domain, $domain_whitelist ) ) {
			return $url;
		}

		if ( is_ssl() ) {
			return preg_replace( '|https?://[^/]++/|', 'https://s-ssl.wordpress.com/', $url );
		}

		srand( crc32( basename( $url ) ) );
		$static_counter = rand( 0, 2 );
		srand(); // this resets everything that relies on this, like array_rand() and shuffle()

		return preg_replace( '|://[^/]+?/|', "://s$static_counter.wp.com/", $url );
	}

	/**
	 * Returns the Jetpack XML-RPC API
	 *
	 * @return string
	 */
	public static function xmlrpc_api_url() {
		$base = preg_replace( '#(https?://[^?/]+)(/?.*)?$#', '\\1', JETPACK__API_BASE );
		return untrailingslashit( $base ) . '/xmlrpc.php';
	}
}
