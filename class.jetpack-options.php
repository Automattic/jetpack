<?php

class Jetpack_Options {

	/**
	 * An array that maps a grouped option type to an option name.
	 * @var array
	 */
	private static $grouped_options = array(
		'compact' => 'jetpack_options',
		'private' => 'jetpack_private_options'
	);

	/**
	 * Returns an array of option names for a given type.
	 *
	 * @param string $type The type of option to return. Defaults to 'compact'.
	 *
	 * @return array
	 */
	public static function get_option_names( $type = 'compact' ) {
		switch ( $type ) {
		case 'non-compact' :
		case 'non_compact' :
			return array(
				'activated',
				'active_modules',
				'available_modules',
				'do_activate',
				'log',
				'publicize',
				'slideshow_background_color',
				'widget_twitter',
				'wpcc_options',
				'relatedposts',
				'file_data',
				'autoupdate_plugins',          // (array)  An array of plugin ids ( eg. jetpack/jetpack ) that should be autoupdated
				'autoupdate_plugins_translations', // (array)  An array of plugin ids ( eg. jetpack/jetpack ) that should be autoupdated translation files.
				'autoupdate_themes',           // (array)  An array of theme ids ( eg. twentyfourteen ) that should be autoupdated
				'autoupdate_themes_translations', // (array)  An array of theme ids ( eg. twentyfourteen ) that should autoupdated translation files.
				'autoupdate_core',             // (bool)   Whether or not to autoupdate core
				'autoupdate_translations',     // (bool)   Whether or not to autoupdate all translations
				'json_api_full_management',    // (bool)   Allow full management (eg. Activate, Upgrade plugins) of the site via the JSON API.
				'sync_non_public_post_stati',  // (bool)   Allow synchronisation of posts and pages with non-public status.
				'site_icon_url',               // (string) url to the full site icon
				'site_icon_id',                // (int)    Attachment id of the site icon file
				'dismissed_manage_banner',     // (bool) Dismiss Jetpack manage banner allows the user to dismiss the banner permanently
				'restapi_stats_cache',         // (array) Stats Cache data.
				'unique_connection',           // (array)  A flag to determine a unique connection to wordpress.com two values "connected" and "disconnected" with values for how many times each has occured
				'protect_whitelist',           // (array) IP Address for the Protect module to ignore
				'sync_error_idc',              // (bool|array) false or array containing the site's home and siteurl at time of IDC error
				'safe_mode_confirmed',         // (bool) True if someone confirms that this site was correctly put into safe mode automatically after an identity crisis is discovered.
				'migrate_for_idc',             // (bool) True if someone confirms that this site should migrate stats and subscribers from its previous URL
			);

		case 'private' :
			return array(
				'register',
				'authorize',
				'activate_manage',
				'blog_token',                  // (string) The Client Secret/Blog Token of this site.
				'user_token',                  // (string) The User Token of this site. (deprecated)
				'user_tokens'                  // (array)  User Tokens for each user of this site who has connected to jetpack.wordpress.com.
			);
		}

		return array(
			'id',                           // (int)    The Client ID/WP.com Blog ID of this site.
			'publicize_connections',        // (array)  An array of Publicize connections from WordPress.com
			'master_user',                  // (int)    The local User ID of the user who connected this site to jetpack.wordpress.com.
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
			'jumpstart',                    // (string) A flag for whether or not to show the Jump Start.  Accepts: new_connection, jumpstart_activated, jetpack_action_taken, jumpstart_dismissed.
			'hide_jitm',                    // (array)  A list of just in time messages that we should not show because they have been dismissed by the user
			'custom_css_4.7_migration',     // (bool)   Whether Custom CSS has scanned for and migrated any legacy CSS CPT entries to the new Core format.
		);
	}

	/**
	 * Is the option name valid?
	 *
	 * @param string      $name  The name of the option
	 * @param string|null $group The name of the group that the option is in. Default to null, which will search non_compact.
	 *
	 * @return bool Is the option name valid?
	 */
	public static function is_valid( $name, $group = null ) {
		if ( is_array( $name ) ) {
			$compact_names = array();
			foreach ( array_keys( self::$grouped_options ) as $_group ) {
				$compact_names = array_merge( $compact_names, self::get_option_names( $_group ) );
			}

			$result = array_diff( $name, self::get_option_names( 'non_compact' ), $compact_names );

			return empty( $result );
		}

		if ( is_null( $group ) || 'non_compact' === $group ) {
			if ( in_array( $name, self::get_option_names( $group ) ) ) {
				return true;
			}
		}

		foreach ( array_keys( self::$grouped_options ) as $_group ) {
			if ( is_null( $group ) || $group === $_group ) {
				if ( in_array( $name, self::get_option_names( $_group ) ) ) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Returns the requested option.  Looks in jetpack_options or jetpack_$name as appropriate.
	 *
	 * @param string $name Option name
	 * @param mixed $default (optional)
	 *
	 * @return mixed
	 */
	public static function get_option( $name, $default = false ) {
		if ( self::is_valid( $name, 'non_compact' ) ) {
			return get_option( "jetpack_$name", $default );
		}

		foreach ( array_keys( self::$grouped_options ) as $group ) {
			if ( self::is_valid( $name, $group ) ) {
				return self::get_grouped_option( $group, $name, $default );
			}
		}

		trigger_error( sprintf( 'Invalid Jetpack option name: %s', $name ), E_USER_WARNING );

		return $default;
	}

	/**
	 * Returns the requested option, and ensures it's autoloaded in the future.
	 * This does _not_ adjust the prefix in any way (does not prefix jetpack_%)
	 *
	 * @param string $name Option name
	 * @param mixed $default (optional)
	 *
	 * @return mixed|void
	 */
	public static function get_option_and_ensure_autoload( $name, $default ) {
		$value = get_option( $name );

		if ( $value === false && $default !== false ) {
			update_option( $name, $default );
			$value = $default;
		}

		return $value;
	}

	private static function update_grouped_option( $group, $name, $value ) {
		$options = get_option( self::$grouped_options[ $group ] );
		if ( ! is_array( $options ) ) {
			$options = array();
		}
		$options[ $name ] = $value;

		return update_option( self::$grouped_options[ $group ], $options );
	}

	/**
	 * Updates the single given option.  Updates jetpack_options or jetpack_$name as appropriate.
	 *
	 * @param string $name Option name
	 * @param mixed $value Option value
	 * @param string $autoload If not compact option, allows specifying whether to autoload or not.
	 *
	 * @return bool Was the option successfully updated?
	 */
	public static function update_option( $name, $value, $autoload = null ) {
		/**
		 * Fires before Jetpack updates a specific option.
		 *
		 * @since 3.0.0
		 *
		 * @param str $name The name of the option being updated.
		 * @param mixed $value The new value of the option.
		 */
		do_action( 'pre_update_jetpack_option_' . $name, $name, $value );
		if ( self::is_valid( $name, 'non_compact' ) ) {
			return update_option( "jetpack_$name", $value, $autoload );
		}

		foreach ( array_keys( self::$grouped_options ) as $group ) {
			if ( self::is_valid( $name, $group ) ) {
				return self::update_grouped_option( $group, $name, $value );
			}
		}

		trigger_error( sprintf( 'Invalid Jetpack option name: %s', $name ), E_USER_WARNING );

		return false;
	}

	/**
	 * Updates the multiple given options.  Updates jetpack_options and/or jetpack_$name as appropriate.
	 *
	 * @param array $array array( option name => option value, ... )
	 */
	public static function update_options( $array ) {
		$names = array_keys( $array );

		foreach ( array_diff( $names, self::get_option_names(), self::get_option_names( 'non_compact' ), self::get_option_names( 'private' ) ) as $unknown_name ) {
			trigger_error( sprintf( 'Invalid Jetpack option name: %s', $unknown_name ), E_USER_WARNING );
			unset( $array[ $unknown_name ] );
		}

		foreach ( $names as $name ) {
			self::update_option( $name, $array[ $name ] );
		}
	}

	/**
	 * Deletes the given option.  May be passed multiple option names as an array.
	 * Updates jetpack_options and/or deletes jetpack_$name as appropriate.
	 *
	 * @param string|array $names
	 *
	 * @return bool Was the option successfully deleted?
	 */
	public static function delete_option( $names ) {
		$result = true;
		$names  = (array) $names;

		if ( ! self::is_valid( $names ) ) {
			trigger_error( sprintf( 'Invalid Jetpack option names: %s', print_r( $names, 1 ) ), E_USER_WARNING );
			return false;
		}

		foreach ( array_intersect( $names, self::get_option_names( 'non_compact' ) ) as $name ) {
			if ( ! delete_option( "jetpack_$name" ) ) {
				$result = false;
			}
		}

		foreach ( array_keys( self::$grouped_options ) as $group ) {
			if ( ! self::delete_grouped_option( $group, $names ) ) {
				$result = false;
			}
		}

		return $result;
	}

	private static function get_grouped_option( $group, $name, $default ) {
		$options = get_option( self::$grouped_options[ $group ] );
		if ( is_array( $options ) && isset( $options[ $name ] ) ) {
			return $options[ $name ];
		}

		return $default;
	}

	private static function delete_grouped_option( $group, $names ) {
		$options = get_option( self::$grouped_options[ $group ], array() );

		$to_delete = array_intersect( $names, self::get_option_names( $group ), array_keys( $options ) );
		if ( $to_delete ) {
			foreach ( $to_delete as $name ) {
				unset( $options[ $name ] );
			}

			return update_option( self::$grouped_options[ $group ], $options );
		}

		return true;
	}

}
