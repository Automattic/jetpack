<?php

class Jetpack_Options {

	public static function get_option_names( $type = 'compact' ) {
		switch ( $type ) {
		case 'non-compact' :
		case 'non_compact' :
			return array(
				'register',
				'activated',
				'active_modules',
				'do_activate',
				'log',
				'publicize',
				'slideshow_background_color',
				'widget_twitter',
				'wpcc_options',
				'relatedposts',
			);
		}

		return array(
			'id',                           // (int)    The Client ID/WP.com Blog ID of this site.
			'blog_token',                   // (string) The Client Secret/Blog Token of this site.
			'user_token',                   // (string) The User Token of this site. (deprecated)
			'publicize_connections',        // (array)  An array of Publicize connections from WordPress.com
			'master_user',                  // (int)    The local User ID of the user who connected this site to jetpack.wordpress.com.
			'user_tokens',                  // (array)  User Tokens for each user of this site who has connected to jetpack.wordpress.com.
			'version',                      // (string) Used during upgrade procedure to auto-activate new modules. version:time
			'old_version',                  // (string) Used to determine which modules are the most recently added. previous_version:time
			'fallback_no_verify_ssl_certs', // (int)    Flag for determining if this host must skip SSL Certificate verification due to misconfigured SSL.
			'time_diff',                    // (int)    Offset between Jetpack server's clocks and this server's clocks. Jetpack Server Time = time() + (int) Jetpack_Options::get_option( 'time_diff' )
			'public',                       // (int|bool) If we think this site is public or not (1, 0), false if we haven't yet tried to figure it out.
			'videopress',                   // (array)  VideoPress options array.
			'is_network_site',              // (int|bool) If we think this site is a network or a single blog (1, 0), false if we haven't yet tried to figue it out.
			'social_links',                 // (array)  The specified links for each social networking site.
			'identity_crisis_whitelist',    // (array)  An array of options, each having an array of the values whitelisted for it.
			'gplus_authors',                // (array)  The Google+ authorship information for connected users.
			'last_heartbeat',               // (int)    The timestamp of the last heartbeat that fired.
			'sync_bulk_reindexing',         // (bool)   If a bulk reindex is currently underway.
			'json_api_full_management',     // (bool)   Allow full management (eg. Activate, Upgrade plugins) of the site via the JSON API.
		);
	}

	/**
	 * Returns the requested option.  Looks in jetpack_options or jetpack_$name as appropriate.
 	 *
	 * @param string $name    Option name
	 * @param mixed  $default (optional)
	 */
	public static function get_option( $name, $default = false ) {
		if ( in_array( $name, self::get_option_names( 'non_compact' ) ) ) {
			return get_option( "jetpack_$name" );
		} else if ( !in_array( $name, self::get_option_names() ) ) {
			trigger_error( sprintf( 'Invalid Jetpack option name: %s', $name ), E_USER_WARNING );
			return false;
		}

		$options = get_option( 'jetpack_options' );
		if ( is_array( $options ) && isset( $options[$name] ) ) {
			return $options[$name];
		}

		return $default;
	}

	/**
	 * Updates the single given option.  Updates jetpack_options or jetpack_$name as appropriate.
 	 *
	 * @param string $name  Option name
	 * @param mixed  $value Option value
	 */
	public static function update_option( $name, $value ) {
		do_action( 'pre_update_jetpack_option_' . $name, $name, $value );
		if ( in_array( $name, self::get_option_names( 'non_compact' ) ) ) {
			return update_option( "jetpack_$name", $value );
		} else if ( !in_array( $name, self::get_option_names() ) ) {
			trigger_error( sprintf( 'Invalid Jetpack option name: %s', $name ), E_USER_WARNING );
			return false;
		}

		$options = get_option( 'jetpack_options' );
		if ( !is_array( $options ) ) {
			$options = array();
		}

		$options[$name] = $value;

		return update_option( 'jetpack_options', $options );
	}

	/**
	 * Updates the multiple given options.  Updates jetpack_options and/or jetpack_$name as appropriate.
 	 *
	 * @param array $array array( option name => option value, ... )
	 */
	public static function update_options( $array ) {
		$names = array_keys( $array );

		foreach ( array_diff( $names, self::get_option_names(), self::get_option_names( 'non_compact' ) ) as $unknown_name ) {
			trigger_error( sprintf( 'Invalid Jetpack option name: %s', $unknown_name ), E_USER_WARNING );
			unset( $array[$unknown_name] );
		}

		foreach ( array_intersect( $names, self::get_option_names( 'non_compact' ) ) as $name ) {
			update_option( "jetpack_$name", $array[$name] );
			unset( $array[$name] );
		}

		$options = get_option( 'jetpack_options' );
		if ( !is_array( $options ) ) {
			$options = array();
		}

		return update_option( 'jetpack_options', array_merge( $options, $array ) );
	}

	/**
	 * Deletes the given option.  May be passed multiple option names as an array.
	 * Updates jetpack_options and/or deletes jetpack_$name as appropriate.
 	 *
	 * @param string|array $names
	 */
	public static function delete_option( $names ) {
		$names = (array) $names;

		foreach ( array_diff( $names, self::get_option_names(), self::get_option_names( 'non_compact' ) ) as $unknown_name ) {
			trigger_error( sprintf( 'Invalid Jetpack option name: %s', $unknown_name ), E_USER_WARNING );
		}

		foreach ( array_intersect( $names, self::get_option_names( 'non_compact' ) ) as $name ) {
			delete_option( "jetpack_$name" );
		}

		$options = get_option( 'jetpack_options' );
		if ( !is_array( $options ) ) {
			$options = array();
		}

		$to_delete = array_intersect( $names, self::get_option_names(), array_keys( $options ) );
		if ( $to_delete ) {
			foreach ( $to_delete as $name ) {
				unset( $options[$name] );
			}

			return update_option( 'jetpack_options', $options );
		}

		return true;
	}

}

